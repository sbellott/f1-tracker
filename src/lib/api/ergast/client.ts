import { cache, CACHE_TTL } from "@/lib/cache/memory-cache";
import { ApiError } from "@/lib/errors/api-error";
import type {
  ErgastResponse,
  ErgastDriverTable,
  ErgastConstructorTable,
  ErgastCircuitTable,
  ErgastRaceTable,
  ErgastDriverStandingsTable,
  ErgastConstructorStandingsTable,
  ErgastRaceResultTable,
  ErgastQualifyingTable,
  ErgastSprintTable,
} from "./types";

const ERGAST_BASE_URL = "https://ergast.com/api/f1";

interface FetchOptions {
  cache?: boolean;
  ttl?: number;
}

/**
 * Fetch data from Ergast API with caching
 */
async function fetchErgast<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ data: T; cached: boolean; cachedAt?: Date }> {
  const { cache: useCache = true, ttl = CACHE_TTL.STANDINGS } = options;
  const cacheKey = `ergast:${endpoint}`;

  if (useCache) {
    const result = await cache.getOrSet<T>(
      cacheKey,
      async () => {
        const response = await fetch(`${ERGAST_BASE_URL}${endpoint}.json`, {
          headers: { Accept: "application/json" },
          next: { revalidate: ttl },
        });

        if (!response.ok) {
          throw ApiError.externalApi("Ergast", `HTTP ${response.status}`);
        }

        const json = (await response.json()) as ErgastResponse<T>;
        return json.MRData as T;
      },
      ttl
    );

    return {
      data: result.data,
      cached: result.cached,
      cachedAt: result.createdAt,
    };
  }

  const response = await fetch(`${ERGAST_BASE_URL}${endpoint}.json`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw ApiError.externalApi("Ergast", `HTTP ${response.status}`);
  }

  const json = (await response.json()) as ErgastResponse<T>;
  return { data: json.MRData as T, cached: false };
}

// ============================================
// API Methods
// ============================================

export const ergastClient = {
  /**
   * Get all drivers for a season
   */
  async getDrivers(season: number | "current" = "current") {
    return fetchErgast<ErgastDriverTable>(`/${season}/drivers`, {
      ttl: CACHE_TTL.DRIVERS,
    });
  },

  /**
   * Get all constructors for a season
   */
  async getConstructors(season: number | "current" = "current") {
    return fetchErgast<ErgastConstructorTable>(`/${season}/constructors`, {
      ttl: CACHE_TTL.CONSTRUCTORS,
    });
  },

  /**
   * Get all circuits
   */
  async getCircuits() {
    return fetchErgast<ErgastCircuitTable>("/circuits", {
      ttl: CACHE_TTL.CIRCUITS,
    });
  },

  /**
   * Get race schedule for a season
   */
  async getSchedule(season: number | "current" = "current") {
    return fetchErgast<ErgastRaceTable>(`/${season}`, {
      ttl: CACHE_TTL.CALENDAR,
    });
  },

  /**
   * Get driver standings
   */
  async getDriverStandings(season: number | "current" = "current", round?: number) {
    const endpoint = round
      ? `/${season}/${round}/driverStandings`
      : `/${season}/driverStandings`;
    return fetchErgast<ErgastDriverStandingsTable>(endpoint, {
      ttl: CACHE_TTL.STANDINGS,
    });
  },

  /**
   * Get constructor standings
   */
  async getConstructorStandings(
    season: number | "current" = "current",
    round?: number
  ) {
    const endpoint = round
      ? `/${season}/${round}/constructorStandings`
      : `/${season}/constructorStandings`;
    return fetchErgast<ErgastConstructorStandingsTable>(endpoint, {
      ttl: CACHE_TTL.STANDINGS,
    });
  },

  /**
   * Get race results
   */
  async getRaceResults(season: number, round: number) {
    return fetchErgast<ErgastRaceResultTable>(`/${season}/${round}/results`, {
      ttl: CACHE_TTL.RESULTS,
    });
  },

  /**
   * Get qualifying results
   */
  async getQualifyingResults(season: number, round: number) {
    return fetchErgast<ErgastQualifyingTable>(`/${season}/${round}/qualifying`, {
      ttl: CACHE_TTL.RESULTS,
    });
  },

  /**
   * Get sprint results
   */
  async getSprintResults(season: number, round: number) {
    return fetchErgast<ErgastSprintTable>(`/${season}/${round}/sprint`, {
      ttl: CACHE_TTL.RESULTS,
    });
  },

  /**
   * Get specific driver info
   */
  async getDriver(driverId: string) {
    return fetchErgast<ErgastDriverTable>(`/drivers/${driverId}`, {
      ttl: CACHE_TTL.DRIVERS,
    });
  },

  /**
   * Get specific constructor info
   */
  async getConstructor(constructorId: string) {
    return fetchErgast<ErgastConstructorTable>(`/constructors/${constructorId}`, {
      ttl: CACHE_TTL.CONSTRUCTORS,
    });
  },

  /**
   * Get driver career stats
   */
  async getDriverCareerStats(driverId: string) {
    const [results, standings] = await Promise.all([
      fetchErgast<ErgastRaceResultTable>(`/drivers/${driverId}/results`, {
        ttl: CACHE_TTL.RESULTS,
        cache: false,
      }),
      fetchErgast<ErgastDriverStandingsTable>(
        `/drivers/${driverId}/driverStandings`,
        { ttl: CACHE_TTL.STANDINGS, cache: false }
      ),
    ]);

    return { results: results.data, standings: standings.data };
  },

  /**
   * Clear all Ergast cache
   */
  clearCache() {
    return cache.deleteByPrefix("ergast:");
  },
};

export default ergastClient;
