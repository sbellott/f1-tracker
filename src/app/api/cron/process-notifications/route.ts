/**
 * Cron Job: Process Notifications
 * Processes scheduled notification reminders (H-24, H-1)
 * 
 * This endpoint should be called by a cron service (Vercel Cron, etc.)
 * Recommended: Run every 15 minutes
 */

import { NextResponse } from "next/server";
import { 
  getPendingSchedules, 
  processScheduledNotification,
  scheduleSessionReminders,
} from "@/lib/services/notifications.service";
import { prisma } from "@/lib/db/prisma";

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 1 minute max

export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processAllPendingNotifications();
    return NextResponse.json(results);
  } catch (error) {
    console.error("[CRON] Process notifications error:", error);
    return NextResponse.json(
      { error: "Failed to process notifications" },
      { status: 500 }
    );
  }
}

// POST for manual triggers or to schedule new reminders
export async function POST(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "schedule-upcoming") {
      // Schedule notifications for upcoming sessions
      const scheduled = await scheduleUpcomingSessions();
      return NextResponse.json({ scheduled });
    }

    // Default: process pending notifications
    const results = await processAllPendingNotifications();
    return NextResponse.json(results);
  } catch (error) {
    console.error("[CRON] Process notifications error:", error);
    return NextResponse.json(
      { error: "Failed to process notifications" },
      { status: 500 }
    );
  }
}

/**
 * Process all pending scheduled notifications
 */
async function processAllPendingNotifications() {
  const pendingSchedules = await getPendingSchedules(50);

  if (pendingSchedules.length === 0) {
    return { processed: 0, message: "No pending notifications" };
  }

  let processed = 0;
  let failed = 0;
  const results: Array<{
    id: string;
    type: string;
    status: string;
    processed?: number;
  }> = [];

  for (const schedule of pendingSchedules) {
    try {
      const result = await processScheduledNotification(schedule.id);
      processed++;
      results.push({
        id: schedule.id,
        type: schedule.type,
        status: "success",
        processed: result.processed,
      });
    } catch (error) {
      console.error(`[NOTIFICATIONS] Failed to process ${schedule.id}:`, error);
      failed++;
      results.push({
        id: schedule.id,
        type: schedule.type,
        status: "failed",
      });
    }
  }

  return {
    processed,
    failed,
    total: pendingSchedules.length,
    results,
  };
}

/**
 * Schedule notifications for upcoming race sessions
 * Called to set up H-24 and H-1 reminder schedules
 */
async function scheduleUpcomingSessions() {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Find upcoming RACE and SPRINT sessions in the next 7 days
  const upcomingSessions = await prisma.raceSession.findMany({
    where: {
      dateTime: {
        gte: now,
        lte: nextWeek,
      },
      type: { in: ["RACE", "SPRINT"] },
    },
    include: {
      race: true,
    },
    orderBy: { dateTime: "asc" },
  });

  const scheduled: Array<{
    raceId: string;
    raceName: string;
    sessionType: string;
    reminders: number;
  }> = [];

  for (const session of upcomingSessions) {
    try {
      const reminders = await scheduleSessionReminders({
        raceId: session.raceId,
        sessionType: session.type,
        sessionDateTime: session.dateTime,
      });

      scheduled.push({
        raceId: session.raceId,
        raceName: session.race.name,
        sessionType: session.type,
        reminders: reminders.length,
      });

      console.log(
        `[NOTIFICATIONS] Scheduled ${reminders.length} reminders for ${session.race.name} ${session.type}`
      );
    } catch (error) {
      console.error(
        `[NOTIFICATIONS] Failed to schedule reminders for ${session.raceId}:`,
        error
      );
    }
  }

  return scheduled;
}