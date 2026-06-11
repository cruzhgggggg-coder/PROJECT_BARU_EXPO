import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";

import { Field } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { AnimatedBadge } from "@/src/components/ui/animated-badge";
import { TextReveal } from "@/src/components/ui/text-reveal";
import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { AuthPageLayout } from "@/src/components/ui/auth-page-layout";
import { Cpu } from "lucide-react";

export default function LoginScreen() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <AuthPageLayout
      leftContent={
        <>
          <AnimatedBadge label="SECURE ACCESS" dotColor="bg-emerald-500/80" />

          <TextReveal text="Sign In to" className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white" />
          <TextReveal text="Your Workspace" delay={0.2} className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white" />

          <Text className="text-white/40 text-sm leading-relaxed">
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
              <Text className="text-xs leading-[18px] text-white/40 font-medium">
                Your credentials and academic submissions are encrypted in transit
                and at rest to safeguard research confidentiality.
              </Text>
            </View>
          </GlassCard>
        </>
      }
      rightContent={
        <GlassCard className="p-8">
          <Text className="text-xl font-black tracking-tight text-white mb-1">
            User Authentication
          </Text>
          <Text className="text-xs font-medium text-white/40 mb-6">
            Provide your academic email address and account password.
          </Text>

          <View className="gap-1">
            <Field
              label="Academic Email Address"
              placeholder="email@university.edu"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Account Password"
              placeholder="••••••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? (
              <View className="bg-red-500/[0.06] border border-red-500/[0.15] rounded-xl p-3 mb-4">
                <Text className="text-red-600 text-sm font-semibold text-center">{error}</Text>
              </View>
            ) : null}

            <View className="mt-2">
              <ElegantButton
                title={loading ? "Authenticating..." : "Sign In"}
                onPress={() => void handleLogin()}
                disabled={loading}
                tone="primary"
              />
            </View>
          </View>

          <View className="flex-row justify-between items-center mt-6 pt-5 border-t border-white/[0.08]">
            <Text className="text-xs text-white/30 font-medium">No account registered?</Text>
            <Pressable onPress={() => router.push("/register")} className="py-1 px-1">
              <Text className="text-xs font-extrabold text-indigo-400">Create Account →</Text>
            </Pressable>
          </View>
        </GlassCard>
      }
    />
  );
}
