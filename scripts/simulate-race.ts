/**
 * Race Simulation Script
 *
 * Simulates a complete race workflow for testing:
 * - Pre-race: Creates mock race, sessions, allows predictions
 * - Post-race: Simulates results, scoring, badge attribution
 *
 * Usage:
 *   npx tsx scripts/simulate-race.ts setup        # Setup mock race for prediction testing
 *   npx tsx scripts/simulate-race.ts trigger-h24  # Trigger H-24 reminder
 *   npx tsx scripts/simulate-race.ts trigger-h1   # Trigger H-1 reminder
 *   npx tsx scripts/simulate-race.ts lock         # Lock predictions (simulate qualifying start)
 *   npx tsx scripts/simulate-race.ts results      # Simulate race results and scoring
 *   npx tsx scripts/simulate-race.ts cleanup      # Remove mock data
 *   npx tsx scripts/simulate-race.ts status       # Show current simulation status
 */

import { PrismaClient, SessionType, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// Configuration
// ============================================

const MOCK_RACE_PREFIX = "TEST_SIMULATION_";
const SIMULATION_CIRCUIT_ID = "monza"; // Using existing Monza circuit

// Mock results for simulation (using correct ergastIds from database)
const MOCK_RESULTS = {
  positions: [
    "max_verstappen",
    "norris",
    "leclerc",
    "hamilton",
    "piastri",
    "russell",
    "sainz",
    "alonso",
    "gasly",
    "stroll",
  ],
  pole: "max_verstappen",
  fastestLap: "norris",
};

// ============================================
// Helper Functions
// ============================================

async function getDriverIdByErgastId(ergastId: string): Promise<string | null> {
  const driver = await prisma.driver.findUnique({
    where: { ergastId },
    select: { id: true },
  });
  return driver?.id ?? null;
}

async function getMockRace() {
  return prisma.race.findFirst({
    where: { name: { startsWith: MOCK_RACE_PREFIX } },
    include: {
      sessions: true,
      circuit: true,
    },
  });
}

async function getSimulationUsers() {
  return prisma.user.findMany({
    take: 10,
    select: { id: true, pseudo: true, email: true },
  });
}

function formatDate(date: Date): string {
  return date.toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================
// Setup Mock Race
// ============================================

async function setupMockRace() {
  console.log("\n🏁 Setting up mock race for simulation...\n");

  // Check if mock race already exists
  const existing = await getMockRace();
  if (existing) {
    console.log("⚠️  Mock race already exists!");
    console.log(`   Name: ${existing.name}`);
    console.log(`   Date: ${formatDate(existing.date)}`);
    console.log("\n   Run 'cleanup' first to remove it.\n");
    return;
  }

  // Get Monza circuit
  const circuit = await prisma.circuit.findFirst({
    where: { ergastId: { contains: "monza" } },
  });

  if (!circuit) {
    console.log("❌ Circuit not found. Make sure you have synced F1 data.");
    return;
  }

  // Create race scheduled for 3 days from now (allows prediction testing)
  const now = new Date();
  const raceDate = new Date(now);
  raceDate.setDate(raceDate.getDate() + 3); // 3 days from now
  raceDate.setHours(15, 0, 0, 0); // 15:00 local time

  // Create sessions (all in the future)
  const fp1Date = new Date(raceDate);
  fp1Date.setDate(fp1Date.getDate() - 2); // 1 day from now
  fp1Date.setHours(13, 30, 0, 0);

  const fp2Date = new Date(raceDate);
  fp2Date.setDate(fp2Date.getDate() - 2); // 1 day from now
  fp2Date.setHours(17, 0, 0, 0);

  const fp3Date = new Date(raceDate);
  fp3Date.setDate(fp3Date.getDate() - 1); // 2 days from now
  fp3Date.setHours(12, 30, 0, 0);

  const qualifyingDate = new Date(raceDate);
  qualifyingDate.setDate(qualifyingDate.getDate() - 1); // 2 days from now
  qualifyingDate.setHours(16, 0, 0, 0);

  const race = await prisma.race.create({
    data: {
      season: 2026,
      round: 99, // Special round number for test
      name: `${MOCK_RACE_PREFIX}Grand Prix de Test`,
      officialName: "Formula 1 Test Grand Prix 2026",
      circuitId: circuit.id,
      date: raceDate,
      hasSprint: false,
      sessions: {
        create: [
          { type: SessionType.FP1, dateTime: fp1Date, canalPlusChannel: "Canal+ Sport" },
          { type: SessionType.FP2, dateTime: fp2Date, canalPlusChannel: "Canal+ Sport" },
          { type: SessionType.FP3, dateTime: fp3Date, canalPlusChannel: "Canal+ Sport" },
          { type: SessionType.QUALIFYING, dateTime: qualifyingDate, canalPlusChannel: "Canal+" },
          { type: SessionType.RACE, dateTime: raceDate, canalPlusChannel: "Canal+" },
        ],
      },
    },
    include: {
      sessions: true,
      circuit: true,
    },
  });

  console.log("✅ Mock race created successfully!\n");
  console.log("📍 Race Details:");
  console.log(`   Name: ${race.name}`);
  console.log(`   Circuit: ${race.circuit.name}, ${race.circuit.country}`);
  console.log(`   Race ID: ${race.id}\n`);
  console.log("📅 Sessions:");
  for (const session of race.sessions.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())) {
    console.log(`   ${session.type.padEnd(18)} ${formatDate(session.dateTime)}`);
  }

  // Calculate lock time
  const qualifyingSession = race.sessions.find(s => s.type === SessionType.QUALIFYING);
  if (qualifyingSession) {
    const lockTime = new Date(qualifyingSession.dateTime);
    lockTime.setMinutes(lockTime.getMinutes() - 30);
    console.log(`\n🔒 Predictions lock at: ${formatDate(lockTime)}`);
  }

  console.log("\n📝 Next steps:");
  console.log("   1. Create predictions via the UI or API");
  console.log("   2. Run 'trigger-h24' to test H-24 reminder");
  console.log("   3. Run 'trigger-h1' to test H-1 reminder");
  console.log("   4. Run 'lock' to simulate qualifying start");
  console.log("   5. Run 'results' to simulate race completion");
  console.log("   6. Run 'cleanup' when done\n");
}

// ============================================
// Trigger Reminders
// ============================================

async function triggerH24Reminder() {
  console.log("\n⏰ Triggering H-24 reminder...\n");

  const race = await getMockRace();
  if (!race) {
    console.log("❌ No mock race found. Run 'setup' first.");
    return;
  }

  const qualifyingSession = race.sessions.find(s => s.type === SessionType.QUALIFYING);
  if (!qualifyingSession) {
    console.log("❌ No qualifying session found.");
    return;
  }

  // Get users who haven't made predictions
  const usersWithPredictions = await prisma.prediction.findMany({
    where: { raceId: race.id },
    select: { userId: true },
  });
  const predictedUserIds = new Set(usersWithPredictions.map(p => p.userId));

  const allUsers = await prisma.user.findMany({
    where: { notifyH24: true },
    select: { id: true, pseudo: true, email: true },
  });

  const usersToNotify = allUsers.filter(u => !predictedUserIds.has(u.id));

  console.log(`📧 Users to notify: ${usersToNotify.length}`);

  // Create notifications
  let created = 0;
  for (const user of usersToNotify) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.PREDICTION_REMINDER_H24,
        title: "🏎️ Plus que 24h pour pronostiquer !",
        message: `N'oublie pas de faire tes pronostics pour le ${race.name}. Les qualifications commencent bientôt !`,
        data: {
          raceId: race.id,
          raceName: race.name,
          sessionType: "QUALIFYING",
        },
      },
    });
    created++;
    console.log(`   ✅ Notification sent to ${user.pseudo || user.email}`);
  }

  console.log(`\n✅ Created ${created} H-24 reminder notifications\n`);
}

