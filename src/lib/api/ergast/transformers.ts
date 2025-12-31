import type { SessionType } from "@prisma/client";
import type {
  ErgastDriver,
  ErgastConstructor,
  ErgastCircuit,
  ErgastRace,
  ErgastDriverStanding,
  ErgastConstructorStanding,
  ErgastRaceResult,
} from "./types";

// ============================================
// Driver Transformers
// ============================================

export interface TransformedDriver {
  ergastId: string;
  code: string;
  number: number | null;
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: Date | null;
}

export function transformDriver(driver: ErgastDriver): TransformedDriver {
  return {
    ergastId: driver.driverId,
    code: driver.code || driver.driverId.slice(0, 3).toUpperCase(),
    number: driver.permanentNumber ? parseInt(driver.permanentNumber, 10) : null,
    firstName: driver.givenName,
    lastName: driver.familyName,
    nationality: driver.nationality,
    dateOfBirth: driver.dateOfBirth ? new Date(driver.dateOfBirth) : null,
  };
}

// ============================================
// Constructor Transformers
// ============================================

export interface TransformedConstructor {
  ergastId: string;
  name: string;
  nationality: string;
}

export function transformConstructor(
  constructor: ErgastConstructor
): TransformedConstructor {
  return {
    ergastId: constructor.constructorId,
    name: constructor.name,
    nationality: constructor.nationality,
  };
}

// ============================================
// Circuit Transformers
// ============================================

export interface TransformedCircuit {
  ergastId: string;
  name: string;
  country: string;
  city: string;
}

export function transformCircuit(circuit: ErgastCircuit): TransformedCircuit {
  return {
    ergastId: circuit.circuitId,
    name: circuit.circuitName,
    country: circuit.Location.country,
    city: circuit.Location.locality,
  };
}

// ============================================
// Race Transformers
// ============================================

export interface TransformedRace {
  season: number;
  round: number;
  name: string;
  circuitErgastId: string;
  date: Date;
  hasSprint: boolean;
}

export interface TransformedSession {
  type: SessionType;
  dateTime: Date;
}

export function transformRace(race: ErgastRace): {
  race: TransformedRace;
  sessions: TransformedSession[];
} {
  const sessions: TransformedSession[] = [];
  const hasSprint = !!race.Sprint || !!race.SprintQualifying;

  // Add practice sessions
  if (race.FirstPractice) {
    sessions.push({
      type: "FP1",
      dateTime: parseDateTime(race.FirstPractice.date, race.FirstPractice.time),
    });
  }
  if (race.SecondPractice) {
    sessions.push({
      type: "FP2",
      dateTime: parseDateTime(race.SecondPractice.date, race.SecondPractice.time),
    });
  }
  if (race.ThirdPractice) {
    sessions.push({
      type: "FP3",
      dateTime: parseDateTime(race.ThirdPractice.date, race.ThirdPractice.time),
    });
  }

  // Add sprint sessions
  if (race.SprintQualifying) {
    sessions.push({
      type: "SPRINT_QUALIFYING",
      dateTime: parseDateTime(
        race.SprintQualifying.date,
        race.SprintQualifying.time
      ),
    });
  }
  if (race.Sprint) {
    sessions.push({
      type: "SPRINT",
      dateTime: parseDateTime(race.Sprint.date, race.Sprint.time),
    });
  }

  // Add qualifying and race
  if (race.Qualifying) {
    sessions.push({
      type: "QUALIFYING",
      dateTime: parseDateTime(race.Qualifying.date, race.Qualifying.time),
    });
  }

  // Main race
  sessions.push({
    type: "RACE",
    dateTime: parseDateTime(race.date, race.time),
  });

  return {
    race: {
      season: parseInt(race.season, 10),
      round: parseInt(race.round, 10),
      name: race.raceName,
      circuitErgastId: race.Circuit.circuitId,
      date: parseDateTime(race.date, race.time),
      hasSprint,
    },
    sessions,
  };
}

// ============================================
// Standings Transformers
// ============================================

export interface TransformedDriverStanding {
  season: number;
  round: number;
  position: number;
  points: number;
  wins: number;
  driverErgastId: string;
  constructorErgastId: string | null;
}

export function transformDriverStanding(
  standing: ErgastDriverStanding,
  season: number,
  round: number
): TransformedDriverStanding {
  return {
    season,
    round,
    position: parseInt(standing.position, 10),
    points: parseFloat(standing.points),
    wins: parseInt(standing.wins, 10),
    driverErgastId: standing.Driver.driverId,
    constructorErgastId: standing.Constructors[0]?.constructorId || null,
  };
}

export interface TransformedConstructorStanding {
  season: number;
  round: number;
  position: number;
  points: number;
  wins: number;
  constructorErgastId: string;
}

export function transformConstructorStanding(
  standing: ErgastConstructorStanding,
  season: number,
  round: number
): TransformedConstructorStanding {
  return {
    season,
    round,
    position: parseInt(standing.position, 10),
    points: parseFloat(standing.points),
    wins: parseInt(standing.wins, 10),
    constructorErgastId: standing.Constructor.constructorId,
  };
}

// ============================================
// Race Result Transformers
// ============================================

export interface TransformedRaceResult {
  position: number;
  driverErgastId: string;
  constructorErgastId: string;
  points: number;
  grid: number;
  laps: number;
  status: string;
  time: string | null;
  fastestLap: boolean;
  fastestLapTime: string | null;
}

export function transformRaceResults(
  results: ErgastRaceResult[]
): TransformedRaceResult[] {
  return results.map((result) => ({
    position: parseInt(result.position, 10),
    driverErgastId: result.Driver.driverId,
    constructorErgastId: result.Constructor.constructorId,
    points: parseFloat(result.points),
    grid: parseInt(result.grid, 10),
    laps: parseInt(result.laps, 10),
    status: result.status,
    time: result.Time?.time || null,
    fastestLap: result.FastestLap?.rank === "1",
    fastestLapTime: result.FastestLap?.Time?.time || null,
  }));
}

// ============================================
// Helper Functions
// ============================================

function parseDateTime(date: string, time?: string): Date {
  if (time) {
    return new Date(`${date}T${time}`);
  }
  // Default to 14:00 UTC if no time provided
  return new Date(`${date}T14:00:00Z`);
}

/**
 * Get the pole position driver from qualifying results
 */
export function getPolePositionDriver(
  qualifyingResults: { position: string; Driver: ErgastDriver }[]
): string | null {
  const pole = qualifyingResults.find((r) => r.position === "1");
  return pole?.Driver.driverId || null;
}

/**
 * Get the fastest lap driver from race results
 */
export function getFastestLapDriver(results: ErgastRaceResult[]): string | null {
  const fastestLap = results.find((r) => r.FastestLap?.rank === "1");
  return fastestLap?.Driver.driverId || null;
}

/**
 * Get top 10 drivers from race results
 */
export function getTopTenDrivers(results: ErgastRaceResult[]): string[] {
  return results
    .filter((r) => parseInt(r.position, 10) <= 10)
    .sort((a, b) => parseInt(a.position, 10) - parseInt(b.position, 10))
    .map((r) => r.Driver.driverId);
}
