/**
 * Detects whether the user has requested reduced motion.
 *
 * Apple HIG: animations must respect `prefers-reduced-motion`. When true,
 * components should collapse motion duration to ~0 (instant) and avoid
 * non-essential motion. This is an accessibility requirement.
 *
 * - Web: listens to the `(prefers-reduced-motion: reduce)` media query.
 * - Native: returns false (no equivalent system flag exposed cross-platform;
 *   native motion is already conservative in this app). If a native
 *   accessibility flag is needed later, extend here.
 *
 * Reference: APPLE_DESIGN_SYSTEM_COMPLETE.md §2.4
 */
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return; // native: no-op, stays false

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
    };

    // Safari < 14 uses addListener; modern browsers use addEventListener.
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if (typeof (mediaQuery as any).addListener === "function") {
      (mediaQuery as any).addListener(handleChange);
      return () => (mediaQuery as any).removeListener(handleChange);
    }
  }, []);

  return prefersReduced;
}
