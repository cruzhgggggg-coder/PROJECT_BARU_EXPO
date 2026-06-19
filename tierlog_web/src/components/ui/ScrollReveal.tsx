import React, { useRef } from "react";
import { Platform, View } from "react-native";
import { MotionDiv } from "@/src/lib/motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className,
}: ScrollRevealProps) {
  const directionMap = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: -40 },
    right: { x: 40 },
  };

  if (Platform.OS === "web") {
    const { useInView } = require("framer-motion");
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });

    return (
      <MotionDiv
        ref={ref}
        initial={{ opacity: 0, ...directionMap[direction] }}
        animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{
          duration: 0.6,
          delay,
          ease: [0.23, 0.86, 0.39, 0.96],
        }}
        className={className}
      >
        {children}
      </MotionDiv>
    );
  }

  // Native fallback: simple entry on mount
  return (
    <MotionDiv
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
      }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}
