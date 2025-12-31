import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { updatePreferencesSchema } from "@/lib/validations/auth.schema";
import { handleApiError } from "@/lib/errors/handler";
import { ApiError } from "@/lib/errors/api-error";
import { apiSuccess } from "@/lib/utils/api-response";

/**
 * PUT /api/users/me/preferences - Update user preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const data = updatePreferencesSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.notifyBeforeSession !== undefined && {
          notifyBeforeSession: data.notifyBeforeSession,
        }),
        ...(data.notifyDelayMinutes !== undefined && {
          notifyDelayMinutes: data.notifyDelayMinutes,
        }),
        ...(data.darkMode !== undefined && {
          darkMode: data.darkMode,
        }),
      },
      select: {
        notifyBeforeSession: true,
        notifyDelayMinutes: true,
        darkMode: true,
      },
    });

    return apiSuccess({
      notifyBeforeSession: user.notifyBeforeSession,
      notifyDelayMinutes: user.notifyDelayMinutes,
      darkMode: user.darkMode,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
