/**
 * API: Badges
 * GET /api/badges - List all badges with user's unlock status
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getAllBadgesWithStatus, getUserBadgeStats, BADGE_DEFINITIONS } from "@/lib/services/badges.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // Return all badges without unlock status for non-authenticated users
      const badges = BADGE_DEFINITIONS.map((badge) => ({
        ...badge,
        unlocked: false,
        unlockedAt: null,
        raceId: null,
      }));

      return NextResponse.json({
        badges,
        stats: null,
      });
    }

    const [badges, stats] = await Promise.all([
      getAllBadgesWithStatus(session.user.id),
      getUserBadgeStats(session.user.id),
    ]);

    return NextResponse.json({
      badges,
      stats,
    });
  } catch (error) {
    console.error("[API] GET /api/badges error:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}
