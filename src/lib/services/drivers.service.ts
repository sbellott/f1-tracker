import { prisma } from '@/lib/db/prisma';
import { 
  getDriverRecentResults as getF1APIDriverResults,
  mapErgastToF1APIDriverId,
  getCurrentDriverStandings,
} from './f1api.service';

const ERGAST_BASE_URL = 'https://api.jolpi.ca/ergast/f1';

// Type exports for hooks
export interface DriverListItem {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  nationality: string;
  number: number | null;
  photoUrl: string | null;
  ergastId: string;
  constructor: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

export interface DriverDetail extends Omit<DriverListItem, 'constructor'> {
  constructor: {
    id: string;
    name: string;
    nationality: string;
    color: string | null;
    ergastId: string;
  } | null;
  standings: Array<{
    id: string;
    season: number;
    round: number;
    points: number;
    position: number;
  }>;
}

// NEW: Driver race result type (matches DB model)
export interface DriverRaceResult {
  season: number;
  round: number;
  raceName: string;
  circuitName: string;
  date: string;
  position: number;
  positionText: string;
  points: number;
  grid: number;
  laps: number;
  status: string;
  time?: string;
  fastestLap: boolean;
  fastestLapRank?: number;
  constructor: {
    constructorId: string;
    name: string;
  };
}

// NEW: Driver career stats (matches DB model)
export interface DriverCareerInfo {
  firstWin?: { raceName: string; season: number };
  firstPole?: { raceName: string; season: number };
  firstRace?: { raceName: string; season: number };
  lastWin?: { raceName: string; season: number };
  bestFinish: number;
  totalRacesFinished: number;
  totalRaces: number;
  totalDNFs: number;
}

export async function getAllDrivers() {
  return (prisma.driver.findMany as Function)({
    include: {
      constructor: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: [
      { constructor: { name: 'asc' } },
      { lastName: 'asc' },
    ],
  });
}

// Alias for route compatibility - get drivers for a season
export async function getDrivers(season?: number) {
  // For now, return all current drivers
  // In a full implementation, would filter by season standings
  return getAllDrivers();
}

// Search drivers by name or code
export async function searchDrivers(query: string) {
  const lowerQuery = query.toLowerCase();
  return (prisma.driver.findMany as Function)({
    where: {
      OR: [
        { firstName: { contains: lowerQuery } },
        { lastName: { contains: lowerQuery } },
        { code: { contains: lowerQuery } },
      ],
    },
    include: {
      constructor: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: { lastName: 'asc' },
  });
}

export async function getDriverById(driverId: string) {
  return (prisma.driver.findUnique as Function)({
    where: { id: driverId },
    include: {
      constructor: true,
      standings: {
        orderBy: [{ season: 'desc' }, { round: 'desc' }],
        take: 10,
      },
    },
  });
}

export async function getDriverByCode(code: string) {
  return (prisma.driver.findFirst as Function)({
    where: { code: code.toUpperCase() },
    include: {
      constructor: true,
    },
  });
}

export async function getDriversByConstructor(constructorId: string) {
  return (prisma.driver.findMany as Function)({
    where: { constructorId },
    include: {
      constructor: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: { lastName: 'asc' },
  });
}

// Helper to fetch from Ergast API (for historical data pre-2023)
async function fetchDriverRaceResultsFromErgast(
  driverErgastId: string,
  season?: number,
  limit: number = 10
): Promise<DriverRaceResult[]> {
  try {
    const seasonPath = season ? `/${season}` : '';
    // Fetch more results to get recent ones (API returns oldest first)
    // If no season specified, fetch up to 500 to ensure we get recent races
    const fetchLimit = season ? limit : 500;
    const response = await fetch(
      `${ERGAST_BASE_URL}${seasonPath}/drivers/${driverErgastId}/results.json?limit=${fetchLimit}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const races = data.MRData?.RaceTable?.Races || [];
    
    const results = races.map((race: any) => {
      const result = race.Results?.[0];
      if (!result) return null;
      
      return {
        season: parseInt(race.season),
        round: parseInt(race.round),
        raceName: race.raceName,
        circuitName: race.Circuit?.circuitName || '',
        date: race.date,
        position: parseInt(result.position) || 0,
        positionText: result.positionText || result.position,
        points: parseFloat(result.points) || 0,
        grid: parseInt(result.grid) || 0,
        laps: parseInt(result.laps) || 0,
        status: result.status || 'Unknown',
        time: result.Time?.time,
        fastestLap: result.FastestLap?.rank === '1',
        fastestLapRank: result.FastestLap ? parseInt(result.FastestLap.rank) : undefined,
        constructor: {
          constructorId: result.Constructor.constructorId,
          name: result.Constructor.name,
        },
      };
    }).filter(Boolean) as DriverRaceResult[];
    
    // Sort by date descending (most recent first) and take the requested limit
    return results
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching driver results from API:', error);
    return [];
  }
}

// NEW: Fetch from F1API.dev for recent data (2023+)
async function fetchDriverRaceResultsFromF1API(
  driverErgastId: string,
  limit: number = 10
): Promise<DriverRaceResult[]> {
  try {
    // Map ergast ID to F1API ID
    const f1apiId = mapErgastToF1APIDriverId(driverErgastId);
    
    // Fetch results for 2024 and 2023 (F1API.dev doesn't have 2025 yet)
    const results = await getF1APIDriverResults(f1apiId, [2024, 2023]);
    
    return results.slice(0, limit).map(r => ({
      season: r.season,
      round: r.round,
      raceName: r.raceName,
      circuitName: r.circuitName,
      date: r.date,
      position: r.position,
      positionText: r.positionText,
      points: r.points,
      grid: r.grid,
      laps: 0, // F1API doesn't provide laps
      status: r.status,
      time: r.time || undefined,
      fastestLap: r.fastestLap,
      fastestLapRank: r.fastestLap ? 1 : undefined,
      constructor: {
        constructorId: r.constructorName.toLowerCase().replace(/\s+/g, '_'),
        name: r.constructorName,
      },
    }));
  } catch (error) {
    console.error('Error fetching from F1API:', error);
    return [];
  }
}

// Combined function: fetches from DB first (includes 2025 OpenF1 data), then APIs for gaps
async function fetchDriverRaceResultsFromAPI(
  driverErgastId: string,
  season?: number,
  limit: number = 10
): Promise<DriverRaceResult[]> {
  // If specific season requested
  if (season) {
    if (season >= 2023) {
      // Use F1API for 2023-2024
      const f1apiResults = await fetchDriverRaceResultsFromF1API(driverErgastId, limit);
      return f1apiResults.filter(r => r.season === season);
    } else {
      // Use Ergast for pre-2023
      return fetchDriverRaceResultsFromErgast(driverErgastId, season, limit);
    }
  }
  
  // No season specified - get recent results from both APIs
  const [f1apiResults, ergastResults] = await Promise.all([
    fetchDriverRaceResultsFromF1API(driverErgastId, limit),
    fetchDriverRaceResultsFromErgast(driverErgastId, undefined, limit),
  ]);
  
  // Combine and dedupe by season+round
  const combined = new Map<string, DriverRaceResult>();
  
  // F1API results take priority (more recent)
  for (const r of f1apiResults) {
    combined.set(`${r.season}-${r.round}`, r);
  }
  
  // Add Ergast results for races not in F1API
  for (const r of ergastResults) {
    const key = `${r.season}-${r.round}`;
    if (!combined.has(key)) {
      combined.set(key, r);
    }
  }
  
  // Sort by date descending and return limited results
  return Array.from(combined.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// Helper to fetch career info from Ergast API
async function fetchDriverCareerInfoFromAPI(driverErgastId: string): Promise<DriverCareerInfo> {
  try {
    // Fetch all results to calculate career info
    const [winsResponse, allResultsResponse] = await Promise.all([
      fetch(`${ERGAST_BASE_URL}/drivers/${driverErgastId}/results/1.json?limit=500`),
      fetch(`${ERGAST_BASE_URL}/drivers/${driverErgastId}/results.json?limit=500`),
    ]);
    
    const winsData = winsResponse.ok ? await winsResponse.json() : null;
    const allData = allResultsResponse.ok ? await allResultsResponse.json() : null;
    
    const wins = winsData?.MRData?.RaceTable?.Races || [];
    const allRaces = allData?.MRData?.RaceTable?.Races || [];
    
    // First win (chronologically first)
    const firstWin = wins.length > 0 ? {
      raceName: wins[0].raceName,
      season: parseInt(wins[0].season),
    } : undefined;
    
    // Last win (most recent)
    const lastWin = wins.length > 0 ? {
      raceName: wins[wins.length - 1].raceName,
      season: parseInt(wins[wins.length - 1].season),
    } : undefined;
    
    // First race
    const firstRace = allRaces.length > 0 ? {
      raceName: allRaces[0].raceName,
      season: parseInt(allRaces[0].season),
    } : undefined;
    
    // Calculate stats from all races
    let bestFinish = 999;
    let totalRacesFinished = 0;
    let totalDNFs = 0;
    let firstPole: { raceName: string; season: number } | undefined;
    
    for (const race of allRaces) {
      const result = race.Results?.[0];
      if (!result) continue;
      
      const position = parseInt(result.position) || 999;
      if (position < bestFinish) {
        bestFinish = position;
      }
      
      // Check for pole position (grid position 1)
      if (parseInt(result.grid) === 1 && !firstPole) {
        firstPole = {
          raceName: race.raceName,
          season: parseInt(race.season),
        };
      }
      
      // Check if finished
      if (result.status === 'Finished' || result.status?.includes('Lap') || result.status?.includes('+')) {
        totalRacesFinished++;
      } else {
        totalDNFs++;
      }
    }
    
    return {
      firstWin,
      firstPole,
      firstRace,
      lastWin,
      bestFinish: bestFinish === 999 ? 0 : bestFinish,
      totalRacesFinished,
      totalRaces: allRaces.length,
      totalDNFs,
    };
  } catch (error) {
    console.error('Error fetching driver career info from API:', error);
    return {
      bestFinish: 0,
      totalRacesFinished: 0,
      totalRaces: 0,
      totalDNFs: 0,
    };
  }
}

// Get driver race results - DB first, then API
export async function getDriverRaceResults(
  driverErgastId: string,
  season?: number,
  limit: number = 10
): Promise<DriverRaceResult[]> {
  // First, find the driver by ergastId to get the internal ID
  const driver = await (prisma.driver.findUnique as Function)({
    where: { ergastId: driverErgastId },
    select: { id: true },
  });

  if (!driver) {
    // Driver not in DB, fetch from API only
    return fetchDriverRaceResultsFromAPI(driverErgastId, season, limit);
  }

  // Check DB for existing results
  const whereClause: any = { driverId: driver.id };
  if (season) {
    whereClause.season = season;
  }

  const dbResults = await (prisma.driverRaceResult.findMany as Function)({
    where: whereClause,
    orderBy: [{ season: 'desc' }, { round: 'desc' }],
    take: limit,
  });

  // If we have results in DB, return them
  if (dbResults.length > 0) {
    return dbResults.map((r: any) => ({
      season: r.season,
      round: r.round,
      raceName: r.raceName,
      circuitName: r.circuitName,
      date: r.date.toISOString().split('T')[0],
      position: r.position,
      positionText: r.positionText,
      points: r.points,
      grid: r.grid,
      laps: r.laps,
      status: r.status,
      time: r.time || undefined,
      fastestLap: r.fastestLap,
      fastestLapRank: r.fastestLapRank || undefined,
      constructor: {
        constructorId: r.constructorId,
        name: r.constructorName,
      },
    }));
  }

  // No results in DB, fetch from API
  const apiResults = await fetchDriverRaceResultsFromAPI(driverErgastId, season, limit);

  // Store in DB for future use (don't await, fire and forget)
  if (apiResults.length > 0) {
    storeDriverRaceResults(driver.id, apiResults).catch(console.error);
  }

  return apiResults;
}

// Store race results in DB
async function storeDriverRaceResults(driverId: string, results: DriverRaceResult[]): Promise<void> {
  try {
    // Use upsert to avoid duplicates
    for (const result of results) {
      await (prisma.driverRaceResult.upsert as Function)({
        where: {
          driverId_season_round: {
            driverId,
            season: result.season,
            round: result.round,
          },
        },
        create: {
          driverId,
          season: result.season,
          round: result.round,
          raceName: result.raceName,
          circuitName: result.circuitName,
          date: new Date(result.date),
          position: result.position,
          positionText: result.positionText,
          points: result.points,
          grid: result.grid,
          laps: result.laps,
          status: result.status,
          time: result.time || null,
          fastestLap: result.fastestLap,
          fastestLapRank: result.fastestLapRank || null,
          constructorId: result.constructor.constructorId,
          constructorName: result.constructor.name,
        },
        update: {}, // No update needed for historical data
      });
    }
  } catch (error) {
    console.error('Error storing driver race results:', error);
  }
}

// Get driver career info - DB first, then API
export async function getDriverCareerInfo(driverErgastId: string): Promise<DriverCareerInfo> {
  // First, find the driver by ergastId to get the internal ID
  const driver = await (prisma.driver.findUnique as Function)({
    where: { ergastId: driverErgastId },
    select: { id: true },
  });

  if (!driver) {
    // Driver not in DB, fetch from API only
    return fetchDriverCareerInfoFromAPI(driverErgastId);
  }

  // Check DB for existing career info
  const dbCareerInfo = await (prisma.driverCareerInfo.findUnique as Function)({
    where: { driverId: driver.id },
  });

  // If we have career info in DB, return it
  if (dbCareerInfo) {
    return {
      firstWin: dbCareerInfo.firstWinRace ? {
        raceName: dbCareerInfo.firstWinRace,
        season: dbCareerInfo.firstWinSeason,
      } : undefined,
      firstPole: dbCareerInfo.firstPoleRace ? {
        raceName: dbCareerInfo.firstPoleRace,
        season: dbCareerInfo.firstPoleSeason,
      } : undefined,
      firstRace: dbCareerInfo.firstRaceRace ? {
        raceName: dbCareerInfo.firstRaceRace,
        season: dbCareerInfo.firstRaceSeason,
      } : undefined,
      lastWin: dbCareerInfo.lastWinRace ? {
        raceName: dbCareerInfo.lastWinRace,
        season: dbCareerInfo.lastWinSeason,
      } : undefined,
      bestFinish: dbCareerInfo.bestFinish,
      totalRacesFinished: dbCareerInfo.totalRacesFinished,
      totalRaces: dbCareerInfo.totalRaces,
      totalDNFs: dbCareerInfo.totalDNFs,
    };
  }

  // No career info in DB, fetch from API
  const apiCareerInfo = await fetchDriverCareerInfoFromAPI(driverErgastId);

  // Store in DB for future use (don't await, fire and forget)
  storeDriverCareerInfo(driver.id, apiCareerInfo).catch(console.error);

  return apiCareerInfo;
}

// Store career info in DB
async function storeDriverCareerInfo(driverId: string, info: DriverCareerInfo): Promise<void> {
  try {
    await (prisma.driverCareerInfo.upsert as Function)({
      where: { driverId },
      create: {
        driverId,
        firstWinRace: info.firstWin?.raceName || null,
        firstWinSeason: info.firstWin?.season || null,
        firstPoleRace: info.firstPole?.raceName || null,
        firstPoleSeason: info.firstPole?.season || null,
        firstRaceRace: info.firstRace?.raceName || null,
        firstRaceSeason: info.firstRace?.season || null,
        lastWinRace: info.lastWin?.raceName || null,
        lastWinSeason: info.lastWin?.season || null,
        bestFinish: info.bestFinish,
        totalRacesFinished: info.totalRacesFinished,
        totalRaces: info.totalRaces,
        totalDNFs: info.totalDNFs,
      },
      update: {}, // No update needed for historical data
    });
  } catch (error) {
    console.error('Error storing driver career info:', error);
  }
}