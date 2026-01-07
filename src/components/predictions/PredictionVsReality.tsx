"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Check,
  X,
  Trophy,
  Zap,
  Timer,
  Medal,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  EXACT_POSITION_POINTS,
  PARTIAL_PODIUM_POINTS,
  type ScoringBreakdown,
} from "@/lib/services/scoring.service";

// ============================================
// Types
// ============================================

// Flexible Driver interface to support both enriched and API driver objects
// Using 'team' instead of 'constructor' to avoid TypeScript reserved keyword conflict
interface LocalDriver {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  number?: number;
  // Support both imageUrl (enriched) and photo (API)
  imageUrl?: string | null;
  photo?: string | null;
  // Support team object (enriched)
  team?: {
    id: string;
    name: string;
    color: string;
  };
  constructorId?: string;
}

interface PredictionVsRealityProps {
  predictedPositions: string[]; // Array of driver IDs
  actualPositions: string[]; // Array of driver IDs
  predictedPole?: string | null;
  actualPole?: string | null;
  predictedFastestLap?: string | null;
  actualFastestLap?: string | null;
  drivers: LocalDriver[];
  breakdown?: ScoringBreakdown;
  raceName?: string;
  className?: string;
}

// ============================================
// Helper Functions
// ============================================

const getDriverById = (drivers: LocalDriver[], id: string): LocalDriver | undefined => {
  return drivers.find((d) => d.id === id);
};

const getPositionDiff = (predicted: number, actual: number | null): number | null => {
  if (actual === null) return null;
  return predicted - actual; // Positive = finished higher than predicted
};

const getPositionBadgeColor = (position: number): string => {
  if (position === 1) return "bg-yellow-500";
  if (position === 2) return "bg-gray-400";
  if (position === 3) return "bg-orange-600";
  return "bg-muted";
};

// ============================================
// Sub-Components
// ============================================

function DriverCell({
  driver,
  position,
  showPosition = true,
  highlight = false,
  correct = false,
  partial = false,
}: {
  driver?: LocalDriver;
  position?: number;
  showPosition?: boolean;
  highlight?: boolean;
  correct?: boolean;
  partial?: boolean;
}) {
  if (!driver) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
        <span className="text-muted-foreground">-</span>
      </div>
    );
  }

  const teamColor = driver.team?.color || "#666666";
  const driverImage = driver.imageUrl || driver.photo;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-md transition-colors",
        highlight && "ring-2 ring-primary",
        correct && "bg-green-500/10 ring-1 ring-green-500/30",
        partial && !correct && "bg-yellow-500/10 ring-1 ring-yellow-500/30",
        !correct && !partial && !highlight && "bg-muted/30"
      )}
    >
      {showPosition && position && (
        <Badge
          className={cn(
            "w-7 h-7 flex items-center justify-center text-xs font-bold p-0",
            getPositionBadgeColor(position),
            position <= 3 && "text-white"
          )}
        >
          {position}
        </Badge>
      )}
      <Avatar className="h-8 w-8 border-2" style={{ borderColor: teamColor }}>
        <AvatarImage src={driverImage || undefined} />
        <AvatarFallback
          className="text-xs font-bold"
          style={{ backgroundColor: teamColor, color: "white" }}
        >
          {driver.code?.slice(0, 2) || driver.lastName?.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{driver.code}</div>
        <div className="text-xs text-muted-foreground truncate">
          {driver.team?.name || ""}
        </div>
      </div>
      {correct && <Check className="h-4 w-4 text-green-500 flex-shrink-0" />}
      {partial && !correct && <Minus className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
    </div>
  );
}

