/**
 * Sync constructor statistics from race results
 * Calculates wins, podiums, poles from DriverRaceResult data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Historical championship data (1950-2024)
const HISTORICAL_CHAMPIONSHIPS: Record<string, number> = {
  'ferrari': 16,
  'mclaren': 8,
  'williams': 9,
  'mercedes': 8,
  'red_bull': 6,
  'lotus': 7,
  'brabham': 2,
  'cooper': 2,
  'tyrrell': 1,
  'benetton': 1,
  'brawn': 1,
  'renault': 2,
  'alfa': 0, // Alfa Romeo/Sauber
  'alphatauri': 0,
  'alpine': 0,
  'rb': 0, // RB (formerly AlphaTauri)
  'aston_martin': 0,
  'haas': 0,
  'kick_sauber': 0,
  'sauber': 0,
  'audi': 0,
};

// Historical wins data (approximate totals up to end of 2024)
const HISTORICAL_WINS: Record<string, number> = {
  'ferrari': 245,
  'mclaren': 184,
  'mercedes': 128,
  'red_bull': 120,
  'williams': 114,
  'lotus': 79,
  'brabham': 35,
  'renault': 35,
  'benetton': 27,
  'tyrrell': 23,
  'brawn': 8,
  'cooper': 16,
  'alpha_tauri': 0,
  'alphatauri': 0,
  'alpine': 0,
  'rb': 0,
  'aston_martin': 0,
  'haas': 0,
  'kick_sauber': 0,
  'sauber': 1,
  'alfa': 0,
  'audi': 0,
};

// Historical podiums data (approximate totals)
const HISTORICAL_PODIUMS: Record<string, number> = {
  'ferrari': 810,
  'mclaren': 510,
  'mercedes': 300,
  'red_bull': 280,
  'williams': 313,
  'lotus': 170,
  'brabham': 124,
  'renault': 105,
  'benetton': 96,
  'tyrrell': 77,
  'brawn': 15,
  'cooper': 42,
  'alphatauri': 2,
  'alpine': 2,
  'rb': 0,
  'aston_martin': 10,
  'haas': 0,
  'kick_sauber': 0,
  'sauber': 27,
  'alfa': 10,
  'audi': 0,
};

// Historical poles data (approximate totals)
const HISTORICAL_POLES: Record<string, number> = {
  'ferrari': 252,
  'mclaren': 160,
  'mercedes': 140,
  'red_bull': 105,
  'williams': 128,
  'lotus': 107,
  'brabham': 39,
  'renault': 51,
  'benetton': 16,
  'tyrrell': 14,
  'brawn': 5,
  'cooper': 11,
  'alphatauri': 1,
  'alpine': 0,
  'rb': 0,
  'aston_martin': 1,
  'haas': 0,
  'kick_sauber': 0,
  'sauber': 1,
  'alfa': 1,
  'audi': 0,
};

// Team metadata
const TEAM_METADATA: Record<string, { base?: string; engine?: string; teamPrincipal?: string; technicalDirector?: string }> = {
  'red_bull': {
    base: 'Milton Keynes, UK',
    engine: 'Honda RBPT',
    teamPrincipal: 'Christian Horner',
    technicalDirector: 'Pierre Waché',
  },
  'ferrari': {
    base: 'Maranello, Italy',
    engine: 'Ferrari',
    teamPrincipal: 'Frédéric Vasseur',
    technicalDirector: 'Loïc Serra',
  },
  'mclaren': {
    base: 'Woking, UK',
    engine: 'Mercedes',
    teamPrincipal: 'Andrea Stella',
    technicalDirector: 'Peter Prodromou',
  },
  'mercedes': {
    base: 'Brackley, UK',
    engine: 'Mercedes',
    teamPrincipal: 'Toto Wolff',
    technicalDirector: 'James Allison',
  },
  'aston_martin': {
    base: 'Silverstone, UK',
    engine: 'Mercedes',
    teamPrincipal: 'Andy Cowell',
    technicalDirector: 'Adrian Newey',
  },
  'alpine': {
    base: 'Enstone, UK',
    engine: 'Renault',
    teamPrincipal: 'Oliver Oakes',
    technicalDirector: 'David Sanchez',
  },
  'williams': {
    base: 'Grove, UK',
    engine: 'Mercedes',
    teamPrincipal: 'James Vowles',
    technicalDirector: 'Pat Fry',
  },
  'rb': {
    base: 'Faenza, Italy',
    engine: 'Honda RBPT',
    teamPrincipal: 'Laurent Mekies',
    technicalDirector: 'Jody Egginton',
  },
  'kick_sauber': {
    base: 'Hinwil, Switzerland',
    engine: 'Ferrari',
    teamPrincipal: 'Mattia Binotto',
    technicalDirector: 'James Key',
  },
  'haas': {
    base: 'Kannapolis, USA',
    engine: 'Ferrari',
    teamPrincipal: 'Ayao Komatsu',
    technicalDirector: 'Simone Resta',
  },
  'sauber': {
    base: 'Hinwil, Switzerland',
    engine: 'Ferrari',
    teamPrincipal: 'Mattia Binotto',
    technicalDirector: 'James Key',
  },
  'alphatauri': {
    base: 'Faenza, Italy',
    engine: 'Honda RBPT',
    teamPrincipal: 'Laurent Mekies',
    technicalDirector: 'Jody Egginton',
  },
  'alfa': {
    base: 'Hinwil, Switzerland',
    engine: 'Ferrari',
    teamPrincipal: '',
    technicalDirector: '',
  },
  'audi': {
    base: 'Hinwil, Switzerland',
    engine: 'Audi',
    teamPrincipal: 'Mattia Binotto',
    technicalDirector: 'James Key',
  },
};

// Team color mapping
const TEAM_COLORS: Record<string, string> = {
  'red_bull': '#3671C6',
  'ferrari': '#E80020',
  'mclaren': '#FF8000',
  'mercedes': '#27F4D2',
  'aston_martin': '#229971',
  'alpine': '#FF87BC',
  'williams': '#64C4FF',
  'rb': '#6692FF',
  'kick_sauber': '#52E252',
  'haas': '#B6BABD',
  'sauber': '#52E252',
  'alphatauri': '#5E8FAA',
  'alfa': '#C92D4B',
  'audi': '#52E252',
};

async function main() {
  console.log('🏎️ Syncing constructor statistics...\n');

  // Get all constructors
  const constructors = await prisma.constructor.findMany({
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${constructors.length} constructors\n`);

  for (const constructor of constructors) {
    const ergastId = constructor.ergastId.toLowerCase();
    
    // Get race results for this constructor from DriverRaceResult
    const results = await prisma.driverRaceResult.findMany({
      where: { constructorId: ergastId },
    });

    // Calculate stats from recent race results (2023-2025)
    let recentWins = 0;
    let recentPodiums = 0;
    let recentPoles = 0;

    for (const result of results) {
      if (result.position === 1) recentWins++;
      if (result.position >= 1 && result.position <= 3) recentPodiums++;
      if (result.grid === 1) recentPoles++;
    }

    // Get historical stats (or use recent if not in historical data)
    const historicalWins = HISTORICAL_WINS[ergastId] ?? 0;
    const historicalPodiums = HISTORICAL_PODIUMS[ergastId] ?? 0;
    const historicalPoles = HISTORICAL_POLES[ergastId] ?? 0;
    const championships = HISTORICAL_CHAMPIONSHIPS[ergastId] ?? 0;

    // Use max of historical or recent (in case recent data exceeds historical approximation)
    const totalWins = Math.max(historicalWins, recentWins);
    const totalPodiums = Math.max(historicalPodiums, recentPodiums);
    const totalPoles = Math.max(historicalPoles, recentPoles);

    // Get metadata
    const metadata = TEAM_METADATA[ergastId] ?? {};
    const color = TEAM_COLORS[ergastId] ?? constructor.color ?? '#888888';

    // Update constructor
    await prisma.constructor.update({
      where: { id: constructor.id },
      data: {
        totalWins,
        totalPodiums,
        totalPoles,
        championships,
        base: metadata.base || constructor.base,
        engine: metadata.engine || constructor.engine,
        teamPrincipal: metadata.teamPrincipal || constructor.teamPrincipal,
        technicalDirector: metadata.technicalDirector || constructor.technicalDirector,
        color,
      },
    });

    console.log(`${constructor.name}:`);
    console.log(`  Stats: ${totalWins} wins, ${totalPodiums} podiums, ${totalPoles} poles, ${championships} titles`);
    console.log(`  Base: ${metadata.base || 'N/A'}, Engine: ${metadata.engine || 'N/A'}`);
  }

  console.log('\n✨ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
