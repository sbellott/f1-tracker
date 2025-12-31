import { prisma } from "@/lib/db/prisma";

// ============================================
// Types
// ============================================

export interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driver: {
    id: string;
    code: string;
    number: number | null;
    firstName: string;
    lastName: string;
    nationality: string;
  };
  constructor: {
    id: string;
    name: string;
    nationality: string;
  } | null;
  previousPosition?: number;
  positionChange?: number;
}

export interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructor: {
    id: string;
    name: string;
    nationality: string;
  };
  drivers: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
  }[];
  previousPosition?: number;
  positionChange?: number;
}

export interface StandingsMetadata {
  season: number;
  round: number;
  lastUpdated: Date;
  totalRaces: number;
  completedRaces: number;
}

// ============================================
// Standings Service
// ============================================

/**
 * Get driver standings for a season
 */
export async function getDriverStandings(
  season: number = new Date().getFullYear(),
  includePositionChange: boolean = true
): Promise<{ standings: DriverStanding[]; metadata: StandingsMetadata }> {
  // Get latest standings for the season
  const standings = await prisma.standing.findMany({
    where: {
      season,
      type: "DRIVER",
      driverId: { not: null },
    },
    orderBy: [{ round: "desc" }, { position: "asc" }],
    include: {
      driver: {
        include: {
          constructor: true,
        },
      },
    },
  });

  if (standings.length === 0) {
    return {
      standings: [],
      metadata: {
        season,
        round: 0,
        lastUpdated: new Date(),
        totalRaces: await getTotalRaces(season),
        completedRaces: 0,
      },
    };
  }

  // Get the latest round
  const latestRound = standings[0].round;
  const latestStandings = standings.filter((s) => s.round === latestRound);

  // Get previous round standings for position change
  let previousStandingsMap = new Map<string, number>();
  if (includePositionChange && latestRound > 1) {
    const previousStandings = await prisma.standing.findMany({
      where: {
        season,
        round: latestRound - 1,
        type: "DRIVER",
        driverId: { not: null },
      },
      select: {
        driverId: true,
        position: true,
      },
    });
    previousStandingsMap = new Map(
      previousStandings.map((s) => [s.driverId!, s.position])
    );
  }

  const driverStandings: DriverStanding[] = latestStandings.map((standing) => {
    const previousPosition = standing.driverId
      ? previousStandingsMap.get(standing.driverId)
      : undefined;

    return {
      position: standing.position,
      points: standing.points,
      wins: standing.wins,
      driver: {
        id: standing.driver!.id,
        code: standing.driver!.code,
        number: standing.driver!.number,
        firstName: standing.driver!.firstName,
        lastName: standing.driver!.lastName,
        nationality: standing.driver!.nationality,
      },
      constructor: standing.driver!.constructor
        ? {
            id: standing.driver!.constructor.id,
            name: standing.driver!.constructor.name,
            nationality: standing.driver!.constructor.nationality,
          }
        : null,
      previousPosition,
      positionChange: previousPosition
        ? previousPosition - standing.position
        : undefined,
    };
  });

  return {
    standings: driverStandings.sort((a, b) => a.position - b.position),
    metadata: {
      season,
      round: latestRound,
      lastUpdated: new Date(),
      totalRaces: await getTotalRaces(season),
      completedRaces: latestRound,
    },
  };
}

/**
 * Get constructor standings for a season
 */
