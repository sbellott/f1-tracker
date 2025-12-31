import { prisma } from "@/lib/db/prisma";

// ============================================
// Types
// ============================================

export interface ConstructorListItem {
  id: string;
  name: string;
  nationality: string;
  drivers: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
  }[];
}

export interface ConstructorDetail extends ConstructorListItem {
  ergastId: string;
  stats: ConstructorStats;
  recentResults: ConstructorRaceResult[];
}

export interface ConstructorStats {
  currentPosition: number | null;
  currentPoints: number;
  wins: number;
}

export interface ConstructorRaceResult {
  raceId: string;
  raceName: string;
  round: number;
  totalPoints: number;
  bestPosition: number;
  driverResults: {
    driverId: string;
    driverCode: string;
    position: number;
    points: number;
  }[];
}

// ============================================
// Constructors Service
// ============================================

/**
 * Get all constructors for current season
 */
export async function getConstructors(
  season?: number
): Promise<ConstructorListItem[]> {
  const targetSeason = season || new Date().getFullYear();

  // Get constructors with standings for the season
  const standings = await prisma.standing.findMany({
    where: {
      season: targetSeason,
      type: "CONSTRUCTOR",
      constructorId: { not: null },
    },
    orderBy: [{ round: "desc" }, { position: "asc" }],
    distinct: ["constructorId"],
    include: {
      constructor: true,
    },
  });

  const constructorIds = standings
    .map((s) => s.constructorId)
    .filter(Boolean) as string[];

  // Get drivers for each constructor
  const drivers = await prisma.driver.findMany({
    where: {
      constructorId: { in: constructorIds },
    },
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
      constructorId: true,
    },
  });

  const driversByConstructor = new Map<string, typeof drivers>();
  for (const driver of drivers) {
    if (driver.constructorId) {
      const existing = driversByConstructor.get(driver.constructorId) || [];
      existing.push(driver);
      driversByConstructor.set(driver.constructorId, existing);
    }
  }

  return standings
    .filter((s) => s.constructor)
    .map((s) => ({
      id: s.constructor!.id,
      name: s.constructor!.name,
      nationality: s.constructor!.nationality,
      drivers: (driversByConstructor.get(s.constructor!.id) || []).map((d) => ({
        id: d.id,
        code: d.code,
        firstName: d.firstName,
        lastName: d.lastName,
      })),
    }));
}

/**
 * Get constructor by ID
 */
export async function getConstructorById(
  constructorId: string,
  season?: number
): Promise<ConstructorDetail | null> {
  const targetSeason = season || new Date().getFullYear();

  const constructor = await prisma.constructor.findUnique({
    where: { id: constructorId },
  });

  if (!constructor) return null;

  // Get drivers
  const drivers = await prisma.driver.findMany({
    where: { constructorId },
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
      ergastId: true,
    },
  });

  // Get current standing
  const currentStanding = await prisma.standing.findFirst({
    where: {
      season: targetSeason,
      type: "CONSTRUCTOR",
      constructorId,
    },
    orderBy: { round: "desc" },
  });

  // Get race results
  const races = await prisma.race.findMany({
    where: {
      season: targetSeason,
      resultsJson: { not: null },
    },
    orderBy: { round: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      round: true,
      resultsJson: true,
    },
  });

  const driverErgastIds = drivers.map((d) => d.ergastId);
  const recentResults: ConstructorRaceResult[] = [];

  for (const race of races) {
    const results = race.resultsJson as {
      fullResults?: Array<{
        position: number;
        driverErgastId: string;
        constructorErgastId: string;
        points: number;
      }>;
    };

    if (results.fullResults) {
      const teamResults = results.fullResults.filter((r) =>
        driverErgastIds.includes(r.driverErgastId)
      );

      if (teamResults.length > 0) {
        const totalPoints = teamResults.reduce((sum, r) => sum + r.points, 0);
        const bestPosition = Math.min(...teamResults.map((r) => r.position));

        recentResults.push({
          raceId: race.id,
          raceName: race.name,
          round: race.round,
          totalPoints,
          bestPosition,
          driverResults: teamResults.map((r) => {
            const driver = drivers.find((d) => d.ergastId === r.driverErgastId);
            return {
              driverId: driver?.id || "",
              driverCode: driver?.code || "???",
              position: r.position,
              points: r.points,
            };
          }),
        });
      }
    }
  }

  return {
    id: constructor.id,
    ergastId: constructor.ergastId,
    name: constructor.name,
    nationality: constructor.nationality,
    drivers: drivers.map((d) => ({
      id: d.id,
      code: d.code,
      firstName: d.firstName,
      lastName: d.lastName,
    })),
    stats: {
      currentPosition: currentStanding?.position || null,
      currentPoints: currentStanding?.points || 0,
      wins: currentStanding?.wins || 0,
    },
    recentResults,
  };
}

export default {
  getConstructors,
  getConstructorById,
};
