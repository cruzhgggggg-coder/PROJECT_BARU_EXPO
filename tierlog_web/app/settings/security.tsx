import React, { useState } from "react";
import { KeyboardAvoidingView, Platform as RNPlatform, Text, View } from "react-native";
import { Lock, CheckCircle, AlertCircle } from "lucide-react-native";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Button, Field, Heading, Page } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { useIsMobile } from "@/src/hooks";

export default function SecurityScreen() {
  const isMobile = useIsMobile();
  const { api } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!currentPassword || !password) {
      setMessage("All password fields are required.");
      setIsSuccess(false);
      return;
    }
    setSaving(true);
    try {
      const response = await api<{ message: string }>("/settings/password", {
        method: "PUT",
        body: JSON.stringify({ current_password: currentPassword, password }),
      });
      setMessage(response.message);
      setIsSuccess(true);
      setCurrentPassword("");
      setPassword("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update password");
      setIsSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <RequireAuth>
      <Page contentContainerStyle={{ paddingHorizontal: isMobile ? 12 : 24, paddingVertical: isMobile ? 16 : 32 }}>
        <NavBar />

        <Heading
          title="Security Center"
          subtitle="Manage your account password and security settings."
        />

        <View className={`${isMobile ? "flex-col gap-4" : "flex-row gap-8 flex-wrap"} items-start mt-3`}>
          <View className={isMobile ? "w-full gap-2" : "flex-1 min-w-[300px] gap-4"}>
            <View className="flex-row items-center gap-2 self-start bg-tier-accent-emerald/10 border border-tier-accent-emerald/20 px-3 py-1.5 rounded-lg">
              <Lock color="#10B981" size={16} />
              <Text className="text-[10px] font-bold tracking-[2px] text-tier-accent-emerald">ENCRYPTION ACTIVE</Text>
            </View>
            <Text className="text-2xl font-bold tracking-tight text-tier-text-primary font-display">Password Security</Text>
            <Text className="text-sm leading-[22px] font-medium text-tier-text-secondary">
              All passwords are securely hashed before storage. Your credentials are never stored in plain text.
            </Text>
            <View className="flex-row items-center gap-2.5 mt-1">
              <View className="w-1.5 h-1.5 rounded-full bg-tier-accent-primary" />
              <Text className="text-[13px] font-semibold text-tier-text-secondary">Minimum requirement: 8 characters.</Text>
            </View>
            <View className="flex-row items-center gap-2.5 mt-1">
              <View className="w-1.5 h-1.5 rounded-full bg-tier-accent-primary" />
              <Text className="text-[13px] font-semibold text-tier-text-secondary">All requests are authenticated via secure tokens over HTTPS.</Text>
            </View>
          </View>

          <View className={isMobile ? "w-full" : "flex-[1.2] min-w-[320px]"}>
            <GlassCard className={isMobile ? "p-4" : "p-8"}>
              <View className="flex-row items-center gap-2.5 border-b border-tier-border-subtle pb-4 mb-6">
                <Lock color="#6366F1" size={20} />
                <Text className="text-lg font-bold tracking-tight text-tier-text-primary font-display">Update Credentials</Text>
              </View>

              <View className="gap-4">
                <Field
                  label="Current Password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  returnKeyType="next"
                />
                <Field
                  label="New Password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={() => void save()}
                />

                {message ? (
                  <View className={`flex-row items-center gap-2.5 rounded-base border p-3.5 my-2 ${
                    isSuccess
                      ? "bg-tier-accent-emerald/10 border-tier-accent-emerald/20"
                      : "bg-tier-accent-rose/10 border-tier-accent-rose/20"
                  }`}>
                    {isSuccess ? (
                      <CheckCircle color="#10B981" size={18} />
                    ) : (
                      <AlertCircle color="#F43F5E" size={18} />
                    )}
                    <Text className={`text-[13px] font-semibold flex-1 ${isSuccess ? "text-tier-accent-emerald" : "text-tier-accent-danger"}`}>
                      {message}
                    </Text>
                  </View>
                ) : null}

                <View className="mt-2">
                  <Button title={saving ? "Updating..." : "Update Password"} onPress={() => void save()} disabled={saving} />
                </View>
              </View>
            </GlassCard>
          </View>
        </View>
      </Page>
    </RequireAuth>
  );

  if (RNPlatform.OS !== "web") {
    return (
      <KeyboardAvoidingView behavior={RNPlatform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {content}
      </KeyboardAvoidingView>
    );
  }
  return content;
}
