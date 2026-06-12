import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
  style,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
  showBackground?: boolean;
  style?: any;
  contentContainerStyle?: any;
}) {
  return (
    <ScrollView
      className="flex-1 bg-[#020617]"
      contentContainerStyle={[{ paddingVertical: 32, paddingHorizontal: 24, minHeight: "100%" as any }, contentContainerStyle]}
      style={style}
    >
      <MotionDiv initial="hidden" animate="visible" variants={fadeIn}>
        <View className={cn("relative flex flex-col w-full gap-6", fullWidth ? "" : "max-w-[1200px] mx-auto")}>
          {showBackground && (
            <>
              <GradientBackground />
              <FloatingShapes className="opacity-30" />
              <MouseGlow />
            </>
          )}
          {children}
        </View>
      </MotionDiv>
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
export function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4 gap-1.5">
      <Text className={cn(
        "text-xs font-bold uppercase tracking-wider pl-0.5 text-[#94A3B8]",
        isFocused && "text-[#4F46E5]"
      )}>
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
        <TextInput
          placeholderTextColor="#94A3B8"
          {...props}
          onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
          className={cn(
            "rounded-xl px-4 py-3.5 text-sm font-medium text-[#F8FAFC] border outline-none",
            isFocused
              ? "bg-white/[0.04] border-[#6366F1]"
              : "bg-white/[0.02] border-white/[0.08]"
          )}
          style={[
            props.style,
            isFocused && Platform.OS === "web" ? { boxShadow: "0 0 12px rgba(99,102,241,0.2)" } : undefined,
          ]}
        />
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
      <Text className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: badgeColor }}>
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
}: {
  label: string;
  value: string | number;
  glowColor?: string;
}) {
  return (
    <Pressable
      className="flex-1 min-w-[45%] relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6"
      style={({ pressed }) => ({
        transform: [{ translateY: pressed ? -1 : 0 }],
      })}
    >
      <Text className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">{label}</Text>
      <Text className="mt-2.5 text-[28px] sm:text-[32px] font-black tracking-tight" style={{ color: glowColor }}><AnimatedCounter value={Number(value)} /></Text>
      <View
        className="absolute -right-4 -bottom-4 h-[72px] w-[72px] rounded-full"
        style={{ backgroundColor: `${glowColor}08` }}
      />
    </Pressable>
  );
}
