"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Target, Zap, Crown, Medal, Flame, Award } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Badge Types
// ============================================

export type BadgeType =
  | "first_prediction"
  | "perfect_podium"
  | "streak_3"
  | "streak_5"
  | "streak_10"
  | "top_10_all"
  | "pole_master"
  | "fastest_lap_expert"
  | "group_winner"
  | "season_champion";

interface BadgeConfig {
  id: BadgeType;
  name: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  bgGradient: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const BADGES: Record<BadgeType, BadgeConfig> = {
  first_prediction: {
    id: "first_prediction",
    name: "Premier Pas",
    description: "Tu as fait ton premier pronostic !",
    icon: Star,
    color: "text-yellow-500",
    bgGradient: "from-yellow-500/20 to-amber-500/20",
    rarity: "common",
  },
  perfect_podium: {
    id: "perfect_podium",
    name: "Podium Parfait",
    description: "Tu as prédit le podium exact !",
    icon: Trophy,
    color: "text-amber-500",
    bgGradient: "from-amber-500/20 to-orange-500/20",
    rarity: "rare",
  },
  streak_3: {
    id: "streak_3",
    name: "En Forme",
    description: "3 pronostics consécutifs dans le top 3",
    icon: Flame,
    color: "text-orange-500",
    bgGradient: "from-orange-500/20 to-red-500/20",
    rarity: "common",
  },
  streak_5: {
    id: "streak_5",
    name: "Série Brûlante",
    description: "5 pronostics consécutifs dans le top 3",
    icon: Flame,
    color: "text-red-500",
    bgGradient: "from-red-500/20 to-pink-500/20",
    rarity: "rare",
  },
  streak_10: {
    id: "streak_10",
    name: "Inarrêtable",
    description: "10 pronostics consécutifs dans le top 3",
    icon: Flame,
    color: "text-purple-500",
    bgGradient: "from-purple-500/20 to-pink-500/20",
    rarity: "epic",
  },
  top_10_all: {
    id: "top_10_all",
    name: "Analyste",
    description: "Tu as prédit le top 10 complet !",
    icon: Target,
    color: "text-blue-500",
    bgGradient: "from-blue-500/20 to-cyan-500/20",
    rarity: "epic",
  },
  pole_master: {
    id: "pole_master",
    name: "Expert Qualifs",
    description: "5 poles positions correctes",
    icon: Zap,
    color: "text-cyan-500",
    bgGradient: "from-cyan-500/20 to-teal-500/20",
    rarity: "rare",
  },
  fastest_lap_expert: {
    id: "fastest_lap_expert",
    name: "Maître du Chrono",
    description: "5 tours rapides corrects",
    icon: Zap,
    color: "text-green-500",
    bgGradient: "from-green-500/20 to-emerald-500/20",
    rarity: "rare",
  },
  group_winner: {
    id: "group_winner",
    name: "Champion du Groupe",
    description: "Tu as gagné une manche de groupe !",
    icon: Medal,
    color: "text-indigo-500",
    bgGradient: "from-indigo-500/20 to-violet-500/20",
    rarity: "rare",
  },
  season_champion: {
    id: "season_champion",
    name: "Champion de la Saison",
    description: "Tu as terminé 1er de ta ligue !",
    icon: Crown,
    color: "text-yellow-400",
    bgGradient: "from-yellow-400/30 to-amber-400/30",
    rarity: "legendary",
  },
};

const RARITY_STYLES = {
  common: {
    border: "border-gray-400/50",
    glow: "",
    badge: "bg-gray-100 dark:bg-gray-800",
  },
  rare: {
    border: "border-blue-400/50",
    glow: "shadow-blue-500/20",
    badge: "bg-blue-100 dark:bg-blue-900/30",
  },
  epic: {
    border: "border-purple-400/50",
    glow: "shadow-purple-500/30 shadow-lg",
    badge: "bg-purple-100 dark:bg-purple-900/30",
  },
  legendary: {
    border: "border-yellow-400/50",
    glow: "shadow-yellow-500/40 shadow-xl",
    badge: "bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30",
  },
};

// ============================================
// Badge Unlock Animation Component
// ============================================

interface BadgeUnlockProps {
  badge: BadgeType;
  show: boolean;
  onClose: () => void;
}

export function BadgeUnlock({ badge, show, onClose }: BadgeUnlockProps) {
  const config = BADGES[badge];
  const rarityStyle = RARITY_STYLES[config.rarity];
  const Icon = config.icon;

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          onClick={onClose}
        >
          <div
            className={cn(
              "relative flex items-center gap-4 px-6 py-4 rounded-2xl border-2 cursor-pointer",
              "bg-background/95 backdrop-blur-xl",
              rarityStyle.border,
              rarityStyle.glow
            )}
          >
            {/* Animated background */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50",
                config.bgGradient
              )}
            />

