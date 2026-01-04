import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix2026Lineup() {
  console.log('Fixing 2026 driver lineup...\n');

  // Get constructors
  const constructors = await prisma.constructor.findMany();
  const getConstructorId = (name: string) => {
    const c = constructors.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
    return c?.id;
  };

  const redBullId = getConstructorId('Red Bull');
  const rbTeamId = getConstructorId('RB F1 Team');

  console.log('Red Bull ID:', redBullId);
  console.log('RB F1 Team ID:', rbTeamId);

  // 1. Move Hadjar to Red Bull (was incorrectly at RB F1 Team)
  const hadjar = await prisma.driver.findFirst({ where: { code: 'HAD' } });
  if (hadjar && redBullId) {
    await prisma.driver.update({
      where: { id: hadjar.id },
      data: { constructorId: redBullId }
    });
    console.log('✅ Isack Hadjar → Red Bull');
  }

  // 2. Keep Lawson at RB F1 Team (was incorrectly at Red Bull)
  const lawson = await prisma.driver.findFirst({ where: { code: 'LAW' } });
  if (lawson && rbTeamId) {
    await prisma.driver.update({
      where: { id: lawson.id },
      data: { constructorId: rbTeamId }
    });
    console.log('✅ Liam Lawson → RB F1 Team (Racing Bulls)');
  }

  // 3. Remove Tsunoda from grid (he's reserve driver)
  const tsunoda = await prisma.driver.findFirst({ where: { code: 'TSU' } });
  if (tsunoda) {
    await prisma.driver.update({
      where: { id: tsunoda.id },
      data: { constructorId: null }
    });
    console.log('❌ Yuki Tsunoda → Reserve Driver (off grid)');
  }

  // 4. Add Arvid Lindblad as new rookie at RB F1 Team
  if (rbTeamId) {
    const lindblad = await prisma.driver.upsert({
      where: { code: 'LIN' },
      create: {
        code: 'LIN',
        firstName: 'Arvid',
        lastName: 'Lindblad',
        nationality: 'British',
        permanentNumber: '45',
        constructorId: rbTeamId
      },
      update: {
        constructorId: rbTeamId
      }
    });
    console.log('🆕 Arvid Lindblad → RB F1 Team (Racing Bulls) [ROOKIE]');
  }

  // Now reinitialize 2026 standings
  console.log('\n--- Reinitializing 2026 standings ---\n');

  // Delete old 2026 standings
  await prisma.standing.deleteMany({
    where: { season: 2026 }
  });

  // Get updated driver list
  const drivers = await prisma.driver.findMany({
    where: { constructorId: { not: null } },
    include: { constructor: true },
    orderBy: [
      { constructor: { name: 'asc' } },
      { lastName: 'asc' }
    ]
  });

  console.log(`Active drivers for 2026: ${drivers.length}\n`);

  // Create driver standings
  let position = 1;
  for (const driver of drivers) {
    await prisma.standing.create({
      data: {
        season: 2026,
        round: 0,
        type: 'DRIVER',
        position: position,
        driverId: driver.id,
        points: 0,
        wins: 0
      }
    });
    console.log(`${position}. ${driver.firstName} ${driver.lastName} - ${driver.constructor?.name}`);
    position++;
  }

  // Create constructor standings
  const activeConstructors = await prisma.constructor.findMany({
    where: { drivers: { some: {} } },
    orderBy: { name: 'asc' }
  });

  console.log(`\nConstructor standings (${activeConstructors.length} teams):`);
  let cPosition = 1;
  for (const constructor of activeConstructors) {
    await prisma.standing.create({
      data: {
        season: 2026,
        round: 0,
        type: 'CONSTRUCTOR',
        position: cPosition,
        constructorId: constructor.id,
        points: 0,
        wins: 0
      }
    });
    console.log(`${cPosition}. ${constructor.name}`);
    cPosition++;
  }

  console.log('\n✅ 2026 lineup fixed!');
}

fix2026Lineup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
