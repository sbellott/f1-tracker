import { NextRequest } from "next/server";
import { apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { ApiError } from "@/lib/errors/api-error";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import {
  getCircuitWinners,
  getCircuitStats,
  getCircuitFullResults,
  type HistoricalWinner,
  type CircuitStats,
  type FullRaceResult,
} from "@/lib/services/circuit-history.service";

interface RouteContext {
  params: Promise<{ circuitId: string }>;
}

// Cache duration: 24 hours for historical data
const CACHE_DURATION_HOURS = 24;

interface CachedHistoryResponse {
  winners: HistoricalWinner[];
  stats: CircuitStats;
  fullResults: FullRaceResult[];
  fromCache: boolean;
}

/**
 * GET /api/circuits/[circuitId]/history
 * Get circuit historical data with database caching
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, context: RouteContext) => {
    const { circuitId } = await context.params;

    // Find circuit by ID or ergastId
    const circuit = await prisma.circuit.findFirst({
      where: {
        OR: [{ id: circuitId }, { ergastId: circuitId }],
      },
    });

    if (!circuit) {
      throw ApiError.notFound("Circuit non trouvé");
    }

    const ergastId = circuit.ergastId;

    // Check for cached data in database
    const cachedHistory = await prisma.circuitHistory.findMany({
      where: { circuitId: circuit.id },
      orderBy: { season: "desc" },
      take: 10,
      include: {
        winner: true,
        winnerConstructor: true,
        pole: true,
        fastestLap: true,
      },
    });

    // Check if cache is fresh (has data synced within CACHE_DURATION_HOURS)
    const now = new Date();
    const cacheThreshold = new Date(
      now.getTime() - CACHE_DURATION_HOURS * 60 * 60 * 1000
    );
    const hasFreshCache =
      cachedHistory.length > 0 &&
      cachedHistory.some((h) => h.syncedAt && h.syncedAt > cacheThreshold);

    if (hasFreshCache && cachedHistory.length >= 5) {
      // Return cached data
      const response = transformCachedData(cachedHistory, circuit.id);
      return apiCached({ ...response, fromCache: true }, 3600); // 1 hour HTTP cache
    }

    // Fetch fresh data from Ergast API
    const [winners, stats, fullResults] = await Promise.all([
      getCircuitWinners(ergastId, 10),
      getCircuitStats(ergastId),
      getCircuitFullResults(ergastId, 5),
    ]);

    // Store in database (async, don't wait)
    storeCircuitHistory(circuit.id, fullResults).catch(console.error);

    const response: CachedHistoryResponse = {
      winners,
      stats,
      fullResults,
      fromCache: false,
    };

    return apiCached(response, 3600);
  }
);

/**
 * Transform cached database data to API response format
 */
function transformCachedData(
  cachedHistory: Array<{
    id: string;
    circuitId: string;
    season: number;
    round: number | null;
    raceName: string | null;
    raceDate: Date | null;
    winnerId: string | null;
    winnerConstructorId: string | null;
    winnerTime: string | null;
    fullResultsJson: unknown;
    syncedAt: Date;
    winner: {
      id: string;
      ergastId: string;
      code: string;
      firstName: string;
      lastName: string;
      nationality: string;
    } | null;
    winnerConstructor: {
      id: string;
      ergastId: string;
      name: string;
      nationality: string;
    } | null;
    pole: {
      id: string;
      ergastId: string;
      code: string;
      firstName: string;
      lastName: string;
      nationality: string;
    } | null;
    fastestLap: {
      id: string;
      ergastId: string;
      code: string;
      firstName: string;
      lastName: string;
      nationality: string;
    } | null;
  }>,
  circuitId: string
): Omit<CachedHistoryResponse, "fromCache"> {
  // Transform to winners format
  const winners: HistoricalWinner[] = cachedHistory
    .filter((h) => h.winner)
    .map((h) => ({
      season: h.season,
      round: h.round || 1,
      raceName: h.raceName || "",
      date: h.raceDate?.toISOString().split("T")[0] || "",
      driver: {
        driverId: h.winner!.ergastId,
        code: h.winner!.code,
        firstName: h.winner!.firstName,
        lastName: h.winner!.lastName,
        nationality: h.winner!.nationality,
      },
      constructor: {
        constructorId: h.winnerConstructor?.ergastId || "",
        name: h.winnerConstructor?.name || "",
        nationality: h.winnerConstructor?.nationality || "",
      },
      time: h.winnerTime || undefined,
      laps: 0,
      grid: 0,
    }));

  // Calculate stats from cached data
  const seasons = cachedHistory.map((h) => h.season);
  const driverWins: Record<string, { name: string; count: number }> = {};
  const constructorWins: Record<string, { name: string; count: number }> = {};

  cachedHistory.forEach((h) => {
    if (h.winner) {
      const driverName = `${h.winner.firstName} ${h.winner.lastName}`;
      if (!driverWins[h.winner.ergastId]) {
        driverWins[h.winner.ergastId] = { name: driverName, count: 0 };
      }
      driverWins[h.winner.ergastId].count++;
    }
    if (h.winnerConstructor) {
      if (!constructorWins[h.winnerConstructor.ergastId]) {
        constructorWins[h.winnerConstructor.ergastId] = {
          name: h.winnerConstructor.name,
          count: 0,
        };
      }
      constructorWins[h.winnerConstructor.ergastId].count++;
    }
  });

  const topDriver = Object.values(driverWins).sort(
    (a, b) => b.count - a.count
  )[0];
  const topConstructor = Object.values(constructorWins).sort(
    (a, b) => b.count - a.count
  )[0];

  const stats: CircuitStats = {
    totalRaces: cachedHistory.length,
    firstRace: Math.min(...seasons),
    lastRace: Math.max(...seasons),
    mostWinsDriver: topDriver
      ? { driver: topDriver.name, wins: topDriver.count }
      : null,
    mostWinsConstructor: topConstructor
      ? { constructor: topConstructor.name, wins: topConstructor.count }
      : null,
  };

  // Transform fullResultsJson back to FullRaceResult format
  const fullResults: FullRaceResult[] = cachedHistory
    .filter((h) => h.fullResultsJson)
    .map((h) => h.fullResultsJson as FullRaceResult);

  return { winners, stats, fullResults };
}

/**
 * Store circuit history in database
 */
async function storeCircuitHistory(
  circuitId: string,
  fullResults: FullRaceResult[]
): Promise<void> {
  for (const race of fullResults) {
    const winner = race.results[0];
    if (!winner) continue;

    // Find or get driver/constructor IDs
    const winnerDriver = await prisma.driver.findUnique({
      where: { ergastId: winner.driver.driverId },
    });
    const winnerConstructor = await prisma.constructor.findUnique({
      where: { ergastId: winner.constructor.constructorId },
    });

    await prisma.circuitHistory.upsert({
      where: {
        circuitId_season: {
          circuitId,
          season: race.season,
        },
      },
      create: {
        circuitId,
        season: race.season,
        round: race.round,
        raceName: race.raceName,
        raceDate: new Date(race.date),
        winnerId: winnerDriver?.id,
        winnerConstructorId: winnerConstructor?.id,
        winnerTime: winner.time,
        fullResultsJson: JSON.parse(JSON.stringify(race)) as Prisma.InputJsonValue,
        syncedAt: new Date(),
      },
      update: {
        round: race.round,
        raceName: race.raceName,
        raceDate: new Date(race.date),
        winnerId: winnerDriver?.id,
        winnerConstructorId: winnerConstructor?.id,
        winnerTime: winner.time,
        fullResultsJson: JSON.parse(JSON.stringify(race)) as Prisma.InputJsonValue,
        syncedAt: new Date(),
      },
    });
  }
}
