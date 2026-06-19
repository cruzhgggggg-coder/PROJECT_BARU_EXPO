import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform as RNPlatform } from "react-native";

import { Field } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { AuthPageLayout } from "@/src/components/ui/auth-page-layout";
import { MotionDiv } from "@/src/lib/motion";
import { motionPresets } from "@/src/lib/motion-config";
import { Cpu, Eye, EyeOff } from "lucide-react-native";
import { useIsMobile } from "@/src/hooks";

export default function LoginScreen() {
  const { login, user } = useAuth();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Redirect href="/dashboard" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <AuthPageLayout
      leftContent={
        <>
          {/* Badge — minimal inline indicator */}
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-2 h-2 rounded-full bg-tier-accent-success" />
            <Text className="text-[10px] font-black uppercase tracking-[1.5px] text-tier-text-secondary">
              Secure Access
            </Text>
          </View>

          {/* Headline — Apple typography hierarchy */}
          <MotionDiv {...motionPresets.fadeUp(0)}>
            <Text className="text-4xl md:text-5xl font-display font-bold tracking-tight leading-tight text-tier-text-primary">
              Sign In to{"\n"}Your Workspace
            </Text>
          </MotionDiv>

          <MotionDiv {...motionPresets.fadeUp(0.1)}>
            <Text className="text-sm leading-relaxed text-tier-text-tertiary mt-4">
              Welcome back. Authenticate to access your consultation history, review
              advisor annotations, and continue your academic progress.
            </Text>
          </MotionDiv>

          {/* Info card */}
          <MotionDiv {...motionPresets.fadeUp(0.2)}>
            <GlassCard className="flex-row gap-4 items-start p-5">
              <View className="h-9 w-9 rounded-lg bg-tier-accent-primary/10 items-center justify-center mt-0.5">
                <Cpu size={16} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-black uppercase tracking-[1px] text-tier-accent-primary mb-1">
                  Secure Data Transmission
                </Text>
                <Text className="text-xs leading-[18px] text-tier-text-tertiary font-medium">
                  Your credentials and academic submissions are encrypted in transit
                  and at rest to safeguard research confidentiality.
                </Text>
              </View>
            </GlassCard>
          </MotionDiv>
        </>
      }
      rightContent={
        <GlassCard className={isMobile ? "px-4 py-3" : "p-8"} style={isMobile ? { borderWidth: 0, backgroundColor: "transparent" } : undefined}>
          <Text className={`${isMobile ? "text-lg" : "text-xl"} font-display font-bold tracking-tight text-tier-text-primary mb-0.5`}>
            Welcome Back
          </Text>
          <Text className={`text-xs font-medium text-tier-text-tertiary ${isMobile ? "mb-2" : "mb-4"}`}>
            Sign in with your academic email and password.
          </Text>

          <View className="gap-0">
            <Field
              label="Academic Email Address"
              placeholder="email@university.edu"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              autoComplete="email"
            />
            <Field
              label="Account Password"
              placeholder="••••••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              returnKeyType="done"
              autoComplete="password"
              onSubmitEditing={() => void handleLogin()}
              rightElement={
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={12}>
                  {showPassword ? (
                    <EyeOff size={18} color="#94A3B8" />
                  ) : (
                    <Eye size={18} color="#94A3B8" />
                  )}
                </Pressable>
              }
            />

            {error ? (
              <Pressable onPress={() => setError("")} className="bg-tier-accent-danger/8 border border-tier-accent-danger/15 rounded-xl p-3 mb-4">
                <Text className="text-tier-accent-danger-bright text-sm font-semibold text-center">{error}</Text>
              </Pressable>
            ) : null}

            <View className={`${isMobile ? "mt-1" : "mt-2"}`}>
              <ElegantButton
                title={loading ? "Authenticating..." : "Sign In"}
                onPress={() => void handleLogin()}
                disabled={loading}
                tone="primary"
                accessibilityLabel="Sign in"
              />
            </View>
          </View>

          <View className={`flex-row justify-between items-center ${isMobile ? "mt-3 pt-3" : "mt-6 pt-5"} border-t border-tier-divider-light`}>
            <Text className="text-xs text-tier-text-tertiary font-medium">No account registered?</Text>
            <Pressable onPress={() => router.push("/register")} className="py-3 px-3" accessibilityLabel="Create account">
              <Text className="text-xs font-bold text-tier-accent-primary">Create Account →</Text>
            </Pressable>
          </View>
        </GlassCard>
      }
    />
  );

  if (isMobile) {
    return (
      <KeyboardAvoidingView
        behavior={RNPlatform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={RNPlatform.OS === "ios" ? 0 : 20}
        style={{ flex: 1 }}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }
  return content;
}
