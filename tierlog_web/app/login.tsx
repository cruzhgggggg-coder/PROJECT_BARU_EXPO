import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform as RNPlatform } from "react-native";

import { Field } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { AnimatedBadge } from "@/src/components/ui/animated-badge";
import { TextReveal } from "@/src/components/ui/text-reveal";
import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { AuthPageLayout } from "@/src/components/ui/auth-page-layout";
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
          <AnimatedBadge label="SECURE ACCESS" dotColor="bg-emerald-500/80" />

          <TextReveal text="Sign In to" className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white" />
          <TextReveal text="Your Workspace" delay={0.2} className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white" />

          <Text className="text-white/50 text-sm leading-relaxed">
            Welcome back. Authenticate to access your consultation history, review
            advisor annotations, and continue your academic progress.
          </Text>

          <GlassCard className="flex-row gap-4 items-start p-5">
            <View className="h-9 w-9 rounded-lg bg-indigo-500/10 items-center justify-center mt-0.5">
              <Cpu size={16} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-black uppercase tracking-[1px] text-indigo-400 mb-1">
                Secure Data Transmission
              </Text>
              <Text className="text-xs leading-[18px] text-white/50 font-medium">
                Your credentials and academic submissions are encrypted in transit
                and at rest to safeguard research confidentiality.
              </Text>
            </View>
          </GlassCard>
        </>
      }
      rightContent={
        <GlassCard className={isMobile ? "px-4 py-3" : "p-8"} style={isMobile ? { borderWidth: 0, backgroundColor: "transparent" } : undefined}>
          <Text className={`${isMobile ? "text-lg" : "text-xl"} font-black tracking-tight text-white mb-0.5`}>
            Welcome Back
          </Text>
          <Text className={`text-xs font-medium text-white/50 ${isMobile ? "mb-2" : "mb-4"}`}>
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
              <Pressable onPress={() => setError("")} className="bg-red-500/[0.06] border border-red-500/[0.15] rounded-xl p-3 mb-4">
                <Text className="text-red-600 text-sm font-semibold text-center">{error}</Text>
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

          <View className={`flex-row justify-between items-center ${isMobile ? "mt-3 pt-3" : "mt-6 pt-5"} border-t border-white/15`}>
            <Text className="text-xs text-white/50 font-medium">No account registered?</Text>
            <Pressable onPress={() => router.push("/register")} className="py-3 px-3" accessibilityLabel="Create account">
              <Text className="text-xs font-extrabold text-indigo-400">Create Account →</Text>
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
