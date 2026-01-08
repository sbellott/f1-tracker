import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/errors/api-error";

// Types for the response
interface DriverResult {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  constructor: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

interface RaceResultPosition {
  position: number;
  driver: DriverResult;
}

interface PredictionResponse {
  userId: string;
  pseudo: string;
  avatar: string | null;
  topTen: { driverId: string; position: number }[];
  pole: string | null;
  fastestLap: string | null;
  score: number | null;
  pointsBreakdown: unknown;
}

interface NewBadge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

/**
 * GET /api/races/[raceId]/results
 * Get race results with user and opponent predictions
 */
export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ raceId: string }> }
  ) => {
    const user = await requireAuth();
    const { raceId } = await params;
    const { searchParams } = new URL(request.url);
    const opponentId = searchParams.get("opponentId");

    // Get race with results
    const race = await prisma.race.findUnique({
      where: { id: raceId },
      include: {
        circuit: true,
      },
    });

    if (!race) {
      throw ApiError.notFound("Course non trouvée");
    }

    // Parse race results from JSON
    const resultsJson = race.resultsJson as {
      positions?: string[];
      pole?: string;
      fastestLap?: string;
    } | null;

    if (!resultsJson || !resultsJson.positions) {
      throw ApiError.badRequest("Les résultats de cette course ne sont pas encore disponibles");
    }

    // Get all drivers needed for results
    const driverIds = [
      ...resultsJson.positions,
      resultsJson.pole,
      resultsJson.fastestLap,
    ].filter((id): id is string => !!id);

    const drivers = await prisma.driver.findMany({
      where: { id: { in: driverIds } },
      include: {
        constructor: true,
      },
    });

    const driverMap = new Map(drivers.map((d) => [d.id, d]));

    // Build race results
    const raceResults: RaceResultPosition[] = resultsJson.positions.map(
      (driverId, index) => {
        const driver = driverMap.get(driverId);
        return {
          position: index + 1,
          driver: {
            id: driverId,
            code: driver?.code || "???",
            firstName: driver?.firstName || "Unknown",
            lastName: driver?.lastName || "Driver",
            photoUrl: driver?.photoUrl || null,
            constructor: driver?.constructor ? {
              id: driver.constructor.id,
              name: driver.constructor.name,
              color: driver.constructor.color,
            } : null,
          },
        };
      }
    );

    // Get pole and fastest lap drivers
    const poleDriver = resultsJson.pole ? driverMap.get(resultsJson.pole) : null;
    const fastestLapDriver = resultsJson.fastestLap
      ? driverMap.get(resultsJson.fastestLap)
      : null;

    // Get user's prediction
    const userPrediction = await prisma.prediction.findFirst({
      where: { userId: user.id, raceId },
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
          },
        },
      },
    });

    // Get opponent's prediction if requested
    let opponentPrediction = null;
    if (opponentId) {
      opponentPrediction = await prisma.prediction.findFirst({
        where: { userId: opponentId, raceId },
        include: {
          user: {
            select: {
              id: true,
              pseudo: true,
              avatar: true,
            },
          },
        },
      });
    }

    // Get newly unlocked badges for this user and race
    const newBadges = await prisma.userBadge.findMany({
      where: {
        userId: user.id,
        raceId: raceId,
      },
      include: {
        badge: true,
      },
      orderBy: {
        unlockedAt: "desc",
      },
    });

    // Format predictions response
    const formatPrediction = (
      pred: typeof userPrediction
    ): PredictionResponse | null => {
      if (!pred) return null;

      // Handle topTen format - it's stored as string[] in DB
      const topTenArray = pred.topTen as string[];
      const topTenFormatted = topTenArray.map((driverId, index) => ({
        driverId,
        position: index + 1,
      }));

      return {
        userId: pred.user.id,
        pseudo: pred.user.pseudo || pred.user.id.slice(0, 8),
        avatar: pred.user.avatar,
        topTen: topTenFormatted,
        pole: pred.polePosition,
        fastestLap: pred.fastestLap,
        score: pred.points,
        pointsBreakdown: pred.pointsBreakdown,
      };
    };

    // Format badge unlock for celebration (without rarity)
    const formatBadge = (
      userBadge: (typeof newBadges)[0]
    ): NewBadge => ({
      id: userBadge.badge.id,
      code: userBadge.badge.code,
      name: userBadge.badge.name,
      description: userBadge.badge.description,
      icon: userBadge.badge.icon,
      unlockedAt: userBadge.unlockedAt,
    });

    // Get all drivers for reference (remove isActive filter)
    const allDrivers = await prisma.driver.findMany({
      where: { constructorId: { not: null } },
      include: {
        constructor: true,
      },
      orderBy: { lastName: "asc" },
    });

    return apiSuccess({
      race: {
        id: race.id,
        name: race.name,
        round: race.round,
        season: race.season,
        date: race.date,
        circuit: race.circuit,
      },
      results: raceResults,
      poleDriver: poleDriver
        ? {
            id: poleDriver.id,
            code: poleDriver.code,
            firstName: poleDriver.firstName,
            lastName: poleDriver.lastName,
            photoUrl: poleDriver.photoUrl,
            constructor: poleDriver.constructor,
          }
        : null,
      fastestLapDriver: fastestLapDriver
        ? {
            id: fastestLapDriver.id,
            code: fastestLapDriver.code,
            firstName: fastestLapDriver.firstName,
            lastName: fastestLapDriver.lastName,
            photoUrl: fastestLapDriver.photoUrl,
            constructor: fastestLapDriver.constructor,
          }
        : null,
      userPrediction: formatPrediction(userPrediction),
      opponentPrediction: formatPrediction(opponentPrediction),
      newBadges: newBadges.map(formatBadge),
      drivers: allDrivers.map((d) => ({
        id: d.id,
        code: d.code,
        firstName: d.firstName,
        lastName: d.lastName,
        photoUrl: d.photoUrl,
        constructor: d.constructor,
      })),
    });
  }
);