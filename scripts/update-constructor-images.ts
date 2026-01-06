/**
 * Update constructor images from official F1 website
 * Uses the media.formula1.com CDN for 2025 car images
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping from our ergastId to F1 website team folder name
const TEAM_IMAGE_MAP: Record<string, string> = {
  'ferrari': 'ferrari',
  'mclaren': 'mclaren',
  'mercedes': 'mercedes',
  'red_bull': 'redbullracing',
  'alpine': 'alpine',
  'aston_martin': 'astonmartin',
  'haas': 'haasf1team',
  'sauber': 'kicksauber',
  'kick_sauber': 'kicksauber',
  'rb': 'racingbulls',
  'williams': 'williams',
};

// Generate the official F1 car image URL
function getCarImageUrl(f1TeamId: string): string {
  return `https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2025/${f1TeamId}/2025${f1TeamId}carright.webp`;
}

async function main() {
  console.log('🏎️ Updating constructor images from official F1 website...\n');

  const constructors = await prisma.constructor.findMany({
    select: { id: true, ergastId: true, name: true, logoUrl: true },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${constructors.length} constructors in database\n`);

  let updated = 0;
  let skipped = 0;

  for (const constructor of constructors) {
    const f1TeamId = TEAM_IMAGE_MAP[constructor.ergastId];

    if (!f1TeamId) {
      console.log(`⚠️ ${constructor.name}: No mapping for ergastId "${constructor.ergastId}"`);
      skipped++;
      continue;
    }

    const imageUrl = getCarImageUrl(f1TeamId);

    await prisma.constructor.update({
      where: { id: constructor.id },
      data: { logoUrl: imageUrl },
    });

    console.log(`✅ ${constructor.name}: ${imageUrl}`);
    updated++;
  }

  console.log(`\n✨ Done! Updated ${updated} constructors, skipped ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
