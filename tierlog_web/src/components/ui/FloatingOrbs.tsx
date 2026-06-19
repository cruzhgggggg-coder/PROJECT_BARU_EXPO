import React from "react";
import { View, Platform } from "react-native";
import { MotionDiv } from "@/src/lib/motion";

export function FloatingOrbs() {
  if (Platform.OS === "web") {
    return (
      <View className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Indigo orb */}
        <MotionDiv
          className="absolute w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #6366F1 0%, transparent 70%)",
            top: "10%",
            left: "15%",
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Violet orb */}
        <MotionDiv
          className="absolute w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
            top: "40%",
            right: "10%",
          }}
          animate={{
            x: [0, -25, 15, 0],
            y: [0, 25, -15, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Rose orb */}
        <MotionDiv
          className="absolute w-[350px] h-[350px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #F43F5E 0%, transparent 70%)",
            bottom: "15%",
            left: "30%",
          }}
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </View>
    );
  }

  // Native fallback: simple blurred/low-opacity shapes
  return (
    <View className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Indigo orb */}
      <MotionDiv
        className="absolute w-[300px] h-[300px] rounded-full bg-tier-accent-indigo/5"
        style={{
          top: "10%",
          left: "10%",
        }}
        animate={{
          translateX: [0, 20, -10, 0],
          translateY: [0, -15, 20, 0],
        }}
        transition={{ duration: 20000, repeat: Infinity, type: "timing" }}
      />
      
      {/* Violet orb */}
      <MotionDiv
        className="absolute w-[250px] h-[250px] rounded-full bg-tier-accent-violet/5"
        style={{
          top: "40%",
          right: "5%",
        }}
        animate={{
          translateX: [0, -15, 10, 0],
          translateY: [0, 20, -10, 0],
        }}
        transition={{ duration: 25000, repeat: Infinity, type: "timing" }}
      />
    </View>
  );
}
