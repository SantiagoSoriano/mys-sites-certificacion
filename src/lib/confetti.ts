"use client";

import confetti from "canvas-confetti";

const MYS_COLORS = ["#C1622E", "#A14D22", "#5C7A52", "#FBF3E7"];

export function celebrar() {
  // Big burst from the middle, then two side bursts
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.6 },
    colors: MYS_COLORS,
  });
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: MYS_COLORS,
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: MYS_COLORS,
    });
  }, 250);
}
