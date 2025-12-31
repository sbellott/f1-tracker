import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import { joinGroupSchema } from "@/lib/validations/groups.schema";
import { joinGroup } from "@/lib/services/groups.service";

/**
 * POST /api/groups/join
 * Join a group using invite code
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth();
  const body = await request.json();

  const { inviteCode } = joinGroupSchema.parse(body);

  const group = await joinGroup(inviteCode, user.id);

  return apiSuccess({
    message: "Vous avez rejoint le groupe",
    group,
  });
});
