/**
 * Seed Badges Script
 * Run with: npx tsx scripts/seed-badges.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BADGE_DEFINITIONS = [
  {
    code: "FIRST_PREDICTION",
    name: "Premier Pas",
    description: "Premier pronostic soumis",
    icon: "star",
    condition: "Submit first prediction",
  },
  {
    code: "PERFECT_PODIUM",
    name: "Podium Parfait",
    description: "Podium exact (P1, P2, P3)",
    icon: "trophy",
    condition: "Predict exact podium",
  },
  {
    code: "ORACLE",
    name: "Oracle",
    description: "3 podiums parfaits consécutifs",
    icon: "eye",
    condition: "3 consecutive perfect podiums",
  },
  {
    code: "STREAK_3",
    name: "En Forme",
    description: "3 courses consécutives avec pronostic",
    icon: "flame",
    condition: "3 consecutive predictions",
  },
  {
    code: "STREAK_5",
    name: "Régulier",
    description: "5 courses consécutives avec pronostic",
    icon: "flame",
    condition: "5 consecutive predictions",
  },
  {
    code: "STREAK_10",
    name: "Inarrêtable",
    description: "10 courses consécutives avec pronostic",
    icon: "zap",
    condition: "10 consecutive predictions",
  },
  {
    code: "POLE_MASTER",
    name: "Pole Hunter",
    description: "5 poles exactes dans la saison",
    icon: "target",
    condition: "5 correct pole predictions",
  },
  {
    code: "FASTEST_LAP_EXPERT",
    name: "Speed Demon",
    description: "5 meilleurs tours exacts",
    icon: "zap",
    condition: "5 correct fastest lap predictions",
  },
  {
    code: "REGULAR",
    name: "Fidèle",
    description: "Pronostic à chaque course de la saison (min 10)",
    icon: "calendar",
    condition: "Predict every race (min 10)",
  },
  {
    code: "TOP_10_PERFECT",
    name: "Vision Parfaite",
    description: "Top 10 exact",
    icon: "crown",
    condition: "Predict exact top 10",
  },
  {
    code: "UNDERDOG",
    name: "Underdog",
    description: "Prédit un outsider dans le top 5",
    icon: "sparkles",
    condition: "Correctly predict underdog in top 5",
  },
  {
    code: "GROUP_WINNER",
    name: "Champion de Groupe",
    description: "Gagner un classement de groupe",
    icon: "users",
    condition: "Win a group leaderboard",
  },
  {
    code: "SEASON_CHAMPION",
    name: "Champion",
    description: "Terminer premier du classement global",
    icon: "medal",
    condition: "Win overall season standings",
  },
  {
    code: "PERFECT_WEEKEND",
    name: "Weekend Parfait",
    description: "Podium + Pole + FL exacts sur une course",
    icon: "award",
    condition: "Perfect podium + pole + fastest lap",
  },
];

async function seedBadges() {
  console.log("🏅 Seeding badges...\n");

  for (const badge of BADGE_DEFINITIONS) {
    const result = await prisma.badge.upsert({
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

    console.log(`  ✓ ${result.name} (${result.code})`);
  }

  console.log(`\n✅ Seeded ${BADGE_DEFINITIONS.length} badges successfully!`);
}

async function main() {
  try {
    await seedBadges();
  } catch (error) {
    console.error("❌ Error seeding badges:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
