// src/lib/animations.ts

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  transition: { duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.23, 0.86, 0.39, 0.96] },
};

export const slideDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.23, 0.86, 0.39, 0.96] },
};

export const animations = {
  fadeIn,
  fadeUp,
  slideDown,
  
  // Scale in — Emphasis entry
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] },
  },
  
  // Slide from left
  slideInLeft: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] },
  },
  
  // Slide from right
  slideInRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] },
  },
  
  // === STAGGER ANIMATIONS ===
  
  // Stagger container — Parent that staggers children
  staggerContainer: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  },
  
  // Stagger item — Child that animates in sequence
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] },
    },
  },
  
  // === SCROLL-TRIGGERED ===
  
  // Reveal on scroll — Elements appear when in viewport
  scrollReveal: {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: [0.23, 0.86, 0.39, 0.96] },
  },
  
  // Parallax scroll — Subtle depth effect
  parallax: {
    initial: { y: 0 },
    whileInView: { y: -20 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "linear" },
  },
  
  // === HOVER/INTERACTION ===
  
  // Button hover — Subtle scale
  buttonHover: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.15 },
  },
  
  // Card hover — Elevation change
  cardHover: {
    whileHover: { y: -4 },
    transition: { duration: 0.2 },
  },
  
  // === FLOATING ANIMATIONS ===
  
  // Float — Continuous gentle movement
  float: {
    animate: {
      y: [0, -10, 0],
    },
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
  
  // Pulse glow — Breathing glow effect
  pulseGlow: {
    animate: {
      opacity: [0.5, 1, 0.5],
    },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  
  // Rotate slow — Continuous slow rotation
  rotateSlow: {
    animate: {
      rotate: [0, 360],
    },
    transition: { duration: 20, repeat: Infinity, ease: "linear" },
  },
} as const;
