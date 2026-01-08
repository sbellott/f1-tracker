"use client";

/**
 * ResultsComparison - Side-by-side comparison of predicted vs actual race results
 * Shows user's prediction alongside opponent's prediction with scoring breakdown
 * Enhanced UI with visual duel indicator and better use of space
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Zap, Award, TrendingUp, TrendingDown, Minus, Crown, Swords, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface PredictionResult {
  position: number;
  driver: Driver;
  predictedPosition: number | null;
  points: number;
  matchType: "exact" | "partial" | "none";
}

interface BonusPrediction {
  type: "pole" | "fastestLap" | "podium";
  predicted: Driver | null;
  actual: Driver | null;
  correct: boolean;
  points: number;
}

interface UserPrediction {
  userId: string;
  pseudo: string;
  avatar: string | null;
  results: PredictionResult[];
  bonuses: BonusPrediction[];
  totalPoints: number;
  rank?: number;
}

interface ResultsComparisonProps {
  userPrediction: UserPrediction;
  opponentPrediction?: UserPrediction | null;
  actualResults: Driver[];
  className?: string;
}

// ============================================
// Score Comparison Bar (New Component)
// ============================================

function ScoreComparisonBar({
  userPoints,
  opponentPoints,
  userName,
  opponentName,
}: {
  userPoints: number;
  opponentPoints: number;
  userName: string;
  opponentName: string;
}) {
  const total = userPoints + opponentPoints;
  const userPercent = total > 0 ? (userPoints / total) * 100 : 50;
  const difference = userPoints - opponentPoints;
  const winner = difference > 0 ? "user" : difference < 0 ? "opponent" : "tie";

  return (
    <motion.div
      className="relative bg-gradient-to-r from-f1-red/10 via-muted/30 to-blue-500/10 rounded-2xl p-4 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* VS Badge */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          className="w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-lg"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Swords className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </div>

      <div className="flex items-center justify-between">
        {/* User Side */}
        <div className={cn(
          "flex-1 text-center transition-all",
          winner === "user" && "scale-105"
        )}>
          <motion.div
            className={cn(
              "text-4xl font-bold mb-1",
              winner === "user" ? "text-f1-red" : "text-foreground"
            )}
            animate={winner === "user" ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
          >
            {userPoints}
          </motion.div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            {winner === "user" && <Crown className="w-4 h-4 text-amber-500" />}
            {userName}
          </div>
        </div>

        {/* Opponent Side */}
        <div className={cn(
          "flex-1 text-center transition-all",
          winner === "opponent" && "scale-105"
        )}>
          <motion.div
            className={cn(
              "text-4xl font-bold mb-1",
              winner === "opponent" ? "text-blue-500" : "text-foreground"
            )}
            animate={winner === "opponent" ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
          >
            {opponentPoints}
          </motion.div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            {winner === "opponent" && <Crown className="w-4 h-4 text-amber-500" />}
            {opponentName}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-3 bg-muted/50 rounded-full overflow-hidden flex">
        <motion.div
          className="h-full bg-gradient-to-r from-f1-red to-f1-red/70 rounded-l-full"
          initial={{ width: "50%" }}
          animate={{ width: `${userPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.div
          className="h-full bg-gradient-to-l from-blue-500 to-blue-500/70 rounded-r-full"
          initial={{ width: "50%" }}
          animate={{ width: `${100 - userPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Difference indicator */}
      {difference !== 0 && (
        <motion.div
          className="text-center mt-2 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Badge
            variant="secondary"
            className={cn(
              "font-mono",
              difference > 0 ? "bg-f1-red/20 text-f1-red" : "bg-blue-500/20 text-blue-500"
            )}
          >
            {difference > 0 ? "+" : ""}{difference} pts
          </Badge>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// Score Summary Card (Enhanced)
// ============================================

function ScoreSummaryCard({
  prediction,
  isUser,
  isWinner,
}: {
  prediction: UserPrediction;
  isUser: boolean;
  isWinner?: boolean;
}) {
  const exactMatches = prediction.results.filter(
    (r) => r.matchType === "exact"
  ).length;
  const partialMatches = prediction.results.filter(
    (r) => r.matchType === "partial"
  ).length;
  const bonusPoints = prediction.bonuses
    .filter((b) => b.correct)
    .reduce((sum, b) => sum + b.points, 0);

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        isUser && "border-f1-red/50 bg-gradient-to-br from-f1-red/5 to-transparent",
        !isUser && "border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-transparent",
        isWinner && "ring-2 ring-amber-500/50"
      )}
    >
      {/* Winner crown */}
      {isWinner && (
        <motion.div
          className="absolute -top-1 -right-1 w-8 h-8 bg-amber-500 rounded-bl-xl flex items-center justify-center"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Crown className="w-4 h-4 text-white" />
        </motion.div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className={cn(
            "w-14 h-14 ring-2",
            isUser ? "ring-f1-red/50" : "ring-blue-500/50"
          )}>
            <AvatarImage src={prediction.avatar || undefined} />
            <AvatarFallback className="text-lg font-bold">
              {prediction.pseudo.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {prediction.pseudo}
              {isUser && (
                <Badge variant="secondary" className="text-xs">Vous</Badge>
              )}
            </CardTitle>
            {prediction.rank && (
              <span className="text-sm text-muted-foreground">
                #{prediction.rank} au classement
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Grid - More compact and visual */}
        <div className="grid grid-cols-3 gap-2">
          <motion.div
            className="p-3 rounded-xl bg-green-500/10 text-center"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-green-500" />
              <span className="font-bold text-xl text-green-500">{exactMatches}</span>
            </div>
            <div className="text-xs text-muted-foreground">Exact</div>
          </motion.div>
          <motion.div
            className="p-3 rounded-xl bg-amber-500/10 text-center"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-xl text-amber-500">{partialMatches}</span>
            </div>
            <div className="text-xs text-muted-foreground">±2 pos</div>
          </motion.div>
          <motion.div
            className="p-3 rounded-xl bg-purple-500/10 text-center"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-4 h-4 text-purple-500" />
              <span className="font-bold text-xl text-purple-500">{bonusPoints}</span>
            </div>
            <div className="text-xs text-muted-foreground">Bonus</div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Position Row Component (Enhanced)
// ============================================

function PositionRow({
  position,
  actualDriver,
  userPredicted,
  opponentPredicted,
  userPoints,
  opponentPoints,
}: {
  position: number;
  actualDriver: Driver;
  userPredicted: number | null;
  opponentPredicted?: number | null;
  userPoints: number;
  opponentPoints?: number;
}) {
  const teamColor = actualDriver.constructor?.color || "#333";

  const getMatchStyle = (predicted: number | null, points: number) => {
    if (predicted === null) return { icon: Minus, color: "text-muted-foreground", bg: "" };
    if (predicted === position)
      return { icon: Target, color: "text-green-500", bg: "bg-green-500/10" };
    if (Math.abs(predicted - position) <= 2)
      return { icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" };
    return { icon: TrendingDown, color: "text-muted-foreground", bg: "" };
  };

  const userStyle = getMatchStyle(userPredicted, userPoints);
  const opponentStyle = opponentPredicted !== undefined 
    ? getMatchStyle(opponentPredicted, opponentPoints ?? 0)
    : null;

  // Position medal colors
  const positionStyle = {
    1: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30",
    2: "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-400/30",
    3: "bg-gradient-to-br from-orange-400 to-orange-700 text-white shadow-lg shadow-orange-500/30",
  }[position] || "bg-muted text-muted-foreground";

  return (
    <motion.div
      className="flex items-center gap-2 p-2.5 rounded-xl bg-card/50 border border-border hover:bg-card transition-colors"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: position * 0.03 }}
    >
      {/* Position Badge */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
          positionStyle
        )}
      >
        P{position}
      </div>

      {/* Driver Info */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div
          className="w-1.5 h-10 rounded-full shrink-0"
          style={{ backgroundColor: teamColor }}
        />
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={actualDriver.photoUrl || undefined} />
          <AvatarFallback className="text-xs font-bold">{actualDriver.code}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">
            {actualDriver.lastName}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {actualDriver.constructor?.name}
          </div>
        </div>
      </div>

      {/* User Prediction */}
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg min-w-[90px] justify-end",
        userStyle.bg
      )}>
        <userStyle.icon className={cn("w-4 h-4 shrink-0", userStyle.color)} />
        <span className={cn("text-sm font-medium", userStyle.color)}>
          {userPredicted !== null ? `P${userPredicted}` : "-"}
        </span>
        {userPoints > 0 && (
          <Badge className="bg-green-500 text-white text-xs px-1.5">
            +{userPoints}
          </Badge>
        )}
      </div>

      {/* Opponent Prediction */}
      {opponentStyle && (
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg min-w-[90px] justify-end border-l border-border ml-1",
          opponentStyle.bg
        )}>
          <opponentStyle.icon className={cn("w-4 h-4 shrink-0", opponentStyle.color)} />
          <span className={cn("text-sm font-medium", opponentStyle.color)}>
            {opponentPredicted !== null ? `P${opponentPredicted}` : "-"}
          </span>
          {(opponentPoints ?? 0) > 0 && (
            <Badge className="bg-green-500 text-white text-xs px-1.5">
              +{opponentPoints}
            </Badge>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Bonus Row Component (Enhanced)
// ============================================

function BonusRow({
  userBonus,
  opponentBonus,
  label,
  icon: Icon,
}: {
  userBonus: BonusPrediction;
  opponentBonus?: BonusPrediction;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-purple-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          Réel: <span className="font-medium">{userBonus.actual?.lastName || "N/A"}</span>
        </div>
      </div>

      {/* User Prediction */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg min-w-[110px] justify-end",
        userBonus.correct ? "bg-green-500/10" : "bg-muted/30"
      )}>
        <span className="text-sm font-medium truncate">
          {userBonus.predicted?.lastName || "-"}
        </span>
        {userBonus.correct ? (
          <Badge className="bg-green-500 text-white text-xs shrink-0">
            +{userBonus.points}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs shrink-0">
            0
          </Badge>
        )}
      </div>

      {/* Opponent Prediction */}
      {opponentBonus && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg min-w-[110px] justify-end border-l border-border ml-1",
          opponentBonus.correct ? "bg-green-500/10" : "bg-muted/30"
        )}>
          <span className="text-sm font-medium truncate">
            {opponentBonus.predicted?.lastName || "-"}
          </span>
          {opponentBonus.correct ? (
            <Badge className="bg-green-500 text-white text-xs shrink-0">
              +{opponentBonus.points}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs shrink-0">
              0
            </Badge>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function ResultsComparison({
  userPrediction,
  opponentPrediction,
  actualResults,
  className,
}: ResultsComparisonProps) {
  // Build position lookup maps
  const userPredictionMap = useMemo(() => {
    const map = new Map<string, PredictionResult>();
    userPrediction.results.forEach((r) => {
      map.set(r.driver.id, r);
    });
    return map;
  }, [userPrediction.results]);

  const opponentPredictionMap = useMemo(() => {
    if (!opponentPrediction) return null;
    const map = new Map<string, PredictionResult>();
    opponentPrediction.results.forEach((r) => {
      map.set(r.driver.id, r);
    });
    return map;
  }, [opponentPrediction]);

  // Get bonus by type
  const getUserBonus = (type: BonusPrediction["type"]) =>
    userPrediction.bonuses.find((b) => b.type === type)!;
  const getOpponentBonus = (type: BonusPrediction["type"]) =>
    opponentPrediction?.bonuses.find((b) => b.type === type);

  // Determine winner
  const userWins = opponentPrediction ? userPrediction.totalPoints > opponentPrediction.totalPoints : undefined;
  const opponentWins = opponentPrediction ? opponentPrediction.totalPoints > userPrediction.totalPoints : undefined;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Duel Score Bar (when opponent selected) */}
      {opponentPrediction && (
        <ScoreComparisonBar
          userPoints={userPrediction.totalPoints}
          opponentPoints={opponentPrediction.totalPoints}
          userName={userPrediction.pseudo}
          opponentName={opponentPrediction.pseudo}
        />
      )}

      {/* Score Summary Cards */}
      <div
        className={cn(
          "grid gap-4",
          opponentPrediction ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"
        )}
      >
        <ScoreSummaryCard prediction={userPrediction} isUser isWinner={userWins} />
        {opponentPrediction && (
          <ScoreSummaryCard prediction={opponentPrediction} isUser={false} isWinner={opponentWins} />
        )}
      </div>

      {/* Detailed Comparison */}
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-11">
          <TabsTrigger value="positions" className="gap-2">
            <Trophy className="w-4 h-4" />
            Top 10
          </TabsTrigger>
          <TabsTrigger value="bonuses" className="gap-2">
            <Award className="w-4 h-4" />
            Bonus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="mt-4 space-y-1.5">
          {/* Header */}
          <div className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground font-medium sticky top-0 bg-background/95 backdrop-blur-sm z-10 rounded-lg">
            <div className="w-9 shrink-0" />
            <div className="flex-1">Résultat réel</div>
            <div className="min-w-[90px] text-right text-f1-red">Vous</div>
            {opponentPrediction && (
              <div className="min-w-[90px] text-right text-blue-500 border-l border-border pl-2 ml-1">
                {opponentPrediction.pseudo}
              </div>
            )}
          </div>

          {/* Position Rows */}
          <AnimatePresence>
            {actualResults.slice(0, 10).map((driver, index) => {
              const position = index + 1;
              const userResult = userPredictionMap.get(driver.id);
              const opponentResult = opponentPredictionMap?.get(driver.id);

              return (
                <PositionRow
                  key={driver.id}
                  position={position}
                  actualDriver={driver}
                  userPredicted={userResult?.predictedPosition ?? null}
                  opponentPredicted={opponentResult?.predictedPosition}
                  userPoints={userResult?.points ?? 0}
                  opponentPoints={opponentResult?.points ?? 0}
                />
              );
            })}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="bonuses" className="mt-4 space-y-2">
          <BonusRow
            userBonus={getUserBonus("pole")}
            opponentBonus={getOpponentBonus("pole")}
            label="Pole Position"
            icon={Zap}
          />
          <BonusRow
            userBonus={getUserBonus("fastestLap")}
            opponentBonus={getOpponentBonus("fastestLap")}
            label="Meilleur tour"
            icon={Trophy}
          />
          <BonusRow
            userBonus={getUserBonus("podium")}
            opponentBonus={getOpponentBonus("podium")}
            label="Podium Bonus"
            icon={Award}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}