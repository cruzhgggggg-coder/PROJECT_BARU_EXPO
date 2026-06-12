import React, { useState } from "react";
import { Text, View } from "react-native";
import { Lock, CheckCircle, AlertCircle } from "lucide-react-native";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Button, Field, Heading, Page } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";

export default function SecurityScreen() {
  const { api } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);

  const save = async () => {
    if (!currentPassword || !password) {
      setMessage("All password fields are required.");
      setIsSuccess(false);
      return;
    }
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
    }
  };

  return (
    <RequireAuth>
      <Page>
        <NavBar />

        <Heading
          title="Security Center"
          subtitle="Manage your account password and security settings."
        />

        <View className="flex-row gap-8 flex-wrap items-start mt-3">
          <View className="flex-1 min-w-[300px] gap-4">
            <View className="flex-row items-center gap-2 self-start bg-[rgba(5,150,105,0.08)] border border-[rgba(5,150,105,0.15)] px-3 py-1.5 rounded-lg">
              <Lock color="#059669" size={16} />
              <Text className="text-[10px] font-black tracking-[2px] text-[#059669]">ENCRYPTION ACTIVE</Text>
            </View>
            <Text className="text-2xl font-black tracking-tight text-[#F8FAFC]">Password Security</Text>
            <Text className="text-sm leading-[22px] font-medium text-[#94A3B8]">
              All passwords are securely hashed before storage. Your credentials are never stored in plain text.
            </Text>
            <View className="flex-row items-center gap-2.5 mt-1">
              <View className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              <Text className="text-[13px] font-semibold text-[#94A3B8]">Minimum requirement: 8 characters.</Text>
            </View>
            <View className="flex-row items-center gap-2.5 mt-1">
              <View className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              <Text className="text-[13px] font-semibold text-[#94A3B8]">All requests are authenticated via secure tokens over HTTPS.</Text>
            </View>
          </View>

          <View className="flex-[1.2] min-w-[320px]">
            <GlassCard className="p-8">
              <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-6">
                <Lock color="#4F46E5" size={20} />
                <Text className="text-lg font-black tracking-tight text-[#F8FAFC]">Update Credentials</Text>
              </View>

              <View className="gap-2">
                <Field
                  label="Current Password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
                <Field
                  label="New Password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                {message ? (
                  <View className={`flex-row items-center gap-2.5 rounded-xl border p-3.5 mb-4 ${
                    isSuccess
                      ? "bg-[rgba(5,150,105,0.06)] border-[rgba(5,150,105,0.2)]"
                      : "bg-[rgba(220,38,38,0.06)] border-[rgba(220,38,38,0.2)]"
                  }`}>
                    {isSuccess ? (
                      <CheckCircle color="#059669" size={18} />
                    ) : (
                      <AlertCircle color="#DC2626" size={18} />
                    )}
                    <Text className={`text-[13px] font-semibold flex-1 ${isSuccess ? "text-[#059669]" : "text-[#DC2626]"}`}>
                      {message}
                    </Text>
                  </View>
                ) : null}

                <Button title="Update Password" onPress={() => void save()} />
              </View>
            </GlassCard>
          </View>
        </View>
      </Page>
    </RequireAuth>
  );
}
