/**
 * Results Store - Zustand store for predictions results UX
 * Manages duel state, progressive reveal, and badge celebrations
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================
// Types
// ============================================

export interface DuelOpponent {
  id: string;
  pseudo: string;
  avatar: string | null;
  groupId: string;
  groupName: string;
}

export interface BadgeUnlock {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt: Date;
}

export interface RevealState {
  isRevealing: boolean;
  currentPosition: number; // 0-10, 0 = not started
  isPaused: boolean;
  showingDriver: boolean;
  showingPoints: boolean;
}

// ============================================
// Store Interface
// ============================================

interface ResultsStore {
  // Duel State
  pinnedOpponent: DuelOpponent | null;
  recentOpponents: DuelOpponent[];
  setPinnedOpponent: (opponent: DuelOpponent | null) => void;
  addRecentOpponent: (opponent: DuelOpponent) => void;
  clearRecentOpponents: () => void;

  // Progressive Reveal State
  revealState: RevealState;
  startReveal: () => void;
  pauseReveal: () => void;
  resumeReveal: () => void;
  skipToEnd: () => void;
  advanceReveal: () => void;
  resetReveal: () => void;

  // Badge Celebration Queue
  badgeQueue: BadgeUnlock[];
  currentBadge: BadgeUnlock | null;
  addBadgeToQueue: (badge: BadgeUnlock) => void;
  showNextBadge: () => void;
  dismissCurrentBadge: () => void;
  clearBadgeQueue: () => void;

  // UI State
  showResultsModal: boolean;
  selectedRaceId: string | null;
  setShowResultsModal: (show: boolean, raceId?: string) => void;
}

// ============================================
// Store Implementation
// ============================================

export const useResultsStore = create<ResultsStore>()(
  persist(
    (set, get) => ({
      // ========== Duel State ==========
      pinnedOpponent: null,
      recentOpponents: [],

      setPinnedOpponent: (opponent) => {
        set({ pinnedOpponent: opponent });
        if (opponent) {
          get().addRecentOpponent(opponent);
        }
      },

      addRecentOpponent: (opponent) => {
        const { recentOpponents } = get();
        // Remove if already exists and add to front
        const filtered = recentOpponents.filter((o) => o.id !== opponent.id);
        const updated = [opponent, ...filtered].slice(0, 5); // Keep max 5
        set({ recentOpponents: updated });
      },

      clearRecentOpponents: () => {
        set({ recentOpponents: [] });
      },

      // ========== Progressive Reveal State ==========
      revealState: {
        isRevealing: false,
        currentPosition: 0,
        isPaused: false,
        showingDriver: false,
        showingPoints: false,
      },

      startReveal: () => {
        set({
          revealState: {
            isRevealing: true,
            currentPosition: 10, // Start from P10
            isPaused: false,
            showingDriver: false,
            showingPoints: false,
          },
        });
      },

      pauseReveal: () => {
        set((state) => ({
          revealState: { ...state.revealState, isPaused: true },
        }));
      },

      resumeReveal: () => {
        set((state) => ({
          revealState: { ...state.revealState, isPaused: false },
        }));
      },

      skipToEnd: () => {
        set({
          revealState: {
            isRevealing: false,
            currentPosition: 0,
            isPaused: false,
            showingDriver: true,
            showingPoints: true,
          },
        });
      },

      advanceReveal: () => {
        const { revealState } = get();
        const { currentPosition, showingDriver, showingPoints } = revealState;

        if (!showingDriver) {
          // Show driver name
          set({
            revealState: { ...revealState, showingDriver: true },
          });
        } else if (!showingPoints) {
          // Show points for this position
          set({
            revealState: { ...revealState, showingPoints: true },
          });
        } else if (currentPosition > 1) {
          // Move to next position (counting down from 10 to 1)
          set({
            revealState: {
              ...revealState,
              currentPosition: currentPosition - 1,
              showingDriver: false,
              showingPoints: false,
            },
          });
        } else {
          // Reveal complete
          set({
            revealState: {
              isRevealing: false,
              currentPosition: 0,
              isPaused: false,
              showingDriver: true,
              showingPoints: true,
            },
          });
        }
      },

      resetReveal: () => {
        set({
          revealState: {
            isRevealing: false,
            currentPosition: 0,
            isPaused: false,
            showingDriver: false,
            showingPoints: false,
          },
        });
      },

      // ========== Badge Celebration Queue ==========
      badgeQueue: [],
      currentBadge: null,

      addBadgeToQueue: (badge) => {
        const { currentBadge, badgeQueue } = get();
        if (!currentBadge) {
          // Show immediately if nothing is showing
          set({ currentBadge: badge });
        } else {
          // Add to queue
          set({ badgeQueue: [...badgeQueue, badge] });
        }
      },

      showNextBadge: () => {
        const { badgeQueue } = get();
        if (badgeQueue.length > 0) {
          const [next, ...rest] = badgeQueue;
          set({ currentBadge: next, badgeQueue: rest });
        } else {
          set({ currentBadge: null });
        }
      },

      dismissCurrentBadge: () => {
        get().showNextBadge();
      },

      clearBadgeQueue: () => {
        set({ badgeQueue: [], currentBadge: null });
      },

      // ========== UI State ==========
      showResultsModal: false,
      selectedRaceId: null,

      setShowResultsModal: (show, raceId) => {
        set({
          showResultsModal: show,
          selectedRaceId: raceId || null,
        });
        if (!show) {
          get().resetReveal();
        }
      },
    }),
    {
      name: "f1-results-store",
      partialize: (state) => ({
        pinnedOpponent: state.pinnedOpponent,
        recentOpponents: state.recentOpponents,
      }),
    }
  )
);
