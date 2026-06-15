import React from "react";
import { Platform, Pressable, Text } from "react-native";
import { cn } from "@/src/lib/utils";

if (Platform.OS !== "web") {
  var Haptics = require("expo-haptics");
}

let motionModule: any;
if (Platform.OS === "web") {
  motionModule = require("framer-motion");
}

type ButtonTone = "primary" | "secondary" | "danger" | "success" | "warning";
type ButtonSize = "sm" | "md" | "lg";

const toneStyles: Record<ButtonTone, string> = {
  primary: "bg-[#4F46E5] border-[#4F46E5]/20",
  secondary: "bg-white/[0.04] border-white/15",
  danger: "bg-[#EF4444] border-[#EF4444]/20",
  success: "bg-[#059669] border-[#059669]/20",
  warning: "bg-[#D97706] border-[#D97706]/20",
};

const toneGlows: Record<ButtonTone, string> = {
  primary: "shadow-[0_8px_24px_-4px_rgba(79,70,229,0.18)]",
  secondary: "",
  danger: "shadow-[0_8px_24px_-4px_rgba(239,68,68,0.18)]",
  success: "shadow-[0_8px_24px_-4px_rgba(5,150,105,0.18)]",
  warning: "shadow-[0_8px_24px_-4px_rgba(217,119,6,0.18)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "py-2.5 px-4 text-xs rounded-lg",
  md: "py-3.5 px-6 text-sm rounded-xl",
  lg: "py-4 px-8 text-base rounded-xl",
};

export function ElegantButton({
  title,
  onPress,
  disabled,
  tone = "primary",
  size = "md",
}: {
  title: string;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  tone?: ButtonTone;
  size?: ButtonSize;
}) {
  if (Platform.OS === "web") {
    const MotionBtn = motionModule.motion.button;
    return (
      <MotionBtn
        type="button"
        onClick={disabled ? undefined : onPress}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        className={cn(
          "flex items-center justify-center rounded-xl border w-full",
          toneStyles[tone],
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
            "font-bold tracking-wide text-center",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            tone === "secondary" ? "text-slate-100" : "text-white"
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
        "items-center justify-center border w-full",
        toneStyles[tone],
        sizeStyles[size],
        disabled && "opacity-50"
      )}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
    >
      <Text
        className={cn(
          "font-bold tracking-wide text-center",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          tone === "secondary" ? "text-slate-100" : "text-white"
        )}
      >
        {title}
      </Text>
    </Pressable>
  );
}
