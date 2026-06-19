# TierLog Design System

> **Phase 1** — Apple HIG principles applied to existing dark theme.  
> Hybrid approach: dark palette retained, Apple design discipline adopted.

---

## 1. Design Philosophy

| Principle | Implementation |
|-----------|---------------|
| **Minimalism** | No dramatic backgrounds (shaders, floating shapes, mouse glow). Typography-driven layouts. |
| **Purposeful Motion** | Every animation serves a functional purpose. Apple HIG cubic-bezier easings. 150–400ms durations. |
| **4px Grid** | All spacing, sizing, and border-radius snap to multiples of 4px. |
| **Semantic Tokens** | All colors referenced through `tier-*` tokens — no raw hex in components. |
| **Accessibility** | WCAG contrast compliance. `prefers-reduced-motion` respected. Min 44px touch targets. |
| **Responsive** | 3-tier breakpoints: mobile <768, tablet 768–1023, desktop ≥1024. |

---

## 2. Semantic Color Tokens (`tier.*`)

All tokens defined in `tailwind.config.js` under `theme.colors.tier`.

### Surface & Background

| Token | Hex | Usage |
|-------|-----|-------|
| `tier-bg` | `#020617` | Page background |
| `tier-surface` | `#0F172A` | Cards, panels, elevated surfaces |
| `tier-surface-raised` | `#111B30` | Inputs, dropdown triggers, role switcher |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `tier-text-primary` | `#F8FAFC` | Headlines, body text |
| `tier-text-secondary` | `#94A3B8` | Captions, labels, secondary info |
| `tier-text-tertiary` | `#64748B` | Placeholders, disabled text |
| `tier-text-inverse` | `#FFFFFF` | Text on accent backgrounds |

### Dividers

| Token | Hex | Usage |
|-------|-----|-------|
| `tier-divider-light` | `rgba(255,255,255,0.06)` | Subtle borders, dividers |
| `tier-divider-base` | `rgba(255,255,255,0.10)` | Standard borders |
| `tier-divider-strong` | `rgba(255,255,255,0.15)` | Emphasized borders |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `tier-accent-primary` | `#6366F1` | Primary actions, links, active states |
| `tier-accent-primary-deep` | `#4F46E5` | Pressed/hover primary |
| `tier-accent-violet` | `#A78BFA` | Secondary accent, decorations |
| `tier-accent-cyan` | `#22D3EE` | Info badges, secondary highlights |
| `tier-accent-success` | `#059669` | Success states |
| `tier-accent-caution` | `#D97706` | Warning states |
| `tier-accent-danger` | `#DC2626` | Error borders |
| `tier-accent-danger-bright` | `#EF4444` | Error text |

### Overlays

| Token | Hex | Usage |
|-------|-----|-------|
| `tier-overlay-hover` | `rgba(255,255,255,0.04)` | Hover states |
| `tier-overlay-pressed` | `rgba(255,255,255,0.08)` | Pressed states |
| `tier-overlay-active` | `rgba(255,255,255,0.12)` | Active states |

---

## 3. Typography

### Font Stack

```
font-display: "SF Pro Display", "Inter", system-ui, -apple-system, sans-serif
font-sans:     "SF Pro Text", "Inter", system-ui, -apple-system, sans-serif
```

### Size Scale (defined in tailwind.config.js fontSize)

Each size includes optimal letter-spacing and line-height:

| Class | Size | Tracking | Leading | Usage |
|-------|------|----------|---------|-------|
| `text-xs` | 12px | 0.01em | 16px | Labels, captions |
| `text-sm` | 14px | 0 | 20px | Body text, descriptions |
| `text-base` | 16px | -0.01em | 24px | Standard body |
| `text-lg` | 18px | -0.01em | 28px | Subheadings |
| `text-xl` | 20px | -0.02em | 28px | Section titles |
| `text-2xl` | 24px | -0.02em | 32px | Headings |
| `text-3xl` | 30px | -0.02em | 36px | Display headings |
| `text-4xl` | 36px | -0.02em | 40px | Hero text |
| `text-5xl` | 48px | -0.03em | 48px | Large hero |