function DiffIndicator({ diff }: { diff: number | null }) {
  if (diff === null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <X className="h-4 w-4 text-red-500" />
          </TooltipTrigger>
          <TooltipContent>Hors du top 10</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (diff === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Check className="h-5 w-5 text-green-500" />
          </TooltipTrigger>
          <TooltipContent>Position exacte !</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const Icon = diff > 0 ? ArrowUp : ArrowDown;
  const color = diff > 0 ? "text-green-500" : "text-red-500";
  const label = diff > 0 ? `+${diff} places` : `${diff} places`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn("flex items-center gap-0.5", color)}>
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{Math.abs(diff)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SpecialPredictionRow({
  icon: Icon,
  label,
  predicted,
  actual,
  drivers,
  correct,
  points,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  predicted?: string | null;
  actual?: string | null;
  drivers: LocalDriver[];
  correct: boolean;
  points: number;
  iconColor: string;
}) {
  const predictedDriver = predicted ? getDriverById(drivers, predicted) : null;
  const actualDriver = actual ? getDriverById(drivers, actual) : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        correct ? "bg-green-500/5 border-green-500/20" : "bg-muted/20 border-muted"
      )}
    >
      <div className={cn("p-2 rounded-full", iconColor)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Prédit</div>
          <div className="font-medium text-sm">
            {predictedDriver
              ? `${predictedDriver.firstName} ${predictedDriver.lastName}`
              : "Non prédit"}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Réel</div>
          <div className="font-medium text-sm">
            {actualDriver
              ? `${actualDriver.firstName} ${actualDriver.lastName}`
              : "Inconnu"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {correct ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <X className="h-5 w-5 text-muted-foreground" />
        )}
        <Badge variant={correct ? "default" : "secondary"}>
          +{points} pts
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function PredictionVsReality({
  predictedPositions,
  actualPositions,
  predictedPole,
  actualPole,
  predictedFastestLap,
  actualFastestLap,
  drivers,
  breakdown,
  raceName,
  className,
}: PredictionVsRealityProps) {
  // Build position comparison data
  const comparisonData = useMemo(() => {
    const actualMap = new Map<string, number>();
    actualPositions.forEach((id, idx) => actualMap.set(id, idx + 1));

    return predictedPositions.slice(0, 10).map((driverId, idx) => {
      const predictedPos = idx + 1;
      const actualPos = actualMap.get(driverId) || null;
      const diff = getPositionDiff(predictedPos, actualPos);
      const isExact = actualPos === predictedPos;
      const isPartial =
        !isExact &&
        predictedPos <= 3 &&
        actualPos !== null &&
        actualPos <= 3;

      return {
        driverId,
        predictedPos,
        actualPos,
        diff,
        isExact,
        isPartial,
        points: isExact
          ? EXACT_POSITION_POINTS[predictedPos] || 0
          : isPartial
          ? PARTIAL_PODIUM_POINTS[predictedPos] || 0
          : 0,
      };
    });
  }, [predictedPositions, actualPositions]);

  // Stats
  const exactCount = comparisonData.filter((d) => d.isExact).length;
  const partialCount = comparisonData.filter((d) => d.isPartial).length;
  const poleCorrect = predictedPole && predictedPole === actualPole;
  const flCorrect = predictedFastestLap && predictedFastestLap === actualFastestLap;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Prédiction vs Réalité
            </CardTitle>
            <CardDescription>
              {raceName || "Comparaison de votre pronostic"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Check className="h-3 w-3 text-green-500" />
              {exactCount} exact
            </Badge>
            {partialCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <Minus className="h-3 w-3 text-yellow-500" />
                {partialCount} partiel
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main comparison grid */}
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr,40px,1fr] gap-2 text-xs text-muted-foreground font-medium px-2">
            <div>Votre prédiction</div>
            <div className="text-center">Δ</div>
            <div>Résultat réel</div>
          </div>

          {/* Positions */}
          {comparisonData.map((item, idx) => {
            const predictedDriver = getDriverById(drivers, item.driverId);
            const actualDriverAtPos = actualPositions[idx]
              ? getDriverById(drivers, actualPositions[idx])
              : undefined;

            return (
              <motion.div
                key={item.driverId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-[1fr,40px,1fr] gap-2 items-center"
              >
                <DriverCell
                  driver={predictedDriver}
                  position={item.predictedPos}
                  correct={item.isExact}
                  partial={item.isPartial}
                />
                <div className="flex justify-center">
                  <DiffIndicator diff={item.diff} />
                </div>
                <DriverCell
                  driver={actualDriverAtPos}
                  position={item.predictedPos}
                  highlight={
                    actualDriverAtPos?.id === item.driverId && item.isExact
                  }
                />
              </motion.div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Medal className="h-4 w-4 text-primary" />
            Prédictions spéciales
          </h4>

          <div className="space-y-2">
            {/* Pole Position */}
            <SpecialPredictionRow
              icon={Zap}
              label="Pole Position"
              predicted={predictedPole}
              actual={actualPole}
              drivers={drivers}
              correct={!!poleCorrect}
              points={poleCorrect ? 10 : 0}
              iconColor="bg-purple-500"
            />

            {/* Fastest Lap */}
            <SpecialPredictionRow
              icon={Timer}
              label="Tour le plus rapide"
              predicted={predictedFastestLap}
              actual={actualFastestLap}
              drivers={drivers}
              correct={!!flCorrect}
              points={flCorrect ? 5 : 0}
              iconColor="bg-pink-500"
            />
          </div>
        </div>

        {/* Score summary */}
        {breakdown && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score total</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {breakdown.totalPoints}
                </span>
                <span className="text-muted-foreground">points</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Compact Version
// ============================================

export function PredictionVsRealityCompact({
  predictedPositions,
  actualPositions,
  drivers,
  className,
}: Pick<
  PredictionVsRealityProps,
  "predictedPositions" | "actualPositions" | "drivers" | "className"
>) {
  // Build quick comparison for top 3 only
  const top3Comparison = useMemo(() => {
    const actualMap = new Map<string, number>();
    actualPositions.slice(0, 3).forEach((id, idx) => actualMap.set(id, idx + 1));

    return predictedPositions.slice(0, 3).map((driverId, idx) => {
      const actualPos = actualMap.get(driverId);
      return {
        driverId,
        isExact: actualPos === idx + 1,
        isPartial: actualPos !== undefined && actualPos !== idx + 1,
      };
    });
  }, [predictedPositions, actualPositions]);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {top3Comparison.map((item, idx) => {
        const driver = getDriverById(drivers, item.driverId);
        return (
          <div
            key={item.driverId}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs",
              item.isExact && "bg-green-500/20 text-green-600",
              item.isPartial && "bg-yellow-500/20 text-yellow-600",
              !item.isExact && !item.isPartial && "bg-muted text-muted-foreground"
            )}
          >
            <span className="font-bold">P{idx + 1}</span>
            <span>{driver?.code || "?"}</span>
            {item.isExact && <Check className="h-3 w-3" />}
            {item.isPartial && <Minus className="h-3 w-3" />}
          </div>
        );
      })}
    </div>
  );
}

export default PredictionVsReality;
