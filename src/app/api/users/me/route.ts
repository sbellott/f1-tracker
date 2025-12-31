import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { updateProfileSchema } from "@/lib/validations/auth.schema";
import { handleApiError } from "@/lib/errors/handler";
import { ApiError } from "@/lib/errors/api-error";
import { apiSuccess } from "@/lib/utils/api-response";

/**
 * GET /api/users/me - Get current user profile
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        pseudo: true,
        avatar: true,
        createdAt: true,
        notifyBeforeSession: true,
        notifyDelayMinutes: true,
        darkMode: true,
        _count: {
          select: {
            groups: true,
            predictions: true,
            badges: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound("Utilisateur");
    }

    return apiSuccess({
      id: user.id,
      email: user.email,
      pseudo: user.pseudo,
      avatar: user.avatar,
      createdAt: user.createdAt,
      preferences: {
        notifyBeforeSession: user.notifyBeforeSession,
        notifyDelayMinutes: user.notifyDelayMinutes,
        darkMode: user.darkMode,
      },
      stats: {
        groupsCount: user._count.groups,
        predictionsCount: user._count.predictions,
        badgesCount: user._count.badges,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/users/me - Update current user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { pseudo, avatar } = updateProfileSchema.parse(body);

    // Check if pseudo is already taken (if changing)
    if (pseudo) {
      const existingUser = await prisma.user.findFirst({
        where: {
          pseudo,
          NOT: { id: session.user.id },
        },
        select: { id: true },
      });

      if (existingUser) {
        throw ApiError.conflict("Ce pseudo est déjà utilisé");
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(pseudo !== undefined && { pseudo }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        pseudo: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}
