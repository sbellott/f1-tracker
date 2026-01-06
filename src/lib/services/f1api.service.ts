/**
 * F1API.dev Service - For current F1 data (2023+)
 * 
 * This service provides access to current F1 data including:
 * - Driver standings
 * - Constructor standings  
 * - Race results
 * - Driver information
 * 
 * For historical data (pre-2023), use Jolpica/Ergast API
 */

const F1API_BASE_URL = 'https://f1api.dev/api';

// ==================== Types ====================

export interface F1APIDriver {
  driverId: string;
  name: string;
  surname: string;
  nationality: string;
  birthday: string;
  number: number;
  shortName: string;
  url: string;
  teamId?: string;
}

export interface F1APITeam {
  teamId: string;
  teamName: string;
  nationality: string;
  firstAppareance: number;
  constructorsChampionships: number;
  driversChampionships: number;
  url: string;
}

export interface F1APIRaceResult {
  position: number;
  points: number;
  grid: number;
  time: string | null;
  fastLap: string | null;
  retired: string | null;
  driver: F1APIDriver;
  team: F1APITeam;
}

export interface F1APICircuit {
  circuitId: string;
  circuitName: string;
  country: string;
  city: string;
  circuitLength: string;
  corners: number;
  firstParticipationYear: number;
  lapRecord: string;
  fastestLapDriverId: string;
  fastestLapTeamId: string;
  fastestLapYear: number;
  url: string;
}

export interface F1APIRace {
  round: string;
  date: string;
  time: string;
  url: string;
  raceId: string;
  raceName: string;
  circuit: F1APICircuit;
  results: F1APIRaceResult[];
}

export interface F1APIDriverStanding {
  classificationId: number;
  driverId: string;
  teamId: string;
  points: number;
  position: number;
  wins: number;
  driver: F1APIDriver;
  team: F1APITeam;
}

export interface F1APIConstructorStanding {
  classificationId: number;
  teamId: string;
  points: number;
  position: number;
  wins: number;
  team: F1APITeam;
}

// ==================== Helper Functions ====================