            {/* Icon */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 10 }}
              className={cn(
                "relative w-14 h-14 rounded-xl flex items-center justify-center",
                rarityStyle.badge
              )}
            >
              <Icon className={cn("w-7 h-7", config.color)} />
              
              {/* Sparkle effect for legendary */}
              {config.rarity === "legendary" && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-xl border border-yellow-400/30"
                />
              )}
            </motion.div>

            {/* Content */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 mb-1"
              >
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Badge débloqué
                </span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    config.rarity === "legendary" && "bg-yellow-500/20 text-yellow-600",
                    config.rarity === "epic" && "bg-purple-500/20 text-purple-600",
                    config.rarity === "rare" && "bg-blue-500/20 text-blue-600",
                    config.rarity === "common" && "bg-gray-500/20 text-gray-600"
                  )}
                >
                  {config.rarity === "legendary" && "Légendaire"}
                  {config.rarity === "epic" && "Épique"}
                  {config.rarity === "rare" && "Rare"}
                  {config.rarity === "common" && "Commun"}
                </span>
              </motion.div>
              
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="font-bold text-lg"
              >
                {config.name}
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-muted-foreground"
              >
                {config.description}
              </motion.p>
            </div>

            {/* Close hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground"
            >
              Cliquez pour fermer
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Badge Display Component (for profile/stats)
// ============================================

interface BadgeDisplayProps {
  badge: BadgeType;
  unlocked?: boolean;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export function BadgeDisplay({
  badge,
  unlocked = true,
  size = "md",
  showTooltip = true,
}: BadgeDisplayProps) {
  const config = BADGES[badge];
  const rarityStyle = RARITY_STYLES[config.rarity];
  const Icon = config.icon;

  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="group relative">
      <div
        className={cn(
          "rounded-xl flex items-center justify-center transition-all",
          sizes[size],
          unlocked ? rarityStyle.badge : "bg-muted/50",
          unlocked && rarityStyle.glow,
          !unlocked && "opacity-40 grayscale"
        )}
      >
        <Icon
          className={cn(
            iconSizes[size],
            unlocked ? config.color : "text-muted-foreground"
          )}
        />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border p-3 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{config.name}</span>
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  config.rarity === "legendary" && "bg-yellow-500/20 text-yellow-600",
                  config.rarity === "epic" && "bg-purple-500/20 text-purple-600",
                  config.rarity === "rare" && "bg-blue-500/20 text-blue-600",
                  config.rarity === "common" && "bg-gray-500/20 text-gray-600"
                )}
              >
                {config.rarity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
            {!unlocked && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Pas encore débloqué
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Badge Grid Component
// ============================================

interface BadgeGridProps {
  unlockedBadges: BadgeType[];
  className?: string;
}

export function BadgeGrid({ unlockedBadges, className }: BadgeGridProps) {
  const allBadges = Object.keys(BADGES) as BadgeType[];

  return (
    <div className={cn("grid grid-cols-5 gap-3", className)}>
      {allBadges.map((badge) => (
        <BadgeDisplay
          key={badge}
          badge={badge}
          unlocked={unlockedBadges.includes(badge)}
        />
      ))}
    </div>
  );
}

// ============================================
// Hook for managing badge unlocks
// ============================================

export function useBadgeUnlock() {
  const [pendingBadge, setPendingBadge] = useState<BadgeType | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);

  const unlockBadge = (badge: BadgeType) => {
    setPendingBadge(badge);
    setShowUnlock(true);
  };

  const closeBadge = () => {
    setShowUnlock(false);
    setTimeout(() => setPendingBadge(null), 300);
  };

  return {
    pendingBadge,
    showUnlock,
    unlockBadge,
    closeBadge,
  };
}

export { BADGES, type BadgeConfig };
