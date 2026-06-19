import React from "react";
import { Platform, Pressable, Text } from "react-native";
import { cn } from "@/src/lib/utils";
import { usePrefersReducedMotion } from "@/src/hooks/usePrefersReducedMotion";

// Native-only: haptic feedback (web has no haptics).
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  var Haptics = require("expo-haptics");
}

// framer-motion is web-only; load lazily so it never reaches the native bundle.
let motionModule: any;
if (Platform.OS === "web") {
  motionModule = require("framer-motion");
}

type ButtonTone = "primary" | "secondary" | "danger" | "success" | "warning";
type ButtonSize = "sm" | "md" | "lg";

/**
 * Apple-style button tokens. Colors now route through the `tier.accent`
 * palette so they stay in sync with the design system. Borders use the
 * divider tokens for a subtle, consistent edge.
 */
const toneStyles: Record<ButtonTone, string> = {
  primary: "bg-tier-accent-indigo border-tier-accent-indigo-deep/20",
  secondary:
    "bg-tier-bg-secondary border-tier-border-subtle text-tier-text-primary",
  danger: "bg-tier-accent-rose border-tier-accent-rose/20",
  success: "bg-tier-accent-emerald border-tier-accent-emerald/20",
  warning: "bg-tier-accent-amber border-tier-accent-amber/20",
};

const toneGlows: Record<ButtonTone, string> = {
  primary: "shadow-glow",
  secondary: "",
  danger: "shadow-[0_8px_24px_-4px_rgba(244,63,94,0.18)]",
  success: "shadow-[0_8px_24px_-4px_rgba(16,185,129,0.18)]",
  warning: "shadow-[0_8px_24px_-4px_rgba(245,158,11,0.18)]",
};

/**
 * Size tokens enforce Apple's minimum touch target (44px iOS / 48px Android).
 * sm keeps visual density but never below the accessibility floor.
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[44px] py-2 px-4 text-xs rounded-sm",
  md: "min-h-[44px] py-2.5 px-5 text-sm rounded-base",
  lg: "min-h-[48px] py-3.5 px-6 text-base rounded-base",
};

interface ElegantButtonProps {
  title: string;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  tone?: ButtonTone;
  size?: ButtonSize;
  accessibilityLabel?: string;
}

/**
 * ElegantButton — Apple-styled primary CTA.
 *
 * Motion is purposeful: a tiny scale on hover/tap that respects
 * `prefers-reduced-motion` (collapsed to instant when set).
 * Public API unchanged so existing call sites keep working.
 */
export function ElegantButton({
  title,
  onPress,
  disabled,
  tone = "primary",
  size = "md",
  accessibilityLabel,
}: ElegantButtonProps) {
  const prefersReduced = usePrefersReducedMotion();

  if (Platform.OS === "web") {
    const MotionBtn = motionModule.motion.button;
    return (
      <MotionBtn
        type="button"
        aria-label={accessibilityLabel ?? title}
        onClick={disabled ? undefined : onPress}
        disabled={disabled}
        whileTap={disabled || prefersReduced ? undefined : { scale: 0.97 }}
        whileHover={disabled || prefersReduced ? undefined : { scale: 1.02 }}
        className={cn(
          "flex items-center justify-center rounded-base border w-full font-sans",
          toneStyles[tone],
          toneGlows[tone],
          sizeStyles[size],
          disabled && "opacity-50"
        )}
        style={{
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        {...(disabled ? { "aria-disabled": true } : {})}
      >
        <Text
          className={cn(
            "font-bold tracking-tight text-center",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            tone === "secondary" ? "text-tier-text-primary" : "text-white"
          )}
        >
          {title}
        </Text>
      </MotionBtn>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      onPress={
        disabled
          ? undefined
          : () => {
              if (Platform.OS !== "web") {
                Haptics.selectionAsync();
              }
              onPress?.();
            }
      }
      disabled={disabled}
      className={cn(
        "items-center justify-center border w-full rounded-base font-sans",
        toneStyles[tone],
        toneGlows[tone],
        sizeStyles[size],
        disabled && "opacity-50"
      )}
      style={({ pressed }) => ({
        transform: prefersReduced ? [] : [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Text
        className={cn(
          "font-bold tracking-tight text-center",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          tone === "secondary" ? "text-tier-text-primary" : "text-white"
        )}
      >
        {title}
      </Text>
    </Pressable>
  );
}