async function fetchF1API<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${F1API_BASE_URL}${endpoint}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      console.error(`F1API error: ${response.status} for ${endpoint}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`F1API fetch error for ${endpoint}:`, error);
    return null;
  }
}

// ==================== API Functions ====================

/**
 * Get current season driver standings
 */
export async function getCurrentDriverStandings(): Promise<F1APIDriverStanding[]> {
  const data = await fetchF1API<{ drivers_championship: F1APIDriverStanding[] }>(
    '/current/drivers-championship'
  );
  return data?.drivers_championship || [];
}

/**
 * Get driver standings for a specific season
 */
export async function getDriverStandingsBySeason(season: number): Promise<F1APIDriverStanding[]> {
  const data = await fetchF1API<{ drivers_championship: F1APIDriverStanding[] }>(
    `/${season}/drivers-championship`
  );
  return data?.drivers_championship || [];
}

/**
 * Get current season constructor standings
 */
export async function getCurrentConstructorStandings(): Promise<F1APIConstructorStanding[]> {
  const data = await fetchF1API<{ constructors_championship: F1APIConstructorStanding[] }>(
    '/current/constructors-championship'
  );
  return data?.constructors_championship || [];
}

/**
 * Get constructor standings for a specific season
 */
export async function getConstructorStandingsBySeason(season: number): Promise<F1APIConstructorStanding[]> {
  const data = await fetchF1API<{ constructors_championship: F1APIConstructorStanding[] }>(
    `/${season}/constructors-championship`
  );
  return data?.constructors_championship || [];
}

/**
 * Get all drivers for a season
 */
export async function getDriversBySeason(season: number): Promise<F1APIDriver[]> {
  const data = await fetchF1API<{ drivers: F1APIDriver[] }>(`/${season}/drivers`);
  return data?.drivers || [];
}

/**
 * Get current season drivers
 */
export async function getCurrentDrivers(): Promise<F1APIDriver[]> {
  const data = await fetchF1API<{ drivers: F1APIDriver[] }>('/current/drivers');
  return data?.drivers || [];
}

/**
 * Get driver info by ID
 */
export async function getDriverById(driverId: string): Promise<F1APIDriver | null> {
  const data = await fetchF1API<{ driver: F1APIDriver[] }>(`/drivers/${driverId}`);
  return data?.driver?.[0] || null;
}

/**
 * Get race results for a specific round
 */
export async function getRaceResults(season: number, round: number): Promise<F1APIRace | null> {
  const data = await fetchF1API<{ races: F1APIRace }>(`/${season}/${round}/race`);
  return data?.races || null;
}

/**
 * Get all race results for a season
 */
export async function getSeasonRaceResults(season: number): Promise<F1APIRace[]> {
  const races: F1APIRace[] = [];
  
  // F1 seasons typically have 20-24 races
  for (let round = 1; round <= 24; round++) {
    const race = await getRaceResults(season, round);
    if (race && race.results && race.results.length > 0) {
      races.push(race);
    } else {
      // If no results for this round, we've likely reached the end
      break;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return races;
}

/**
 * Get recent race results for a specific driver
 */
export async function getDriverRecentResults(
  driverId: string, 
  seasons: number[] = [2024, 2023]
): Promise<Array<{
  season: number;
  round: number;
  raceName: string;
  circuitName: string;
  date: string;
  position: number;
  positionText: string;
  points: number;
  grid: number;
  status: string;
  time: string | null;
  fastestLap: boolean;
  constructorName: string;
}>> {
  const results: Array<{
    season: number;
    round: number;
    raceName: string;
    circuitName: string;
    date: string;
    position: number;
    positionText: string;
    points: number;
    grid: number;
    status: string;
    time: string | null;
    fastestLap: boolean;
    constructorName: string;
  }> = [];
  
  for (const season of seasons) {
    const races = await getSeasonRaceResults(season);
    
    for (const race of races) {
      const driverResult = race.results.find(
        r => r.driver.driverId === driverId
      );
      
      if (driverResult) {
        results.push({
          season,
          round: parseInt(race.round),
          raceName: race.raceName,
          circuitName: race.circuit.circuitName,
          date: race.date,
          position: driverResult.position,
          positionText: String(driverResult.position),
          points: driverResult.points,
          grid: driverResult.grid,
          status: driverResult.retired || 'Finished',
          time: driverResult.time,
          fastestLap: driverResult.fastLap !== null,
          constructorName: driverResult.team.teamName,
        });
      }
    }
  }
  
  // Sort by date descending (most recent first)
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get all teams for current season
 */
export async function getCurrentTeams(): Promise<F1APITeam[]> {
  const data = await fetchF1API<{ teams: F1APITeam[] }>('/current/teams');
  return data?.teams || [];
}

/**
 * Get all races schedule for current season
 */
export async function getCurrentSchedule(): Promise<F1APIRace[]> {
  const data = await fetchF1API<{ races: F1APIRace[] }>('/current/races');
  return data?.races || [];
}

/**
 * Calculate driver career stats from F1API data (2023+)
 */
export async function getDriverSeasonStats(
  driverId: string,
  season: number
): Promise<{
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  points: number;
} | null> {
  const races = await getSeasonRaceResults(season);
  if (!races || races.length === 0) return null;
  
  let stats = {
    races: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    fastestLaps: 0,
    points: 0,
  };
  
  for (const race of races) {
    const driverResult = race.results.find(r => r.driver.driverId === driverId);
    
    if (driverResult) {
      stats.races++;
      stats.points += driverResult.points;
      
      if (driverResult.position === 1) stats.wins++;
      if (driverResult.position <= 3) stats.podiums++;
      if (driverResult.grid === 1) stats.poles++;
      if (driverResult.fastLap) stats.fastestLaps++;
    }
  }
  
  return stats;
}

// ==================== Mapping Functions ====================

/**
 * Map F1API driver ID to Ergast driver ID
 * F1API uses different IDs (e.g., 'leclerc' vs 'charles_leclerc')
 */
export function mapF1APItoErgastDriverId(f1apiId: string): string {
  const mapping: Record<string, string> = {
    'max_verstappen': 'max_verstappen',
    'norris': 'norris',
    'piastri': 'piastri',
    'leclerc': 'leclerc',
    'sainz': 'sainz',
    'russell': 'russell',
    'hamilton': 'hamilton',
    'alonso': 'alonso',
    'stroll': 'stroll',
    'gasly': 'gasly',
    'ocon': 'ocon',
    'tsunoda': 'tsunoda',
    'lawson': 'lawson',
    'hulkenberg': 'hulkenberg',
    'magnussen': 'kevin_magnussen',
    'bottas': 'bottas',
    'zhou': 'zhou',
    'albon': 'albon',
    'sargeant': 'sargeant',
    'perez': 'perez',
    'ricciardo': 'ricciardo',
    'bearman': 'bearman',
    'colapinto': 'colapinto',
    'bortoleto': 'bortoleto',
    'antonelli': 'antonelli',
    'doohan': 'doohan',
    'hadjar': 'hadjar',
  };
  
  return mapping[f1apiId] || f1apiId;
}

/**
 * Map Ergast driver ID to F1API driver ID
 */
export function mapErgastToF1APIDriverId(ergastId: string): string {
  const mapping: Record<string, string> = {
    'max_verstappen': 'max_verstappen',
    'norris': 'norris',
    'piastri': 'piastri',
    'leclerc': 'leclerc',
    'sainz': 'sainz',
    'russell': 'russell',
    'hamilton': 'hamilton',
    'alonso': 'alonso',
    'stroll': 'stroll',
    'gasly': 'gasly',
    'ocon': 'ocon',
    'tsunoda': 'tsunoda',
    'lawson': 'lawson',
    'hulkenberg': 'hulkenberg',
    'kevin_magnussen': 'magnussen',
    'bottas': 'bottas',
    'zhou': 'zhou',
    'albon': 'albon',
    'sargeant': 'sargeant',
    'perez': 'perez',
    'ricciardo': 'ricciardo',
    'bearman': 'bearman',
    'colapinto': 'colapinto',
    'bortoleto': 'bortoleto',
    'antonelli': 'antonelli',
    'doohan': 'doohan',
    'hadjar': 'hadjar',
  };
  
  return mapping[ergastId] || ergastId;
}
