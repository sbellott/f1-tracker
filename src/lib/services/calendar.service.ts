import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

export interface CalendarRace {
  id: string;
  season: number;
  round: number;
  name: string;
  officialName: string | null;
  date: Date;
  hasSprint: boolean;
  resultsJson: Prisma.JsonValue | null;
  circuit: {
    id: string;
    name: string;
    country: string;
    city: string;
  };
  sessions: {
    id: string;
    type: string;
    dateTime: Date;
    completed: boolean;
    canalPlusChannel: string | null;
    isLive: boolean;
    resultsJson: Prisma.JsonValue | null;
  }[];
}

// Type aliases for backwards compatibility
export type RaceWithSessions = CalendarRace;

export interface NextSession {
  session: {
    id: string;
    type: string;
    dateTime: Date;
    completed: boolean;
    canalPlusChannel: string | null;
  };
  race: CalendarRace;
  circuit: {
    id: string;
    name: string;
    country: string;
    city: string;
  };
  countdown: number;
}

interface GetSeasonCalendarOptions {
  season?: number;
  upcoming?: boolean;
  hasSprint?: boolean;
}

export async function getCalendar(season: number = new Date().getFullYear()): Promise<CalendarRace[]> {
  const races = await prisma.race.findMany({
    where: { season },
    select: {
      id: true,
      season: true,
      round: true,
      name: true,
      officialName: true,
      date: true,
      hasSprint: true,
      resultsJson: true,
      circuit: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true,
        },
      },
      sessions: {
        select: {
          id: true,
          type: true,
          dateTime: true,
          completed: true,
          canalPlusChannel: true,
          isLive: true,
          resultsJson: true,
        },
        orderBy: { dateTime: 'asc' },
      },
    },
    orderBy: { round: 'asc' },
  });

  return races;
}

// Alias for route compatibility
export async function getSeasonCalendar(options: GetSeasonCalendarOptions = {}): Promise<CalendarRace[]> {
  const { season = new Date().getFullYear(), upcoming = false, hasSprint } = options;

  const now = new Date();

  const races = await prisma.race.findMany({
    where: {
      season,
      ...(upcoming && { date: { gte: now } }),
      ...(hasSprint !== undefined && { hasSprint }),
    },
    select: {
      id: true,
      season: true,
      round: true,
      name: true,
      officialName: true,
      date: true,
      hasSprint: true,
      resultsJson: true,
      circuit: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true,
        },
      },
      sessions: {
        select: {
          id: true,
          type: true,
          dateTime: true,
          completed: true,
          canalPlusChannel: true,
          isLive: true,
          resultsJson: true,
        },
        orderBy: { dateTime: 'asc' },
      },
    },
    orderBy: { round: 'asc' },
  });

  return races;
}

// Get upcoming races
export async function getUpcomingRaces(limit = 5): Promise<CalendarRace[]> {
  const now = new Date();

  const races = await prisma.race.findMany({
    where: {
      date: { gte: now },
    },
    select: {
      id: true,
      season: true,
      round: true,
      name: true,
      officialName: true,
      date: true,
      hasSprint: true,
      resultsJson: true,
      circuit: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true,
        },
      },
      sessions: {
        select: {
          id: true,
          type: true,
          dateTime: true,
          completed: true,
          canalPlusChannel: true,
          isLive: true,
          resultsJson: true,
        },
        orderBy: { dateTime: 'asc' },
      },
    },
    orderBy: { date: 'asc' },
    take: limit,
  });

  return races;
}

export async function getNextSession() {
  const now = new Date();

  const nextSession = await prisma.raceSession.findFirst({
    where: {
      dateTime: { gte: now },
      completed: false,
    },
    include: {
      race: {
        include: {
          circuit: {
            select: {
              id: true,
              name: true,
              country: true,
              city: true,
            },
          },
        },
      },
    },
    orderBy: { dateTime: 'asc' },
  });

  if (!nextSession) {
    return null;
  }

  return {
    session: nextSession,
    race: nextSession.race,
    circuit: nextSession.race.circuit,
    countdown: nextSession.dateTime.getTime() - now.getTime(),
  };
}

export async function getRaceById(raceId: string) {
  return prisma.race.findUnique({
    where: { id: raceId },
    include: {
      circuit: true,
      sessions: {
        orderBy: { dateTime: 'asc' },
      },
    },
  });
}

export async function getRaceByRound(season: number, round: number) {
  return prisma.race.findUnique({
    where: {
      season_round: { season, round },
    },
    include: {
      circuit: true,
      sessions: {
        orderBy: { dateTime: 'asc' },
      },
    },
  });
}