import { prisma } from "@/lib/db/prisma";
import {
  getCountdown,
  isPast,
  getSessionName,
  getSessionOrder,
  arePredictionsLocked,
  getPredictionLockTime,
  type Countdown,
} from "@/lib/utils/date";
import type { SessionType } from "@prisma/client";

// ============================================
// Types
// ============================================

export interface RaceWithSessions {
  id: string;
  season: number;
  round: number;
  name: string;
  date: Date;
  hasSprint: boolean;
  circuit: {
    id: string;
    name: string;
    country: string;
    city: string;
  };
  sessions: SessionInfo[];
  status: "upcoming" | "ongoing" | "completed";
}

export interface SessionInfo {
  id: string;
  type: SessionType;
  typeName: string;
  dateTime: Date;
  completed: boolean;
  isPast: boolean;
  predictionsLocked: boolean;
  lockTime: Date;
}

export interface NextSession {
  race: {
    id: string;
    name: string;
    round: number;
    circuit: {
      name: string;
      country: string;
    };
  };
  session: SessionInfo;
  countdown: Countdown;
}

export interface CalendarFilters {
  season?: number;
  upcoming?: boolean;
  hasSprint?: boolean;
}

// ============================================
// Calendar Service
// ============================================

/**
 * Get full season calendar
 */
export async function getSeasonCalendar(
  filters: CalendarFilters = {}
): Promise<RaceWithSessions[]> {
  const { season = new Date().getFullYear(), upcoming, hasSprint } = filters;

  const where: Record<string, unknown> = { season };

  if (upcoming) {
    where.date = { gte: new Date() };
  }

  if (hasSprint !== undefined) {
    where.hasSprint = hasSprint;
  }

  const races = await prisma.race.findMany({
    where,
    include: {
      circuit: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true,
        },
      },
      sessions: {
        orderBy: { dateTime: "asc" },
      },
    },
    orderBy: { round: "asc" },
  });

  return races.map((race) => {
    const sessions = race.sessions
      .map((session) => ({
        id: session.id,
        type: session.type,
        typeName: getSessionName(session.type),
        dateTime: session.dateTime,
        completed: session.completed,
        isPast: isPast(session.dateTime),
        predictionsLocked: arePredictionsLocked(session.dateTime),
        lockTime: getPredictionLockTime(session.dateTime),
      }))
      .sort((a, b) => getSessionOrder(a.type) - getSessionOrder(b.type));

    const status = getRaceStatus(race.date, sessions);

    return {
      id: race.id,
      season: race.season,
      round: race.round,
      name: race.name,
      date: race.date,
      hasSprint: race.hasSprint,
      circuit: race.circuit,
      sessions,
      status,
    };
  });
}

/**
 * Get a specific race by season and round
 */
export async function getRaceByRound(
  season: number,
  round: number
): Promise<RaceWithSessions | null> {
  const race = await prisma.race.findUnique({
    where: { season_round: { season, round } },
    include: {
      circuit: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true,
        },
      },
      sessions: {
        orderBy: { dateTime: "asc" },
      },
    },
  });

  if (!race) return null;

  const sessions = race.sessions
    .map((session) => ({
      id: session.id,
      type: session.type,
      typeName: getSessionName(session.type),
      dateTime: session.dateTime,
      completed: session.completed,
      isPast: isPast(session.dateTime),
      predictionsLocked: arePredictionsLocked(session.dateTime),
      lockTime: getPredictionLockTime(session.dateTime),
    }))
    .sort((a, b) => getSessionOrder(a.type) - getSessionOrder(b.type));

  return {
    id: race.id,
    season: race.season,
    round: race.round,
    name: race.name,
    date: race.date,
    hasSprint: race.hasSprint,
    circuit: race.circuit,
    sessions,
    status: getRaceStatus(race.date, sessions),
  };
}

/**
 * Get the next upcoming session
 */
