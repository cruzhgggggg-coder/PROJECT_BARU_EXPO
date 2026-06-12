import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { cn } from "@/src/lib/utils";

type ShapeConfig = {
  width: number;
  height: number;
  rotate: number;
  gradient: string;
  className: string;
  delay: number;
};

const defaultShapes: ShapeConfig[] = [
  { delay: 300, width: 600, height: 140, rotate: 12, gradient: "from-indigo-500/[0.15]", className: "left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]" },
  { delay: 500, width: 500, height: 120, rotate: -15, gradient: "from-rose-500/[0.15]", className: "right-[-5%] md:right-[0%] top-[70%] md:top-[75%]" },
  { delay: 400, width: 300, height: 80, rotate: -8, gradient: "from-violet-500/[0.15]", className: "left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]" },
  { delay: 600, width: 200, height: 60, rotate: 20, gradient: "from-amber-500/[0.15]", className: "right-[15%] md:right-[20%] top-[10%] md:top-[15%]" },
  { delay: 700, width: 150, height: 40, rotate: -25, gradient: "from-cyan-500/[0.15]", className: "left-[20%] md:left-[25%] top-[5%] md:top-[10%]" },
];

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-150)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 2400, delay, useNativeDriver: true }),
    ]).start();

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 15, duration: 6000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ])
    );
    const timeout = setTimeout(() => float.start(), delay);
    return () => { clearTimeout(timeout); float.stop(); };
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        opacity: fadeAnim,
        transform: [{ translateY: Animated.add(translateY, floatAnim) }, { rotate: `${rotate}deg` }],
      }}
      className={cn(className)}
    >
      <View
        style={{ width, height, borderRadius: 9999, overflow: "hidden" }}
      >
        <View
          className={cn(
            "absolute inset-0 rounded-full",
            gradient,
          )}
          style={{
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.15)",
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
  return (
    <View pointerEvents="none" className={cn("absolute inset-0 overflow-hidden", className)}>
      {shapes.map((shape, i) => (
        <ElegantShape key={i} {...shape} />
      ))}
    </View>
  );
}
