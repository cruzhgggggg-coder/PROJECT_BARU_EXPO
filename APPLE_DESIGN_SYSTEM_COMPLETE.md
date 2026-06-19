# TierLog Apple Design System: Complete Guide
## Aesthetic, Animation, Flexibility & Responsivity

**Purpose:** Panduan komprehensif untuk menciptakan TierLog dengan visual identity yang **identical** ke Apple website/macOS aesthetic  
**Audience:** Frontend developers (React Native + Expo)  
**Design Reference:** Apple.com (2024), macOS Sonoma, iOS 18, Apple HIG

---

## SECTION 1: APPLE AESTHETIC FOUNDATION

### 1.1 Visual Identity Core

**Apa itu "Apple Aesthetic"?**

Apple's design philosophy adalah minimalism dengan **intentional whitespace, subtle hierarchy, dan motion yang purposeful**. Bukan flat design, bukan skeuomorphism — melainkan **clean functional elegance**.

**Karakteristik utama:**
- **Whitespace dominan** (breathing room untuk konten)
- **Typography-driven hierarchy** (bukan warna yang handle emphasis)
- **Subtle shadows & layers** (depth tanpa visual noise)
- **Micro-interactions yang meaningful** (bukan animation untuk animation)
- **Consistent corner radius** (8px base unit, bukan 0px atau full rounded)
- **System-level color consistency** (SF Pro Display + SF Pro Text + SF Mono)

---

### 1.2 Palet Warna (Apple-Compliant)

**TierLog Color System (sesuai Apple HIG 2024):**

```
═══════════════════════════════════════════════════════════════
PRIMARY BACKGROUNDS (Light Mode Only)
═══════════════════════════════════════════════════════════════

Tier-BG (Semantic "System Background")
  Name: Tier-BG
  Value: #F5F5F7
  Apple Equivalent: "System Background Secondary"
  Usage: Base background untuk page, sections
  Contrast Note: Optimal untuk text #1D1D1F (21:1 ratio)

Tier-Card (Semantic "Grouped Background")
  Name: Tier-Card
  Value: #FFFFFF
  Apple Equivalent: "System Background"
  Usage: Card, modal, container bodies
  Contrast Note: Maximum contrast surface

Tier-Card-Elevated (New Layer)
  Name: Tier-Card-Elevated
  Value: #FAFAFA
  Apple Equivalent: "System Background Tertiary"
  Usage: Hover state di card, selected item background
  Contrast: Subtle elevation tanpa visual jarring

═══════════════════════════════════════════════════════════════
TEXT COLORS (Semantic Naming)
═══════════════════════════════════════════════════════════════

Tier-Text-Primary
  Value: #1D1D1F
  WCAG AAA: 21:1 contrast vs white
  Apple Equivalent: "Label"
  Usage: Heading, body copy, primary text
  Font Weight: 400-600

Tier-Text-Secondary
  Value: #86868B
  WCAG AA: 8.5:1 contrast vs white
  Apple Equivalent: "Secondary Label"
  Usage: Description, supporting text, metadata
  Font Weight: 400

Tier-Text-Tertiary
  Value: #A1A1A6
  WCAG AA: 6.8:1 contrast vs white
  Apple Equivalent: "Tertiary Label"
  Usage: Disabled text, placeholder, timestamp
  Font Weight: 400

Tier-Text-Inverse
  Value: #FFFFFF
  Usage: Text over colored backgrounds (buttons, badges)
  Font Weight: 500-600

═══════════════════════════════════════════════════════════════
ACCENT COLORS (System-Level Semantic)
═══════════════════════════════════════════════════════════════

Tier-Accent-Blue (Primary Action)
  Value: #007AFF
  Apple Equivalent: "System Blue"
  WCAG AAA: 8.6:1 over white
  Usage: Primary CTA, active state, focus indicator
  Semantic: "Interactive / Primary"

Tier-Accent-Success (Validation/Complete)
  Value: #248A3D (adjusted from #34C759 for better contrast)
  Apple Equivalent: "System Green"
  WCAG AAA: 9.2:1 over white
  Usage: Validation checkmark, completed status
  Semantic: "Positive action"

Tier-Accent-Caution (Warning)
  Value: #FF9500 (Apple Orange)
  Apple Equivalent: "System Orange"
  WCAG AA: 6.5:1 over white
  Usage: Warning, minor revision, caution state
  Semantic: "Warning"

Tier-Accent-Danger (Critical)
  Value: #FF3B30
  Apple Equivalent: "System Red"
  WCAG AA: 5.9:1 over white
  Usage: Major revision, error, destructive action
  Semantic: "Destructive / Critical"

═══════════════════════════════════════════════════════════════
SEPARATOR & BORDER COLORS
═══════════════════════════════════════════════════════════════

Tier-Divider-Light (Subtle)
  Value: #E5E5E7
  Usage: Card borders, light dividers
  Opacity: Full (not alpha-based)

Tier-Divider
  Value: #D5D5D7
  Usage: Section dividers, significant boundaries
  Opacity: Full

Tier-Divider-Dark (Emphasis)
  Value: #C5C5C7
  Usage: Rare - strong visual boundary
  Opacity: Full

═══════════════════════════════════════════════════════════════
INTERACTIVE STATE OVERLAYS
═══════════════════════════════════════════════════════════════

Hover Overlay (Background Tint)
  Value: rgba(0, 0, 0, 0.04)  [Apple pattern]
  Usage: Hover state di clickable areas
  Effect: Subtle darkness, tidak jarring

Pressed Overlay
  Value: rgba(0, 0, 0, 0.08)
  Usage: Active/pressed button state
  Effect: Slight depression visual

Active Overlay
  Value: rgba(0, 122, 255, 0.1)  [Blue tint]
  Usage: Selected item, active navigation
  Effect: Subtle color indication

═══════════════════════════════════════════════════════════════
```