export async function getConstructorStandings(
  season: number = new Date().getFullYear(),
  includePositionChange: boolean = true
): Promise<{
  standings: ConstructorStanding[];
  metadata: StandingsMetadata;
}> {
  // Get latest standings for the season
  const standings = await prisma.standing.findMany({
    where: {
      season,
      type: "CONSTRUCTOR",
      constructorId: { not: null },
    },
    orderBy: [{ round: "desc" }, { position: "asc" }],
    include: {
      constructor: true,
    },
  });

  if (standings.length === 0) {
    return {
      standings: [],
      metadata: {
        season,
        round: 0,
        lastUpdated: new Date(),
        totalRaces: await getTotalRaces(season),
        completedRaces: 0,
      },
    };
  }

  // Get the latest round
  const latestRound = standings[0].round;
  const latestStandings = standings.filter((s) => s.round === latestRound);

  // Get previous round standings for position change
  let previousStandingsMap = new Map<string, number>();
  if (includePositionChange && latestRound > 1) {
    const previousStandings = await prisma.standing.findMany({
      where: {
        season,
        round: latestRound - 1,
        type: "CONSTRUCTOR",
        constructorId: { not: null },
      },
      select: {
        constructorId: true,
        position: true,
      },
    });
    previousStandingsMap = new Map(
      previousStandings.map((s) => [s.constructorId!, s.position])
    );
  }

  // Get drivers for each constructor
  const constructorIds = latestStandings
    .map((s) => s.constructorId)
    .filter(Boolean) as string[];

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

  const constructorStandings: ConstructorStanding[] = latestStandings.map(
    (standing) => {
      const previousPosition = standing.constructorId
        ? previousStandingsMap.get(standing.constructorId)
        : undefined;

      const teamDrivers = standing.constructorId
        ? driversByConstructor.get(standing.constructorId) || []
        : [];

      return {
        position: standing.position,
        points: standing.points,
        wins: standing.wins,
        constructor: {
          id: standing.constructor!.id,
          name: standing.constructor!.name,
          nationality: standing.constructor!.nationality,
        },
        drivers: teamDrivers.map((d) => ({
          id: d.id,
          code: d.code,
          firstName: d.firstName,
          lastName: d.lastName,
        })),
        previousPosition,
        positionChange: previousPosition
          ? previousPosition - standing.position
          : undefined,
      };
    }
  );

  return {
    standings: constructorStandings.sort((a, b) => a.position - b.position),
    metadata: {
      season,
      round: latestRound,
      lastUpdated: new Date(),
      totalRaces: await getTotalRaces(season),
      completedRaces: latestRound,
    },
  };
}

/**
 * Get standings after a specific round
 */
export async function getStandingsAfterRound(
  season: number,
  round: number
): Promise<{
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
}> {
  const [driverStandings, constructorStandings] = await Promise.all([
    prisma.standing.findMany({
      where: {
        season,
        round,
        type: "DRIVER",
        driverId: { not: null },
      },
      orderBy: { position: "asc" },
      include: {
        driver: {
          include: {
            constructor: true,
          },
        },
      },
    }),
    prisma.standing.findMany({
      where: {
        season,
        round,
        type: "CONSTRUCTOR",
        constructorId: { not: null },
      },
      orderBy: { position: "asc" },
      include: {
        constructor: true,
      },
    }),
  ]);

  return {
    drivers: driverStandings.map((standing) => ({
      position: standing.position,
      points: standing.points,
      wins: standing.wins,
      driver: {
        id: standing.driver!.id,
        code: standing.driver!.code,
        number: standing.driver!.number,
        firstName: standing.driver!.firstName,
        lastName: standing.driver!.lastName,
        nationality: standing.driver!.nationality,
      },
      constructor: standing.driver!.constructor
        ? {
            id: standing.driver!.constructor.id,
            name: standing.driver!.constructor.name,
            nationality: standing.driver!.constructor.nationality,
          }
        : null,
    })),
    constructors: constructorStandings.map((standing) => ({
      position: standing.position,
      points: standing.points,
      wins: standing.wins,
      constructor: {
        id: standing.constructor!.id,
        name: standing.constructor!.name,
        nationality: standing.constructor!.nationality,
      },
      drivers: [],
    })),
  };
}

// ============================================
// Helper Functions
// ============================================

async function getTotalRaces(season: number): Promise<number> {
  return prisma.race.count({ where: { season } });
}

export default {
  getDriverStandings,
  getConstructorStandings,
  getStandingsAfterRound,
};
