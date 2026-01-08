"use client";

/**
 * ResultsModal - Main entry point for viewing race prediction results
 * Integrates progressive reveal, comparison view, duel selection, and badge celebrations
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Swords, BarChart3, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResultsStore, type BadgeUnlock } from "@/lib/stores/results-store";
import { DuelOpponentSelector } from "./DuelOpponentSelector";
import { ProgressiveReveal } from "./ProgressiveReveal";
import { ComparisonReveal } from "./ComparisonReveal";
import { ResultsComparison } from "./ResultsComparison";
import { BadgeCelebration } from "./BadgeCelebration";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface Driver {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  constructor?: {
    color: string | null;
    name: string;
  };
}

interface RaceResult {
  position: number;
  driver: Driver;
}

interface PredictionData {
  userId: string;
  pseudo: string;
  avatar: string | null;
  topTen: { driverId: string; position: number }[];
  pole: string | null;
  fastestLap: string | null;
  score?: number;
}

interface ResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  raceId: string;
  raceName: string;
  raceResults: RaceResult[];
  userPrediction: PredictionData;
  opponentPrediction?: PredictionData | null;
  drivers: Driver[];
  poleDriver?: Driver | null;
  fastestLapDriver?: Driver | null;
  newBadges?: BadgeUnlock[];
  currentUserId: string;
}

// ============================================
// Scoring Utilities
// ============================================

function calculateMatchType(
  predicted: number,
  actual: number
): "exact" | "partial" | "none" {
  if (predicted === actual) return "exact";
  if (Math.abs(predicted - actual) <= 2) return "partial";
  return "none";
}

function calculatePositionPoints(predicted: number, actual: number): number {
  if (predicted === actual) {
    // Exact position match
    if (actual <= 3) return 25; // Podium
    if (actual <= 6) return 18;
    return 15;
  }
  if (Math.abs(predicted - actual) <= 2) {
    // Within 2 positions
    if (actual <= 3) return 10;
    return 5;
  }
  return 0;
}

// ============================================
// Helper Functions
// ============================================

function buildUserPredictionResults(
  prediction: PredictionData,
  raceResults: RaceResult[],
  drivers: Driver[],
  poleDriver: Driver | null,
  fastestLapDriver: Driver | null
) {
  // Build position lookup from race results
  const actualPositionMap = new Map<string, number>();
  raceResults.forEach((r) => {
    actualPositionMap.set(r.driver.id, r.position);
  });

  // Build user's predicted position map
  const predictedPositionMap = new Map<number, string>();
  prediction.topTen.forEach(({ driverId, position }) => {
    predictedPositionMap.set(position, driverId);
  });

  // Build results for each actual position
  const results = raceResults.slice(0, 10).map((result) => {
    // Find what position user predicted for this driver
    let predictedPosition: number | null = null;
    prediction.topTen.forEach(({ driverId, position }) => {
      if (driverId === result.driver.id) {
        predictedPosition = position;
      }
    });

    const points = predictedPosition
      ? calculatePositionPoints(predictedPosition, result.position)
      : 0;
    const matchType = predictedPosition
      ? calculateMatchType(predictedPosition, result.position)
      : "none";

    return {
      position: result.position,
      driver: result.driver,
      predictedPosition,
      points,
      matchType,
    };
  });

  // Build bonuses
  const bonuses = [
    {
      type: "pole" as const,
      predicted: drivers.find((d) => d.id === prediction.pole) || null,
      actual: poleDriver,
      correct: prediction.pole === poleDriver?.id,
      points: prediction.pole === poleDriver?.id ? 10 : 0,
    },
    {
      type: "fastestLap" as const,
      predicted: drivers.find((d) => d.id === prediction.fastestLap) || null,
      actual: fastestLapDriver,
      correct: prediction.fastestLap === fastestLapDriver?.id,
      points: prediction.fastestLap === fastestLapDriver?.id ? 10 : 0,
    },
    {
      type: "podium" as const,
      predicted: null, // Podium is derived from top 3
      actual: null,
      correct: false, // TODO: Calculate if user got all 3 podium positions
      points: 0,
    },
  ];

  const totalPoints =
    results.reduce((sum, r) => sum + r.points, 0) +
    bonuses.reduce((sum, b) => sum + b.points, 0);

  return {
    userId: prediction.userId,
    pseudo: prediction.pseudo,
    avatar: prediction.avatar,
    results,
    bonuses,
    totalPoints,
  };
}

// ============================================
// Main Component
// ============================================

export function ResultsModal({
  open,
  onOpenChange,
  raceId,
  raceName,
  raceResults,
  userPrediction,
  opponentPrediction,
  drivers,
  poleDriver = null,
  fastestLapDriver = null,
  newBadges = [],
  currentUserId,
}: ResultsModalProps) {
  const [activeTab, setActiveTab] = useState<"reveal" | "duel" | "compare">("reveal");
  const { pinnedOpponent, addBadgeToQueue, resetReveal } = useResultsStore();

  // Track which badges have been shown - use localStorage to persist across sessions
  const getShownBadges = (): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("f1-shown-badges");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  };

  const markBadgeAsShown = (badgeId: string) => {
    if (typeof window === "undefined") return;
    try {
      const shown = getShownBadges();
      shown.add(badgeId);
      localStorage.setItem("f1-shown-badges", JSON.stringify([...shown]));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Build processed predictions for comparison view
  const processedUserPrediction = buildUserPredictionResults(
    userPrediction,
    raceResults,
    drivers,
    poleDriver,
    fastestLapDriver
  );

  const processedOpponentPrediction = opponentPrediction
    ? buildUserPredictionResults(
        opponentPrediction,
        raceResults,
        drivers,
        poleDriver,
        fastestLapDriver
      )
    : null;

  // Build progressive reveal data
  const revealResults = raceResults.slice(0, 10).map((result) => {
    let predictedPosition: number | null = null;
    userPrediction.topTen.forEach(({ driverId, position }) => {
      if (driverId === result.driver.id) {
        predictedPosition = position;
      }
    });

    const points = predictedPosition
      ? calculatePositionPoints(predictedPosition, result.position)
      : 0;
    const matchType = predictedPosition
      ? calculateMatchType(predictedPosition, result.position)
      : "none";

    return {
      position: result.position,
      driver: result.driver,
      predicted: predictedPosition,
      points,
      matchType,
    };
  });

  // Build comparison reveal data (for duel mode)
  const comparisonRevealResults = raceResults.slice(0, 10).map((result) => {
    // User prediction
    let userPredicted: number | null = null;
    userPrediction.topTen.forEach(({ driverId, position }) => {
      if (driverId === result.driver.id) {
        userPredicted = position;
      }
    });
    const userPoints = userPredicted
      ? calculatePositionPoints(userPredicted, result.position)
      : 0;
    const userMatchType = userPredicted
      ? calculateMatchType(userPredicted, result.position)
      : "none";

    // Opponent prediction (if available)
    let opponentPredicted: number | null = null;
    if (opponentPrediction) {
      opponentPrediction.topTen.forEach(({ driverId, position }) => {
        if (driverId === result.driver.id) {
          opponentPredicted = position;
        }
      });
    }
    const opponentPoints = opponentPredicted
      ? calculatePositionPoints(opponentPredicted, result.position)
      : 0;
    const opponentMatchType = opponentPredicted
      ? calculateMatchType(opponentPredicted, result.position)
      : "none";

    return {
      position: result.position,
      driver: result.driver,
      userPredicted,
      userPoints,
      userMatchType,
      opponentPredicted: pinnedOpponent ? opponentPredicted : undefined,
      opponentPoints: pinnedOpponent ? opponentPoints : undefined,
      opponentMatchType: pinnedOpponent ? opponentMatchType : undefined,
    };
  });

  const maxPossiblePoints = 10 * 25 + 20; // 10 exact positions + pole + fastest lap

  // Trigger badge celebrations when modal opens - only show badges not yet shown
  useEffect(() => {
    if (open && newBadges.length > 0) {
      // Filter out badges already shown to user (persisted in localStorage)
      const shownBadges = getShownBadges();
      const unshownBadges = newBadges.filter(
        (badge) => !shownBadges.has(badge.id)
      );

      if (unshownBadges.length > 0) {
        // Delay badge celebration to let modal settle
        const timer = setTimeout(() => {
          unshownBadges.forEach((badge) => {
            markBadgeAsShown(badge.id);
            addBadgeToQueue(badge);
          });
        }, 500);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, raceId]); // Only depend on open and raceId, not newBadges array

  // Reset reveal state when modal closes
  useEffect(() => {
    if (!open) {
      resetReveal();
    }
  }, [open, resetReveal]);

  const handleRevealComplete = useCallback(() => {
    // Optionally auto-switch to compare tab after reveal
    // setActiveTab("compare");
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-f1-red" />
              Résultats - {raceName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Duel Opponent Selector */}
            <div className="px-1">
              <DuelOpponentSelector currentUserId={currentUserId} />
            </div>

            {/* View Mode Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "reveal" | "duel" | "compare")}
            >
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="reveal" className="gap-2">
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Révélation</span>
                  <span className="sm:hidden">Solo</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="duel" 
                  className="gap-2"
                  disabled={!pinnedOpponent}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Duel</span>
                  <span className="sm:hidden">Duel</span>
                </TabsTrigger>
                <TabsTrigger value="compare" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Comparaison</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reveal" className="mt-4">
                <ProgressiveReveal
                  results={revealResults}
                  totalPoints={maxPossiblePoints}
                  onComplete={handleRevealComplete}
                />
              </TabsContent>

              <TabsContent value="duel" className="mt-4">
                {pinnedOpponent && opponentPrediction ? (
                  <ComparisonReveal
                    results={comparisonRevealResults}
                    userName={userPrediction.pseudo}
                    userAvatar={userPrediction.avatar}
                    opponentName={opponentPrediction.pseudo}
                    opponentAvatar={opponentPrediction.avatar}
                    onComplete={handleRevealComplete}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Sélectionnez un adversaire pour voir la révélation en duel</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="compare" className="mt-4">
                <ResultsComparison
                  userPrediction={processedUserPrediction}
                  opponentPrediction={
                    pinnedOpponent ? processedOpponentPrediction : null
                  }
                  actualResults={raceResults.map((r) => r.driver)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Badge Celebration Overlay */}
      <BadgeCelebration />
    </>
  );
}