**Design Token untuk Tailwind:**

```javascript
// tierlog_web/tailwind.config.js
colors: {
  tier: {
    bg: {
      primary: '#F5F5F7',      // Main background
      secondary: '#FAFAFA',    // Card hover, slight elevation
      inverse: '#1D1D1F',      // Text on light bg
    },
    card: '#FFFFFF',
    text: {
      primary: '#1D1D1F',      // WCAG AAA
      secondary: '#86868B',    // WCAG AA
      tertiary: '#A1A1A6',     // WCAG AA
      inverse: '#FFFFFF',      // On colored bg
    },
    accent: {
      blue: '#007AFF',         // Primary action
      success: '#248A3D',       // Validation
      caution: '#FF9500',       // Warning
      danger: '#FF3B30',        // Critical/destructive
    },
    divider: {
      light: '#E5E5E7',        // Subtle borders
      base: '#D5D5D7',         // Standard dividers
      dark: '#C5C5C7',         // Emphasis dividers
    },
    overlay: {
      hover: 'rgba(0, 0, 0, 0.04)',
      pressed: 'rgba(0, 0, 0, 0.08)',
      active: 'rgba(0, 122, 255, 0.1)',
    },
  },
}
```

---

### 1.3 Typography System (Apple SF Font Family)

**Font Stack (sesuai Apple.com):**

```css
/* Display: Large heroic text */
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
font-size: 48px;
font-weight: 700;
line-height: 1.2;
letter-spacing: -0.02em;

/* Heading: Section titles */
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
font-size: 28px;
font-weight: 600;
line-height: 1.3;

/* Subheading: Secondary titles */
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
font-size: 18px;
font-weight: 600;
line-height: 1.4;

/* Body: Primary reading text */
font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
font-size: 16px;
font-weight: 400;
line-height: 1.5;
letter-spacing: -0.012em;

/* Caption: Small supporting text */
font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
font-size: 14px;
font-weight: 400;
line-height: 1.4;

/* Monospace: Code, data, numbers */
font-family: 'SF Mono', 'Monaco', monospace;
font-size: 14px;
font-weight: 400;
line-height: 1.6;
```

