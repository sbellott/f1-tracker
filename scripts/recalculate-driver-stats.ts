/**
 * Recalculate driver stats from our complete database
 * Uses known historical values (pre-2023) + calculated values (2023-2025)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Known career stats before 2023 (from official records)
// These won't change as they're historical
const HISTORICAL_STATS: Record<string, {
  racesBefor2023: number;
  winsBefor2023: number;
  podiumsBefor2023: number;
  polesBefor2023: number;
  fastestLapsBefor2023: number;
  pointsBefor2023: number;
  championships: number;
}> = {
  'max_verstappen': { racesBefor2023: 165, winsBefor2023: 35, podiumsBefor2023: 79, polesBefor2023: 20, fastestLapsBefor2023: 17, pointsBefor2023: 2080.5, championships: 4 },
  'hamilton': { racesBefor2023: 310, winsBefor2023: 103, podiumsBefor2023: 191, polesBefor2023: 104, fastestLapsBefor2023: 61, pointsBefor2023: 4405.5, championships: 7 },
  'leclerc': { racesBefor2023: 100, winsBefor2023: 5, podiumsBefor2023: 23, polesBefor2023: 18, fastestLapsBefor2023: 6, pointsBefor2023: 813, championships: 0 },
  'sainz': { racesBefor2023: 164, winsBefor2023: 1, podiumsBefor2023: 15, polesBefor2023: 3, fastestLapsBefor2023: 2, pointsBefor2023: 748.5, championships: 0 },
  'norris': { racesBefor2023: 83, winsBefor2023: 0, podiumsBefor2023: 6, polesBefor2023: 1, fastestLapsBefor2023: 5, pointsBefor2023: 305, championships: 0 },
  'russell': { racesBefor2023: 82, winsBefor2023: 1, podiumsBefor2023: 10, polesBefor2023: 1, fastestLapsBefor2023: 5, pointsBefor2023: 321, championships: 0 },
  'piastri': { racesBefor2023: 0, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 0, championships: 0 },
  'alonso': { racesBefor2023: 356, winsBefor2023: 32, podiumsBefor2023: 101, polesBefor2023: 22, fastestLapsBefor2023: 23, pointsBefor2023: 1997, championships: 2 },
  'stroll': { racesBefor2023: 123, winsBefor2023: 0, podiumsBefor2023: 3, polesBefor2023: 1, fastestLapsBefor2023: 0, pointsBefor2023: 194, championships: 0 },
  'perez': { racesBefor2023: 234, winsBefor2023: 4, podiumsBefor2023: 28, polesBefor2023: 2, fastestLapsBefor2023: 10, pointsBefor2023: 1105, championships: 0 },
  'albon': { racesBefor2023: 60, winsBefor2023: 0, podiumsBefor2023: 2, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 197, championships: 0 },
  'gasly': { racesBefor2023: 108, winsBefor2023: 1, podiumsBefor2023: 3, polesBefor2023: 0, fastestLapsBefor2023: 3, pointsBefor2023: 332, championships: 0 },
  'ocon': { racesBefor2023: 111, winsBefor2023: 1, podiumsBefor2023: 3, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 354, championships: 0 },
  'tsunoda': { racesBefor2023: 42, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 46, championships: 0 },
  'bottas': { racesBefor2023: 200, winsBefor2023: 10, podiumsBefor2023: 67, polesBefor2023: 20, fastestLapsBefor2023: 19, pointsBefor2023: 1792, championships: 0 },
  'zhou': { racesBefor2023: 22, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 6, championships: 0 },
  'hulkenberg': { racesBefor2023: 181, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 1, fastestLapsBefor2023: 2, pointsBefor2023: 521, championships: 0 },
  'kevin_magnussen': { racesBefor2023: 143, winsBefor2023: 0, podiumsBefor2023: 1, polesBefor2023: 0, fastestLapsBefor2023: 2, pointsBefor2023: 180, championships: 0 },
  'ricciardo': { racesBefor2023: 232, winsBefor2023: 8, podiumsBefor2023: 32, polesBefor2023: 3, fastestLapsBefor2023: 16, pointsBefor2023: 1285, championships: 0 },
  'sargeant': { racesBefor2023: 0, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 0, championships: 0 },
  'lawson': { racesBefor2023: 0, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 0, championships: 0 },
  'de_vries': { racesBefor2023: 1, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 2, championships: 0 },
  // New 2024-2025 drivers
  'bearman': { racesBefor2023: 0, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 0, championships: 0 },
  'colapinto': { racesBefor2023: 0, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 0, championships: 0 },
  'antonelli': { racesBefor2023: 0, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 0, championships: 0 },
  'bortoleto': { racesBefor2023: 0, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 0, championships: 0 },
  'hadjar': { racesBefor2023: 0, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 0, championships: 0 },
  'doohan': { racesBefor2023: 0, winsBefor2023: 0, podiumsBefor2023: 0, polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 0, championships: 0 },
};

async function main() {
  console.log('📊 Recalculating driver stats from database...\n');
  
  const drivers = await prisma.driver.findMany({
    select: { id: true, ergastId: true, firstName: true, lastName: true },
    orderBy: { lastName: 'asc' },
  });
  
  for (const driver of drivers) {
    // Get all race results from our DB (2023-2025)
    const results = await prisma.driverRaceResult.findMany({
      where: { driverId: driver.id },
    });
    
    // Calculate stats from 2023-2025
    let recentRaces = results.length;
    let recentWins = 0;
    let recentPodiums = 0;
    let recentFastestLaps = 0;
    let recentPoints = 0;
    
    for (const r of results) {
      if (r.position === 1) recentWins++;
      if (r.position <= 3 && r.position > 0) recentPodiums++;
      if (r.fastestLap) recentFastestLaps++;
      recentPoints += r.points;
    }
    
    // Get historical stats if available
    const historical = HISTORICAL_STATS[driver.ergastId] || {
      racesBefor2023: 0, winsBefor2023: 0, podiumsBefor2023: 0,
      polesBefor2023: 0, fastestLapsBefor2023: 0, pointsBefor2023: 0, championships: 0,
    };
    
    // Calculate totals
    const totalRaces = historical.racesBefor2023 + recentRaces;
    const totalWins = historical.winsBefor2023 + recentWins;
    const totalPodiums = historical.podiumsBefor2023 + recentPodiums;
    const totalPoles = historical.polesBefor2023; // We don't have recent poles data
    const totalFastestLaps = historical.fastestLapsBefor2023 + recentFastestLaps;
    const totalPoints = historical.pointsBefor2023 + recentPoints;
    
    // Update driver
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        totalRaces,
        totalWins,
        totalPodiums,
        totalPoles,
        totalFastestLaps,
        totalPoints,
        championships: historical.championships,
      },
    });
    
    console.log(`${driver.firstName} ${driver.lastName}: ${totalRaces} races, ${totalWins} wins, ${totalPodiums} podiums, ${historical.championships} WDC`);
  }
  
  console.log('\n✨ Stats recalculated!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