async function triggerH1Reminder() {
  console.log("\n⏰ Triggering H-1 reminder...\n");

  const race = await getMockRace();
  if (!race) {
    console.log("❌ No mock race found. Run 'setup' first.");
    return;
  }

  const qualifyingSession = race.sessions.find(s => s.type === SessionType.QUALIFYING);
  if (!qualifyingSession) {
    console.log("❌ No qualifying session found.");
    return;
  }

  // Get users who haven't made predictions
  const usersWithPredictions = await prisma.prediction.findMany({
    where: { raceId: race.id },
    select: { userId: true },
  });
  const predictedUserIds = new Set(usersWithPredictions.map(p => p.userId));

  const allUsers = await prisma.user.findMany({
    where: { notifyH1: true },
    select: { id: true, pseudo: true, email: true },
  });

  const usersToNotify = allUsers.filter(u => !predictedUserIds.has(u.id));

  console.log(`📧 Users to notify: ${usersToNotify.length}`);

  // Create notifications
  let created = 0;
  for (const user of usersToNotify) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.PREDICTION_REMINDER_H1,
        title: "⚡ Dernière chance !",
        message: `Plus qu'une heure pour faire tes pronostics pour le ${race.name}. Dépêche-toi !`,
        data: {
          raceId: race.id,
          raceName: race.name,
          sessionType: "QUALIFYING",
        },
      },
    });
    created++;
    console.log(`   ✅ Notification sent to ${user.pseudo || user.email}`);
  }

  console.log(`\n✅ Created ${created} H-1 reminder notifications\n`);
}

