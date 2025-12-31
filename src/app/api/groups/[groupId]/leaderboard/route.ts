import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { apiSuccess } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import { ApiError } from "@/lib/errors/api-error";
import { getGroupById, getGroupLeaderboard } from "@/lib/services/groups.service";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

const querySchema = z.object({
  season: z.coerce.number().int().min(1950).max(2100).optional(),
});

/**
 * GET /api/groups/[groupId]/leaderboard
 * Get group leaderboard
 */
export const GET = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const user = await requireAuth();
    const { groupId } = await context.params;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { season } = querySchema.parse(searchParams);

    const group = await getGroupById(groupId, user.id);

    if (!group) {
      throw ApiError.notFound("Groupe non trouvé");
    }

    if (!group.userRole) {
      throw ApiError.forbidden("Vous n'êtes pas membre de ce groupe");
    }

    const leaderboard = await getGroupLeaderboard(groupId, season);

    return apiSuccess({
      groupId,
      groupName: group.name,
      season: season || new Date().getFullYear(),
      leaderboard,
    });
  }
);
