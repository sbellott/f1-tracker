/**
 * API: Notification Preferences
 * GET - Get user notification preferences
 * PATCH - Update notification preferences
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { 
  getUserPreferences, 
  updateUserPreferences,
  type NotificationPreferences,
} from "@/lib/services/notifications.service";
import { z } from "zod";

// Validation schema for preferences
const preferencesSchema = z.object({
  notifyEmail: z.boolean().optional(),
  notifyPush: z.boolean().optional(),
  notifyH24: z.boolean().optional(),
  notifyH1: z.boolean().optional(),
  notifyResults: z.boolean().optional(),
  notifyBeforeSession: z.boolean().optional(),
  notifyDelayMinutes: z.number().min(5).max(120).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getUserPreferences(session.user.id);

    if (!preferences) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("[API] Get preferences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const parseResult = preferencesSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid preferences", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const preferences = parseResult.data as Partial<NotificationPreferences>;
    
    await updateUserPreferences(session.user.id, preferences);

    // Return updated preferences
    const updated = await getUserPreferences(session.user.id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] Update preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
