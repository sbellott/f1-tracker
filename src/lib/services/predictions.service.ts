import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/errors/api-error";
import { arePredictionsLocked } from "@/lib/utils/date";
import {
  calculateScore,
  type RaceResults,
  type ScoringBreakdown,
} from "./scoring.service";
import type { SessionType } from "@prisma/client";

// ============================================
// Types
// ============================================

export interface PredictionData {
  positions: string[];
  pole: string | null;
  fastestLap: string | null;
}

export interface PredictionWithDetails {
  id: string;
  userId: string;
  raceId: string;
  groupId: string | null;
  positions: string[];
  pole: string | null;
  fastestLap: string | null;
  points: number | null;
  scored: boolean;
  breakdown: ScoringBreakdown | null;
  createdAt: Date;
  updatedAt: Date;
  race: {
    id: string;
    name: string;
    round: number;
    season: number;
    date: Date;
    circuit: {
      name: string;
      country: string;
    };
  };
  drivers: Array<{
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    position: number;
  }>;
}

export interface CreatePredictionInput {
  userId: string;
  raceId: string;
  groupId?: string;
  positions: string[];
  pole?: string | null;
  fastestLap?: string | null;
}

// ============================================
// Predictions Service
// ============================================

/**
 * Create or update a prediction
 */
export async function upsertPrediction(
  input: CreatePredictionInput
): Promise<PredictionWithDetails> {
  const { userId, raceId, groupId, positions, pole, fastestLap } = input;

  // Verify race exists and predictions are not locked
  const race = await prisma.race.findUnique({
    where: { id: raceId },
    include: {
      sessions: {
        where: { type: "QUALIFYING" as SessionType },
        take: 1,
      },
    },
  });

  if (!race) {
    throw ApiError.notFound("Course non trouvée");
  }

  // Check lock time based on qualifying session
  const qualifyingSession = race.sessions[0];
  if (qualifyingSession && arePredictionsLocked(qualifyingSession.dateTime)) {
    throw ApiError.predictionLocked(
      "Les pronostics sont fermés pour cette course"
    );
  }

  // Verify group membership if groupId provided
  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      throw ApiError.forbidden("Vous n'êtes pas membre de ce groupe");
    }
  }

  // Verify all drivers exist
  const drivers = await prisma.driver.findMany({
    where: { id: { in: positions } },
    select: { id: true },
  });

  if (drivers.length !== positions.length) {
    throw ApiError.badRequest("Un ou plusieurs pilotes sont invalides");
  }

  // Check for duplicates
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    throw ApiError.badRequest(
      "Chaque pilote ne peut apparaître qu'une seule fois"
    );
  }

  // Upsert prediction
  const prediction = await prisma.prediction.upsert({
    where: groupId
      ? {
          userId_raceId_groupId: { userId, raceId, groupId },
        }
      : {
          userId_raceId_groupId: { userId, raceId, groupId: "" },
        },
    update: {
      positions,
      pole,
      fastestLap,
      updatedAt: new Date(),
    },
    create: {
      userId,
      raceId,
      groupId: groupId || null,
      positions,
      pole,
      fastestLap,
    },
    include: {
      race: {
        include: {
          circuit: {
            select: {
              name: true,
              country: true,
            },
          },
        },
      },
    },
  });

  return formatPredictionResponse(prediction);
}

/**
 * Get user's prediction for a race
 */
export async function getUserPrediction(
  userId: string,
  raceId: string,
  groupId?: string
): Promise<PredictionWithDetails | null> {
  const prediction = await prisma.prediction.findFirst({
    where: {
      userId,
      raceId,
      groupId: groupId || null,
    },
    include: {
      race: {
        include: {
          circuit: {
            select: {
              name: true,
              country: true,
            },
          },
        },
      },
    },
  });

  if (!prediction) return null;

  return formatPredictionResponse(prediction);
}

/**
 * Get all predictions for a user
 */
export async function getUserPredictions(
  userId: string,
  season?: number
): Promise<PredictionWithDetails[]> {
  const targetSeason = season || new Date().getFullYear();

  const predictions = await prisma.prediction.findMany({
    where: {
      userId,
      race: {
        season: targetSeason,
      },
    },
    include: {
      race: {
        include: {
          circuit: {
            select: {
              name: true,
              country: true,
            },
          },
        },
      },
    },
    orderBy: {
      race: { round: "desc" },
    },
  });

  return Promise.all(predictions.map(formatPredictionResponse));
}

/**
 * Get predictions for a race (all users in a group)
 */
