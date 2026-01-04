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

const ERGAST_BASE_URL = 'https://api.jolpi.ca/ergast/f1';

// Fetch driver standings from Ergast API
async function fetchDriverStandingsFromErgast(season: number): Promise<DriverStanding[]> {
  try {
    const response = await fetch(`${ERGAST_BASE_URL}/${season}/driverStandings.json`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const standings = data.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
    
    return standings.map((s: any) => ({
      position: parseInt(s.position),
      driver: {
        id: s.Driver.driverId,
        code: s.Driver.code || s.Driver.driverId.substring(0, 3).toUpperCase(),
        firstName: s.Driver.givenName,
        lastName: s.Driver.familyName,
        photoUrl: null,
        constructor: s.Constructors?.[0] ? {
          id: s.Constructors[0].constructorId,
          name: s.Constructors[0].name,
          color: null,
        } : null,
      },
      points: parseFloat(s.points),
      wins: parseInt(s.wins),
    }));
  } catch (error) {
    console.error('Error fetching driver standings from Ergast:', error);
    return [];
  }
}

// Fetch constructor standings from Ergast API
async function fetchConstructorStandingsFromErgast(season: number): Promise<ConstructorStanding[]> {
  try {
    const response = await fetch(`${ERGAST_BASE_URL}/${season}/constructorStandings.json`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const standings = data.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
    
    return standings.map((s: any) => ({
      position: parseInt(s.position),
      constructor: {
        id: s.Constructor.constructorId,
        name: s.Constructor.name,
        color: null,
        logoUrl: null,
      },
      points: parseFloat(s.points),
      wins: parseInt(s.wins),
    }));
  } catch (error) {
    console.error('Error fetching constructor standings from Ergast:', error);
    return [];
  }
}

export async function getDriverStandings(
  season: number = new Date().getFullYear()
): Promise<DriverStanding[]> {
  // Get latest round for the season from database
  const latestStanding = await prisma.standing.findFirst({
    where: {
      season,
      type: StandingType.DRIVER,
    },
    orderBy: { round: 'desc' },
  });

  // If no data in database, try to fetch from Ergast (for historical seasons)
  if (!latestStanding) {
    return fetchDriverStandingsFromErgast(season);
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

  // Check if database data has meaningful points (not just placeholder data)
  const totalPoints = standings.reduce((sum: number, s: any) => sum + s.points, 0);
  if (totalPoints === 0 && season < new Date().getFullYear()) {
    // Database has placeholder data, fetch real data from Ergast
    return fetchDriverStandingsFromErgast(season);
  }

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
  // Get latest round for the season from database
  const latestStanding = await prisma.standing.findFirst({
    where: {
      season,
      type: StandingType.CONSTRUCTOR,
    },
    orderBy: { round: 'desc' },
  });

  // If no data in database, try to fetch from Ergast (for historical seasons)
  if (!latestStanding) {
    return fetchConstructorStandingsFromErgast(season);
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

  // Check if database data has meaningful points (not just placeholder data)
  const totalPoints = standings.reduce((sum: number, s: any) => sum + s.points, 0);
  if (totalPoints === 0 && season < new Date().getFullYear()) {
    // Database has placeholder data, fetch real data from Ergast
    return fetchConstructorStandingsFromErgast(season);
  }

  return standings.map((s: any) => ({
    position: s.position,
    constructor: s.constructor!,
    points: s.points,
    wins: s.wins,
  }));
}