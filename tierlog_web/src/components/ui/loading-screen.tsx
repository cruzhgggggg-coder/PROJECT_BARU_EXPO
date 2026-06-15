import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Platform } from "react-native";

export function LoadingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const barScale = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(barScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]).start();

    const createDotAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      );

    const a1 = createDotAnim(dot1, 0);
    const a2 = createDotAnim(dot2, 200);
    const a3 = createDotAnim(dot3, 400);
    a1.start(); a2.start(); a3.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-[#020617]" accessibilityLabel="Loading TierLog">
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Text className="text-4xl font-black text-white tracking-tight">TierLog</Text>
      </Animated.View>

      <Animated.View
        accessibilityRole="progressbar"
        style={{
          transform: [{ scaleX: barScale }],
          marginTop: 16,
          height: 2,
          width: 64,
          borderRadius: 99,
          backgroundColor: "#6366F1",
        }}
      />

      <View className="mt-6 flex-row items-center gap-2">
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              opacity: dot,
              transform: [{ scale: dot }],
              height: 8,
              width: 8,
              borderRadius: 4,
              backgroundColor: "#6366F1",
            }}
          />
        ))}
      </View>
    </View>
  );
}
