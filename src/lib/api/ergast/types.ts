// ============================================
// Ergast API Response Types
// ============================================

export interface ErgastResponse<T> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
  } & T;
}

// ============================================
// Driver Types
// ============================================

export interface ErgastDriver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

export interface ErgastDriverTable {
  DriverTable: {
    season?: string;
    Drivers: ErgastDriver[];
  };
}

// ============================================
// Constructor Types
// ============================================

export interface ErgastConstructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

export interface ErgastConstructorTable {
  ConstructorTable: {
    season?: string;
    Constructors: ErgastConstructor[];
  };
}

// ============================================
// Circuit Types
// ============================================

export interface ErgastLocation {
  lat: string;
  long: string;
  locality: string;
  country: string;
}

export interface ErgastCircuit {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: ErgastLocation;
}

export interface ErgastCircuitTable {
  CircuitTable: {
    Circuits: ErgastCircuit[];
  };
}

// ============================================
// Race Types
// ============================================

export interface ErgastRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: ErgastCircuit;
  date: string;
  time?: string;
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
  SprintQualifying?: { date: string; time: string };
}

export interface ErgastRaceTable {
  RaceTable: {
    season: string;
    Races: ErgastRace[];
  };
}

// ============================================
// Standing Types
// ============================================

export interface ErgastDriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: ErgastDriver;
  Constructors: ErgastConstructor[];
}

export interface ErgastStandingsList {
  season: string;
  round: string;
  DriverStandings: ErgastDriverStanding[];
}

export interface ErgastDriverStandingsTable {
  StandingsTable: {
    season: string;
    StandingsLists: ErgastStandingsList[];
  };
}

export interface ErgastConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: ErgastConstructor;
}

export interface ErgastConstructorStandingsList {
  season: string;
  round: string;
  ConstructorStandings: ErgastConstructorStanding[];
}

export interface ErgastConstructorStandingsTable {
  StandingsTable: {
    season: string;
    StandingsLists: ErgastConstructorStandingsList[];
  };
}

// ============================================
// Race Result Types
// ============================================

export interface ErgastRaceResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  grid: string;
  laps: string;
  status: string;
  Time?: { millis: string; time: string };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: { time: string };
    AverageSpeed: { units: string; speed: string };
  };
}

export interface ErgastRaceResultData extends ErgastRace {
  Results: ErgastRaceResult[];
}

export interface ErgastRaceResultTable {
  RaceTable: {
    season: string;
    round: string;
    Races: ErgastRaceResultData[];
  };
}

// ============================================
// Qualifying Result Types
// ============================================

export interface ErgastQualifyingResult {
  number: string;
  position: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface ErgastQualifyingData extends ErgastRace {
  QualifyingResults: ErgastQualifyingResult[];
}

export interface ErgastQualifyingTable {
  RaceTable: {
    season: string;
    round: string;
    Races: ErgastQualifyingData[];
  };
}

// ============================================
// Sprint Result Types
// ============================================

export interface ErgastSprintResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  grid: string;
  laps: string;
  status: string;
  Time?: { millis: string; time: string };
  FastestLap?: {
    lap: string;
    Time: { time: string };
  };
}

export interface ErgastSprintData extends ErgastRace {
  SprintResults: ErgastSprintResult[];
}

export interface ErgastSprintTable {
  RaceTable: {
    season: string;
    round: string;
    Races: ErgastSprintData[];
  };
}
