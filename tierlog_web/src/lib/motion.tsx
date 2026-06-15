import React from "react";
import { Platform, View as RNView, Text as RNText, Pressable as RNPressable } from "react-native";

// Web: use framer-motion directly
// Native: use Moti (which wraps react-native-reanimated)

type MotionProps = {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  variants?: any;
  whileTap?: any;
  whileHover?: any;
  custom?: any;
  className?: string;
  style?: any;
  children?: React.ReactNode;
  [key: string]: any;
};

function MotionWebDiv({ children, className, style, ...props }: MotionProps) {
  // Dynamically require framer-motion only on web
  const { motion } = require("framer-motion");
  const MotionDiv = motion.div;
  return (
    <MotionDiv className={className} style={style} {...props}>
      {children}
    </MotionDiv>
  );
}

function MotionNativeDiv({ children, style, initial, animate, transition, variants, custom, exit, ...rest }: MotionProps) {
  // On native, use a simple animated View via Moti
  const { View: MotiView } = require("moti");
  
  // Resolve variant names to actual objects
  const resolvedInitial = typeof initial === "string" && variants ? variants[initial] : initial;
  const resolvedAnimate = typeof animate === "string" && variants ? variants[animate] : animate;

  // Map framer-motion initial/animate to Moti from/to
  const from = resolvedInitial ? {
    opacity: resolvedInitial.opacity ?? 1,
    translateY: resolvedInitial.y ?? 0,
    translateX: resolvedInitial.x ?? 0,
    scale: resolvedInitial.scale ?? 1,
    rotate: resolvedInitial.rotate ? `${resolvedInitial.rotate}deg` : "0deg",
  } : undefined;

  const to = resolvedAnimate ? {
    opacity: resolvedAnimate.opacity ?? 1,
    translateY: resolvedAnimate.y ?? 0,
    translateX: resolvedAnimate.x ?? 0,
    scale: resolvedAnimate.scale ?? 1,
    rotate: resolvedAnimate.rotate ? `${resolvedAnimate.rotate}deg` : "0deg",
  } : undefined;

  const motiTransition = transition ? {
    type: transition.type === "spring" ? "spring" : "timing",
    duration: transition.duration ? transition.duration * 1000 : 300,
    delay: (transition.delay ?? 0) + ((custom ?? 0) * 150),
  } : undefined;

  return (
    <MotiView
      from={from}
      animate={to}
      transition={motiTransition}
      style={style}
      {...rest}
    >
      {children}
    </MotiView>
  );
}

function MotionWebSpan({ children, className, style, ...props }: MotionProps) {
  const { motion } = require("framer-motion");
  const MotionSpan = motion.span;
  return (
    <MotionSpan className={className} style={style} {...props}>
      {children}
    </MotionSpan>
  );
}

function MotionNativeSpan({ children, style, initial, animate, transition, variants, custom, ...rest }: MotionProps) {
  const { Text: MotiText } = require("moti");

  const resolvedInitial = typeof initial === "string" && variants ? variants[initial] : initial;
  const resolvedAnimate = typeof animate === "string" && variants ? variants[animate] : animate;

  const from = resolvedInitial ? {
    opacity: resolvedInitial.opacity ?? 1,
    translateY: resolvedInitial.y ?? 0,
    translateX: resolvedInitial.x ?? 0,
    scale: resolvedInitial.scale ?? 1,
  } : undefined;

  const to = resolvedAnimate ? {
    opacity: resolvedAnimate.opacity ?? 1,
    translateY: resolvedAnimate.y ?? 0,
    translateX: resolvedAnimate.x ?? 0,
    scale: resolvedAnimate.scale ?? 1,
  } : undefined;

  const motiTransition = transition ? {
    type: transition.type === "spring" ? "spring" : "timing",
    duration: transition.duration ? transition.duration * 1000 : 300,
    delay: (transition.delay ?? 0) + ((custom ?? 0) * 150),
  } : undefined;

  return (
    <MotiText
      from={from}
      animate={to}
      transition={motiTransition}
      style={style}
      {...rest}
    >
      {children}
    </MotiText>
  );
}

function MotionWebDivClick({ children, className, style, onClick, ariaDisabled, ...props }: MotionProps) {
  const { motion } = require("framer-motion");
  const MotionDiv = motion.div;
  return (
    <MotionDiv 
      className={className} 
      style={style} 
      onClick={ariaDisabled ? undefined : onClick}
      aria-disabled={ariaDisabled}
      {...props}
    >
      {children}
    </MotionDiv>
  );
}

function MotionNativePressable({ children, style, initial, animate, transition, whileTap, ...rest }: MotionProps) {
  const { View: MotiView } = require("moti");

  const from = initial ? {
    opacity: initial.opacity ?? 1,
    scale: initial.scale ?? 1,
  } : undefined;

  const to = animate ? {
    opacity: animate.opacity ?? 1,
    scale: animate.scale ?? 1,
  } : undefined;

  return (
    <MotiView
      from={from}
      animate={to}
      transition={{ type: "timing", duration: 200 }}
      style={style}
    >
      <RNPressable {...rest}>
        {children}
      </RNPressable>
    </MotiView>
  );
}

// ─── Exports ─────────────────────────────────────────────────

export const MotionDiv = Platform.OS === "web" ? MotionWebDiv : MotionNativeDiv;
export const MotionSpan = Platform.OS === "web" ? MotionWebSpan : MotionNativeSpan;
export const MotionButton = Platform.OS === "web" ? MotionWebDivClick : MotionNativePressable;

// Re-export framer-motion hooks for web, no-ops for native
export function useMotionValue(initial: number) {
  if (Platform.OS === "web") {
    const { useMotionValue } = require("framer-motion");
    return useMotionValue(initial);
  }
  return { set: () => {}, get: () => initial };
}

export function useSpring(value: any, config?: any) {
  if (Platform.OS === "web") {
    const { useSpring } = require("framer-motion");
    return useSpring(value, config);
  }
  return value;
}

export function useTransform(value: any, fn: (v: number) => string) {
  if (Platform.OS === "web") {
    const { useTransform } = require("framer-motion");
    return useTransform(value, fn);
  }
  return fn(typeof value === "number" ? value : 0);
}
