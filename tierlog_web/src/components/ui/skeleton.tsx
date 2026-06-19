import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { cn } from "@/src/lib/utils";

function SkeletonPulse({ className, style }: { className?: string; style?: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      className={cn("rounded-xl bg-white/[0.04]", className)}
      style={[style, { opacity }]}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 gap-4",
        className
      )}
    >
      <SkeletonPulse className="h-4 w-24" />
      <SkeletonPulse className="h-8 w-16" />
    </View>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <View className={cn("gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className={cn("h-3", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <SkeletonPulse
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}