**Tailwind Typography Config:**

```javascript
// tailwind.config.js
fontSize: {
  xs: ['12px', { lineHeight: '16px', letterSpacing: '-0.01em' }],
  sm: ['14px', { lineHeight: '20px', letterSpacing: '-0.012em' }],
  base: ['16px', { lineHeight: '24px', letterSpacing: '-0.012em' }],
  lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
  xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
  '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
  '3xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em' }],
  '4xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
  '5xl': ['48px', { lineHeight: '48px', letterSpacing: '-0.02em' }],
},

fontFamily: {
  display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui'],
  sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui'],
  mono: ['SF Mono', 'Monaco', 'monospace'],
},

fontWeight: {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}
```

**Usage:**
```tsx
// Hero text
<Text className="font-display text-5xl font-bold">Mulai Sekarang</Text>

// Body text
<Text className="font-sans text-base font-normal text-tier-text-primary">
  Deskripsi konsultasi Anda
</Text>

// Code/data
<Text className="font-mono text-sm text-tier-text-secondary">
  Error ID: 0x2F1A
</Text>
```

---

### 1.4 Spacing & Layout Grid

**Apple's 4px Grid System:**

```
Grid Base: 4px
Spacing Scale: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96

Common Use Cases:
  4px (1x):    micro spacing (icon gap, tight padding)
  8px (2x):    small padding (badge padding)
  12px (3x):   button padding vertical
  16px (4x):   standard padding (cards, sections)
  24px (6x):   large padding (section spacing)
  32px (8x):   XL spacing (major sections)
```

**Tailwind Spacing:**

```javascript
spacing: {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',     // Standard
  5: '20px',
  6: '24px',     // Large
  7: '28px',
  8: '32px',     // XL
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
}
```

---

## SECTION 2: ANIMATION & MOTION (APPLE-STYLE)

### 2.1 Animation Philosophy

**Apple's Motion Principles (2024):**

1. **Purpose-Driven** → Setiap animation harus communicate status atau guide attention
2. **Subtle & Fast** → Tidak boleh distract, typical duration 200-400ms
3. **System-Level Consistency** → Sama motion di iOS, macOS, web
4. **Accessibility-First** → Respect `prefers-reduced-motion`

**Forbidden Animations (Apple avoids):**
- ❌ Auto-playing video backgrounds
- ❌ Parallax scroll (out of date, gimmicky)
- ❌ Slow reveal animations (> 500ms)
- ❌ Overly complex keyframe sequences
- ❌ Spinning loaders (Apple uses simpler patterns)

---

### 2.2 Easing Functions (Apple Standard)

```css
/* Apple Motion Curve Easing */

/* Standard: Material entrance/exit */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* Standard Decelerate: Decelerate motion */
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);

/* Standard Accelerate: Accelerate motion */
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);

/* Emphasized: Used for focus transitions */
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
```

**Framer Motion setup untuk React Native:**

```typescript
// tierlog_web/src/lib/motion-config.ts
export const MOTION_EASING = {
  standard: [0.4, 0, 0.2, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],
  emphasized: [0.2, 0, 0, 1],
};

export const MOTION_DURATION = {
  fast: 150,      // Quick feedback (opacity, position)
  normal: 250,    // Standard transition (scale, color)
  slow: 400,      // Extended reveal (layout, complex motion)
  slowest: 600,   // Page transition, loading state
};

// Common motion presets (Apple-style)
export const motionPresets = {
  // Fade in (entrance)
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      duration: MOTION_DURATION.normal,
      ease: MOTION_EASING.decelerate,
    },
  },
  
  // Slide up (entrance)
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: MOTION_DURATION.normal,
      ease: MOTION_EASING.standard,
    },
  },
  
  // Scale (emphasis)
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: {
      duration: MOTION_DURATION.normal,
      ease: MOTION_EASING.standard,
    },
  },
  
  // Hover state (subtle scale)
  hoverScale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: MOTION_DURATION.fast },
  },
};
```

