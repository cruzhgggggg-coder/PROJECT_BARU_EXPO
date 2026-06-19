import React, { useState } from "react";
import { Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotionDiv } from "@/src/lib/motion";
import { cn } from "@/src/lib/utils";
import { fadeIn } from "@/src/lib/animations";
import { GlassCard } from "./ui/glass-card";
import { ElegantButton } from "./ui/elegant-button";
import { AnimatedCounter } from "./ui/animated-counter";
import { FloatingOrbs } from "./ui/FloatingOrbs";

/**
 * Aggregated UI primitives — refactored to route through the `tier.*`
 * design tokens and apply Apple typography/spacing discipline.
 *
 * Public API (component names + props) is preserved so the many pages that
 * import { Page, Card, Heading, Field, Button, Badge, StatCard } keep working
 * unchanged. Phase 2 will migrate page-level styling in place.
 */

// ─── Page Wrapper ──────────────────────────────────────────────
export function Page({
  children,
  fullWidth = false,
  showBackground = true,
  showFloatingShapes = true,
  style,
  contentContainerStyle,
  onRefresh,
  refreshing = false,
  scrollable = true,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
  /** Kept for backward-compat. Background is now token-based (always on). */
  showBackground?: boolean;
  /** Kept for backward-compat; floating shapes are no longer rendered here. */
  showFloatingShapes?: boolean;
  style?: any;
  contentContainerStyle?: any;
  onRefresh?: () => void;
  refreshing?: boolean;
  scrollable?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const isNative = Platform.OS !== "web";
  const safeTop = isNative ? insets.top : 0;
  const safeBottom = isNative ? insets.bottom : 0;

  void showBackground; // reserved; background handled by tokens + container.
  void showFloatingShapes; // reserved; removed per design decision (minimalism).

  const content = (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      style={scrollable ? undefined : { flex: 1, display: "flex", flexDirection: "column" }}
    >
      <View className={cn("relative flex flex-col w-full gap-6", fullWidth ? "" : "max-w-[1200px] mx-auto", scrollable ? "" : (Platform.OS === "web" ? "flex-1 h-full" : "flex-1"))}>
        {children}
      </View>
    </MotionDiv>
  );

  if (!scrollable) {
    return (
      <View className="flex-1 bg-tier-bg relative">
        <FloatingOrbs />
        <View
          style={[
            {
              paddingTop: 16 + safeTop,
              paddingBottom: 16 + safeBottom,
              paddingHorizontal: 16,
              ...(Platform.OS === "web" ? { height: "100%" } : { flex: 1 }),
              display: "flex",
              flexDirection: "column",
            },
            style,
          ]}
        >
          {content}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-tier-bg relative">
      <FloatingOrbs />
      <ScrollView
        contentContainerStyle={[
          {
            paddingTop: 32 + safeTop,
            paddingBottom: 32 + safeBottom,
            paddingHorizontal: 24,
            minHeight: "100%" as any,
          },
          contentContainerStyle,
        ]}
        style={style}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          onRefresh && Platform.OS !== "web" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1" // tier-accent-primary
              colors={["#6366F1"]}
            />
          ) : undefined
        }
      >
        {content}
      </ScrollView>
    </View>
  );
}

// ─── Surface Card ─────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <GlassCard style={style}>{children}</GlassCard>;
}

// ─── Section Heading (Apple typography hierarchy) ─────────────
export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3 flex-row items-start gap-4">
      {/* Accent rail — subtle, brand-aligned. */}
      <View className="h-11 w-1 rounded-full bg-tier-accent-primary" />
      <View className="flex-1">
        <Text className="text-2xl font-bold tracking-tight font-display text-tier-text-primary">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 text-sm font-medium leading-5 text-tier-text-secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Input Field ──────────────────────────────────────────────