### Hierarchy

- **Display**: `font-display font-bold text-tier-text-primary` (hero headings)
- **Heading**: `font-sans font-bold text-tier-text-primary` (section titles)
- **Body**: `text-sm text-tier-text-primary` (paragraphs)
- **Caption**: `text-xs text-tier-text-secondary` (labels, meta)
- **Overline**: `text-[10px] font-black uppercase tracking-[1.5px] text-tier-text-secondary` (badges)

---

## 4. Spacing & Layout

### 4px Grid

```css
/* spacing scale in tailwind.config.js */
spacing: {
  '0.5': '2px',   /* 0.5 × 4 */
  '1':   '4px',   /* 1 × 4 */
  '1.5': '6px',
  '2':   '8px',   /* 2 × 4 */
  '3':   '12px',
  '4':   '16px',
  '6':   '24px',
  '8':   '32px',
  '10':  '40px',
  '12':  '48px',
  '16':  '64px',
}
```

### Border Radius

| Class | Value | Usage |
|-------|-------|-------|
| `rounded-tier-sm` | 4px | Badges, small elements |
| `rounded-tier-md` | 8px | Buttons, inputs |
| `rounded-tier-base` | 10px | Cards |
| `rounded-tier-lg` | 12px | Panels |
| `rounded-tier-xl` | 16px | Large cards |
| `rounded-tier-2xl` | 20px | Modal sheets |
| `rounded-tier-3xl` | 24px | Hero containers |
| `rounded-tier-full` | 9999px | Pills, avatars |

---

## 5. Motion System

### Easing Curves (`motion-config.ts`)

| Name | Value | Usage |
|------|-------|-------|
| `MOTION_EASING.standard` | `[0.25, 0.1, 0.25, 1.0]` | General transitions |
| `MOTION_EASING.decelerate` | `[0.0, 0.0, 0.2, 1.0]` | Elements entering |
| `MOTION_EASING.accelerate` | `[0.4, 0.0, 1.0, 1.0]` | Elements exiting |
| `MOTION_EASING.emphasized` | `[0.2, 0.0, 0.0, 1.0]` | Key moments |

### Durations

| Name | Value | Usage |
|------|-------|-------|
| `MOTION_DURATION.fast` | 150ms | Micro-interactions (hover, press) |
| `MOTION_DURATION.normal` | 250ms | Standard transitions |
| `MOTION_DURATION.gentle` | 350ms | Content appearance |
| `MOTION_DURATION.slow` | 400ms | Complex sequences |

### Presets (`motionPresets`)

```tsx
import { motionPresets, staggerContainer } from "@/src/lib/motion-config";

// Fade up with optional delay
<MotionDiv {...motionPresets.fadeUp(0.1)} />

// Stagger children by 80ms
const container = staggerContainer(80);
```

Available presets: `fadeIn`, `fadeUp`, `slideUp`, `scaleIn`, `interactive` (hover/tap).

### Reduced Motion

```tsx
import { usePrefersReducedMotion } from "@/src/hooks/usePrefersReducedMotion";

const prefersReduced = usePrefersReducedMotion();
// Returns true when user has "reduce motion" enabled
// Always false on native (no web media query support)
```

---

## 6. Responsive System

### Breakpoints (`responsive.ts`)

| Name | Width | Category |
|------|-------|----------|
| `xs` | 320px | Small mobile |
| `sm` | 480px | Standard mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Ultra-wide |

### Hook

```tsx
import { useResponsive } from "@/src/lib/responsive";

const { isMobile, isTablet, isDesktop, screenSize } = useResponsive();
```

---

## 7. UI Store (Zustand v5)

```tsx
import { useUIStore, fontSizeClass } from "@/src/lib/store/ui-store";

// In component:
const fontSize = useUIStore((s) => s.fontSize);
const className = fontSizeClass(); // returns "text-base" or "text-lg"

// Toggle:
useUIStore.getState().setFontSize("large"); // or "normal"
useUIStore.getState().toggleSidebar();
```

Persistence key: `tierlog.ui.v1`. Hydrate on app boot via `useUIStore.getState().hydrate()`.

---

