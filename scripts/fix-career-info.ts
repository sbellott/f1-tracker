/**
 * Fix driver career info by recalculating from our database results
 * This ensures bestFinish, totalRacesFinished, etc. are accurate with 2023-2025 data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing driver career info from database results...\n');

  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      ergastId: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { lastName: 'asc' },
  });

  let updated = 0;

  for (const driver of drivers) {
    // Get all race results for this driver from our DB
    const results = await prisma.driverRaceResult.findMany({
      where: { driverId: driver.id },
      select: {
        position: true,
        positionText: true,
        status: true,
        grid: true,
        raceName: true,
        season: true,
      },
    });

    if (results.length === 0) continue;

    // Calculate stats
    let bestFinish = 999;
    let totalRacesFinished = 0;
    let totalDNFs = 0;
    let firstPoleRace: string | null = null;
    let firstPoleSeason: number | null = null;
    let firstWinRace: string | null = null;
    let firstWinSeason: number | null = null;
    let lastWinRace: string | null = null;
    let lastWinSeason: number | null = null;
    let firstRaceRace: string | null = null;
    let firstRaceSeason: number | null = null;

    // Sort by season/round to find firsts
    const sortedResults = results.sort((a, b) => a.season - b.season);

    for (const result of sortedResults) {
      // Best finish (exclude position 0 which means NC/DNF)
      if (result.position > 0 && result.position < bestFinish) {
        bestFinish = result.position;
      }

      // Count finished races vs DNFs
      const isFinished = result.status === 'Finished' ||
                         (result.position > 0 && !result.status?.includes('Lap'));
      if (isFinished) {
        totalRacesFinished++;
      } else if (result.status && result.status !== 'Finished') {
        totalDNFs++;
      }

      // First race
      if (!firstRaceRace) {
        firstRaceRace = result.raceName;
        firstRaceSeason = result.season;
      }

      // First pole (grid position 1)
      if (result.grid === 1 && !firstPoleRace) {
        firstPoleRace = result.raceName;
        firstPoleSeason = result.season;
      }

      // First win
      if (result.position === 1 && !firstWinRace) {
        firstWinRace = result.raceName;
        firstWinSeason = result.season;
      }

      // Last win (keep updating)
      if (result.position === 1) {
        lastWinRace = result.raceName;
        lastWinSeason = result.season;
      }
    }

    // Update or create career info
    await prisma.driverCareerInfo.upsert({
      where: { driverId: driver.id },
      create: {
        driverId: driver.id,
        bestFinish: bestFinish === 999 ? 0 : bestFinish,
        totalRacesFinished,
        totalRaces: results.length,
        totalDNFs,
        firstRaceRace,
        firstRaceSeason,
        firstPoleRace,
        firstPoleSeason,
        firstWinRace,
        firstWinSeason,
        lastWinRace,
        lastWinSeason,
      },
      update: {
        bestFinish: bestFinish === 999 ? 0 : bestFinish,
        totalRacesFinished,
        totalRaces: results.length,
        totalDNFs,
        firstRaceRace,
        firstRaceSeason,
        firstPoleRace,
        firstPoleSeason,
        firstWinRace,
        firstWinSeason,
        lastWinRace,
        lastWinSeason,
        syncedAt: new Date(),
      },
    });

    const bestStr = bestFinish === 999 ? 'N/A' : `P${bestFinish}`;
    console.log(`${driver.firstName} ${driver.lastName}: best=${bestStr}, races=${results.length}, finished=${totalRacesFinished}`);
    updated++;
  }

  console.log(`\n✨ Updated career info for ${updated} drivers`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
