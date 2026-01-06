/**
 * Fix constructor data - correct names, stats and metadata
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing constructor data...\n');

  // Fix "Audi" that is actually Sauber (ergastId = sauber)
  const sauberAsMisnamed = await prisma.constructor.findUnique({
    where: { ergastId: 'sauber' }
  });

  if (sauberAsMisnamed && sauberAsMisnamed.name === 'Audi') {
    console.log('Fixing Sauber (was incorrectly named Audi)...');
    await prisma.constructor.update({
      where: { id: sauberAsMisnamed.id },
      data: {
        name: 'Sauber',
        shortName: 'Sauber',
      }
    });
    console.log('  ✅ Renamed to Sauber');
  }

  // Update Kick Sauber name to just "Kick Sauber"
  const kickSauber = await prisma.constructor.findUnique({
    where: { ergastId: 'kick_sauber' }
  });

  if (kickSauber) {
    console.log('Updating Kick Sauber name...');
    await prisma.constructor.update({
      where: { id: kickSauber.id },
      data: {
        name: 'Kick Sauber',
        shortName: 'Kick Sauber',
        color: '#52E252',
      }
    });
    console.log('  ✅ Updated to Kick Sauber');
  }

  // Add metadata for Cadillac (future 2026 team, announced as GM/Cadillac)
  const cadillac = await prisma.constructor.findUnique({
    where: { ergastId: 'cadillac' }
  });

  if (cadillac) {
    console.log('Adding Cadillac metadata...');
    await prisma.constructor.update({
      where: { id: cadillac.id },
      data: {
        base: 'Charlotte, USA',
        engine: 'General Motors',
        teamPrincipal: 'TBD',
        technicalDirector: 'TBD',
        color: '#1E3A5F',
        nationality: 'American',
      }
    });
    console.log('  ✅ Updated Cadillac');
  }

  // Update Audi (actual Audi 2026 entry)
  const audi = await prisma.constructor.findUnique({
    where: { ergastId: 'audi' }
  });

  if (audi) {
    console.log('Updating Audi metadata...');
    await prisma.constructor.update({
      where: { id: audi.id },
      data: {
        name: 'Audi',
        base: 'Hinwil, Switzerland',
        engine: 'Audi',
        teamPrincipal: 'Mattia Binotto',
        technicalDirector: 'James Key',
        color: '#FF0000',
        nationality: 'German',
      }
    });
    console.log('  ✅ Updated Audi');
  }

  // Fix RB team
  const rb = await prisma.constructor.findUnique({
    where: { ergastId: 'rb' }
  });

  if (rb) {
    console.log('Updating RB metadata...');
    await prisma.constructor.update({
      where: { id: rb.id },
      data: {
        name: 'Racing Bulls',
        shortName: 'RB',
        color: '#6692FF',
      }
    });
    console.log('  ✅ Updated RB → Racing Bulls');
  }

  // Update Alpine color to pink
  const alpine = await prisma.constructor.findUnique({
    where: { ergastId: 'alpine' }
  });

  if (alpine) {
    console.log('Updating Alpine color...');
    await prisma.constructor.update({
      where: { id: alpine.id },
      data: {
        color: '#FF87BC',
      }
    });
    console.log('  ✅ Updated Alpine color');
  }

  console.log('\n--- Final constructors ---');
  const constructors = await prisma.constructor.findMany({
    select: { name: true, ergastId: true, totalWins: true, totalPodiums: true, championships: true, base: true, engine: true },
    orderBy: { name: 'asc' }
  });

  for (const c of constructors) {
    console.log(`${c.name} (${c.ergastId}): ${c.totalWins}W/${c.totalPodiums}P/${c.championships}T | ${c.base || 'N/A'} | ${c.engine || 'N/A'}`);
  }

  console.log('\n✨ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
