/**
 * Fix driver career statistics using accurate Ergast API data
 * The previous sync had a bug that capped totalRaces at 100
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

async function fetchDriverStats(ergastId: string): Promise<DriverStats | null> {
  try {
    // Get total number of races from metadata
    const resultsRes = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/results.json?limit=1`);
    if (!resultsRes.ok) {
      console.log(`    API returned ${resultsRes.status}`);
      return null;
    }
    
    const resultsData = await resultsRes.json();
    const totalRaces = parseInt(resultsData.MRData?.total) || 0;
    
    await delay(1000); // Increased delay
    
    // Get wins count
    const winsRes = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/results/1.json?limit=1`);
    const winsData = winsRes.ok ? await winsRes.json() : null;
    const totalWins = parseInt(winsData?.MRData?.total) || 0;
    
    await delay(1000);
    
    // Get podiums (positions 1-3)
    let totalPodiums = totalWins;
    const p2Res = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/results/2.json?limit=1`);
    const p2Data = p2Res.ok ? await p2Res.json() : null;
    totalPodiums += parseInt(p2Data?.MRData?.total) || 0;
    
    await delay(1000);
    
    const p3Res = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/results/3.json?limit=1`);
    const p3Data = p3Res.ok ? await p3Res.json() : null;
    totalPodiums += parseInt(p3Data?.MRData?.total) || 0;
    
    await delay(1000);
    
    // Get pole positions
    const polesRes = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/qualifying/1.json?limit=1`);
    const polesData = polesRes.ok ? await polesRes.json() : null;
    const totalPoles = parseInt(polesData?.MRData?.total) || 0;
    
    await delay(1000);
    
    // Get fastest laps
    const fastestRes = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/fastest/1/results.json?limit=1`);
    const fastestData = fastestRes.ok ? await fastestRes.json() : null;
    const totalFastestLaps = parseInt(fastestData?.MRData?.total) || 0;
    
    await delay(1000);
    
    // Get career points from standings
    const standingsRes = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/driverStandings.json?limit=100`);
    const standingsData = standingsRes.ok ? await standingsRes.json() : null;
    const standingsLists = standingsData?.MRData?.StandingsTable?.StandingsLists || [];
    
    let totalPoints = 0;
    let championships = 0;
    
    for (const list of standingsLists) {
      const standing = list.DriverStandings?.[0];
      if (standing) {
        // Only add points from most recent entry (cumulative)
        const pts = parseFloat(standing.points) || 0;
        if (pts > totalPoints) {
          totalPoints = pts;
        }
        if (standing.position === '1') {
          championships++;
        }
      }
    }
    
    // Actually, let's calculate total career points properly by summing all results
    await delay(1000);
    const allResultsRes = await fetch(`${ERGAST_BASE_URL}/drivers/${ergastId}/results.json?limit=500`);
    if (allResultsRes.ok) {
      const allData = await allResultsRes.json();
      const races = allData.MRData?.RaceTable?.Races || [];
      totalPoints = 0;
      for (const race of races) {
        const result = race.Results?.[0];
        if (result) {
          totalPoints += parseFloat(result.points) || 0;
        }
      }
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
    console.error(`Error fetching stats for ${ergastId}:`, error);
    return null;
  }
}

async function main() {
  console.log('🔧 Fixing driver career statistics...\n');
  
  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      ergastId: true,
      firstName: true,
      lastName: true,
      totalRaces: true,
    },
    orderBy: { lastName: 'asc' },
  });
  
  console.log(`Found ${drivers.length} drivers to update\n`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const driver of drivers) {
    console.log(`Processing ${driver.firstName} ${driver.lastName}...`);
    
    const stats = await fetchDriverStats(driver.ergastId);
    
    if (!stats) {
      console.log(`  ⚠️ Could not fetch stats, skipping`);
      skipped++;
      continue;
    }
    
    // Update the driver
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
    
    console.log(`  ✅ ${stats.totalRaces} races, ${stats.totalWins} wins, ${stats.totalPodiums} podiums, ${stats.championships} WDC`);
    updated++;
    
    // Rate limiting
    await delay(500);
  }
  
  console.log(`\n✨ Done! Updated ${updated} drivers, skipped ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());