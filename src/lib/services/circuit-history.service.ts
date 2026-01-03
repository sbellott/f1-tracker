// Circuit History Service - Fetches real historical data from Ergast/Jolpica API

const ERGAST_BASE_URL = 'https://api.jolpi.ca/ergast/f1';

export interface HistoricalWinner {
  season: number;
  round: number;
  raceName: string;
  date: string;
  driver: {
    driverId: string;
    code: string;
    firstName: string;
    lastName: string;
    nationality: string;
  };
  constructor: {
    constructorId: string;
    name: string;
    nationality: string;
  };
  time?: string;
  laps: number;
  grid: number;
}

export interface CircuitStats {
  totalRaces: number;
  firstRace: number;
  lastRace: number;
  mostWinsDriver: {
    driver: string;
    wins: number;
  } | null;
  mostWinsConstructor: {
    constructor: string;
    wins: number;
  } | null;
  fastestLap?: {
    time: string;
    driver: string;
    year: number;
  };
}

export interface CircuitHistoryData {
  winners: HistoricalWinner[];
  stats: CircuitStats;
  loading: boolean;
  error: string | null;
}

// NEW: Full race result for a driver
export interface RaceResult {
  position: number;
  positionText: string;
  points: number;
  driver: {
    driverId: string;
    code: string;
    firstName: string;
    lastName: string;
    nationality: string;
    number?: string;
  };
  constructor: {
    constructorId: string;
    name: string;
    nationality: string;
  };
  grid: number;
  laps: number;
  status: string;
  time?: string;
  fastestLap?: {
    rank: number;
    lap: number;
    time: string;
    avgSpeed: string;
  };
}

// NEW: Complete race with all results
export interface FullRaceResult {
  season: number;
  round: number;
  raceName: string;
  circuitName: string;
  date: string;
  results: RaceResult[];
}

