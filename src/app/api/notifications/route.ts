/**
 * API: User Notifications
 * GET - List user notifications
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getUserNotifications, getUnreadCount } from "@/lib/services/notifications.service";
import type { NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") as NotificationType | null;

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(session.user.id, {
        limit,
        unreadOnly,
        type: type || undefined,
      }),
      getUnreadCount(session.user.id),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("[API] Get notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
