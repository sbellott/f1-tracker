/**
 * Hook for fetching race results with predictions
 * Used by ResultsModal for displaying predicted vs actual results
 */

import { useQuery } from "@tanstack/react-query";

// Types matching the API response
interface DriverResult {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  constructor: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

interface RaceResultPosition {
  position: number;
  driver: DriverResult;
}

interface PredictionResponse {
  userId: string;
  pseudo: string;
  avatar: string | null;
  topTen: { driverId: string; position: number }[];
  pole: string | null;
  fastestLap: string | null;
  score: number | null;
  pointsBreakdown: unknown;
}

interface NewBadge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

interface RaceResultsResponse {
  race: {
    id: string;
    name: string;
    round: number;
    season: number;
    date: string;
    circuit: {
      id: string;
      name: string;
      country: string;
      city: string;
    };
  };
  results: RaceResultPosition[];
  poleDriver: DriverResult | null;
  fastestLapDriver: DriverResult | null;
  userPrediction: PredictionResponse | null;
  opponentPrediction: PredictionResponse | null;
  newBadges: NewBadge[];
  drivers: DriverResult[];
}

async function fetchRaceResults(
  raceId: string,
  opponentId?: string
): Promise<RaceResultsResponse> {
  const params = new URLSearchParams();
  if (opponentId) {
    params.set("opponentId", opponentId);
  }

  const url = `/api/races/${raceId}/results${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Erreur lors du chargement des résultats");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch race results with predictions
 */
export function useRaceResults(raceId: string | null, opponentId?: string) {
  return useQuery({
    queryKey: ["race-results", raceId, opponentId],
    queryFn: () => fetchRaceResults(raceId!, opponentId),
    enabled: !!raceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to check if a race has results available
 */
export function useHasRaceResults(raceId: string | null) {
  const { data, isLoading, error } = useRaceResults(raceId);
  return {
    hasResults: !!data?.results?.length,
    isLoading,
    error,
  };
}