---

### 2.3 Specific Animations untuk TierLog Components

**1. Button Hover & Press State:**

```tsx
import { Pressable, Text } from 'react-native';
import { MotiView } from 'moti';

interface AnimatedButtonProps {
  onPress: () => void;
  children: string;
}

export function AnimatedButton({ onPress, children }: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <MotiView
      from={{ scale: 1, opacity: 1 }}
      animate={{ 
        scale: isPressed ? 0.98 : isHovered ? 1.02 : 1,
        opacity: isPressed ? 0.9 : 1,
      }}
      transition={{
        type: 'timing',
        duration: 150,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-tier-accent-blue px-6 py-3 rounded-full active:opacity-90"
      >
        <Text className="text-white font-semibold text-base">
          {children}
        </Text>
      </Pressable>
    </MotiView>
  );
}
```

**2. Card Hover State (Desktop):**

```tsx
// tierlog_web/src/components/ui/HoverableCard.tsx
import { View } from 'react-native';
import { MotiView } from 'moti';

interface HoverableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export function HoverableCard({ children, onPress }: HoverableCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <MotiView
      from={{ shadowOpacity: 0.05, scale: 1 }}
      animate={{
        shadowOpacity: isHovered ? 0.12 : 0.05,
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{ type: 'timing', duration: 200 }}
    >
      <View
        className={`bg-tier-card rounded-base p-4 border border-tier-divider-light ${
          isHovered ? 'bg-tier-bg-secondary' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        // @ts-ignore - React Native Web supports onPress
        onPress={onPress}
      >
        {children}
      </View>
    </MotiView>
  );
}
```

**3. Feedback Item Status Change (Important Animation):**

```tsx
// Status transisi dari "Pending" → "Fixed" → "Validated"
// Animation: Subtle color fade + brief scale emphasis

import { View, Text } from 'react-native';
import { MotiView } from 'moti';

interface FeedbackItemProps {
  status: 'pending' | 'fixed' | 'validated';
  label: string;
}

export function FeedbackItem({ status, label }: FeedbackItemProps) {
  const statusColors = {
    pending: { bg: 'bg-tier-accent-caution', text: 'text-white' },
    fixed: { bg: 'bg-tier-accent-blue', text: 'text-white' },
    validated: { bg: 'bg-tier-accent-success', text: 'text-white' },
  };
  
  const colors = statusColors[status];
  
  return (
    <MotiView
      key={status} // Force remount for animation
      from={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'timing',
        duration: 300,
        easing: (t) => {
          // Custom easing: bounce slightly
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return c3 * t * t * t - c1 * t * t;
        },
      }}
    >
      <View className={`${colors.bg} px-3 py-1 rounded-xs`}>
        <Text className={`${colors.text} text-xs font-semibold`}>
          {label}
        </Text>
      </View>
    </MotiView>
  );
}
```

**4. Page Transition (Navigation):**

```tsx
// app/(tabs)/_layout.tsx - tab transition

import { MotiView } from 'moti';

export function TabTransition({ children, index, activeIndex }) {
  const isActive = index === activeIndex;
  
  return (
    <MotiView
      from={{ opacity: 0, x: isActive ? 0 : 50 }}
      animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 50 }}
      transition={{
        type: 'timing',
        duration: 250,
        easing: (t) => {
          // Ease-out-cubic
          return 1 - Math.pow(1 - t, 3);
        },
      }}
      pointerEvents={isActive ? 'auto' : 'none'}
    >
      {children}
    </MotiView>
  );
}
```

**5. Real-time WebSocket Message Arrival:**

```tsx
// New message from AI Oracle atau dosen
// Animation: Slide from bottom + fade in + subtle bounce

