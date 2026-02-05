"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { Driver, Constructor, Circuit, Race, Session, SessionResults, SessionType } from "@/types";
import type { HistoricalWinner, CircuitStats, FullRaceResult } from "@/lib/services/circuit-history.service";
import type { NewsArticle, NewsCategory } from "@/lib/services/news.service";

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
  drivers: ["drivers"] as const,
  driver: (id: string) => ["drivers", id] as const,
  driverResults: (id: string) => ["drivers", id, "results"] as const,
  constructors: ["constructors"] as const,
  constructor: (id: string) => ["constructors", id] as const,
  circuits: ["circuits"] as const,
  circuit: (id: string) => ["circuits", id] as const,
  circuitHistory: (id: string) => ["circuits", id, "history"] as const,
  calendar: ["calendar"] as const,
  nextRace: ["calendar", "next"] as const,
  driverStandings: ["standings", "drivers"] as const,
  constructorStandings: ["standings", "constructors"] as const,
  news: (category: NewsCategory) => ["news", category] as const,
};

// ============================================
// Fetcher Functions
// ============================================

async function fetchAPI<T>(endpoint: string, extractKey?: string): Promise<T> {
  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  const json = await res.json();
  const data = json.data ?? json;
  // If extractKey is provided, extract that nested property
  if (extractKey && data && typeof data === 'object' && extractKey in data) {
    return data[extractKey] as T;
  }
  return data as T;
}

// ============================================
// Data Transformers
// ============================================

// Helper to extract date from API response (handles both string and {$type, value} formats)
function extractDate(dateValue: unknown): Date | null {
  if (!dateValue) return null;
  if (typeof dateValue === 'string') return new Date(dateValue);
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'object' && dateValue !== null) {
    const obj = dateValue as { value?: string; $type?: string };
    if (obj.value) return new Date(obj.value);
  }
  return null;
}

// Transform API driver response to match expected Driver type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformDriver(apiDriver: any): Driver {
  return {
    id: apiDriver.id,
    code: apiDriver.code || '',
    firstName: apiDriver.firstName,
    lastName: apiDriver.lastName,
    number: apiDriver.number || 0,
    nationality: apiDriver.nationality || '',
    dateOfBirth: extractDate(apiDriver.dateOfBirth) || new Date(),
    constructorId: apiDriver.constructorId || '',
    photo: apiDriver.photo,
    stats: {
      gp: apiDriver.totalRaces || 0,
      wins: apiDriver.totalWins || 0,
      podiums: apiDriver.totalPodiums || 0,
      poles: apiDriver.totalPoles || 0,
      fastestLaps: apiDriver.totalFastestLaps || 0,
      points: apiDriver.totalPoints || 0,
      titles: apiDriver.championships || 0,
    },
  };
}

// Transform API constructor response to match expected Constructor type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformConstructor(apiConstructor: any): Constructor {
  return {
    id: apiConstructor.id,
    name: apiConstructor.name,
    nationality: apiConstructor.nationality || '',
    base: apiConstructor.base || '',
    teamPrincipal: apiConstructor.teamPrincipal || '',
    technicalDirector: apiConstructor.technicalChief || apiConstructor.technicalDirector || '',
    engine: apiConstructor.powerUnit || apiConstructor.engine || '',
    color: apiConstructor.color || '#000000',
    logo: apiConstructor.logoUrl || apiConstructor.logo,
    stats: {
      wins: apiConstructor.totalWins || 0,
      podiums: apiConstructor.totalPodiums || 0,
      poles: apiConstructor.totalPoles || 0,
      titles: apiConstructor.championships || 0,
    },
  };
}

// Transform API session response to match expected Session type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformSession(apiSession: any): Session {
  return {
    id: apiSession.id,
    raceId: apiSession.raceId || '',
    type: apiSession.type as SessionType,
    dateTime: extractDate(apiSession.dateTime) || new Date(),
    channel: apiSession.canalPlusChannel || undefined,
    isLive: apiSession.isLive ?? true,
    completed: apiSession.completed || false,
    results: apiSession.resultsJson ? transformSessionResults(apiSession.resultsJson, apiSession.type) : undefined,
  };
}

// Transform resultsJson to SessionResults
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformSessionResults(resultsJson: any, sessionType: string): SessionResults | undefined {
  if (!resultsJson || !resultsJson.positions || !Array.isArray(resultsJson.positions)) {
    return undefined;
  }

  return {
    sessionType: sessionType as SessionType,
    positions: resultsJson.positions.map((pos: any) => ({
      position: pos.position,
      driverId: pos.driverId || '',
      driverCode: pos.driverCode || '',
      driverName: pos.driverName || '',
      constructorId: pos.constructorId || '',
      constructorName: pos.constructorName || '',
      time: pos.time,
      laps: pos.laps,
      points: pos.points,
      status: pos.status,
      fastestLap: pos.fastestLap || false,
      gridPosition: pos.gridPosition,
    })),
    polePosition: resultsJson.polePosition,
    fastestLap: resultsJson.fastestLap,
    weather: resultsJson.weather,
    trackStatus: resultsJson.trackStatus,
  };
}

