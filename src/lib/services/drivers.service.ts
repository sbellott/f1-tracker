import { prisma } from "@/lib/db/prisma";

// ============================================
// Types
// ============================================

export interface DriverListItem {
  id: string;
  code: string;
  number: number | null;
  firstName: string;
  lastName: string;
  nationality: string;
  constructor: {
    id: string;
    name: string;
  } | null;
}

export interface DriverDetail extends DriverListItem {
  ergastId: string;
  dateOfBirth: Date | null;
  stats: DriverStats;
  recentResults: RaceResult[];
}

export interface DriverStats {
  currentPosition: number | null;
  currentPoints: number;
  wins: number;
  podiums: number;
  racesCompleted: number;
}

export interface RaceResult {
  raceId: string;
  raceName: string;
  round: number;
  position: number;
  points: number;
  grid: number;
  status: string;
}

// ============================================
// Drivers Service
// ============================================

/**
 * Get all drivers for current season
 */
export async function getDrivers(season?: number): Promise<DriverListItem[]> {
  const targetSeason = season || new Date().getFullYear();

  // Get drivers who have standings for the season
  const standings = await prisma.standing.findMany({
    where: {
      season: targetSeason,
      type: "DRIVER",
      driverId: { not: null },
    },
    orderBy: [{ round: "desc" }, { position: "asc" }],
    distinct: ["driverId"],
    include: {
      driver: {
        include: {
          constructor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return standings
    .filter((s) => s.driver)
    .map((s) => ({
      id: s.driver!.id,
      code: s.driver!.code,
      number: s.driver!.number,
      firstName: s.driver!.firstName,
      lastName: s.driver!.lastName,
      nationality: s.driver!.nationality,
      constructor: s.driver!.constructor,
    }))
    .sort((a, b) => {
      // Sort by constructor name, then by number
      if (a.constructor?.name && b.constructor?.name) {
        const teamCompare = a.constructor.name.localeCompare(b.constructor.name);
        if (teamCompare !== 0) return teamCompare;
      }
      return (a.number || 0) - (b.number || 0);
    });
}

/**
 * Get driver by ID
 */
export async function getDriverById(
  driverId: string,
  season?: number
): Promise<DriverDetail | null> {
  const targetSeason = season || new Date().getFullYear();

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      constructor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!driver) return null;

  // Get current standing
  const currentStanding = await prisma.standing.findFirst({
    where: {
      season: targetSeason,
      type: "DRIVER",
      driverId: driver.id,
    },
    orderBy: { round: "desc" },
  });

  // Get race results from resultsJson
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

  const recentResults: RaceResult[] = [];

  for (const race of races) {
    const results = race.resultsJson as {
      fullResults?: Array<{
        position: number;
        driverErgastId: string;
        points: number;
        grid: number;
        status: string;
      }>;
    };

    if (results.fullResults) {
      const driverResult = results.fullResults.find(
        (r) => r.driverErgastId === driver.ergastId
      );

      if (driverResult) {
        recentResults.push({
          raceId: race.id,
          raceName: race.name,
          round: race.round,
          position: driverResult.position,
          points: driverResult.points,
          grid: driverResult.grid,
          status: driverResult.status,
        });
      }
    }
  }

  // Calculate stats
  let podiums = 0;
  let racesCompleted = 0;

  for (const result of recentResults) {
    if (result.position <= 3) podiums++;
    if (result.status === "Finished" || result.status.includes("+")) {
      racesCompleted++;
    }
  }

  return {
    id: driver.id,
    ergastId: driver.ergastId,
    code: driver.code,
    number: driver.number,
    firstName: driver.firstName,
    lastName: driver.lastName,
    nationality: driver.nationality,
    dateOfBirth: driver.dateOfBirth,
    constructor: driver.constructor,
    stats: {
      currentPosition: currentStanding?.position || null,
      currentPoints: currentStanding?.points || 0,
      wins: currentStanding?.wins || 0,
      podiums,
      racesCompleted,
    },
    recentResults,
  };
}

/**
 * Search drivers by name
 */
export async function searchDrivers(query: string): Promise<DriverListItem[]> {
  const drivers = await prisma.driver.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      constructor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: 10,
  });

  return drivers.map((driver) => ({
    id: driver.id,
    code: driver.code,
    number: driver.number,
    firstName: driver.firstName,
    lastName: driver.lastName,
    nationality: driver.nationality,
    constructor: driver.constructor,
  }));
}

export default {
  getDrivers,
  getDriverById,
  searchDrivers,
};