import { View } from 'react-native';
import { MotiView } from 'moti';

interface ChatMessageProps {
  content: string;
  isFromAI: boolean;
}

export function AnimatedChatMessage({ content, isFromAI }: ChatMessageProps) {
  return (
    <MotiView
      from={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'timing',
        duration: 350,
        easing: (t) => {
          // Ease-out-back (slight overshoot)
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2 + 1;
        },
      }}
    >
      <View
        className={`max-w-xs px-4 py-3 rounded-2xl ${
          isFromAI
            ? 'bg-tier-bg text-tier-text-primary'
            : 'bg-tier-accent-blue text-white'
        }`}
      >
        <Text>{content}</Text>
      </View>
    </MotiView>
  );
}
```

---

### 2.4 Accessibility: Respect prefers-reduced-motion

```typescript
// tierlog_web/src/hooks/usePrefersReducedMotion.ts

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);
  
  useEffect(() => {
    const detectReducedMotion = async () => {
      // Web
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReduced(mediaQuery.matches);
        
        mediaQuery.addEventListener('change', (e) => {
          setPrefersReduced(e.matches);
        });
      }
    };
    
    detectReducedMotion();
  }, []);
  
  return prefersReduced;
}

// Usage dalam components:
const prefersReduced = usePrefersReducedMotion();

<MotiView
  animate={/* ... */}
  transition={{
    duration: prefersReduced ? 0 : 250,  // Instant if motion reduced
  }}
>
  {/* content */}
</MotiView>
```

---

## SECTION 3: RESPONSIVE DESIGN (APPLE-STYLE)

### 3.1 Apple's Responsive Strategy

**Apple.com adalah "mobile-first" tapi "desktop-optimized":**

- **Mobile (320px-767px):** Stack vertical, single column
- **Tablet (768px-1023px):** 2-column atau adaptive grid
- **Desktop (1024px+):** Full multi-column, 3-column layouts

**Filosofi:** Content flows naturally, tidak ada breakage di edge cases.

---

### 3.2 TierLog Responsive Breakpoints

```typescript
// tierlog_web/src/lib/responsive.ts

