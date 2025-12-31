"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  DriverStanding,
  ConstructorStanding,
  StandingsMetadata,
} from "@/lib/services/standings.service";

// ============================================
// Types
// ============================================

interface DriverStandingsResponse {
  standings: DriverStanding[];
  metadata: StandingsMetadata;
}

interface ConstructorStandingsResponse {
  standings: ConstructorStanding[];
  metadata: StandingsMetadata;
}

// ============================================
// API Functions
// ============================================

async function fetchDriverStandings(
  season?: number
): Promise<DriverStandingsResponse> {
  const params = season ? `?season=${season}` : "";
  const response = await fetch(`/api/standings/drivers${params}`);

  if (!response.ok) throw new Error("Failed to fetch driver standings");

  const json = await response.json();
  return json.data;
}

async function fetchConstructorStandings(
  season?: number
): Promise<ConstructorStandingsResponse> {
  const params = season ? `?season=${season}` : "";
  const response = await fetch(`/api/standings/constructors${params}`);

  if (!response.ok) throw new Error("Failed to fetch constructor standings");

  const json = await response.json();
  return json.data;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch driver standings
 */
export function useDriverStandings(season?: number) {
  return useQuery({
    queryKey: ["standings", "drivers", season],
    queryFn: () => fetchDriverStandings(season),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to fetch constructor standings
 */
export function useConstructorStandings(season?: number) {
  return useQuery({
    queryKey: ["standings", "constructors", season],
    queryFn: () => fetchConstructorStandings(season),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to fetch both standings at once
 */
export function useStandings(season?: number) {
  const driverQuery = useDriverStandings(season);
  const constructorQuery = useConstructorStandings(season);

  return {
    drivers: driverQuery,
    constructors: constructorQuery,
    isLoading: driverQuery.isLoading || constructorQuery.isLoading,
    isError: driverQuery.isError || constructorQuery.isError,
  };
}
