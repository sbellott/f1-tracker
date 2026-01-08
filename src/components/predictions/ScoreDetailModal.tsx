"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Sparkles, ChevronDown, ChevronUp, Eye, BarChart3, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { PredictionVsReality } from "./PredictionVsReality";
import { ProgressiveReveal } from "./results/ProgressiveReveal";
import { ResultsComparison } from "./results/ResultsComparison";
import { DuelOpponentSelector } from "./results/DuelOpponentSelector";
import { BadgeCelebration } from "./results/BadgeCelebration";
import { useResultsStore, type BadgeUnlock } from "@/lib/stores/results-store";
import type { Driver, Race, UserPrediction } from "@/types";

// ============================================
// Types
// ============================================

// Extended type to handle both API formats
interface ExtendedPrediction extends Omit<UserPrediction, 'predictions'> {
  predictions?: {
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
  // API format fields
  topTen?: string[];
  pole?: string;
  fastestLap?: string;
}

interface ScoreDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prediction: ExtendedPrediction | null;
  race: Race | null;
  drivers: Driver[];
  currentUserId?: string;
  newBadges?: BadgeUnlock[];
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
    if (actual <= 3) return 25;
    if (actual <= 6) return 18;
    return 15;
  }
  if (Math.abs(predicted - actual) <= 2) {
    if (actual <= 3) return 10;
    return 5;
  }
  return 0;
}

// ============================================
// Component
// ============================================