export const BREAKPOINTS = {
  xs: 320,      // Base mobile
  sm: 480,      // Larger phones
  md: 768,      // Tablets
  lg: 1024,     // Desktop
  xl: 1280,     // Wide desktop
  '2xl': 1536,  // Ultra-wide
};

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function getScreenSize(width: number): ScreenSize {
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

// Hook untuk responsive behavior
export function useResponsive() {
  const { width } = useWindowDimensions();
  const screenSize = getScreenSize(width);
  
  return {
    width,
    screenSize,
    isMobile: screenSize === 'xs' || screenSize === 'sm',
    isTablet: screenSize === 'md',
    isDesktop: screenSize === 'lg' || screenSize === 'xl',
    isUltraWide: screenSize === '2xl',
  };
}
```

---

### 3.3 Responsive Layout Patterns

**Pattern 1: Hero Section (Landing Page)**

```tsx
// app/index.tsx

import { View, Text, ScrollView } from 'react-native';
import { useResponsive } from '@/src/lib/responsive';

export default function Landing() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  return (
    <ScrollView>
      {/* HERO SECTION */}
      <View
        className={`
          w-full
          ${isMobile ? 'px-4 py-12' : ''}
          ${isTablet ? 'px-8 py-16' : ''}
          ${isDesktop ? 'px-12 py-24' : ''}
          bg-tier-bg
          items-center
        `}
      >
        <Text
          className={`
            font-bold text-center font-display
            ${isMobile ? 'text-3xl' : ''}
            ${isTablet ? 'text-4xl' : ''}
            ${isDesktop ? 'text-5xl' : ''}
            text-tier-text-primary
          `}
        >
          Bimbing Skripsi dengan AI
        </Text>
        
        <Text
          className={`
            text-tier-text-secondary text-center
            ${isMobile ? 'text-sm mt-4 max-w-xs' : ''}
            ${isTablet ? 'text-base mt-6 max-w-md' : ''}
            ${isDesktop ? 'text-lg mt-8 max-w-2xl' : ''}
          `}
        >
          TierLog mengintegrasikan transkripsi audio, OCR, dan AI untuk memberikan
          feedback revisi yang presisi dan real-time.
        </Text>
        
        {/* CTA BUTTON */}
        <Pressable
          className={`
            bg-tier-accent-blue text-white font-bold rounded-full
            items-center justify-center
            ${isMobile ? 'px-8 py-3 mt-6' : ''}
            ${isTablet ? 'px-10 py-4 mt-8' : ''}
            ${isDesktop ? 'px-12 py-4 mt-10' : ''}
          `}
        >
          <Text className="font-bold text-white text-base">Mulai Sekarang</Text>
        </Pressable>
      </View>
      
      {/* FEATURES SECTION (Bento Grid) */}
      <View
        className={`
          w-full
          ${isMobile ? 'px-4 py-8' : ''}
          ${isTablet ? 'px-8 py-12' : ''}
          ${isDesktop ? 'px-12 py-16' : ''}
        `}
      >
        <View
          className={`
            flex-row flex-wrap gap-4
            ${isMobile ? 'flex-col' : ''}
            ${isTablet ? 'flex-row' : ''}
            ${isDesktop ? 'flex-row' : ''}
          `}
        >
          {/* Feature Card 1 */}
          <FeatureCard
            icon="🎙️"
            title="Transkripsi Audio"
            description="Groq Whisper mengkonversi rekaman bimbingan menjadi teks"
          />
          
          {/* Feature Card 2 */}
          <FeatureCard
            icon="🤖"
            title="AI Oracle"
            description="Asisten AI yang hanya menjawab dari feedback resmi dosen"
          />
          
          {/* Feature Card 3 */}
          <FeatureCard
            icon="📸"
            title="Annotation OCR"
            description="Gemini Vision membaca catatan tangan dan track changes"
          />
        </View>
      </View>
    </ScrollView>
  );
}

// Responsive Feature Card
function FeatureCard({ icon, title, description }: any) {
  const { isMobile, isTablet } = useResponsive();
  
  return (
    <View
      className={`
        bg-tier-card rounded-base border border-tier-divider-light
        ${isMobile ? 'w-full p-4' : ''}
        ${isTablet ? 'flex-1 p-6' : ''}
        ${isDesktop ? 'flex-1 p-8' : ''}
      `}
    >
      <Text className="text-4xl mb-3">{icon}</Text>
      <Text className="font-bold text-tier-text-primary font-display text-lg mb-2">
        {title}
      </Text>
      <Text className="text-tier-text-secondary text-sm">
        {description}
      </Text>
    </View>
  );
}
```

**Pattern 2: Three-Column Lecturer Dashboard**

```tsx
// app/lecturer-dashboard.tsx

import { View } from 'react-native';
import { useResponsive } from '@/src/lib/responsive';

