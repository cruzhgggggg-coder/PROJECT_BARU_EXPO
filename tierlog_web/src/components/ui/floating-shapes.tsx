import React, { useEffect, useRef } from "react";
import { Animated, Platform, View, useWindowDimensions } from "react-native";
import { cn } from "@/src/lib/utils";

type PositionValue = `${number}%`;

type ShapePosition = {
  left?: PositionValue;
  right?: PositionValue;
  top?: PositionValue;
  bottom?: PositionValue;
};

type ShapeConfig = {
  width: number;
  height: number;
  rotate: number;
  gradient: string;
  className?: string;
  delay: number;
  position: {
    mobile: ShapePosition;
    desktop: ShapePosition;
  };
};

const defaultShapes: ShapeConfig[] = [
  {
    delay: 300,
    width: 600,
    height: 140,
    rotate: 12,
    gradient: "from-indigo-500/[0.15]",
    position: {
      mobile: { left: "-10%", top: "15%" },
      desktop: { left: "-5%", top: "20%" },
    },
  },
  {
    delay: 500,
    width: 500,
    height: 120,
    rotate: -15,
    gradient: "from-rose-500/[0.15]",
    position: {
      mobile: { right: "-5%", top: "70%" },
      desktop: { right: "0%", top: "75%" },
    },
  },
  {
    delay: 400,
    width: 300,
    height: 80,
    rotate: -8,
    gradient: "from-violet-500/[0.15]",
    position: {
      mobile: { left: "5%", bottom: "5%" },
      desktop: { left: "10%", bottom: "10%" },
    },
  },
  {
    delay: 600,
    width: 200,
    height: 60,
    rotate: 20,
    gradient: "from-amber-500/[0.15]",
    position: {
      mobile: { right: "15%", top: "10%" },
      desktop: { right: "20%", top: "15%" },
    },
  },
  {
    delay: 700,
    width: 150,
    height: 40,
    rotate: -25,
    gradient: "from-cyan-500/[0.15]",
    position: {
      mobile: { left: "20%", top: "5%" },
      desktop: { left: "25%", top: "10%" },
    },
  },
];

const DESKTOP_BREAKPOINT = 768;

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
  position,
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
  position: {
    mobile: ShapePosition;
    desktop: ShapePosition;
  };
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-150)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const { width: windowWidth } = useWindowDimensions();

  const isDesktop = windowWidth >= DESKTOP_BREAKPOINT;
  const pos = isDesktop ? position.desktop : position.mobile;

  useEffect(() => {
    const floatDuration = Platform.OS === "web" ? 6000 : 10000;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 2400, delay, useNativeDriver: true }),
    ]).start();

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 15, duration: floatDuration, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: floatDuration, useNativeDriver: true }),
      ])
    );
    const timeout = setTimeout(() => float.start(), delay);
    return () => { clearTimeout(timeout); float.stop(); };
  }, []);

  const mobileScale = Platform.OS !== "web" ? 0.5 : 1;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: pos.left,
        right: pos.right,
        top: pos.top,
        bottom: pos.bottom,
        opacity: fadeAnim,
        transform: [{ translateY: Animated.add(translateY, floatAnim) }, { rotate: `${rotate}deg` }],
      }}
      className={cn(className)}
    >
      <View
        style={{ width: width * mobileScale, height: height * mobileScale, borderRadius: 9999, overflow: "hidden" }}
      >
        <View
          className={cn(
            "absolute inset-0 rounded-full",
            gradient,
          )}
          style={{
            borderWidth: Platform.OS === "web" ? 2 : 1,
            borderColor: Platform.OS === "web" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
          }}
        />
      </View>
    </Animated.View>
  );
}

export function FloatingShapes({
  shapes = defaultShapes,
  className,
}: {
  shapes?: ShapeConfig[];
  className?: string;
}) {
  const activeShapes = Platform.OS === "web" ? shapes : shapes.slice(0, 1);

  return (
    <View pointerEvents="none" className={cn("absolute inset-0 overflow-hidden", className)}>
      {activeShapes.map((shape, i) => (
        <ElegantShape key={i} {...shape} />
      ))}
    </View>
  );
}
