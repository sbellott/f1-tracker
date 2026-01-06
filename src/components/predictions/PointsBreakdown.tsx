"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Target,
  Zap,
  Timer,
  Award,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Minus,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

import {
  EXACT_POSITION_POINTS,
  PARTIAL_PODIUM_POINTS,
  SPECIAL_POINTS,
  PODIUM_BONUS,
  getMaxPossiblePoints,
  type ScoringBreakdown,
  type PositionDetail,
} from "@/lib/services/scoring.service";

// ============================================
// Types
// ============================================

interface Driver {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  constructor?: {
    name: string;
    color: string;
  };
}

interface PointsBreakdownProps {
  breakdown: ScoringBreakdown;
  drivers: Driver[];
  predictedPole?: string | null;
  actualPole?: string | null;
  predictedFastestLap?: string | null;
  actualFastestLap?: string | null;
  className?: string;
  compact?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const getDriverById = (drivers: Driver[], id: string): Driver | undefined => {
  return drivers.find((d) => d.id === id);
};

const getPositionLabel = (position: number): string => {
  if (position === 1) return "1er";
  if (position === 2) return "2ème";
  if (position === 3) return "3ème";
  return `${position}ème`;
};

const getTypeColor = (type: "exact" | "partial" | "none"): string => {
  switch (type) {
    case "exact":
      return "text-green-500";
    case "partial":
      return "text-yellow-500";
    case "none":
      return "text-muted-foreground";
  }
};

const getTypeBg = (type: "exact" | "partial" | "none"): string => {
  switch (type) {
    case "exact":
      return "bg-green-500/10 border-green-500/20";
    case "partial":
      return "bg-yellow-500/10 border-yellow-500/20";
    case "none":
      return "bg-muted/30 border-muted";
  }
};

// ============================================
// Sub-Components
// ============================================

function PointsCategory({
  icon: Icon,
  label,
  points,
  maxPoints,
  color,
  description,
  children,
}: {
  icon: React.ElementType;
  label: string;
  points: number;
  maxPoints: number;
  color: string;
  description: string;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const percentage = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
  const hasDetails = !!children;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border transition-colors",
          points > 0 ? "bg-card" : "bg-muted/20",
          hasDetails && "cursor-pointer hover:bg-accent/50"
        )}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              points > 0 ? color : "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                points > 0 ? "text-white" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{label}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={percentage} className="w-24 h-1.5" />
              <span className="text-xs text-muted-foreground">
                {points}/{maxPoints}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xl font-bold tabular-nums",
              points > 0 ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {points}
          </span>
          <span className="text-sm text-muted-foreground">pts</span>
          {hasDetails && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                expanded && "rotate-180"
              )}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 border-l-2 border-muted ml-5 space-y-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PositionRow({
  detail,
  driver,
}: {
  detail: PositionDetail;
  driver?: Driver;
}) {
  const Icon =
    detail.type === "exact" ? Check : detail.type === "partial" ? Minus : X;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 rounded-md border text-sm",
        getTypeBg(detail.type)
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", getTypeColor(detail.type))} />
        <span className="font-medium">
          P{detail.predicted}:{" "}
          {driver ? `${driver.firstName} ${driver.lastName}` : detail.driverId}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {detail.actual !== null && detail.actual !== detail.predicted && (
          <span className="text-xs text-muted-foreground">
            (réel: P{detail.actual})
          </span>
        )}
        <Badge
          variant={detail.points > 0 ? "default" : "secondary"}
          className={cn(
            "tabular-nums",
            detail.type === "exact" && "bg-green-500",
            detail.type === "partial" && "bg-yellow-500"
          )}
        >
          +{detail.points}
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function PointsBreakdown({
  breakdown,
  drivers,
  predictedPole,
  actualPole,
  predictedFastestLap,
  actualFastestLap,
  className,
  compact = false,
}: PointsBreakdownProps) {
  const maxPoints = getMaxPossiblePoints();
  const percentage = (breakdown.totalPoints / maxPoints) * 100;

  // Calculate max points per category
  const maxPositionPoints = Object.values(EXACT_POSITION_POINTS).reduce(
    (a, b) => a + b,
    0
  );
  const maxPodiumBonus = PODIUM_BONUS.EXACT_ORDER;

  // Determine podium bonus type
  const podiumBonusType =
    breakdown.podiumBonus === PODIUM_BONUS.EXACT_ORDER
      ? "ordre exact"
      : breakdown.podiumBonus === PODIUM_BONUS.ANY_ORDER
      ? "3 pilotes corrects"
      : null;

  // Get pole driver
  const poleDriver = predictedPole ? getDriverById(drivers, predictedPole) : null;
  const poleCorrect = predictedPole && predictedPole === actualPole;

  // Get fastest lap driver
  const flDriver = predictedFastestLap
    ? getDriverById(drivers, predictedFastestLap)
    : null;
  const flCorrect = predictedFastestLap && predictedFastestLap === actualFastestLap;

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Score</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{breakdown.totalPoints}</span>
            <span className="text-sm text-muted-foreground">/ {maxPoints} pts</span>
          </div>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex flex-wrap gap-1">
          {breakdown.positionPoints > 0 && (
            <Badge variant="outline" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {breakdown.positionPoints} pos
            </Badge>
          )}
          {breakdown.partialPoints > 0 && (
            <Badge variant="outline" className="text-xs">
              <Trophy className="h-3 w-3 mr-1" />
              {breakdown.partialPoints} partiel
            </Badge>
          )}
          {breakdown.polePoints > 0 && (
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              {breakdown.polePoints} pole
            </Badge>
          )}
          {breakdown.fastestLapPoints > 0 && (
            <Badge variant="outline" className="text-xs">
              <Timer className="h-3 w-3 mr-1" />
              {breakdown.fastestLapPoints} FL
            </Badge>
          )}
          {breakdown.podiumBonus > 0 && (
            <Badge variant="outline" className="text-xs">
              <Award className="h-3 w-3 mr-1" />
              {breakdown.podiumBonus} bonus
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Détail des points
            </CardTitle>
            <CardDescription>
              Analyse complète de votre score
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{breakdown.totalPoints}</div>
            <div className="text-sm text-muted-foreground">
              / {maxPoints} points max
            </div>
          </div>
        </div>
        <Progress value={percentage} className="mt-3 h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0 pts</span>
          <span>{Math.round(percentage)}% du score parfait</span>
          <span>{maxPoints} pts</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Positions exactes */}
        <PointsCategory
          icon={Target}
          label="Positions exactes"
          points={breakdown.positionPoints}
          maxPoints={maxPositionPoints}
          color="bg-green-500"
          description="Points pour chaque pilote prédit à sa position exacte. P1=25pts, P2=18pts, P3=15pts, etc."
        >
          {breakdown.details
            .filter((d) => d.type === "exact")
            .map((detail) => (
              <PositionRow
                key={detail.predicted}
                detail={detail}
                driver={getDriverById(drivers, detail.driverId)}
              />
            ))}
          {breakdown.positionPoints === 0 && (
            <div className="text-sm text-muted-foreground p-2">
              Aucune position exacte
            </div>
          )}
        </PointsCategory>

        {/* Podium partiel */}
        <PointsCategory
          icon={Trophy}
          label="Podium partiel"
          points={breakdown.partialPoints}
          maxPoints={
            PARTIAL_PODIUM_POINTS[1] +
            PARTIAL_PODIUM_POINTS[2] +
            PARTIAL_PODIUM_POINTS[3]
          }
          color="bg-yellow-500"
          description="Points quand un pilote prédit sur le podium finit sur le podium mais à une autre position."
        >
          {breakdown.details
            .filter((d) => d.type === "partial")
            .map((detail) => (
              <PositionRow
                key={detail.predicted}
                detail={detail}
                driver={getDriverById(drivers, detail.driverId)}
              />
            ))}
          {breakdown.partialPoints === 0 && (
            <div className="text-sm text-muted-foreground p-2">
              Aucun point de podium partiel
            </div>
          )}
        </PointsCategory>

        {/* Pole Position */}
        <PointsCategory
          icon={Zap}
          label="Pole Position"
          points={breakdown.polePoints}
          maxPoints={SPECIAL_POINTS.POLE_POSITION}
          color="bg-purple-500"
          description="Bonus de 10 points pour avoir prédit le pilote en pole position."
        >
          <div
            className={cn(
              "flex items-center justify-between p-2 rounded-md border text-sm",
              poleCorrect ? getTypeBg("exact") : getTypeBg("none")
            )}
          >
            <div className="flex items-center gap-2">
              {poleCorrect ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span>
                Prédit:{" "}
                {poleDriver
                  ? `${poleDriver.firstName} ${poleDriver.lastName}`
                  : predictedPole || "Non prédit"}
              </span>
            </div>
            <Badge variant={poleCorrect ? "default" : "secondary"}>
              +{breakdown.polePoints}
            </Badge>
          </div>
        </PointsCategory>

        {/* Tour le plus rapide */}
        <PointsCategory
          icon={Timer}
          label="Tour le plus rapide"
          points={breakdown.fastestLapPoints}
          maxPoints={SPECIAL_POINTS.FASTEST_LAP}
          color="bg-pink-500"
          description="Bonus de 5 points pour avoir prédit le pilote avec le meilleur tour."
        >
          <div
            className={cn(
              "flex items-center justify-between p-2 rounded-md border text-sm",
              flCorrect ? getTypeBg("exact") : getTypeBg("none")
            )}
          >
            <div className="flex items-center gap-2">
              {flCorrect ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span>
                Prédit:{" "}
                {flDriver
                  ? `${flDriver.firstName} ${flDriver.lastName}`
                  : predictedFastestLap || "Non prédit"}
              </span>
            </div>
            <Badge variant={flCorrect ? "default" : "secondary"}>
              +{breakdown.fastestLapPoints}
            </Badge>
          </div>
        </PointsCategory>

        {/* Bonus Podium */}
        <PointsCategory
          icon={Award}
          label="Bonus Podium"
          points={breakdown.podiumBonus}
          maxPoints={maxPodiumBonus}
          color="bg-orange-500"
          description="Bonus de 50pts pour le podium exact, 20pts pour les 3 bons pilotes dans un ordre différent."
        >
          <div
            className={cn(
              "flex items-center justify-between p-2 rounded-md border text-sm",
              breakdown.podiumBonus > 0 ? getTypeBg("exact") : getTypeBg("none")
            )}
          >
            <div className="flex items-center gap-2">
              {breakdown.podiumBonus > 0 ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span>
                {podiumBonusType
                  ? `Podium ${podiumBonusType}`
                  : "Podium incorrect"}
              </span>
            </div>
            <Badge
              variant={breakdown.podiumBonus > 0 ? "default" : "secondary"}
              className={
                breakdown.podiumBonus === PODIUM_BONUS.EXACT_ORDER
                  ? "bg-orange-500"
                  : breakdown.podiumBonus === PODIUM_BONUS.ANY_ORDER
                  ? "bg-yellow-500"
                  : ""
              }
            >
              +{breakdown.podiumBonus}
            </Badge>
          </div>
        </PointsCategory>

        {/* Résumé des positions non marquées */}
        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-muted-foreground"
            onClick={() => {}}
          >
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              {breakdown.details.filter((d) => d.type === "none").length}{" "}
              positions sans points
            </span>
            <span className="text-xs">
              {breakdown.details
                .filter((d) => d.type === "none")
                .slice(0, 3)
                .map((d) => `P${d.predicted}`)
                .join(", ")}
              {breakdown.details.filter((d) => d.type === "none").length > 3 &&
                "..."}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Compact Inline Version
// ============================================

export function PointsBreakdownInline({
  breakdown,
  className,
}: {
  breakdown: ScoringBreakdown;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {breakdown.positionPoints > 0 && (
        <Badge variant="outline" className="text-xs gap-1 bg-green-500/10">
          <Target className="h-3 w-3 text-green-500" />
          {breakdown.positionPoints}
        </Badge>
      )}
      {breakdown.partialPoints > 0 && (
        <Badge variant="outline" className="text-xs gap-1 bg-yellow-500/10">
          <Trophy className="h-3 w-3 text-yellow-500" />
          {breakdown.partialPoints}
        </Badge>
      )}
      {breakdown.polePoints > 0 && (
        <Badge variant="outline" className="text-xs gap-1 bg-purple-500/10">
          <Zap className="h-3 w-3 text-purple-500" />
          {breakdown.polePoints}
        </Badge>
      )}
      {breakdown.fastestLapPoints > 0 && (
        <Badge variant="outline" className="text-xs gap-1 bg-pink-500/10">
          <Timer className="h-3 w-3 text-pink-500" />
          {breakdown.fastestLapPoints}
        </Badge>
      )}
      {breakdown.podiumBonus > 0 && (
        <Badge variant="outline" className="text-xs gap-1 bg-orange-500/10">
          <Award className="h-3 w-3 text-orange-500" />
          {breakdown.podiumBonus}
        </Badge>
      )}
      <span className="font-bold ml-1">{breakdown.totalPoints} pts</span>
    </div>
  );
}

export default PointsBreakdown;
