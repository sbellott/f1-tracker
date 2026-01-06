import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get actual race result counts per driver
  const drivers = await prisma.driver.findMany({
    select: { 
      firstName: true, 
      lastName: true,
      totalRaces: true,
      ergastId: true,
    },
    orderBy: { lastName: 'asc' },
  });
  
  console.log('Driver | DB totalRaces | Actual results in DB');
  console.log('-'.repeat(60));
  
  for (const d of drivers) {
    const actualCount = await prisma.driverRaceResult.count({
      where: { driver: { ergastId: d.ergastId } },
    });
    console.log(`${d.firstName} ${d.lastName} | ${d.totalRaces} | ${actualCount}`);
  }
}

main().finally(() => prisma.$disconnect());
