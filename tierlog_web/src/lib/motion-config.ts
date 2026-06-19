/**
 * TierLog motion config — Apple-style easing & duration tokens.
 *
 * Complements (does NOT replace) `src/lib/animations.ts` and `src/lib/motion.tsx`.
 * `motionPresets` here are designed to be consumed by `MotionDiv`/`MotiView`
 * through the existing motion abstraction (framer-motion on web, Moti on native).
 *
 * Reference: APPLE_DESIGN_SYSTEM_COMPLETE.md §2.2
 *  - Fast:    150ms  (opacity, position feedback)
 *  - Normal:  250ms  (scale, color transitions)
 *  - Slow:    400ms  (layout, complex reveals)
 */

// Cubic-bezier easing curves. Tuple form so they're usable by both
// framer-motion (array) and inline CSS (stringified).
export const MOTION_EASING = {
  standard: [0.4, 0, 0.2, 1] as const, // material entrance/exit
  decelerate: [0, 0, 0.2, 1] as const, // motion that slows into place
  accelerate: [0.4, 0, 1, 1] as const, // motion that speeds out
  emphasized: [0.2, 0, 0, 1] as const, // focus transitions
};

// String form for CSS transition-timing-function / framer `ease`.
export const MOTION_EASING_CSS = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  decelerate: "cubic-bezier(0, 0, 0.2, 1)",
  accelerate: "cubic-bezier(0.4, 0, 1, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
};

// Durations in MILLISECONDS (Moti uses ms; framer uses seconds).
export const MOTION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  slowest: 600, // page transitions
};

// framer-motion wants seconds; expose a seconds-based mirror.
export const MOTION_DURATION_S = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  slowest: 0.6,
};

/**
 * Reusable motion presets, structured as framer-motion `variants`-compatible
 * objects (initial/animate as plain objects). Use with <MotionDiv> from
 * src/lib/motion.tsx — it already maps framer <-> Moti for you.
 *
 * `i` is the stagger index (delay = i * staggerStep). Apple's motion is
 * subtle and fast, so stagger is kept tight (80ms).
 */
const STAGGER_STEP = 80; // ms

export const motionPresets = {
  /** Subtle fade — for non-critical entrances. */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      duration: MOTION_DURATION_S.normal,
      ease: MOTION_EASING.decelerate,
    },
  },

  /** Fade-up — default entrance for content blocks. */
  fadeUp: (i: number = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: MOTION_DURATION_S.normal,
      ease: MOTION_EASING.standard,
      delay: (i * STAGGER_STEP) / 1000,
    },
  }),

  /** Slide up — heavier vertical entrance for hero sections. */
  slideUp: (i: number = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: MOTION_DURATION_S.slow,
      ease: MOTION_EASING.standard,
      delay: (i * STAGGER_STEP) / 1000,
    },
  }),

  /** Scale-in — emphasis for CTAs and badges. */
  scaleIn: {
    initial: { scale: 0.96, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: {
      duration: MOTION_DURATION_S.normal,
      ease: MOTION_EASING.standard,
    },
  },

  /** Hover/tap micro-interaction for pressables (subtle, Apple-style). */
  interactive: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: MOTION_DURATION_S.fast },
  },
};

/**
 * Stagger container — orchestrates a list of children that each use
 * `motionPresets.fadeUp(i)`. Use on a parent <MotionDiv variants={staggerContainer}>
 * and children with their own variants for a coordinated Apple-style reveal.
 */
export const staggerContainer = (step = STAGGER_STEP) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: step },
  },
});
