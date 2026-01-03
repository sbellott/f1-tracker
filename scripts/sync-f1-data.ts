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
// Types - Add result types
// ============================================

interface ErgastResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  grid: string;
  laps: string;
  status: string;
  Time?: { millis?: string; time?: string };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: { time: string };
  };
}

interface ErgastQualifyingResult {
  number: string;
  position: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

interface ErgastRaceResults {
  season: string;
  round: string;
  raceName: string;
  Circuit: ErgastCircuit;
  date: string;
  Results: ErgastResult[];
}

interface ErgastQualifyingResults {
  season: string;
  round: string;
  raceName: string;
  QualifyingResults: ErgastQualifyingResult[];
}

interface ErgastSprintResults {
  season: string;
  round: string;
  raceName: string;
  SprintResults: ErgastResult[];
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
        city: circuit.Location.locality,
        country: circuit.Location.country,
      },
      create: {
        ergastId: circuit.circuitId,
        name: circuit.circuitName,
        city: circuit.Location.locality,
        country: circuit.Location.country,
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
  await prisma.raceSession.deleteMany({ where: { raceId } });

  // Create new sessions
  for (const session of sessions) {
    await prisma.raceSession.create({
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
// Sync Session Results
// ============================================

async function syncRaceResults(targetSeason: number): Promise<number> {
  console.log(`\n🏆 Syncing race results for ${targetSeason}...`);
  
  let count = 0;
  
  // Get all races for the season
  const races = await prisma.race.findMany({
    where: { season: targetSeason },
    include: { sessions: true },
    orderBy: { round: 'asc' }
  });
  
  for (const race of races) {
    // Only sync if race date is in the past
    if (new Date(race.date) > new Date()) {
      console.log(`  ⏭️ Skipping future race: ${race.name}`);
      continue;
    }
    
    try {
      // Sync race results
      const raceSession = race.sessions.find(s => s.type === 'RACE');
      if (raceSession) {
        const raceData = await fetchFromErgast<{
          RaceTable: { Races: ErgastRaceResults[] };
        }>(`${targetSeason}/${race.round}/results`);
        
        if (raceData.RaceTable.Races.length > 0) {
          const results = raceData.RaceTable.Races[0].Results;
          const resultsJson = formatRaceResults(results);
          
          await prisma.raceSession.update({
            where: { id: raceSession.id },
            data: { 
              completed: true,
              resultsJson 
            }
          });
          count++;
          console.log(`  ✅ Race results synced for ${race.name}`);
        }
      }
      
      // Sync qualifying results
      const qualifyingSession = race.sessions.find(s => s.type === 'QUALIFYING');
      if (qualifyingSession) {
        const qualifyingData = await fetchFromErgast<{
          RaceTable: { Races: ErgastQualifyingResults[] };
        }>(`${targetSeason}/${race.round}/qualifying`);
        
        if (qualifyingData.RaceTable.Races.length > 0 && qualifyingData.RaceTable.Races[0].QualifyingResults) {
          const results = qualifyingData.RaceTable.Races[0].QualifyingResults;
          const resultsJson = formatQualifyingResults(results);
          
          await prisma.raceSession.update({
            where: { id: qualifyingSession.id },
            data: { 
              completed: true,
              resultsJson 
            }
          });
          count++;
          console.log(`  ✅ Qualifying results synced for ${race.name}`);
        }
      }
      
      // Sync sprint results if exists
      if (race.hasSprint) {
        const sprintSession = race.sessions.find(s => s.type === 'SPRINT');
        if (sprintSession) {
          const sprintData = await fetchFromErgast<{
            RaceTable: { Races: ErgastSprintResults[] };
          }>(`${targetSeason}/${race.round}/sprint`);
          
          if (sprintData.RaceTable.Races.length > 0 && sprintData.RaceTable.Races[0].SprintResults) {
            const results = sprintData.RaceTable.Races[0].SprintResults;
            const resultsJson = formatRaceResults(results);
            
            await prisma.raceSession.update({
              where: { id: sprintSession.id },
              data: { 
                completed: true,
                resultsJson 
              }
            });
            count++;
            console.log(`  ✅ Sprint results synced for ${race.name}`);
          }
        }
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`  ⚠️ Could not sync results for ${race.name}: ${error}`);
    }
  }
  
  console.log(`  ✅ Synced ${count} session results`);
  return count;
}

function formatRaceResults(results: ErgastResult[]): object {
  return {
    sessionType: 'RACE',
    positions: results.map(r => ({
      position: parseInt(r.position),
      driverId: r.Driver.driverId,
      driverCode: r.Driver.code || r.Driver.driverId.substring(0, 3).toUpperCase(),
      driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
      constructorId: r.Constructor.constructorId,
      constructorName: r.Constructor.name,
      time: r.position === '1' ? r.Time?.time : (r.status === 'Finished' ? `+${r.Time?.time}` : null),
      laps: parseInt(r.laps),
      points: parseFloat(r.points),
      status: r.status !== 'Finished' ? r.status : undefined,
      fastestLap: r.FastestLap?.rank === '1',
      gridPosition: parseInt(r.grid)
    })),
    fastestLap: results.find(r => r.FastestLap?.rank === '1') ? {
      driverId: results.find(r => r.FastestLap?.rank === '1')!.Driver.driverId,
      time: results.find(r => r.FastestLap?.rank === '1')!.FastestLap!.Time.time,
      lap: parseInt(results.find(r => r.FastestLap?.rank === '1')!.FastestLap!.lap)
    } : undefined
  };
}

function formatQualifyingResults(results: ErgastQualifyingResult[]): object {
  return {
    sessionType: 'QUALIFYING',
    positions: results.map(r => ({
      position: parseInt(r.position),
      driverId: r.Driver.driverId,
      driverCode: r.Driver.code || r.Driver.driverId.substring(0, 3).toUpperCase(),
      driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
      constructorId: r.Constructor.constructorId,
      constructorName: r.Constructor.name,
      time: r.Q3 || r.Q2 || r.Q1 || '-',
      q1: r.Q1,
      q2: r.Q2,
      q3: r.Q3
    })),
    polePosition: results.length > 0 ? results[0].Driver.driverId : undefined
  };
}

// ============================================
// Sync Circuit History (winners per year)
// ============================================

async function syncCircuitHistory(targetSeason: number): Promise<number> {
  console.log(`\n📜 Syncing circuit history...`);
  
  let count = 0;
  
  // Get all circuits
  const circuits = await prisma.circuit.findMany();
  
  for (const circuit of circuits) {
    try {
      // Get past 10 years of winners for this circuit
      for (let year = targetSeason - 1; year >= targetSeason - 10 && year >= 2014; year--) {
        const raceData = await fetchFromErgast<{
          RaceTable: { Races: ErgastRaceResults[] };
        }>(`${year}/circuits/${circuit.ergastId}/results`);
        
        if (raceData.RaceTable.Races.length > 0) {
          const race = raceData.RaceTable.Races[0];
          if (race.Results && race.Results.length > 0) {
            const winner = race.Results[0];
            const pole = race.Results.find(r => r.grid === '1');
            const fastestLap = race.Results.find(r => r.FastestLap?.rank === '1');
            
            // Find or get driver IDs from our database
            const winnerDriver = await prisma.driver.findUnique({ where: { ergastId: winner.Driver.driverId } });
            const poleDriver = pole ? await prisma.driver.findUnique({ where: { ergastId: pole.Driver.driverId } }) : null;
            const fastestLapDriver = fastestLap ? await prisma.driver.findUnique({ where: { ergastId: fastestLap.Driver.driverId } }) : null;
            
            await prisma.circuitHistory.upsert({
              where: {
                circuitId_season: {
                  circuitId: circuit.id,
                  season: year
                }
              },
              update: {
                winnerId: winnerDriver?.id || null,
                poleId: poleDriver?.id || null,
                fastestLapId: fastestLapDriver?.id || null,
                winnerTime: winner.Time?.time || null
              },
              create: {
                circuitId: circuit.id,
                season: year,
                winnerId: winnerDriver?.id || null,
                poleId: poleDriver?.id || null,
                fastestLapId: fastestLapDriver?.id || null,
                winnerTime: winner.Time?.time || null
              }
            });
            count++;
          }
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } catch (error) {
      console.log(`  ⚠️ Could not sync history for ${circuit.name}: ${error}`);
    }
  }
  
  console.log(`  ✅ Synced ${count} circuit history entries`);
  return count;
}

// ============================================
// Main - Updated to include results sync
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
    
    // Sync session results
    totalSynced += await syncRaceResults(season);

    // Optionally sync previous season and circuit history
    if (fullSync && season > 2020) {
      console.log(`\n📅 Also syncing ${season - 1}...`);
      totalSynced += await syncDrivers(season - 1);
      totalSynced += await syncConstructors(season - 1);
      totalSynced += await syncCircuits(season - 1);
      totalSynced += await syncRaces(season - 1);
      totalSynced += await syncRaceResults(season - 1);
      
      // Sync circuit history
      totalSynced += await syncCircuitHistory(season);
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