export async function getRacePredictions(
  raceId: string,
  groupId: string
): Promise<PredictionWithDetails[]> {
  const race = await prisma.race.findUnique({
    where: { id: raceId },
    include: {
      sessions: {
        where: { type: "RACE" as SessionType },
        take: 1,
      },
    },
  });

  if (!race) {
    throw ApiError.notFound("Course non trouvée");
  }

  // Only show other predictions after race has started
  const raceSession = race.sessions[0];
  if (raceSession && !arePredictionsLocked(raceSession.dateTime)) {
    throw ApiError.forbidden(
      "Les pronostics des autres joueurs seront visibles après le début de la course"
    );
  }

  const predictions = await prisma.prediction.findMany({
    where: {
      raceId,
      groupId,
    },
    include: {
      race: {
        include: {
          circuit: {
            select: {
              name: true,
              country: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          pseudo: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      points: { sort: "desc", nulls: "last" },
    },
  });

  return Promise.all(predictions.map(formatPredictionResponse));
}

/**
 * Score predictions for a completed race
 */
export async function scorePredictions(
  raceId: string,
  results: RaceResults
): Promise<{ scored: number; totalPoints: number }> {
  // Get all unscored predictions for this race
  const predictions = await prisma.prediction.findMany({
    where: {
      raceId,
      scored: false,
    },
  });

  let scored = 0;
  let totalPoints = 0;

  for (const prediction of predictions) {
    const breakdown = calculateScore(
      {
        positions: prediction.positions,
        pole: prediction.pole,
        fastestLap: prediction.fastestLap,
      },
      results
    );

    await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        points: breakdown.totalPoints,
        breakdownJson: breakdown,
        scored: true,
      },
    });

    scored++;
    totalPoints += breakdown.totalPoints;
  }

  return { scored, totalPoints };
}

/**
 * Get user stats
 */
export async function getUserStats(
  userId: string,
  season?: number
): Promise<{
  totalPoints: number;
  predictionsCount: number;
  averagePoints: number;
  bestResult: number | null;
  perfectPredictions: number;
}> {
  const targetSeason = season || new Date().getFullYear();

  const predictions = await prisma.prediction.findMany({
    where: {
      userId,
      scored: true,
      race: {
        season: targetSeason,
      },
    },
    select: {
      points: true,
      breakdownJson: true,
    },
  });

  const totalPoints = predictions.reduce((sum, p) => sum + (p.points || 0), 0);
  const predictionsCount = predictions.length;
  const averagePoints =
    predictionsCount > 0 ? Math.round(totalPoints / predictionsCount) : 0;

  const scores = predictions.map((p) => p.points || 0);
  const bestResult = scores.length > 0 ? Math.max(...scores) : null;

  // Count perfect podium predictions
  const perfectPredictions = predictions.filter((p) => {
    const breakdown = p.breakdownJson as ScoringBreakdown | null;
    return breakdown?.podiumBonus === 50; // Exact podium bonus
  }).length;

  return {
    totalPoints,
    predictionsCount,
    averagePoints,
    bestResult,
    perfectPredictions,
  };
}

/**
 * Delete a prediction
 */
export async function deletePrediction(
  predictionId: string,
  userId: string
): Promise<void> {
  const prediction = await prisma.prediction.findUnique({
    where: { id: predictionId },
    include: {
      race: {
        include: {
          sessions: {
            where: { type: "QUALIFYING" as SessionType },
            take: 1,
          },
        },
      },
    },
  });

  if (!prediction) {
    throw ApiError.notFound("Pronostic non trouvé");
  }

  if (prediction.userId !== userId) {
    throw ApiError.forbidden("Vous ne pouvez pas supprimer ce pronostic");
  }

  // Check if predictions are locked
  const qualifyingSession = prediction.race.sessions[0];
  if (qualifyingSession && arePredictionsLocked(qualifyingSession.dateTime)) {
    throw ApiError.predictionLocked(
      "Impossible de supprimer un pronostic après la clôture"
    );
  }

  await prisma.prediction.delete({ where: { id: predictionId } });
}

// ============================================
// Helper Functions
// ============================================

async function formatPredictionResponse(
  prediction: {
    id: string;
    userId: string;
    raceId: string;
    groupId: string | null;
    positions: string[];
    pole: string | null;
    fastestLap: string | null;
    points: number | null;
    scored: boolean;
    breakdownJson: unknown;
    createdAt: Date;
    updatedAt: Date;
    race: {
      id: string;
      name: string;
      round: number;
      season: number;
      date: Date;
      circuit: {
        name: string;
        country: string;
      };
    };
  }
): Promise<PredictionWithDetails> {
  // Get driver details for positions
  const drivers = await prisma.driver.findMany({
    where: { id: { in: prediction.positions } },
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
    },
  });

  // Map drivers to their predicted positions
  const driverMap = new Map(drivers.map((d) => [d.id, d]));
  const orderedDrivers = prediction.positions.map((driverId, index) => {
    const driver = driverMap.get(driverId);
    return {
      id: driverId,
      code: driver?.code || "???",
      firstName: driver?.firstName || "Unknown",
      lastName: driver?.lastName || "Driver",
      position: index + 1,
    };
  });

  return {
    id: prediction.id,
    userId: prediction.userId,
    raceId: prediction.raceId,
    groupId: prediction.groupId,
    positions: prediction.positions,
    pole: prediction.pole,
    fastestLap: prediction.fastestLap,
    points: prediction.points,
    scored: prediction.scored,
    breakdown: prediction.breakdownJson as ScoringBreakdown | null,
    createdAt: prediction.createdAt,
    updatedAt: prediction.updatedAt,
    race: prediction.race,
    drivers: orderedDrivers,
  };
}

export default {
  upsertPrediction,
  getUserPrediction,
  getUserPredictions,
  getRacePredictions,
  scorePredictions,
  getUserStats,
  deletePrediction,
};
