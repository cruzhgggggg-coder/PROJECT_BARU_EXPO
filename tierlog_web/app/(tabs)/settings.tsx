import React from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { User, Lock, Cpu, LogOut } from "lucide-react-native";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Heading, Page } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";

const settingsLinks = [
  { href: "/settings/profile", label: "Profile Settings", Icon: User, description: "Update your profile information and academic credentials." },
  { href: "/settings/security", label: "Security Center", Icon: Lock, description: "Manage your account password and security settings." },
  { href: "/settings/ai-gateway", label: "AI Gateway", Icon: Cpu, description: "Configure API credentials and select AI models." },
] as const;

export default function SettingsMenuScreen() {
  const { logout } = useAuth();

  return (
    <RequireAuth>
      <Page>
        <NavBar />
        <Heading
          title="Settings"
          subtitle="Manage your account, security, and AI gateway configuration."
        />

        <View className="gap-3 mt-3">
          {settingsLinks.map((link) => {
            const Icon = link.Icon;
            return (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href as any)}
                accessibilityLabel={link.label}
                accessibilityRole="button"
                style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
              >
                <GlassCard className="p-5">
                  <View className="flex-row items-center gap-4">
                    <View className="w-11 h-11 rounded-xl bg-indigo-500/[0.10] items-center justify-center border border-indigo-500/[0.20]">
                      <Icon color="#6366F1" size={20} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-black tracking-tight text-[#F8FAFC]">{link.label}</Text>
                      <Text className="text-[12px] font-medium text-[#94A3B8] mt-0.5">{link.description}</Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => void logout()}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
          >
            <GlassCard className="p-5">
              <View className="flex-row items-center gap-4">
                <View className="w-11 h-11 rounded-xl bg-red-500/[0.10] items-center justify-center border border-red-500/[0.20]">
                  <LogOut color="#EF4444" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-black tracking-tight text-red-400">Sign Out</Text>
                  <Text className="text-[12px] font-medium text-[#94A3B8] mt-0.5">Log out of your TierLog account.</Text>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        </View>
      </Page>
    </RequireAuth>
  );
}
