import { NextRequest } from "next/server";
import { z } from "zod";
import { apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { getConstructors } from "@/lib/services/constructors.service";

const querySchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100).optional(),
});

/**
 * GET /api/constructors
 * Get all constructors for a season
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const query = querySchema.parse(searchParams);

  const constructors = await getConstructors(query.season);

  return apiCached(
    {
      season: query.season || new Date().getFullYear(),
      constructors,
      count: constructors.length,
    },
    3600
  );
});
