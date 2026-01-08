"use client";

/**
 * ProgressiveReveal - Suspenseful reveal of race results position by position
 * Creates anticipation by revealing results one at a time with dynamic animations
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Play, Pause, SkipForward, RotateCcw, Trophy, Flame, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useResultsStore } from "@/lib/stores/results-store";
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

interface PositionResult {
  position: number;
  driver: Driver;
  predicted: number | null;
  points: number;
  matchType: "exact" | "partial" | "none";
}

interface ProgressiveRevealProps {
  results: PositionResult[];
  totalPoints: number;
  onComplete?: () => void;
  className?: string;
}

// ============================================
// Confetti Effect Component
// ============================================

function Confetti({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  const particles = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"][
      Math.floor(Math.random() * 6)
    ],
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: p.color, left: `${p.x}%` }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: "100vh",
            opacity: [1, 1, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            x: [0, (Math.random() - 0.5) * 100],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// Glow Effect Component
// ============================================

function GlowEffect({ color, isActive }: { color: string; isActive: boolean }) {
  if (!isActive) return null;

  return (
    <motion.div
      className="absolute inset-0 rounded-xl pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.8, 0.4, 0.6, 0],
        scale: [1, 1.02, 1, 1.01, 1],
      }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      style={{
        boxShadow: `0 0 30px ${color}, 0 0 60px ${color}40, inset 0 0 20px ${color}20`,
      }}
    />
  );
}

// ============================================
// Position Card Component - Enhanced
// ============================================

function PositionCard({
  result,
  isRevealed,
  isCurrentlyRevealing,
  showingDriver,
  showingPoints,
  index,
}: {
  result: PositionResult;
  isRevealed: boolean;
  isCurrentlyRevealing: boolean;
  showingDriver: boolean;
  showingPoints: boolean;
  index: number;
}) {
  const teamColor = result.driver.constructor?.color || "#333";
  const isPodium = result.position <= 3;
  const isWinner = result.position === 1;
  const isExact = result.matchType === "exact";
  const controls = useAnimation();

  // Trigger shake animation when revealed
  useEffect(() => {
    if (isCurrentlyRevealing && showingDriver) {
      controls.start({
        x: [0, -5, 5, -5, 5, 0],
        transition: { duration: 0.4 },
      });
    }
  }, [isCurrentlyRevealing, showingDriver, controls]);

  // Get position icon and style
  const getPositionStyle = () => {
    if (result.position === 1)
      return {
        bg: "bg-gradient-to-br from-amber-400 to-amber-600",
        text: "text-amber-950",
        icon: <Trophy className="w-4 h-4" />,
      };
    if (result.position === 2)
      return {
        bg: "bg-gradient-to-br from-slate-300 to-slate-500",
        text: "text-slate-950",
        icon: <Star className="w-4 h-4" />,
      };
    if (result.position === 3)
      return {
        bg: "bg-gradient-to-br from-orange-400 to-orange-600",
        text: "text-orange-950",
        icon: <Star className="w-4 h-4" />,
      };
    return {
      bg: "bg-muted",
      text: "text-muted-foreground",
      icon: null,
    };
  };

  const posStyle = getPositionStyle();

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 transition-all duration-300",
        isRevealed
          ? isPodium
            ? "border-amber-500/30 bg-gradient-to-r from-card via-card to-amber-950/10"
            : "border-border bg-gradient-to-r from-card to-card/80"
          : "border-muted/30 bg-muted/5"
      )}
      initial={{ opacity: 0, x: -30, scale: 0.95 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isCurrentlyRevealing ? 1.02 : 1,
      }}
      transition={{
        delay: index * 0.03,
        duration: 0.4,
        scale: { duration: 0.3 },
      }}
    >
      {/* Glow effect for current reveal */}
      <GlowEffect
        color={isPodium ? "#FFD700" : teamColor}
        isActive={isCurrentlyRevealing && showingDriver}
      />

      {/* Team color accent - animated */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        initial={{ backgroundColor: "#444", height: "0%" }}
        animate={{
          backgroundColor: isRevealed ? teamColor : "#444",
          height: isRevealed ? "100%" : "0%",
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      <motion.div
        className="flex items-center gap-4 p-4 pl-6"
        animate={controls}
      >
        {/* Position badge */}
        <motion.div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg",
            posStyle.bg,
            posStyle.text
          )}
          animate={
            isCurrentlyRevealing && showingDriver
              ? {
                  scale: [1, 1.3, 1.1],
                  rotate: isPodium ? [0, -10, 10, 0] : 0,
                }
              : {}
          }
          transition={{ duration: 0.5 }}
        >
          {isRevealed && posStyle.icon ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {posStyle.icon}
            </motion.div>
          ) : (
            `P${result.position}`
          )}
        </motion.div>

        {/* Driver info */}
        <AnimatePresence mode="wait">
          {isRevealed && showingDriver ? (
            <motion.div
              key="revealed"
              className="flex-1 flex items-center gap-4"
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              >
                <Avatar
                  className={cn(
                    "w-14 h-14 border-3 shadow-lg",
                    isPodium && "ring-2 ring-amber-400/50 ring-offset-2 ring-offset-background"
                  )}
                  style={{ borderColor: teamColor }}
                >
                  <AvatarImage src={result.driver.photoUrl || undefined} />
                  <AvatarFallback className="font-bold">
                    {result.driver.code}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div>
                <motion.div
                  className={cn(
                    "font-bold text-lg",
                    isPodium && "text-amber-400"
                  )}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {result.driver.lastName}
                </motion.div>
                <motion.div
                  className="text-sm text-muted-foreground flex items-center gap-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: teamColor }}
                  />
                  {result.driver.constructor?.name || ""}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="hidden"
              className="flex-1 flex items-center gap-4"
              animate={{ opacity: isCurrentlyRevealing ? [0.5, 1, 0.5] : 0.5 }}
              transition={{ duration: 1, repeat: isCurrentlyRevealing ? Infinity : 0 }}
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-28 bg-muted rounded-lg animate-pulse" />
                <div className="h-3 w-20 bg-muted/50 rounded animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prediction comparison & Points */}
        <AnimatePresence>
          {isRevealed && showingPoints && (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.5, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.25, type: "spring" }}
            >
              {/* Match indicator */}
              {result.predicted !== null && (
                <motion.div
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5",
                    result.matchType === "exact" &&
                      "bg-green-500/20 text-green-400 border border-green-500/30",
                    result.matchType === "partial" &&
                      "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                    result.matchType === "none" &&
                      "bg-muted/50 text-muted-foreground"
                  )}
                  animate={
                    isExact
                      ? {
                          scale: [1, 1.1, 1],
                          boxShadow: [
                            "0 0 0 rgba(34, 197, 94, 0)",
                            "0 0 20px rgba(34, 197, 94, 0.5)",
                            "0 0 0 rgba(34, 197, 94, 0)",
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                >
                  {result.matchType === "exact" && (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Exact !
                    </>
                  )}
                  {result.matchType === "partial" && (
                    <>
                      <Flame className="w-3.5 h-3.5" />
                      P{result.predicted}
                    </>
                  )}
                  {result.matchType === "none" && `P${result.predicted}`}
                </motion.div>
              )}

              {/* Points with animation */}
              <motion.div
                className={cn(
                  "min-w-[70px] text-right font-black text-xl px-3 py-1 rounded-lg",
                  result.points > 0
                    ? "text-green-400 bg-green-500/10"
                    : "text-muted-foreground bg-muted/30"
                )}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                +{result.points}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Sticky Score Header
// ============================================

function StickyScoreHeader({
  currentPoints,
  totalPoints,
  progress,
  currentPosition,
  isRevealing,
}: {
  currentPoints: number;
  totalPoints: number;
  progress: number;
  currentPosition: number;
  isRevealing: boolean;
}) {
  const [prevPoints, setPrevPoints] = useState(currentPoints);
  const [isIncreasing, setIsIncreasing] = useState(false);

  useEffect(() => {
    if (currentPoints > prevPoints) {
      setIsIncreasing(true);
      const timer = setTimeout(() => setIsIncreasing(false), 500);
      setPrevPoints(currentPoints);
      return () => clearTimeout(timer);
    }
    setPrevPoints(currentPoints);
  }, [currentPoints, prevPoints]);

  return (
    <motion.div
      className="sticky top-0 z-40 bg-gradient-to-b from-background via-background to-transparent pb-4 pt-2 -mx-4 px-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl border shadow-xl p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Score display */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <motion.div
                className={cn(
                  "text-5xl font-black tabular-nums",
                  isIncreasing ? "text-green-400" : "text-foreground"
                )}
                animate={
                  isIncreasing
                    ? {
                        scale: [1, 1.2, 1],
                        textShadow: [
                          "0 0 0px transparent",
                          "0 0 30px rgba(34, 197, 94, 0.8)",
                          "0 0 0px transparent",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 0.4 }}
              >
                {currentPoints}
              </motion.div>
              <AnimatePresence>
                {isIncreasing && (
                  <motion.div
                    className="absolute -top-2 -right-4 text-green-400 font-bold text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    ↑
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-muted-foreground">
                points
              </div>
              <div className="text-xs text-muted-foreground/60">
                sur {totalPoints} max
              </div>
            </div>
          </div>

          {/* Progress info */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Révélation</span>
              <span className="font-mono">
                {isRevealing ? `P${currentPosition}` : "Terminé"}
              </span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-3" />
              <AnimatePresence>
                {isRevealing && (
                  <motion.div
                    className="absolute top-0 h-3 bg-primary/30 rounded-full"
                    style={{ left: `${progress}%`, width: "10%" }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Current position indicator */}
          {isRevealing && currentPosition > 0 && (
            <motion.div
              className={cn(
                "px-4 py-2 rounded-xl font-bold text-lg",
                currentPosition === 1 && "bg-amber-500/20 text-amber-400",
                currentPosition === 2 && "bg-slate-400/20 text-slate-300",
                currentPosition === 3 && "bg-orange-500/20 text-orange-400",
                currentPosition > 3 && "bg-primary/20 text-primary"
              )}
              key={currentPosition}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
            >
              P{currentPosition}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function ProgressiveReveal({
  results,
  totalPoints,
  onComplete,
  className,
}: ProgressiveRevealProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const {
    revealState,
    startReveal,
    pauseReveal,
    resumeReveal,
    skipToEnd,
    advanceReveal,
    resetReveal,
  } = useResultsStore();

  const { isRevealing, currentPosition, isPaused, showingDriver, showingPoints } =
    revealState;

  // Calculate current score based on revealed positions
  const currentScore = results
    .filter((r) => r.position > currentPosition || currentPosition === 0)
    .reduce((sum, r) => sum + r.points, 0);

  // Progress percentage (10 positions total)
  const progress = ((10 - currentPosition) / 10) * 100;

  // Trigger confetti for podium reveals
  useEffect(() => {
    if (isRevealing && showingDriver && currentPosition <= 3) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isRevealing, showingDriver, currentPosition]);

  // Auto-advance reveal
  useEffect(() => {
    if (isRevealing && !isPaused) {
      // Faster timing - keep it exciting but not too slow
      const delay = currentPosition === 1 ? 2500 : currentPosition <= 3 ? 2000 : 1500;

      intervalRef.current = setTimeout(() => {
        advanceReveal();
      }, delay);
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isRevealing, isPaused, currentPosition, showingDriver, showingPoints, advanceReveal]);

  // Call onComplete when reveal finishes
  useEffect(() => {
    if (!isRevealing && currentPosition === 0 && showingPoints) {
      onComplete?.();
    }
  }, [isRevealing, currentPosition, showingPoints, onComplete]);

  const handleStartReveal = useCallback(() => {
    startReveal();
  }, [startReveal]);

  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      resumeReveal();
    } else {
      pauseReveal();
    }
  }, [isPaused, pauseReveal, resumeReveal]);

  // Sort results by position descending (P10 first for reveal)
  const sortedResults = [...results].sort((a, b) => b.position - a.position);

  const hasStarted = isRevealing || currentPosition === 0 && showingPoints;

  return (
    <div className={cn("relative", className)}>
      {/* Confetti overlay */}
      <Confetti isActive={showConfetti} />

      {/* Sticky score header - shows during/after reveal */}
      {hasStarted && (
        <StickyScoreHeader
          currentPoints={currentScore}
          totalPoints={totalPoints}
          progress={progress}
          currentPosition={currentPosition}
          isRevealing={isRevealing}
        />
      )}

      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRevealing && currentPosition === 0 && !showingPoints ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
            >
              <Button
                onClick={handleStartReveal}
                size="lg"
                className="gap-3 text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
              >
                <Play className="w-5 h-5" />
                Révéler les résultats
              </Button>
            </motion.div>
          ) : isRevealing ? (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                variant="outline"
                size="lg"
                onClick={handleTogglePause}
                className="gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    Reprendre
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={skipToEnd}
                className="gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Tout voir
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                variant="outline"
                size="lg"
                onClick={resetReveal}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Rejouer la révélation
              </Button>
            </motion.div>
          )}
        </div>

        {/* Results list */}
        <div className="space-y-3">
          {sortedResults.map((result, index) => {
            const isRevealed =
              !isRevealing ||
              result.position > currentPosition ||
              (result.position === currentPosition && showingDriver);

            const isCurrentlyRevealing =
              isRevealing && result.position === currentPosition;

            const showPoints =
              !isRevealing ||
              result.position > currentPosition ||
              (result.position === currentPosition && showingPoints);

            return (
              <PositionCard
                key={result.position}
                result={result}
                isRevealed={isRevealed}
                isCurrentlyRevealing={isCurrentlyRevealing}
                showingDriver={isRevealed}
                showingPoints={showPoints}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
