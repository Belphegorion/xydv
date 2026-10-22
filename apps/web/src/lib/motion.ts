export const EMIL_EASE = [0.23, 1, 0.32, 1] as const;
export const DRAWER_EASE = [0.32, 0.72, 0, 1] as const;

export const SPRING_TACTILE = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 35,
};

export const SPRING_COUNTER = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 14,
};

export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 32,
};

export const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 24,
};

export const SPRING_BOUNCE = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 22,
};
