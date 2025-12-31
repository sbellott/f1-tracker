import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { ApiError } from "@/lib/errors/api-error";
import { getConstructorById } from "@/lib/services/constructors.service";

interface RouteContext {
  params: Promise<{ constructorId: string }>;
}

const querySchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100).optional(),
});

/**
 * GET /api/constructors/[constructorId]
 * Get constructor details
 */
export const GET = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const { constructorId } = await context.params;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    const constructor = await getConstructorById(constructorId, query.season);

    if (!constructor) {
      throw ApiError.notFound("Écurie non trouvée");
    }

    return apiCached(constructor, 3600);
  }
);
