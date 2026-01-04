"use client";

import { useQuery } from "@tanstack/react-query";
import type { Driver, Constructor, Circuit, Race, Session, SessionResults, SessionType } from "@/types";
import type { HistoricalWinner, CircuitStats, FullRaceResult } from "@/lib/services/circuit-history.service";

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
  drivers: ["drivers"] as const,
  driver: (id: string) => ["drivers", id] as const,
  constructors: ["constructors"] as const,
  constructor: (id: string) => ["constructors", id] as const,
  circuits: ["circuits"] as const,
  circuit: (id: string) => ["circuits", id] as const,
  circuitHistory: (id: string) => ["circuits", id, "history"] as const,
  calendar: ["calendar"] as const,
  nextRace: ["calendar", "next"] as const,
  driverStandings: ["standings", "drivers"] as const,
  constructorStandings: ["standings", "constructors"] as const,
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
    dateOfBirth: apiDriver.dateOfBirth ? new Date(apiDriver.dateOfBirth) : new Date(),
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
    logo: apiConstructor.logo,
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
    dateTime: new Date(apiSession.dateTime),
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
    date: new Date(apiRace.date),
    hasSprint: apiRace.hasSprint || false,
    country: apiRace.circuit?.country || '',
    sessions: (apiRace.sessions || []).map(transformSession),
  };
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
      if (!rawData || !rawData.race) return null;
      return transformRace(rawData.race);
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