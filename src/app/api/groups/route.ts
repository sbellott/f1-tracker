import { NextRequest } from "next/server";
import { apiSuccess, apiCreated } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { requireAuth } from "@/lib/auth/config";
import { createGroupSchema } from "@/lib/validations/groups.schema";
import { createGroup, getUserGroups } from "@/lib/services/groups.service";

/**
 * GET /api/groups
 * Get all groups for the current user
 */
export const GET = withErrorHandler(async () => {
  const user = await requireAuth();

  const groups = await getUserGroups(user.id);

  return apiSuccess({
    groups,
    count: groups.length,
  });
});

/**
 * POST /api/groups
 * Create a new group
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth();
  const body = await request.json();

  const data = createGroupSchema.parse(body);

  const group = await createGroup({
    ...data,
    ownerId: user.id,
  });

  return apiCreated(group);
});
