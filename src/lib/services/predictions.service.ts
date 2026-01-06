import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/errors/api-error";
import { arePredictionsLocked, findLockSession, getPredictionLockTime } from "@/lib/utils/date";
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

  // Verify race exists and get all sessions to determine lock time
  const race = await prisma.race.findUnique({
    where: { id: raceId },
    include: {
      sessions: {
        select: { type: true, dateTime: true },
        orderBy: { dateTime: 'asc' },
      },
    },
  });

  if (!race) {
    throw ApiError.notFound("Course non trouvée");
  }

  // Check lock time based on qualifying/sprint qualifying session
  const lockSession = findLockSession(
    race.sessions.map(s => ({ type: s.type, dateTime: s.dateTime }))
  );
  
  if (lockSession) {
    const lockTime = getPredictionLockTime(new Date(lockSession.dateTime));
    if (new Date() >= lockTime) {
      throw ApiError.predictionLocked();
    }
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

  // Use batch function to avoid N+1 queries
  return formatPredictionsResponse(predictions as unknown as PredictionWithRace[]);
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
      "Other players' predictions will be visible after the race starts"
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

  // Use batch function to avoid N+1 queries
  return formatPredictionsResponse(predictions as unknown as PredictionWithRace[]);
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
            select: { type: true, dateTime: true },
            orderBy: { dateTime: 'asc' },
          },
        },
      },
    },
  });

  if (!prediction) {
    throw ApiError.notFound("Prediction not found");
  }

  if (prediction.userId !== userId) {
    throw ApiError.forbidden("You cannot delete this prediction");
  }

  // Check if predictions are locked using shared utility
  const lockSession = findLockSession(
    prediction.race.sessions.map(s => ({ type: s.type, dateTime: s.dateTime }))
  );
  
  if (lockSession) {
    const lockTime = getPredictionLockTime(new Date(lockSession.dateTime));
    if (new Date() >= lockTime) {
      throw ApiError.predictionLocked();
    }
  }

  await prisma.prediction.delete({ where: { id: predictionId } });
}

// ============================================
// Helper Functions
// ============================================

// Driver cache type
type DriverCache = Map<string, { id: string; code: string; firstName: string; lastName: string }>;

/**
 * Format a single prediction response (uses pre-fetched driver cache)
 */
function formatPredictionResponseWithCache(
  prediction: PredictionWithRace,
  driverCache: DriverCache
): PredictionWithDetails {
  // Map drivers to their predicted positions using cache
  const orderedDrivers = prediction.topTen.map((driverId, index) => {
    const driver = driverCache.get(driverId);
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

/**
 * Format multiple predictions efficiently (single DB query for all drivers)
 */
async function formatPredictionsResponse(
  predictions: PredictionWithRace[]
): Promise<PredictionWithDetails[]> {
  if (predictions.length === 0) return [];

  // Collect all unique driver IDs from all predictions
  const allDriverIds = new Set<string>();
  for (const prediction of predictions) {
    for (const driverId of prediction.topTen) {
      allDriverIds.add(driverId);
    }
  }

  // Single query to get all drivers
  const drivers = await (prisma.driver.findMany as Function)({
    where: { id: { in: Array.from(allDriverIds) } },
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
    },
  }) as { id: string; code: string; firstName: string; lastName: string }[];

  // Build driver cache
  const driverCache: DriverCache = new Map(drivers.map((d) => [d.id, d]));

  // Format all predictions using the cache
  return predictions.map((p) => formatPredictionResponseWithCache(p, driverCache));
}

/**
 * Format single prediction (for single-prediction endpoints)
 */
async function formatPredictionResponse(
  prediction: PredictionWithRace
): Promise<PredictionWithDetails> {
  // For single prediction, still need to fetch drivers
  const drivers = await (prisma.driver.findMany as Function)({
    where: { id: { in: prediction.topTen } },
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
    },
  }) as { id: string; code: string; firstName: string; lastName: string }[];

  const driverCache: DriverCache = new Map(drivers.map((d) => [d.id, d]));
  return formatPredictionResponseWithCache(prediction, driverCache);
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