import React from "react";
import { Platform, Text } from "react-native";
import { cn } from "@/src/lib/utils";

export function ShimmerText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  if (Platform.OS === "web") {
    return <ShimmerTextWeb className={className}>{children}</ShimmerTextWeb>;
  }
  return <ShimmerTextNative className={className}>{children}</ShimmerTextNative>;
}

function ShimmerTextWeb({ children, className }: { children: string; className?: string }) {
  const { motion } = require("framer-motion");
  return (
    <span
      className={cn(
        "relative inline-block bg-clip-text text-transparent",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #ffffff 0%, #ffffff 40%, rgba(99,102,241,0.8) 50%, #ffffff 60%, #ffffff 100%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      <motion.span
        aria-hidden
        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "linear-gradient(90deg, #ffffff 0%, #ffffff 40%, rgba(99,102,241,0.8) 50%, #ffffff 60%, #ffffff 100%)",
          backgroundSize: "200% 100%",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function ShimmerTextNative({ children, className }: { children: string; className?: string }) {
  return (
    <Text className={cn("text-white", className)}>
      {children}
    </Text>
  );
}
