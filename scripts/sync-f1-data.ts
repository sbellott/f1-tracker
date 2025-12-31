/**
 * F1 Data Sync Script
 *
 * Usage:
 *   npm run sync:f1                    # Sync current season
 *   npm run sync:f1 -- --season 2024   # Sync specific season
 *   npm run sync:f1 -- --full          # Full sync (all data types)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const seasonArg = args.find((arg) => arg.startsWith("--season="));
const season = seasonArg
  ? parseInt(seasonArg.split("=")[1])
  : new Date().getFullYear();
const fullSync = args.includes("--full");

const ERGAST_BASE_URL = "https://api.jolpi.ca/ergast/f1";

// ============================================
// Types
// ============================================

interface ErgastDriver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  url?: string;
}

interface ErgastConstructor {
  constructorId: string;
  name: string;
  nationality: string;
  url?: string;
}

interface ErgastCircuit {
  circuitId: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
  url?: string;
}

interface ErgastRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: ErgastCircuit;
  date: string;
  time?: string;
  FirstPractice?: { date: string; time?: string };
  SecondPractice?: { date: string; time?: string };
  ThirdPractice?: { date: string; time?: string };
  Qualifying?: { date: string; time?: string };
  Sprint?: { date: string; time?: string };
  SprintQualifying?: { date: string; time?: string };
}

// ============================================
// API Helpers
// ============================================

async function fetchFromErgast<T>(endpoint: string): Promise<T> {
  const url = `${ERGAST_BASE_URL}/${endpoint}.json`;
  console.log(`  Fetching: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ergast API error: ${response.status}`);
  }

  const data = await response.json();
  return data.MRData;
}

function parseDateTime(date: string, time?: string): Date {
  if (time) {
    return new Date(`${date}T${time}`);
  }
  return new Date(`${date}T00:00:00Z`);
}

// ============================================
// Sync Functions
// ============================================

async function syncDrivers(targetSeason: number): Promise<number> {
  console.log(`\n📊 Syncing drivers for ${targetSeason}...`);

  const data = await fetchFromErgast<{
    DriverTable: { Drivers: ErgastDriver[] };
  }>(`${targetSeason}/drivers`);

  const drivers = data.DriverTable.Drivers;
  let count = 0;

  for (const driver of drivers) {
    await prisma.driver.upsert({
      where: { ergastId: driver.driverId },
      update: {
        code: driver.code || null,
        number: driver.permanentNumber ? parseInt(driver.permanentNumber) : null,
        firstName: driver.givenName,
        lastName: driver.familyName,
        dateOfBirth: new Date(driver.dateOfBirth),
        nationality: driver.nationality,
      },
      create: {
        ergastId: driver.driverId,
        code: driver.code || null,
        number: driver.permanentNumber ? parseInt(driver.permanentNumber) : null,
        firstName: driver.givenName,
        lastName: driver.familyName,
        dateOfBirth: new Date(driver.dateOfBirth),
        nationality: driver.nationality,
      },
    });
    count++;
  }

  console.log(`  ✅ Synced ${count} drivers`);
  return count;
}

async function syncConstructors(targetSeason: number): Promise<number> {
  console.log(`\n🏎️ Syncing constructors for ${targetSeason}...`);

  const data = await fetchFromErgast<{
    ConstructorTable: { Constructors: ErgastConstructor[] };
  }>(`${targetSeason}/constructors`);

  const constructors = data.ConstructorTable.Constructors;
  let count = 0;

  for (const constructor of constructors) {
    await prisma.constructor.upsert({
      where: { ergastId: constructor.constructorId },
      update: {
        name: constructor.name,
        nationality: constructor.nationality,
      },
      create: {
        ergastId: constructor.constructorId,
        name: constructor.name,
        nationality: constructor.nationality,
      },
    });
    count++;
  }

  console.log(`  ✅ Synced ${count} constructors`);
  return count;
}

async function syncCircuits(targetSeason: number): Promise<number> {
  console.log(`\n🏁 Syncing circuits for ${targetSeason}...`);

  const data = await fetchFromErgast<{
    CircuitTable: { Circuits: ErgastCircuit[] };
  }>(`${targetSeason}/circuits`);

  const circuits = data.CircuitTable.Circuits;
  let count = 0;

  for (const circuit of circuits) {
    await prisma.circuit.upsert({
      where: { ergastId: circuit.circuitId },
      update: {
        name: circuit.circuitName,
        location: circuit.Location.locality,
        country: circuit.Location.country,
        latitude: parseFloat(circuit.Location.lat),
        longitude: parseFloat(circuit.Location.long),
      },
      create: {
        ergastId: circuit.circuitId,
        name: circuit.circuitName,
        location: circuit.Location.locality,
        country: circuit.Location.country,
        latitude: parseFloat(circuit.Location.lat),
        longitude: parseFloat(circuit.Location.long),
      },
    });
    count++;
  }

  console.log(`  ✅ Synced ${count} circuits`);
  return count;
}

async function syncRaces(targetSeason: number): Promise<number> {
  console.log(`\n🗓️ Syncing races for ${targetSeason}...`);

  const data = await fetchFromErgast<{
    RaceTable: { Races: ErgastRace[] };
  }>(`${targetSeason}`);

  const races = data.RaceTable.Races;
  let count = 0;

  for (const race of races) {
    // Find or create circuit
    const circuit = await prisma.circuit.findUnique({
      where: { ergastId: race.Circuit.circuitId },
    });

    if (!circuit) {
      console.log(`  ⚠️ Circuit not found: ${race.Circuit.circuitId}`);
      continue;
    }

    const hasSprint = !!race.Sprint;

    // Upsert race
    const savedRace = await prisma.race.upsert({
      where: {
        season_round: {
          season: parseInt(race.season),
          round: parseInt(race.round),
        },
      },
      update: {
        name: race.raceName,
        circuitId: circuit.id,
        date: parseDateTime(race.date, race.time),
        hasSprint,
      },
      create: {
        season: parseInt(race.season),
        round: parseInt(race.round),
        name: race.raceName,
        circuitId: circuit.id,
        date: parseDateTime(race.date, race.time),
        hasSprint,
      },
    });

    // Sync sessions
    await syncRaceSessions(savedRace.id, race);
    count++;
  }

  console.log(`  ✅ Synced ${count} races`);
  return count;
}

async function syncRaceSessions(
  raceId: string,
  race: ErgastRace
): Promise<void> {
  const sessions: { type: string; date: string; time?: string }[] = [];

  if (race.FirstPractice) {
    sessions.push({
      type: "FP1",
      date: race.FirstPractice.date,
      time: race.FirstPractice.time,
    });
  }

  if (race.SecondPractice) {
    sessions.push({
      type: "FP2",
      date: race.SecondPractice.date,
      time: race.SecondPractice.time,
    });
  }

  if (race.ThirdPractice) {
    sessions.push({
      type: "FP3",
      date: race.ThirdPractice.date,
      time: race.ThirdPractice.time,
    });
  }

  if (race.SprintQualifying) {
    sessions.push({
      type: "SPRINT_QUALIFYING",
      date: race.SprintQualifying.date,
      time: race.SprintQualifying.time,
    });
  }

  if (race.Sprint) {
    sessions.push({
      type: "SPRINT",
      date: race.Sprint.date,
      time: race.Sprint.time,
    });
  }

  if (race.Qualifying) {
    sessions.push({
      type: "QUALIFYING",
      date: race.Qualifying.date,
      time: race.Qualifying.time,
    });
  }

  // Race session
  sessions.push({
    type: "RACE",
    date: race.date,
    time: race.time,
  });

  // Delete existing sessions
  await prisma.session.deleteMany({ where: { raceId } });

  // Create new sessions
  for (const session of sessions) {
    await prisma.session.create({
      data: {
        raceId,
        type: session.type as
          | "FP1"
          | "FP2"
          | "FP3"
          | "SPRINT_QUALIFYING"
          | "SPRINT"
          | "QUALIFYING"
          | "RACE",
        dateTime: parseDateTime(session.date, session.time),
      },
    });
  }
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  console.log("🏎️ F1 Data Sync");
  console.log("================");
  console.log(`Season: ${season}`);
  console.log(`Full sync: ${fullSync}`);

  const startTime = Date.now();
  let totalSynced = 0;

  try {
    // Always sync these
    totalSynced += await syncDrivers(season);
    totalSynced += await syncConstructors(season);
    totalSynced += await syncCircuits(season);
    totalSynced += await syncRaces(season);

    // Optionally sync previous season
    if (fullSync && season > 2020) {
      console.log(`\n📅 Also syncing ${season - 1}...`);
      totalSynced += await syncDrivers(season - 1);
      totalSynced += await syncConstructors(season - 1);
      totalSynced += await syncCircuits(season - 1);
      totalSynced += await syncRaces(season - 1);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n================");
    console.log(`✅ Sync complete!`);
    console.log(`   Total items: ${totalSynced}`);
    console.log(`   Duration: ${duration}s`);
  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
