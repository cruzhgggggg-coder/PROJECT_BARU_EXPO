import { router } from "expo-router";
import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { fadeUp } from "@/src/lib/animations";
import { FloatingShapes } from "@/src/components/ui/floating-shapes";
import { GradientBackground } from "@/src/components/ui/gradient-background";

export function AuthPageLayout({
  backHref = "/",
  leftContent,
  rightContent,
  align = "center",
}: {
  backHref?: string;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <View className="relative min-h-screen bg-[#020617]">
      <GradientBackground />
      <FloatingShapes />

      <ScrollView contentContainerStyle={{ minHeight: "100%" }}>
        <View className="flex-1 px-6 py-12 max-w-[1200px] mx-auto w-full">
          <Pressable
            onPress={() => router.push(backHref as any)}
            className="flex-row items-center gap-2 self-start mb-10 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03]"
          >
            <ArrowLeft size={14} color="#94A3B8" />
            <Text className="text-xs font-bold text-[#94A3B8]">Back</Text>
          </Pressable>

          <View className={`flex-row gap-10 items-${align} flex-wrap`}>
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-col flex-1 min-w-[340px] gap-8"
            >
              {leftContent}
            </motion.div>

            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex-1 min-w-[340px]"
            >
              {rightContent}
            </motion.div>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
