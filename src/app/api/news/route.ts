import { NextRequest } from "next/server";
import { z } from "zod";
import { apiCached } from "@/lib/utils/api-response";
import { withErrorHandler } from "@/lib/errors/handler";
import { getNewsArticles, getNewsSources, type NewsCategory } from "@/lib/services/news.service";

const querySchema = z.object({
  category: z.enum(["all", "teams", "drivers", "technical", "results"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  refresh: z.enum(["true", "false"]).optional(),
});

/**
 * GET /api/news
 * Get aggregated F1 news from multiple RSS sources
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const query = querySchema.parse(searchParams);

  const articles = await getNewsArticles({
    category: (query.category as NewsCategory) || "all",
    limit: query.limit || 50,
    forceRefresh: query.refresh === "true",
  });

  const sources = getNewsSources();

  // Cache for 5 minutes at CDN level
  return apiCached(
    {
      count: articles.length,
      sources: sources.map((s) => s.name),
      articles,
    },
    300 // 5 minutes
  );
});
