import { prisma } from "@/lib/db/prisma";

// ============================================
// Types
// ============================================

export interface CircuitListItem {
  id: string;
  name: string;
  country: string;
  city: string;
}

export interface CircuitDetail extends CircuitListItem {
  ergastId: string;
  upcomingRace: UpcomingRace | null;
  recentRaces: CircuitRaceInfo[];
}

export interface UpcomingRace {
  id: string;
  name: string;
  date: Date;
  round: number;
  season: number;
}

export interface CircuitRaceInfo {
  raceId: string;
  name: string;
  season: number;
  round: number;
  date: Date;
  winner: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
  } | null;
  polePosition: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
  } | null;
}

// ============================================
// Circuits Service
// ============================================

/**
 * Get all circuits
 */
export async function getCircuits(): Promise<CircuitListItem[]> {
  const circuits = await prisma.circuit.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      country: true,
      city: true,
    },
  });

  return circuits;
}

/**
 * Get circuits with races in a specific season
 */
export async function getSeasonCircuits(
  season?: number
): Promise<CircuitListItem[]> {
  const targetSeason = season || new Date().getFullYear();

  const circuits = await prisma.circuit.findMany({
    where: {
      races: {
        some: {
          season: targetSeason,
        },
      },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      country: true,
      city: true,
    },
  });

  return circuits;
}

/**
 * Get circuit by ID
 */
export async function getCircuitById(
  circuitId: string
): Promise<CircuitDetail | null> {
  const circuit = await prisma.circuit.findUnique({
    where: { id: circuitId },
  });

  if (!circuit) return null;

  const now = new Date();

  // Get upcoming race at this circuit
  const upcomingRace = await prisma.race.findFirst({
    where: {
      circuitId,
      date: { gte: now },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      name: true,
      date: true,
      round: true,
      season: true,
    },
  });

  // Get recent races at this circuit
  const recentRaces = await prisma.race.findMany({
    where: {
      circuitId,
      date: { lt: now },
      resultsJson: { not: null },
    },
    orderBy: { date: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      season: true,
      round: true,
      date: true,
      resultsJson: true,
    },
  });

  // Get driver info for winners and pole sitters
  const raceInfos: CircuitRaceInfo[] = [];

  for (const race of recentRaces) {
    const results = race.resultsJson as {
      positions?: string[];
      pole?: string;
    };

    let winner = null;
    let polePosition = null;

    if (results.positions && results.positions.length > 0) {
      const winnerDriver = await prisma.driver.findUnique({
        where: { ergastId: results.positions[0] },
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
        },
      });
      winner = winnerDriver;
    }

    if (results.pole) {
      const poleDriver = await prisma.driver.findUnique({
        where: { ergastId: results.pole },
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
        },
      });
      polePosition = poleDriver;
    }

    raceInfos.push({
      raceId: race.id,
      name: race.name,
      season: race.season,
      round: race.round,
      date: race.date,
      winner,
      polePosition,
    });
  }

  return {
    id: circuit.id,
    ergastId: circuit.ergastId,
    name: circuit.name,
    country: circuit.country,
    city: circuit.city,
    upcomingRace,
    recentRaces: raceInfos,
  };
}

/**
 * Search circuits by name or country
 */
export async function searchCircuits(query: string): Promise<CircuitListItem[]> {
  const circuits = await prisma.circuit.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { country: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      country: true,
      city: true,
    },
    take: 10,
  });

  return circuits;
}

export default {
  getCircuits,
  getSeasonCircuits,
  getCircuitById,
  searchCircuits,
};
