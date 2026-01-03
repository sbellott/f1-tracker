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

// Combined function to get all circuit history data
export async function getCircuitHistory(circuitId: string): Promise<{
  winners: HistoricalWinner[];
  stats: CircuitStats;
}> {
  const [winners, stats] = await Promise.all([
    getCircuitWinners(circuitId, 10),
    getCircuitStats(circuitId),
  ]);
  
  return { winners, stats };
}
