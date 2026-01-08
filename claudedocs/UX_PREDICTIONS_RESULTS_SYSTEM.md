# F1 Tracker - Predictions Results UX System

**Version**: 1.0
**Date**: 7 janvier 2026
**Author**: UX Design Specification
**Status**: Design Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Principles](#design-principles)
3. [Color System](#color-system)
4. [Component Hierarchy](#component-hierarchy)
5. [Results Comparison View](#1-results-comparison-view)
6. [Duel System](#2-duel-system)
7. [Progressive Results Reveal](#3-progressive-results-reveal)
8. [Badge Unlock Celebration](#4-badge-unlock-celebration)
9. [Scoring Visualization](#5-scoring-visualization)
10. [State Management](#state-management)
11. [Animation Specifications](#animation-specifications)
12. [Responsive Design](#responsive-design)
13. [Accessibility](#accessibility)
14. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

This document defines the UX system for the F1 Predictions Results module. The system transforms the post-race experience into an engaging, social, and gamified interaction that encourages user retention and group competition.

### Key Objectives

- **Suspense & Engagement**: Transform result viewing from passive consumption to active experience
- **Social Competition**: Enable meaningful head-to-head comparisons between friends
- **Achievement Recognition**: Celebrate accomplishments with memorable visual feedback
- **Clarity & Transparency**: Make scoring logic understandable and fair

---

## Design Principles

### 1. Progressive Disclosure
Reveal information in digestible chunks, building anticipation and understanding.

### 2. Mobile-First Interaction
All interactions designed for thumb-zone accessibility on mobile devices.

### 3. Visual Hierarchy
Clear distinction between primary (results), secondary (points), and tertiary (stats) information.

### 4. Emotional Design
Use motion, color, and timing to create emotional responses appropriate to outcomes.

### 5. F1 Brand Alignment
Respect F1 visual language: speed, precision, technology, competition.

---

## Color System

### Match Type Colors

```typescript
export const MATCH_COLORS = {
  exact: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-600',
    glow: 'shadow-green-500/50',
    gradient: 'from-green-500 to-green-600',
    icon: 'text-green-500',
    label: 'Exact Match',
    description: 'Position parfaite'
  },
  partial: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-600',
    glow: 'shadow-amber-500/50',
    gradient: 'from-amber-500 to-amber-600',
    icon: 'text-amber-500',
    label: 'Partial Match',
    description: 'Dans le podium'
  },
  miss: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-300',
    text: 'text-slate-500',
    glow: 'shadow-none',
    gradient: 'from-slate-400 to-slate-500',
    icon: 'text-slate-400',
    label: 'Miss',
    description: 'Hors position'
  },
  bonus: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500',
    text: 'text-purple-600',
    glow: 'shadow-purple-500/50',
    gradient: 'from-purple-500 to-purple-600',
    icon: 'text-purple-500',
    label: 'Bonus',
    description: 'Points bonus'
  }
} as const;
```

### Position Badge Colors (Podium)

```typescript
export const POSITION_COLORS = {
  1: {
    bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    text: 'text-yellow-900',
    border: 'border-yellow-500',
    glow: 'shadow-yellow-400/60',
    label: '1er'
  },
  2: {
    bg: 'bg-gradient-to-br from-slate-300 to-slate-500',
    text: 'text-slate-900',
    border: 'border-slate-400',
    glow: 'shadow-slate-400/40',
    label: '2e'
  },
  3: {
    bg: 'bg-gradient-to-br from-amber-600 to-amber-800',
    text: 'text-amber-100',
    border: 'border-amber-700',
    glow: 'shadow-amber-600/40',
    label: '3e'
  }
} as const;
```

### Duel Result Colors

```typescript
export const DUEL_COLORS = {
  win: {
    bg: 'bg-green-500',
    text: 'text-white',
    accent: 'text-green-400',
    label: 'Victoire'
  },
  loss: {
    bg: 'bg-red-500',
    text: 'text-white',
    accent: 'text-red-400',
    label: 'Defaite'
  },
  tie: {
    bg: 'bg-slate-500',
    text: 'text-white',
    accent: 'text-slate-400',
    label: 'Egalite'
  }
} as const;
```

---

## Component Hierarchy

```
predictions/results/
├── ResultsComparisonView/
│   ├── ResultsComparisonView.tsx       # Main container
│   ├── ComparisonHeader.tsx            # Race info + summary stats
│   ├── PositionComparisonRow.tsx       # Single position comparison
│   ├── SpecialPredictionsRow.tsx       # Pole + Fastest Lap
│   ├── MatchIndicator.tsx              # Visual match type indicator
│   └── PositionBadge.tsx               # Podium position styling
│
├── DuelSystem/
│   ├── DuelView.tsx                    # Main duel container
│   ├── DuelHeader.tsx                  # Opponent selector + score
│   ├── OpponentSelector.tsx            # Dropdown/sheet for opponent
│   ├── DuelComparisonGrid.tsx          # Side-by-side predictions
│   ├── DuelScoreCard.tsx               # Win/loss with differential
│   ├── DuelHistoryBadge.tsx            # H2H record display
│   └── QuickSwitchBar.tsx              # Pinned opponent shortcuts
│
├── ProgressiveReveal/
│   ├── ProgressiveRevealView.tsx       # Main reveal orchestrator
│   ├── RevealPositionCard.tsx          # Animated position reveal
│   ├── RunningScoreCounter.tsx         # Animated points counter
│   ├── RevealControls.tsx              # Skip/pause controls
│   ├── SuspenseTimer.tsx               # Countdown between reveals
│   └── RevealCompleteSummary.tsx       # Final summary after reveal
│
├── BadgeCelebration/
│   ├── BadgeUnlockOverlay.tsx          # Full-screen celebration
│   ├── BadgeIcon.tsx                   # Badge with glow effect
│   ├── ConfettiAnimation.tsx           # Particle system
│   ├── AchievementDescription.tsx      # Badge details
│   └── ShareBadgeButton.tsx            # Social sharing
│
└── ScoringVisualization/
    ├── ScoringBreakdown.tsx            # Main scoring display
    ├── AnimatedPointCounter.tsx        # Counting animation
    ├── PointsCategoryBar.tsx           # Category progress bars
    ├── BonusIndicator.tsx              # Special bonus callouts
    ├── ScoreMedal.tsx                  # Medal/rank indicator
    └── ScoreComparisonChart.tsx        # Visual comparison
```

---

## 1. Results Comparison View

### Overview
Side-by-side comparison of user's predicted top 10 vs actual race results with clear visual indicators for match quality.

### Layout Structure

```
+--------------------------------------------------+
|  [Trophy] Prediction vs Reality                  |
|  Grand Prix d'Australie 2026                     |
|  [3 exact] [1 partiel] [Pole OK] [FL OK]        |
+--------------------------------------------------+
|                                                  |
|  VOTRE PREDICTION    DELTA    RESULTAT REEL     |
|  ------------------------------------------------|
|  [1] P1 VER [===]    [OK]     [1] P1 VER [===]  |
|  [2] P2 NOR [---]    [-1]     [2] P2 LEC [---]  |
|  [3] P3 LEC [---]    [+1]     [3] P3 NOR [---]  |
|  ...                                             |
+--------------------------------------------------+
|  PREDICTIONS SPECIALES                           |
|  [Pole] VER [OK]  |  [FL] HAM [X]               |
+--------------------------------------------------+
```

### Component: `PositionComparisonRow`

```typescript
interface PositionComparisonRowProps {
  position: number;                    // 1-10
  predictedDriverId: string;
  actualDriverId: string;
  predictedDriver: Driver;
  actualDriver: Driver;
  matchType: 'exact' | 'partial' | 'miss';
  pointsEarned: number;
  isRevealing?: boolean;               // For progressive reveal
  revealDelay?: number;
}
```

### Visual States

| State | Visual Treatment |
|-------|-----------------|
| **Exact Match** | Green background glow, checkmark icon, full opacity |
| **Partial Match** | Amber background glow, swap arrows icon, 90% opacity |
| **Miss** | Muted background, X icon, 70% opacity |
| **Unrevealed** | Skeleton/blur, pulsing animation |

### Interaction Patterns

1. **Tap on row**: Expand to show detailed breakdown (points calculation)
2. **Long press**: Quick action menu (share, compare with friend)
3. **Swipe left**: Reveal duel comparison option

### Animation Spec

```typescript
const rowAnimation = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
    delay: (index: number) => index * 0.08
  }
};

const matchGlow = {
  exact: {
    boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0)', '0 0 20px 4px rgba(34, 197, 94, 0.4)', '0 0 0 0 rgba(34, 197, 94, 0)'],
    transition: { duration: 0.8, repeat: 2 }
  }
};
```

---

## 2. Duel System

### Overview
Head-to-head comparison system allowing users to "pin" an opponent for quick comparison of predictions and results.

### User Stories

1. **As a user**, I want to pin my main rival for quick access
2. **As a user**, I want to see side-by-side predictions comparison
3. **As a user**, I want to track my head-to-head record over time
4. **As a user**, I want to quickly switch between opponents

### Layout Structure

```
+--------------------------------------------------+
|  DUEL: Vous vs Antoine                    [Swap] |
|  [Avatar] 127 pts  |  [Trophy]  |  115 pts [Ava] |
|  Record: 5W - 2L - 1T                            |
+--------------------------------------------------+
|                                                  |
|  POS    VOUS           ANTOINE        RESULTAT  |
|  ------------------------------------------------|
|  P1     VER [10]       VER [10]       VER       |
|  P2     NOR [8]        LEC [0]        LEC       |
|  P3     LEC [6]        NOR [3]        NOR       |
|  ...                                             |
+--------------------------------------------------+
|  [<<Prev] [Pin Antoine] [Share] [Next>>]        |
+--------------------------------------------------+
```

### Component: `OpponentSelector`

```typescript
interface OpponentSelectorProps {
  groupId: string;
  currentOpponentId: string | null;
  pinnedOpponentId: string | null;
  onSelectOpponent: (userId: string) => void;
  onPinOpponent: (userId: string) => void;
  onUnpin: () => void;
}

// Opponent item in selector
interface OpponentOption {
  userId: string;
  name: string;
  avatar: string;
  totalPoints: number;
  lastRacePoints: number;
  h2hRecord: {
    wins: number;
    losses: number;
    ties: number;
  };
  isPinned: boolean;
  isOnline?: boolean;
}
```

### Visual Design: Duel Header

```typescript
const DuelHeader = ({ user, opponent, userScore, opponentScore, h2hRecord }) => (
  <div className="relative">
    {/* Background gradient based on who's winning */}
    <div className={cn(
      "absolute inset-0 opacity-20",
      userScore > opponentScore ? "bg-gradient-to-r from-green-500 to-transparent" :
      userScore < opponentScore ? "bg-gradient-to-l from-red-500 to-transparent" :
      "bg-gradient-to-r from-slate-500 via-transparent to-slate-500"
    )} />

    {/* Score cards */}
    <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 p-4">
      <UserScoreCard user={user} score={userScore} isWinning={userScore > opponentScore} />
      <DuelResultBadge
        result={userScore > opponentScore ? 'win' : userScore < opponentScore ? 'loss' : 'tie'}
        differential={Math.abs(userScore - opponentScore)}
      />
      <UserScoreCard user={opponent} score={opponentScore} isWinning={opponentScore > userScore} />
    </div>

    {/* H2H Record */}
    <H2HRecordBar record={h2hRecord} />
  </div>
);
```

### Quick Switch Bar (Pinned Opponents)

```
+--------------------------------------------------+
| DUELS RAPIDES                                    |
| [Pin:Antoine] [Recent:Marie] [Recent:Thomas]     |
+--------------------------------------------------+
```

```typescript
interface QuickSwitchBarProps {
  pinnedOpponent: OpponentOption | null;
  recentOpponents: OpponentOption[];
  maxRecent?: number;  // Default: 3
  onSelect: (userId: string) => void;
}
```

### State Management for Duels

```typescript
interface DuelState {
  // Current duel
  currentOpponentId: string | null;
  pinnedOpponentId: string | null;
  recentOpponents: string[];  // Last 5 opponent IDs

  // Comparison data
  userPrediction: Prediction | null;
  opponentPrediction: Prediction | null;
  actualResults: RaceResult | null;

  // H2H stats (cached)
  h2hRecords: Map<string, H2HRecord>;
}

interface H2HRecord {
  opponentId: string;
  wins: number;
  losses: number;
  ties: number;
  totalPointsDiff: number;
  lastResult: 'win' | 'loss' | 'tie';
  streak: number;  // Positive = win streak, negative = loss streak
}
```

---

## 3. Progressive Results Reveal

### Overview
Suspenseful revelation of results position by position, with running score counter and dramatic timing.

### User Journey

1. **Entry Point**: User opens results for completed race
2. **Choice**: "Voir les resultats" vs "Revelation progressive"
3. **Reveal Loop**: Each position revealed with 2-3s pause
4. **Score Update**: Points animate up after each reveal
5. **Completion**: Full summary with share option

### Layout Structure (During Reveal)

```
+--------------------------------------------------+
|  [X] REVELATION EN COURS...              [Skip]  |
+--------------------------------------------------+
|                                                  |
|           VOTRE SCORE                            |
|           [  127  ] pts                          |
|           +10 points!                            |
|                                                  |
+--------------------------------------------------+
|                                                  |
|        POSITION 3 REVELEE                        |
|                                                  |
|   +----------------------------------------+    |
|   |  [3]  CHARLES LECLERC                  |    |
|   |       Ferrari                          |    |
|   |                                        |    |
|   |  Votre prediction: LECLERC [CHECK]     |    |
|   |  +6 points - Position exacte!          |    |
|   +----------------------------------------+    |
|                                                  |
+--------------------------------------------------+
|  [====>        ] 3/10 positions                  |
+--------------------------------------------------+
```

### Component: `RevealPositionCard`

```typescript
interface RevealPositionCardProps {
  position: number;
  actualDriver: Driver;
  userPrediction: string;           // Driver ID
  predictedDriver: Driver;
  matchType: 'exact' | 'partial' | 'miss';
  pointsEarned: number;
  isRevealing: boolean;
  revealPhase: 'hidden' | 'position' | 'driver' | 'result' | 'points';
}
```

### Reveal Phases & Timing

```typescript
const REVEAL_PHASES = {
  hidden: {
    duration: 0,
    visual: 'Card with skeleton/blur'
  },
  position: {
    duration: 500,
    visual: 'Position number appears with zoom effect'
  },
  driver: {
    duration: 800,
    visual: 'Driver name/photo fades in from blur'
  },
  result: {
    duration: 600,
    visual: 'Match indicator slides in (green check, amber swap, red X)'
  },
  points: {
    duration: 400,
    visual: 'Points earned animate up with particle effect'
  }
};

const PAUSE_BETWEEN_POSITIONS = 2000; // ms
const DRAMATIC_PAUSE_PODIUM = 3500;   // Extra pause for P1-P3
```

### Animation Spec: Running Score Counter

```typescript
const ScoreCounterAnimation = {
  // Number counting
  countUp: {
    from: (prevScore: number) => prevScore,
    to: (newScore: number) => newScore,
    duration: 800,
    easing: 'easeOut'
  },

  // Score card pulse on update
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 }
  },

  // Points earned popup
  pointsPopup: {
    initial: { opacity: 0, y: 10, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20 },
    transition: { type: 'spring', stiffness: 500 }
  }
};
```

### Component: `RevealControls`

```typescript
interface RevealControlsProps {
  isPlaying: boolean;
  currentPosition: number;
  totalPositions: number;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onSkipToEnd: () => void;
  onRestart: () => void;
}
```

### Skip Behavior

| Action | Result |
|--------|--------|
| **Skip Position** | Jump to next position, show current instantly |
| **Skip to End** | Reveal all remaining, animate final score only |
| **Pause** | Freeze current state, can resume |

---

## 4. Badge Unlock Celebration

### Overview
Full-screen celebration overlay when user earns a new badge, featuring confetti, glow effects, and social sharing.

### Badge Types (from roadmap)

| Badge | Criteria | Icon | Rarity |
|-------|----------|------|--------|
| Oracle | 5+ exact positions | Crystal Ball | Rare |
| Sniper | Perfect pole prediction 3x | Target | Epic |
| Regulier | 10 consecutive races | Calendar | Common |
| Podium Master | Perfect podium 5x | Trophy | Epic |
| First Blood | First prediction ever | Flag | Common |
| Streak King | 5 race win streak | Fire | Legendary |
| Photo Finish | Win by 1 point | Camera | Rare |
| Comeback Kid | Win after 3+ losses | Phoenix | Epic |

### Layout Structure

```
+--------------------------------------------------+
|                                                  |
|        [Background blur + dark overlay]          |
|                                                  |
|              * * * CONFETTI * * *                |
|                                                  |
|          +---------------------------+           |
|          |                           |           |
|          |     [BADGE ICON]          |           |
|          |     (with glow pulse)     |           |
|          |                           |           |
|          +---------------------------+           |
|                                                  |
|              NOUVEAU BADGE!                      |
|                                                  |
|              ** ORACLE **                        |
|                                                  |
|    "Vous avez predit 5 positions exactes"        |
|              dans une seule course               |
|                                                  |
|          [Partager]  [Fermer]                    |
|                                                  |
+--------------------------------------------------+
```

### Component: `BadgeUnlockOverlay`

```typescript
interface BadgeUnlockOverlayProps {
  badge: Badge;
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  raceContext?: {
    raceName: string;
    season: number;
  };
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;           // Icon name or URL
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  criteria: string;       // Human-readable unlock criteria
}
```

### Badge Icon Styling by Rarity

```typescript
const BADGE_RARITY_STYLES = {
  common: {
    ring: 'ring-slate-400',
    glow: 'shadow-slate-400/30',
    bg: 'bg-gradient-to-br from-slate-100 to-slate-300',
    label: 'Commun',
    labelColor: 'text-slate-600'
  },
  rare: {
    ring: 'ring-blue-500',
    glow: 'shadow-blue-500/40',
    bg: 'bg-gradient-to-br from-blue-100 to-blue-400',
    label: 'Rare',
    labelColor: 'text-blue-600'
  },
  epic: {
    ring: 'ring-purple-500',
    glow: 'shadow-purple-500/50',
    bg: 'bg-gradient-to-br from-purple-200 to-purple-500',
    label: 'Epique',
    labelColor: 'text-purple-600'
  },
  legendary: {
    ring: 'ring-amber-500',
    glow: 'shadow-amber-500/60',
    bg: 'bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-500',
    label: 'Legendaire',
    labelColor: 'text-amber-600',
    shimmer: true  // Animated shimmer effect
  }
};
```

### Animation Spec: Confetti

```typescript
const ConfettiConfig = {
  particleCount: 100,
  spread: 70,
  origin: { x: 0.5, y: 0.3 },
  colors: ['#ff0000', '#ffffff', '#ffcc00', '#00ff00'],  // F1 colors
  gravity: 0.8,
  drift: 0,
  ticks: 200,
  decay: 0.94,
  scalar: 1.2,
  shapes: ['square', 'circle'],

  // Burst pattern for dramatic effect
  bursts: [
    { delay: 0, angle: 90, spread: 50 },
    { delay: 200, angle: 60, spread: 40 },
    { delay: 200, angle: 120, spread: 40 }
  ]
};
```

### Animation Spec: Badge Glow

```typescript
const BadgeGlowAnimation = {
  initial: {
    scale: 0,
    rotate: -180,
    opacity: 0
  },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
      delay: 0.3
    }
  },

  // Continuous glow pulse
  glowPulse: {
    boxShadow: [
      '0 0 20px 5px rgba(var(--badge-glow), 0.3)',
      '0 0 40px 15px rgba(var(--badge-glow), 0.5)',
      '0 0 20px 5px rgba(var(--badge-glow), 0.3)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },

  // Legendary shimmer
  shimmer: {
    background: [
      'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
      'linear-gradient(45deg, transparent 70%, rgba(255,255,255,0.5) 90%, transparent 100%)'
    ],
    backgroundPosition: ['-200% 0', '200% 0'],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};
```

### Share Functionality

```typescript
interface ShareBadgeData {
  badge: Badge;
  userId: string;
  userName: string;
  raceName?: string;
  imageUrl?: string;  // Generated share image
}

const ShareOptions = {
  native: {
    title: 'Nouveau badge F1 Tracker!',
    text: (badge: Badge) => `J'ai debloque le badge "${badge.name}" sur F1 Tracker!`,
    url: (userId: string, badgeId: string) =>
      `https://f1tracker.app/badges/${userId}/${badgeId}`
  },
  instagram: {
    type: 'story',
    sticker: true,
    backgroundImage: true
  },
  twitter: {
    hashtags: ['F1Tracker', 'F1', 'Predictions']
  }
};
```

---

## 5. Scoring Visualization

### Overview
Animated and detailed breakdown of points earned, with progress indicators and bonus callouts.

### Scoring System Reference

```typescript
const SCORING_SYSTEM = {
  positions: {
    1: { exact: 25, label: 'P1' },
    2: { exact: 18, label: 'P2' },
    3: { exact: 15, label: 'P3' },
    4: { exact: 12, label: 'P4' },
    5: { exact: 10, label: 'P5' },
    6: { exact: 8, label: 'P6' },
    7: { exact: 6, label: 'P7' },
    8: { exact: 4, label: 'P8' },
    9: { exact: 2, label: 'P9' },
    10: { exact: 1, label: 'P10' }
  },

  partial: {
    // Partial podium (right driver, wrong podium position)
    1: 5,  // Predicted P1, got podium
    2: 4,  // Predicted P2, got podium
    3: 3   // Predicted P3, got podium
  },

  bonuses: {
    pole: { points: 5, label: 'Pole Position' },
    fastestLap: { points: 5, label: 'Meilleur Tour' },
    podiumPerfect: { points: 10, label: 'Podium Parfait' },
    perfectRace: { points: 50, label: 'Course Parfaite' }
  }
};
```

### Layout Structure

```
+--------------------------------------------------+
|  DETAIL DES POINTS                               |
+--------------------------------------------------+
|                                                  |
|  [===== 127 POINTS =====]                       |
|                                                  |
+--------------------------------------------------+
|  POSITIONS (92 pts)                              |
|  [=============================      ] 92/101    |
|                                                  |
|  P1 VER   [====] 25 pts   Exact                 |
|  P2 NOR   [==  ]  8 pts   Partiel (+2)          |
|  P3 LEC   [====] 15 pts   Exact                 |
|  P4 SAI   [    ]  0 pts   Hors position         |
|  ...                                             |
+--------------------------------------------------+
|  BONUS (25 pts)                                  |
|  [=================         ] 25/65             |
|                                                  |
|  [Star] Pole Position     +5 pts                |
|  [Zap]  Meilleur Tour     +5 pts                |
|  [Trophy] Podium Parfait  +10 pts               |
+--------------------------------------------------+
```

### Component: `AnimatedPointCounter`

```typescript
interface AnimatedPointCounterProps {
  value: number;
  previousValue?: number;
  duration?: number;        // Animation duration in ms
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showChange?: boolean;     // Show +/- indicator
  onComplete?: () => void;
}

const PointCounterSizes = {
  sm: 'text-2xl font-bold',
  md: 'text-4xl font-bold',
  lg: 'text-6xl font-black',
  xl: 'text-8xl font-black'
};
```

### Animation Spec: Point Counter

```typescript
const PointCounterAnimation = {
  // Counting up animation
  count: {
    duration: 1000,
    easing: [0.25, 0.1, 0.25, 1],  // Ease out cubic

    // Formatters by value range
    formatter: (value: number) => {
      if (value >= 1000) return value.toLocaleString();
      return Math.round(value).toString();
    }
  },

  // Entrance animation
  entrance: {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  },

  // Pulse on value change
  pulse: {
    scale: [1, 1.1, 1],
    color: ['var(--foreground)', 'var(--primary)', 'var(--foreground)'],
    transition: { duration: 0.3 }
  },

  // Change indicator (+5 pts)
  changeIndicator: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3 }
  }
};
```

### Component: `PointsCategoryBar`

```typescript
interface PointsCategoryBarProps {
  category: 'positions' | 'partial' | 'bonus';
  earned: number;
  maximum: number;
  details: PointDetail[];
  isExpanded?: boolean;
  onToggle?: () => void;
}

interface PointDetail {
  label: string;           // "P1 VER", "Pole Position"
  points: number;
  maxPoints: number;
  type: 'exact' | 'partial' | 'bonus' | 'miss';
  icon?: ReactNode;
}
```

### Visual Progress Bar Variants

```typescript
const CategoryBarVariants = {
  positions: {
    bg: 'bg-slate-200 dark:bg-slate-800',
    fill: 'bg-gradient-to-r from-green-400 to-green-600',
    icon: Target,
    label: 'Positions'
  },
  partial: {
    bg: 'bg-slate-200 dark:bg-slate-800',
    fill: 'bg-gradient-to-r from-amber-400 to-amber-600',
    icon: TrendingUp,
    label: 'Partiels'
  },
  bonus: {
    bg: 'bg-slate-200 dark:bg-slate-800',
    fill: 'bg-gradient-to-r from-purple-400 to-purple-600',
    icon: Sparkles,
    label: 'Bonus'
  }
};
```

### Medal Indicator (Score Ranking)

```typescript
interface ScoreMedalProps {
  score: number;
  thresholds: {
    gold: number;      // e.g., 150+
    silver: number;    // e.g., 100+
    bronze: number;    // e.g., 75+
  };
  showLabel?: boolean;
}

const MEDAL_STYLES = {
  gold: {
    icon: Medal,
    bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    ring: 'ring-2 ring-yellow-500',
    label: 'Performance Excellente'
  },
  silver: {
    icon: Medal,
    bg: 'bg-gradient-to-br from-slate-300 to-slate-500',
    ring: 'ring-2 ring-slate-400',
    label: 'Bonne Performance'
  },
  bronze: {
    icon: Medal,
    bg: 'bg-gradient-to-br from-amber-600 to-amber-800',
    ring: 'ring-2 ring-amber-600',
    label: 'Performance Correcte'
  },
  none: {
    icon: Circle,
    bg: 'bg-slate-200',
    ring: 'ring-1 ring-slate-300',
    label: 'Continue!'
  }
};
```

---

## State Management

### Zustand Stores

```typescript
// stores/predictions-results.ts
interface PredictionsResultsStore {
  // Results viewing
  selectedRaceId: string | null;
  viewMode: 'comparison' | 'reveal' | 'duel';

  // Reveal state
  revealState: {
    isPlaying: boolean;
    currentPosition: number;
    revealedPositions: number[];
    runningScore: number;
    phase: 'hidden' | 'position' | 'driver' | 'result' | 'points';
  };

  // Duel state
  duelState: {
    pinnedOpponentId: string | null;
    currentOpponentId: string | null;
    recentOpponents: string[];
    h2hRecords: Map<string, H2HRecord>;
  };

  // Badge celebration
  badgeCelebration: {
    isOpen: boolean;
    badge: Badge | null;
    queue: Badge[];  // For multiple unlocks
  };

  // Actions
  setViewMode: (mode: 'comparison' | 'reveal' | 'duel') => void;
  startReveal: () => void;
  pauseReveal: () => void;
  resumeReveal: () => void;
  skipToPosition: (position: number) => void;
  skipToEnd: () => void;
  setCurrentOpponent: (userId: string) => void;
  pinOpponent: (userId: string) => void;
  unpinOpponent: () => void;
  showBadgeCelebration: (badge: Badge) => void;
  dismissBadgeCelebration: () => void;
  processNextBadge: () => void;
}
```

### React Query Keys

```typescript
const QUERY_KEYS = {
  raceResults: (raceId: string) => ['race', raceId, 'results'],
  userPrediction: (raceId: string, userId: string) =>
    ['prediction', raceId, userId],
  opponentPrediction: (raceId: string, opponentId: string) =>
    ['prediction', raceId, opponentId],
  h2hRecord: (userId: string, opponentId: string) =>
    ['h2h', userId, opponentId],
  userBadges: (userId: string) => ['badges', userId],
  newBadges: (userId: string, raceId: string) =>
    ['badges', userId, 'new', raceId],
  groupLeaderboard: (groupId: string, season: number) =>
    ['leaderboard', groupId, season],
};
```

### Hooks

```typescript
// hooks/use-results-comparison.ts
function useResultsComparison(raceId: string, userId: string) {
  const prediction = useQuery(QUERY_KEYS.userPrediction(raceId, userId));
  const results = useQuery(QUERY_KEYS.raceResults(raceId));

  return useMemo(() => {
    if (!prediction.data || !results.data) return null;
    return calculateComparison(prediction.data, results.data);
  }, [prediction.data, results.data]);
}

// hooks/use-duel.ts
function useDuel(raceId: string, userId: string, opponentId: string) {
  const userPrediction = useQuery(QUERY_KEYS.userPrediction(raceId, userId));
  const opponentPrediction = useQuery(QUERY_KEYS.opponentPrediction(raceId, opponentId));
  const results = useQuery(QUERY_KEYS.raceResults(raceId));
  const h2h = useQuery(QUERY_KEYS.h2hRecord(userId, opponentId));

  return {
    comparison: useMemo(() => {
      if (!userPrediction.data || !opponentPrediction.data || !results.data) return null;
      return calculateDuelComparison(userPrediction.data, opponentPrediction.data, results.data);
    }, [userPrediction.data, opponentPrediction.data, results.data]),
    h2hRecord: h2h.data,
    isLoading: userPrediction.isLoading || opponentPrediction.isLoading || results.isLoading
  };
}

// hooks/use-progressive-reveal.ts
function useProgressiveReveal(raceId: string, userId: string) {
  const store = usePredictionsResultsStore();
  const comparison = useResultsComparison(raceId, userId);

  const revealNext = useCallback(() => {
    if (!comparison) return;

    const next = store.revealState.currentPosition + 1;
    if (next <= 10) {
      // Phase through: position -> driver -> result -> points
      store.advancePhase();
    }
  }, [comparison, store]);

  useEffect(() => {
    if (!store.revealState.isPlaying) return;

    const interval = getIntervalForPosition(store.revealState.currentPosition);
    const timer = setTimeout(revealNext, interval);

    return () => clearTimeout(timer);
  }, [store.revealState.isPlaying, store.revealState.currentPosition, revealNext]);

  return {
    ...store.revealState,
    comparison,
    start: store.startReveal,
    pause: store.pauseReveal,
    resume: store.resumeReveal,
    skip: store.skipToEnd
  };
}
```

---

## Animation Specifications

### Framer Motion Variants Library

```typescript
// lib/animations/variants.ts

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const scaleIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

export const slideFromLeft = {
  initial: { x: -50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 50, opacity: 0 }
};

export const slideFromRight = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 }
};

export const revealCard = {
  hidden: {
    rotateY: 180,
    scale: 0.8,
    opacity: 0
  },
  visible: {
    rotateY: 0,
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  }
};

export const glowPulse = (color: string) => ({
  animate: {
    boxShadow: [
      `0 0 10px 0 ${color}`,
      `0 0 30px 10px ${color}`,
      `0 0 10px 0 ${color}`
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
});

export const numberCount = (from: number, to: number) => ({
  animate: {
    transition: {
      duration: 1,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
});
```

### Animation Timing Guidelines

| Context | Duration | Easing |
|---------|----------|--------|
| Micro-interactions | 150-200ms | ease-out |
| State changes | 200-300ms | ease-in-out |
| Page transitions | 300-400ms | ease-in-out |
| Reveals/Celebrations | 500-800ms | spring |
| Number counting | 800-1200ms | ease-out |

---

## Responsive Design

### Breakpoints

```typescript
const BREAKPOINTS = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Large desktop
};
```

### Mobile-First Component Adaptations

#### Results Comparison View

```typescript
// Mobile (<640px)
const MobileComparisonLayout = () => (
  <div className="space-y-2">
    {/* Stack prediction and actual vertically */}
    {positions.map((pos) => (
      <div className="space-y-1 p-3 rounded-lg border">
        <div className="flex justify-between">
          <span className="font-bold">P{pos.position}</span>
          <MatchIndicator type={pos.matchType} size="sm" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Predit:</span>
            <DriverBadge driver={pos.predicted} size="sm" />
          </div>
          <div>
            <span className="text-muted-foreground">Reel:</span>
            <DriverBadge driver={pos.actual} size="sm" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Tablet+ (>=768px)
const DesktopComparisonLayout = () => (
  <div className="space-y-1">
    <div className="grid grid-cols-[1fr,60px,1fr] font-medium text-sm">
      <span>Votre prediction</span>
      <span className="text-center">Delta</span>
      <span>Resultat reel</span>
    </div>
    {positions.map((pos) => (
      <div className="grid grid-cols-[1fr,60px,1fr] items-center py-2 border-b">
        <DriverCell position={pos.position} driver={pos.predicted} />
        <DiffIndicator diff={pos.diff} matchType={pos.matchType} />
        <DriverCell position={pos.position} driver={pos.actual} />
      </div>
    ))}
  </div>
);
```

#### Duel View

```typescript
// Mobile: Use bottom sheet for opponent selection
const MobileDuelView = () => (
  <>
    <DuelHeaderCompact user={user} opponent={opponent} />

    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          Changer adversaire
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <OpponentList onSelect={setOpponent} />
      </DrawerContent>
    </Drawer>

    <DuelComparisonStack />  {/* Stacked layout */}
  </>
);

// Tablet+: Use dropdown for opponent selection
const DesktopDuelView = () => (
  <>
    <div className="flex items-center justify-between">
      <DuelHeader user={user} opponent={opponent} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <OpponentList onSelect={setOpponent} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <DuelComparisonGrid />  {/* Side-by-side layout */}
  </>
);
```

#### Progressive Reveal

```typescript
// Mobile: Full-screen reveal experience
const MobileRevealView = () => (
  <div className="fixed inset-0 bg-background z-50 flex flex-col">
    <header className="p-4 border-b flex justify-between">
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X className="h-5 w-5" />
      </Button>
      <Button variant="outline" size="sm" onClick={skipToEnd}>
        Passer
      </Button>
    </header>

    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <RunningScoreCounter value={score} size="xl" />
      <RevealPositionCard position={currentPosition} />
    </main>

    <footer className="p-4 border-t">
      <Progress value={(currentPosition / 10) * 100} />
    </footer>
  </div>
);

// Tablet+: Modal reveal experience
const DesktopRevealView = () => (
  <Dialog>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Revelation des resultats</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col items-center">
          <RunningScoreCounter value={score} size="lg" />
          <ScoreBreakdownMini />
        </div>
        <RevealPositionCard position={currentPosition} />
      </div>

      <RevealControls />
    </DialogContent>
  </Dialog>
);
```

### Touch Targets

- Minimum touch target: 44x44px
- Recommended touch target: 48x48px
- Spacing between targets: 8px minimum

### Gesture Support

| Gesture | Action |
|---------|--------|
| Swipe left on row | Quick duel compare |
| Swipe right on row | Share prediction |
| Long press on badge | View badge details |
| Pinch | Zoom score chart |

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast

- Text on backgrounds: minimum 4.5:1 ratio
- Large text (>18px bold): minimum 3:1 ratio
- Interactive elements: minimum 3:1 ratio against adjacent colors

```typescript
// Accessible color variants
const ACCESSIBLE_MATCH_COLORS = {
  exact: {
    bg: 'bg-green-100 dark:bg-green-900/50',
    text: 'text-green-800 dark:text-green-200',  // 7:1+ contrast
    border: 'border-green-600 dark:border-green-400'
  },
  partial: {
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    text: 'text-amber-800 dark:text-amber-200',
    border: 'border-amber-600 dark:border-amber-400'
  },
  miss: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-400 dark:border-slate-600'
  }
};
```

#### Screen Reader Support

```typescript
// Accessible match indicator
const MatchIndicator = ({ type, points }: { type: MatchType; points: number }) => (
  <div
    role="status"
    aria-label={getMatchAriaLabel(type, points)}
    className={cn(MATCH_COLORS[type].bg, MATCH_COLORS[type].border)}
  >
    <span aria-hidden="true">
      {type === 'exact' && <Check />}
      {type === 'partial' && <TrendingUp />}
      {type === 'miss' && <X />}
    </span>
    <span className="sr-only">
      {type === 'exact' && `Position exacte, ${points} points`}
      {type === 'partial' && `Position partielle, ${points} points`}
      {type === 'miss' && 'Position manquee, 0 points'}
    </span>
  </div>
);

// Accessible score counter
const ScoreCounter = ({ value }: { value: number }) => (
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <span className="sr-only">Score actuel:</span>
    <span aria-hidden="true">{value}</span>
    <span className="sr-only">{value} points</span>
  </div>
);
```

#### Keyboard Navigation

```typescript
// Keyboard shortcuts for reveal
const RevealKeyboardShortcuts = {
  Space: 'Toggle pause/play',
  ArrowRight: 'Skip to next position',
  ArrowLeft: 'Go back one position',
  Enter: 'Confirm / Continue',
  Escape: 'Skip to end / Close',
  's': 'Share current result'
};

// Focus management
const useFocusManagement = () => {
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus first interactive element when modal opens
    firstFocusableRef.current?.focus();
  }, []);

  return { firstFocusableRef };
};
```

#### Reduced Motion

```typescript
// Respect user's motion preferences
const useReducedMotion = () => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return {
    transition: prefersReducedMotion
      ? { duration: 0 }
      : { type: 'spring', stiffness: 300 },
    animate: prefersReducedMotion
      ? { opacity: 1 }
      : { opacity: 1, y: 0 }
  };
};

// Apply to components
const AnimatedCard = ({ children }) => {
  const { transition, animate } = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={animate}
      transition={transition}
    >
      {children}
    </motion.div>
  );
};
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Color system tokens
- [ ] Match type components
- [ ] Position badge components
- [ ] Basic comparison layout

### Phase 2: Results Comparison (Week 1-2)
- [ ] PositionComparisonRow
- [ ] ComparisonHeader
- [ ] SpecialPredictionsRow
- [ ] Mobile/Desktop layouts
- [ ] Integration with existing PredictionVsReality

### Phase 3: Scoring Visualization (Week 2)
- [ ] AnimatedPointCounter
- [ ] PointsCategoryBar
- [ ] BonusIndicator
- [ ] ScoreMedal
- [ ] Integration with PointsBreakdown

### Phase 4: Duel System (Week 2-3)
- [ ] OpponentSelector
- [ ] DuelHeader
- [ ] DuelComparisonGrid
- [ ] QuickSwitchBar
- [ ] H2H record tracking
- [ ] State management

### Phase 5: Progressive Reveal (Week 3-4)
- [ ] RevealPositionCard
- [ ] RunningScoreCounter
- [ ] RevealControls
- [ ] Reveal orchestration logic
- [ ] Skip/pause functionality

### Phase 6: Badge Celebration (Week 4)
- [ ] BadgeUnlockOverlay
- [ ] ConfettiAnimation
- [ ] Badge queue management
- [ ] Share functionality
- [ ] Integration with badge service

### Phase 7: Polish & Testing (Week 5)
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] User testing
- [ ] Documentation

---

## Technical Dependencies

### Required Packages

```json
{
  "dependencies": {
    "framer-motion": "^11.x",
    "canvas-confetti": "^1.9.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "@radix-ui/react-progress": "^1.x"
  }
}
```

### File Structure

```
src/
├── components/
│   └── predictions/
│       ├── results/
│       │   ├── ResultsComparisonView.tsx
│       │   ├── PositionComparisonRow.tsx
│       │   ├── MatchIndicator.tsx
│       │   └── ...
│       ├── duel/
│       │   ├── DuelView.tsx
│       │   ├── OpponentSelector.tsx
│       │   └── ...
│       ├── reveal/
│       │   ├── ProgressiveRevealView.tsx
│       │   ├── RevealPositionCard.tsx
│       │   └── ...
│       ├── celebration/
│       │   ├── BadgeUnlockOverlay.tsx
│       │   ├── ConfettiAnimation.tsx
│       │   └── ...
│       └── scoring/
│           ├── ScoringBreakdown.tsx
│           ├── AnimatedPointCounter.tsx
│           └── ...
├── lib/
│   ├── animations/
│   │   └── variants.ts
│   └── constants/
│       └── scoring.ts
└── stores/
    └── predictions-results.ts
```

---

## Design Tokens Summary

```typescript
// tokens/predictions-results.ts
export const TOKENS = {
  // Spacing
  spacing: {
    card: 'p-4 md:p-6',
    row: 'py-2 px-3 md:py-3 md:px-4',
    gap: 'gap-2 md:gap-4'
  },

  // Typography
  typography: {
    score: 'text-4xl md:text-6xl font-black',
    position: 'text-sm font-bold',
    driver: 'text-base font-medium',
    label: 'text-xs text-muted-foreground'
  },

  // Animations
  durations: {
    micro: 150,
    short: 200,
    medium: 300,
    long: 500,
    reveal: 800
  },

  // Timing
  timing: {
    revealPause: 2000,
    podiumPause: 3500,
    countDuration: 1000
  }
};
```

---

**Document Version**: 1.0
**Last Updated**: 7 janvier 2026
**Next Review**: After Phase 2 completion
