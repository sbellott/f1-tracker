import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().cuid('Invalid ID'),
});

export const seasonSchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100).optional(),
});

export const roundSchema = z.object({
  round: z.coerce.number().int().min(1).max(30).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type SeasonInput = z.infer<typeof seasonSchema>;
export type RoundInput = z.infer<typeof roundSchema>;
