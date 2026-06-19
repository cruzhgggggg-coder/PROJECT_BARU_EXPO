/**
 * TierLog responsive system — Apple-style 3-tier breakpoints.
 *
 * Philosophy: mobile-first, desktop-optimized. Content flows naturally
 * across breakpoints; no janky edge cases.
 *
 * Replaces ad-hoc `useIsMobile(1024)` with a single consistent 3-breakpoint
 * model: mobile / tablet / desktop (+ ultra-wide flag).
 *
 * Reference: APPLE_DESIGN_SYSTEM_COMPLETE.md §3
 */
import { Platform, useWindowDimensions } from "react-native";

export const BREAKPOINTS = {
  xs: 320, // base mobile
  sm: 480, // larger phones
  md: 768, // tablets
  lg: 1024, // desktop
  xl: 1280, // wide desktop
  "2xl": 1536, // ultra-wide
} as const;

export type ScreenSize = keyof typeof BREAKPOINTS;

/**
 * Map a pixel width to a coarse breakpoint tier.
 * Used by `useResponsive` and pure layout utilities.
 */
export function getScreenSize(width: number): ScreenSize {
  if (width < BREAKPOINTS.sm) return "xs";
  if (width < BREAKPOINTS.md) return "sm";
  if (width < BREAKPOINTS.lg) return "md";
  if (width < BREAKPOINTS.xl) return "lg";
  if (width < BREAKPOINTS["2xl"]) return "xl";
  return "2xl";
}

export interface ResponsiveState {
  width: number;
  height: number;
  screenSize: ScreenSize;
  /** < 768px (xs + sm). Single column, tab navigation, full-width cards. */
  isMobile: boolean;
  /** 768px–1023px. 2-column or hamburger. */
  isTablet: boolean;
  /** 1024px–1535px. Full multi-column, sidebar. */
  isDesktop: boolean;
  /** ≥ 1536px. Ultra-wide optimizations. */
  isUltraWide: boolean;
}

/**
 * Hook returning the current responsive state. Re-renders on resize/rotate.
 *
 * Note: on native (iOS/Android) `isMobile` is effectively always true since
 * handheld/tablet widths fall below desktop threshold; this matches the
 * existing app behavior (tabs navigator on native, NavBar on web).
 */
export function useResponsive(): ResponsiveState {
  const { width, height } = useWindowDimensions();
  const screenSize = getScreenSize(width);

  // Native devices are treated as mobile unless they report a desktop width
  // (e.g. a tablet in landscape with very wide viewport).
  const nativeHandheld = Platform.OS !== "web" && width < BREAKPOINTS.lg;

  const isMobile =
    nativeHandheld || screenSize === "xs" || screenSize === "sm";
  const isTablet = !isMobile && screenSize === "md";
  const isUltraWide = screenSize === "2xl";
  // Desktop is anything ≥ lg that isn't a native handheld.
  const isDesktop =
    !isMobile && !isTablet && (screenSize === "lg" || screenSize === "xl" || isUltraWide);

  return { width, height, screenSize, isMobile, isTablet, isDesktop, isUltraWide };
}
