/**
 * Cron Job: Score Predictions
 * Automatically scores predictions after race sessions complete
 * 
 * This endpoint should be called by a cron service (Vercel Cron, etc.)
 * Recommended: Run every 15 minutes during race weekends
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { calculateScore, type Prediction as ScoringPrediction, type RaceResults } from "@/lib/services/scoring.service";
import { 
  createScoringJob, 
  completeScoringJob, 
  updateScoringJobProgress,
  notifyScoringComplete,
} from "@/lib/services/notifications.service";
import { checkAndAwardBadges } from "@/lib/services/badges.service";

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max

interface SessionResult {
  positions: Array<{
    position: number;
    driverId: string;
  }>;
  pole?: string;
  fastestLap?: {
    driverId: string;
  };
}

export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processCompletedSessions();
    return NextResponse.json(results);
  } catch (error) {
    console.error("[CRON] Score predictions error:", error);
    return NextResponse.json(
      { error: "Failed to process scoring" },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { raceId, sessionType } = body;

    // If specific race/session provided, process only that one
    if (raceId && sessionType) {
      const result = await processSpecificSession(raceId, sessionType);
      return NextResponse.json(result);
    }

    // Otherwise process all completed sessions
    const results = await processCompletedSessions();
    return NextResponse.json(results);
  } catch (error) {
    console.error("[CRON] Score predictions error:", error);
    return NextResponse.json(
      { error: "Failed to process scoring" },
      { status: 500 }
    );
  }
}

/**
 * Process all completed sessions that haven't been scored yet
 */
async function processCompletedSessions() {
  // Find completed sessions with results that have unscored predictions
  const completedSessions = await prisma.raceSession.findMany({
    where: {
      completed: true,
      resultsJson: { not: Prisma.DbNull },
      type: { in: ["RACE", "SPRINT"] },
    },
    include: {
      race: {
        include: {
          predictions: {
            where: { points: null },
          },
        },
      },
    },
    orderBy: { dateTime: "desc" },
    take: 10, // Process up to 10 sessions at a time
  });

  const results: Array<{
    raceId: string;
    sessionType: string;
    scored: number;
    errors: number;
  }> = [];

  for (const session of completedSessions) {
    // Only process if there are unscored predictions
    const unscoredPredictions = session.race.predictions.filter(
      (p) => p.sessionType === session.type && p.points === null
    );

    if (unscoredPredictions.length === 0) continue;

    // Type guard - we've already filtered for RACE/SPRINT in the query
    if (session.type !== "RACE" && session.type !== "SPRINT") continue;

    const result = await processSessionScoring(
      session.raceId,
      session.type,
      session.resultsJson as unknown as SessionResult,
      session.race.name
    );

    results.push({
      raceId: session.raceId,
      sessionType: session.type,
      ...result,
    });
  }

  return {
    processed: results.length,
    sessions: results,
  };
}

/**
 * Process a specific session
 */
async function processSpecificSession(raceId: string, sessionType: string) {
  const session = await prisma.raceSession.findUnique({
    where: {
      raceId_type: {
        raceId,
        type: sessionType as "RACE" | "SPRINT",
      },
    },
    include: {
      race: true,
    },
  });

  if (!session) {
    return { error: "Session not found" };
  }

  if (!session.completed || !session.resultsJson) {
    return { error: "Session not completed or no results available" };
  }

  // Validate session type is scoreable
  if (session.type !== "RACE" && session.type !== "SPRINT") {
    return { error: "Only RACE and SPRINT sessions can be scored" };
  }

  const result = await processSessionScoring(
    raceId,
    session.type,
    session.resultsJson as unknown as SessionResult,
    session.race.name
  );

  return {
    raceId,
    sessionType,
    ...result,
  };
}

/**
 * Process scoring for a single session
 */
async function processSessionScoring(
  raceId: string,
  sessionType: "RACE" | "SPRINT",
  resultsJson: SessionResult,
  raceName: string
) {
  // Create scoring job
  const job = await createScoringJob(raceId, sessionType);

  try {
    // Mark job as running
    await prisma.scoringJob.update({
      where: { id: job.id },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    // Get all unscored predictions for this session
    const predictions = await prisma.prediction.findMany({
      where: {
        raceId,
        sessionType,
        points: null,
      },
      include: {
        user: {
          select: { id: true, pseudo: true, email: true },
        },
      },
    });

    if (predictions.length === 0) {
      await completeScoringJob(job.id, "COMPLETED");
      return { scored: 0, errors: 0, message: "No predictions to score" };
    }

    // Update job total
    await updateScoringJobProgress(job.id, 0, predictions.length);

    // Parse race results
    const raceResults: RaceResults = {
      positions: resultsJson.positions
        .sort((a, b) => a.position - b.position)
        .slice(0, 10)
        .map((p) => p.driverId),
      pole: resultsJson.pole || null,
      fastestLap: resultsJson.fastestLap?.driverId || null,
    };

    let scored = 0;
    let errors = 0;

    // Score each prediction
    for (const prediction of predictions) {
      try {
        // Parse prediction data
        const topTen = prediction.topTen as Record<string, string>;
        const predictionData: ScoringPrediction = {
          positions: [
            topTen.p1 || "",
            topTen.p2 || "",
            topTen.p3 || "",
            topTen.p4 || "",
            topTen.p5 || "",
            topTen.p6 || "",
            topTen.p7 || "",
            topTen.p8 || "",
            topTen.p9 || "",
            topTen.p10 || "",
          ],
          pole: prediction.polePosition,
          fastestLap: prediction.fastestLap,
        };

        // Calculate score
        const breakdown = calculateScore(predictionData, raceResults);

        // Update prediction with score
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            points: breakdown.totalPoints,
            pointsBreakdown: {
              positionPoints: breakdown.positionPoints,
              partialPoints: breakdown.partialPoints,
              polePoints: breakdown.polePoints,
              fastestLapPoints: breakdown.fastestLapPoints,
              podiumBonus: breakdown.podiumBonus,
              details: breakdown.details as unknown[],
            } as Prisma.InputJsonValue,
          },
        });

        // Send notification to user
        await notifyScoringComplete(
          prediction.userId,
          raceId,
          raceName,
          sessionType,
          breakdown.totalPoints
        );

        // Check and award badges
        await checkAndAwardBadges(prediction.userId, raceId, prediction.id);

        scored++;
        await updateScoringJobProgress(job.id, scored, predictions.length);
      } catch (err) {
        console.error(`[SCORING] Error scoring prediction ${prediction.id}:`, err);
        errors++;
      }
    }

    // Complete job
    await completeScoringJob(job.id, "COMPLETED");

    // Log results
    console.log(`[SCORING] Completed ${raceName} ${sessionType}: ${scored} scored, ${errors} errors`);

    return { scored, errors };
  } catch (error) {
    console.error(`[SCORING] Job failed for ${raceId}/${sessionType}:`, error);
    await completeScoringJob(job.id, "FAILED", String(error));
    return { scored: 0, errors: 1, error: String(error) };
  }
}