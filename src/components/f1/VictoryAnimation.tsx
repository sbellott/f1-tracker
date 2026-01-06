"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, TrendingUp, Medal, X } from 'lucide-react';
import { useConfetti } from './Confetti';
import { cn } from '@/lib/utils';

interface ScoreBreakdown {
  positionPoints: number;
  partialPoints: number;
  polePoints: number;
  fastestLapPoints: number;
  podiumBonus: number;
  totalPoints: number;
}

interface VictoryAnimationProps {
  isOpen: boolean;
  onClose: () => void;
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

export function VictoryAnimation({
  isOpen,
  onClose,
  raceName,
  score,
  previousRank,
  newRank,
  perfectPodium = false,
  badgesUnlocked = [],
}: VictoryAnimationProps) {
  const [phase, setPhase] = useState<'intro' | 'breakdown' | 'badges' | 'complete'>('intro');
  const [visibleCategories, setVisibleCategories] = useState<number>(0);
  const { fire: fireConfetti } = useConfetti({
    type: perfectPodium ? 'perfect-score' : score.totalPoints >= 50 ? 'podium' : 'prediction-submit',
    duration: 3000
  });

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setPhase('intro');
      setVisibleCategories(0);
    }
  }, [isOpen]);

  // Phase progression
  useEffect(() => {
    if (!isOpen) return;

    const timers: NodeJS.Timeout[] = [];

    if (phase === 'intro') {
      fireConfetti();
      timers.push(setTimeout(() => setPhase('breakdown'), 1500));
    }

    if (phase === 'breakdown') {
      // Reveal categories one by one
      const categories = [
        score.positionPoints > 0,
        score.partialPoints > 0,
        score.polePoints > 0,
        score.fastestLapPoints > 0,
        score.podiumBonus > 0,
      ].filter(Boolean).length;

      for (let i = 0; i <= categories; i++) {
        timers.push(setTimeout(() => setVisibleCategories(i), i * 400));
      }

      // Move to badges or complete
      timers.push(setTimeout(() => {
        setPhase(badgesUnlocked.length > 0 ? 'badges' : 'complete');
      }, (categories + 1) * 400 + 1000));
    }

    if (phase === 'badges') {
      timers.push(setTimeout(() => setPhase('complete'), badgesUnlocked.length * 600 + 1500));
    }

    return () => timers.forEach(clearTimeout);
  }, [isOpen, phase, score, badgesUnlocked.length, fireConfetti]);

  const scoreCategories = [
    { key: 'positions', label: 'Positions exactes', points: score.positionPoints, icon: Target, color: 'text-cyan-400' },
    { key: 'partial', label: 'Points partiels', points: score.partialPoints, icon: TrendingUp, color: 'text-blue-400' },
    { key: 'pole', label: 'Pole Position', points: score.polePoints, icon: Zap, color: 'text-yellow-400' },
    { key: 'fastestLap', label: 'Meilleur tour', points: score.fastestLapPoints, icon: Star, color: 'text-purple-400' },
    { key: 'podium', label: 'Bonus Podium', points: score.podiumBonus, icon: Medal, color: 'text-racing-red' },
  ].filter(cat => cat.points > 0);

  const getScoreMessage = () => {
    if (perfectPodium) return 'PODIUM PARFAIT! 🏆';
    if (score.totalPoints >= 80) return 'INCROYABLE! 🔥';
    if (score.totalPoints >= 50) return 'EXCELLENT! ⭐';
    if (score.totalPoints >= 30) return 'BIEN JOUÉ! 👏';
    return 'PRONOSTIC SCORÉ! ✓';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 bg-gradient-to-b from-carbon-dark to-carbon-medium rounded-2xl border border-gray-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-carbon-light/50 hover:bg-carbon-light transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Header */}
            <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-racing-red/20 to-transparent" />

              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Trophy className="w-16 h-16 mx-auto mb-4 text-racing-red" />
                <h2 className="text-lg text-gray-400 mb-1">{raceName}</h2>
                <motion.p
                  className="text-2xl font-bold text-white"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.4 }}
                >
                  {getScoreMessage()}
                </motion.p>
              </motion.div>
            </div>

            {/* Score display */}
            <div className="px-6 pb-4">
              <motion.div
                className="text-center mb-6"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.6 }}
              >
                <CountUpNumber value={score.totalPoints} className="text-6xl font-bold text-white" />
                <p className="text-gray-400 mt-1">points</p>
              </motion.div>

              {/* Score breakdown */}
              {phase !== 'intro' && (
                <div className="space-y-2 mb-6">
                  {scoreCategories.map((category, index) => (
                    <motion.div
                      key={category.key}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{
                        x: index < visibleCategories ? 0 : -20,
                        opacity: index < visibleCategories ? 1 : 0
                      }}
                      className="flex items-center justify-between py-2 px-3 bg-carbon-light/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <category.icon className={cn("w-4 h-4", category.color)} />
                        <span className="text-sm text-gray-300">{category.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">+{category.points}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Rank change */}
              {previousRank && newRank && phase === 'complete' && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex items-center justify-center gap-4 py-3 bg-carbon-light/30 rounded-lg mb-4"
                >
                  <span className="text-gray-400">Classement</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">#{previousRank}</span>
                    <span className="text-gray-500">→</span>
                    <span className={cn(
                      "font-bold",
                      newRank < previousRank ? "text-green-400" : newRank > previousRank ? "text-red-400" : "text-gray-300"
                    )}>
                      #{newRank}
                    </span>
                    {newRank < previousRank && (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                </motion.div>
              )}

              {/* Badges unlocked */}
              {phase === 'badges' && badgesUnlocked.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <p className="text-center text-sm text-gray-400 mb-3">Badges débloqués!</p>
                  <div className="flex justify-center gap-3">
                    {badgesUnlocked.map((badge, index) => (
                      <motion.div
                        key={badge.id}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.2, type: 'spring' }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-racing-red/30 to-cyan-bright/30 border-2 border-racing-red flex items-center justify-center text-2xl">
                          {badge.icon}
                        </div>
                        <span className="text-xs text-gray-300">{badge.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: phase === 'complete' ? 0.3 : 2 }}
                onClick={onClose}
                className="w-full py-3 bg-racing-red hover:bg-racing-red/90 text-white font-semibold rounded-xl transition-colors"
              >
                {phase === 'complete' ? 'Continuer' : 'Passer'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Count Up Animation Component
// ============================================

interface CountUpNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

function CountUpNumber({ value, duration = 1500, className }: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);

      // Easing function for smooth deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
}

// ============================================
// Quick Score Toast
// ============================================

interface ScoreToastProps {
  isVisible: boolean;
  points: number;
  message?: string;
  position?: 'top' | 'bottom';
}

export function ScoreToast({ isVisible, points, message, position = 'top' }: ScoreToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gradient-to-r from-racing-red to-racing-red/80 rounded-full shadow-lg",
            position === 'top' ? 'top-4' : 'bottom-4'
          )}
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-white" />
            <span className="font-bold text-white text-lg">+{points} pts</span>
            {message && <span className="text-white/80 text-sm">{message}</span>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VictoryAnimation;
