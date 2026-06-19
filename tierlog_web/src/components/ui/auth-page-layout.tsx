import { router } from "expo-router";
import React from "react";
import { Platform, View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { MotionDiv } from "@/src/lib/motion";
import { fadeUp } from "@/src/lib/animations";
import { motionPresets } from "@/src/lib/motion-config";
import { useIsMobile } from "@/src/hooks";
import { FloatingOrbs } from "@/src/components/ui/FloatingOrbs";

/**
 * AuthPageLayout — shared wrapper for login & register screens.
 * Apple HIG: clean background, 4px grid spacing, semantic tokens.
 */
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
      className="relative min-h-screen bg-tier-bg"
      style={isNative ? { paddingTop: insets.top } : undefined}
    >
      <FloatingOrbs />
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
          {/* Back button — 44px min touch target */}
          <Pressable
            onPress={() => router.push(backHref as any)}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className={`flex-row items-center gap-2 self-start ${isMobile ? "mb-4" : "mb-10"} min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-lg border border-tier-divider-light bg-tier-surface`}
          >
            <ArrowLeft size={16} color="#94A3B8" />
            <Text className="text-xs font-bold text-tier-text-secondary">Back</Text>
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
