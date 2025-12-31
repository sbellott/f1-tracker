"use client";

import { useQuery } from "@tanstack/react-query";
import type { DriverListItem, DriverDetail } from "@/lib/services/drivers.service";

// ============================================
// Types
// ============================================

interface DriversResponse {
  season: number;
  drivers: DriverListItem[];
  count: number;
}

interface DriverResponse {
  driver: DriverDetail;
}

// ============================================
// API Functions
// ============================================

async function fetchDrivers(season?: number): Promise<DriversResponse> {
  const params = season ? `?season=${season}` : "";
  const response = await fetch(`/api/drivers${params}`);

  if (!response.ok) throw new Error("Failed to fetch drivers");

  const json = await response.json();
  return json.data;
}

async function fetchDriver(
  driverId: string,
  season?: number
): Promise<DriverResponse> {
  const params = season ? `?season=${season}` : "";
  const response = await fetch(`/api/drivers/${driverId}${params}`);

  if (!response.ok) throw new Error("Failed to fetch driver");

  const json = await response.json();
  return json.data;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch all drivers for a season
 */
export function useDrivers(season?: number) {
  return useQuery({
    queryKey: ["drivers", season],
    queryFn: () => fetchDrivers(season),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Hook to fetch a single driver with details
 */
export function useDriver(driverId: string, season?: number) {
  return useQuery({
    queryKey: ["drivers", driverId, season],
    queryFn: () => fetchDriver(driverId, season),
    enabled: !!driverId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