export function ScoreDetailModal({
  open,
  onOpenChange,
  prediction,
  race,
  drivers,
  currentUserId,
  newBadges = [],
}: ScoreDetailModalProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"reveal" | "compare" | "classic">("reveal");
  const { pinnedOpponent, addBadgeToQueue, resetReveal } = useResultsStore();

  // Reset reveal state when modal closes
  useEffect(() => {
    if (!open) {
      resetReveal();
      setActiveTab("reveal");
    }
  }, [open, resetReveal]);

  // Trigger badge celebrations
  useEffect(() => {
    if (open && newBadges.length > 0) {
      const timer = setTimeout(() => {
        newBadges.forEach((badge) => {
          addBadgeToQueue(badge);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, newBadges, addBadgeToQueue]);

  if (!prediction || !race) return null;

  const breakdown = prediction.pointsBreakdown;
  const points = prediction.points ?? 0;

  // Get actual results from race session
  const raceSession = race.sessions?.find((s) => s.type === "RACE");
  const actualResults = raceSession?.results;

  // Build predicted positions array (handles both API formats)
  const predictedPositions = prediction.predictions
    ? [
        prediction.predictions.p1,
        prediction.predictions.p2,
        prediction.predictions.p3,
        prediction.predictions.p4,
        prediction.predictions.p5,
        prediction.predictions.p6,
        prediction.predictions.p7,
        prediction.predictions.p8,
        prediction.predictions.p9,
        prediction.predictions.p10,
      ].filter(Boolean)
    : (prediction.topTen || []).slice(0, 10);

  // Build actual positions from session results
  const actualPositions = actualResults?.positions
    ? actualResults.positions
        .sort((a, b) => a.position - b.position)
        .slice(0, 10)
        .map((p) => p.driverId)
    : [];

  // Build progressive reveal data
  const revealResults = actualPositions.slice(0, 10).map((driverId, index) => {
    const position = index + 1;
    const driver = drivers.find((d) => d.id === driverId);
    const predictedPosition = predictedPositions.indexOf(driverId) + 1 || null;
    
    const pts = predictedPosition
      ? calculatePositionPoints(predictedPosition, position)
      : 0;
    const matchType = predictedPosition
      ? calculateMatchType(predictedPosition, position)
      : "none";

    return {
      position,
      driver: driver ? {
        id: driver.id,
        code: driver.code,
        firstName: driver.firstName,
        lastName: driver.lastName,
        photoUrl: driver.photo || null,
        constructor: driver.constructorId ? {
          color: null,
          name: driver.constructorId,
        } : undefined,
      } : {
        id: driverId,
        code: "???",
        firstName: "Unknown",
        lastName: "Driver",
        photoUrl: null,
      },
      predicted: predictedPosition,
      points: pts,
      matchType,
    };
  });

  // Get pole and fastest lap predictions (handles both formats)
  const predictedPole = prediction.predictions?.pole || prediction.pole;
  const predictedFastestLap = prediction.predictions?.fastestLap || prediction.fastestLap;

  // Build comparison data
  const comparisonUserPrediction = {
    userId: prediction.userId,
    pseudo: "Vous",
    avatar: null,
    results: revealResults.map((r) => ({
      position: r.position,
      driver: r.driver,
      predictedPosition: r.predicted,
      points: r.points,
      matchType: r.matchType,
    })),
    bonuses: [
      {
        type: "pole" as const,
        predicted: predictedPole && drivers.find((d) => d.id === predictedPole) 
          ? { 
              id: predictedPole, 
              code: drivers.find((d) => d.id === predictedPole)?.code || "",
              firstName: drivers.find((d) => d.id === predictedPole)?.firstName || "",
              lastName: drivers.find((d) => d.id === predictedPole)?.lastName || "",
              photoUrl: drivers.find((d) => d.id === predictedPole)?.photo || null,
              constructor: undefined,
            } 
          : null,
        actual: actualResults?.polePosition && drivers.find((d) => d.id === actualResults.polePosition)
          ? {
              id: actualResults.polePosition,
              code: drivers.find((d) => d.id === actualResults.polePosition)?.code || "",
              firstName: drivers.find((d) => d.id === actualResults.polePosition)?.firstName || "",
              lastName: drivers.find((d) => d.id === actualResults.polePosition)?.lastName || "",
              photoUrl: drivers.find((d) => d.id === actualResults.polePosition)?.photo || null,
              constructor: undefined,
            }
          : null,
        correct: predictedPole === actualResults?.polePosition,
        points: predictedPole === actualResults?.polePosition ? 10 : 0,
      },
      {
        type: "fastestLap" as const,
        predicted: predictedFastestLap && drivers.find((d) => d.id === predictedFastestLap)
          ? {
              id: predictedFastestLap,
              code: drivers.find((d) => d.id === predictedFastestLap)?.code || "",
              firstName: drivers.find((d) => d.id === predictedFastestLap)?.firstName || "",
              lastName: drivers.find((d) => d.id === predictedFastestLap)?.lastName || "",
              photoUrl: drivers.find((d) => d.id === predictedFastestLap)?.photo || null,
              constructor: undefined,
            }
          : null,
        actual: actualResults?.fastestLap?.driverId && drivers.find((d) => d.id === actualResults.fastestLap?.driverId)
          ? {
              id: actualResults.fastestLap.driverId,
              code: drivers.find((d) => d.id === actualResults.fastestLap?.driverId)?.code || "",
              firstName: drivers.find((d) => d.id === actualResults.fastestLap?.driverId)?.firstName || "",
              lastName: drivers.find((d) => d.id === actualResults.fastestLap?.driverId)?.lastName || "",
              photoUrl: drivers.find((d) => d.id === actualResults.fastestLap?.driverId)?.photo || null,
              constructor: undefined,
            }
          : null,
        correct: predictedFastestLap === actualResults?.fastestLap?.driverId,
        points: predictedFastestLap === actualResults?.fastestLap?.driverId ? 10 : 0,
      },
      {
        type: "podium" as const,
        predicted: null,
        actual: null,
        correct: false,
        points: breakdown?.podiumBonus || 0,
      },
    ],
    totalPoints: points,
  };

  const maxPossiblePoints = 10 * 25 + 20;

  // Determine score quality for celebration
  const scoreQuality =
    points >= 100
      ? "legendary"
      : points >= 70
      ? "excellent"
      : points >= 40
      ? "good"
      : points >= 20
      ? "decent"
      : "low";

  const qualityConfig = {
    legendary: {
      gradient: "from-yellow-500 via-amber-500 to-orange-500",
      text: "Score Légendaire!",
      emoji: "🏆",
    },
    excellent: {
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      text: "Excellent!",
      emoji: "🎯",
    },
    good: {
      gradient: "from-blue-500 via-cyan-500 to-sky-500",
      text: "Bien joué!",
      emoji: "👏",
    },
    decent: {
      gradient: "from-purple-500 via-violet-500 to-indigo-500",
      text: "Pas mal!",
      emoji: "👍",
    },
    low: {
      gradient: "from-gray-500 via-slate-500 to-zinc-500",
      text: "On fera mieux!",
      emoji: "💪",
    },
  };

  const config = qualityConfig[scoreQuality];

  return (
    <>
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Résultat - {race.name}
            </ResponsiveModalTitle>
          </ResponsiveModalHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Score Hero Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "relative overflow-hidden rounded-xl p-6 text-center",
                `bg-gradient-to-br ${config.gradient}`
              )}
            >
              <motion.div
                className="absolute top-2 left-4"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 text-white/60" />
              </motion.div>
              <motion.div
                className="absolute top-4 right-6"
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <Sparkles className="w-4 h-4 text-white/60" />
              </motion.div>

              <div className="relative z-10">
                <div className="text-4xl mb-2">{config.emoji}</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-6xl font-bold text-white mb-2"
                >
                  {points}
                </motion.div>
                <div className="text-white/90 text-lg font-medium">points</div>
                <div className="text-white/70 text-sm mt-1">{config.text}</div>
              </div>
            </motion.div>

            {/* Duel Opponent Selector */}
            {currentUserId && (
              <DuelOpponentSelector currentUserId={currentUserId} />
            )}

            {/* View Mode Tabs */}
            {actualPositions.length > 0 && (
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "reveal" | "compare" | "classic")}
              >
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="reveal" className="gap-1 text-xs sm:text-sm">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Révélation</span>
                    <span className="sm:hidden">Révéler</span>
                  </TabsTrigger>
                  <TabsTrigger value="compare" className="gap-1 text-xs sm:text-sm">
                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Comparaison</span>
                    <span className="sm:hidden">Comparer</span>
                  </TabsTrigger>
                  <TabsTrigger value="classic" className="gap-1 text-xs sm:text-sm">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Classique</span>
                    <span className="sm:hidden">Détail</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="reveal" className="mt-4">
                  <ProgressiveReveal
                    results={revealResults}
                    totalPoints={maxPossiblePoints}
                  />
                </TabsContent>

                <TabsContent value="compare" className="mt-4">
                  <ResultsComparison
                    userPrediction={comparisonUserPrediction}
                    opponentPrediction={null}
                    actualResults={revealResults.map((r) => r.driver)}
                  />
                </TabsContent>

                <TabsContent value="classic" className="mt-4 space-y-4">
                  {/* Points Breakdown */}
                  {breakdown && (
                    <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between py-4 h-auto"
                        >
                          <span className="font-medium">Détail des points</span>
                          {showBreakdown ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Positions exactes
                            </span>
                            <Badge variant="outline">+{breakdown.positionPoints}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Podium partiel
                            </span>
                            <Badge variant="outline">+{breakdown.partialPoints}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Pole Position
                            </span>
                            <Badge variant="outline">+{breakdown.polePoints}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Tour rapide
                            </span>
                            <Badge variant="outline">+{breakdown.fastestLapPoints}</Badge>
                          </div>
                          {breakdown.podiumBonus > 0 && (
                            <div className="col-span-2 flex justify-between items-center border-t pt-2">
                              <span className="text-sm font-medium">Bonus podium</span>
                              <Badge className="bg-amber-500">
                                +{breakdown.podiumBonus}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Prediction vs Reality */}
                  <PredictionVsReality
                    predictedPositions={predictedPositions}
                    actualPositions={actualPositions}
                    predictedPole={predictedPole}
                    actualPole={actualResults?.polePosition}
                    predictedFastestLap={predictedFastestLap}
                    actualFastestLap={actualResults?.fastestLap?.driverId}
                    drivers={drivers}
                    raceName={race.name}
                  />
                </TabsContent>
              </Tabs>
            )}

            {/* No results available */}
            {actualPositions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Les résultats détaillés ne sont pas encore disponibles.</p>
              </div>
            )}
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Badge Celebration Overlay */}
      <BadgeCelebration />
    </>
  );
}

export default ScoreDetailModal;