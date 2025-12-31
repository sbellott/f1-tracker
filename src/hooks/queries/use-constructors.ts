"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  ConstructorListItem,
  ConstructorDetail,
} from "@/lib/services/constructors.service";

// ============================================
// Types
// ============================================

interface ConstructorsResponse {
  season: number;
  constructors: ConstructorListItem[];
  count: number;
}

interface ConstructorResponse {
  constructor: ConstructorDetail;
}

// ============================================
// API Functions
// ============================================

async function fetchConstructors(season?: number): Promise<ConstructorsResponse> {
  const params = season ? `?season=${season}` : "";
  const response = await fetch(`/api/constructors${params}`);

  if (!response.ok) throw new Error("Failed to fetch constructors");

  const json = await response.json();
  return json.data;
}

async function fetchConstructor(
  constructorId: string,
  season?: number
): Promise<ConstructorResponse> {
  const params = season ? `?season=${season}` : "";
  const response = await fetch(`/api/constructors/${constructorId}${params}`);

  if (!response.ok) throw new Error("Failed to fetch constructor");

  const json = await response.json();
  return json.data;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch all constructors for a season
 */
export function useConstructors(season?: number) {
  return useQuery({
    queryKey: ["constructors", season],
    queryFn: () => fetchConstructors(season),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Hook to fetch a single constructor with details
 */
export function useConstructor(constructorId: string, season?: number) {
  return useQuery({
    queryKey: ["constructors", constructorId, season],
    queryFn: () => fetchConstructor(constructorId, season),
    enabled: !!constructorId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