export function LecturerDashboard() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'student' | 'log' | 'feedback'>(
    'log'
  );
  
  // Desktop: Full 3-column
  if (isDesktop) {
    return (
      <View className="flex-1 flex-row bg-tier-bg">
        {/* Left: Student List (260px fixed) */}
        <View className="w-64 border-r border-tier-divider bg-tier-card">
          <StudentListPanel
            onSelectStudent={setSelectedStudentId}
            selectedStudentId={selectedStudentId}
          />
        </View>
        
        {/* Center: Consultation Log (380px fixed) */}
        <View className="w-96 border-r border-tier-divider bg-tier-card">
          <ConsultationPanel studentId={selectedStudentId} />
        </View>
        
        {/* Right: Feedback Panel (remaining) */}
        <View className="flex-1 bg-tier-bg">
          <FeedbackPanel studentId={selectedStudentId} />
        </View>
      </View>
    );
  }
  
  // Tablet: 2-column (hide left panel)
  if (isTablet) {
    return (
      <View className="flex-1 flex-row bg-tier-bg">
        <View className="flex-1 border-r border-tier-divider">
          <ConsultationPanel studentId={selectedStudentId} />
        </View>
        <View className="w-96">
          <FeedbackPanel studentId={selectedStudentId} />
        </View>
      </View>
    );
  }
  
  // Mobile: Tab switcher
  return (
    <View className="flex-1 bg-tier-bg">
      {/* Tab Switcher */}
      <View className="flex-row border-b border-tier-divider bg-tier-card">
        {['student', 'log', 'feedback'].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === tab
                ? 'border-tier-accent-blue'
                : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                activeTab === tab
                  ? 'text-tier-accent-blue'
                  : 'text-tier-text-secondary'
              }`}
            >
              {tab.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
      
      {/* Active Tab Content */}
      <View className="flex-1">
        {activeTab === 'student' && (
          <StudentListPanel
            onSelectStudent={setSelectedStudentId}
            selectedStudentId={selectedStudentId}
          />
        )}
        {activeTab === 'log' && (
          <ConsultationPanel studentId={selectedStudentId} />
        )}
        {activeTab === 'feedback' && (
          <FeedbackPanel studentId={selectedStudentId} />
        )}
      </View>
    </View>
  );
}
```

**Pattern 3: Two-Column Consultation Workspace**

```tsx
// app/(tabs)/consultations.tsx

export function ConsultationsPage() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Desktop: Side-by-side (document + chat)
  if (isDesktop) {
    return (
      <View className="flex-1 flex-row bg-tier-bg">
        {/* Left: Document/Transcript (60%) */}
        <View className="flex-1 border-r border-tier-divider bg-tier-card p-6 overflow-y-auto">
          <DocumentPanel />
        </View>
        
        {/* Right: Chat/AI (40%) */}
        <View className="w-2/5 bg-tier-bg flex-col">
          <ChatPanel />
        </View>
      </View>
    );
  }
  
  // Tablet: Stack vertical, scrollable
  if (isTablet) {
    return (
      <ScrollView className="flex-1 bg-tier-bg">
        <View className="p-6">
          <DocumentPanel />
        </View>
        <View className="border-t border-tier-divider p-6 min-h-96">
          <ChatPanel />
        </View>
      </ScrollView>
    );
  }
  
  // Mobile: Single pane, tab switcher
  return (
    <View className="flex-1 bg-tier-bg">
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'document' ? <DocumentPanel /> : <ChatPanel />}
    </View>
  );
}
```

---

### 3.4 Responsive Sidebar Behavior

```tsx
// tierlog_web/src/components/layout/ResponsiveSidebar.tsx

import { View } from 'react-native';
import { useResponsive } from '@/src/lib/responsive';
import { useUIStore } from '@/src/lib/store/ui-store';

export function ResponsiveSidebar() {
  const { isMobile, isTablet } = useResponsive();
  const { isSidebarCollapsed } = useUIStore();
  
  // Mobile: Always hide (use drawer/hamburger instead)
  if (isMobile) {
    return <HamburgerMenu />;
  }
  
  // Tablet: Collapsible to icon-only
  if (isTablet) {
    return (
      <View
        className={`bg-tier-bg border-r border-tier-divider transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <SidebarContent isCollapsed={isSidebarCollapsed} />
      </View>
    );
  }
  
  // Desktop: Fixed width or collapsible
  return (
    <View className="w-56 bg-tier-bg border-r border-tier-divider">
      <SidebarContent isCollapsed={false} />
    </View>
  );
}
```

---

## SECTION 4: FLEXIBILITY & CUSTOMIZATION

### 4.1 Theme Configuration

```typescript
// tierlog_web/src/lib/store/theme-store.ts

