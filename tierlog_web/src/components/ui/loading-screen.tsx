import React from "react";
import { View, Text } from "react-native";
import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#020617]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 0.86, 0.39, 0.96] as [number, number, number, number] }}
      >
        <Text className="text-4xl font-black text-white tracking-tight">TierLog</Text>
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.23, 0.86, 0.39, 0.96] as [number, number, number, number] }}
        className="mt-4 h-0.5 w-16 origin-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
      />

      <View className="mt-6 flex-row items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{
              duration: 1.2,
              delay: i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-2 w-2 rounded-full bg-indigo-500"
          />
        ))}
      </View>
    </View>
  );
}
