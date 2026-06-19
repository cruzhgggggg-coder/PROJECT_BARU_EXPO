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
