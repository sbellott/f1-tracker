/**
 * Hook for managing scoring celebrations
 * Handles VictoryAnimation display and badge unlock notifications
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBadgeNotification } from "@/components/f1/BadgeUnlockToast";
import type { UserPrediction } from "@/types";

// ============================================
// Types
// ============================================

export interface ScoreBreakdown {
  positionPoints: number;
  partialPoints: number;
  polePoints: number;
  fastestLapPoints: number;
  podiumBonus: number;
  totalPoints: number;
}

export interface ScoringCelebrationData {
  raceName: string;
  score: ScoreBreakdown;
  previousRank?: number;
  newRank?: number;
  perfectPodium?: boolean;
  badgesUnlocked?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

// ============================================
// Hook
// ============================================

export function useScoringCelebration() {
  const [isOpen, setIsOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<ScoringCelebrationData | null>(null);
  const seenPredictionIds = useRef<Set<string>>(new Set());
  const { showBadgeUnlock, showBadgeUnlocks } = useBadgeNotification();
  const queryClient = useQueryClient();

  /**
   * Check for newly scored predictions and trigger celebration
   */
  const checkForNewScores = useCallback((
    predictions: UserPrediction[],
    races: Array<{ id: string; name: string }>
  ) => {
    // Find predictions that have points but haven't been celebrated yet
    const newlyScoredPredictions = predictions.filter(
      (p) => p.points !== null && p.points !== undefined && !seenPredictionIds.current.has(p.id)
    );

    if (newlyScoredPredictions.length > 0) {
      // Celebrate the most recent scored prediction
      const mostRecent = newlyScoredPredictions[0];
      const race = races.find((r) => r.id === mostRecent.raceId);

      if (race && mostRecent.pointsBreakdown) {
        const breakdown = mostRecent.pointsBreakdown as ScoreBreakdown & { details?: unknown[] };

        // Check if it's a perfect podium (P1, P2, P3 all correct)
        const perfectPodium = breakdown.details?.some((d: unknown) => {
          const detail = d as { position?: number; correct?: boolean };
          return detail.position && detail.position <= 3 && detail.correct;
        });

        setCelebrationData({
          raceName: race.name,
          score: {
            positionPoints: breakdown.positionPoints || 0,
            partialPoints: breakdown.partialPoints || 0,
            polePoints: breakdown.polePoints || 0,
            fastestLapPoints: breakdown.fastestLapPoints || 0,
            podiumBonus: breakdown.podiumBonus || 0,
            totalPoints: mostRecent.points!,
          },
          perfectPodium: perfectPodium || false,
        });

        setIsOpen(true);
      }

      // Mark all as seen
      newlyScoredPredictions.forEach((p) => seenPredictionIds.current.add(p.id));
    }
  }, []);

  /**
   * Initialize seen predictions (for page load)
   */
  const initializeSeenPredictions = useCallback((predictions: UserPrediction[]) => {
    predictions.forEach((p) => {
      if (p.points !== null && p.points !== undefined) {
        seenPredictionIds.current.add(p.id);
      }
    });
  }, []);

  /**
   * Manually trigger celebration (e.g., when viewing past results)
   */
  const triggerCelebration = useCallback((data: ScoringCelebrationData) => {
    setCelebrationData(data);
    setIsOpen(true);
  }, []);

  /**
   * Close celebration modal
   */
  const closeCelebration = useCallback(() => {
    setIsOpen(false);
    setCelebrationData(null);
  }, []);

  /**
   * Check for new badge unlocks from notifications
   */
  const checkForBadgeUnlocks = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?type=BADGE_EARNED&unreadOnly=true&limit=5");
      if (!response.ok) return;

      const data = await response.json();
      const badgeNotifications = data.notifications || [];

      if (badgeNotifications.length > 0) {
        const badges = badgeNotifications
          .map((n: { data?: { badge?: { id: string; name: string; icon: string } } }) => n.data?.badge)
          .filter(Boolean);

        if (badges.length > 0) {
          showBadgeUnlocks(badges);
        }

        // Mark notifications as read
        await Promise.all(
          badgeNotifications.map((n: { id: string }) =>
            fetch(`/api/notifications/${n.id}`, { method: "PATCH" })
          )
        );

        // Invalidate badges query to refresh display
        queryClient.invalidateQueries({ queryKey: ["badges"] });
      }
    } catch (error) {
      console.error("Error checking badge unlocks:", error);
    }
  }, [showBadgeUnlocks, queryClient]);

  return {
    // Victory Animation state
    isOpen,
    celebrationData,
    closeCelebration,
    triggerCelebration,

    // Scoring checks
    checkForNewScores,
    initializeSeenPredictions,

    // Badge checks
    checkForBadgeUnlocks,
  };
}

export default useScoringCelebration;
