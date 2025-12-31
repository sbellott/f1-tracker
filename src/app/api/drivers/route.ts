import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { getDrivers, searchDrivers } from "@/lib/services/drivers.service";

const querySchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100).optional(),
  search: z.string().optional(),
});

/**
 * GET /api/drivers
 * Get all drivers for a season
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const query = querySchema.parse(searchParams);

  // If search query provided, search drivers
  if (query.search) {
    const drivers = await searchDrivers(query.search);
    return apiCached({ drivers, count: drivers.length }, 3600);
  }

  // Get all drivers for season
  const drivers = await getDrivers(query.season);

  return apiCached(
    {
      season: query.season || new Date().getFullYear(),
      drivers,
      count: drivers.length,
    },
    3600
  );
});