// Fetch race winners for a specific circuit
export async function getCircuitWinners(circuitId: string, limit: number = 10): Promise<HistoricalWinner[]> {
  try {
    // Fetch winners (position 1) for this circuit
    const response = await fetch(
      `${ERGAST_BASE_URL}/circuits/${circuitId}/results/1.json?limit=100`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const races = data.MRData?.RaceTable?.Races || [];
    
    // Transform and get the most recent winners
    const winners: HistoricalWinner[] = races
      .map((race: any) => {
        const result = race.Results?.[0];
        if (!result) return null;
        
        return {
          season: parseInt(race.season),
          round: parseInt(race.round),
          raceName: race.raceName,
          date: race.date,
          driver: {
            driverId: result.Driver.driverId,
            code: result.Driver.code || result.Driver.driverId.substring(0, 3).toUpperCase(),
            firstName: result.Driver.givenName,
            lastName: result.Driver.familyName,
            nationality: result.Driver.nationality,
          },
          constructor: {
            constructorId: result.Constructor.constructorId,
            name: result.Constructor.name,
            nationality: result.Constructor.nationality,
          },
          time: result.Time?.time,
          laps: parseInt(result.laps) || 0,
          grid: parseInt(result.grid) || 0,
        };
      })
      .filter(Boolean)
      .reverse() // Most recent first
      .slice(0, limit);
    
    return winners;
  } catch (error) {
    console.error('Error fetching circuit winners:', error);
    return [];
  }
}

// Fetch circuit statistics
export async function getCircuitStats(circuitId: string): Promise<CircuitStats> {
  try {
    // Fetch all results for this circuit to calculate stats
    const response = await fetch(
      `${ERGAST_BASE_URL}/circuits/${circuitId}/results/1.json?limit=500`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const races = data.MRData?.RaceTable?.Races || [];
    
    if (races.length === 0) {
      return {
        totalRaces: 0,
        firstRace: 0,
        lastRace: 0,
        mostWinsDriver: null,
        mostWinsConstructor: null,
      };
    }
    
    // Calculate stats
    const seasons = races.map((r: any) => parseInt(r.season));
    const driverWins: Record<string, { name: string; count: number }> = {};
    const constructorWins: Record<string, { name: string; count: number }> = {};
    
    races.forEach((race: any) => {
      const result = race.Results?.[0];
      if (!result) return;
      
      const driverId = result.Driver.driverId;
      const driverName = `${result.Driver.givenName} ${result.Driver.familyName}`;
      const constructorId = result.Constructor.constructorId;
      const constructorName = result.Constructor.name;
      
      if (!driverWins[driverId]) {
        driverWins[driverId] = { name: driverName, count: 0 };
      }
      driverWins[driverId].count++;
      
      if (!constructorWins[constructorId]) {
        constructorWins[constructorId] = { name: constructorName, count: 0 };
      }
      constructorWins[constructorId].count++;
    });
    
    // Find most wins
    const topDriver = Object.values(driverWins).sort((a, b) => b.count - a.count)[0];
    const topConstructor = Object.values(constructorWins).sort((a, b) => b.count - a.count)[0];
    
    return {
      totalRaces: races.length,
      firstRace: Math.min(...seasons),
      lastRace: Math.max(...seasons),
      mostWinsDriver: topDriver ? { driver: topDriver.name, wins: topDriver.count } : null,
      mostWinsConstructor: topConstructor ? { constructor: topConstructor.name, wins: topConstructor.count } : null,
    };
  } catch (error) {
    console.error('Error fetching circuit stats:', error);
    return {
      totalRaces: 0,
      firstRace: 0,
      lastRace: 0,
      mostWinsDriver: null,
      mostWinsConstructor: null,
    };
  }
}

// Fetch fastest lap records for a circuit
export async function getCircuitFastestLaps(circuitId: string, limit: number = 5): Promise<Array<{
  season: number;
  driver: string;
  time: string;
  constructor: string;
}>> {
  try {
    const response = await fetch(
      `${ERGAST_BASE_URL}/circuits/${circuitId}/fastest/1/results.json?limit=100`
    );
    
    if (!response.ok) {
      // Fallback - fastest lap endpoint might not exist for all circuits
      return [];
    }
    
    const data = await response.json();
    const races = data.MRData?.RaceTable?.Races || [];
    
    const fastestLaps = races
      .map((race: any) => {
        const result = race.Results?.[0];
        if (!result?.FastestLap) return null;
        
        return {
          season: parseInt(race.season),
          driver: `${result.Driver.givenName} ${result.Driver.familyName}`,
          time: result.FastestLap.Time?.time || '',
          constructor: result.Constructor.name,
        };
      })
      .filter(Boolean)
      .reverse()
      .slice(0, limit);
    
    return fastestLaps;
  } catch (error) {
    console.error('Error fetching fastest laps:', error);
    return [];
  }
}

// NEW: Fetch full race results for a circuit (last N races with complete classification)
export async function getCircuitFullResults(circuitId: string, numberOfRaces: number = 5): Promise<FullRaceResult[]> {
  try {
    // First get the list of races at this circuit to find recent seasons
    const seasonsResponse = await fetch(
      `${ERGAST_BASE_URL}/circuits/${circuitId}/seasons.json?limit=100`
    );
    
    if (!seasonsResponse.ok) {
      throw new Error(`API error: ${seasonsResponse.status}`);
    }
    
    const seasonsData = await seasonsResponse.json();
    const seasons = (seasonsData.MRData?.SeasonTable?.Seasons || [])
      .map((s: any) => parseInt(s.season))
      .sort((a: number, b: number) => b - a) // Most recent first
      .slice(0, numberOfRaces);
    
    if (seasons.length === 0) {
      return [];
    }
    
    // Fetch full results for each season in parallel
    const racePromises = seasons.map(async (season: number) => {
      const response = await fetch(
        `${ERGAST_BASE_URL}/${season}/circuits/${circuitId}/results.json`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const race = data.MRData?.RaceTable?.Races?.[0];
      
      if (!race) {
        return null;
      }
      
      const results: RaceResult[] = (race.Results || []).map((r: any) => ({
        position: parseInt(r.position) || 0,
        positionText: r.positionText || r.position,
        points: parseFloat(r.points) || 0,
        driver: {
          driverId: r.Driver.driverId,
          code: r.Driver.code || r.Driver.driverId.substring(0, 3).toUpperCase(),
          firstName: r.Driver.givenName,
          lastName: r.Driver.familyName,
          nationality: r.Driver.nationality,
          number: r.Driver.permanentNumber,
        },
        constructor: {
          constructorId: r.Constructor.constructorId,
          name: r.Constructor.name,
          nationality: r.Constructor.nationality,
        },
        grid: parseInt(r.grid) || 0,
        laps: parseInt(r.laps) || 0,
        status: r.status || 'Unknown',
        time: r.Time?.time,
        fastestLap: r.FastestLap ? {
          rank: parseInt(r.FastestLap.rank) || 0,
          lap: parseInt(r.FastestLap.lap) || 0,
          time: r.FastestLap.Time?.time || '',
          avgSpeed: r.FastestLap.AverageSpeed?.speed || '',
        } : undefined,
      }));
      
      return {
        season: parseInt(race.season),
        round: parseInt(race.round),
        raceName: race.raceName,
        circuitName: race.Circuit?.circuitName || '',
        date: race.date,
        results,
      } as FullRaceResult;
    });
    
    const races = await Promise.all(racePromises);
    return races.filter((r): r is FullRaceResult => r !== null);
  } catch (error) {
    console.error('Error fetching circuit full results:', error);
    return [];
  }
}

// Updated combined function
export async function getCircuitHistory(circuitId: string): Promise<{
  winners: HistoricalWinner[];
  stats: CircuitStats;
  fullResults: FullRaceResult[];
}> {
  const [winners, stats, fullResults] = await Promise.all([
    getCircuitWinners(circuitId, 10),
    getCircuitStats(circuitId),
    getCircuitFullResults(circuitId, 5),
  ]);
  
  return { winners, stats, fullResults };
}