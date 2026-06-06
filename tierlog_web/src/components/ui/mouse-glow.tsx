import React, { useEffect } from "react";
import { Platform } from "react-native";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function MouseGlow() {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const springX = useSpring(mouseX, { stiffness: 150, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 25 });

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  if (Platform.OS !== "web") return null;

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="pointer-events-none fixed top-0 left-0 z-50"
    >
      <div
        className="h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}
