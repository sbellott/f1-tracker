import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeStandings2026() {
  console.log('Initializing 2026 standings...');

  // Get all drivers with a constructor (active 2026 drivers)
  const drivers = await prisma.driver.findMany({
    where: {
      constructorId: { not: null }
    },
    include: {
      constructor: true
    },
    orderBy: [
      { constructor: { name: 'asc' } },
      { lastName: 'asc' }
    ]
  });

  console.log(`Found ${drivers.length} active drivers for 2026`);

  // Get all constructors
  const constructors = await prisma.constructor.findMany({
    where: {
      drivers: { some: {} } // Only constructors with drivers
    },
    orderBy: { name: 'asc' }
  });

  console.log(`Found ${constructors.length} active constructors for 2026`);

  // Create driver standings for 2026 (round 0 = pre-season)
  let driverPosition = 1;
  for (const driver of drivers) {
    await prisma.standing.upsert({
      where: {
        season_round_type_driverId: {
          season: 2026,
          round: 0,
          type: 'DRIVER',
          driverId: driver.id
        }
      },
      create: {
        season: 2026,
        round: 0,
        type: 'DRIVER',
        position: driverPosition,
        driverId: driver.id,
        points: 0,
        wins: 0
      },
      update: {
        position: driverPosition,
        points: 0,
        wins: 0
      }
    });
    console.log(`  ${driverPosition}. ${driver.firstName} ${driver.lastName} (${driver.constructor?.name})`);
    driverPosition++;
  }

  // Create constructor standings for 2026
  let constructorPosition = 1;
  for (const constructor of constructors) {
    await prisma.standing.upsert({
      where: {
        season_round_type_constructorId: {
          season: 2026,
          round: 0,
          type: 'CONSTRUCTOR',
          constructorId: constructor.id
        }
      },
      create: {
        season: 2026,
        round: 0,
        type: 'CONSTRUCTOR',
        position: constructorPosition,
        constructorId: constructor.id,
        points: 0,
        wins: 0
      },
      update: {
        position: constructorPosition,
        points: 0,
        wins: 0
      }
    });
    console.log(`  ${constructorPosition}. ${constructor.name}`);
    constructorPosition++;
  }

  console.log('\n✅ 2026 standings initialized successfully!');
  console.log(`   - ${drivers.length} driver standings created`);
  console.log(`   - ${constructors.length} constructor standings created`);
}

initializeStandings2026()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
