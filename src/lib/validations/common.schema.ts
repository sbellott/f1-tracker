import { z } from "zod";

// ============================================
// Common ID Schemas
// ============================================

export const cuidSchema = z.string().cuid();

export const idParamSchema = z.object({
  id: cuidSchema,
});

// ============================================
// Pagination Schemas
// ============================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CursorPaginationQuery = z.infer<typeof cursorPaginationSchema>;

// ============================================
// Season Schemas
// ============================================

const currentYear = new Date().getFullYear();

export const seasonSchema = z.coerce
  .number()
  .int()
  .min(1950)
  .max(currentYear + 1)
  .default(currentYear);

export const seasonQuerySchema = z.object({
  season: seasonSchema,
});

export type SeasonQuery = z.infer<typeof seasonQuerySchema>;

// ============================================
// F1-Specific Schemas
// ============================================

export const driverCodeSchema = z
  .string()
  .length(3)
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Code pilote invalide (3 lettres)");

export const raceRoundSchema = z.coerce.number().int().min(1).max(24);

export const sessionTypeSchema = z.enum([
  "FP1",
  "FP2",
  "FP3",
  "SPRINT_QUALIFYING",
  "SPRINT",
  "QUALIFYING",
  "RACE",
]);

export type SessionType = z.infer<typeof sessionTypeSchema>;

// ============================================
// Sorting & Filtering
// ============================================

export const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");

export type SortOrder = z.infer<typeof sortOrderSchema>;

export const standingsQuerySchema = z.object({
  season: seasonSchema,
  round: raceRoundSchema.optional(),
});

export type StandingsQuery = z.infer<typeof standingsQuerySchema>;

// ============================================
// Date Schemas
// ============================================

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)");

export const dateTimeSchema = z.coerce.date();

// ============================================
// Helper Functions
// ============================================

/**
 * Parse query params from URLSearchParams
 */
export function parseQueryParams<T extends z.ZodTypeAny>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return schema.parse(params);
}

/**
 * Parse route params
 */
export function parseRouteParams<T extends z.ZodTypeAny>(
  schema: T,
  params: Record<string, string | string[] | undefined>
): z.infer<T> {
  return schema.parse(params);
}

/**
 * Calculate pagination offset
 */
export function getPaginationOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