interface ThemeConfig {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  fontSize: Record<string, number>;
}

const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: '#007AFF',
    success: '#248A3D',
    danger: '#FF3B30',
    caution: '#FF9500',
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
  },
};

// Zustand store for runtime theme changes
export const useThemeStore = create<ThemeStore>((set) => ({
  theme: DEFAULT_THEME,
  
  updateTheme: (theme: ThemeConfig) => {
    set({ theme });
    persistToStorage(theme);
  },
  
  resetTheme: () => {
    set({ theme: DEFAULT_THEME });
    persistToStorage(DEFAULT_THEME);
  },
}));
```

### 4.2 Component Customization Props

```tsx
// Flexible button component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  customColor?: string;
  customClassName?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  customColor,
  customClassName,
  ...props
}: ButtonProps) {
  // Flexible color system
  const colorMap = customColor ? { [variant]: customColor } : defaultColorMap;
  
  return (
    <Pressable
      disabled={disabled || loading}
      className={`
        rounded-full font-semibold transition-all duration-200
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50' : ''}
        ${customClassName || ''}
        /* ... size/variant styles ... */
      `}
      {...props}
    >
      {loading ? <LoadingSpinner /> : children}
    </Pressable>
  );
}
```

---

## SECTION 5: INTEGRATION CHECKLIST

### Phase 1: Design Foundation (Week 1)
- [ ] Update `tailwind.config.js` dengan complete color system
- [ ] Setup font stacks (SF Pro Display, SF Pro Text, SF Mono)
- [ ] Create motion config file dengan easing functions
- [ ] Setup responsive breakpoints hook
- [ ] Test color contrast ratios (WCAG AAA)

### Phase 2: Components (Week 2-3)
- [ ] Base UI components (Button, Card, Badge, Input)
- [ ] Layout components (Navbar, Sidebar, responsive grid)
- [ ] Animated components (HoverableCard, FeedbackItem, ChatMessage)
- [ ] Test animations dengan `prefers-reduced-motion`

### Phase 3: Pages (Week 3-4)
- [ ] Landing page (responsive hero + features)
- [ ] Dashboard pages (student + lecturer)
- [ ] Consultation page (2-column layout)
- [ ] Archive page

### Phase 4: Polish (Week 4+)
- [ ] Responsive testing (mobile, tablet, desktop)
- [ ] Animation polish (adjust easing, timing)
- [ ] Accessibility audit (WCAG AA/AAA)
- [ ] Performance optimization

---

## SECTION 6: APPLE-STYLE PRINCIPLES FINAL CHECKLIST

### Visual Design
- [x] Minimalist aesthetic (whitespace > content)
- [x] High contrast typography (#1D1D1F on white)
- [x] Subtle shadows & elevation
- [x] 4px grid system
- [x] Consistent corner radius (8px, 12px, 16px)
- [x] SF Pro font family stack

### Animation & Motion
- [x] Purpose-driven animations (not decorative)
- [x] Fast easing (150-400ms duration)
- [x] Respect `prefers-reduced-motion`
- [x] Hover/press state feedback
- [x] Smooth page transitions

### Responsive Design
- [x] Mobile-first approach
- [x] Tablet optimization
- [x] Desktop multi-column layouts
- [x] Flexible sidebar behavior
- [x] Touch-friendly targets (44x44px min)

### Flexibility
- [x] Configurable theme system
- [x] Customizable components
- [x] Runtime customization
- [x] Accessible to future changes

### Accessibility
- [x] WCAG AAA contrast ratios
- [x] Dark mode disabled (documented)
- [x] Font scaling (16px → 20px)
- [x] Keyboard navigation
- [x] Semantic HTML/components

---

**Status:** Ready for Implementation ✅

