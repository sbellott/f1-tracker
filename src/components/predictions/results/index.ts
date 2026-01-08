/**
 * Results Components - Prediction results UX module
 * 
 * Features:
 * - Progressive reveal with suspense
 * - Comparison reveal for duel mode
 * - Duel system for opponent comparison
 * - Badge unlock celebrations
 * - Side-by-side results comparison
 */

export { ResultsModal } from "./ResultsModal";
export { ResultsView } from "./ResultsView";
export { ProgressiveReveal } from "./ProgressiveReveal";
export { ComparisonReveal } from "./ComparisonReveal";
export { ResultsComparison } from "./ResultsComparison";
export { DuelOpponentSelector } from "./DuelOpponentSelector";
export { BadgeCelebration } from "./BadgeCelebration";

// Re-export store for convenience
export { useResultsStore, type DuelOpponent, type BadgeUnlock } from "@/lib/stores/results-store";