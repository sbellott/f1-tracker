import { prisma } from '@/lib/db/prisma';

// Type exports for hooks
export interface ConstructorListItem {
  id: string;
  name: string;
  nationality: string;
  color: string | null;
  ergastId: string;
  drivers: Array<{
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  }>;
}

export interface ConstructorDetail extends Omit<ConstructorListItem, 'drivers'> {
  drivers: Array<{
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    nationality: string;
    photoUrl: string | null;
  }>;
  standings: Array<{
    id: string;
    season: number;
    round: number;
    points: number;
    position: number;
  }>;
}

export async function getAllConstructors() {
  return (prisma.constructor.findMany as Function)({
    include: {
      drivers: {
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

// Alias for route compatibility - get constructors for a season
export async function getConstructors(season?: number) {
  // For now, return all current constructors
  // In a full implementation, would filter by season standings
  return getAllConstructors();
}

export async function getConstructorById(constructorId: string) {
  return prisma.constructor.findUnique({
    where: { id: constructorId },
    include: {
      drivers: true,
      standings: {
        orderBy: [{ season: 'desc' }, { round: 'desc' }],
        take: 10,
      },
    },
  });
}

export async function getConstructorByErgastId(ergastId: string) {
  return prisma.constructor.findUnique({
    where: { ergastId },
    include: {
      drivers: true,
    },
  });
}