export function Field(props: React.ComponentProps<typeof TextInput> & { label: string; rightElement?: React.ReactNode }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-2.5 gap-1">
      <Text
        nativeID={`label-${props.label.replace(/\s+/g, "-").toLowerCase()}`}
        className={cn(
          "text-xs font-bold uppercase tracking-wider pl-0.5",
          isFocused ? "text-tier-accent-primary" : "text-tier-text-secondary"
        )}
      >
        {props.label}
      </Text>
      <View className="relative">
        {isFocused && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            style={{ position: "absolute", top: -1, left: -1, right: -1, bottom: -1, borderRadius: 12, borderWidth: 2, borderColor: "rgba(99,102,241,0.4)", pointerEvents: "none" }}
          />
        )}
        <View style={{ position: "relative" }}>
          <TextInput
            accessibilityLabel={props.label}
            accessibilityLabelledBy={`label-${props.label.replace(/\s+/g, "-").toLowerCase()}`}
            placeholderTextColor="#64748B" // tier-text-tertiary
            {...props}
            onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
            className={cn(
              "rounded-base px-3.5 py-3 text-sm font-medium text-tier-text-primary border outline-none min-h-[44px]",
              isFocused
                ? "bg-tier-surface-raised border-tier-accent-primary"
                : "bg-tier-surface-raised border-tier-divider-base",
              props.rightElement ? "pr-12" : ""
            )}
            style={[
              props.style,
              isFocused && Platform.OS === "web" ? { boxShadow: "0 0 12px rgba(99,102,241,0.2)" } : undefined,
              Platform.OS !== "web" ? { fontSize: 16 } : undefined,
            ]}
          />
          {props.rightElement && (
            <View style={{ position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
              {props.rightElement}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Action Button ────────────────────────────────────────────
export function Button({
  title,
  onPress,
  disabled,
  tone = "primary",
  glowColor,
}: {
  title: string;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger" | "success" | "warning";
  /** Reserved for backward-compat; glow now derives from tone token. */
  glowColor?: string;
}) {
  void glowColor;
  return (
    <ElegantButton
      title={title}
      onPress={onPress}
      disabled={disabled}
      tone={tone as any}
    />
  );
}

// ─── Status Badge ─────────────────────────────────────────────
export function Badge({ text, color }: { text: string; color?: string }) {
  const isSuccess = text.toLowerCase().includes("fixed") || text.toLowerCase().includes("validated") || text.toLowerCase().includes("clear") || text.toLowerCase().includes("setuju") || text.toLowerCase().includes("approved");
  const isPending = text.toLowerCase().includes("pending") || text.toLowerCase().includes("new") || text.toLowerCase().includes("antrean") || text.toLowerCase().includes("revisi") || text.toLowerCase().includes("queue") || text.toLowerCase().includes("revision");

  // Semantic mapping — falls back to caller-provided color for flexibility.
  const badgeColor = color
    ? color
    : isSuccess
    ? "#059669" // tier-accent-success
    : isPending
    ? "#D97706" // tier-accent-caution
    : "#6366F1"; // tier-accent-primary

  return (
    <View
      className="self-start rounded-sm px-2.5 py-1.5 border"
      style={{ borderColor: `${badgeColor}22`, backgroundColor: `${badgeColor}0A` }}
    >
      <Text
        className="text-[11px] font-extrabold uppercase tracking-widest font-sans"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ color: badgeColor }}
      >
        {text}
      </Text>
    </View>
  );
}

// ─── Stat Metric Card ─────────────────────────────────────────
export function StatCard({
  label,
  value,
  glowColor = "#6366F1", // tier-accent-primary
  className,
}: {
  label: string;
  value: string | number;
  glowColor?: string;
  className?: string;
}) {
  const valueStr = String(value);
  const isPercent = valueStr.endsWith("%");
  const cleanValue = valueStr.replace(/[^0-9.-]/g, "");
  const numericValue = Number(cleanValue) || 0;

  return (
    <Pressable
      className={cn(
        "flex-1 min-w-[45%] relative overflow-hidden rounded-base border border-tier-divider-light bg-tier-surface p-5 sm:p-6 shadow-tier-base",
        className
      )}
      style={({ pressed }) => ({
        transform: [{ translateY: pressed ? -1 : 0 }],
      })}
    >
      <Text className="text-[11px] font-bold uppercase tracking-widest text-tier-text-secondary">
        {label}
      </Text>
      <Text
        className="mt-2.5 text-[28px] sm:text-[32px] font-bold tracking-tight font-display"
        style={{ color: glowColor }}
      >
        <AnimatedCounter value={numericValue} />
        {isPercent ? "%" : ""}
      </Text>
      {/* Decorative tint — kept subtle so it reads as accent, not neon. */}
      <View
        className="absolute -right-4 -bottom-4 h-[72px] w-[72px] rounded-full"
        style={{ backgroundColor: `${glowColor}0A` }}
      />
    </Pressable>
  );
}
