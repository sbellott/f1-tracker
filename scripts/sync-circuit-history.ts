/**
 * Sync Circuit History Script
 * 
 * Fetches historical race data from Ergast API and stores in database.
 * Run with: npx tsx scripts/sync-circuit-history.ts
 * 
 * Options:
 *   --circuit <ergastId>  Sync specific circuit only
 *   --years <n>           Number of years to sync (default: 10)
 */

import { PrismaClient } from "@prisma/client";
import {
  getCircuitFullResults,
  type FullRaceResult,
} from "../src/lib/services/circuit-history.service";

const prisma = new PrismaClient();

// Delay helper to avoid rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function syncCircuitHistory(
  circuitId: string,
  ergastId: string,
  numberOfYears: number = 10
): Promise<number> {
  console.log(`\n📍 Syncing ${ergastId}...`);

  try {
    const fullResults = await getCircuitFullResults(ergastId, numberOfYears);
    
    if (fullResults.length === 0) {
      console.log(`   ⚠️  No results found for ${ergastId}`);
      return 0;
    }

    let synced = 0;

    for (const race of fullResults) {
      const winner = race.results[0];
      if (!winner) continue;

      // Find driver and constructor in database
      const winnerDriver = await prisma.driver.findUnique({
        where: { ergastId: winner.driver.driverId },
      });
      const winnerConstructor = await prisma.constructor.findUnique({
        where: { ergastId: winner.constructor.constructorId },
      });

      // Upsert the circuit history
      await prisma.circuitHistory.upsert({
        where: {
          circuitId_season: {
            circuitId,
            season: race.season,
          },
        },
        create: {
          circuitId,
          season: race.season,
          round: race.round,
          raceName: race.raceName,
          raceDate: new Date(race.date),
          winnerId: winnerDriver?.id,
          winnerConstructorId: winnerConstructor?.id,
          winnerTime: winner.time,
          fullResultsJson: race,
          syncedAt: new Date(),
        },
        update: {
          round: race.round,
          raceName: race.raceName,
          raceDate: new Date(race.date),
          winnerId: winnerDriver?.id,
          winnerConstructorId: winnerConstructor?.id,
          winnerTime: winner.time,
          fullResultsJson: race,
          syncedAt: new Date(),
        },
      });

      synced++;
      console.log(`   ✅ ${race.season} ${race.raceName} - ${winner.driver.lastName}`);
    }

    return synced;
  } catch (error) {
    console.error(`   ❌ Error syncing ${ergastId}:`, error);
    return 0;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const circuitArg = args.indexOf("--circuit");
  const yearsArg = args.indexOf("--years");

  const specificCircuit = circuitArg !== -1 ? args[circuitArg + 1] : null;
  const numberOfYears = yearsArg !== -1 ? parseInt(args[yearsArg + 1]) : 10;

  console.log("🏎️  Circuit History Sync");
  console.log("========================");
  console.log(`📅 Years to sync: ${numberOfYears}`);

  try {
    // Get circuits to sync
    let circuits;
    if (specificCircuit) {
      circuits = await prisma.circuit.findMany({
        where: {
          OR: [{ id: specificCircuit }, { ergastId: specificCircuit }],
        },
      });
      if (circuits.length === 0) {
        console.error(`❌ Circuit not found: ${specificCircuit}`);
        process.exit(1);
      }
    } else {
      circuits = await prisma.circuit.findMany({
        orderBy: { name: "asc" },
      });
    }

    console.log(`🏁 Found ${circuits.length} circuit(s) to sync\n`);

    let totalSynced = 0;

    for (const circuit of circuits) {
      const synced = await syncCircuitHistory(
        circuit.id,
        circuit.ergastId,
        numberOfYears
      );
      totalSynced += synced;

      // Delay between circuits to avoid rate limiting
      if (circuits.length > 1) {
        await delay(1000);
      }
    }

    console.log("\n========================");
    console.log(`✅ Sync complete! ${totalSynced} race results synced.`);
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
