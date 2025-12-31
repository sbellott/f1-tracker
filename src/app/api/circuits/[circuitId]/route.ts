import { NextRequest } from "next/server";
import { apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { ApiError } from "@/lib/errors/api-error";
import { getCircuitById } from "@/lib/services/circuits.service";

interface RouteContext {
  params: Promise<{ circuitId: string }>;
}

/**
 * GET /api/circuits/[circuitId]
 * Get circuit details
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, context: RouteContext) => {
    const { circuitId } = await context.params;

    const circuit = await getCircuitById(circuitId);

    if (!circuit) {
      throw ApiError.notFound("Circuit non trouvé");
    }

    return apiCached(circuit, 86400);
  }
);
