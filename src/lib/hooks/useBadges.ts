"use client";

import { useQuery } from "@tanstack/react-query";

// ============================================
// Types
// ============================================

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  unlocked: boolean;
  unlockedAt: string | null;
  raceId: string | null;
}

export interface BadgeStats {
  total: number;
  unlocked: number;
  progress: number;
  byRarity: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  recentBadges: UserBadge[];
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: string;
  raceId: string | null;
  badge: {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    condition: string;
  };
}

interface BadgesResponse {
  badges: Badge[];
  stats: BadgeStats | null;
}

interface UserBadgesResponse {
  badges: UserBadge[];
  stats: BadgeStats;
}

// ============================================
// API Functions
// ============================================

async function fetchAllBadges(): Promise<BadgesResponse> {
  const response = await fetch("/api/badges");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch badges");
  }

  return response.json();
}

async function fetchUserBadges(): Promise<UserBadgesResponse> {
  const response = await fetch("/api/users/me/badges");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch user badges");
  }

  return response.json();
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch all badges with unlock status
 */
export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: fetchAllBadges,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch current user's unlocked badges
 */
export function useUserBadges() {
  return useQuery({
    queryKey: ["user", "badges"],
    queryFn: fetchUserBadges,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to get badge progress percentage
 */
export function useBadgeProgress() {
  const { data } = useBadges();
  
  if (!data?.stats) return 0;
  return data.stats.progress;
}

/**
 * Hook to get recently unlocked badges
 */
export function useRecentBadges(limit = 5) {
  const { data, ...rest } = useUserBadges();
  
  return {
    ...rest,
    data: data?.badges.slice(0, limit) ?? [],
  };
}

// ============================================
// Badge Rarity Helpers
// ============================================

export const BADGE_RARITY_CONFIG = {
  common: {
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
    label: "Commun",
  },
  rare: {
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    label: "Rare",
  },
  epic: {
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    label: "Épique",
  },
  legendary: {
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    label: "Légendaire",
  },
} as const;

export type BadgeRarity = keyof typeof BADGE_RARITY_CONFIG;

export function getBadgeRarity(badgeCode: string): BadgeRarity {
  const rarityMap: Record<string, BadgeRarity> = {
    FIRST_PREDICTION: "common",
    STREAK_3: "common",
    STREAK_5: "common",
    PERFECT_PODIUM: "rare",
    STREAK_10: "rare",
    POLE_MASTER: "rare",
    FASTEST_LAP_EXPERT: "rare",
    UNDERDOG: "rare",
    REGULAR: "epic",
    GROUP_WINNER: "epic",
    ORACLE: "legendary",
    TOP_10_PERFECT: "legendary",
    SEASON_CHAMPION: "legendary",
    PERFECT_WEEKEND: "legendary",
  };

  return rarityMap[badgeCode] || "common";
}

export function getBadgeIcon(iconName: string) {
  const iconMap: Record<string, string> = {
    star: "⭐",
    trophy: "🏆",
    flame: "🔥",
    zap: "⚡",
    target: "🎯",
    eye: "👁️",
    crown: "👑",
    sparkles: "✨",
    users: "👥",
    medal: "🥇",
    award: "🏅",
    calendar: "📅",
  };

  return iconMap[iconName] || "🏅";
}
