import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import {
  getCircuits,
  getSeasonCircuits,
  searchCircuits,
} from "@/lib/services/circuits.service";

const querySchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100).optional(),
  search: z.string().optional(),
  all: z.enum(["true", "false"]).optional(),
});

/**
 * GET /api/circuits
 * Get circuits
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const query = querySchema.parse(searchParams);

  // If search query provided, search circuits
  if (query.search) {
    const circuits = await searchCircuits(query.search);
    return apiCached({ circuits, count: circuits.length }, 86400);
  }

  // If all=true, get all circuits
  if (query.all === "true") {
    const circuits = await getCircuits();
    return apiCached({ circuits, count: circuits.length }, 86400);
  }

  // Get circuits for season
  const circuits = await getSeasonCircuits(query.season);

  return apiCached(
    {
      season: query.season || new Date().getFullYear(),
      circuits,
      count: circuits.length,
    },
    86400
  );
});
