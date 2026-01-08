import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/errors/api-error";

/**
 * GET /api/duel
 * Get duel data for head-to-head comparison
 * Supports both legacy 2-person mode and new group-based opponent selection
 * 
 * Query params:
 * - opponentId: (optional) specific opponent to compare with
 * - groupId: (required if opponentId provided) group context for permission check
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const currentUser = await requireAuth();

  const searchParams = request.nextUrl.searchParams;
  const opponentId = searchParams.get("opponentId");
  const groupId = searchParams.get("groupId");

  let opponent = null;

  // If specific opponent requested, verify group membership
  if (opponentId && groupId) {
    // Verify both users are in the same group
    const [currentUserMembership, opponentMembership] = await Promise.all([
      prisma.groupMember.findFirst({
        where: { groupId, userId: currentUser.id },
      }),
      prisma.groupMember.findFirst({
        where: { groupId, userId: opponentId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              pseudo: true,
              avatar: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    if (!currentUserMembership) {
      throw ApiError.forbidden("You are not a member of this group");
    }

    if (!opponentMembership) {
      throw ApiError.notFound("Opponent not found in this group");
    }

    opponent = opponentMembership.user;
  } else {
    // Legacy mode: Get opponent (the other user in the system)
    opponent = await prisma.user.findFirst({
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
  }

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
      createdAt: p.createdAt,
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

  // Get group info if groupId provided
  let groupInfo = null;
  if (groupId) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true },
    });
    groupInfo = group;
  }

  return apiSuccess({
    opponent: opponent
      ? {
          id: opponent.id,
          email: opponent.email,
          pseudo: opponent.pseudo || opponent.email?.split("@")[0],
          avatar: opponent.avatar,
          createdAt: opponent.createdAt,
          groupId: groupId || null,
          groupName: groupInfo?.name || null,
        }
      : null,
    userPredictions: transformPredictions(userPredictions),
    opponentPredictions: transformPredictions(opponentPredictions),
  });
});