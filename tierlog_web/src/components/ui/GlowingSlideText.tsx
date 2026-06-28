import React, { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { MotionDiv, MotionSpan } from "@/src/lib/motion";
import { cn } from "@/src/lib/utils";

interface GlowingSlideTextProps {
  fixedPrefix?: string;
  slidingWords?: string[];
  subtitle?: string;
  className?: string;
}

export function GlowingSlideText({
  fixedPrefix = "Elevate Your",
  slidingWords = ["Academic Vision", "Thesis Milestones", "Research Potential", "Consultation Flow"],
  subtitle = "Crafting Exceptional Consultations",
  className,
}: GlowingSlideTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!slidingWords || slidingWords.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slidingWords.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [slidingWords]);

  const currentWord = slidingWords[index] || slidingWords[0];

  if (Platform.OS === "web") {
    return (
      <div className={cn("flex flex-col items-center text-center select-none w-full py-4", className)}>
        {/* Main Title Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center flex-wrap gap-x-3 gap-y-2 text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight">
          {/* Fixed White Text */}
          <span className="text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.3)]">
            {fixedPrefix}
          </span>

          {/* Glowing Animated Word Container */}
          <div className="relative inline-flex items-center justify-center overflow-hidden min-h-[1.3em] min-w-[240px] px-3 py-1">
            <MotionSpan
              key={index}
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block bg-gradient-to-r from-indigo-400 via-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
              style={{
                backgroundSize: "200% 200%",
                animation: "tierGradientGlow 5s ease infinite",
                filter: "drop-shadow(0 0 25px rgba(139, 92, 246, 0.7)) drop-shadow(0 0 10px rgba(99, 102, 241, 0.5))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              } as any}
            >
              {currentWord}
            </MotionSpan>
          </div>
        </div>

        {/* Subtitle with Glowing Accent */}
        {subtitle && (
          <MotionDiv
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 flex flex-col items-center"
          >
            <span
              className="text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent tracking-wide text-center"
              style={{
                filter: "drop-shadow(0 0 15px rgba(168, 85, 247, 0.5))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              } as any}
            >
              {subtitle}
            </span>

            {/* Pulsing Glow Underline */}
            <div
              className="h-[3px] w-48 sm:w-64 mt-3 rounded-full bg-gradient-to-r from-transparent via-indigo-500 via-purple-500 to-transparent animate-pulse"
              style={{
                boxShadow: "0 0 15px #8b5cf6, 0 0 5px #6366f1",
              }}
            />
          </MotionDiv>
        )}

        {/* Global Keyframe CSS */}
        <style>{`
          @keyframes tierGradientGlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>
    );
  }

  // Mobile / Native Fallback
  return (
    <View className={cn("items-center text-center py-4", className)}>
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
