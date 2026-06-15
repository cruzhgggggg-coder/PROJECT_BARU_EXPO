import React, { useState } from "react";
import { Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotionDiv } from "@/src/lib/motion";
import { cn } from "@/src/lib/utils";
import { fadeIn } from "@/src/lib/animations";
import { GlassCard } from "./ui/glass-card";
import { ElegantButton } from "./ui/elegant-button";
import { AnimatedCounter } from "./ui/animated-counter";
import { GradientBackground } from "./ui/gradient-background";
import { FloatingShapes } from "./ui/floating-shapes";
import { MouseGlow } from "./ui/mouse-glow";

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
  showBackground?: boolean;
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

  const content = (
    <MotionDiv initial="hidden" animate="visible" variants={fadeIn} style={scrollable ? undefined : { flex: 1, display: "flex", flexDirection: "column" }}>
      <View className={cn("relative flex flex-col w-full gap-6", fullWidth ? "" : "max-w-[1200px] mx-auto", scrollable ? "" : (Platform.OS === "web" ? "flex-1 h-full" : "flex-1"))}>
        {showBackground && (
          <>
            <GradientBackground />
            {showFloatingShapes && <FloatingShapes className="opacity-30" />}
            <MouseGlow />
          </>
        )}
        {children}
      </View>
    </MotionDiv>
  );

  if (!scrollable) {
    return (
      <View
        className="flex-1 bg-[#020617]"
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
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#020617]"
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
            tintColor="#6366F1"
            colors={["#6366F1"]}
          />
        ) : undefined
      }
    >
      {content}
    </ScrollView>
  );
}

// ─── Frosted Glass Card ─────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <GlassCard style={style}>{children}</GlassCard>;
}

// ─── Section Heading ────────────────────────────────────────
export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3 flex-row items-start gap-4">
      <View className="h-11 w-1 rounded-full bg-[#6366F1]" />
      <View className="flex-1">
        <Text className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 text-sm font-medium leading-5 text-[#94A3B8]">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Input Field ────────────────────────────────────────────
export function Field(props: React.ComponentProps<typeof TextInput> & { label: string; rightElement?: React.ReactNode }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-2.5 gap-1">
      <Text
        nativeID={`label-${props.label.replace(/\s+/g, '-').toLowerCase()}`}
        className={cn(
          "text-xs font-bold uppercase tracking-wider pl-0.5 text-[#94A3B8]",
          isFocused && "text-[#4F46E5]"
        )}
      >
        {props.label}
      </Text>
      <View className="relative">
        {isFocused && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{ position: "absolute", top: -1, left: -1, right: -1, bottom: -1, borderRadius: 12, borderWidth: 2, borderColor: "rgba(99,102,241,0.4)", pointerEvents: "none" }}
          />
        )}
        <View style={{ position: "relative" }}>
          <TextInput
            accessibilityLabel={props.label}
            accessibilityLabelledBy={`label-${props.label.replace(/\s+/g, '-').toLowerCase()}`}
            placeholderTextColor="#94A3B8"
            {...props}
            onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
            className={cn(
              "rounded-xl px-3.5 py-3 text-sm font-medium text-[#F8FAFC] border outline-none",
              isFocused
                ? "bg-white/[0.04] border-[#6366F1]"
                : "bg-white/[0.04] border-white/15",
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

// ─── Action Button ──────────────────────────────────────────
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
  glowColor?: string;
}) {
  return (
    <ElegantButton
      title={title}
      onPress={onPress}
      disabled={disabled}
      tone={tone as any}
    />
  );
}

// ─── Status Badge ───────────────────────────────────────────
export function Badge({ text, color }: { text: string; color?: string }) {
  const isSuccess = text.toLowerCase().includes("fixed") || text.toLowerCase().includes("validated") || text.toLowerCase().includes("clear") || text.toLowerCase().includes("setuju") || text.toLowerCase().includes("approved");
  const isPending = text.toLowerCase().includes("pending") || text.toLowerCase().includes("new") || text.toLowerCase().includes("antrean") || text.toLowerCase().includes("revisi") || text.toLowerCase().includes("queue") || text.toLowerCase().includes("revision");

  const badgeColor = color
    ? color
    : isSuccess
    ? "#059669"
    : isPending
    ? "#D97706"
    : "#4F46E5";

  return (
    <View
      className="self-start rounded-lg px-2.5 py-1.5 border"
      style={{ borderColor: `${badgeColor}22`, backgroundColor: `${badgeColor}0A` }}
    >
      <Text
        className="text-[11px] font-extrabold uppercase tracking-widest"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ color: badgeColor }}
      >
        {text}
      </Text>
    </View>
  );
}

// ─── Stat Metric Card ───────────────────────────────────────
export function StatCard({
  label,
  value,
  glowColor = "#4F46E5",
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
        "flex-1 min-w-[45%] relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.05] p-5 sm:p-6",
        className
      )}
      style={({ pressed }) => ({
        transform: [{ translateY: pressed ? -1 : 0 }],
      })}
    >
      <Text className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">{label}</Text>
      <Text className="mt-2.5 text-[28px] sm:text-[32px] font-black tracking-tight" style={{ color: glowColor }}>
        <AnimatedCounter value={numericValue} />
        {isPercent ? "%" : ""}
      </Text>
      <View
        className="absolute -right-4 -bottom-4 h-[72px] w-[72px] rounded-full"
        style={{ backgroundColor: `${glowColor}08` }}
      />
    </Pressable>
  );
}
