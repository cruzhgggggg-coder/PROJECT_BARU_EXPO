import React from "react";
import { View } from "react-native";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

function SkeletonPulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={cn("rounded-xl bg-white/[0.04]", className)}
      style={style}
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
      style={{ width: size, height: size } as any}
    />
  );
}
