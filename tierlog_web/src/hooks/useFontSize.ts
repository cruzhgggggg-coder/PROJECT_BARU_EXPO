// src/hooks/useFontSize.ts
import { useUIStore } from "@/src/lib/store/ui-store";

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
