import { NextRequest } from "next/server";
import { apiSuccess, apiNoContent } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import { ApiError } from "@/lib/errors/api-error";
import { manageMemberSchema } from "@/lib/validations/groups.schema";
import {
  getGroupById,
  removeMember,
} from "@/lib/services/groups.service";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

/**
 * GET /api/groups/[groupId]/members
 * Get group members
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, context: RouteContext) => {
    const user = await requireAuth();
    const { groupId } = await context.params;

    const group = await getGroupById(groupId, user.id);

    if (!group) {
      throw ApiError.notFound("Groupe non trouvé");
    }

    // Verify user is a member
    const isMember = group.members.some((m) => m.userId === user.id);
    if (!isMember) {
      throw ApiError.forbidden("Vous n'êtes pas membre de ce groupe");
    }

    return apiSuccess({
      members: group.members,
      count: group.memberCount,
    });
  }
);

/**
 * DELETE /api/groups/[groupId]/members
 * Remove a member from the group (owner only)
 */
export const DELETE = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const user = await requireAuth();
    const { groupId } = await context.params;
    const body = await request.json();

    const { userId: targetUserId } = manageMemberSchema.parse(body);

    await removeMember(groupId, user.id, targetUserId);

    return apiNoContent();
  }
);