// Transform API race response to match expected Race type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRace(apiRace: any): Race {
  return {
    id: apiRace.id,
    season: apiRace.season,
    round: apiRace.round,
    name: apiRace.name,
    circuitId: apiRace.circuit?.id || apiRace.circuitId || '',
    date: extractDate(apiRace.date) || new Date(),
    hasSprint: apiRace.hasSprint || false,
    country: apiRace.circuit?.country || '',
    sessions: (apiRace.sessions || []).map(transformSession),
    // Include resultsJson for race results display
    resultsJson: apiRace.resultsJson || null,
  };
}

// ============================================
// Driver Results Hook (Race History & Career Info)
// ============================================

interface DriverResultsResponse {
  driverId: string;
  ergastId: string;
  results: Array<{
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
  }>;
  careerInfo: {
    firstWin?: { raceName: string; season: number };
    firstPole?: { raceName: string; season: number };
    firstRace?: { raceName: string; season: number };
    lastWin?: { raceName: string; season: number };
    bestFinish: number;
    totalRacesFinished: number;
    totalRaces: number;
    totalDNFs: number;
  };
}

export function useDriverResults(driverId: string, limit: number = 10) {
  return useQuery<DriverResultsResponse>({
    queryKey: [...queryKeys.driverResults(driverId), limit],
    queryFn: () => fetchAPI<DriverResultsResponse>(`/api/drivers/${driverId}/results?limit=${limit}`),
    enabled: !!driverId,
    staleTime: 10 * 60 * 1000, // 10 minutes - historical data doesn't change often
  });
}

// ============================================
// Driver Hooks
// ============================================

