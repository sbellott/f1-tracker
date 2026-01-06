/**
 * Badges Service
 * Calculates and awards badges based on user achievements
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { notifyBadgeUnlocked } from "./notifications.service";

// ============================================
// Types
// ============================================

export type BadgeCode =
  | "FIRST_PREDICTION"
  | "PERFECT_PODIUM"
  | "ORACLE"
  | "STREAK_3"
  | "STREAK_5"
  | "STREAK_10"
  | "POLE_MASTER"
  | "FASTEST_LAP_EXPERT"
  | "REGULAR"
  | "TOP_10_PERFECT"
  | "UNDERDOG"
  | "SPEED_DEMON"
  | "GROUP_WINNER"
  | "SEASON_CHAMPION"
  | "PERFECT_WEEKEND";

export interface BadgeDefinition {
  code: BadgeCode;
  name: string;
  description: string;
  icon: string;
  condition: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface UserBadgeWithDetails {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: Date;
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

// ============================================
// Badge Definitions
// ============================================

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    code: "FIRST_PREDICTION",
    name: "Premier Pas",
    description: "Premier pronostic soumis",
    icon: "star",
    condition: "Submit first prediction",
    rarity: "common",
  },
  {
    code: "PERFECT_PODIUM",
    name: "Podium Parfait",
    description: "Podium exact (P1, P2, P3)",
    icon: "trophy",
    condition: "Predict exact podium",
    rarity: "rare",
  },
  {
    code: "ORACLE",
    name: "Oracle",
    description: "3 podiums parfaits consécutifs",
    icon: "eye",
    condition: "3 consecutive perfect podiums",
    rarity: "legendary",
  },
  {
    code: "STREAK_3",
    name: "En Forme",
    description: "3 courses consécutives avec pronostic",
    icon: "flame",
    condition: "3 consecutive predictions",
    rarity: "common",
  },
  {
    code: "STREAK_5",
    name: "Régulier",
    description: "5 courses consécutives avec pronostic",
    icon: "flame",
    condition: "5 consecutive predictions",
    rarity: "common",
  },
  {
    code: "STREAK_10",
    name: "Inarrêtable",
    description: "10 courses consécutives avec pronostic",
    icon: "zap",
    condition: "10 consecutive predictions",
    rarity: "rare",
  },
  {
    code: "POLE_MASTER",
    name: "Pole Hunter",
    description: "5 poles exactes dans la saison",
    icon: "target",
    condition: "5 correct pole predictions",
    rarity: "rare",
  },
  {
    code: "FASTEST_LAP_EXPERT",
    name: "Speed Demon",
    description: "5 meilleurs tours exacts",
    icon: "zap",
    condition: "5 correct fastest lap predictions",
    rarity: "rare",
  },
  {
    code: "REGULAR",
    name: "Fidèle",
    description: "Pronostic à chaque course de la saison (min 10)",
    icon: "calendar",
    condition: "Predict every race (min 10)",
    rarity: "epic",
  },
  {
    code: "TOP_10_PERFECT",
    name: "Vision Parfaite",
    description: "Top 10 exact",
    icon: "crown",
    condition: "Predict exact top 10",
    rarity: "legendary",
  },
  {
    code: "UNDERDOG",
    name: "Underdog",
    description: "Prédit un outsider dans le top 5",
    icon: "sparkles",
    condition: "Correctly predict underdog in top 5",
    rarity: "rare",
  },
  {
    code: "GROUP_WINNER",
    name: "Champion de Groupe",
    description: "Gagner un classement de groupe",
    icon: "users",
    condition: "Win a group leaderboard",
    rarity: "epic",
  },
  {
    code: "SEASON_CHAMPION",
    name: "Champion",
    description: "Terminer premier du classement global",
    icon: "medal",
    condition: "Win overall season standings",
    rarity: "legendary",
  },
  {
    code: "PERFECT_WEEKEND",
    name: "Weekend Parfait",
    description: "Podium + Pole + FL exacts sur une course",
    icon: "award",
    condition: "Perfect podium + pole + fastest lap",
    rarity: "legendary",
  },
];

// ============================================
// Core Functions
// ============================================

/**
 * Initialize badges in database (run once)
 */
