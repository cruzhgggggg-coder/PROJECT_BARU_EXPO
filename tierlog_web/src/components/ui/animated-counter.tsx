import React, { useEffect, useState } from "react";
import { Platform, Text } from "react-native";
import { cn } from "@/src/lib/utils";

export function AnimatedCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    if (Platform.OS === "web") {
      const start = displayValue;
      const end = value;
      const duration = 800;
      const startTime = Date.now();
      let rafId = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);
        setDisplayValue(current);
        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        }
      };
      rafId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafId);
    }

    const start = displayValue;
    const end = value;
    const duration = 800;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);
      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [value]);

  const formatted = displayValue >= 1000 ? displayValue.toLocaleString() : displayValue.toString();

  return <Text className={cn(className)}>{formatted}</Text>;
}
