import { NextRequest } from "next/server";
import { z } from "zod";
import { apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { ApiError } from "@/lib/errors/api-error";
import { getDriverById } from "@/lib/services/drivers.service";

interface RouteContext {
  params: Promise<{ driverId: string }>;
}

const querySchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100).optional(),
});

/**
 * GET /api/drivers/[driverId]
 * Get driver details
 */
export const GET = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const { driverId } = await context.params;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    const driver = await getDriverById(driverId);

    if (!driver) {
      throw ApiError.notFound("Driver not found");
    }

    return apiCached(driver, 3600);
  }
);