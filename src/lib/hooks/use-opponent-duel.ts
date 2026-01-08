/**
 * Hook for fetching opponent duel statistics
 * Used by PredictionsModule to display duel view with pinned opponent
 */

import { useQuery } from "@tanstack/react-query";
import { useResultsStore, type DuelOpponent } from "@/lib/stores/results-store";

// ============================================
// Types
// ============================================

interface DuelPrediction {
  id: string;
  createdAt: Date;
  userId: string;
  raceId: string;
  raceName: string;
  raceDate: Date;
  round: number;
  season: number;
  sessionType: string;
  topTen: string[];
  pole: string | null;
  fastestLap: string | null;
  points: number | null;
  pointsBreakdown: Record<string, number> | null;
}

interface DuelOpponentData {
  id: string;
  email: string;
  pseudo: string;
  avatar: string | null;
  createdAt: Date;
  groupId: string | null;
  groupName: string | null;
}

interface DuelResponse {
  opponent: DuelOpponentData | null;
  userPredictions: DuelPrediction[];
  opponentPredictions: DuelPrediction[];
}

// ============================================
// API Function
// ============================================

async function fetchDuelData(
  opponentId?: string | null,
  groupId?: string | null
): Promise<DuelResponse> {
  const params = new URLSearchParams();
  if (opponentId) params.set("opponentId", opponentId);
  if (groupId) params.set("groupId", groupId);

  const url = `/api/duel${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch duel data");
  }

  const json = await response.json();
  return json.data;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to get pinned opponent from store
 */
export function usePinnedOpponent() {
  const { pinnedOpponent, setPinnedOpponent, addRecentOpponent } = useResultsStore();
  return { pinnedOpponent, setPinnedOpponent, addRecentOpponent };
}

/**
 * Hook to fetch duel data - uses pinned opponent if available, falls back to legacy mode
 */
export function useDuelData() {
  const { pinnedOpponent } = useResultsStore();

  return useQuery({
    queryKey: ["duel-data", pinnedOpponent?.id, pinnedOpponent?.groupId],
    queryFn: () => fetchDuelData(pinnedOpponent?.id, pinnedOpponent?.groupId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch duel data for a specific opponent (without using store)
 */
export function useDuelDataForOpponent(opponentId: string | null, groupId: string | null) {
  return useQuery({
    queryKey: ["duel-data", opponentId, groupId],
    queryFn: () => fetchDuelData(opponentId, groupId),
    enabled: !!opponentId && !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Helper to calculate duel statistics from predictions
 */
export function calculateDuelStats(
  userPredictions: DuelPrediction[],
  opponentPredictions: DuelPrediction[]
) {
  const userTotalPoints = userPredictions.reduce((sum, p) => sum + (p.points || 0), 0);
  const opponentTotalPoints = opponentPredictions.reduce((sum, p) => sum + (p.points || 0), 0);
  
  // Build maps for race comparison
  const userMap = new Map(userPredictions.map(p => [p.raceId, p.points || 0]));
  const opponentMap = new Map(opponentPredictions.map(p => [p.raceId, p.points || 0]));
  
  // Calculate wins
  let userWins = 0;
  let opponentWins = 0;
  let ties = 0;
  
  const allRaceIds = new Set([...userMap.keys(), ...opponentMap.keys()]);
  allRaceIds.forEach(raceId => {
    const userPoints = userMap.get(raceId) ?? 0;
    const oppPoints = opponentMap.get(raceId) ?? 0;
    if (userPoints > oppPoints) userWins++;
    else if (oppPoints > userPoints) opponentWins++;
    else ties++;
  });

  return {
    userTotalPoints,
    opponentTotalPoints,
    pointsDiff: userTotalPoints - opponentTotalPoints,
    userWins,
    opponentWins,
    ties,
    userPredictionCount: userPredictions.length,
    opponentPredictionCount: opponentPredictions.length,
    userAveragePoints: userPredictions.length > 0 
      ? Math.round(userTotalPoints / userPredictions.length) 
      : 0,
    opponentAveragePoints: opponentPredictions.length > 0 
      ? Math.round(opponentTotalPoints / opponentPredictions.length) 
      : 0,
  };
}