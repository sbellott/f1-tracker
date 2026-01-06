/**
 * API: Mark All Notifications as Read
 * POST - Mark all user notifications as read
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { markAllAsRead } from "@/lib/services/notifications.service";

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await markAllAsRead(session.user.id);

    return NextResponse.json({ 
      success: true, 
      updated: result.count 
    });
  } catch (error) {
    console.error("[API] Mark all read error:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
