"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Star, Sparkles } from 'lucide-react';
import { useConfetti } from './Confetti';
import { getBadgeIcon, getBadgeRarity, BADGE_RARITY_CONFIG, type BadgeRarity } from '@/lib/hooks/useBadges';
import { cn } from '@/lib/utils';

interface UnlockedBadge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
}

interface BadgeUnlockToastProps {
  badge: UnlockedBadge | null;
  onClose: () => void;
  autoClose?: number; // ms, 0 to disable
}

/**
 * Toast notification for badge unlocks
 */
export function BadgeUnlockToast({ badge, onClose, autoClose = 5000 }: BadgeUnlockToastProps) {
  const { fire } = useConfetti({ type: 'badge-unlock' });

  useEffect(() => {
    if (badge) {
      fire();

      if (autoClose > 0) {
        const timer = setTimeout(onClose, autoClose);
        return () => clearTimeout(timer);
      }
    }
  }, [badge, fire, autoClose, onClose]);

  if (!badge) return null;

  const rarity = getBadgeRarity(badge.code);
  const rarityConfig = BADGE_RARITY_CONFIG[rarity];
  const icon = getBadgeIcon(badge.icon);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-full mx-4"
        >
          <div className={cn(
            "relative bg-gradient-to-r from-carbon-dark to-carbon-medium rounded-xl border-2 shadow-2xl overflow-hidden",
            rarityConfig.borderColor
          )}>
            {/* Glow effect */}
            <div className={cn(
              "absolute inset-0 opacity-20",
              rarityConfig.bgColor
            )} />

            {/* Sparkle decorations */}
            <motion.div
              className="absolute top-2 left-4"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className={cn("w-4 h-4", rarityConfig.color)} />
            </motion.div>
            <motion.div
              className="absolute top-3 right-12"
              animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <Star className={cn("w-3 h-3", rarityConfig.color)} />
            </motion.div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded-full bg-carbon-light/50 hover:bg-carbon-light transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            <div className="relative px-4 py-3 flex items-center gap-4">
              {/* Badge Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={cn(
                  "flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-3xl",
                  "bg-gradient-to-br from-racing-red/30 to-cyan-bright/30 border-2",
                  rarityConfig.borderColor
                )}
              >
                {icon}
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-racing-red" />
                  <span className="text-xs text-racing-red font-semibold uppercase">Badge Débloqué!</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full",
                    rarityConfig.bgColor,
                    rarityConfig.color
                  )}>
                    {rarityConfig.label}
                  </span>
                </div>
                <h3 className="text-white font-bold truncate">{badge.name}</h3>
                <p className="text-sm text-gray-400 truncate">{badge.description}</p>
              </div>
            </div>

            {/* Progress bar animation */}
            {autoClose > 0 && (
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: autoClose / 1000, ease: 'linear' }}
                className={cn("h-1", rarityConfig.bgColor.replace('/10', '/50'))}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Badge Queue Manager Hook
// ============================================

interface QueuedBadge extends UnlockedBadge {
  queueId: string;
}

/**
 * Hook to manage a queue of badge unlock notifications
 */
export function useBadgeUnlockQueue() {
  const [queue, setQueue] = useState<QueuedBadge[]>([]);
  const [currentBadge, setCurrentBadge] = useState<QueuedBadge | null>(null);

  // Add badge to queue
  const addBadge = useCallback((badge: UnlockedBadge) => {
    const queuedBadge: QueuedBadge = {
      ...badge,
      queueId: `${badge.id}-${Date.now()}`,
    };
    setQueue(prev => [...prev, queuedBadge]);
  }, []);

  // Add multiple badges
  const addBadges = useCallback((badges: UnlockedBadge[]) => {
    badges.forEach(badge => addBadge(badge));
  }, [addBadge]);

  // Process queue
  useEffect(() => {
    if (!currentBadge && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentBadge(next);
      setQueue(rest);
    }
  }, [currentBadge, queue]);

  // Handle close
  const handleClose = useCallback(() => {
    setCurrentBadge(null);
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setQueue([]);
    setCurrentBadge(null);
  }, []);

  return {
    currentBadge,
    queueLength: queue.length,
    addBadge,
    addBadges,
    handleClose,
    clearAll,
  };
}

// ============================================
// Badge Notification Provider
// ============================================

interface BadgeNotificationContextValue {
  showBadgeUnlock: (badge: UnlockedBadge) => void;
  showBadgeUnlocks: (badges: UnlockedBadge[]) => void;
}

import { createContext, useContext, type ReactNode } from 'react';

const BadgeNotificationContext = createContext<BadgeNotificationContextValue | null>(null);

export function BadgeNotificationProvider({ children }: { children: ReactNode }) {
  const { currentBadge, addBadge, addBadges, handleClose } = useBadgeUnlockQueue();

  const showBadgeUnlock = useCallback((badge: UnlockedBadge) => {
    addBadge(badge);
  }, [addBadge]);

  const showBadgeUnlocks = useCallback((badges: UnlockedBadge[]) => {
    addBadges(badges);
  }, [addBadges]);

  return (
    <BadgeNotificationContext.Provider value={{ showBadgeUnlock, showBadgeUnlocks }}>
      {children}
      <BadgeUnlockToast badge={currentBadge} onClose={handleClose} />
    </BadgeNotificationContext.Provider>
  );
}

export function useBadgeNotification() {
  const context = useContext(BadgeNotificationContext);
  if (!context) {
    throw new Error('useBadgeNotification must be used within a BadgeNotificationProvider');
  }
  return context;
}

export default BadgeUnlockToast;
