import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

// Type exports for hooks
export interface CircuitListItem {
  id: string;
  name: string;
  country: string;
  city: string;
  ergastId: string;
}

export interface CircuitDetail extends CircuitListItem {
  latitude: number | null;
  longitude: number | null;
  races: Array<{
    id: string;
    season: number;
    round: number;
    name: string;
    date: Date;
  }>;
  results: Array<{
    id: string;
    season: number;
    winner: { id: string; code: string; firstName: string; lastName: string } | null;
    pole: { id: string; code: string; firstName: string; lastName: string } | null;
    fastestLap: { id: string; code: string; firstName: string; lastName: string } | null;
  }>;
}

export async function getAllCircuits() {
  return prisma.circuit.findMany({
    orderBy: { name: 'asc' },
  });
}

// Alias for route compatibility
export const getCircuits = getAllCircuits;

// Get circuits for a specific season
export async function getSeasonCircuits(season?: number) {
  const targetSeason = season || new Date().getFullYear();
  
  const races = await prisma.race.findMany({
    where: { season: targetSeason },
    select: { circuitId: true },
  });
  
  const circuitIds = races.map(r => r.circuitId);
  
  return prisma.circuit.findMany({
    where: { id: { in: circuitIds } },
    orderBy: { name: 'asc' },
  });
}

// Search circuits by name or country
export async function searchCircuits(query: string) {
  const lowerQuery = query.toLowerCase();
  return prisma.circuit.findMany({
    where: {
      OR: [
        { name: { contains: lowerQuery } },
        { country: { contains: lowerQuery } },
        { city: { contains: lowerQuery } },
      ],
    },
    orderBy: { name: 'asc' },
  });
}

export async function getCircuitById(circuitId: string) {
  return (prisma.circuit.findUnique as Function)({
    where: { id: circuitId },
    include: {
      races: {
        orderBy: { season: 'desc' },
        take: 5,
        select: {
          id: true,
          season: true,
          round: true,
          name: true,
          date: true,
        },
      },
      results: {
        orderBy: { season: 'desc' },
        take: 5,
        include: {
          winner: {
            select: { id: true, code: true, firstName: true, lastName: true },
          },
          pole: {
            select: { id: true, code: true, firstName: true, lastName: true },
          },
          fastestLap: {
            select: { id: true, code: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });
}

export async function getCircuitByErgastId(ergastId: string) {
  return prisma.circuit.findUnique({
    where: { ergastId },
  });
}