export async function getNextSession(): Promise<NextSession | null> {
  const now = new Date();

  // Find next session that hasn't started yet
  const nextSession = await prisma.raceSession.findFirst({
    where: {
      dateTime: { gt: now },
    },
    orderBy: { dateTime: "asc" },
    include: {
      race: {
        include: {
          circuit: {
            select: {
              name: true,
              country: true,
            },
          },
        },
      },
    },
  });

  if (!nextSession) return null;

  return {
    race: {
      id: nextSession.race.id,
      name: nextSession.race.name,
      round: nextSession.race.round,
      circuit: nextSession.race.circuit,
    },
    session: {
      id: nextSession.id,
      type: nextSession.type,
      typeName: getSessionName(nextSession.type),
      dateTime: nextSession.dateTime,
      completed: nextSession.completed,
      isPast: false,
      predictionsLocked: arePredictionsLocked(nextSession.dateTime),
      lockTime: getPredictionLockTime(nextSession.dateTime),
    },
    countdown: getCountdown(nextSession.dateTime),
  };
}

/**
 * Get upcoming races (next N races)
 */
export async function getUpcomingRaces(
  limit: number = 3
): Promise<RaceWithSessions[]> {
  const now = new Date();

  const races = await prisma.race.findMany({
    where: {
      date: { gte: now },
    },
    take: limit,
    orderBy: { date: "asc" },
    include: {
      circuit: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true,
        },
      },
      sessions: {
        orderBy: { dateTime: "asc" },
      },
    },
  });

  return races.map((race) => {
    const sessions = race.sessions
      .map((session) => ({
        id: session.id,
        type: session.type,
        typeName: getSessionName(session.type),
        dateTime: session.dateTime,
        completed: session.completed,
        isPast: isPast(session.dateTime),
        predictionsLocked: arePredictionsLocked(session.dateTime),
        lockTime: getPredictionLockTime(session.dateTime),
      }))
      .sort((a, b) => getSessionOrder(a.type) - getSessionOrder(b.type));

    return {
      id: race.id,
      season: race.season,
      round: race.round,
      name: race.name,
      date: race.date,
      hasSprint: race.hasSprint,
      circuit: race.circuit,
      sessions,
      status: getRaceStatus(race.date, sessions),
    };
  });
}

/**
 * Get race results (completed races with results)
 */
export async function getCompletedRaces(
  season: number
): Promise<RaceWithSessions[]> {
  const races = await prisma.race.findMany({
    where: {
      season,
      resultsJson: { not: null },
    },
    orderBy: { round: "desc" },
    include: {
      circuit: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true,
        },
      },
      sessions: {
        orderBy: { dateTime: "asc" },
      },
    },
  });

  return races.map((race) => {
    const sessions = race.sessions.map((session) => ({
      id: session.id,
      type: session.type,
      typeName: getSessionName(session.type),
      dateTime: session.dateTime,
      completed: session.completed,
      isPast: true,
      predictionsLocked: true,
      lockTime: getPredictionLockTime(session.dateTime),
    }));

    return {
      id: race.id,
      season: race.season,
      round: race.round,
      name: race.name,
      date: race.date,
      hasSprint: race.hasSprint,
      circuit: race.circuit,
      sessions,
      status: "completed" as const,
    };
  });
}

// ============================================
// Helper Functions
// ============================================

function getRaceStatus(
  raceDate: Date,
  sessions: SessionInfo[]
): "upcoming" | "ongoing" | "completed" {
  const now = new Date();

  // Check if all sessions are completed
  const allCompleted = sessions.every((s) => s.completed);
  if (allCompleted) return "completed";

  // Check if first session has started
  const firstSession = sessions[0];
  if (firstSession && now >= firstSession.dateTime) {
    return "ongoing";
  }

  return "upcoming";
}

export default {
  getSeasonCalendar,
  getRaceByRound,
  getNextSession,
  getUpcomingRaces,
  getCompletedRaces,
};
