import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { getSeasonCalendar } from "@/lib/services/calendar.service";

const querySchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100).optional(),
  upcoming: z.enum(["true", "false"]).optional(),
  hasSprint: z.enum(["true", "false"]).optional(),
});

/**
 * GET /api/calendar
 * Get the race calendar for a season
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const query = querySchema.parse(searchParams);

  const calendar = await getSeasonCalendar({
    season: query.season,
    upcoming: query.upcoming === "true",
    hasSprint: query.hasSprint ? query.hasSprint === "true" : undefined,
  });

  // Cache for 1 hour
  return apiCached(
    {
      season: query.season || new Date().getFullYear(),
      totalRaces: calendar.length,
      races: calendar,
    },
    3600
  );
});
