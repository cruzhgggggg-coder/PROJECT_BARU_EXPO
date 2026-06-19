# TierLog — Product Requirements Document (PRD)
## Dark Premium Academic Platform — Voxr.ai Inspired Design

**Version:** 2.0  
**Date:** June 18, 2026  
**Framework:** React Native 0.81 + Expo 54 + NativeWind 4  
**Design Reference:** Voxr.ai (dark premium SaaS aesthetic)  
**Target Users:** Students (tech-savvy, mobile-first) + Lecturers (variable tech literacy, desktop-first)  
**Platform:** Web, Android, iOS

---

## TABLE OF CONTENTS

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [Animation & Motion System](#3-animation--motion-system)
4. [Responsive Strategy](#4-responsive-strategy)
5. [Accessibility Framework](#5-accessibility-framework)
6. [Page: Landing / Homepage](#6-page-landing--homepage)
7. [Page: Login](#7-page-login)
8. [Page: Register / Signup](#8-page-register--signup)
9. [Page: Student Dashboard](#9-page-student-dashboard)
10. [Page: Lecturer Dashboard](#10-page-lecturer-dashboard)
11. [Page: Consultation Workspace](#11-page-consultation-workspace)
12. [Page: Archive](#12-page-archive)
13. [Page: Settings](#13-page-settings)
14. [Page: AI Gateway](#14-page-ai-gateway)
15. [Component Library](#15-component-library)
16. [File Structure](#16-file-structure)
17. [Implementation Phases](#17-implementation-phases)

---

## 1. DESIGN PHILOSOPHY

### 1.1 Core Principles

```
DARK PREMIUM — Bukan sekadar dark mode. Ini adalah design language yang
sengaja memilih gelap sebagai fondasi untuk menciptakan kesan profesional,
focused, dan modern. Seperti dashboard Bloomberg, Linear, atau Vercel.

WHITESPACE AS Weapon — Ruang kosong bukan "belum diisi". Ruang kosong
adalah elemen desain aktif yang mengatur hierarki visual dan mencegah
cognitive overload — terpenting untuk dosen senior yang butuh fokus.

GRADIENT WITH PURPOSE — Setiap gradient punya alasan. Indigo-to-violet
untuk primary actions. Rose-to-amber untuk warnings. Bukan dekorasi —
tapi visual communication system.

SCROLL REVEALS — Elemen muncul saat dibutuhkan, bukan sekaligus.
Ini menciptakan sense of discovery dan mengurangi overwhelming feeling
saat pertama kali membuka halaman baru.
```

### 1.2 Design DNA: Voxr.ai → TierLog

| Voxr.ai Element | TierLog Adaptation | Reason |
|---|---|---|
| Dark navy background | Slate 950 (#020617) | Deeper, more academic feel |
| Purple gradient accent | Indigo-to-violet gradient | Matches existing brand |
| Floating gradient blobs | Animated gradient orbs | Softer, more organic |
| Hero video background | Gradient + particle animation | Lighter, faster loading |
| Bento grid features | Asymmetric feature cards | Showcase different features |
| Stats bar | Animated counters | Show impact metrics |
| Scroll-triggered reveals | Staggered fade-up on scroll | Progressive disclosure |
| Glass morphism cards | Frosted glass with border | Depth without heaviness |
| CTA gradient buttons | Gradient primary buttons | Clear action hierarchy |

### 1.3 User Experience Philosophy

```
FOR STUDENTS:
  "Get in, do your work, get out."
  - Fast navigation
  - AI chat always accessible
  - Upload → Transcribe → Revise flow
  - Mobile-first interactions

FOR LECTURERS:
  "See everything at a glance, act with confidence."
  - All information visible without scrolling
  - Large touch targets
  - High contrast text
  - Keyboard shortcuts available
  - Font scaling prominent
```

---

## 2. DESIGN SYSTEM

### 2.1 Color Palette

```
═══════════════════════════════════════════════════════════════
BACKGROUND SYSTEM (Dark Premium)
═══════════════════════════════════════════════════════════════

Tier-BG-Primary     #020617    Slate 950 — Main page background
Tier-BG-Secondary   #0F172A    Slate 900 — Panels, sidebar, cards
Tier-BG-Elevated    #1E293B    Slate 800 — Hover states, modals
Tier-BG-Glass       rgba(15, 23, 42, 0.8) — Glass morphism panels
Tier-BG-Gradient    linear-gradient(135deg, #020617 0%, #0F172A 50%, #1E1B4B 100%)

═══════════════════════════════════════════════════════════════
TEXT SYSTEM (High Contrast on Dark)
═══════════════════════════════════════════════════════════════

Tier-Text-Primary    #F8FAFC    Slate 50 — Headings, primary text (15.4:1)
Tier-Text-Secondary  #94A3B8    Slate 400 — Body text, descriptions (7.2:1)
Tier-Text-Tertiary   #64748B    Slate 500 — Captions, timestamps (4.8:1)
Tier-Text-Inverse    #020617    Slate 950 — Text on light backgrounds
Tier-Text-Gradient   linear-gradient(135deg, #818CF8, #C084FC, #F472B6) — Hero text

═══════════════════════════════════════════════════════════════
ACCENT SYSTEM (Semantic Colors)
═══════════════════════════════════════════════════════════════

Tier-Accent-Primary    #6366F1    Indigo 500 — Primary actions, CTAs
Tier-Accent-Primary-Deep  #4F46E5  Indigo 600 — Hover, active states
Tier-Accent-Primary-Glow  rgba(99, 102, 241, 0.15) — Glow effects

Tier-Accent-Violet     #8B5CF6    Violet 500 — Gradients, secondary accent
Tier-Accent-Violet-Glow rgba(139, 92, 246, 0.15) — Glow effects

Tier-Accent-Rose       #F43F5E    Rose 500 — Errors, destructive actions
Tier-Accent-Rose-Glow  rgba(244, 63, 94, 0.15)

Tier-Accent-Emerald    #10B981    Emerald 500 — Success, completed
Tier-Accent-Emerald-Glow rgba(16, 185, 129, 0.15)

Tier-Accent-Amber      #F59E0B    Amber 500 — Warnings, pending
Tier-Accent-Amber-Glow rgba(245, 158, 11, 0.15)

Tier-Accent-Cyan       #06B6D4    Cyan 500 — Info, AI-related
Tier-Accent-Cyan-Glow  rgba(6, 182, 212, 0.15)

═══════════════════════════════════════════════════════════════
BORDER & DIVIDER SYSTEM
═══════════════════════════════════════════════════════════════

Tier-Border-Subtle    rgba(255, 255, 255, 0.06) — Card borders
Tier-Border-Light     rgba(255, 255, 255, 0.10) — Active borders
Tier-Border-Medium    rgba(255, 255, 255, 0.15) — Focus borders
Tier-Border-Strong    rgba(255, 255, 255, 0.20) — Emphasis borders
Tier-Divider          rgba(255, 255, 255, 0.06) — Section dividers

═══════════════════════════════════════════════════════════════
INTERACTIVE STATE OVERLAYS
═══════════════════════════════════════════════════════════════

Tier-Hover     rgba(255, 255, 255, 0.04) — Hover background
Tier-Pressed   rgba(255, 255, 255, 0.08) — Pressed background
Tier-Focus     rgba(99, 102, 241, 0.3)   — Focus ring
Tier-Selected  rgba(99, 102, 241, 0.15)  — Selected item
```

### 2.2 Tailwind Configuration

```javascript
// tierlog_web/tailwind.config.js
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        tier: {
          // Backgrounds
          bg: {
            DEFAULT: "#020617",
            secondary: "#0F172A",
            elevated: "#1E293B",
            glass: "rgba(15, 23, 42, 0.8)",
          },
          // Text
          text: {
            primary: "#F8FAFC",
            secondary: "#94A3B8",
            tertiary: "#64748B",
          },
          // Accents
          accent: {
            indigo: "#6366F1",
            "indigo-deep": "#4F46E5",
            violet: "#8B5CF6",
            rose: "#F43F5E",
            emerald: "#10B981",
            amber: "#F59E0B",
            cyan: "#06B6D4",
          },
          // Borders
          border: {
            subtle: "rgba(255, 255, 255, 0.06)",
            light: "rgba(255, 255, 255, 0.10)",
            medium: "rgba(255, 255, 255, 0.15)",
            strong: "rgba(255, 255, 255, 0.20)",
          },
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        base: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["28px", { lineHeight: "36px" }],
        "4xl": ["32px", { lineHeight: "40px" }],
        "5xl": ["40px", { lineHeight: "48px" }],
        "6xl": ["48px", { lineHeight: "56px" }],
        "7xl": ["60px", { lineHeight: "68px" }],
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.15)",
        "glow-lg": "0 0 40px rgba(99, 102, 241, 0.2)",
        glass: "inset 0 1px 1px 0 rgba(255,255,255,0.05), 0 10px 40px -10px rgba(0,0,0,0.5)",
        card: "0 4px 24px -4px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 8px 40px -4px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
```

### 2.3 Typography System

```typescript
// src/lib/typography.ts
export const typography = {
  // Display — Hero text, large headings
  display: "text-5xl md:text-7xl font-black tracking-tight text-tier-text-primary",
  
  // H1 — Page titles
  h1: "text-3xl md:text-4xl font-bold tracking-tight text-tier-text-primary",
  
  // H2 — Section titles
  h2: "text-2xl md:text-3xl font-bold tracking-tight text-tier-text-primary",
  
  // H3 — Card titles, subsections
  h3: "text-xl font-semibold text-tier-text-primary",
  
  // H4 — Small headings
  h4: "text-lg font-semibold text-tier-text-primary",
  
  // Body — Main reading text
  body: "text-base font-medium leading-relaxed text-tier-text-secondary",
  
  // Body Large — Emphasized body text
  bodyLarge: "text-lg font-medium leading-relaxed text-tier-text-secondary",
  
  // Small — Supporting text
  small: "text-sm font-medium text-tier-text-secondary",
  
  // Caption — Timestamps, metadata
  caption: "text-xs font-medium text-tier-text-tertiary",
  
  // Label — Section labels, badge text
  label: "text-xs font-bold uppercase tracking-widest text-tier-text-tertiary",
  
  // Gradient Text — Hero emphasis
  gradient: "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400",
} as const;
```

### 2.4 Spacing System (8px Grid)

```typescript
// src/lib/spacing.ts
export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
} as const;

// Section spacing
export const sectionSpacing = {
  mobile: "py-16 px-5",     // 64px vertical, 20px horizontal
  tablet: "py-20 px-8",     // 80px vertical, 32px horizontal
  desktop: "py-24 px-12",   // 96px vertical, 48px horizontal
} as const;
```

---

## 3. ANIMATION & MOTION SYSTEM

### 3.1 Animation Philosophy

```
PURPOSE OVER DECORATION — Setiap animasi harus communicate status atau
guide attention. Tidak ada animasi "sekedar cantik".

FAST & SUBTLE — Duration 150-400ms. Tidak ada animasi lebih dari 500ms
kecuali page transitions. User tidak menunggu animasi.

SCROLL TRIGGERED — Elemen muncul saat user scroll ke viewport.
Ini menciptakan sense of discovery dan mengurangi cognitive load.

REDUCED MOTION RESPECT — Semua animasi bisa dimatikan untuk users
yang sensitif terhadap motion (accessibility requirement).
```

### 3.2 Easing Functions

```typescript
// src/lib/motion.ts
export const easing = {
  // Standard — Default for most animations
  standard: [0.4, 0, 0.2, 1],
  
  // Decelerate — Elements entering screen
  decelerate: [0, 0, 0.2, 1],
  
  // Accelerate — Elements leaving screen
  accelerate: [0.4, 0, 1, 1],
  
  // Emphasized — Focus transitions, modals
  emphasized: [0.2, 0, 0, 1],
  
  // Spring — Bouncy, playful interactions
  spring: { type: "spring", stiffness: 300, damping: 30 },
  
  // Gentle Spring — Subtle bounce
  gentleSpring: { type: "spring", stiffness: 200, damping: 20 },
} as const;

export const duration = {
  fast: 150,      // Quick feedback (opacity, color)
  normal: 250,    // Standard transitions (scale, position)
  slow: 400,      // Complex reveals (layout, multi-property)
  page: 500,      // Page transitions
} as const;
```

### 3.3 Animation Presets

```typescript
// src/lib/animations.ts
export const animations = {
  // === ENTRY ANIMATIONS ===
  
  // Fade up — Most common entry animation
  fadeUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.23, 0.86, 0.39, 0.96] },
  },
  
  // Fade in — Simple opacity
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] },
  },
  
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
    whileHover: { y: -4, boxShadow: "0 8px 40px -4px rgba(0, 0, 0, 0.4)" },
    transition: { duration: 0.2 },
  },
  
  // === FLOATING ANIMATIONS ===
  
  // Float — Continuous gentle movement
  float: {
    animate: {
      y: [0, -10, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
    },
  },
  
  // Pulse glow — Breathing glow effect
  pulseGlow: {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  },
  
  // Rotate slow — Continuous slow rotation
  rotateSlow: {
    animate: {
      rotate: [0, 360],
      transition: { duration: 20, repeat: Infinity, ease: "linear" },
    },
  },
} as const;
```

### 3.4 Scroll-Revealed Section Component

```tsx
// src/components/ui/ScrollReveal.tsx
import { useRef } from "react";
import { MotionDiv } from "@/src/lib/motion";
import { useInView } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  
  const directionMap = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: -40 },
    right: { x: 40 },
  };
  
  return (
    <MotionDiv
      ref={ref}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
      }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}
```

---

## 4. RESPONSIVE STRATEGY

### 4.1 Breakpoints

```typescript
// src/lib/responsive.ts
export const BREAKPOINTS = {
  mobile: 0,      // < 768px — Phones
  tablet: 768,    // 768px - 1024px — Tablets, small laptops
  desktop: 1024,  // > 1024px — Desktops, large screens
} as const;

export type ScreenSize = "mobile" | "tablet" | "desktop";

export function getScreenSize(width: number): ScreenSize {
  if (width < BREAKPOINTS.tablet) return "mobile";
  if (width < BREAKPOINTS.desktop) return "tablet";
  return "desktop";
}
```

### 4.2 Layout Strategy by Screen

```
MOBILE (< 768px)
├── Single column layout
├── Bottom tab navigation (4 tabs)
├── Full-width cards
├── Swipe gestures
├── Pull-to-refresh
├── Hamburger menu for secondary nav
├── Font: base (16px) default, scalable to 20px
└── Touch targets: 44px minimum

TABLET (768px - 1024px)
├── 2-column layout possible
├── Collapsible sidebar (icon-only mode)
├── Cards in grid (2 columns)
├── Tab navigation visible
├── Hover effects enabled
├── Font: base (16px) default, scalable to 20px
└── Touch targets: 44px minimum

DESKTOP (> 1024px)
├── 3-column layout (lecturer dashboard)
├── Full sidebar navigation
├── Cards in grid (3-4 columns)
├── Hover effects + tooltips
├── Keyboard shortcuts
├── Font: base (16px) default, scalable to 20px
└── Touch targets: 44px minimum
```

### 4.3 Responsive Container Component

```tsx
// src/components/layout/ResponsiveContainer.tsx
import { View } from "react-native";
import { useResponsive } from "@/src/hooks/useResponsive";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function ResponsiveContainer({
  children,
  className = "",
  maxWidth = "xl",
}: ResponsiveContainerProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const maxWidthMap = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
  };
  
  return (
    <View
      className={`
        w-full mx-auto
        ${isMobile ? "px-5" : ""}
        ${isTablet ? "px-8" : ""}
        ${isDesktop ? "px-12" : ""}
        ${isDesktop ? maxWidthMap[maxWidth] : ""}
        ${className}
      `}
    >
      {children}
    </View>
  );
}
```

---

## 5. ACCESSIBILITY FRAMEWORK

### 5.1 Font Scaling System

```typescript
// src/hooks/useFontSize.ts
import { useUIStore } from "@/src/stores/ui-store";

type FontLevel = "normal" | "large";

const SCALES: Record<FontLevel, Record<string, number>> = {
  normal: {
    xs: 12, sm: 14, base: 16, lg: 18, xl: 20,
    "2xl": 24, "3xl": 28, "4xl": 32, "5xl": 40, "6xl": 48, "7xl": 60,
  },
  large: {
    xs: 14, sm: 16, base: 20, lg: 22, xl: 24,
    "2xl": 28, "3xl": 32, "4xl": 36, "5xl": 44, "6xl": 52, "7xl": 64,
  },
};

export function useFontSize() {
  const fontSize = useUIStore((s) => s.fontSize);
  const sizes = SCALES[fontSize];
  
  return {
    level: fontSize,
    isLarge: fontSize === "large",
    sizes,
    // Helper for dynamic StyleSheet
    get: (level: string) => sizes[level] || sizes.base,
    // Pre-built text styles
    text: {
      display: { fontSize: sizes["7xl"], lineHeight: sizes["7xl"] * 1.1, fontWeight: "900" as const },
      h1: { fontSize: sizes["4xl"], lineHeight: sizes["4xl"] * 1.25, fontWeight: "700" as const },
      h2: { fontSize: sizes["3xl"], lineHeight: sizes["3xl"] * 1.3, fontWeight: "700" as const },
      h3: { fontSize: sizes.xl, lineHeight: sizes.xl * 1.4, fontWeight: "600" as const },
      body: { fontSize: sizes.base, lineHeight: sizes.base * 1.5, fontWeight: "500" as const },
      small: { fontSize: sizes.sm, lineHeight: sizes.sm * 1.5, fontWeight: "500" as const },
      caption: { fontSize: sizes.xs, lineHeight: sizes.xs * 1.4, fontWeight: "500" as const },
    },
  };
}
```

### 5.2 Touch Target Requirements

```typescript
// src/lib/accessibility.ts
export const TOUCH = {
  minSize: 44,        // WCAG 2.5.5 minimum
  recommendedSize: 48, // Android recommended
  minSpacing: 8,       // Between interactive elements
  idealSpacing: 12,    // Comfortable spacing
} as const;

// Helper to ensure minimum touch target
export function ensureTouchTarget(size: number): number {
  return Math.max(size, TOUCH.minSize);
}
```

### 5.3 Screen Reader Support

```tsx
// Every interactive element MUST have:
<Pressable
  accessibilityLabel="Upload thesis draft"
  accessibilityRole="button"
  accessibilityState={{ disabled: false, busy: isUploading }}
>
  <Text>Upload</Text>
</Pressable>

// Every image MUST have:
<Image
  source={require("./avatar.png")}
  accessibilityLabel="Profile photo of Budi Mahasiswa"
/>

// Every form field MUST have:
<TextInput
  accessibilityLabel="Email address"
  accessibilityHint="Enter your university email"
  accessibilityRequired={true}
/>
```

---

## 6. PAGE: LANDING / HOMEPAGE

### 6.1 Overview

```
PURPOSE: Convert visitors to registered users. Show TierLog's value
proposition in < 5 seconds. Inspire trust and professionalism.

DESIGN REFERENCE: Voxr.ai hero section — dark background, gradient text,
floating orbs, scroll-triggered feature cards.

USER FLOW:
  Visitor → See hero → Scroll to features → Click "Get Started" → Register
```

### 6.2 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR (Fixed, glass morphism)                              │
│ Logo    Features    Pricing    About         [Sign In]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HERO SECTION (Full viewport height)                        │
│                                                             │
│         "Elevate Your Academic                              │
│              Vision"                                        │
│                                                             │
│    Gradient text (indigo → violet → rose)                   │
│                                                             │
│    "AI-powered thesis supervision platform                  │
│     that bridges lecturer feedback with                     │
│     student execution."                                     │
│                                                             │
│    [Get Started Free]  [Watch Demo]                         │
│                                                             │
│    Partnered with: [University logos]                       │
│                                                             │
│    ┌─────────────────────────────────────────────┐         │
│    │  Video/Demo Preview (with play button)      │         │
│    │  — 4-second loop of AI transcription       │         │
│    └─────────────────────────────────────────────┘         │
│                                                             │
│    Floating gradient orbs (indigo, violet, rose)            │
│    Particle animation (subtle)                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STATS BAR (Scroll-revealed)                                │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │  1000+  │ │  50+    │ │  95%    │ │  3x     │         │
│  │Students │ │Lecturers│ │Accuracy │ │ Faster  │         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FEATURES SECTION (Bento Grid)                              │
│                                                             │
│  "Power Up Your Thesis"                                     │
│  "Five AI-driven tools that..."                             │
│                                                             │
│  ┌──────────────────┐ ┌──────────┐                         │
│  │  🎙️              │ │  🤖      │                         │
│  │  Audio           │ │  AI      │                         │
│  │  Transcription   │ │  Oracle  │                         │
│  │  (Large card)    │ │ (Small)  │                         │
│  │                  │ └──────────┘                         │
│  │  Groq Whisper    │ ┌──────────┐                         │
│  │  auto-transcribes│ │  📸      │                         │
│  │  consultation    │ │  OCR     │                         │
│  └──────────────────┘ │  Vision  │                         │
│  ┌──────────┐         │ (Small)  │                         │
│  │  📊      │         └──────────┘                         │
│  │  Real-   │ ┌──────────────────┐                         │
│  │  Time    │ │  🔒              │                         │
│  │  Sync    │ │  Guarded AI      │                         │
│  │ (Small)  │ │  (Large card)    │                         │
│  └──────────┘ │  AI only responds │                         │
│               │  from lecturer    │                         │
│               │  feedback         │                         │
│               └──────────────────┘                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HOW IT WORKS (Numbered Steps)                              │
│                                                             │
│  "Your Path from Upload to Excellence"                      │
│                                                             │
│  01  Upload          02  Transcribe       03  Revise       │
│  ─── ─────           ─── ──────────       ─── ──────       │
│  Record audio        AI converts to       Get AI-guided    │
│  + thesis draft      text automatically   revision plan    │
│                                                             │
│  04  Collaborate     05  Validate                             │
│  ─── ──────────      ─── ─────────                           │
│  Chat with AI +      Lecturer approves                        │
│  get feedback        completed revisions                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TESTIMONIALS (Carousel)                                    │
│                                                             │
│  "Conversations that Become Research"                       │
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │  "TierLog reduced my revision time     │               │
│  │   from 2 weeks to 3 days."             │               │
│  │                                         │               │
│  │   — Budi, CS Student                    │               │
│  │   [★★★★★]                              │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  ← ○ ● ○ ○ ○ →                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CTA SECTION (Gradient background)                          │
│                                                             │
│  "Ready to Transform Your Thesis Journey?"                  │
│                                                             │
│  [Get Started Free]  [Schedule Demo]                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FAQ (Accordion)                                            │
│                                                             │
│  "Frequently Asked Questions"                               │
│                                                             │
│  ▶ How does AI transcription work?                          │
│  ▶ Is my data secure?                                       │
│  ▶ Can lecturers monitor AI conversations?                  │
│  ▶ What file formats are supported?                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ FOOTER                                                      │
│ © 2026 TierLog. Privacy · Terms · Contact                   │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Component Breakdown

```tsx
// app/index.tsx — Landing Page Structure
export default function LandingPage() {
  return (
    <View className="min-h-screen bg-tier-bg">
      {/* Fixed Navbar */}
      <LandingNavbar />
      
      <ScrollView>
        {/* Hero — Full viewport */}
        <HeroSection />
        
        {/* Stats — Scroll reveal */}
        <ScrollReveal>
          <StatsBar />
        </ScrollReveal>
        
        {/* Features — Bento grid */}
        <ScrollReveal delay={0.1}>
          <FeaturesSection />
        </ScrollReveal>
        
        {/* How it works — Numbered steps */}
        <ScrollReveal delay={0.2}>
          <HowItWorksSection />
        </ScrollReveal>
        
        {/* Testimonials — Carousel */}
        <ScrollReveal delay={0.3}>
          <TestimonialsSection />
        </ScrollReveal>
        
        {/* CTA — Gradient background */}
        <ScrollReveal delay={0.4}>
          <CTASection />
        </ScrollReveal>
        
        {/* FAQ — Accordion */}
        <ScrollReveal delay={0.5}>
          <FAQSection />
        </ScrollReveal>
        
        {/* Footer */}
        <Footer />
      </ScrollView>
      
      {/* Floating gradient orbs (background decoration) */}
      <FloatingOrbs />
    </View>
  );
}
```

### 6.4 Hero Section Component

```tsx
// src/components/sections/HeroSection.tsx
export function HeroSection() {
  const { isMobile } = useResponsive();
  
  return (
    <View className="relative min-h-screen items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <GradientBackground />
      
      {/* Floating orbs */}
      <FloatingOrbs />
      
      {/* Content */}
      <View className="relative z-10 items-center px-5 py-20 max-w-4xl mx-auto">
        {/* Badge */}
        <MotionDiv {...animations.fadeUp} transition={{ ...animations.fadeUp.transition, delay: 0 }}>
          <Badge label="AI-Powered Academic Platform" />
        </MotionDiv>
        
        {/* Headline */}
        <MotionDiv {...animations.fadeUp} transition={{ ...animations.fadeUp.transition, delay: 0.1 }}>
          <Text className="text-center mt-6 text-tier-text-primary font-black tracking-tight"
                style={{ fontSize: isMobile ? 40 : 60, lineHeight: isMobile ? 48 : 68 }}>
            Elevate Your{"\n"}Academic Vision
          </Text>
        </MotionDiv>
        
        {/* Gradient subtitle */}
        <MotionDiv {...animations.fadeUp} transition={{ ...animations.fadeUp.transition, delay: 0.2 }}>
          <Text className="text-center mt-4 text-2xl md:text-3xl font-bold"
                style={{ color: "transparent", backgroundImage: "linear-gradient(135deg, #818CF8, #C084FC, #F472B6)" }}>
            Crafting Exceptional Consultations
          </Text>
        </MotionDiv>
        
        {/* Description */}
        <MotionDiv {...animations.fadeUp} transition={{ ...animations.fadeUp.transition, delay: 0.3 }}>
          <Text className="text-center mt-6 text-tier-text-secondary text-lg max-w-2xl leading-relaxed">
            AI-powered thesis supervision that bridges lecturer feedback with student execution. 
            Track revisions, collaborate on annotations, and verify milestones in real-time.
          </Text>
        </MotionDiv>
        
        {/* CTA Buttons */}
        <MotionDiv {...animations.fadeUp} transition={{ ...animations.fadeUp.transition, delay: 0.4 }}>
          <View className="flex-row gap-4 mt-8">
            <ElegantButton title="Get Started Free" tone="primary" size="lg" />
            <ElegantButton title="Watch Demo" tone="secondary" size="lg" />
          </View>
        </MotionDiv>
        
        {/* Partner logos */}
        <MotionDiv {...animations.fadeUp} transition={{ ...animations.fadeUp.transition, delay: 0.5 }}>
          <View className="mt-12 items-center gap-3">
            <Text className="text-tier-text-tertiary text-xs font-medium uppercase tracking-widest">
              Trusted by
            </Text>
            <View className="flex-row gap-8 items-center">
              <Text className="text-tier-text-tertiary text-sm font-semibold">BINUS</Text>
              <Text className="text-tier-text-tertiary text-sm font-semibold">ITB</Text>
              <Text className="text-tier-text-tertiary text-sm font-semibold">UI</Text>
              <Text className="text-tier-text-tertiary text-sm font-semibold">UGM</Text>
            </View>
          </View>
        </MotionDiv>
      </View>
    </View>
  );
}
```

### 6.5 Floating Orbs Component

```tsx
// src/components/ui/FloatingOrbs.tsx
export function FloatingOrbs() {
  return (
    <View className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Indigo orb */}
      <MotionDiv
        className="absolute w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #6366F1 0%, transparent 70%)",
          top: "10%",
          left: "15%",
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Violet orb */}
      <MotionDiv
        className="absolute w-[400px] h-[400px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
          top: "40%",
          right: "10%",
        }}
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 25, -15, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Rose orb */}
      <MotionDiv
        className="absolute w-[350px] h-[350px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #F43F5E 0%, transparent 70%)",
          bottom: "15%",
          left: "30%",
        }}
        animate={{
          x: [0, 20, -30, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </View>
  );
}
```

---

## 7. PAGE: LOGIN

### 7.1 Overview

```
PURPOSE: Authenticate existing users. Fast, minimal friction.
DESIGN: Split layout — left branding, right form.
USER FLOW: Enter credentials → Validate → Redirect to role-based dashboard
```

### 7.2 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────┐ ┌────────────────────────────────┐   │
│  │                  │ │                                │   │
│  │  LEFT PANEL      │ │  LOGIN FORM                   │   │
│  │  (Branding)      │ │                                │   │
│  │                  │ │  "Welcome Back"                 │   │
│  │  Gradient bg     │ │  "Sign in to your account"     │   │
│  │  + floating orbs │ │                                │   │
│  │                  │ │  ┌──────────────────────────┐  │   │
│  │  Logo            │ │  │ Email                    │  │   │
│  │  "TierLog"       │ │  └──────────────────────────┘  │   │
│  │                  │ │  ┌──────────────────────────┐  │   │
│  │  "Bridging the   │ │  │ Password          👁️    │  │   │
│  │  gap between     │ │  └──────────────────────────┘  │   │
│  │  feedback and    │ │                                │   │
│  │  excellence"     │ │  [  Sign In  ]                 │   │
│  │                  │ │                                │   │
│  │                  │ │  ─── or continue with ───      │   │
│  │                  │ │                                │   │
│  │                  │ │  [Google]  [GitHub]            │   │
│  │                  │ │                                │   │
│  │                  │ │  Don't have an account?        │   │
│  │                  │ │  [Create Account]              │   │
│  │                  │ │                                │   │
│  └──────────────────┘ └────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Mobile Adaptation

```
┌─────────────────────────┐
│                         │
│  ┌───────────────────┐  │
│  │                   │  │
│  │  Logo             │  │
│  │  "Welcome Back"   │  │
│  │                   │  │
│  │  ┌─────────────┐  │  │
│  │  │ Email       │  │  │
│  │  └─────────────┘  │  │
│  │  ┌─────────────┐  │  │
│  │  │ Password 👁️│  │  │
│  │  └─────────────┘  │  │
│  │                   │  │
│  │  [  Sign In  ]    │  │
│  │                   │  │
│  │  Don't have an    │  │
│  │  account?         │  │
│  │  [Create Account] │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘

- Centered card layout
- No split layout
- Glass card effect
- Floating orbs behind
```

---

## 8. PAGE: REGISTER / SIGNUP

### 8.1 Overview

```
PURPOSE: Create new accounts for students and lecturers.
DESIGN: Multi-step form with progress indicator.
USER FLOW: Choose role → Fill details → Verify → Complete
```

### 8.2 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Create Your Account                                │   │
│  │  "Join thousands of students and lecturers"         │   │
│  │                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐                   │   │
│  │  │ 🎓 Student  │ │ 👨‍🏫 Lecturer │                   │   │
│  │  │   (selected)│ │             │                   │   │
│  │  └─────────────┘ └─────────────┘                   │   │
│  │                                                     │   │
│  │  Step 1 of 3  ──────────○──────────○               │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Full Name                                   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Email                                       │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Password                        👁️          │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Confirm Password                👁️          │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  [ Continue → ]                                     │   │
│  │                                                     │   │
│  │  Already have an account? [Sign In]                 │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Step 2 (Student): NIM, Study Program, Thesis Title
Step 2 (Lecturer): NIP, Faculty, Expertise Area
Step 3: Verification / Confirmation
```

---

## 9. PAGE: STUDENT DASHBOARD

### 9.1 Overview

```
PURPOSE: Central hub for students. Quick access to all features.
DESIGN: Card-based layout with activity feed. Mobile-first.
USER FLOW: View stats → See recent activity → Take action
```

### 9.2 Page Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR (Fixed)                                              │
│ TierLog    Dashboard  Consult  Archive  Settings    [Avatar]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome back, Budi! 👋                                     │
│  Here's what's happening with your thesis.                  │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │  📄     │ │  💬     │ │  ✅     │ │  ⏳     │         │
│  │   3     │ │   12    │ │   8     │ │   2     │         │
│  │ Uploads │ │Messages │ │ Fixed   │ │ Pending │         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
│                                                             │
│  ┌──────────────────────────┐ ┌──────────────────────────┐│
│  │  📋 Recent Activity      │ │  🤖 AI Oracle            ││
│  │                          │ │                          ││
│  │  • Upload v3 received    │ │  "Your methodology       ││
│  │    feedback (2 major)    │ │   section needs more     ││
│  │                          │ │   detail on sampling"    ││
│  │  • AI: "Perbaiki bagian  │ │                          ││
│  │    metodologi"           │ │  [Ask AI Oracle →]       ││
│  │                          │ │                          ││
│  │  • Dosen validated       │ │  ┌──────────────────┐   ││
│  │    revision #5           │ │  │ Type message...  │   ││
│  │                          │ │  │           [Send] │   ││
│  │  • New annotation from   │ │  └──────────────────┘   ││
│  │    dosen                 │ │                          ││
│  │                          │ │                          ││
│  │  [View All →]            │ │                          ││
│  └──────────────────────────┘ └──────────────────────────┘│
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📊 Progress Overview                                │  │
│  │                                                      │  │
│  │  Uploads  ████████░░░░░░  3/5                        │  │
│  │  Reviews  ██████████░░░░  8/10                       │  │
│  │  Fixed    ██████████████  100%                       │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ⚡ Quick Actions                                     │  │
│  │                                                      │  │
│  │  [📄 Upload Draft]  [💬 Ask AI]  [📸 Upload Image]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 Page Structure (Mobile)

```
┌─────────────────────────┐
│  Welcome back, Budi! 👋 │
├─────────────────────────┤
│ ┌─────┐ ┌─────┐        │
│ │  3  │ │ 12  │        │
│ │ 📄  │ │ 💬  │        │
│ └─────┘ └─────┘        │
│ ┌─────┐ ┌─────┐        │
│ │  8  │ │  2  │        │
│ │ ✅  │ │ ⏳  │        │
│ └─────┘ └─────┘        │
├─────────────────────────┤
│ 📋 Recent Activity      │
│ • Upload v3 received    │
│ • AI: "Perbaiki..."     │
│ • Dosen validated #5    │
├─────────────────────────┤
│ 🤖 AI Oracle            │
│ "Your methodology..."   │
│ [Ask AI Oracle →]       │
├─────────────────────────┤
│ ⚡ Quick Actions         │
│ [📄] [💬] [📸]          │
├─────────────────────────┤
│ [📊] [💬] [📁] [⚙️]    │
│ Dashboard Consult Archive│
└─────────────────────────┘

- 2x2 stat grid
- Activity feed (condensed)
- AI Oracle card
- Quick actions (prominent)
- Bottom tab navigation
```

---

## 10. PAGE: LECTURER DASHBOARD

### 10.1 Overview

```
PURPOSE: Central hub for lecturers. Monitor all students at a glance.
DESIGN: 3-column layout on desktop. Tab-based on mobile.
USER FLOW: Select student → View consultation → Provide feedback
```

### 10.2 Page Structure (Desktop — 3 Columns)

```
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR (Fixed)                                              │
│ TierLog    Students  Archive  Settings           [Avatar]   │
├────────┬───────────────────────┬────────────────────────────┤
│        │                       │                            │
│ STUDENTS│  CONSULTATION LOG    │  FEEDBACK & AI             │
│ (260px) │  (Flexible)          │  (380px)                   │
│        │                       │                            │
│ Search │  Select a student     │  Select a consultation     │
│ ────── │  to view their logs   │  to manage feedback        │
│        │                       │                            │
│ ● Budi │  ┌──────────────────┐ │  ┌──────────────────────┐ │
│   3 logs│  │ Upload v3       │ │  │ Feedback Items       │ │
│        │  │ 2024-01-15      │ │  │                      │ │
│ ○ Andi │  │ Status: Review  │ │  │ ⚠️ Major: 2          │ │
│   1 log │  └──────────────────┘ │  │ 📝 Minor: 5          │ │
│        │  ┌──────────────────┐ │  │ ✅ Fixed: 8          │ │
│ ○ Sari │  │ Upload v2       │ │  │                      │ │
│   2 logs│  │ 2024-01-12      │ │  │ [Add Feedback]       │ │
│        │  │ Status: Fixed   │ │  │ [Classify with AI]   │ │
│ ○ Rina │  └──────────────────┘ │  │                      │ │
│   1 log │  ┌──────────────────┐ │  │ ─── AI Oracle ───   │ │
│        │  │ Upload v1       │ │  │                      │ │
│        │  │ 2024-01-10      │ │  │ Student: "Bagaimana  │ │
│        │  │ Status: Done    │ │  │  cara memperbaiki    │ │
│        │  └──────────────────┘ │  │  metodologi?"        │ │
│        │                       │  │                      │ │
│        │  [📄] [💬] [📸]       │  │ AI: "Berdasarkan     │ │
│        │                       │  │  feedback dosen..."  │ │
│        │                       │  │                      │ │
│        │                       │  │ [Send Message]       │ │
│        │                       │  └──────────────────────┘ │
│        │                       │                            │
└────────┴───────────────────────┴────────────────────────────┘
```

### 10.3 Mobile Adaptation

```
┌─────────────────────────┐
│ ← Students              │
├─────────────────────────┤
│ [Students] [Log] [FB]   │  ← Tab switcher
├─────────────────────────┤
│                         │
│  Active Tab Content     │
│  (Full-width panels)    │
│                         │
└─────────────────────────┘

- Tab switcher replaces columns
- Each tab = full-width panel
- Back button prominent
- Large touch targets (48px)
```

---

## 11. PAGE: CONSULTATION WORKSPACE

### 11.1 Overview

```
PURPOSE: Core workspace for thesis consultation. Upload, transcribe, chat, revise.
DESIGN: Multi-panel layout. Desktop: side-by-side. Mobile: tab-based.
USER FLOW: Upload files → View transcript → Chat with AI → Manage feedback
```

### 11.2 Page Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Consultation #12 — Upload v3                    [Settings]│
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│  DOCUMENT PANEL (60%)    │  CHAT PANEL (40%)                │
│                          │                                  │
│  ┌────────────────────┐  │  ┌──────────────────────────┐   │
│  │ 📄 Thesis Draft    │  │  │ 🤖 AI Oracle Chat        │   │
│  │                    │  │  │                          │   │
│  │ Uploaded: Jan 15   │  │  │ Student: "Bagaimana      │   │
│  │ Size: 2.4 MB       │  │  │  cara memperbaiki        │   │
│  │ [Download]         │  │  │  bagian metodologi?"     │   │
│  └────────────────────┘  │  │                          │   │
│                          │  │ AI: "Berdasarkan feedback │   │
│  ┌────────────────────┐  │  │  dari dosen Anda, ada 2  │   │
│  │ 🎙️ Transcription   │  │  │  poin yang perlu         │   │
│  │                    │  │  │  diperbaiki..."           │   │
│  │ "Pada sesi kali    │  │  │                          │   │
│  │  ini kita membahas  │  │  │ ──────────────────────── │   │
│  │  bagian metodologi  │  │  │                          │   │
│  │  yang perlu         │  │  │ Dosen: "Bagian 3.2       │   │
│  │  diperbaiki..."     │  │  │  kurang detail"          │   │
│  │                    │  │  │                          │   │
│  │ [Copy] [Export]    │  │  │ ──────────────────────── │   │
│  └────────────────────┘  │  │                          │   │
│                          │  │ 🤖 AI: "Saya bisa bantu  │   │
│  ┌────────────────────┐  │  │  menjelaskan..."         │   │
│  │ 📸 Annotations     │  │  │                          │   │
│  │                    │  │  │ ┌──────────────────┐     │   │
│  │ [Image 1] [Image 2]│  │  │ │ Type message...  │     │   │
│  │                    │  │  │ │           [Send] │     │   │
│  │ OCR: "Perbaiki     │  │  │ └──────────────────┘     │   │
│  │  bagian 3.2..."    │  │  │                          │   │
│  └────────────────────┘  │  │                          │   │
│                          │  └──────────────────────────┘   │
│  ┌────────────────────┐  │                                  │
│  │ ⚠️ Feedback Items  │  │  ┌──────────────────────────┐   │
│  │                    │  │  │ 💬 Direct Messages       │   │
│  │ ⚠️ Major (2)       │  │  │                          │   │
│  │   • Metodologi     │  │  │ Dosen: "Revisi selesai?" │   │
│  │   • Data Analysis  │  │  │ Student: "Siap, pak!"    │   │
│  │                    │  │  │                          │   │
│  │ 📝 Minor (5)       │  │  │ ┌──────────────────┐     │   │
│  │   • Typo di pg 12  │  │  │ │ Type message...  │     │   │
│  │   • Format cited   │  │  │ │           [Send] │     │   │
│  │   ...              │  │  │ └──────────────────┘     │   │
│  │                    │  │  └──────────────────────────┘   │
│  │ [Add Feedback]     │  │                                  │
│  │ [Classify with AI] │  │                                  │
│  └────────────────────┘  │                                  │
│                          │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

### 11.3 Mobile Adaptation

```
┌─────────────────────────┐
│ ← Consultation #12      │
├─────────────────────────┤
│ [📄] [🤖] [📸] [💬]    │  ← Tab switcher
├─────────────────────────┤
│                         │
│  Active Tab Content     │
│  (Full-width)           │
│                         │
│  (Document / AI Chat /  │
│   Annotations / DM)     │
│                         │
├─────────────────────────┤
│ ┌─────────────────┐     │
│ │ Type message... │     │
│ │           [Send]│     │
│ └─────────────────┘     │
└─────────────────────────┘
```

---

## 12. PAGE: ARCHIVE

### 12.1 Overview

```
PURPOSE: Browse and search past consultations and files.
DESIGN: Table/card list with filters. Desktop: table. Mobile: cards.
USER FLOW: Browse list → Filter → Select → View details
```

### 12.2 Page Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  📁 Archive                                                 │
│  Browse your past consultations and files                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Search consultations...          [Filter ▼]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Title          │ Date       │ Status    │ Actions   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Upload v3      │ Jan 15     │ Review    │ [View]    │   │
│  │ Upload v2      │ Jan 12     │ Fixed     │ [View]    │   │
│  │ Upload v1      │ Jan 10     │ Done      │ [View]    │   │
│  │ Draft v4       │ Jan 08     │ Done      │ [View]    │   │
│  │ Draft v3       │ Jan 05     │ Done      │ [View]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Showing 1-5 of 12 consultations                            │
│  ← Previous  1  2  3  Next →                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. PAGE: SETTINGS

### 13.1 Overview

```
PURPOSE: Manage profile, security, and AI gateway settings.
DESIGN: Sidebar navigation (desktop) / Tabs (mobile).
USER FLOW: Select setting category → Make changes → Save
```

### 13.2 Sub-pages

```
/settings/profile     — Name, email, avatar, role info
/settings/security    — Password change, 2FA
/settings/ai-gateway  — API keys, model selection, redeem codes
```

### 13.3 Page Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ⚙️ Settings                                                │
│                                                             │
│  ┌──────────────┐ ┌────────────────────────────────────┐   │
│  │              │ │                                    │   │
│  │ Profile ●    │ │  Profile Settings                  │   │
│  │ Security ○   │ │                                    │   │
│  │ AI Gateway ○ │ │  ┌────────────────────────────┐   │   │
│  │              │ │  │ Avatar          [Change]    │   │   │
│  │              │ │  └────────────────────────────┘   │   │
│  │              │ │  ┌────────────────────────────┐   │   │
│  │              │ │  │ Full Name                   │   │   │
│  │              │ │  └────────────────────────────┘   │   │
│  │              │ │  ┌────────────────────────────┐   │   │
│  │              │ │  │ Email                       │   │   │
│  │              │ │  └────────────────────────────┘   │   │
│  │              │ │                                    │   │
│  │              │ │  [Save Changes]                   │   │
│  │              │ │                                    │   │
│  └──────────────┘ └────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 14. PAGE: AI GATEWAY

### 14.1 Overview

```
PURPOSE: Configure AI providers, API keys, and model selection.
DESIGN: Card-based settings with provider logos.
USER FLOW: Select provider → Enter API key → Test connection → Save
```

### 14.2 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🤖 AI Gateway                                              │
│  Configure your AI providers and API keys                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔑 Redeem Code                                      │   │
│  │ ┌──────────────────────────┐ [Activate]             │   │
│  │ │ Enter redeem code...     │                        │   │
│  │ └──────────────────────────┘                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Active Providers                                     │   │
│  │                                                      │   │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐       │   │
│  │ │ Google     │ │ OpenAI     │ │ Anthropic  │       │   │
│  │ │ Gemini     │ │ GPT-4      │ │ Claude     │       │   │
│  │ │ ● Active   │ │ ○ Inactive │ │ ○ Inactive │       │   │
│  │ └────────────┘ └────────────┘ └────────────┘       │   │
│  │                                                      │   │
│  │ ┌────────────┐ ┌────────────┐                       │   │
│  │ │ NVIDIA     │ │ Groq       │                       │   │
│  │ │ NIM        │ │ Whisper    │                       │   │
│  │ │ ○ Inactive │ │ ● Active   │                       │   │
│  │ └────────────┘ └────────────┘                       │   │
│  │                                                      │   │
│  │ Preferred Model: [Gemini 2.0 Flash ▼]               │   │
│  │                                                      │   │
│  │ [Save Configuration]                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 15. COMPONENT LIBRARY

### 15.1 Core Components

```tsx
// src/components/ui/ — Reusable UI primitives

GlassCard.tsx        // Frosted glass card with border
ElegantButton.tsx    // Gradient button with hover/tap states
GradientBackground.tsx // Page background gradient
FloatingOrbs.tsx     // Animated gradient orbs
ScrollReveal.tsx     // Scroll-triggered reveal wrapper
AnimatedBadge.tsx    // Badge with dot animation
ShimmerText.tsx      // Shimmer effect text (web only)
GradientText.tsx     // Gradient-colored text
AnimatedCounter.tsx  // Number counter animation
LoadingScreen.tsx    // Full-page loading spinner
Skeleton.tsx         // Content placeholder
MouseGlow.tsx        // Cursor glow effect (web only)
```

### 15.2 Layout Components

```tsx
// src/components/layout/ — Page layout primitives

NavBar.tsx           // Top navigation bar (glass morphism)
SideBar.tsx          // Collapsible sidebar navigation
BottomTabs.tsx       // Mobile bottom tab navigator
ResponsiveContainer.tsx // Max-width wrapper
PageWrapper.tsx      // Page with background + scroll
```

### 15.3 Section Components

```tsx
// src/components/sections/ — Page-specific sections

HeroSection.tsx      // Landing page hero
StatsBar.tsx         // Animated statistics
FeaturesGrid.tsx     // Bento grid features
HowItWorks.tsx       // Numbered steps
Testimonials.tsx     // Carousel testimonials
CTASection.tsx       // Call-to-action
FAQSection.tsx       // Accordion FAQ
Footer.tsx           // Page footer
```

---

## 16. FILE STRUCTURE

```
tierlog_web/
├── app/
│   ├── _layout.tsx                    # Root layout (AuthProvider, FontSize)
│   ├── index.tsx                      # Landing page
│   ├── login.tsx                      # Login
│   ├── register.tsx                   # Register/Signup
│   ├── (tabs)/
│   │   ├── _layout.tsx               # Tab navigator (mobile)
│   │   ├── dashboard.tsx             # Student dashboard
│   │   ├── consultations.tsx         # Consultation workspace
│   │   ├── archive.tsx               # Archive
│   │   └── settings.tsx              # Settings
│   ├── lecturer-dashboard.tsx        # Lecturer dashboard
│   └── settings/
│       ├── profile.tsx
│       ├── security.tsx
│       └── ai-gateway.tsx
│
├── src/
│   ├── components/
│   │   ├── ui/                        # Reusable UI primitives
│   │   │   ├── GlassCard.tsx
│   │   │   ├── ElegantButton.tsx
│   │   │   ├── GradientBackground.tsx
│   │   │   ├── FloatingOrbs.tsx
│   │   │   ├── ScrollReveal.tsx
│   │   │   ├── AnimatedBadge.tsx
│   │   │   ├── ShimmerText.tsx
│   │   │   ├── GradientText.tsx
│   │   │   ├── AnimatedCounter.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── MouseGlow.tsx
│   │   │
│   │   ├── layout/                    # Layout components
│   │   │   ├── NavBar.tsx
│   │   │   ├── SideBar.tsx
│   │   │   ├── BottomTabs.tsx
│   │   │   ├── ResponsiveContainer.tsx
│   │   │   └── PageWrapper.tsx
│   │   │
│   │   ├── sections/                  # Page sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   ├── FeaturesGrid.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── CTASection.tsx
│   │   │   ├── FAQSection.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   └── shared/                    # Shared feature components
│   │       ├── StatCard.tsx
│   │       ├── ActivityFeed.tsx
│   │       ├── ChatPanel.tsx
│   │       ├── DocumentPanel.tsx
│   │       ├── FeedbackList.tsx
│   │       └── AnnotationViewer.tsx
│   │
│   ├── hooks/
│   │   ├── useResponsive.ts
│   │   ├── useFontSize.ts
│   │   ├── useWebSocket.ts
│   │   └── useAuth.ts
│   │
│   ├── lib/
│   │   ├── animations.ts             # Animation presets
│   │   ├── motion.tsx                 # MotionDiv wrapper
│   │   ├── typography.ts              # Typography classes
│   │   ├── responsive.ts              # Breakpoint utilities
│   │   ├── config.ts                  # API config
│   │   ├── utils.ts                   # Utility functions
│   │   └── storage.ts                 # AsyncStorage helpers
│   │
│   ├── providers/
│   │   └── AuthProvider.tsx
│   │
│   ├── stores/
│   │   ├── ui-store.ts                # Font size, sidebar state
│   │   └── auth-store.ts              # Auth state
│   │
│   └── types.ts                       # TypeScript types
│
├── tailwind.config.js
├── global.css
├── package.json
└── tsconfig.json
```

---

## 17. IMPLEMENTATION PHASES

### Phase 1: Design Foundation (Week 1)

```
Day 1-2: Configuration
  - Update tailwind.config.js with color tokens
  - Setup typography system
  - Create animation presets (src/lib/animations.ts)
  - Create motion wrapper (src/lib/motion.tsx)
  - Setup responsive hooks

Day 3-4: Core UI Components
  - GlassCard
  - ElegantButton (primary, secondary, danger)
  - GradientBackground
  - FloatingOrbs
  - ScrollReveal
  - AnimatedBadge

Day 5: Testing & Validation
  - Test color contrast (WCAG AAA)
  - Test touch targets (44px minimum)
  - Test font scaling (16px → 20px)
  - Visual regression testing
```

### Phase 2: Layout System (Week 2)

```
Day 1-2: Navigation
  - NavBar (glass morphism, responsive)
  - SideBar (collapsible, desktop)
  - BottomTabs (mobile)
  - ResponsiveContainer

Day 3-4: Page Layouts
  - PageWrapper (background + scroll)
  - Student Dashboard layout
  - Lecturer Dashboard layout (3-column)
  - Consultation Workspace layout

Day 5: Integration Testing
  - Test navigation flow
  - Test responsive breakpoints
  - Test role-based layouts
```

### Phase 3: Pages (Week 3-4)

```
Week 3:
  - Landing page (hero + features + stats)
  - Login page
  - Register page
  - Student Dashboard

Week 4:
  - Lecturer Dashboard
  - Consultation Workspace
  - Archive
  - Settings pages
```

### Phase 4: Polish (Week 5)

```
Day 1-2: Animations
  - Scroll-triggered reveals
  - Page transitions
  - Hover effects
  - Loading states

Day 3: Accessibility
  - Screen reader testing
  - Keyboard navigation
  - Font scaling validation
  - Color contrast audit

Day 4-5: Performance
  - Lazy loading
  - Bundle optimization
  - WebSocket reliability
  - Cross-platform testing
```

---

## SUCCESS CRITERIA

```
VISUAL
  ✅ Dark premium aesthetic matching Voxr.ai quality
  ✅ Gradient text, floating orbs, glass morphism
  ✅ Scroll-triggered animations on all sections
  ✅ Consistent design language across all pages

FUNCTIONAL
  ✅ All existing TierLog features preserved
  ✅ Role-based layouts (student vs lecturer)
  ✅ Responsive across mobile, tablet, desktop
  ✅ Font scaling (16px → 20px) working globally

ACCESSIBILITY
  ✅ WCAG AA contrast ratios (4.5:1 minimum)
  ✅ Touch targets 44px minimum
  ✅ Screen reader support
  ✅ Reduced motion support

PERFORMANCE
  ✅ Lighthouse score > 80
  ✅ Load time < 3 seconds
  ✅ 60 FPS animations
  ✅ Smooth scrolling
```

---

**Status:** Ready for Implementation  
**Next Action:** Begin Phase 1 — Design Foundation
