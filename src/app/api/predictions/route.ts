import { NextRequest } from "next/server";
import { apiSuccess, apiCreated } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import {
  predictionSchema,
  predictionQuerySchema,
} from "@/lib/validations/predictions.schema";
import {
  upsertPrediction,
  getUserPredictions,
  getUserPrediction,
  getUserStats,
} from "@/lib/services/predictions.service";

/**
 * GET /api/predictions
 * Get user's predictions
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth();

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const query = predictionQuerySchema.parse(searchParams);

  // If raceId provided, get specific prediction
  if (query.raceId) {
    const prediction = await getUserPrediction(
      user.id,
      query.raceId,
      query.groupId
    );

    return apiSuccess({
      prediction,
    });
  }

  // Get all predictions for season
  const [predictions, stats] = await Promise.all([
    getUserPredictions(user.id, query.season),
    getUserStats(user.id, query.season),
  ]);

  return apiSuccess({
    predictions,
    stats,
    count: predictions.length,
  });
});

/**
 * POST /api/predictions
 * Create or update a prediction
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth();
  const body = await request.json();

  const data = predictionSchema.parse(body);

  const prediction = await upsertPrediction({
    userId: user.id,
    groupId: data.groupId,
    raceId: data.raceId,
    topTen: data.topTen,
    polePosition: data.polePosition ?? null,
    fastestLap: data.fastestLap ?? null,
  });

  return apiCreated(prediction);
});
