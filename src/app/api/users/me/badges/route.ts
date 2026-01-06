/**
 * API: User Badges
 * GET /api/users/me/badges - Get current user's unlocked badges
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getUserBadges, getUserBadgeStats } from "@/lib/services/badges.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const [badges, stats] = await Promise.all([
      getUserBadges(session.user.id),
      getUserBadgeStats(session.user.id),
    ]);

    return NextResponse.json({
      badges,
      stats,
    });
  } catch (error) {
    console.error("[API] GET /api/users/me/badges error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user badges" },
      { status: 500 }
    );
  }
}
