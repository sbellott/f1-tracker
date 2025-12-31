import { prisma } from "@/lib/db/prisma";
import { ergastClient } from "@/lib/api/ergast/client";
import {
  transformDriver,
  transformConstructor,
  transformCircuit,
  transformRace,
  transformDriverStanding,
  transformConstructorStanding,
  transformRaceResults,
  getPolePositionDriver,
  getFastestLapDriver,
  getTopTenDrivers,
} from "@/lib/api/ergast/transformers";

export interface SyncResult {
  success: boolean;
  synced: {
    drivers: number;
    constructors: number;
    circuits: number;
    races: number;
    sessions: number;
    driverStandings: number;
    constructorStandings: number;
  };
  errors: string[];
}

/**
 * Sync all F1 data for a season
 */
export async function syncSeason(season: number): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: {
      drivers: 0,
      constructors: 0,
      circuits: 0,
      races: 0,
      sessions: 0,
      driverStandings: 0,
      constructorStandings: 0,
    },
    errors: [],
  };

  try {
    // 1. Sync constructors first (drivers depend on them)
    result.synced.constructors = await syncConstructors(season);

    // 2. Sync drivers
    result.synced.drivers = await syncDrivers(season);

    // 3. Sync circuits
    result.synced.circuits = await syncCircuits();

    // 4. Sync races and sessions
    const raceResult = await syncRaces(season);
    result.synced.races = raceResult.races;
    result.synced.sessions = raceResult.sessions;

    // 5. Sync standings
    result.synced.driverStandings = await syncDriverStandings(season);
    result.synced.constructorStandings = await syncConstructorStandings(season);
  } catch (error) {
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  return result;
}

/**
 * Sync constructors
 */
async function syncConstructors(season: number): Promise<number> {
  const { data } = await ergastClient.getConstructors(season);
  const constructors = data.ConstructorTable.Constructors;

  let count = 0;
  for (const constructor of constructors) {
    const transformed = transformConstructor(constructor);
    await prisma.constructor.upsert({
      where: { ergastId: transformed.ergastId },
      update: {
        name: transformed.name,
        nationality: transformed.nationality,
      },
      create: transformed,
    });
    count++;
  }

  return count;
}

/**
 * Sync drivers
 */
async function syncDrivers(season: number): Promise<number> {
  const { data } = await ergastClient.getDrivers(season);
  const drivers = data.DriverTable.Drivers;

  // Get constructor mapping from standings
  const { data: standingsData } = await ergastClient.getDriverStandings(season);
  const standings =
    standingsData.StandingsTable.StandingsLists[0]?.DriverStandings || [];

  const driverConstructorMap = new Map<string, string>();
  for (const standing of standings) {
    if (standing.Constructors[0]) {
      driverConstructorMap.set(
        standing.Driver.driverId,
        standing.Constructors[0].constructorId
      );
    }
  }

  let count = 0;
  for (const driver of drivers) {
    const transformed = transformDriver(driver);
    const constructorErgastId = driverConstructorMap.get(driver.driverId);

    // Find constructor ID
    let constructorId: string | null = null;
    if (constructorErgastId) {
      const constructor = await prisma.constructor.findUnique({
        where: { ergastId: constructorErgastId },
        select: { id: true },
      });
      constructorId = constructor?.id || null;
    }

    await prisma.driver.upsert({
      where: { ergastId: transformed.ergastId },
      update: {
        code: transformed.code,
        number: transformed.number,
        firstName: transformed.firstName,
        lastName: transformed.lastName,
        nationality: transformed.nationality,
        dateOfBirth: transformed.dateOfBirth,
        constructorId,
      },
      create: {
        ...transformed,
        constructorId,
      },
    });
    count++;
  }

  return count;
}

/**
 * Sync circuits
 */
async function syncCircuits(): Promise<number> {
  const { data } = await ergastClient.getCircuits();
  const circuits = data.CircuitTable.Circuits;

  let count = 0;
  for (const circuit of circuits) {
    const transformed = transformCircuit(circuit);
    await prisma.circuit.upsert({
      where: { ergastId: transformed.ergastId },
      update: {
        name: transformed.name,
        country: transformed.country,
        city: transformed.city,
      },
      create: transformed,
    });
    count++;
  }

  return count;
}

/**
 * Sync races and sessions
 */