export async function seedBadges() {
  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        condition: badge.condition,
      },
      create: {
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        condition: badge.condition,
      },
    });
  }

  console.log(`[BADGES] Seeded ${BADGE_DEFINITIONS.length} badges`);
}

/**
 * Get all badges with user unlock status
 */
export async function getAllBadgesWithStatus(userId: string) {
  const [badges, userBadges] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, unlockedAt: true, raceId: true },
    }),
  ]);

  const userBadgeMap = new Map(
    userBadges.map((ub) => [ub.badgeId, { unlockedAt: ub.unlockedAt, raceId: ub.raceId }])
  );

  return badges.map((badge) => ({
    ...badge,
    unlocked: userBadgeMap.has(badge.id),
    unlockedAt: userBadgeMap.get(badge.id)?.unlockedAt ?? null,
    raceId: userBadgeMap.get(badge.id)?.raceId ?? null,
  }));
}

/**
 * Get user's unlocked badges
 */
export async function getUserBadges(userId: string): Promise<UserBadgeWithDetails[]> {
  return prisma.userBadge.findMany({
    where: { userId },
    include: {
      badge: true,
    },
    orderBy: { unlockedAt: "desc" },
  });
}

/**
 * Award a badge to user
 */
export async function awardBadge(
  userId: string,
  badgeCode: BadgeCode,
  raceId?: string
): Promise<boolean> {
  // Get badge by code
  const badge = await prisma.badge.findUnique({
    where: { code: badgeCode },
  });

  if (!badge) {
    console.error(`[BADGES] Badge not found: ${badgeCode}`);
    return false;
  }

  // Check if already awarded
  const existing = await prisma.userBadge.findUnique({
    where: {
      userId_badgeId: { userId, badgeId: badge.id },
    },
  });

  if (existing) {
    return false; // Already has badge
  }

  // Award badge
  await prisma.userBadge.create({
    data: {
      userId,
      badgeId: badge.id,
      raceId,
    },
  });

  // Send notification
  await notifyBadgeUnlocked(userId, badge.id, badge.name, raceId);

  console.log(`[BADGES] Awarded ${badgeCode} to user ${userId}`);
  return true;
}

/**
 * Check and award all eligible badges after scoring
 */
