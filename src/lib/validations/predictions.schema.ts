import { z } from 'zod';

export const sessionTypeSchema = z.enum(['FP1', 'FP2', 'FP3', 'SPRINT_QUALIFYING', 'SPRINT', 'QUALIFYING', 'RACE']);

export const createPredictionSchema = z.object({
  raceId: z.string().cuid('Invalid race ID'),
  sessionType: sessionTypeSchema.default('RACE'),
  topTen: z
    .array(z.string())
    .length(10, 'Must predict exactly 10 drivers')
    .refine((arr) => new Set(arr).size === arr.length, 'Duplicate drivers not allowed'),
  polePosition: z.string().optional(),
  fastestLap: z.string().optional(),
});

// Alias for route compatibility
export const predictionSchema = createPredictionSchema;

// Query schema for GET requests
export const predictionQuerySchema = z.object({
  raceId: z.string().optional(),
  sessionType: sessionTypeSchema.optional(),
  season: z.coerce.number().int().min(2020).max(2030).optional(),
});

export const updatePredictionSchema = z.object({
  topTen: z
    .array(z.string())
    .length(10, 'Must predict exactly 10 drivers')
    .refine((arr) => new Set(arr).size === arr.length, 'Duplicate drivers not allowed')
    .optional(),
  polePosition: z.string().optional().nullable(),
  fastestLap: z.string().optional().nullable(),
});

export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;
export type UpdatePredictionInput = z.infer<typeof updatePredictionSchema>;
export type PredictionQuery = z.infer<typeof predictionQuerySchema>;