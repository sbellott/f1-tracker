import { NextRequest } from "next/server";
import { apiSuccess, apiNoContent } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import { ApiError } from "@/lib/errors/api-error";
import { prisma } from "@/lib/db/prisma";
import { predictionSchema } from "@/lib/validations/predictions.schema";
import {
  upsertPrediction,
  deletePrediction,
} from "@/lib/services/predictions.service";

interface RouteContext {
  params: Promise<{ predictionId: string }>;
}

/**
 * GET /api/predictions/[predictionId]
 * Get a specific prediction
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, context: RouteContext) => {
    const user = await requireAuth();
    const { predictionId } = await context.params;

    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
      include: {
        race: {
          include: {
            circuit: {
              select: {
                name: true,
                country: true,
              },
            },
          },
        },
      },
    });

    if (!prediction) {
      throw ApiError.notFound("Pronostic non trouvé");
    }

    // Verify ownership
    if (prediction.userId !== user.id) {
      throw ApiError.forbidden("Accès refusé");
    }

    return apiSuccess(prediction);
  }
);

/**
 * PUT /api/predictions/[predictionId]
 * Update a prediction
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const user = await requireAuth();
    const { predictionId } = await context.params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.prediction.findUnique({
      where: { id: predictionId },
      select: { userId: true, raceId: true },
    });

    if (!existing) {
      throw ApiError.notFound("Pronostic non trouvé");
    }

    if (existing.userId !== user.id) {
      throw ApiError.forbidden("Accès refusé");
    }

    const data = predictionSchema.parse({
      ...body,
      raceId: existing.raceId,
    });

    const prediction = await upsertPrediction({
      userId: user.id,
      raceId: existing.raceId,
      topTen: data.topTen,
      polePosition: data.polePosition ?? null,
      fastestLap: data.fastestLap ?? null,
    });

    return apiSuccess(prediction);
  }
);

/**
 * DELETE /api/predictions/[predictionId]
 * Delete a prediction
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, context: RouteContext) => {
    const user = await requireAuth();
    const { predictionId } = await context.params;

    await deletePrediction(predictionId, user.id);

    return apiNoContent();
  }
);