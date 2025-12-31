"use client";

import { useQuery } from "@tanstack/react-query";
import type { RaceWithSessions, NextSession } from "@/lib/services/calendar.service";

// ============================================
// Types
// ============================================

interface CalendarResponse {
  season: number;
  totalRaces: number;
  races: RaceWithSessions[];
}

interface NextSessionResponse {
  nextSession: NextSession | null;
  upcomingRaces: RaceWithSessions[];
}

interface CalendarFilters {
  season?: number;
  upcoming?: boolean;
  hasSprint?: boolean;
}

// ============================================
// API Functions
// ============================================

async function fetchCalendar(filters: CalendarFilters = {}): Promise<CalendarResponse> {
  const params = new URLSearchParams();

  if (filters.season) params.set("season", String(filters.season));
  if (filters.upcoming) params.set("upcoming", "true");
  if (filters.hasSprint !== undefined) {
    params.set("hasSprint", String(filters.hasSprint));
  }

  const response = await fetch(`/api/calendar?${params}`);
  if (!response.ok) throw new Error("Failed to fetch calendar");

  const json = await response.json();
  return json.data;
}

async function fetchNextSession(): Promise<NextSessionResponse> {
  const response = await fetch("/api/calendar/next");
  if (!response.ok) throw new Error("Failed to fetch next session");

  const json = await response.json();
  return json.data;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch the season calendar
 */
export function useCalendar(filters: CalendarFilters = {}) {
  return useQuery({
    queryKey: ["calendar", filters],
    queryFn: () => fetchCalendar(filters),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to fetch the next session and upcoming races
 */
export function useNextSession() {
  return useQuery({
    queryKey: ["calendar", "next"],
    queryFn: fetchNextSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

/**
 * Hook to fetch upcoming races only
 */
export function useUpcomingRaces() {
  const query = useNextSession();

  return {
    ...query,
    data: query.data?.upcomingRaces,
  };
}
