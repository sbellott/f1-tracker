import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addLindblad() {
  console.log('Adding Arvid Lindblad to RB F1 Team...\n');

  // Get RB F1 Team constructor
  const rbTeam = await prisma.constructor.findFirst({
    where: { name: { contains: 'RB F1 Team' } }
  });

  if (!rbTeam) {
    console.log('❌ RB F1 Team not found!');
    return;
  }

  // Check if Lindblad already exists
  let lindblad = await prisma.driver.findFirst({
    where: { code: 'LIN' }
  });

  if (!lindblad) {
    // Create new driver
    lindblad = await prisma.driver.create({
      data: {
        code: 'LIN',
        firstName: 'Arvid',
        lastName: 'Lindblad',
        nationality: 'British',
        permanentNumber: '45',
        constructorId: rbTeam.id
      }
    });
    console.log('🆕 Created Arvid Lindblad');
  } else {
    // Update existing
    await prisma.driver.update({
      where: { id: lindblad.id },
      data: { constructorId: rbTeam.id }
    });
    console.log('✅ Updated Arvid Lindblad');
  }

  console.log('✅ Arvid Lindblad → RB F1 Team (Racing Bulls) [ROOKIE]');

  // Reinitialize standings
  console.log('\n--- Reinitializing 2026 standings ---\n');

  await prisma.standing.deleteMany({ where: { season: 2026 } });

  const drivers = await prisma.driver.findMany({
    where: { constructorId: { not: null } },
    include: { constructor: true },
    orderBy: [
      { constructor: { name: 'asc' } },
      { lastName: 'asc' }
    ]
  });

  console.log(`Active drivers: ${drivers.length}\n`);

  let pos = 1;
  for (const d of drivers) {
    await prisma.standing.create({
      data: {
        season: 2026,
        round: 0,
        type: 'DRIVER',
        position: pos,
        driverId: d.id,
        points: 0,
        wins: 0
      }
    });
    console.log(`${pos}. ${d.firstName} ${d.lastName} - ${d.constructor?.name}`);
    pos++;
  }

  const teams = await prisma.constructor.findMany({
    where: { drivers: { some: {} } },
    orderBy: { name: 'asc' }
  });

  console.log(`\nConstructors: ${teams.length}`);
  let cPos = 1;
  for (const t of teams) {
    await prisma.standing.create({
      data: {
        season: 2026,
        round: 0,
        type: 'CONSTRUCTOR',
        position: cPos,
        constructorId: t.id,
        points: 0,
        wins: 0
      }
    });
    console.log(`${cPos}. ${t.name}`);
    cPos++;
  }

  console.log('\n✅ Done!');
}

addLindblad()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