// ============================================
// Lock Predictions
// ============================================

async function lockPredictions() {
  console.log("\n🔒 Locking predictions (simulating qualifying start)...\n");

  const race = await getMockRace();
  if (!race) {
    console.log("❌ No mock race found. Run 'setup' first.");
    return;
  }

  // Move qualifying session to the past to lock predictions
  const qualifyingSession = race.sessions.find(s => s.type === SessionType.QUALIFYING);
  if (!qualifyingSession) {
    console.log("❌ No qualifying session found.");
    return;
  }

  const pastDate = new Date();
  pastDate.setMinutes(pastDate.getMinutes() - 35); // 35 minutes ago (past lock time)

  await prisma.raceSession.update({
    where: { id: qualifyingSession.id },
    data: { dateTime: pastDate },
  });

  // Count predictions
  const predictionCount = await prisma.prediction.count({
    where: { raceId: race.id },
  });

  console.log(`✅ Predictions are now locked!`);
  console.log(`   Total predictions: ${predictionCount}`);
  console.log(`   Qualifying moved to: ${formatDate(pastDate)}\n`);
}

// ============================================
// Simulate Results
// ============================================

async function simulateResults() {
  console.log("\n🏆 Simulating race results...\n");

  const race = await getMockRace();
  if (!race) {
    console.log("❌ No mock race found. Run 'setup' first.");
    return;
  }

  // Move race session to the past
  const raceSession = race.sessions.find(s => s.type === SessionType.RACE);
  if (raceSession) {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 2);

    await prisma.raceSession.update({
      where: { id: raceSession.id },
      data: {
        dateTime: pastDate,
        completed: true,
      },
    });
  }

  // Get driver IDs for results
  console.log("📊 Building race results...");
  const driverIds: string[] = [];

  for (const ergastId of MOCK_RESULTS.positions) {
    const driverId = await getDriverIdByErgastId(ergastId);
    if (driverId) {
      driverIds.push(driverId);
    } else {
      console.log(`   ⚠️ Driver not found: ${ergastId}`);
    }
  }

  if (driverIds.length < 10) {
    console.log("❌ Not enough drivers found. Make sure you have synced F1 data.");
    return;
  }

  const poleDriverId = await getDriverIdByErgastId(MOCK_RESULTS.pole);
  const fastestLapDriverId = await getDriverIdByErgastId(MOCK_RESULTS.fastestLap);

  const results = {
    positions: driverIds,
    pole: poleDriverId,
    fastestLap: fastestLapDriverId,
  };

  console.log("\n🏎️ Race Results:");
  for (let i = 0; i < Math.min(10, driverIds.length); i++) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverIds[i] },
      select: { code: true, firstName: true, lastName: true },
    });
    console.log(`   P${i + 1}: ${driver?.firstName} ${driver?.lastName} (${driver?.code})`);
  }
  console.log(`   🏁 Pole Position: ${MOCK_RESULTS.pole}`);
  console.log(`   ⚡ Fastest Lap: ${MOCK_RESULTS.fastestLap}\n`);

  // Store results in race
  await prisma.race.update({
    where: { id: race.id },
    data: {
      resultsJson: results,
    },
  });

  // Score all predictions
  console.log("📈 Scoring predictions...\n");

  const predictions = await prisma.prediction.findMany({
    where: { raceId: race.id },
    include: { user: { select: { pseudo: true, email: true } } },
  });

  if (predictions.length === 0) {
    console.log("⚠️ No predictions to score. Create some predictions first!\n");
    return;
  }

  // Import scoring function
  const { calculateScore } = await import("../src/lib/services/scoring.service");
  const { checkAndAwardBadges } = await import("../src/lib/services/badges.service");

  let totalScored = 0;
  const scoredResults: Array<{ user: string; points: number; badges: string[] }> = [];

  for (const prediction of predictions) {
    // Handle both topTen formats:
    // Format 1 (old): [{driverId: string, position: number}, ...]
    // Format 2 (new): [driverId1, driverId2, ...] (direct string array)
    let positions: string[];
    
    const topTen = prediction.topTen as unknown;
    if (Array.isArray(topTen) && topTen.length > 0) {
      if (typeof topTen[0] === 'string') {
        // New format: direct array of driver IDs
        positions = topTen as string[];
      } else if (typeof topTen[0] === 'object' && topTen[0] !== null && 'driverId' in topTen[0]) {
        // Old format: array of objects with driverId and position
        const topTenArray = topTen as Array<{driverId: string, position: number}>;
        positions = topTenArray
          .sort((a, b) => a.position - b.position)
          .map(item => item.driverId);
      } else {
        console.log(`   ⚠️ Unknown topTen format for ${prediction.user.pseudo}`);
        continue;
      }
    } else {
      console.log(`   ⚠️ Empty topTen for ${prediction.user.pseudo}`);
      continue;
    }
    
    const breakdown = calculateScore(
      {
        positions,
        pole: prediction.polePosition,
        fastestLap: prediction.fastestLap,
      },
      results
    );

    // Update prediction with score
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        points: breakdown.totalPoints,
        pointsBreakdown: breakdown,
      },
    });

    // Check and award badges
    const awardedBadges = await checkAndAwardBadges(
      prediction.userId,
      race.id,
      prediction.id
    );

    scoredResults.push({
      user: prediction.user.pseudo || prediction.user.email || "Unknown",
      points: breakdown.totalPoints,
      badges: awardedBadges,
    });

    totalScored++;
  }

  // Sort by points
  scoredResults.sort((a, b) => b.points - a.points);

  console.log("🏆 Leaderboard:\n");
  scoredResults.forEach((result, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
    const badgesStr = result.badges.length > 0 ? ` +${result.badges.join(", ")}` : "";
    console.log(`   ${medal} ${result.user}: ${result.points} pts${badgesStr}`);
  });

  // Send result notifications
  console.log("\n📬 Sending result notifications...");

  for (const prediction of predictions) {
    const scored = scoredResults.find(s =>
      s.user === (prediction.user.pseudo || prediction.user.email)
    );

    await prisma.notification.create({
      data: {
        userId: prediction.userId,
        type: NotificationType.SCORING_COMPLETE,
        title: "🏁 Résultats disponibles !",
        message: `Tes pronostics pour le ${race.name} ont été calculés. Tu as obtenu ${scored?.points || 0} points !`,
        data: {
          raceId: race.id,
          raceName: race.name,
          points: scored?.points || 0,
        },
      },
    });
  }

  console.log(`\n✅ Scored ${totalScored} predictions`);
  console.log(`✅ Sent ${predictions.length} result notifications\n`);
}

