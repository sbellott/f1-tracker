import { prisma } from '@/lib/db/prisma';

// Type exports for hooks
export interface DriverListItem {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  nationality: string;
  number: number | null;
  photoUrl: string | null;
  ergastId: string;
  constructor: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

export interface DriverDetail extends Omit<DriverListItem, 'constructor'> {
  constructor: {
    id: string;
    name: string;
    nationality: string;
    color: string | null;
    ergastId: string;
  } | null;
  standings: Array<{
    id: string;
    season: number;
    round: number;
    points: number;
    position: number;
  }>;
}

export async function getAllDrivers() {
  return (prisma.driver.findMany as Function)({
    include: {
      constructor: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: [
      { constructor: { name: 'asc' } },
      { lastName: 'asc' },
    ],
  });
}

// Alias for route compatibility - get drivers for a season
export async function getDrivers(season?: number) {
  // For now, return all current drivers
  // In a full implementation, would filter by season standings
  return getAllDrivers();
}

// Search drivers by name or code
export async function searchDrivers(query: string) {
  const lowerQuery = query.toLowerCase();
  return (prisma.driver.findMany as Function)({
    where: {
      OR: [
        { firstName: { contains: lowerQuery } },
        { lastName: { contains: lowerQuery } },
        { code: { contains: lowerQuery } },
      ],
    },
    include: {
      constructor: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: { lastName: 'asc' },
  });
}

export async function getDriverById(driverId: string) {
  return (prisma.driver.findUnique as Function)({
    where: { id: driverId },
    include: {
      constructor: true,
      standings: {
        orderBy: [{ season: 'desc' }, { round: 'desc' }],
        take: 10,
      },
    },
  });
}

export async function getDriverByCode(code: string) {
  return (prisma.driver.findFirst as Function)({
    where: { code: code.toUpperCase() },
    include: {
      constructor: true,
    },
  });
}

export async function getDriversByConstructor(constructorId: string) {
  return (prisma.driver.findMany as Function)({
    where: { constructorId },
    include: {
      constructor: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: { lastName: 'asc' },
  });
}