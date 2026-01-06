import { NextRequest } from "next/server";
import { z } from "zod";
import { apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { ApiError } from "@/lib/errors/api-error";
import { getDriverById, getDriverRaceResults, getDriverCareerInfo } from "@/lib/services/drivers.service";

interface RouteContext {
  params: Promise<{ driverId: string }>;
}

const querySchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * GET /api/drivers/[driverId]/results
 * Get driver's race results and career info
 */
export const GET = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const { driverId } = await context.params;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    // First get driver to find their ergastId
    const driver = await getDriverById(driverId);

    if (!driver) {
      throw ApiError.notFound("Driver not found");
    }

    // Fetch results and career info in parallel
    const [results, careerInfo] = await Promise.all([
      getDriverRaceResults(driver.ergastId, query.season, query.limit),
      getDriverCareerInfo(driver.ergastId),
    ]);

    return apiCached({
      driverId,
      ergastId: driver.ergastId,
      results,
      careerInfo,
    }, 3600); // Cache for 1 hour
  }
);
