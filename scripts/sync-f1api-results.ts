/**
 * Sync recent race results from F1API.dev (2023-2024)
 * This script populates the DriverRaceResult table with current season data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const F1API_BASE_URL = 'https://f1api.dev/api';

interface F1APIRaceResult {
  position: number;
  points: number;
  grid: number;
  time: string | null;
  fastLap: string | null;
  retired: string | null;
  driver: {
    driverId: string;
    number: number;
    shortName: string;
    name: string;
    surname: string;
    nationality: string;
    birthday: string;
  };
  team: {
    teamId: string;
    teamName: string;
    nationality: string;
  };
}

interface F1APIRace {
  round: string;
  date: string;
  raceName: string;
  circuit: {
    circuitId: string;
    circuitName: string;
    country: string;
    city: string;
  };
  results: F1APIRaceResult[];
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRaceResults(season: number, round: number): Promise<F1APIRace | null> {
  try {
    const response = await fetch(`${F1API_BASE_URL}/${season}/${round}/race`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.races || null;
  } catch (error) {
    console.error(`Error fetching ${season} round ${round}:`, error);
    return null;
  }
}

// Mapping from F1API driver IDs to Ergast IDs
function mapToErgastId(f1apiId: string): string {
  const mapping: Record<string, string> = {
    'magnussen': 'kevin_magnussen',
    // Most IDs are the same between F1API and Ergast
  };
  return mapping[f1apiId] || f1apiId;
}

async function syncSeasonResults(season: number) {
  console.log(`\n📅 Syncing ${season} season results...`);
  
  let synced = 0;
  let skipped = 0;
  
  // F1 seasons typically have 20-24 races
  for (let round = 1; round <= 24; round++) {
    const race = await fetchRaceResults(season, round);
    
    if (!race || !race.results || race.results.length === 0) {
      // No more races for this season
      if (round > 1) break;
      continue;
    }
    
    console.log(`  Processing ${race.raceName} (Round ${round})...`);
    
    for (const result of race.results) {
      // Find driver in our database by ergastId
      const ergastId = mapToErgastId(result.driver.driverId);
      const driver = await prisma.driver.findUnique({
        where: { ergastId },
        select: { id: true, firstName: true, lastName: true },
      });
      
      if (!driver) {
        // Driver not in our database, skip
        continue;
      }
      
      // Check if result already exists
      const existing = await prisma.driverRaceResult.findUnique({
        where: {
          driverId_season_round: {
            driverId: driver.id,
            season,
            round,
          },
        },
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Parse position - can be number or string like "NC", "DSQ", "DNF"
      const positionValue = typeof result.position === 'number' 
        ? result.position 
        : (parseInt(String(result.position)) || 0);
      const positionText = String(result.position);
      
      // Parse grid - can be number or "not available"
      const gridValue = typeof result.grid === 'number' ? result.grid : 0;
      
      // Create the result
      await prisma.driverRaceResult.create({
        data: {
          driverId: driver.id,
          season,
          round,
          raceName: race.raceName,
          circuitName: race.circuit.circuitName,
          date: new Date(race.date),
          position: positionValue,
          positionText: positionText,
          points: result.points,
          grid: gridValue,
          laps: 0, // F1API doesn't provide laps
          status: result.retired || 'Finished',
          time: result.time,
          fastestLap: result.fastLap !== null,
          fastestLapRank: result.fastLap ? 1 : null,
          constructorId: result.team.teamId,
          constructorName: result.team.teamName,
        },
      });
      
      synced++;
    }
    
    // Rate limiting
    await delay(200);
  }
  
  console.log(`  ✅ ${season}: Synced ${synced} new results, skipped ${skipped} existing`);
  return { synced, skipped };
}

async function updateDriverStats() {
  console.log('\n📊 Updating driver career stats from synced results...');
  
  // Get all drivers
  const drivers = await prisma.driver.findMany({
    select: { id: true, firstName: true, lastName: true },
  });
  
  for (const driver of drivers) {
    // Get all race results for this driver
    const results = await prisma.driverRaceResult.findMany({
      where: { driverId: driver.id },
    });
    
    if (results.length === 0) continue;
    
    // Calculate stats
    let totalRaces = results.length;
    let totalWins = 0;
    let totalPodiums = 0;
    let totalFastestLaps = 0;
    let totalPoints = 0;
    
    for (const result of results) {
      if (result.position === 1) totalWins++;
      if (result.position <= 3) totalPodiums++;
      if (result.fastestLap) totalFastestLaps++;
      totalPoints += result.points;
    }
    
    // Get current values from driver
    const currentDriver = await prisma.driver.findUnique({
      where: { id: driver.id },
      select: {
        totalRaces: true,
        totalWins: true,
        totalPodiums: true,
        totalFastestLaps: true,
        totalPoints: true,
      },
    });
    
    // Update if new values are higher (we might have more recent data)
    if (currentDriver) {
      const newTotalRaces = Math.max(currentDriver.totalRaces, totalRaces);
      const newTotalWins = Math.max(currentDriver.totalWins, totalWins);
      const newTotalPodiums = Math.max(currentDriver.totalPodiums, totalPodiums);
      const newTotalFastestLaps = Math.max(currentDriver.totalFastestLaps, totalFastestLaps);
      const newTotalPoints = Math.max(currentDriver.totalPoints, totalPoints);
      
      if (
        newTotalRaces !== currentDriver.totalRaces ||
        newTotalWins !== currentDriver.totalWins ||
        newTotalPodiums !== currentDriver.totalPodiums ||
        newTotalFastestLaps !== currentDriver.totalFastestLaps ||
        newTotalPoints !== currentDriver.totalPoints
      ) {
        await prisma.driver.update({
          where: { id: driver.id },
          data: {
            totalRaces: newTotalRaces,
            totalWins: newTotalWins,
            totalPodiums: newTotalPodiums,
            totalFastestLaps: newTotalFastestLaps,
            totalPoints: newTotalPoints,
          },
        });
        console.log(`  Updated ${driver.firstName} ${driver.lastName}: ${newTotalRaces} races, ${newTotalWins} wins`);
      }
    }
  }
}

async function main() {
  console.log('🏎️  Syncing F1 race results from F1API.dev...\n');
  
  try {
    // Sync 2024 and 2023 results
    const results2024 = await syncSeasonResults(2024);
    const results2023 = await syncSeasonResults(2023);
    
    // Update driver stats based on synced results
    await updateDriverStats();
    
    console.log('\n✨ Sync complete!');
    console.log(`   Total synced: ${results2024.synced + results2023.synced} results`);
    console.log(`   Total skipped: ${results2024.skipped + results2023.skipped} existing`);
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());