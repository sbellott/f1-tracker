import { z } from "zod/v4";

/**
 * Schema for creating/updating a prediction
 */
export const predictionSchema = z.object({
  raceId: z.string().cuid(),
  positions: z
    .array(z.string().cuid())
    .length(10, "Vous devez sélectionner exactement 10 pilotes"),
  pole: z.string().cuid().nullable().optional(),
  fastestLap: z.string().cuid().nullable().optional(),
});

export type PredictionInput = z.infer<typeof predictionSchema>;

/**
 * Schema for querying predictions
 */
export const predictionQuerySchema = z.object({
  raceId: z.string().cuid().optional(),
  season: z.coerce.number().int().min(1950).max(2100).optional(),
  groupId: z.string().cuid().optional(),
});

export type PredictionQueryInput = z.infer<typeof predictionQuerySchema>;

/**
 * Schema for prediction response
 */
export const predictionResponseSchema = z.object({
  id: z.string().cuid(),
  raceId: z.string().cuid(),
  userId: z.string().cuid(),
  positions: z.array(z.string()),
  pole: z.string().nullable(),
  fastestLap: z.string().nullable(),
  points: z.number().nullable(),
  scored: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for group prediction submission
 */
export const groupPredictionSchema = z.object({
  groupId: z.string().cuid(),
  raceId: z.string().cuid(),
  positions: z
    .array(z.string().cuid())
    .length(10, "Vous devez sélectionner exactement 10 pilotes"),
  pole: z.string().cuid().nullable().optional(),
  fastestLap: z.string().cuid().nullable().optional(),
});

export type GroupPredictionInput = z.infer<typeof groupPredictionSchema>;
