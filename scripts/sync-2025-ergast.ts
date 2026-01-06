/**
 * Sync 2025 race results from Ergast/Jolpica API
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ERGAST_BASE = 'https://api.jolpi.ca/ergast/f1';

interface ErgastResult {
  position: string;
  positionText: string;
  points: string;
  grid: string;
  laps: string;
  status: string;
  Time?: { time: string };
  FastestLap?: { rank: string };
  Driver: {
    driverId: string;
    givenName: string;
    familyName: string;
  };
  Constructor: {
    constructorId: string;
    name: string;
  };
}

interface ErgastRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
  };
  date: string;
  Results: ErgastResult[];
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllResults(season: number): Promise<ErgastRace[]> {
  const allRaces: ErgastRace[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    console.log(`  Fetching results offset=${offset}...`);
    const res = await fetch(`${ERGAST_BASE}/${season}/results.json?limit=${limit}&offset=${offset}`);

    if (!res.ok) {
      console.error(`API error: ${res.status}`);
      break;
    }

    const data = await res.json();
    const races = data.MRData?.RaceTable?.Races || [];

    if (races.length === 0) break;

    allRaces.push(...races);
    offset += limit;

    const total = parseInt(data.MRData?.total) || 0;
    if (offset >= total) break;

    await delay(500);
  }

  return allRaces;
}

async function main() {
  console.log('🏎️ Syncing 2025 race results from Ergast/Jolpica...\n');

  // First, delete existing 2025 data to avoid duplicates
  const deleted = await prisma.driverRaceResult.deleteMany({
    where: { season: 2025 }
  });
  console.log(`🗑️ Deleted ${deleted.count} existing 2025 results\n`);

  // Fetch all 2025 results
  const races = await fetchAllResults(2025);
  console.log(`\n📊 Found ${races.length} races for 2025\n`);

  let synced = 0;
  let skipped = 0;

  for (const race of races) {
    const round = parseInt(race.round);
    const season = parseInt(race.season);

    console.log(`Processing ${race.raceName} (Round ${round})...`);

    for (const result of race.Results) {
      // Find driver by ergastId
      const driver = await prisma.driver.findUnique({
        where: { ergastId: result.Driver.driverId },
        select: { id: true }
      });

      if (!driver) {
        skipped++;
        continue;
      }

      const position = parseInt(result.position) || 0;
      const grid = parseInt(result.grid) || 0;
      const laps = parseInt(result.laps) || 0;
      const points = parseFloat(result.points) || 0;

      await prisma.driverRaceResult.create({
        data: {
          driverId: driver.id,
          season,
          round,
          raceName: race.raceName,
          circuitName: race.Circuit.circuitName,
          date: new Date(race.date),
          position,
          positionText: result.positionText,
          points,
          grid,
          laps,
          status: result.status,
          time: result.Time?.time || null,
          fastestLap: result.FastestLap?.rank === '1',
          fastestLapRank: result.FastestLap ? parseInt(result.FastestLap.rank) : null,
          constructorId: result.Constructor.constructorId,
          constructorName: result.Constructor.name,
        }
      });

      synced++;
    }
  }

  console.log(`\n✅ Synced ${synced} results, skipped ${skipped} (driver not found)`);

  // Now recalculate driver stats
  console.log('\n📊 Recalculating driver stats...');

  const drivers = await prisma.driver.findMany({
    select: { id: true, ergastId: true, firstName: true, lastName: true }
  });

  for (const driver of drivers) {
    const results = await prisma.driverRaceResult.findMany({
      where: { driverId: driver.id },
    });

    if (results.length === 0) continue;

    // Calculate from results
    let wins = 0;
    let podiums = 0;
    let fastestLaps = 0;
    let points = 0;

    for (const r of results) {
      if (r.position === 1) wins++;
      if (r.position >= 1 && r.position <= 3) podiums++;
      if (r.fastestLap) fastestLaps++;
      points += r.points;
    }

    // Get historical stats
    const existing = await prisma.driver.findUnique({
      where: { id: driver.id },
      select: { totalRaces: true, totalWins: true, totalPodiums: true, totalFastestLaps: true, totalPoints: true, championships: true }
    });

    // Use max of existing (historical) vs calculated (2023-2025)
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        totalRaces: Math.max(existing?.totalRaces || 0, results.length),
        totalWins: Math.max(existing?.totalWins || 0, wins),
        totalPodiums: Math.max(existing?.totalPodiums || 0, podiums),
        totalFastestLaps: Math.max(existing?.totalFastestLaps || 0, fastestLaps),
      }
    });
  }

  console.log('\n✨ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
