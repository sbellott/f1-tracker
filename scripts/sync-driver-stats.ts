/**
 * Sync driver career statistics from Ergast API
 * This updates totalRaces, totalPodiums, totalFastestLaps, totalPoints in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ERGAST_BASE_URL = 'https://api.jolpi.ca/ergast/f1';

interface DriverStats {
  totalRaces: number;
  totalWins: number;
  totalPodiums: number;
  totalPoles: number;
  totalFastestLaps: number;
  totalPoints: number;
  championships: number;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchDriverStats(ergastId: string): Promise<DriverStats> {
  console.log(`  Fetching stats for ${ergastId}...`);
  
  try {
    // Fetch all results for the driver - do sequentially to avoid rate limits
    const resultsRes = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/results.json?limit=500`);
    
    if (!resultsRes.ok) {
      console.log(`    Results API error: ${resultsRes.status}`);
      return getEmptyStats();
    }
    
    const resultsData = await resultsRes.json();
    const races = resultsData.MRData?.RaceTable?.Races || [];
    
    await delay(300);
    
    const standingsRes = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/driverStandings.json?limit=100`);
    const standingsData = standingsRes.ok ? await standingsRes.json() : { MRData: {} };
    const standings = standingsData.MRData?.StandingsTable?.StandingsLists || [];
    
    // Count stats
    let totalRaces = races.length;
    let totalWins = 0;
    let totalPodiums = 0;
    let totalFastestLaps = 0;
    let totalPoints = 0;
    
    for (const race of races) {
      const result = race.Results?.[0];
      if (!result) continue;
      
      const position = parseInt(result.position);
      if (position === 1) totalWins++;
      if (position <= 3) totalPodiums++;
      if (result.FastestLap?.rank === '1') totalFastestLaps++;
      totalPoints += parseFloat(result.points) || 0;
    }
    
    // Count championships
    let championships = 0;
    for (const standingList of standings) {
      const driverStanding = standingList.DriverStandings?.[0];
      if (driverStanding?.position === '1') {
        championships++;
      }
    }
    
    // Count poles - separate request
    await delay(300);
    const polesRes = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/qualifying/1.json?limit=500`);
    let totalPoles = 0;
    if (polesRes.ok) {
      const polesData = await polesRes.json();
      totalPoles = parseInt(polesData.MRData?.total) || 0;
    }
    
    return {
      totalRaces,
      totalWins,
      totalPodiums,
      totalPoles,
      totalFastestLaps,
      totalPoints,
      championships,
    };
  } catch (error) {
    console.error(`    Error fetching stats for ${ergastId}:`, error);
    return getEmptyStats();
  }
}

function getEmptyStats(): DriverStats {
  return {
    totalRaces: 0,
    totalWins: 0,
    totalPodiums: 0,
    totalPoles: 0,
    totalFastestLaps: 0,
    totalPoints: 0,
    championships: 0,
  };
}

async function main() {
  console.log('🏎️  Syncing driver statistics from Ergast API...\n');
  
  // Get all drivers from database
  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      ergastId: true,
      firstName: true,
      lastName: true,
      totalRaces: true,
    },
  });
  
  console.log(`Found ${drivers.length} drivers to sync\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (const driver of drivers) {
    console.log(`Processing ${driver.firstName} ${driver.lastName}...`);
    
    try {
      const stats = await fetchDriverStats(driver.ergastId);
      
      // Only update if we got data
      if (stats.totalRaces > 0 || stats.totalWins > 0) {
        await prisma.driver.update({
          where: { id: driver.id },
          data: {
            totalRaces: stats.totalRaces,
            totalWins: stats.totalWins,
            totalPodiums: stats.totalPodiums,
            totalPoles: stats.totalPoles,
            totalFastestLaps: stats.totalFastestLaps,
            totalPoints: stats.totalPoints,
            championships: stats.championships,
          },
        });
        
        console.log(`  ✅ Updated: ${stats.totalRaces} races, ${stats.totalWins} wins, ${stats.totalPodiums} podiums, ${stats.totalPoles} poles`);
        updated++;
      } else {
        console.log(`  ⚠️  No data found (might be a new driver)`);
      }
      
      // Rate limiting
      await delay(300);
    } catch (error) {
      console.error(`  ❌ Failed:`, error);
      failed++;
    }
  }
  
  console.log(`\n✨ Sync complete!`);
  console.log(`   Updated: ${updated} drivers`);
  console.log(`   Failed: ${failed} drivers`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());