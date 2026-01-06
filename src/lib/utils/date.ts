/**
 * Date and timezone utilities for F1 session handling
 */

export const TIMEZONE_PARIS = "Europe/Paris";

/**
 * Get current date in a specific timezone
 */
export function nowInTimezone(timezone: string = TIMEZONE_PARIS): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone })
  );
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {},
  locale: string = "fr-FR"
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };
  return date.toLocaleDateString(locale, defaultOptions);
}

/**
 * Format time for display
 */
export function formatTime(
  date: Date,
  timezone: string = TIMEZONE_PARIS,
  locale: string = "fr-FR"
): string {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: Date,
  timezone: string = TIMEZONE_PARIS,
  locale: string = "fr-FR"
): string {
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

/**
 * Get countdown to a future date
 */
export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isPast: boolean;
}

export function getCountdown(targetDate: Date): Countdown {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isPast: true,
    };
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
    total: diff,
    isPast: false,
  };
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date, timezone: string = TIMEZONE_PARIS): boolean {
  const now = new Date();
  const dateStr = date.toLocaleDateString("en-US", { timeZone: timezone });
  const nowStr = now.toLocaleDateString("en-US", { timeZone: timezone });
  return dateStr === nowStr;
}

/**
 * Check if a date is this weekend (Saturday or Sunday)
 */
export function isThisWeekend(
  date: Date,
  timezone: string = TIMEZONE_PARIS
): boolean {
  const now = new Date();
  const dateInTz = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));

  // Get start of this week (Monday)
  const startOfWeek = new Date(nowInTz);
  startOfWeek.setDate(nowInTz.getDate() - ((nowInTz.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);

  // Get end of this week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return dateInTz >= startOfWeek && dateInTz <= endOfWeek;
}

/**
 * Get race weekend date range (Friday to Sunday typically)
 */
export function getRaceWeekendRange(raceDate: Date): { start: Date; end: Date } {
  const end = new Date(raceDate);
  end.setHours(23, 59, 59, 999);

  // Race weekends typically start Friday (2 days before Sunday race)
  const start = new Date(raceDate);
  start.setDate(raceDate.getDate() - 2);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

/**
 * Session type display names in French
 */
export const SESSION_NAMES: Record<string, string> = {
  FP1: "Essais Libres 1",
  FP2: "Essais Libres 2",
  FP3: "Essais Libres 3",
  QUALIFYING: "Qualifications",
  SPRINT_QUALIFYING: "Sprint Shootout",
  SPRINT: "Sprint",
  RACE: "Course",
};

/**
 * Get session display name
 */
export function getSessionName(type: string): string {
  return SESSION_NAMES[type] || type;
}

/**
 * Sort sessions by type order (chronological for a race weekend)
 */
const SESSION_ORDER: Record<string, number> = {
  FP1: 1,
  FP2: 2,
  FP3: 3,
  SPRINT_QUALIFYING: 4,
  SPRINT: 5,
  QUALIFYING: 6,
  RACE: 7,
};

export function getSessionOrder(type: string): number {
  return SESSION_ORDER[type] || 99;
}

/**
 * Prediction lock buffer in minutes before qualifying starts
 */
export const PREDICTION_LOCK_MINUTES = 15;

/**
 * Calculate time until prediction lock (15 minutes before qualifying session)
 */
export function getPredictionLockTime(sessionDateTime: Date): Date {
  const lockTime = new Date(sessionDateTime);
  lockTime.setMinutes(lockTime.getMinutes() - PREDICTION_LOCK_MINUTES);
  return lockTime;
}

/**
 * Check if predictions are locked for a session
 */
export function arePredictionsLocked(sessionDateTime: Date): boolean {
  const lockTime = getPredictionLockTime(sessionDateTime);
  return new Date() >= lockTime;
}

/**
 * Find the session that determines prediction lock time
 * For sprint weekends: SPRINT_QUALIFYING
 * For normal weekends: QUALIFYING
 */
export function findLockSession(sessions: Array<{ type: string; dateTime: Date }>): { type: string; dateTime: Date } | null {
  // Priority: SPRINT_QUALIFYING > QUALIFYING
  const sprintQuali = sessions.find(s => s.type === 'SPRINT_QUALIFYING');
  if (sprintQuali) return sprintQuali;

  const quali = sessions.find(s => s.type === 'QUALIFYING');
  if (quali) return quali;

  // Fallback: use RACE session if no qualifying found
  const race = sessions.find(s => s.type === 'RACE');
  return race || null;
}

/**
 * Get prediction lock status and time for a race
 */
export function getPredictionLockStatus(sessions: Array<{ type: string; dateTime: Date }>): {
  isLocked: boolean;
  lockTime: Date | null;
  lockSession: string | null;
  timeUntilLock: number | null; // milliseconds
} {
  const lockSession = findLockSession(sessions);

  if (!lockSession) {
    return { isLocked: false, lockTime: null, lockSession: null, timeUntilLock: null };
  }

  const lockTime = getPredictionLockTime(new Date(lockSession.dateTime));
  const now = new Date();
  const isLocked = now >= lockTime;
  const timeUntilLock = isLocked ? null : lockTime.getTime() - now.getTime();

  return {
    isLocked,
    lockTime,
    lockSession: lockSession.type,
    timeUntilLock,
  };
}
