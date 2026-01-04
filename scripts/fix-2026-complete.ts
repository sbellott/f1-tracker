import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix2026Complete() {
  console.log('=== FIXING COMPLETE 2026 F1 GRID ===\n');

  // 1. Rename Sauber to Audi
  console.log('1. Renaming Sauber to Audi...');
  const sauber = await prisma.constructor.findFirst({
    where: { name: 'Sauber' }
  });
  if (sauber) {
    await prisma.constructor.update({
      where: { id: sauber.id },
      data: { name: 'Audi', color: '#1E1E1E' }
    });
    console.log('   ✅ Sauber → Audi');
  }

  // 2. Get Alpine constructor
  const alpine = await prisma.constructor.findFirst({
    where: { name: { contains: 'Alpine' } }
  });
  
  // 3. Remove Doohan from grid
  console.log('\n2. Updating Alpine lineup...');
  const doohan = await prisma.driver.findFirst({ where: { code: 'DOO' } });
  if (doohan) {
    await prisma.driver.update({
      where: { id: doohan.id },
      data: { constructorId: null }
    });
    console.log('   ❌ Jack Doohan → Reserve/Out');
  }

  // 4. Add Colapinto back to Alpine
  let colapinto = await prisma.driver.findFirst({ where: { code: 'COL' } });
  if (colapinto && alpine) {
    await prisma.driver.update({
      where: { id: colapinto.id },
      data: { constructorId: alpine.id }
    });
    console.log('   ✅ Franco Colapinto → Alpine');
  } else if (!colapinto && alpine) {
    colapinto = await prisma.driver.create({
      data: {
        code: 'COL',
        firstName: 'Franco',
        lastName: 'Colapinto',
        nationality: 'Argentine',
        permanentNumber: '43',
        constructorId: alpine.id
      }
    });
    console.log('   🆕 Created Franco Colapinto → Alpine');
  }

  // 5. Create Cadillac team (11th team)
  console.log('\n3. Adding Cadillac F1 Team (11th team)...');
  let cadillac = await prisma.constructor.findFirst({
    where: { name: { contains: 'Cadillac' } }
  });
  if (!cadillac) {
    cadillac = await prisma.constructor.create({
      data: {
        name: 'Cadillac F1 Team',
        nationality: 'American',
        color: '#C4A747' // Gold color for Cadillac
      }
    });
    console.log('   🆕 Created Cadillac F1 Team');
  }

  // 6. Add Pérez and Bottas to Cadillac
  console.log('\n4. Adding drivers to Cadillac...');
  const perez = await prisma.driver.findFirst({ where: { code: 'PER' } });
  if (perez && cadillac) {
    await prisma.driver.update({
      where: { id: perez.id },
      data: { constructorId: cadillac.id }
    });
    console.log('   ✅ Sergio Pérez → Cadillac');
  }

  const bottas = await prisma.driver.findFirst({ where: { code: 'BOT' } });
  if (bottas && cadillac) {
    await prisma.driver.update({
      where: { id: bottas.id },
      data: { constructorId: cadillac.id }
    });
    console.log('   ✅ Valtteri Bottas → Cadillac');
  }

  // 7. Reinitialize 2026 standings
  console.log('\n=== REINITIALIZING 2026 STANDINGS ===\n');
  
  await prisma.standing.deleteMany({ where: { season: 2026 } });

  const drivers = await prisma.driver.findMany({
    where: { constructorId: { not: null } },
    include: { constructor: true },
    orderBy: [
      { constructor: { name: 'asc' } },
      { lastName: 'asc' }
    ]
  });

  console.log(`Total drivers on 2026 grid: ${drivers.length}\n`);

  // Group drivers by team for display
  const teamDrivers = new Map<string, string[]>();
  for (const d of drivers) {
    const team = d.constructor?.name || 'Unknown';
    if (!teamDrivers.has(team)) teamDrivers.set(team, []);
    teamDrivers.get(team)!.push(`${d.firstName} ${d.lastName}`);
  }

  console.log('2026 GRID:');
  console.log('─'.repeat(50));
  for (const [team, driverList] of teamDrivers) {
    console.log(`${team}:`);
    driverList.forEach(d => console.log(`  • ${d}`));
  }
  console.log('─'.repeat(50));

  // Create driver standings
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
    pos++;
  }

  // Create constructor standings
  const teams = await prisma.constructor.findMany({
    where: { drivers: { some: {} } },
    orderBy: { name: 'asc' }
  });

  console.log(`\nTotal teams: ${teams.length}`);
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
    cPos++;
  }

  console.log('\n✅ 2026 grid complete!');
}

fix2026Complete()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
