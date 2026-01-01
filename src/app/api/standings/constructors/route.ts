import { NextRequest } from "next/server";
import { z } from "zod";
import { apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { getConstructorStandings } from "@/lib/services/standings.service";

const querySchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100).optional(),
});

/**
 * GET /api/standings/constructors
 * Get constructor championship standings
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const query = querySchema.parse(searchParams);

  const result = await getConstructorStandings(query.season);

  // Cache for 1 hour
  return apiCached(result, 3600);
});
