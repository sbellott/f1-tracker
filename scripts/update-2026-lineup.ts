import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Confirmed 2026 F1 Driver Lineup
const lineup2026 = [
  // McLaren (unchanged)
  { driverCode: 'NOR', team: 'McLaren' },
  { driverCode: 'PIA', team: 'McLaren' },
  
  // Ferrari (Hamilton joins from Mercedes, Leclerc stays)
  { driverCode: 'HAM', team: 'Ferrari' },
  { driverCode: 'LEC', team: 'Ferrari' },
  
  // Red Bull (Lawson replaces Perez)
  { driverCode: 'VER', team: 'Red Bull' },
  { driverCode: 'LAW', team: 'Red Bull' },
  
  // Mercedes (Antonelli replaces Hamilton)
  { driverCode: 'RUS', team: 'Mercedes' },
  { driverCode: 'ANT', team: 'Mercedes', firstName: 'Andrea Kimi', lastName: 'Antonelli', nationality: 'Italian', number: 12 },
  
  // Aston Martin (unchanged)
  { driverCode: 'ALO', team: 'Aston Martin' },
  { driverCode: 'STR', team: 'Aston Martin' },
  
  // Alpine (Doohan confirmed for full season)
  { driverCode: 'GAS', team: 'Alpine' },
  { driverCode: 'DOO', team: 'Alpine' },
  
  // Williams (Sainz joins from Ferrari)
  { driverCode: 'SAI', team: 'Williams' },
  { driverCode: 'ALB', team: 'Williams' },
  
  // RB/VCARB (Hadjar replaces Lawson)
  { driverCode: 'TSU', team: 'RB F1 Team' },
  { driverCode: 'HAD', team: 'RB F1 Team', firstName: 'Isack', lastName: 'Hadjar', nationality: 'French', number: 6 },
  
  // Sauber/Audi (Bortoleto joins as rookie)
  { driverCode: 'HUL', team: 'Sauber' },
  { driverCode: 'BOR', team: 'Sauber', firstName: 'Gabriel', lastName: 'Bortoleto', nationality: 'Brazilian', number: 5 },
  
  // Haas (Ocon joins from Alpine, Bearman full time)
  { driverCode: 'OCO', team: 'Haas' },
  { driverCode: 'BEA', team: 'Haas' },
];

// Drivers leaving F1 in 2026
const driversLeaving = ['PER', 'ZHO', 'BOT', 'COL', 'MAG'];

async function update2026Lineup() {
  console.log('Updating 2026 driver lineup...\n');

  // Get all constructors
  const constructors = await prisma.constructor.findMany();
  const constructorMap = new Map(constructors.map(c => [c.name, c.id]));
  
  console.log('Available teams:', Array.from(constructorMap.keys()).join(', '));

  // Remove drivers who are leaving F1
  for (const code of driversLeaving) {
    const driver = await prisma.driver.findFirst({ where: { code } });
    if (driver) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { constructorId: null }
      });
      console.log(`❌ ${driver.firstName} ${driver.lastName} (${code}) - removed from grid`);
    }
  }

  console.log('\n--- Updating 2026 lineup ---\n');

  // Update each driver's team assignment
  for (const entry of lineup2026) {
    const constructorId = constructorMap.get(entry.team);
    
    if (!constructorId) {
      console.log(`⚠️  Team not found: ${entry.team}`);
      continue;
    }

    // Find or create the driver
    let driver = await prisma.driver.findFirst({ where: { code: entry.driverCode } });
    
    if (!driver && entry.firstName && entry.lastName) {
      // Create new driver (rookies)
      driver = await prisma.driver.create({
        data: {
          code: entry.driverCode,
          firstName: entry.firstName,
          lastName: entry.lastName,
          nationality: entry.nationality || 'Unknown',
          permanentNumber: entry.number?.toString() || null,
          constructorId: constructorId
        }
      });
      console.log(`🆕 ${driver.firstName} ${driver.lastName} (${entry.driverCode}) → ${entry.team} [ROOKIE]`);
    } else if (driver) {
      // Update existing driver's team
      const oldTeam = driver.constructorId 
        ? constructors.find(c => c.id === driver!.constructorId)?.name 
        : 'No team';
      
      await prisma.driver.update({
        where: { id: driver.id },
        data: { constructorId: constructorId }
      });
      
      if (oldTeam !== entry.team) {
        console.log(`🔄 ${driver.firstName} ${driver.lastName} (${entry.driverCode}): ${oldTeam} → ${entry.team}`);
      } else {
        console.log(`✅ ${driver.firstName} ${driver.lastName} (${entry.driverCode}) → ${entry.team}`);
      }
    } else {
      console.log(`⚠️  Driver not found: ${entry.driverCode}`);
    }
  }

  // Now reinitialize 2026 standings with updated lineup
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

  console.log(`Found ${drivers.length} active drivers for 2026\n`);

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
    console.log(`${position}. ${driver.firstName} ${driver.lastName} (${driver.constructor?.name})`);
    position++;
  }

  // Create constructor standings
  const activeConstructors = await prisma.constructor.findMany({
    where: { drivers: { some: {} } },
    orderBy: { name: 'asc' }
  });

  console.log(`\nConstructor standings:`);
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

  console.log('\n✅ 2026 lineup updated successfully!');
  console.log(`   - ${drivers.length} drivers`);
  console.log(`   - ${activeConstructors.length} constructors`);
}

update2026Lineup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
