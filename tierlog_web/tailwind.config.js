/**
 * TierLog Tailwind Config — Apple-style design token system.
 *
 * Strategy (Phase 1, "hybrid"):
 *   - Keep the existing `tierlog.*` dark palette for backward-compat with
 *     pages not yet converted (Phase 2). Do NOT remove it.
 *   - Add a semantic `tier.*` token system: bg / surface / text / divider /
 *     accent / overlay. Values are dark-friendly (we deliberately keep the
 *     dark theme) but CENTRALIZED — no more hex literals scattered in JSX.
 *   - Apply Apple HIG discipline on top: 4px spacing grid, typography scale
 *     with letter-spacing & line-height per size, consistent corner radius,
 *     subtle elevation shadows, SF Pro font stack.
 *
 * Usage:
 *   bg-tier-surface  text-tier-text-primary  border-tier-divider-light
 *   text-tier-accent-primary  rounded-base  shadow-tier-card
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // ── Semantic Color Token System ────────────────────────────────
      // (Centralized dark-friendly palette. Replace hex literals in JSX.)
      colors: {
        // TierLog semantic tokens (Voxr.ai-inspired, dark premium)
        tier: {
          // Backgrounds
          bg: {
            DEFAULT: "#020617",
            secondary: "#0F172A",
            elevated: "#1E293B",
            glass: "rgba(15, 23, 42, 0.8)",
          },
          // Compatibility background aliases
          surface: "#0F172A",
          "surface-raised": "#111B30",
          "surface-sunken": "#0A1120",
          "bg-deep": "#010305",

          // Text
          text: {
            primary: "#F8FAFC",
            secondary: "#94A3B8",
            tertiary: "#64748B",
            inverse: "#020617",
          },

          // Accents
          accent: {
            primary: "#6366F1",
            "primary-deep": "#4F46E5",
            indigo: "#6366F1",
            "indigo-deep": "#4F46E5",
            violet: "#8B5CF6",
            rose: "#F43F5E",
            emerald: "#10B981",
            amber: "#F59E0B",
            cyan: "#06B6D4",
            blue: "#3B82F6",
            success: "#10B981",
            caution: "#F59E0B",
            danger: "#F43F5E",
            "danger-bright": "#F43F5E",
          },
          // Compatibility accent aliases
          "accent-primary": "#6366F1",
          "accent-primary-deep": "#4F46E5",
          "accent-violet": "#8B5CF6",
          "accent-rose": "#F43F5E",
          "accent-emerald": "#10B981",
          "accent-amber": "#F59E0B",
          "accent-cyan": "#06B6D4",
          "accent-blue": "#3B82F6",
          "accent-danger": "#F43F5E",
          "accent-danger-bright": "#F43F5E",

          // Borders
          border: {
            subtle: "rgba(255, 255, 255, 0.06)",
            light: "rgba(255, 255, 255, 0.10)",
            medium: "rgba(255, 255, 255, 0.15)",
            strong: "rgba(255, 255, 255, 0.20)",
          },
          // Compatibility divider aliases
          divider: {
            light: "rgba(255, 255, 255, 0.08)",
            base: "rgba(255, 255, 255, 0.12)",
            strong: "rgba(255, 255, 255, 0.18)",
          },
        },

        // Legacy palette — RETAINED for backward-compat
        tierlog: {
          bg: "#030303",
          "bg-deep": "#020617",
          panel: "#0F172A",
          indigo: "#6366F1",
          "indigo-deep": "#4F46E5",
          rose: "#F43F5E",
          violet: "#8B5CF6",
          cyan: "#06B6D4",
          amber: "#F59E0B",
        },
      },

      // ── Typography (Apple SF Pro stack, with per-size tracking) ─────
      fontFamily: {
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
        mono: ["SF Mono", "Monaco", "Menlo", "Consolas", "monospace"],
      },

      // Per-size letterSpacing + lineHeight (Apple HIG discipline)
      fontSize: {
        xs: ["12px", { lineHeight: "16px", letterSpacing: "-0.01em" }],
        sm: ["14px", { lineHeight: "20px", letterSpacing: "-0.012em" }],
        base: ["16px", { lineHeight: "24px", letterSpacing: "-0.012em" }],
        lg: ["18px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        xl: ["20px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        "2xl": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em" }],
        "3xl": ["28px", { lineHeight: "36px", letterSpacing: "-0.015em" }],
        "4xl": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em" }],
        "5xl": ["40px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
        "6xl": ["48px", { lineHeight: "52px", letterSpacing: "-0.022em" }],
        "7xl": ["56px", { lineHeight: "60px", letterSpacing: "-0.022em" }],
      },

      // ── 4px Spacing Grid (Apple HIG standard) ───────────────────────
      spacing: {
        0.5: "2px",
        1: "4px", // micro
        1.5: "6px",
        2: "8px", // small
        2.5: "10px",
        3: "12px", // button padding-y
        3.5: "14px",
        4: "16px", // standard
        5: "20px",
        6: "24px", // large
        7: "28px",
        8: "32px", // XL
        9: "36px",
        10: "40px",
        11: "44px", // min touch target (iOS)
        12: "48px", // min touch target (Android)
        14: "56px",
        16: "64px",
        20: "80px",
        24: "96px",
        32: "128px",
      },

      // ── Corner Radius (Apple consistency) ───────────────────────────
      borderRadius: {
        none: "0px",
        xs: "4px", // badges
        sm: "8px", // inputs, small chips
        DEFAULT: "10px",
        base: "12px", // cards (primary radius)
        md: "16px", // major containers
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
        full: "9999px", // CTA buttons, avatars
      },

      // ── Elevation (subtle shadows — depth without noise) ────────────
      boxShadow: {
        "tier-xs": "0 1px 2px 0 rgba(0,0,0,0.20)",
        "tier-sm": "0 1px 3px 0 rgba(0,0,0,0.28), 0 1px 2px -1px rgba(0,0,0,0.22)",
        "tier-base":
          "0 4px 8px -2px rgba(0,0,0,0.30), 0 2px 4px -2px rgba(0,0,0,0.24)",
        "tier-md":
          "0 8px 16px -4px rgba(0,0,0,0.32), 0 4px 8px -4px rgba(0,0,0,0.24)",
        "tier-lg":
          "0 16px 32px -8px rgba(0,0,0,0.36), 0 8px 16px -8px rgba(0,0,0,0.26)",
        "tier-glow":
          "0 8px 24px -4px rgba(99,102,241,0.18)", // accent glow on primary CTAs
        "tier-inset": "inset 0 1px 1px 0 rgba(255,255,255,0.04)",
        glow: "0 0 20px rgba(99, 102, 241, 0.15)",
        "glow-lg": "0 0 40px rgba(99, 102, 241, 0.2)",
        glass: "inset 0 1px 1px 0 rgba(255,255,255,0.05), 0 10px 40px -10px rgba(0,0,0,0.5)",
        card: "0 4px 24px -4px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 8px 40px -4px rgba(0, 0, 0, 0.4)",
      },

      // ── Motion timing (Apple-standard easings) ──────────────────────
      // Exposed as CSS-ish transition timing function values.
      transitionTimingFunction: {
        "tier-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
        "tier-decelerate": "cubic-bezier(0, 0, 0.2, 1)",
        "tier-accelerate": "cubic-bezier(0.4, 0, 1, 1)",
        "tier-emphasized": "cubic-bezier(0.2, 0, 0, 1)",
      },

      transitionDuration: {
        "tier-fast": "150ms",
        "tier-normal": "250ms",
        "tier-slow": "400ms",
      },
    },
  },
  plugins: [],
};
