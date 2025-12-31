"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  CircuitListItem,
  CircuitDetail,
} from "@/lib/services/circuits.service";

// ============================================
// Types
// ============================================

interface CircuitsResponse {
  season: number;
  circuits: CircuitListItem[];
  count: number;
}

interface CircuitResponse {
  circuit: CircuitDetail;
}

// ============================================
// API Functions
// ============================================

async function fetchCircuits(season?: number): Promise<CircuitsResponse> {
  const params = season ? `?season=${season}` : "";
  const response = await fetch(`/api/circuits${params}`);

  if (!response.ok) throw new Error("Failed to fetch circuits");

  const json = await response.json();
  return json.data;
}

async function fetchCircuit(circuitId: string): Promise<CircuitResponse> {
  const response = await fetch(`/api/circuits/${circuitId}`);

  if (!response.ok) throw new Error("Failed to fetch circuit");

  const json = await response.json();
  return json.data;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch all circuits for a season
 */
export function useCircuits(season?: number) {
  return useQuery({
    queryKey: ["circuits", season],
    queryFn: () => fetchCircuits(season),
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Hook to fetch a single circuit with details
 */
export function useCircuit(circuitId: string) {
  return useQuery({
    queryKey: ["circuits", circuitId],
    queryFn: () => fetchCircuit(circuitId),
    enabled: !!circuitId,
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}