export async function checkAndAwardBadges(
  userId: string,
  raceId: string,
  predictionId: string
): Promise<BadgeCode[]> {
  const awarded: BadgeCode[] = [];

  // Get prediction with breakdown
  const prediction = await prisma.prediction.findUnique({
    where: { id: predictionId },
    include: {
      race: true,
    },
  });

  if (!prediction || prediction.points === null) {
    return awarded;
  }

  const breakdown = prediction.pointsBreakdown as {
    positionPoints?: number;
    partialPoints?: number;
    polePoints?: number;
    fastestLapPoints?: number;
    podiumBonus?: number;
  } | null;

  // ============================================
  // Check each badge condition
  // ============================================

  // 1. FIRST_PREDICTION - First ever prediction
  const predictionCount = await prisma.prediction.count({
    where: { userId, points: { not: null } },
  });

  if (predictionCount === 1) {
    if (await awardBadge(userId, "FIRST_PREDICTION", raceId)) {
      awarded.push("FIRST_PREDICTION");
    }
  }

  // 2. PERFECT_PODIUM - Exact podium
  if (breakdown?.podiumBonus && breakdown.podiumBonus >= 50) {
    if (await awardBadge(userId, "PERFECT_PODIUM", raceId)) {
      awarded.push("PERFECT_PODIUM");
    }
  }

  // 3. POLE_MASTER - 5 correct poles in season
  if (breakdown?.polePoints && breakdown.polePoints > 0) {
    const correctPoles = await countCorrectPoles(userId, prediction.race.season);
    if (correctPoles >= 5) {
      if (await awardBadge(userId, "POLE_MASTER", raceId)) {
        awarded.push("POLE_MASTER");
      }
    }
  }

  // 4. FASTEST_LAP_EXPERT - 5 correct fastest laps in season
  if (breakdown?.fastestLapPoints && breakdown.fastestLapPoints > 0) {
    const correctFL = await countCorrectFastestLaps(userId, prediction.race.season);
    if (correctFL >= 5) {
      if (await awardBadge(userId, "FASTEST_LAP_EXPERT", raceId)) {
        awarded.push("FASTEST_LAP_EXPERT");
      }
    }
  }

  // 5. STREAK badges - Consecutive predictions
  const streak = await calculatePredictionStreak(userId);
  
  if (streak >= 3) {
    if (await awardBadge(userId, "STREAK_3", raceId)) {
      awarded.push("STREAK_3");
    }
  }
  if (streak >= 5) {
    if (await awardBadge(userId, "STREAK_5", raceId)) {
      awarded.push("STREAK_5");
    }
  }
  if (streak >= 10) {
    if (await awardBadge(userId, "STREAK_10", raceId)) {
      awarded.push("STREAK_10");
    }
  }

  // 6. ORACLE - 3 consecutive perfect podiums
  const perfectPodiumStreak = await calculatePerfectPodiumStreak(userId);
  if (perfectPodiumStreak >= 3) {
    if (await awardBadge(userId, "ORACLE", raceId)) {
      awarded.push("ORACLE");
    }
  }

  // 7. PERFECT_WEEKEND - Podium + Pole + FL all correct
  if (
    breakdown?.podiumBonus &&
    breakdown.podiumBonus >= 50 &&
    breakdown?.polePoints &&
    breakdown.polePoints > 0 &&
    breakdown?.fastestLapPoints &&
    breakdown.fastestLapPoints > 0
  ) {
    if (await awardBadge(userId, "PERFECT_WEEKEND", raceId)) {
      awarded.push("PERFECT_WEEKEND");
    }
  }

  // 8. REGULAR - Predicted all races in season (min 10)
  const seasonPredictions = await prisma.prediction.count({
    where: {
      userId,
      race: { season: prediction.race.season },
      points: { not: null },
    },
  });
  
  const totalSeasonRaces = await prisma.race.count({
    where: {
      season: prediction.race.season,
      sessions: {
        some: {
          type: "RACE",
          completed: true,
        },
      },
    },
  });

  if (totalSeasonRaces >= 10 && seasonPredictions >= totalSeasonRaces) {
    if (await awardBadge(userId, "REGULAR", raceId)) {
      awarded.push("REGULAR");
    }
  }

  // 9. TOP_10_PERFECT - All 10 positions correct (very rare)
  if (breakdown?.positionPoints && breakdown.positionPoints >= 250) {
    // 25 pts * 10 positions = 250
    if (await awardBadge(userId, "TOP_10_PERFECT", raceId)) {
      awarded.push("TOP_10_PERFECT");
    }
  }

  return awarded;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Count correct pole predictions in a season
 */
async function countCorrectPoles(userId: string, season: number): Promise<number> {
  const predictions = await prisma.prediction.findMany({
    where: {
      userId,
      race: { season },
      points: { not: null },
    },
    select: { pointsBreakdown: true },
  });

  return predictions.filter((p) => {
    const breakdown = p.pointsBreakdown as { polePoints?: number } | null;
    return breakdown?.polePoints && breakdown.polePoints > 0;
  }).length;
}

/**
 * Count correct fastest lap predictions in a season
 */
async function countCorrectFastestLaps(userId: string, season: number): Promise<number> {
  const predictions = await prisma.prediction.findMany({
    where: {
      userId,
      race: { season },
      points: { not: null },
    },
    select: { pointsBreakdown: true },
  });

  return predictions.filter((p) => {
    const breakdown = p.pointsBreakdown as { fastestLapPoints?: number } | null;
    return breakdown?.fastestLapPoints && breakdown.fastestLapPoints > 0;
  }).length;
}

/**
 * Calculate consecutive prediction streak
 */
async function calculatePredictionStreak(userId: string): Promise<number> {
  // Get all completed races in order
  const completedRaces = await prisma.race.findMany({
    where: {
      sessions: {
        some: {
          type: "RACE",
          completed: true,
        },
      },
    },
    orderBy: { round: "desc" },
    select: { id: true },
  });

  // Get user predictions
  const userPredictions = await prisma.prediction.findMany({
    where: {
      userId,
      sessionType: "RACE",
      points: { not: null },
    },
    select: { raceId: true },
  });

  const predictedRaceIds = new Set(userPredictions.map((p) => p.raceId));

  // Count streak from most recent
  let streak = 0;
  for (const race of completedRaces) {
    if (predictedRaceIds.has(race.id)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate consecutive perfect podium streak
 */
async function calculatePerfectPodiumStreak(userId: string): Promise<number> {
  // Get scored predictions ordered by race date (most recent first)
  const predictions = await prisma.prediction.findMany({
    where: {
      userId,
      sessionType: "RACE",
      points: { not: null },
    },
    orderBy: {
      race: { date: "desc" },
    },
    select: { pointsBreakdown: true },
  });

  let streak = 0;
  for (const pred of predictions) {
    const breakdown = pred.pointsBreakdown as { podiumBonus?: number } | null;
    if (breakdown?.podiumBonus && breakdown.podiumBonus >= 50) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Check for group winner badges at end of season
 */
export async function checkGroupWinnerBadges(season: number): Promise<void> {
  // Get all groups
  const groups = await prisma.group.findMany({
    where: { season },
    include: {
      members: true,
    },
  });

  for (const group of groups) {
    if (group.members.length < 2) continue;

    // Calculate standings for group
    const memberIds = group.members.map((m) => m.userId);
    
    const predictions = await prisma.prediction.findMany({
      where: {
        userId: { in: memberIds },
        race: { season },
        sessionType: "RACE",
        points: { not: null },
      },
      select: { userId: true, points: true },
    });

    // Sum points per user
    const pointsByUser = new Map<string, number>();
    for (const pred of predictions) {
      const current = pointsByUser.get(pred.userId) || 0;
      pointsByUser.set(pred.userId, current + (pred.points || 0));
    }

    // Find winner
    let maxPoints = 0;
    let winnerId: string | null = null;
    
    for (const [userId, points] of pointsByUser) {
      if (points > maxPoints) {
        maxPoints = points;
        winnerId = userId;
      }
    }

    if (winnerId) {
      await awardBadge(winnerId, "GROUP_WINNER");
    }
  }
}

/**
 * Check for season champion badge
 */
export async function checkSeasonChampionBadge(season: number): Promise<void> {
  // Get all predictions for the season
  const predictions = await prisma.prediction.findMany({
    where: {
      race: { season },
      sessionType: "RACE",
      points: { not: null },
    },
    select: { userId: true, points: true },
  });

  // Sum points per user
  const pointsByUser = new Map<string, number>();
  for (const pred of predictions) {
    const current = pointsByUser.get(pred.userId) || 0;
    pointsByUser.set(pred.userId, current + (pred.points || 0));
  }

  // Find champion
  let maxPoints = 0;
  let championId: string | null = null;
  
  for (const [userId, points] of pointsByUser) {
    if (points > maxPoints) {
      maxPoints = points;
      championId = userId;
    }
  }

  if (championId) {
    await awardBadge(championId, "SEASON_CHAMPION");
    console.log(`[BADGES] Season ${season} champion: ${championId} with ${maxPoints} points`);
  }
}

// ============================================
// Stats Functions
// ============================================

/**
 * Get badge statistics for a user
 */
export async function getUserBadgeStats(userId: string) {
  const [totalBadges, userBadges] = await Promise.all([
    prisma.badge.count(),
    prisma.userBadge.count({ where: { userId } }),
  ]);

  const badges = await getUserBadges(userId);

  const rarityCount = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  for (const ub of badges) {
    const def = BADGE_DEFINITIONS.find((d) => d.code === ub.badge.code);
    if (def) {
      rarityCount[def.rarity]++;
    }
  }

  return {
    total: totalBadges,
    unlocked: userBadges,
    progress: Math.round((userBadges / totalBadges) * 100),
    byRarity: rarityCount,
    recentBadges: badges.slice(0, 5),
  };
}

// ============================================
// Export
// ============================================

export default {
  seedBadges,
  getAllBadgesWithStatus,
  getUserBadges,
  awardBadge,
  checkAndAwardBadges,
  checkGroupWinnerBadges,
  checkSeasonChampionBadge,
  getUserBadgeStats,
  BADGE_DEFINITIONS,
};
