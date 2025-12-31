"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PredictionWithDetails } from "@/lib/services/predictions.service";

// ============================================
// Types
// ============================================

interface PredictionStats {
  totalPoints: number;
  predictionsCount: number;
  averagePoints: number;
  bestResult: number | null;
  perfectPredictions: number;
}

interface PredictionsResponse {
  predictions: PredictionWithDetails[];
  stats: PredictionStats;
  count: number;
}

interface CreatePredictionInput {
  raceId: string;
  positions: string[];
  pole?: string | null;
  fastestLap?: string | null;
}

// ============================================
// API Functions
// ============================================

async function fetchPredictions(season?: number): Promise<PredictionsResponse> {
  const params = season ? `?season=${season}` : "";
  const response = await fetch(`/api/predictions${params}`);

  if (!response.ok) throw new Error("Failed to fetch predictions");

  const json = await response.json();
  return json.data;
}

async function fetchPrediction(
  raceId: string,
  groupId?: string
): Promise<{ prediction: PredictionWithDetails | null }> {
  const params = new URLSearchParams({ raceId });
  if (groupId) params.set("groupId", groupId);

  const response = await fetch(`/api/predictions?${params}`);

  if (!response.ok) throw new Error("Failed to fetch prediction");

  const json = await response.json();
  return json.data;
}

async function createPrediction(
  input: CreatePredictionInput
): Promise<PredictionWithDetails> {
  const response = await fetch("/api/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create prediction");
  }

  const json = await response.json();
  return json.data;
}

async function updatePrediction(
  predictionId: string,
  input: Omit<CreatePredictionInput, "raceId">
): Promise<PredictionWithDetails> {
  const response = await fetch(`/api/predictions/${predictionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update prediction");
  }

  const json = await response.json();
  return json.data;
}

async function deletePrediction(predictionId: string): Promise<void> {
  const response = await fetch(`/api/predictions/${predictionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to delete prediction");
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch all user predictions
 */
export function usePredictions(season?: number) {
  return useQuery({
    queryKey: ["predictions", season],
    queryFn: () => fetchPredictions(season),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single prediction for a race
 */
export function usePrediction(raceId: string, groupId?: string) {
  return useQuery({
    queryKey: ["predictions", "race", raceId, groupId],
    queryFn: () => fetchPrediction(raceId, groupId),
    enabled: !!raceId,
  });
}

/**
 * Hook to create/update a prediction
 */
export function useCreatePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
  });
}

/**
 * Hook to update a prediction
 */
export function useUpdatePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      predictionId,
      ...input
    }: { predictionId: string } & Omit<CreatePredictionInput, "raceId">) =>
      updatePrediction(predictionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
  });
}

/**
 * Hook to delete a prediction
 */
export function useDeletePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
  });
}
