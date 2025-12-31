import { apiSuccess } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { getNextSession, getUpcomingRaces } from "@/lib/services/calendar.service";

/**
 * GET /api/calendar/next
 * Get the next upcoming session and race info
 */
export const GET = withErrorHandler(async () => {
  const [nextSession, upcomingRaces] = await Promise.all([
    getNextSession(),
    getUpcomingRaces(3),
  ]);

  return apiSuccess({
    nextSession,
    upcomingRaces,
  });
});