export function useDrivers() {
  return useQuery<Driver[]>({
    queryKey: queryKeys.drivers,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawDrivers = await fetchAPI<any[]>("/api/drivers", "drivers");
      return rawDrivers.map(transformDriver);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDriver(id: string) {
  return useQuery<Driver>({
    queryKey: queryKeys.driver(id),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawDriver = await fetchAPI<any>(`/api/drivers/${id}`);
      return transformDriver(rawDriver);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Constructor Hooks
// ============================================

export function useConstructors() {
  return useQuery<Constructor[]>({
    queryKey: queryKeys.constructors,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawConstructors = await fetchAPI<any[]>("/api/constructors", "constructors");
      return rawConstructors.map(transformConstructor);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useConstructor(id: string) {
  return useQuery<Constructor>({
    queryKey: queryKeys.constructor(id),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawConstructor = await fetchAPI<any>(`/api/constructors/${id}`);
      return transformConstructor(rawConstructor);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Circuit Hooks
// ============================================

export function useCircuits() {
  return useQuery<Circuit[]>({
    queryKey: queryKeys.circuits,
    // Use all=true to get all circuits regardless of season
    queryFn: () => fetchAPI<Circuit[]>("/api/circuits?all=true", "circuits"),
    staleTime: 10 * 60 * 1000, // 10 minutes - circuits change rarely
  });
}

export function useCircuit(id: string) {
  return useQuery<Circuit>({
    queryKey: queryKeys.circuit(id),
    queryFn: () => fetchAPI<Circuit>(`/api/circuits/${id}`),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================
// Circuit History Hook (Database Cached)
// ============================================

export function useCircuitHistory(circuitId: string) {
  return useQuery<{ winners: HistoricalWinner[]; stats: CircuitStats; fullResults: FullRaceResult[]; fromCache?: boolean }>({
    queryKey: queryKeys.circuitHistory(circuitId),
    queryFn: async () => {
      // Use our API endpoint which handles DB caching
      const res = await fetch(`/api/circuits/${circuitId}/history`);
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }
      const json = await res.json();
      return json.data ?? json;
    },
    enabled: !!circuitId,
    staleTime: 60 * 60 * 1000, // 1 hour - API handles deeper caching
  });
}

// ============================================
// Calendar Hooks
// ============================================

export function useCalendar(season?: number) {
  // Default to 2026 season (current season)
  const targetSeason = season || 2026;

  return useQuery<Race[]>({
    queryKey: [...queryKeys.calendar, targetSeason],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawRaces = await fetchAPI<any[]>(`/api/calendar?season=${targetSeason}`, "races");
      return rawRaces.map(transformRace);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useNextRace() {
  return useQuery<Race | null>({
    queryKey: queryKeys.nextRace,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = await fetchAPI<any>("/api/calendar/next");
      // The API returns { nextSession: { race, ... }, upcomingRaces }
      if (!rawData || !rawData.nextSession?.race) return null;
      return transformRace(rawData.nextSession.race);
    },
    staleTime: 60 * 1000, // 1 minute - next race info can change
  });
}

// ============================================
// Standings Hooks
// ============================================

// Types matching API response for standings
interface StandingDriver {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  constructor?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
}

interface StandingConstructor {
  id: string;
  name: string;
  color?: string | null;
  logoUrl?: string | null;
}

export interface Standing {
  position: number;
  previousPosition?: number;
  driverId?: string;
  constructorId?: string;
  points: number;
  wins: number;
  poles?: number;
  driver?: StandingDriver;
  constructor?: StandingConstructor;
}

export function useDriverStandings(season?: number) {
  // Default to 2026 season (current season)
  const targetSeason = season || 2026;

  return useQuery<Standing[]>({
    queryKey: [...queryKeys.driverStandings, targetSeason],
    queryFn: () => fetchAPI<Standing[]>(`/api/standings/drivers?season=${targetSeason}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useConstructorStandings(season?: number) {
  // Default to 2026 season (current season)
  const targetSeason = season || 2026;

  return useQuery<Standing[]>({
    queryKey: [...queryKeys.constructorStandings, targetSeason],
    queryFn: () => fetchAPI<Standing[]>(`/api/standings/constructors?season=${targetSeason}`),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// News Hooks
// ============================================

interface NewsResponse {
  count: number;
  sources: string[];
  articles: NewsArticle[];
}

export function useNews(category: NewsCategory = "all") {
  return useQuery<NewsArticle[]>({
    queryKey: queryKeys.news(category),
    queryFn: async () => {
      const response = await fetchAPI<NewsResponse>(`/api/news?category=${category}&limit=50`);
      return response.articles;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
  });
}

export function useNewsWithSources(category: NewsCategory = "all") {
  return useQuery<NewsResponse>({
    queryKey: [...queryKeys.news(category), "with-sources"],
    queryFn: () => fetchAPI<NewsResponse>(`/api/news?category=${category}&limit=50`),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

// ============================================
// Combined Hook for Initial Load
// ============================================

export function useF1Data() {
  const driversQuery = useDrivers();
  const constructorsQuery = useConstructors();
  const circuitsQuery = useCircuits();
  const calendarQuery = useCalendar();
  const nextRaceQuery = useNextRace();
  const driverStandingsQuery = useDriverStandings();
  const constructorStandingsQuery = useConstructorStandings();

  const isLoading =
    driversQuery.isLoading ||
    constructorsQuery.isLoading ||
    circuitsQuery.isLoading ||
    calendarQuery.isLoading;

  const isError =
    driversQuery.isError ||
    constructorsQuery.isError ||
    circuitsQuery.isError ||
    calendarQuery.isError;

  return {
    drivers: driversQuery.data || [],
    constructors: constructorsQuery.data || [],
    circuits: circuitsQuery.data || [],
    races: calendarQuery.data || [],
    nextRace: nextRaceQuery.data || null,
    driverStandings: driverStandingsQuery.data || [],
    constructorStandings: constructorStandingsQuery.data || [],
    isLoading,
    isError,
    refetch: () => {
      driversQuery.refetch();
      constructorsQuery.refetch();
      circuitsQuery.refetch();
      calendarQuery.refetch();
      nextRaceQuery.refetch();
      driverStandingsQuery.refetch();
      constructorStandingsQuery.refetch();
    },
  };
}

// ============================================
// Read Articles Hooks
// ============================================

interface ReadArticlesResponse {
  readUrls: string[];
  readArticles: { articleUrl: string; readAt: string }[];
}

export function useReadArticles() {
  return useQuery<string[]>({
    queryKey: ["news", "read"],
    queryFn: async () => {
      const response = await fetchAPI<ReadArticlesResponse>("/api/news/read");
      return response.readUrls;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useMarkArticleRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (articleUrl: string) => {
      const response = await fetch("/api/news/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleUrl }),
      });
      if (!response.ok) throw new Error("Failed to mark article as read");
      return response.json();
    },
    onMutate: async (articleUrl) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["news", "read"] });
      const previousReadUrls = queryClient.getQueryData<string[]>(["news", "read"]);
      
      queryClient.setQueryData<string[]>(["news", "read"], (old) => {
        if (!old) return [articleUrl];
        if (old.includes(articleUrl)) return old;
        return [...old, articleUrl];
      });
      
      return { previousReadUrls };
    },
    onError: (_err, _articleUrl, context) => {
      // Rollback on error
      if (context?.previousReadUrls) {
        queryClient.setQueryData(["news", "read"], context.previousReadUrls);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["news", "read"] });
    },
  });
}