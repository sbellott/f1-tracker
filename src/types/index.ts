// Types principaux pour l'application F1 Tracker

export interface User {
  id: string;
  email: string;
  pseudo: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: Date;
  stats: {
    totalPoints: number;
    predictions: number;
    rank: number;
    badges: number;
    streak: number;
    bestRank: number;
  };
}

export interface Driver {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  number: number;
  nationality: string;
  dateOfBirth: Date;
  constructorId: string;
  photo?: string;
  stats: {
    gp: number;
    wins: number;
    podiums: number;
    poles: number;
    fastestLaps: number;
    points: number;
    titles: number;
  };
}

export interface Constructor {
  id: string;
  name: string;
  nationality: string;
  base: string;
  teamPrincipal: string;
  technicalDirector: string;
  engine: string;
  logo?: string;
  color: string;
  stats: {
    titles: number;
    wins: number;
    poles: number;
    podiums: number;
  };
}

export interface Circuit {
  id: string;
  ergastId?: string; // For Ergast API lookups
  name: string;
  country: string;
  city: string;
  length: number;
  turns: number;
  totalDistance: number;
  lapRecord?: {
    time: string;
    driver: string;
    year: number;
  };
  firstGP: number;
  trackImage?: string;
  direction?: 'clockwise' | 'anticlockwise';
  drsZones?: number;
  history?: string; // Faits marquants historiques
  winners?: { // Palmarès 10 dernières années
    year: number;
    winner: string;
    pole: string;
    fastestLap: string;
  }[];
}

export type SessionType = 'FP1' | 'FP2' | 'FP3' | 'SPRINT_QUALIFYING' | 'SPRINT' | 'QUALIFYING' | 'RACE';

// Résultat d'une position dans une session
export interface SessionResultPosition {
  position: number;
  driverId: string;
  driverCode: string;
  driverName: string;
  constructorId: string;
  constructorName: string;
  time?: string;        // Temps ou écart
  laps?: number;        // Nombre de tours (pour la course)
  points?: number;      // Points gagnés
  status?: string;      // DNF, DSQ, etc.
  fastestLap?: boolean; // Si meilleur tour en course
  gridPosition?: number; // Position de départ (pour la course)
}

// Résultats complets d'une session
export interface SessionResults {
  sessionType: SessionType;
  positions: SessionResultPosition[];
  polePosition?: string;     // ID du pilote en pole
  fastestLap?: {
    driverId: string;
    time: string;
    lap: number;
  };
  weather?: string;
  trackStatus?: string;
}

export interface Session {
  id: string;
  raceId: string;
  type: SessionType;
  dateTime: Date;
  channel?: string;
  isLive?: boolean;
  completed: boolean;
  results?: SessionResults; // Résultats de la session
}

export interface Race {
  id: string;
  season: number;
  round: number;
  name: string;
  circuitId: string;
  date: Date;
  hasSprint: boolean;
  country: string;
  sessions: Session[];
}

export interface Standing {
  position: number;
  previousPosition?: number;
  driverId?: string;
  constructorId?: string;
  points: number;
  wins: number;
  podiums?: number;
  poles?: number;
}

export interface Prediction {
  p1: string;
  p2: string;
  p3: string;
  p4: string;
  p5: string;
  p6: string;
  p7: string;
  p8: string;
  p9: string;
  p10: string;
  pole: string;
  fastestLap: string;
}

export interface UserPrediction {
  id: string;
  userId: string;
  groupId: string;
  raceId: string;
  sessionType: 'RACE' | 'SPRINT';
  predictions: Prediction;
  points?: number;
  createdAt: Date;
  lockedAt?: Date;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: Date;
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  joinedAt: Date;
  totalPoints: number;
  user?: User;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: Date;
  raceId?: string;
  badge?: Badge;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: {
    current: number;
    target: number;
  };
}

export interface RaceResult {
  raceId: string;
  sessionType: 'RACE' | 'SPRINT';
  results: {
    p1: string;
    p2: string;
    p3: string;
    p4: string;
    p5: string;
    p6: string;
    p7: string;
    p8: string;
    p9: string;
    p10: string;
    pole: string;
    fastestLap: string;
  };
  completedAt: Date;
}

export interface PointsBreakdown {
  userId: string;
  raceId: string;
  sessionType: 'RACE' | 'SPRINT';
  breakdown: {
    p1Points: number;
    p2Points: number;
    p3Points: number;
    p4Points: number;
    p5Points: number;
    p6Points: number;
    p7Points: number;
    p8Points: number;
    p9Points: number;
    p10Points: number;
    polePoints: number;
    fastestLapPoints: number;
    podiumBonusExact: number;
    podiumBonus: number;
  };
  totalPoints: number;
}

export interface GroupStats {
  groupId: string;
  memberCount: number;
  totalPredictions: number;
  avgPointsPerRace: number;
  topScorer?: {
    userId: string;
    points: number;
  };
}