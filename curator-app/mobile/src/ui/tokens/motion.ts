export const duration = { fast: 120, base: 200, slow: 320 } as const;

export const spring = {
  press:  { damping: 18, stiffness: 240, mass: 0.8 },
  enter:  { damping: 22, stiffness: 180, mass: 1.0 },
  settle: { damping: 28, stiffness: 140, mass: 1.0 },
} as const;