## 8. Component Token Mapping

### GlassCard

```
bg-tier-surface        → card background
border-tier-divider-light → card border
rounded-tier-base      → border radius
shadow-tier-xs (web)   → subtle elevation shadow
```

### ElegantButton

| Tone | Background | Text |
|------|------------|------|
| `primary` | `bg-tier-accent-primary` | `text-tier-text-inverse` |
| `secondary` | `bg-tier-surface-raised` + `border-tier-divider-light` | `text-tier-text-primary` |
| `ghost` | transparent | `text-tier-text-secondary` |
| `danger` | `bg-tier-accent-danger` | `text-tier-text-inverse` |

Min touch targets: sm=44px, md=44px, lg=48px.

### NavBar

```
bg-tier-bg/80 + backdrop-blur-lg → translucent background
border-tier-divider-light         → bottom border
text-tier-text-primary            → active link
text-tier-text-secondary          → inactive link
```

---

## 9. CSS Variables (`global.css`)

Defined as CSS custom properties for non-NativeWind contexts:

```css
--tier-bg: #020617;
--tier-surface: #0F172A;
--tier-text-primary: #F8FAFC;
--tier-text-secondary: #94A3B8;
--tier-accent: #6366F1;
--tier-divider: rgba(255,255,255,0.10);
/* ...and more */
```

Used for: scrollbar colors, selection highlight, autofill, `color-scheme: dark`.

---

## 10. Backward Compatibility

- **Old palette** (`tierlog.*` in tailwind.config.js) is retained — Phase 2 pages still use it.
- **Dramatic component files** are NOT deleted — kept for reference; simply no longer imported.
- **All component APIs** (props, export names) are preserved — no breaking changes for consumers.
- **`motionPresets`** coexists with legacy `animations.ts` presets.

---

## 11. Phase 2 Scope

Pages remaining for token migration:

| Page | File | Notes |
|------|------|-------|
| Dashboard | `app/dashboard.tsx` | Student dashboard |
| Lecturer Dashboard | `app/lecturer-dashboard.tsx` | ~2450 lines, largest file |
| Consultations | `app/consultations.tsx` | Consultation detail |
| Archive | `app/archive.tsx` | Archive view |
| Profile Settings | `app/settings/profile.tsx` | |
| Security Settings | `app/settings/security.tsx` | |
| AI Gateway | `app/settings/ai-gateway.tsx` | |
| Settings Layout | `app/(tabs)/settings.tsx` | Tab layout |
| Tab Bar | `app/(tabs)/_layout.tsx` | Tab bar colors still hardcoded |

Each page: replace hardcoded hex/opacity with `tier-*` tokens, remove any dramatic component imports, apply motion presets where appropriate.

---

## 12. File Inventory (Phase 1 Changes)

| File | Status |
|------|--------|
| `tailwind.config.js` | ✅ Rewritten — semantic tokens, motion, spacing, shadows |
| `global.css` | ✅ Rewritten — CSS variables, scrollbar, selection |
| `src/lib/motion-config.ts` | ✅ New — Apple HIG easings, presets |
| `src/lib/responsive.ts` | ✅ New — breakpoints + hook |
| `src/hooks/usePrefersReducedMotion.ts` | ✅ New — accessibility |
| `src/lib/store/ui-store.ts` | ✅ New — Zustand v5 UI store |
| `src/components/ui/elegant-button.tsx` | ✅ Refactored — tokens, min touch targets |
| `src/components/ui/glass-card.tsx` | ✅ Refactored — tokens, Apple elevation |
| `src/components/ui.tsx` | ✅ Refactored — tokens, voided dramatic imports |
| `src/components/NavBar.tsx` | ✅ Refactored — tokens, Apple transitions |
| `src/components/ui/auth-page-layout.tsx` | ✅ Refactored — tokens, removed GradientBackground/FloatingShapes |
| `app/index.tsx` | ✅ Refactored — typography-driven hero |
| `app/login.tsx` | ✅ Refactored — tokens, removed AnimatedBadge/TextReveal |
| `app/register.tsx` | ✅ Refactored — tokens, removed AnimatedBadge/GradientText |
