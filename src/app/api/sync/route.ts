import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { apiSuccess } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import { ApiError } from "@/lib/errors/api-error";
import { syncSeason, syncRaceResults } from "@/lib/services/sync.service";
import { scorePredictions } from "@/lib/services/predictions.service";
import { prisma } from "@/lib/db/prisma";

const syncSeasonSchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100),
});

const syncResultsSchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100),
  round: z.coerce.number().int().min(1).max(30),
});

/**
 * POST /api/sync
 * Sync F1 data from Ergast API
 * Admin only endpoint
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth();

  // Check if user is admin
  if (user.role !== "ADMIN") {
    throw ApiError.forbidden("Accès réservé aux administrateurs");
  }

  const body = await request.json();
  const action = body.action as string;

  switch (action) {
    case "sync-season": {
      const { season } = syncSeasonSchema.parse(body);
      const result = await syncSeason(season);

      return apiSuccess({
        message: `Saison ${season} synchronisée`,
        result,
      });
    }

    case "sync-results": {
      const { season, round } = syncResultsSchema.parse(body);

      // Sync race results
      const syncResult = await syncRaceResults(season, round);

      // Get race to retrieve results for scoring
      const race = await prisma.race.findUnique({
        where: { season_round: { season, round } },
        select: { id: true, resultsJson: true },
      });

      if (!race?.resultsJson) {
        throw ApiError.badRequest("Résultats non disponibles");
      }

      const results = race.resultsJson as {
        positions: string[];
        pole: string | null;
        fastestLap: string | null;
      };

      // Score predictions
      const scoreResult = await scorePredictions(race.id, results);

      return apiSuccess({
        message: `Résultats de la manche ${round} synchronisés et pronostics notés`,
        syncResult,
        scoreResult,
      });
    }

    case "rescore": {
      const { season, round } = syncResultsSchema.parse(body);

      // Get race results
      const race = await prisma.race.findUnique({
        where: { season_round: { season, round } },
        select: { id: true, resultsJson: true },
      });

      if (!race?.resultsJson) {
        throw ApiError.badRequest("Résultats non disponibles pour cette course");
      }

      // Reset scored status
      await prisma.prediction.updateMany({
        where: { raceId: race.id },
        data: { scored: false, points: null },
      });

      const results = race.resultsJson as {
        positions: string[];
        pole: string | null;
        fastestLap: string | null;
      };

      // Re-score predictions
      const scoreResult = await scorePredictions(race.id, results);

      return apiSuccess({
        message: `Pronostics recalculés pour la manche ${round}`,
        scoreResult,
      });
    }

    default:
      throw ApiError.badRequest(
        "Action invalide. Utilisez: sync-season, sync-results, rescore"
      );
  }
});
