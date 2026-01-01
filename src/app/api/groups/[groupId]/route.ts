import { NextRequest } from "next/server";
import { apiSuccess, apiNoContent } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import { ApiError } from "@/lib/errors/api-error";
import { updateGroupSchema } from "@/lib/validations/groups.schema";
import {
  getGroupById,
  updateGroup,
  deleteGroup,
  leaveGroup,
} from "@/lib/services/groups.service";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

/**
 * GET /api/groups/[groupId]
 * Get group details
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, context: RouteContext) => {
    const user = await requireAuth();
    const { groupId } = await context.params;

    const group = await getGroupById(groupId, user.id);

    if (!group) {
      throw ApiError.notFound("Groupe non trouvé");
    }

    // Verify user is a member by checking if they're in the members list
    const isMember = group.members.some((m) => m.userId === user.id);
    if (!isMember) {
      throw ApiError.forbidden("Vous n'êtes pas membre de ce groupe");
    }

    return apiSuccess(group);
  }
);

/**
 * PUT /api/groups/[groupId]
 * Update group settings
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const user = await requireAuth();
    const { groupId } = await context.params;
    const body = await request.json();

    const data = updateGroupSchema.parse(body);

    const group = await updateGroup(groupId, user.id, data);

    return apiSuccess(group);
  }
);

/**
 * DELETE /api/groups/[groupId]
 * Delete a group or leave it
 */
export const DELETE = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const user = await requireAuth();
    const { groupId } = await context.params;

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "leave") {
      await leaveGroup(groupId, user.id);
      return apiNoContent();
    }

    await deleteGroup(groupId, user.id);
    return apiNoContent();
  }
);
