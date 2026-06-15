import { router } from "expo-router";
import React from "react";
import { Platform, View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { fadeUp } from "@/src/lib/animations";
import { MotionDiv } from "@/src/lib/motion";
import { FloatingShapes } from "@/src/components/ui/floating-shapes";
import { GradientBackground } from "@/src/components/ui/gradient-background";
import { useIsMobile } from "@/src/hooks";

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
  const isMobile = useIsMobile(768);
  const insets = useSafeAreaInsets();
  const isNative = Platform.OS !== "web";

  return (
    <View
      className="relative min-h-screen bg-[#020617]"
      style={isNative ? { paddingTop: insets.top } : undefined}
    >
      <GradientBackground />
      {Platform.OS === "web" && <FloatingShapes />}

      <ScrollView
        contentContainerStyle={{
          minHeight: "100%",
          overflow: "visible",
          paddingBottom: isNative ? insets.bottom + 24 : undefined,
        }}
        style={{ overflow: "visible" }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        {...(isNative ? { automaticallyAdjustKeyboardInsets: true } as any : {})}
      >
        <View className={`flex-1 ${isMobile ? "px-4 py-4" : "px-6 py-12"} max-w-[1200px] mx-auto w-full`}>
          <Pressable
            onPress={() => router.push(backHref as any)}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className={`flex-row items-center gap-2 self-start ${isMobile ? "mb-4" : "mb-10"} px-3.5 py-2.5 rounded-lg border border-white/10 bg-white/[0.02]`}
          >
            <ArrowLeft size={16} color="#94A3B8" />
            <Text className="text-xs font-bold text-[#94A3B8]">Back</Text>
          </Pressable>

          <View className={isMobile ? "flex-col gap-6 w-full" : `flex-row gap-10 items-${align} flex-wrap`}>
            {isMobile ? (
              <MotionDiv
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                style={{ width: "100%" }}
              >
                {rightContent}
              </MotionDiv>
            ) : (
              <>
                <MotionDiv
                  custom={0}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 340, gap: 32 }}
                >
                  {leftContent}
                </MotionDiv>

                <MotionDiv
                  custom={1}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  style={{ flex: 1, minWidth: 340 }}
                >
                  {rightContent}
                </MotionDiv>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