async function syncRaces(
  season: number
): Promise<{ races: number; sessions: number }> {
  const { data } = await ergastClient.getSchedule(season);
  const races = data.RaceTable.Races;

  let raceCount = 0;
  let sessionCount = 0;

  for (const race of races) {
    const { race: transformedRace, sessions } = transformRace(race);

    // Find circuit
    const circuit = await prisma.circuit.findUnique({
      where: { ergastId: transformedRace.circuitErgastId },
      select: { id: true },
    });

    if (!circuit) {
      console.warn(`Circuit not found: ${transformedRace.circuitErgastId}`);
      continue;
    }

    // Upsert race
    const dbRace = await prisma.race.upsert({
      where: {
        season_round: {
          season: transformedRace.season,
          round: transformedRace.round,
        },
      },
      update: {
        name: transformedRace.name,
        date: transformedRace.date,
        hasSprint: transformedRace.hasSprint,
        circuitId: circuit.id,
      },
      create: {
        season: transformedRace.season,
        round: transformedRace.round,
        name: transformedRace.name,
        date: transformedRace.date,
        hasSprint: transformedRace.hasSprint,
        circuitId: circuit.id,
      },
    });
    raceCount++;

    // Upsert sessions
    for (const session of sessions) {
      await prisma.raceSession.upsert({
        where: {
          raceId_type: {
            raceId: dbRace.id,
            type: session.type,
          },
        },
        update: {
          dateTime: session.dateTime,
        },
        create: {
          raceId: dbRace.id,
          type: session.type,
          dateTime: session.dateTime,
        },
      });
      sessionCount++;
    }
  }

  return { races: raceCount, sessions: sessionCount };
}

/**
 * Sync driver standings
 */
async function syncDriverStandings(season: number): Promise<number> {
  const { data } = await ergastClient.getDriverStandings(season);
  const standingsList = data.StandingsTable.StandingsLists[0];

  if (!standingsList) return 0;

  const round = parseInt(standingsList.round, 10);
  let count = 0;

  for (const standing of standingsList.DriverStandings) {
    const transformed = transformDriverStanding(standing, season, round);

    // Find driver
    const driver = await prisma.driver.findUnique({
      where: { ergastId: transformed.driverErgastId },
      select: { id: true },
    });

    if (!driver) continue;

    await prisma.standing.upsert({
      where: {
        season_round_type_driverId: {
          season,
          round,
          type: "DRIVER",
          driverId: driver.id,
        },
      },
      update: {
        position: transformed.position,
        points: transformed.points,
        wins: transformed.wins,
      },
      create: {
        season,
        round,
        type: "DRIVER",
        position: transformed.position,
        points: transformed.points,
        wins: transformed.wins,
        driverId: driver.id,
      },
    });
    count++;
  }

  return count;
}

/**
 * Sync constructor standings
 */
async function syncConstructorStandings(season: number): Promise<number> {
  const { data } = await ergastClient.getConstructorStandings(season);
  const standingsList = data.StandingsTable.StandingsLists[0];

  if (!standingsList) return 0;

  const round = parseInt(standingsList.round, 10);
  let count = 0;

  for (const standing of standingsList.ConstructorStandings) {
    const transformed = transformConstructorStanding(standing, season, round);

    // Find constructor
    const constructor = await prisma.constructor.findUnique({
      where: { ergastId: transformed.constructorErgastId },
      select: { id: true },
    });

    if (!constructor) continue;

    await prisma.standing.upsert({
      where: {
        season_round_type_constructorId: {
          season,
          round,
          type: "CONSTRUCTOR",
          constructorId: constructor.id,
        },
      },
      update: {
        position: transformed.position,
        points: transformed.points,
        wins: transformed.wins,
      },
      create: {
        season,
        round,
        type: "CONSTRUCTOR",
        position: transformed.position,
        points: transformed.points,
        wins: transformed.wins,
        constructorId: constructor.id,
      },
    });
    count++;
  }

  return count;
}

/**
 * Sync race results and score predictions
 */
export async function syncRaceResults(
  season: number,
  round: number
): Promise<{
  resultsCount: number;
  predictionsScored: number;
}> {
  const { data } = await ergastClient.getRaceResults(season, round);
  const raceData = data.RaceTable.Races[0];

  if (!raceData) {
    throw new Error(`No results found for ${season} round ${round}`);
  }

  // Find race in database
  const race = await prisma.race.findUnique({
    where: { season_round: { season, round } },
    select: { id: true },
  });

  if (!race) {
    throw new Error(`Race not found: ${season} round ${round}`);
  }

  // Transform and store results
  const results = transformRaceResults(raceData.Results);
  const topTen = getTopTenDrivers(raceData.Results);
  const fastestLapDriver = getFastestLapDriver(raceData.Results);

  // Get qualifying results for pole position
  const { data: qualifyingData } = await ergastClient.getQualifyingResults(
    season,
    round
  );
  const poleDriver = getPolePositionDriver(
    qualifyingData.RaceTable.Races[0]?.QualifyingResults || []
  );

  // Store results as JSON
  await prisma.race.update({
    where: { id: race.id },
    data: {
      resultsJson: {
        positions: topTen,
        pole: poleDriver,
        fastestLap: fastestLapDriver,
        fullResults: results,
      },
    },
  });

  // Mark race session as completed
  await prisma.raceSession.updateMany({
    where: { raceId: race.id, type: "RACE" },
    data: { completed: true },
  });

  // TODO: Score predictions using scoring service
  // This will be implemented in predictions.service.ts

  return {
    resultsCount: results.length,
    predictionsScored: 0, // Will be updated when scoring is implemented
  };
}

export default {
  syncSeason,
  syncRaceResults,
};
