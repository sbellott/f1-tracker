"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { PredictionVsReality } from "./PredictionVsReality";
import type { Driver, Race, UserPrediction } from "@/types";

// ============================================
// Types
// ============================================

interface ScoreDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prediction: UserPrediction | null;
  race: Race | null;
  drivers: Driver[];
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
}: ScoreDetailModalProps) {
  const [showBreakdown, setShowBreakdown] = useState(true);

  if (!prediction || !race) return null;

  const breakdown = prediction.pointsBreakdown;
  const points = prediction.points ?? 0;

  // Get actual results from race session
  const raceSession = race.sessions?.find((s) => s.type === "RACE");
  const actualResults = raceSession?.results;

  // Build predicted positions array
  const predictedPositions = [
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
  ].filter(Boolean);

  // Build actual positions array from session results
  const actualPositions = actualResults?.positions
    ? actualResults.positions
        .sort((a, b) => a.position - b.position)
        .slice(0, 10)
        .map((p) => p.driverId)
    : [];

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
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-w-2xl">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Résultat - {race.name}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        {/* Score Hero Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "relative overflow-hidden rounded-xl p-6 text-center",
            `bg-gradient-to-br ${config.gradient}`
          )}
        >
          {/* Sparkle decorations */}
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
        {actualPositions.length > 0 && (
          <PredictionVsReality
            predictedPositions={predictedPositions}
            actualPositions={actualPositions}
            predictedPole={prediction.predictions.pole}
            actualPole={actualResults?.polePosition}
            predictedFastestLap={prediction.predictions.fastestLap}
            actualFastestLap={actualResults?.fastestLap?.driverId}
            drivers={drivers}
            raceName={race.name}
          />
        )}

        {/* No results available */}
        {actualPositions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Les résultats détaillés ne sont pas encore disponibles.</p>
          </div>
        )}
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}

export default ScoreDetailModal;
