// U-1: This root index redirects authenticated users to /dashboard and shows a welcome screen for guests.
// This overlaps with (tabs)/ routes which also handle authenticated navigation.
// The welcome/landing page here is intentional for unauthenticated users; (tabs)/ handles post-login flows.
import { Redirect, router } from "expo-router";
import React from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotionDiv } from "@/src/lib/motion";

import { useAuth } from "@/src/providers/AuthProvider";
import { ShaderAnimation } from "@/src/components/ui/shader-animation";
import { FloatingShapes } from "@/src/components/ui/floating-shapes";
import { GradientBackground } from "@/src/components/ui/gradient-background";
import { AnimatedBadge } from "@/src/components/ui/animated-badge";
import { GradientText } from "@/src/components/ui/gradient-text";
import { MouseGlow } from "@/src/components/ui/mouse-glow";
import { ShimmerText } from "@/src/components/ui/shimmer-text";
import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { fadeUp, fadeIn } from "@/src/lib/animations";

export default function WelcomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  if (user) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="relative min-h-screen bg-[#020617]"
    >
      {Platform.OS === "web" && <ShaderAnimation />}
      <GradientBackground />
      {Platform.OS === "web" && <MouseGlow />}
      <FloatingShapes />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingBottom: Platform.OS !== "web" ? insets.bottom + 24 : undefined }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="relative z-10 items-center px-5 py-10 md:py-20 w-full">
          <View className="w-full max-w-2xl items-center text-center">
            <MotionDiv custom={0} initial="hidden" animate="visible" variants={fadeUp} className="mb-6 flex flex-col items-center">
              <AnimatedBadge label="TierLog" dotColor="bg-indigo-500/80" />
            </MotionDiv>

            <MotionDiv custom={1} initial="hidden" animate="visible" variants={fadeUp} className="mb-4 flex flex-col items-center w-full">
              <ShimmerText className="text-3xl md:text-7xl font-black tracking-tight text-center">
                Elevate Your Academic Vision
              </ShimmerText>
            </MotionDiv>

            <MotionDiv custom={2} initial="hidden" animate="visible" variants={fadeUp} className="mb-8 flex flex-col items-center w-full">
              <GradientText
                gradientFrom="from-indigo-300"
                gradientTo="to-purple-400/80"
                className="text-xl md:text-3xl font-bold tracking-tight text-center"
              >
                Crafting Exceptional Consultations
              </GradientText>
            </MotionDiv>

            <MotionDiv custom={3} initial="hidden" animate="visible" variants={fadeUp} className="mb-6 md:mb-12 flex flex-col items-center w-full">
              <Text className="text-white/50 text-sm md:text-lg leading-relaxed max-w-xl text-center">
                An integrated academic advising portal connecting students and research advisors.
                Track draft progression, collaborate on structured annotations, and verify
                consultation milestones in real-time.
              </Text>
            </MotionDiv>

            <MotionDiv custom={4} initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col items-center w-full">
              <GlassCard className="flex flex-col items-center gap-4 p-5 md:p-8 w-full max-w-md">
                <Text className="text-white/50 text-sm font-medium text-center leading-relaxed">
                  Sign in to consult with your research advisor, review feedback annotations,
                  and track revision approvals.
                </Text>

                <View className="flex-row gap-3 w-full">
                  <View className="flex-1">
                    <ElegantButton
                      title="Sign In"
                      accessibilityLabel="Sign in to your account"
                      onPress={() => router.push("/login")}
                      tone="primary"
                    />
                  </View>
                  <View className="flex-1">
                    <ElegantButton
                      title="Create Account"
                      accessibilityLabel="Create a new account"
                      onPress={() => router.push("/register")}
                      tone="secondary"
                    />
                  </View>
                </View>

                <View className="flex-row items-center gap-2 mt-2">
                  <View className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                  <Text className="text-[10px] font-bold uppercase tracking-[2px] text-white/50">
                    Encrypted & Secured
                  </Text>
                </View>
              </GlassCard>
            </MotionDiv>
          </View>
        </View>
      </ScrollView>
    </MotionDiv>
  );
}
