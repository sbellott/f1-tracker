import { prisma } from '@/lib/db/prisma';
import { StandingType } from '@prisma/client';

export interface DriverStanding {
  position: number;
  driver: {
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
  };
  points: number;
  wins: number;
}

export interface ConstructorStanding {
  position: number;
  constructor: {
    id: string;
    name: string;
    color: string | null;
    logoUrl: string | null;
  };
  points: number;
  wins: number;
}

export interface StandingsMetadata {
  season: number;
  round: number;
  lastUpdated: Date;
}

export async function getDriverStandings(
  season: number = new Date().getFullYear()
): Promise<DriverStanding[]> {
  // Get latest round for the season
  const latestStanding = await prisma.standing.findFirst({
    where: {
      season,
      type: StandingType.DRIVER,
    },
    orderBy: { round: 'desc' },
  });

  if (!latestStanding) {
    return [];
  }

  const standings = await (prisma.standing.findMany as Function)({
    where: {
      season,
      round: latestStanding.round,
      type: StandingType.DRIVER,
      driverId: { not: null },
    },
    include: {
      driver: {
        include: {
          constructor: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
    orderBy: { position: 'asc' },
  });

  return standings.map((s: any) => ({
    position: s.position,
    driver: {
      id: s.driver!.id,
      code: s.driver!.code,
      firstName: s.driver!.firstName,
      lastName: s.driver!.lastName,
      photoUrl: s.driver!.photoUrl,
      constructor: s.driver!.constructor,
    },
    points: s.points,
    wins: s.wins,
  }));
}

export async function getConstructorStandings(
  season: number = new Date().getFullYear()
): Promise<ConstructorStanding[]> {
  // Get latest round for the season
  const latestStanding = await prisma.standing.findFirst({
    where: {
      season,
      type: StandingType.CONSTRUCTOR,
    },
    orderBy: { round: 'desc' },
  });

  if (!latestStanding) {
    return [];
  }

  const standings = await (prisma.standing.findMany as Function)({
    where: {
      season,
      round: latestStanding.round,
      type: StandingType.CONSTRUCTOR,
      constructorId: { not: null },
    },
    include: {
      constructor: {
        select: {
          id: true,
          name: true,
          color: true,
          logoUrl: true,
        },
      },
    },
    orderBy: { position: 'asc' },
  });

  return standings.map((s: any) => ({
    position: s.position,
    constructor: s.constructor!,
    points: s.points,
    wins: s.wins,
  }));
}