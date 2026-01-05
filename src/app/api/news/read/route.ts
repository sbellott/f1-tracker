import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, errorResponse } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";

const markReadSchema = z.object({
  articleUrl: z.string().url(),
});

/**
 * GET /api/news/read
 * Get all read article URLs for the current user
 */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return errorResponse("Non authentifié", 401);
  }

  const readArticles = await prisma.readArticle.findMany({
    where: { userId: session.user.id },
    select: { articleUrl: true, readAt: true },
    orderBy: { readAt: "desc" },
  });

  return apiSuccess({
    readUrls: readArticles.map((r) => r.articleUrl),
    readArticles: readArticles,
  });
});

/**
 * POST /api/news/read
 * Mark an article as read for the current user
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return errorResponse("Non authentifié", 401);
  }

  const body = await request.json();
  const { articleUrl } = markReadSchema.parse(body);

  // Upsert to handle re-reading (update readAt timestamp)
  const readArticle = await prisma.readArticle.upsert({
    where: {
      userId_articleUrl: {
        userId: session.user.id,
        articleUrl: articleUrl,
      },
    },
    update: {
      readAt: new Date(),
    },
    create: {
      userId: session.user.id,
      articleUrl: articleUrl,
    },
  });

  return apiSuccess({
    message: "Article marqué comme lu",
    readArticle: {
      id: readArticle.id,
      articleUrl: readArticle.articleUrl,
      readAt: readArticle.readAt,
    },
  });
});

/**
 * DELETE /api/news/read
 * Mark an article as unread (remove from read list)
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return errorResponse("Non authentifié", 401);
  }

  const { searchParams } = new URL(request.url);
  const articleUrl = searchParams.get("articleUrl");

  if (!articleUrl) {
    return errorResponse("URL de l'article requise", 400);
  }

  await prisma.readArticle.deleteMany({
    where: {
      userId: session.user.id,
      articleUrl: articleUrl,
    },
  });

  return apiSuccess({
    message: "Article marqué comme non lu",
  });
});