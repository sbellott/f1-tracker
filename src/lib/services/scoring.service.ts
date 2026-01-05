/**
 * Scoring Service
 * Calculates points for F1 predictions based on actual race results
 */

// ============================================
// Scoring Constants
// ============================================

/**
 * Points awarded for exact position predictions
 */
export const EXACT_POSITION_POINTS: Record<number, number> = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
};

/**
 * Points awarded when driver predicted in top 3 finishes in different top 3 position
 */
export const PARTIAL_PODIUM_POINTS: Record<number, number> = {
  1: 10, // Predicted P1, finished P2 or P3
  2: 8, // Predicted P2, finished P1 or P3
  3: 6, // Predicted P3, finished P1 or P2
};

/**
 * Special prediction bonuses
 */
export const SPECIAL_POINTS = {
  POLE_POSITION: 10,
  FASTEST_LAP: 5,
};

/**
 * Podium bonus points
 */
export const PODIUM_BONUS = {
  EXACT_ORDER: 50, // All 3 positions correct
  ANY_ORDER: 20, // All 3 drivers correct, any order
};

// ============================================
// Types
// ============================================

export interface RaceResults {
  positions: string[]; // Array of driver IDs in finishing order (index 0 = P1)
  pole: string | null; // Driver ID who got pole
  fastestLap: string | null; // Driver ID with fastest lap
}

export interface Prediction {
  positions: string[]; // Array of 10 driver IDs in predicted order
  pole: string | null;
  fastestLap: string | null;
}

export interface ScoringBreakdown {
  positionPoints: number;
  partialPoints: number;
  polePoints: number;
  fastestLapPoints: number;
  podiumBonus: number;
  totalPoints: number;
  details: PositionDetail[];
}

export interface PositionDetail {
  predicted: number; // Predicted position (1-10)
  actual: number | null; // Actual position (null if not in top 10)
  driverId: string;
  points: number;
  type: "exact" | "partial" | "none";
}

// ============================================
// Scoring Functions
// ============================================

/**
 * Calculate total score for a prediction
 */
export function calculateScore(
  prediction: Prediction,
  results: RaceResults
): ScoringBreakdown {
  const breakdown: ScoringBreakdown = {
    positionPoints: 0,
    partialPoints: 0,
    polePoints: 0,
    fastestLapPoints: 0,
    podiumBonus: 0,
    totalPoints: 0,
    details: [],
  };

  // Create result position map for quick lookup
  const resultPositionMap = new Map<string, number>();
  results.positions.forEach((driverId, index) => {
    resultPositionMap.set(driverId, index + 1);
  });

  // Score each predicted position
  for (let i = 0; i < prediction.positions.length; i++) {
    const predictedPosition = i + 1;
    const driverId = prediction.positions[i];
    const actualPosition = resultPositionMap.get(driverId) || null;

    let points = 0;
    let type: "exact" | "partial" | "none" = "none";

    if (actualPosition === predictedPosition) {
      // Exact position match
      points = EXACT_POSITION_POINTS[predictedPosition] || 0;
      type = "exact";
      breakdown.positionPoints += points;
    } else if (
      predictedPosition <= 3 &&
      actualPosition !== null &&
      actualPosition <= 3
    ) {
      // Partial podium credit (predicted top 3, finished top 3 but different position)
      points = PARTIAL_PODIUM_POINTS[predictedPosition] || 0;
      type = "partial";
      breakdown.partialPoints += points;
    }

    breakdown.details.push({
      predicted: predictedPosition,
      actual: actualPosition,
      driverId,
      points,
      type,
    });
  }

  // Pole position bonus
  if (prediction.pole && prediction.pole === results.pole) {
    breakdown.polePoints = SPECIAL_POINTS.POLE_POSITION;
  }

  // Fastest lap bonus
  if (prediction.fastestLap && prediction.fastestLap === results.fastestLap) {
    breakdown.fastestLapPoints = SPECIAL_POINTS.FASTEST_LAP;
  }

  // Calculate podium bonus
  breakdown.podiumBonus = calculatePodiumBonus(prediction, results);

  // Calculate total
  breakdown.totalPoints =
    breakdown.positionPoints +
    breakdown.partialPoints +
    breakdown.polePoints +
    breakdown.fastestLapPoints +
    breakdown.podiumBonus;

  return breakdown;
}

/**
 * Calculate podium bonus
 */
function calculatePodiumBonus(
  prediction: Prediction,
  results: RaceResults
): number {
  const predictedPodium = prediction.positions.slice(0, 3);
  const actualPodium = results.positions.slice(0, 3);

  // Check exact order
  const exactMatch =
    predictedPodium[0] === actualPodium[0] &&
    predictedPodium[1] === actualPodium[1] &&
    predictedPodium[2] === actualPodium[2];

  if (exactMatch) {
    return PODIUM_BONUS.EXACT_ORDER;
  }

  // Check any order (all 3 drivers correct)
  const allDriversCorrect = predictedPodium.every((driver) =>
    actualPodium.includes(driver)
  );

  if (allDriversCorrect) {
    return PODIUM_BONUS.ANY_ORDER;
  }

  return 0;
}

/**
 * Get maximum possible points for a perfect prediction
 */
export function getMaxPossiblePoints(): number {
  const positionPoints = Object.values(EXACT_POSITION_POINTS).reduce(
    (sum, p) => sum + p,
    0
  );
  return (
    positionPoints +
    SPECIAL_POINTS.POLE_POSITION +
    SPECIAL_POINTS.FASTEST_LAP +
    PODIUM_BONUS.EXACT_ORDER
  );
}

/**
 * Format scoring breakdown for display
 */
export function formatScoreBreakdown(breakdown: ScoringBreakdown): string {
  const lines: string[] = [];

  if (breakdown.positionPoints > 0) {
    lines.push(`Exact positions: ${breakdown.positionPoints} pts`);
  }
  if (breakdown.partialPoints > 0) {
    lines.push(`Partial podium: ${breakdown.partialPoints} pts`);
  }
  if (breakdown.polePoints > 0) {
    lines.push(`Pole Position: ${breakdown.polePoints} pts`);
  }
  if (breakdown.fastestLapPoints > 0) {
    lines.push(`Tour le plus rapide: ${breakdown.fastestLapPoints} pts`);
  }
  if (breakdown.podiumBonus > 0) {
    const bonusType =
      breakdown.podiumBonus === PODIUM_BONUS.EXACT_ORDER
        ? "exact"
        : "partiel";
    lines.push(`Bonus podium (${bonusType}): ${breakdown.podiumBonus} pts`);
  }

  lines.push(`Total: ${breakdown.totalPoints} pts`);

  return lines.join("\n");
}

/**
 * Validate prediction structure
 */
export function validatePrediction(prediction: Prediction): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check positions array
  if (!Array.isArray(prediction.positions)) {
    errors.push("positions must be an array");
  } else {
    if (prediction.positions.length !== 10) {
      errors.push("positions must contain exactly 10 drivers");
    }

    const uniqueDrivers = new Set(prediction.positions);
    if (uniqueDrivers.size !== prediction.positions.length) {
      errors.push("Each driver can only appear once");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  calculateScore,
  getMaxPossiblePoints,
  formatScoreBreakdown,
  validatePrediction,
  EXACT_POSITION_POINTS,
  PARTIAL_PODIUM_POINTS,
  SPECIAL_POINTS,
  PODIUM_BONUS,
};