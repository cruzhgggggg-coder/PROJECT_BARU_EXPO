import React, { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { cn } from "@/src/lib/utils";

let motion: any;
let AnimatePresence: any;

if (Platform.OS === "web") {
  try {
    const fm = require("framer-motion");
    motion = fm.motion;
    AnimatePresence = fm.AnimatePresence;
  } catch (e) {
    console.warn("Framer motion load error:", e);
  }
}

interface GlowingSlideTextProps {
  fixedPrefix?: string;
  slidingWords?: string[];
  subtitle?: string;
  className?: string;
}

export function GlowingSlideText({
  fixedPrefix = "Elevate Your",
  slidingWords = ["Academic Vision", "Thesis Milestones", "Research Potential", "Supervision Flow"],
  subtitle = "Crafting Exceptional Consultations",
  className,
}: GlowingSlideTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slidingWords.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slidingWords.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [slidingWords]);

  const currentWord = slidingWords[index] || slidingWords[0];

  if (Platform.OS === "web" && motion && AnimatePresence) {
    return (
      <View className={cn("items-center text-center select-none", className)}>
        {/* Main Title Container */}
        <div className="flex flex-col md:flex-row items-center justify-center flex-wrap gap-x-3 gap-y-1 text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight">
          {/* Fixed White Title */}
          <span className="text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.25)]">
            {fixedPrefix}
          </span>

          {/* Animated Glowing Sliding Word */}
          <div className="relative inline-block overflow-hidden min-h-[1.3em] px-2 py-1 items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentWord}
                initial={{ y: 50, opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ y: -50, opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block bg-gradient-to-r from-indigo-400 via-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
                style={{
                  backgroundSize: "200% 200%",
                  animation: "glowingGradient 6s ease infinite",
                  filter: "drop-shadow(0 0 35px rgba(139, 92, 246, 0.65)) drop-shadow(0 0 15px rgba(99, 102, 241, 0.5))",
                }}
              >
                {currentWord.split("").map((char, charIdx) => (
                  <motion.span
                    key={charIdx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: charIdx * 0.03,
                    }}
                    className="inline-block"
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Glowing Subtitle with Animated Shimmer */}
        {subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-5 relative group cursor-default"
          >
            <span
              className="text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent tracking-wide"
              style={{
                filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))",
              }}
            >
              {subtitle}
            </span>

            {/* Glowing Accent Line underneath */}
            <motion.div
              animate={{
                scaleX: [0.7, 1.05, 0.7],
                opacity: [0.5, 0.9, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-[2px] w-3/4 mx-auto mt-2 rounded-full bg-gradient-to-r from-transparent via-indigo-500 via-purple-500 to-transparent shadow-[0_0_12px_#8b5cf6]"
            />
          </motion.div>
        )}

        {/* Global Keyframes CSS snippet for fluid gradient animation */}
        <style>{`
          @keyframes glowingGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </View>
    );
  }

  // Native Fallback
  return (
    <View className={cn("items-center text-center py-2", className)}>
      <Text className="text-3xl sm:text-5xl font-black text-white text-center leading-tight">
        {fixedPrefix}{"\n"}
        <Text className="text-indigo-400">{currentWord}</Text>
      </Text>
      {subtitle && (
        <Text className="text-lg font-extrabold text-purple-300 mt-3 text-center">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