// ============================================
// Cleanup
// ============================================

async function cleanup() {
  console.log("\n🧹 Cleaning up simulation data...\n");

  const race = await getMockRace();
  if (!race) {
    console.log("⚠️ No mock race found. Nothing to clean.\n");
    return;
  }

  // Delete in correct order due to foreign keys

  // 1. Delete notifications related to the race
  const deletedNotifications = await prisma.notification.deleteMany({
    where: {
      data: {
        path: ["raceId"],
        equals: race.id,
      },
    },
  });
  console.log(`   Deleted ${deletedNotifications.count} notifications`);

  // 2. Delete predictions for this race
  const deletedPredictions = await prisma.prediction.deleteMany({
    where: { raceId: race.id },
  });
  console.log(`   Deleted ${deletedPredictions.count} predictions`);

  // 3. Delete race sessions
  const deletedSessions = await prisma.raceSession.deleteMany({
    where: { raceId: race.id },
  });
  console.log(`   Deleted ${deletedSessions.count} race sessions`);

  // 4. Delete the race
  await prisma.race.delete({
    where: { id: race.id },
  });
  console.log(`   Deleted race: ${race.name}`);

  console.log("\n✅ Cleanup complete!\n");
}

// ============================================
// Create Test Prediction
// ============================================

async function createTestPrediction() {
  console.log("\n📝 Creating test prediction...\n");

  const race = await getMockRace();
  if (!race) {
    console.log("❌ No mock race found. Run 'setup' first.\n");
    return;
  }

  // Get or create test user
  let testUser = await prisma.user.findFirst({
    where: { pseudo: "TestDriver" },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@simulation.f1`,
        pseudo: "TestDriver",
        password: "test-simulation",
      },
    });
    console.log("   Created test user: TestDriver");
  }

  // Get driver IDs for prediction
  const drivers = await prisma.driver.findMany({
    where: {
      ergastId: { in: MOCK_RESULTS.positions },
    },
    select: { id: true, ergastId: true },
  });

  const driverIdMap = new Map(drivers.map((d) => [d.ergastId, d.id]));

  // Create prediction matching results (perfect prediction for testing)
  const topTen = MOCK_RESULTS.positions.map((ergastId, index) => ({
    position: index + 1,
    driverId: driverIdMap.get(ergastId)!,
  }));

  const poleDriverId = driverIdMap.get(MOCK_RESULTS.pole)!;
  const fastestLapDriverId = driverIdMap.get(MOCK_RESULTS.fastestLap)!;

  // Delete existing prediction if any
  await prisma.prediction.deleteMany({
    where: { userId: testUser.id, raceId: race.id, sessionType: "RACE" },
  });

  const prediction = await prisma.prediction.create({
    data: {
      userId: testUser.id,
      raceId: race.id,
      sessionType: "RACE",
      topTen: topTen,
      polePosition: poleDriverId,
      fastestLap: fastestLapDriverId,
    },
  });

  console.log("✅ Created PERFECT prediction (should score max points):");
  console.log("   Top 10: VER, NOR, LEC, HAM, PIA, RUS, SAI, ALO, GAS, STR");
  console.log("   Pole: VER");
  console.log("   Fastest Lap: NOR");
  console.log(`\n   Prediction ID: ${prediction.id}\n`);
}

// ============================================
// Status
// ============================================

async function showStatus() {
  console.log("\n📊 Simulation Status\n");

  const race = await getMockRace();

  if (!race) {
    console.log("❌ No mock race found.");
    console.log("   Run 'setup' to create one.\n");
    return;
  }

  console.log("🏁 Mock Race:");
  console.log(`   Name: ${race.name}`);
  console.log(`   Circuit: ${race.circuit.name}`);
  console.log(`   Race ID: ${race.id}\n`);

  console.log("📅 Sessions:");
  const now = new Date();
  for (const session of race.sessions.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())) {
    const isPast = session.dateTime < now;
    const status = session.completed ? "✅" : isPast ? "🔒" : "⏳";
    console.log(`   ${status} ${session.type.padEnd(18)} ${formatDate(session.dateTime)}`);
  }

  // Check lock status
  const qualifyingSession = race.sessions.find(s => s.type === SessionType.QUALIFYING);
  if (qualifyingSession) {
    const lockTime = new Date(qualifyingSession.dateTime);
    lockTime.setMinutes(lockTime.getMinutes() - 30);
    const isLocked = now >= lockTime;
    console.log(`\n🔒 Predictions: ${isLocked ? "LOCKED" : "OPEN"}`);
  }

  // Prediction stats
  const predictions = await prisma.prediction.findMany({
    where: { raceId: race.id },
    include: { user: { select: { pseudo: true, email: true } } },
  });

  console.log(`\n📝 Predictions: ${predictions.length}`);

  if (predictions.length > 0) {
    const scored = predictions.filter(p => p.points !== null);
    console.log(`   Scored: ${scored.length}`);

    if (scored.length > 0) {
      const totalPoints = scored.reduce((sum, p) => sum + (p.points || 0), 0);
      const avgPoints = Math.round(totalPoints / scored.length);
      console.log(`   Average points: ${avgPoints}`);
    }

    console.log("\n   Users with predictions:");
    for (const pred of predictions) {
      const name = pred.user.pseudo || pred.user.email || "Unknown";
      const points = pred.points !== null ? `${pred.points} pts` : "not scored";
      console.log(`      - ${name}: ${points}`);
    }
  }

  // Notifications
  const notifications = await prisma.notification.count({
    where: {
      data: {
        path: ["raceId"],
        equals: race.id,
      },
    },
  });
  console.log(`\n📬 Notifications sent: ${notifications}`);

  console.log("\n");
}

// ============================================
// Main
// ============================================

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "setup":
      await setupMockRace();
      break;
    case "predict":
      await createTestPrediction();
      break;
    case "trigger-h24":
      await triggerH24Reminder();
      break;
    case "trigger-h1":
      await triggerH1Reminder();
      break;
    case "lock":
      await lockPredictions();
      break;
    case "results":
      await simulateResults();
      break;
    case "cleanup":
      await cleanup();
      break;
    case "status":
      await showStatus();
      break;
    default:
      console.log(`
🏎️  F1 Predictions Simulation Script

Usage:
  npx tsx scripts/simulate-race.ts <command>

Commands:
  setup        Create a mock race for testing predictions
  predict      Create a perfect test prediction
  trigger-h24  Send H-24 reminder notifications
  trigger-h1   Send H-1 reminder notifications
  lock         Lock predictions (simulate qualifying start)
  results      Simulate race results and score predictions
  cleanup      Remove all simulation data
  status       Show current simulation status

Workflow:
  1. setup       → Creates mock race scheduled for tomorrow
  2. predict     → Creates perfect test prediction (for scoring test)
  3. trigger-h24 → Test H-24 reminders (optional)
  4. trigger-h1  → Test H-1 reminders (optional)
  5. lock        → Lock predictions
  6. results     → Simulate results, scoring, badges
  7. cleanup     → Clean up when done
`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  prisma.$disconnect();
  process.exit(1);
});