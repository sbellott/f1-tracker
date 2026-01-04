import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/errors/api-error";
import { arePredictionsLocked } from "@/lib/utils/date";
import {
  calculateScore,
  type RaceResults,
  type ScoringBreakdown,
} from "./scoring.service";
import type { SessionType, Prisma } from "@prisma/client";

// ============================================
// Types
// ============================================

export interface PredictionData {
  topTen: string[];
  polePosition: string | null;
  fastestLap: string | null;
}

export interface PredictionWithDetails {
  id: string;
  userId: string;
  raceId: string;
  topTen: string[];
  polePosition: string | null;
  fastestLap: string | null;
  points: number | null;
  breakdown: ScoringBreakdown | null;
  createdAt: Date;
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
  topTen: string[];
  polePosition?: string | null;
  fastestLap?: string | null;
}

// Helper type for prediction with race relation
interface PredictionWithRace {
  id: string;
  userId: string;
  raceId: string;
  topTen: string[];
  polePosition: string | null;
  fastestLap: string | null;
  points: number | null;
  pointsBreakdown: unknown;
  createdAt: Date;
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

// ============================================
// Predictions Service
// ============================================

/**
 * Create or update a prediction
 */
export async function upsertPrediction(
  input: CreatePredictionInput
): Promise<PredictionWithDetails> {
  const { userId, raceId, topTen, polePosition, fastestLap } = input;

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
    throw ApiError.predictionLocked();
  }

  // Verify all drivers exist
  const drivers = await (prisma.driver.findMany as Function)({
    where: { id: { in: topTen } },
    select: { id: true },
  }) as { id: string }[];

  if (drivers.length !== topTen.length) {
    throw ApiError.badRequest("Un ou plusieurs pilotes sont invalides");
  }

  // Check for duplicates
  const uniquePositions = new Set(topTen);
  if (uniquePositions.size !== topTen.length) {
    throw ApiError.badRequest(
      "Chaque pilote ne peut apparaître qu'une seule fois"
    );
  }

  // Check if prediction already exists for this user and race
  const existingPrediction = await prisma.prediction.findFirst({
    where: { userId, raceId },
  });

  let prediction: PredictionWithRace;

  if (existingPrediction) {
    // Update existing prediction
    prediction = await prisma.prediction.update({
      where: { id: existingPrediction.id },
      data: {
        topTen,
        polePosition,
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
    }) as unknown as PredictionWithRace;
  } else {
    // Create new prediction
    prediction = await prisma.prediction.create({
      data: {
        userId,
        raceId,
        topTen,
        polePosition,
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
    }) as unknown as PredictionWithRace;
  }

  return formatPredictionResponse(prediction);
}

/**
 * Get user's prediction for a race
 */
export async function getUserPrediction(
  userId: string,
  raceId: string
): Promise<PredictionWithDetails | null> {
  const prediction = await prisma.prediction.findFirst({
    where: { userId, raceId },
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

  return formatPredictionResponse(prediction as unknown as PredictionWithRace);
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

  return Promise.all(
    predictions.map((p) =>
      formatPredictionResponse(p as unknown as PredictionWithRace)
    )
  );
}

/**
 * Get predictions for a race (all users)
 */
export async function getRacePredictions(
  raceId: string
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
    where: { raceId },
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
          avatar: true,
        },
      },
    },
    orderBy: {
      points: { sort: "desc", nulls: "last" },
    },
  });

  return Promise.all(
    predictions.map((p) =>
      formatPredictionResponse(p as unknown as PredictionWithRace)
    )
  );
}

/**
 * Score predictions for a completed race
 */
export async function scorePredictions(
  raceId: string,
  results: RaceResults
): Promise<{ scored: number; totalPoints: number }> {
  // Get all unscored predictions for this race (points is null)
  const predictions = await prisma.prediction.findMany({
    where: {
      raceId,
      points: null,
    },
  });

  let scored = 0;
  let totalPoints = 0;

  for (const prediction of predictions) {
    const breakdown = calculateScore(
      {
        positions: prediction.topTen as string[],
        pole: prediction.polePosition,
        fastestLap: prediction.fastestLap,
      },
      results
    );

    await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        points: breakdown.totalPoints,
        pointsBreakdown: breakdown as unknown as Prisma.InputJsonValue,
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

  // Get scored predictions (points is not null)
  const predictions = await prisma.prediction.findMany({
    where: {
      userId,
      points: { not: null },
      race: {
        season: targetSeason,
      },
    },
    select: {
      points: true,
      pointsBreakdown: true,
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
    const breakdown = p.pointsBreakdown as ScoringBreakdown | null;
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
    throw ApiError.predictionLocked();
  }

  await prisma.prediction.delete({ where: { id: predictionId } });
}

// ============================================
// Helper Functions
// ============================================

async function formatPredictionResponse(
  prediction: PredictionWithRace
): Promise<PredictionWithDetails> {
  // Get driver details for positions - use Function casting
  const drivers = await (prisma.driver.findMany as Function)({
    where: { id: { in: prediction.topTen } },
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
    },
  }) as { id: string; code: string; firstName: string; lastName: string }[];

  // Map drivers to their predicted positions
  const driverMap = new Map(drivers.map((d) => [d.id, d]));
  const orderedDrivers = prediction.topTen.map((driverId, index) => {
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
    topTen: prediction.topTen,
    polePosition: prediction.polePosition,
    fastestLap: prediction.fastestLap,
    points: prediction.points,
    breakdown: prediction.pointsBreakdown as ScoringBreakdown | null,
    createdAt: prediction.createdAt,
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