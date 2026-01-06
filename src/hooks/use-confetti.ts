"use client";

import { useCallback, useRef } from "react";
import confetti from "canvas-confetti";

// F1 team colors for themed confetti
const F1_COLORS = {
  ferrari: ["#DC0000", "#FFF500"],
  redbull: ["#0600EF", "#CC1E4A", "#FFB800"],
  mercedes: ["#00D2BE", "#000000"],
  mclaren: ["#FF8700", "#47C7FC"],
  astonmartin: ["#006F62", "#00352F"],
  alpine: ["#0090FF", "#FF4545"],
  williams: ["#005AFF", "#00A0DE"],
  haas: ["#B6BABD", "#E10600"],
  rb: ["#6692FF", "#1E5BC6"],
  sauber: ["#52E252", "#000000"],
  default: ["#E10600", "#FFD700", "#FFFFFF"], // F1 red, gold, white
};

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  team?: keyof typeof F1_COLORS;
}

export function useConfetti() {
  const isRunningRef = useRef(false);

  // Basic celebration burst
  const celebrate = useCallback((options?: ConfettiOptions) => {
    if (isRunningRef.current) return;
    
    const colors = options?.team 
      ? F1_COLORS[options.team] 
      : options?.colors || F1_COLORS.default;

    confetti({
      particleCount: options?.particleCount || 100,
      spread: options?.spread || 70,
      origin: options?.origin || { y: 0.6, x: 0.5 },
      colors,
    });
  }, []);

  // Side cannon burst (left and right)
  const celebrateSideCannons = useCallback((team?: keyof typeof F1_COLORS) => {
    if (isRunningRef.current) return;
    
    const colors = team ? F1_COLORS[team] : F1_COLORS.default;
    const defaults = { colors, startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    // Left side
    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: 0, y: Math.random() - 0.2 },
      angle: 60,
    });

    // Right side
    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: 1, y: Math.random() - 0.2 },
      angle: 120,
    });
  }, []);

  // Trophy celebration - fireworks style
  const celebrateTrophy = useCallback((team?: keyof typeof F1_COLORS) => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    
    const colors = team ? F1_COLORS[team] : F1_COLORS.default;
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999, colors };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        isRunningRef.current = false;
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Random bursts
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
  }, []);

  // Checkered flag celebration
  const celebrateCheckeredFlag = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    
    const end = Date.now() + 2000;
    const colors = ["#000000", "#FFFFFF"];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        shapes: ["square"],
        scalar: 1.5,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        shapes: ["square"],
        scalar: 1.5,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        isRunningRef.current = false;
      }
    }());
  }, []);

  // Quick win celebration (small, subtle)
  const celebrateQuickWin = useCallback((colors?: string[]) => {
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { y: 0.7 },
      colors: colors || F1_COLORS.default,
      scalar: 0.8,
    });
  }, []);

  // Prediction success celebration
  const celebratePrediction = useCallback((correct: boolean, team?: keyof typeof F1_COLORS) => {
    if (!correct) return;
    
    const colors = team ? F1_COLORS[team] : F1_COLORS.default;
    
    // Center burst
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
      colors,
    });

    // Delayed side bursts
    setTimeout(() => {
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 60,
        origin: { x: 0.2, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 60,
        origin: { x: 0.8, y: 0.6 },
        colors,
      });
    }, 200);
  }, []);

  // First prediction badge celebration
  const celebrateFirstPrediction = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    
    const colors = ["#E10600", "#FFD700", "#00D2BE"]; // F1 red, gold, Mercedes teal

    (function frame() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        isRunningRef.current = false;
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      confetti({
        particleCount: 2,
        spread: 100,
        startVelocity: 45,
        origin: { y: 0.9, x: 0.5 },
        colors,
      });

      requestAnimationFrame(frame);
    }());
  }, []);

  return {
    celebrate,
    celebrateSideCannons,
    celebrateTrophy,
    celebrateCheckeredFlag,
    celebrateQuickWin,
    celebratePrediction,
    celebrateFirstPrediction,
    F1_COLORS,
  };
}

export type { ConfettiOptions };
