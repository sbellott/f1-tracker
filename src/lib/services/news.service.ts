import Parser from "rss-parser";

// RSS Feed Sources
const RSS_FEEDS = [
  {
    url: "https://www.formula1.com/en/latest/all.xml",
    source: "Formula1.com",
    priority: 1,
  },
  {
    url: "https://www.autosport.com/rss/f1/news",
    source: "Autosport",
    priority: 2,
  },
  {
    url: "https://www.motorsport.com/rss/f1/news/",
    source: "Motorsport.com",
    priority: 3,
  },
  {
    url: "https://www.pitpass.com/fes_php/fes_usr_sit_newsfeed.php",
    source: "Pitpass",
    priority: 4,
  },
] as const;

// Category keywords for auto-classification
const CATEGORY_KEYWORDS = {
  teams: [
    "red bull", "ferrari", "mercedes", "mclaren", "aston martin", "alpine",
    "williams", "haas", "rb", "kick sauber", "sauber", "team", "écurie",
    "constructors", "factory", "garage", "pit wall", "strategy",
  ],
  drivers: [
    "verstappen", "hamilton", "leclerc", "norris", "sainz", "russell",
    "perez", "alonso", "stroll", "ocon", "gasly", "tsunoda", "ricciardo",
    "bottas", "zhou", "magnussen", "hulkenberg", "albon", "sargeant", "piastri",
    "driver", "pilote", "champion", "rookie", "contract", "transfer",
  ],
  technical: [
    "aero", "aerodynamic", "upgrade", "development", "floor", "wing",
    "engine", "power unit", "pu", "sidepod", "diffuser", "drs", "fia",
    "regulation", "technical", "innovation", "design", "downforce",
  ],
  results: [
    "win", "victory", "podium", "pole", "qualifying", "race", "sprint",
    "grand prix", "gp", "result", "classification", "standings", "points",
    "fastest lap", "overtake", "p1", "p2", "p3", "finish",
  ],
} as const;

export type NewsCategory = "all" | "teams" | "drivers" | "technical" | "results";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: Exclude<NewsCategory, "all">;
  source: string;
  publishedAt: string;
  imageUrl: string | null;
  url: string;
  featured: boolean;
}

interface CachedNews {
  articles: NewsArticle[];
  fetchedAt: number;
}

// In-memory cache
let newsCache: CachedNews | null = null;
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Determine article category based on title and summary content
 */
function categorizeArticle(title: string, summary: string): Exclude<NewsCategory, "all"> {
  const content = `${title} ${summary}`.toLowerCase();
  
  const scores: Record<Exclude<NewsCategory, "all">, number> = {
    teams: 0,
    drivers: 0,
    technical: 0,
    results: 0,
  };

  // Score each category based on keyword matches
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (content.includes(keyword.toLowerCase())) {
        scores[category as keyof typeof scores]++;
      }
    }
  }

  // Find the category with highest score
  const entries = Object.entries(scores) as [Exclude<NewsCategory, "all">, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  
  // Return highest scoring category, or 'teams' as default
  return sorted[0][1] > 0 ? sorted[0][0] : "teams";
}

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item: Parser.Item): string | null {
  // Try common image fields
  const mediaContent = (item as Record<string, unknown>)["media:content"];
  if (mediaContent && typeof mediaContent === "object" && "url" in (mediaContent as object)) {
    return (mediaContent as { url: string }).url;
  }

  const enclosure = item.enclosure;
  if (enclosure?.url && enclosure.type?.startsWith("image/")) {
    return enclosure.url;
  }

  // Try to extract from content/description
  const content = item.content || item.contentSnippet || "";
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Generate a unique ID for an article using a simple hash of the URL
 */
function generateArticleId(url: string, source: string, index: number): string {
  // Create a simple hash from URL
  let hash = 0;
  const str = url + source;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hashStr = Math.abs(hash).toString(36);
  const sourceKey = source.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6);
  return `${sourceKey}-${hashStr}-${index}`;
}

/**
 * Fetch and parse a single RSS feed
 */
async function fetchFeed(
  feedConfig: typeof RSS_FEEDS[number],
  parser: Parser
): Promise<NewsArticle[]> {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    
    return feed.items.slice(0, 15).map((item, index) => {
      const title = item.title || "Sans titre";
      const summary = item.contentSnippet || item.content || "";
      const cleanSummary = summary
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim()
        .substring(0, 300);

      return {
        id: generateArticleId(item.link || `${feedConfig.source}-${index}`, feedConfig.source, index),
        title,
        summary: cleanSummary || "Pas de description disponible.",
        category: categorizeArticle(title, cleanSummary),
        source: feedConfig.source,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        imageUrl: extractImageUrl(item),
        url: item.link || "#",
        featured: false,
      };
    });
  } catch (error) {
    console.error(`Failed to fetch feed from ${feedConfig.source}:`, error);
    return [];
  }
}

/**
 * Fetch news from all RSS feeds and aggregate
 */
export async function getNewsArticles(options?: {
  category?: NewsCategory;
  limit?: number;
  forceRefresh?: boolean;
}): Promise<NewsArticle[]> {
  const { category = "all", limit = 50, forceRefresh = false } = options || {};

  // Check cache
  const now = Date.now();
  if (!forceRefresh && newsCache && now - newsCache.fetchedAt < CACHE_DURATION_MS) {
    let articles = newsCache.articles;
    if (category !== "all") {
      articles = articles.filter((a) => a.category === category);
    }
    return articles.slice(0, limit);
  }

  // Fetch all feeds in parallel
  const parser = new Parser({
    timeout: 10000,
    headers: {
      "User-Agent": "F1-Tracker-App/1.0",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
  });

  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map((feed) => fetchFeed(feed, parser))
  );

  // Combine all articles
  const allArticles: NewsArticle[] = [];
  feedResults.forEach((result) => {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  });

  // Sort by date (newest first)
  allArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Mark top 2 most recent as featured
  if (allArticles.length > 0) {
    allArticles[0].featured = true;
  }
  if (allArticles.length > 1) {
    allArticles[1].featured = true;
  }

  // Deduplicate by similar titles
  const seen = new Set<string>();
  const uniqueArticles = allArticles.filter((article) => {
    const normalizedTitle = article.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 50);
    if (seen.has(normalizedTitle)) {
      return false;
    }
    seen.add(normalizedTitle);
    return true;
  });

  // Update cache
  newsCache = {
    articles: uniqueArticles,
    fetchedAt: now,
  };

  // Filter by category if specified
  let result = uniqueArticles;
  if (category !== "all") {
    result = uniqueArticles.filter((a) => a.category === category);
  }

  return result.slice(0, limit);
}

/**
 * Get available news sources
 */
export function getNewsSources(): { name: string; url: string }[] {
  return RSS_FEEDS.map((feed) => ({
    name: feed.source,
    url: feed.url,
  }));
}