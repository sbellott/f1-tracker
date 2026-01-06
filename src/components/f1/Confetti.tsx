"use client";

import { useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

// F1 themed colors
const F1_COLORS = ['#E10600', '#00D2BE', '#FFFFFF', '#FFD700'];
const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze

export type ConfettiType =
  | 'prediction-submit'
  | 'badge-unlock'
  | 'perfect-score'
  | 'podium'
  | 'championship'
  | 'fireworks';

interface UseConfettiOptions {
  type?: ConfettiType;
  duration?: number;
}

/**
 * Hook to trigger confetti celebrations
 */
export function useConfetti(options: UseConfettiOptions = {}) {
  const { type = 'prediction-submit', duration = 3000 } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fire = useCallback(() => {
    // Clear any existing animation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    switch (type) {
      case 'prediction-submit':
        predictionSubmitConfetti();
        break;
      case 'badge-unlock':
        badgeUnlockConfetti();
        break;
      case 'perfect-score':
        perfectScoreConfetti(duration);
        break;
      case 'podium':
        podiumConfetti();
        break;
      case 'championship':
        championshipConfetti(duration);
        break;
      case 'fireworks':
        fireworksConfetti(duration);
        break;
      default:
        predictionSubmitConfetti();
    }
  }, [type, duration]);

  const stop = useCallback(() => {
    confetti.reset();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { fire, stop };
}

/**
 * Simple confetti burst for prediction submission
 */
function predictionSubmitConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: F1_COLORS,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

/**
 * Star-shaped confetti for badge unlock
 */
function badgeUnlockConfetti() {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: F1_COLORS,
    shapes: ['star'] as confetti.Shape[],
    scalar: 1.2,
  };

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 30,
      origin: { x: 0.5, y: 0.5 },
    });

    confetti({
      ...defaults,
      particleCount: 15,
      origin: { x: 0.3, y: 0.6 },
    });

    confetti({
      ...defaults,
      particleCount: 15,
      origin: { x: 0.7, y: 0.6 },
    });
  }

  shoot();
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
}

/**
 * Continuous celebration for perfect score
 */
function perfectScoreConfetti(duration: number) {
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, colors: F1_COLORS };

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

/**
 * Podium celebration with gold/silver/bronze colors
 */
function podiumConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.6 },
    colors: PODIUM_COLORS,
  };

  // Left cannon
  confetti({
    ...defaults,
    particleCount: count / 2,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
  });

  // Right cannon
  confetti({
    ...defaults,
    particleCount: count / 2,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
  });
}

/**
 * Championship celebration - the ultimate
 */
function championshipConfetti(duration: number) {
  const animationEnd = Date.now() + duration;
  let skew = 1;

  (function frame() {
    const timeLeft = animationEnd - Date.now();
    const ticks = Math.max(200, 500 * (timeLeft / duration));
    skew = Math.max(0.8, skew - 0.001);

    confetti({
      particleCount: 1,
      startVelocity: 0,
      ticks: ticks,
      origin: {
        x: Math.random(),
        y: (Math.random() * skew) - 0.2,
      },
      colors: ['#FFD700'],
      shapes: ['star'] as confetti.Shape[],
      gravity: randomInRange(0.4, 0.6),
      scalar: randomInRange(0.8, 1.2),
      drift: randomInRange(-0.4, 0.4),
    });

    if (timeLeft > 0) {
      requestAnimationFrame(frame);
    }
  }());

  // Also fire some side cannons
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0, y: 0.6 },
      colors: F1_COLORS,
    });
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 1, y: 0.6 },
      colors: F1_COLORS,
    });
  }, 500);
}

/**
 * Fireworks display
 */
function fireworksConfetti(duration: number) {
  const animationEnd = Date.now() + duration;
  const interval = 400;

  const intervalId = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(intervalId);
    }

    // Random origin
    const origin = {
      x: randomInRange(0.2, 0.8),
      y: randomInRange(0.2, 0.6),
    };

    // Random color scheme
    const colorScheme = Math.random() > 0.5 ? F1_COLORS : PODIUM_COLORS;

    confetti({
      particleCount: randomInRange(50, 100),
      spread: randomInRange(50, 100),
      origin,
      colors: colorScheme,
      startVelocity: 45,
      decay: 0.9,
      gravity: 1.2,
    });
  }, interval);
}

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// ============================================
// Component Versions
// ============================================

interface ConfettiTriggerProps {
  trigger: boolean;
  type?: ConfettiType;
  duration?: number;
  onComplete?: () => void;
}

/**
 * Component that triggers confetti when `trigger` becomes true
 */
export function ConfettiTrigger({ trigger, type = 'prediction-submit', duration = 3000, onComplete }: ConfettiTriggerProps) {
  const { fire } = useConfetti({ type, duration });
  const hasFired = useRef(false);

  useEffect(() => {
    if (trigger && !hasFired.current) {
      hasFired.current = true;
      fire();

      if (onComplete) {
        setTimeout(onComplete, duration);
      }
    }

    if (!trigger) {
      hasFired.current = false;
    }
  }, [trigger, fire, duration, onComplete]);

  return null;
}

interface ConfettiButtonProps {
  children: React.ReactNode;
  type?: ConfettiType;
  duration?: number;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Button that fires confetti when clicked
 */
export function ConfettiButton({
  children,
  type = 'prediction-submit',
  duration = 3000,
  onClick,
  className,
  disabled
}: ConfettiButtonProps) {
  const { fire } = useConfetti({ type, duration });

  const handleClick = () => {
    if (!disabled) {
      fire();
      onClick?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default useConfetti;
