import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/src/lib/utils";

export function AnimatedCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
  });
  const display = useTransform(spring, (v) => {
    const num = Math.round(v);
    if (num >= 1000) {
      return num.toLocaleString();
    }
    return num.toString();
  });

  useEffect(() => {
    if (!hasAnimated && value > 0) {
      spring.set(value);
      setHasAnimated(true);
    }
  }, [value, hasAnimated, spring]);

  useEffect(() => {
    if (hasAnimated) {
      spring.set(value);
    }
  }, [value]);

  return <motion.span className={cn(className)}>{display}</motion.span>;
}
