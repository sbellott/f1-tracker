import { apiSuccess } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/duel
 * Get duel data for 2-person head-to-head system
 * Returns: opponent user + all predictions for both users
 */
export const GET = withErrorHandler(async () => {
  const currentUser = await requireAuth();

  // Get opponent (the other user in the system)
  const opponent = await prisma.user.findFirst({
    where: {
      id: { not: currentUser.id },
    },
    select: {
      id: true,
      email: true,
      pseudo: true,
      avatar: true,
      createdAt: true,
    },
  });

  // Get all predictions for current user
  const userPredictions = await prisma.prediction.findMany({
    where: { userId: currentUser.id },
    include: {
      race: {
        select: {
          id: true,
          name: true,
          round: true,
          date: true,
          season: true,
        },
      },
    },
    orderBy: { race: { round: "asc" } },
  });

  // Get all predictions for opponent (if exists)
  const opponentPredictions = opponent
    ? await prisma.prediction.findMany({
        where: { userId: opponent.id },
        include: {
          race: {
            select: {
              id: true,
              name: true,
              round: true,
              date: true,
              season: true,
            },
          },
        },
        orderBy: { race: { round: "asc" } },
      })
    : [];

  // Transform predictions to frontend format
  const transformPredictions = (predictions: typeof userPredictions) =>
    predictions.map((p) => ({
      id: p.id,
      odredAt: p.createdAt,
      userId: p.userId,
      raceId: p.raceId,
      raceName: p.race.name,
      raceDate: p.race.date,
      round: p.race.round,
      season: p.race.season,
      sessionType: p.sessionType,
      topTen: p.topTen as string[],
      pole: p.polePosition,
      fastestLap: p.fastestLap,
      points: p.points,
      pointsBreakdown: p.pointsBreakdown as Record<string, number> | null,
    }));

  return apiSuccess({
    opponent: opponent
      ? {
          id: opponent.id,
          email: opponent.email,
          pseudo: opponent.pseudo || opponent.email?.split("@")[0],
          avatar: opponent.avatar,
          createdAt: opponent.createdAt,
        }
      : null,
    userPredictions: transformPredictions(userPredictions),
    opponentPredictions: transformPredictions(opponentPredictions),
  });
});
