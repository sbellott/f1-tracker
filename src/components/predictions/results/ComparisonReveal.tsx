"use client";

/**
 * ComparisonReveal - Progressive reveal in comparison mode
 * Shows user vs opponent predictions with actual results, position by position
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, SkipForward, RotateCcw, Trophy, 
  Zap, Star, Swords, Crown, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

interface PositionPrediction {
  position: number;
  driver: Driver;
  userPredicted: number | null;
  userPoints: number;
  userMatchType: "exact" | "partial" | "none";
  opponentPredicted?: number | null;
  opponentPoints?: number;
  opponentMatchType?: "exact" | "partial" | "none";
}

interface ComparisonRevealProps {
  results: PositionPrediction[];
  userName: string;
  userAvatar?: string | null;
  opponentName?: string;
  opponentAvatar?: string | null;
  onComplete?: () => void;
  className?: string;
}

// ============================================
// Confetti Effect
// ============================================

function Confetti({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.5 + Math.random() * 1.5,
    color: ["#E10600", "#FFD700", "#4ECDC4", "#FF6B6B", "#45B7D1"][
      Math.floor(Math.random() * 5)
    ],
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: p.color, left: `${p.x}%` }}
          initial={{ y: -10, opacity: 1 }}
          animate={{
            y: "100vh",
            opacity: [1, 1, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
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
// Score Display Card
// ============================================

function ScoreDisplay({
  name,
  avatar,
  points,
  isLeading,
  isUser,
  animate,
}: {
  name: string;
  avatar?: string | null;
  points: number;
  isLeading: boolean;
  isUser: boolean;
  animate: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
        isLeading
          ? "bg-gradient-to-br from-amber-500/20 to-transparent border-amber-500/50"
          : "bg-card/50 border-border/50",
        isUser ? "flex-row" : "flex-row-reverse"
      )}
      animate={animate ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <Avatar className={cn("w-10 h-10 border-2", isLeading && "border-amber-500")}>
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback className="font-bold text-sm">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex-1", isUser ? "text-left" : "text-right")}>
        <div className="flex items-center gap-2">
          {!isUser && isLeading && <Crown className="w-4 h-4 text-amber-500" />}
          <span className="font-semibold text-sm truncate">{name}</span>
          {isUser && isLeading && <Crown className="w-4 h-4 text-amber-500" />}
        </div>
        <motion.div
          className={cn(
            "text-2xl font-black tabular-nums",
            isLeading ? "text-amber-400" : "text-foreground"
          )}
          key={points}
          initial={{ scale: animate ? 1.3 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {points}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================
// Sticky Duel Header
// ============================================

function StickyDuelHeader({
  userName,
  userAvatar,
  userPoints,
  opponentName,
  opponentAvatar,
  opponentPoints,
  progress,
  currentPosition,
  isRevealing,
  animateUser,
  animateOpponent,
}: {
  userName: string;
  userAvatar?: string | null;
  userPoints: number;
  opponentName?: string;
  opponentAvatar?: string | null;
  opponentPoints: number;
  progress: number;
  currentPosition: number;
  isRevealing: boolean;
  animateUser: boolean;
  animateOpponent: boolean;
}) {
  const userLeading = userPoints > opponentPoints;
  const opponentLeading = opponentPoints > userPoints;

  return (
    <motion.div
      className="sticky top-0 z-40 bg-gradient-to-b from-background via-background to-transparent pb-4 pt-2 -mx-4 px-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl border shadow-xl p-4 space-y-3">
        {/* Scores */}
        <div className="flex items-center gap-3">
          <ScoreDisplay
            name={userName}
            avatar={userAvatar}
            points={userPoints}
            isLeading={userLeading}
            isUser
            animate={animateUser}
          />
          
          <div className="flex flex-col items-center gap-1">
            <Swords className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">VS</span>
          </div>
          
          {opponentName ? (
            <ScoreDisplay
              name={opponentName}
              avatar={opponentAvatar}
              points={opponentPoints}
              isLeading={opponentLeading}
              isUser={false}
              animate={animateOpponent}
            />
          ) : (
            <div className="flex-1 px-4 py-3 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/30 text-center">
              <span className="text-sm text-muted-foreground">
                Pas d'adversaire sélectionné
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Révélation</span>
            <span className="font-mono">
              {isRevealing ? `Position ${currentPosition}` : "Terminé"}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Position Comparison Card
// ============================================

function PositionComparisonCard({
  result,
  hasOpponent,
  isRevealed,
  isCurrentlyRevealing,
  revealPhase,
}: {
  result: PositionPrediction;
  hasOpponent: boolean;
  isRevealed: boolean;
  isCurrentlyRevealing: boolean;
  revealPhase: "hidden" | "driver" | "user" | "opponent" | "complete";
}) {
  const teamColor = result.driver.constructor?.color || "#333";
  const isPodium = result.position <= 3;

  // Position badge style
  const getPositionStyle = () => {
    if (result.position === 1)
      return { bg: "bg-gradient-to-br from-amber-400 to-amber-600", icon: <Trophy className="w-4 h-4" /> };
    if (result.position === 2)
      return { bg: "bg-gradient-to-br from-slate-300 to-slate-500", icon: <Star className="w-4 h-4" /> };
    if (result.position === 3)
      return { bg: "bg-gradient-to-br from-orange-400 to-orange-600", icon: <Star className="w-4 h-4" /> };
    return { bg: "bg-muted", icon: null };
  };

  const posStyle = getPositionStyle();

  // Match indicator component
  const MatchIndicator = ({ 
    predicted, 
    points, 
    matchType, 
    label,
    show,
    delay,
  }: { 
    predicted: number | null | undefined;
    points: number | undefined;
    matchType?: "exact" | "partial" | "none";
    label: string;
    show: boolean;
    delay: number;
  }) => {
    if (!show) return null;
    
    return (
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.3 }}
      >
        <span className="text-xs text-muted-foreground w-12">{label}</span>
        <div className={cn(
          "px-2 py-1 rounded text-xs font-semibold flex items-center gap-1",
          matchType === "exact" && "bg-green-500/20 text-green-400",
          matchType === "partial" && "bg-amber-500/20 text-amber-400",
          matchType === "none" && "bg-muted/50 text-muted-foreground",
          !matchType && "bg-muted/30 text-muted-foreground"
        )}>
          {matchType === "exact" && <Zap className="w-3 h-3" />}
          {predicted !== null && predicted !== undefined ? `P${predicted}` : "—"}
        </div>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
        <motion.span
          className={cn(
            "font-bold text-sm min-w-[40px] text-right",
            (points ?? 0) > 0 ? "text-green-400" : "text-muted-foreground"
          )}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: delay + 0.1 }}
        >
          +{points ?? 0}
        </motion.span>
      </motion.div>
    );
  };

  const showDriver = revealPhase !== "hidden";
  const showUserPrediction = ["user", "opponent", "complete"].includes(revealPhase);
  const showOpponentPrediction = ["opponent", "complete"].includes(revealPhase) && hasOpponent;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 transition-all",
        isRevealed
          ? isPodium
            ? "border-amber-500/30 bg-gradient-to-r from-card via-card to-amber-950/10"
            : "border-border bg-card"
          : "border-muted/30 bg-muted/5"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isCurrentlyRevealing ? 1.02 : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Team color accent */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1"
        initial={{ backgroundColor: "#444" }}
        animate={{ backgroundColor: showDriver ? teamColor : "#444" }}
        transition={{ duration: 0.3 }}
      />

      <div className="p-4 pl-5">
        <div className="flex items-start gap-4">
          {/* Position badge */}
          <motion.div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shrink-0",
              posStyle.bg,
              isPodium ? "text-black" : "text-muted-foreground"
            )}
            animate={isCurrentlyRevealing && showDriver ? { 
              scale: [1, 1.2, 1],
              rotate: isPodium ? [0, -5, 5, 0] : 0,
            } : {}}
            transition={{ duration: 0.4 }}
          >
            {showDriver && posStyle.icon ? posStyle.icon : `P${result.position}`}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Driver info */}
            <AnimatePresence mode="wait">
              {showDriver ? (
                <motion.div
                  key="revealed"
                  className="flex items-center gap-3 mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Avatar className="w-10 h-10 border-2" style={{ borderColor: teamColor }}>
                    <AvatarImage src={result.driver.photoUrl || undefined} />
                    <AvatarFallback>{result.driver.code}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className={cn("font-bold", isPodium && "text-amber-400")}>
                      {result.driver.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: teamColor }} />
                      {result.driver.constructor?.name}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="hidden"
                  className="flex items-center gap-3 mb-3"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted/50 rounded animate-pulse" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Predictions comparison */}
            <div className="space-y-1">
              <MatchIndicator
                predicted={result.userPredicted}
                points={result.userPoints}
                matchType={result.userMatchType}
                label="Toi"
                show={showUserPrediction}
                delay={0}
              />
              {hasOpponent && (
                <MatchIndicator
                  predicted={result.opponentPredicted}
                  points={result.opponentPoints}
                  matchType={result.opponentMatchType}
                  label="Rival"
                  show={showOpponentPrediction}
                  delay={0.15}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function ComparisonReveal({
  results,
  userName,
  userAvatar,
  opponentName,
  opponentAvatar,
  onComplete,
  className,
}: ComparisonRevealProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Reveal state
  const [isRevealing, setIsRevealing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(11); // Start at 11 (before P10)
  const [revealPhase, setRevealPhase] = useState<"hidden" | "driver" | "user" | "opponent" | "complete">("hidden");
  const [animateUserScore, setAnimateUserScore] = useState(false);
  const [animateOpponentScore, setAnimateOpponentScore] = useState(false);

  const hasOpponent = !!opponentName;

  // Calculate scores based on revealed positions
  const userScore = results
    .filter(r => r.position > currentPosition || (r.position === currentPosition && ["user", "opponent", "complete"].includes(revealPhase)))
    .reduce((sum, r) => sum + r.userPoints, 0);

  const opponentScore = hasOpponent 
    ? results
        .filter(r => r.position > currentPosition || (r.position === currentPosition && ["opponent", "complete"].includes(revealPhase)))
        .reduce((sum, r) => sum + (r.opponentPoints || 0), 0)
    : 0;

  // Progress (10 positions)
  const progress = currentPosition <= 10 ? ((10 - currentPosition + 1) / 10) * 100 : 0;

  // Advance reveal
  const advanceReveal = useCallback(() => {
    const phases: Array<"hidden" | "driver" | "user" | "opponent" | "complete"> = 
      hasOpponent ? ["hidden", "driver", "user", "opponent", "complete"] : ["hidden", "driver", "user", "complete"];
    
    const currentPhaseIndex = phases.indexOf(revealPhase);
    
    if (currentPhaseIndex < phases.length - 1) {
      const nextPhase = phases[currentPhaseIndex + 1];
      setRevealPhase(nextPhase);
      
      // Animate score changes
      if (nextPhase === "user") {
        setAnimateUserScore(true);
        setTimeout(() => setAnimateUserScore(false), 400);
      } else if (nextPhase === "opponent") {
        setAnimateOpponentScore(true);
        setTimeout(() => setAnimateOpponentScore(false), 400);
      }
    } else {
      // Move to next position
      if (currentPosition > 1) {
        setCurrentPosition(prev => prev - 1);
        setRevealPhase("hidden");
        
        // Confetti for podium
        if (currentPosition <= 4) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
        }
      } else {
        // Complete
        setIsRevealing(false);
        onComplete?.();
      }
    }
  }, [currentPosition, revealPhase, hasOpponent, onComplete]);

  // Auto-advance
  useEffect(() => {
    if (isRevealing && !isPaused) {
      const delay = currentPosition <= 3 ? 800 : 600; // Slower for podium
      intervalRef.current = setTimeout(advanceReveal, delay);
    }
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [isRevealing, isPaused, advanceReveal, currentPosition]);

  // Controls
  const handleStart = () => {
    setIsRevealing(true);
    setCurrentPosition(10);
    setRevealPhase("hidden");
  };

  const handleTogglePause = () => setIsPaused(prev => !prev);

  const handleSkipToEnd = () => {
    setIsRevealing(false);
    setCurrentPosition(0);
    setRevealPhase("complete");
    onComplete?.();
  };

  const handleReset = () => {
    setIsRevealing(false);
    setCurrentPosition(11);
    setRevealPhase("hidden");
  };

  // Sort by position descending (P10 → P1)
  const sortedResults = [...results].sort((a, b) => b.position - a.position);

  const hasStarted = isRevealing || currentPosition <= 10;

  return (
    <div className={cn("relative", className)}>
      <Confetti isActive={showConfetti} />

      {/* Sticky header */}
      {hasStarted && (
        <StickyDuelHeader
          userName={userName}
          userAvatar={userAvatar}
          userPoints={userScore}
          opponentName={opponentName}
          opponentAvatar={opponentAvatar}
          opponentPoints={opponentScore}
          progress={progress}
          currentPosition={currentPosition}
          isRevealing={isRevealing}
          animateUser={animateUserScore}
          animateOpponent={animateOpponentScore}
        />
      )}

      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!hasStarted ? (
            <Button
              onClick={handleStart}
              size="lg"
              className="gap-3 px-8 py-6 bg-gradient-to-r from-f1-red to-accent hover:from-f1-red/90 hover:to-accent/90"
            >
              <Play className="w-5 h-5" />
              Révéler le duel
            </Button>
          ) : isRevealing ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="lg" onClick={handleTogglePause} className="gap-2">
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? "Reprendre" : "Pause"}
              </Button>
              <Button variant="secondary" size="lg" onClick={handleSkipToEnd} className="gap-2">
                <SkipForward className="w-4 h-4" />
                Tout voir
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="lg" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Rejouer
            </Button>
          )}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {sortedResults.map((result) => {
            const isRevealed = result.position > currentPosition || 
              (result.position === currentPosition && revealPhase !== "hidden");
            const isCurrentlyRevealing = isRevealing && result.position === currentPosition;
            
            let cardPhase: "hidden" | "driver" | "user" | "opponent" | "complete" = "hidden";
            if (result.position > currentPosition) {
              cardPhase = "complete";
            } else if (result.position === currentPosition) {
              cardPhase = revealPhase;
            }

            return (
              <PositionComparisonCard
                key={result.position}
                result={result}
                hasOpponent={hasOpponent}
                isRevealed={isRevealed}
                isCurrentlyRevealing={isCurrentlyRevealing}
                revealPhase={cardPhase}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
