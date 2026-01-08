"use client";

/**
 * BadgeCelebration - Full-screen celebration overlay for badge unlocks
 * Features confetti animation, badge glow effects, and share functionality
 */

import { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Trophy, Star, Award, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResultsStore, type BadgeUnlock } from "@/lib/stores/results-store";
import { cn } from "@/lib/utils";

// ============================================
// Confetti Animation
// ============================================

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

const F1_COLORS = [
  "#E10600", // F1 Red
  "#15151E", // F1 Black
  "#FFFFFF", // White
  "#FFD700", // Gold
  "#00D2BE", // Mercedes Teal
  "#FF8700", // McLaren Orange
  "#0600EF", // Red Bull Blue
  "#DC0000", // Ferrari Red
];

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: F1_COLORS[Math.floor(Math.random() * F1_COLORS.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

function ConfettiAnimation({ isActive }: { isActive: boolean }) {
  const confettiPieces = useRef(generateConfetti(100));

  if (!isActive) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {confettiPieces.current.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: "100vh",
            opacity: [1, 1, 0],
            rotate: piece.rotation + 720,
            x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// Badge Icon Component
// ============================================

const RARITY_CONFIG = {
  common: {
    gradient: "from-slate-400 to-slate-600",
    glow: "shadow-slate-400/50",
    icon: Star,
    pulseColor: "bg-slate-400",
  },
  rare: {
    gradient: "from-blue-400 to-blue-600",
    glow: "shadow-blue-400/50",
    icon: Award,
    pulseColor: "bg-blue-400",
  },
  epic: {
    gradient: "from-purple-400 to-purple-600",
    glow: "shadow-purple-400/50",
    icon: Trophy,
    pulseColor: "bg-purple-400",
  },
  legendary: {
    gradient: "from-amber-400 to-amber-600",
    glow: "shadow-amber-400/50",
    icon: Crown,
    pulseColor: "bg-amber-400",
  },
};

function BadgeIcon({ badge }: { badge: BadgeUnlock }) {
  const config = RARITY_CONFIG[badge.rarity];

  return (
    <div className="relative">
      {/* Glow pulse animation */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full blur-xl opacity-50",
          config.pulseColor
        )}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Badge container */}
      <motion.div
        className={cn(
          "relative w-32 h-32 rounded-full bg-gradient-to-br flex items-center justify-center",
          "shadow-2xl",
          config.gradient,
          config.glow
        )}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.3,
        }}
      >
        {/* Icon */}
        <span className="text-5xl">{badge.icon}</span>
      </motion.div>

      {/* Sparkle effects */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            top: "50%",
            left: "50%",
          }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * Math.PI * 2) / 6) * 80,
            y: Math.sin((i * Math.PI * 2) / 6) * 80,
          }}
          transition={{
            duration: 1,
            delay: 0.5 + i * 0.1,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function BadgeCelebration() {
  const { currentBadge, dismissCurrentBadge } = useResultsStore();

  const handleShare = useCallback(async () => {
    if (!currentBadge) return;

    const shareData = {
      title: `Badge débloqué: ${currentBadge.name}`,
      text: `J'ai débloqué le badge "${currentBadge.name}" sur F1 Tracker ! ${currentBadge.description}`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        // Could add toast notification here
      }
    } catch (error) {
      console.log("Share cancelled or failed");
    }
  }, [currentBadge]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (currentBadge) {
      const timer = setTimeout(dismissCurrentBadge, 8000);
      return () => clearTimeout(timer);
    }
  }, [currentBadge, dismissCurrentBadge]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && currentBadge) {
        dismissCurrentBadge();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentBadge, dismissCurrentBadge]);

  return (
    <AnimatePresence>
      {currentBadge && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissCurrentBadge}
          />

          {/* Confetti */}
          <ConfettiAnimation isActive={!!currentBadge} />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-6 max-w-md"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* Close button */}
            <button
              onClick={dismissCurrentBadge}
              className="absolute -top-4 -right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Badge unlocked text */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <span className="text-sm font-medium text-amber-400 uppercase tracking-wider">
                Badge Débloqué !
              </span>
            </motion.div>

            {/* Badge icon */}
            <BadgeIcon badge={currentBadge} />

            {/* Badge name */}
            <motion.h2
              className="mt-8 text-3xl font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {currentBadge.name}
            </motion.h2>

            {/* Badge description */}
            <motion.p
              className="mt-3 text-lg text-white/70"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {currentBadge.description}
            </motion.p>

            {/* Rarity badge */}
            <motion.div
              className={cn(
                "mt-4 px-4 py-1.5 rounded-full text-sm font-medium capitalize",
                currentBadge.rarity === "common" && "bg-slate-500/30 text-slate-300",
                currentBadge.rarity === "rare" && "bg-blue-500/30 text-blue-300",
                currentBadge.rarity === "epic" && "bg-purple-500/30 text-purple-300",
                currentBadge.rarity === "legendary" && "bg-amber-500/30 text-amber-300"
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              {currentBadge.rarity === "common" && "Commun"}
              {currentBadge.rarity === "rare" && "Rare"}
              {currentBadge.rarity === "epic" && "Épique"}
              {currentBadge.rarity === "legendary" && "Légendaire"}
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="mt-8 flex gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                variant="outline"
                onClick={handleShare}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
              <Button
                onClick={dismissCurrentBadge}
                className="bg-f1-red hover:bg-f1-red/90"
              >
                Continuer
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
