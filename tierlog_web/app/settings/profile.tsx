import React, { useState } from "react";
import { KeyboardAvoidingView, Platform as RNPlatform, Text, TextInput, View } from "react-native";
import { User, CheckCircle, AlertCircle, Cpu } from "lucide-react-native";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Button, Field, Heading, Page } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { useIsMobile } from "@/src/hooks";
import type { User as UserType } from "@/src/types";

export default function ProfileScreen() {
  const isMobile = useIsMobile();
  const { api, user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [nim, setNim] = useState(user?.student?.nim ?? "");
  const [prodi, setProdi] = useState(user?.student?.prodi ?? "");
  const [thesisTitle, setThesisTitle] = useState(user?.student?.thesis_title ?? "");
  const [lecturerId, setLecturerId] = useState(String(user?.student?.lecturer_id ?? ""));
  const [nip, setNip] = useState(user?.lecturer?.nip ?? "");
  const [faculty, setFaculty] = useState(user?.lecturer?.faculty ?? "");
  const [keahlian, setKeahlian] = useState(user?.lecturer?.keahlian ?? "");
  const [aiConstraints, setAiConstraints] = useState(user?.lecturer?.ai_constraints ?? "");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const response = await api<{ user: UserType; message: string }>("/settings/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          email,
          nim,
          prodi,
          thesis_title: thesisTitle,
          lecturer_id: lecturerId ? Number(lecturerId) : 0,
          nip,
          faculty,
          keahlian,
          ai_constraints: aiConstraints,
        }),
      });
      setUser(response.user);
      setMessage(response.message);
      setIsSuccess(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save profile");
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
          title="Profile Settings"
          subtitle="Update your profile information and academic credentials."
        />

        <View className="mt-3 w-full">
          <GlassCard className={isMobile ? "p-4" : "p-8"}>
            <View className="flex-row items-center gap-2.5 border-b border-tier-border-subtle pb-4 mb-6">
              <User color="#6366F1" size={20} />
              <Text className="text-lg font-bold tracking-tight text-tier-text-primary font-display">Account Information</Text>
            </View>

            <View className="gap-4">
              <View className={isMobile ? "flex-col gap-2" : "flex-row gap-4 flex-wrap"}>
                <View className="flex-1">
                  <Field label="Full Name" value={name} onChangeText={setName} />
                </View>
                <View className="flex-1">
                  <Field label="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>
              </View>

              {user?.role === "student" ? (
                <View className="bg-tier-surface-sunken border border-tier-border-subtle rounded-base p-5 my-3 gap-3.5">
                  <Text className="text-[10px] font-bold tracking-[1.5px] text-tier-accent-primary">ACADEMIC AFFILIATION (STUDENT)</Text>
                  <View className="gap-4">
                    <View className={isMobile ? "flex-col gap-2" : "flex-row gap-4 flex-wrap"}>
                      <View className="flex-1">
                        <Field label="Student ID (NIM)" value={nim} onChangeText={setNim} />
                      </View>
                      <View className="flex-1">
                        <Field label="Program of Study" value={prodi} onChangeText={setProdi} />
                      </View>
                    </View>

                    <View className={isMobile ? "flex-col gap-2" : "flex-row gap-4 flex-wrap"}>
                      <View className="flex-[1.5]">
                        <Field label="Thesis / Dissertation Title" value={thesisTitle} onChangeText={setThesisTitle} />
                      </View>
                      <View className="flex-[0.5]">
                        <Field label="Academic Advisor ID" value={lecturerId} onChangeText={setLecturerId} keyboardType="numeric" />
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <>
                  <View className="bg-tier-surface-sunken border border-tier-border-subtle rounded-base p-5 my-3 gap-3.5">
                    <Text className="text-[10px] font-bold tracking-[1.5px] text-tier-accent-primary">ACADEMIC AFFILIATION (LECTURER)</Text>
                    <View className="gap-4">
                      <View className={isMobile ? "flex-col gap-2" : "flex-row gap-4 flex-wrap"}>
                        <View className="flex-1">
                          <Field label="Advisor ID Number (NIP)" value={nip} onChangeText={setNip} />
                        </View>
                        <View className="flex-1">
                          <Field label="Faculty / Department" value={faculty} onChangeText={setFaculty} />
                        </View>
                      </View>

                      <View className={isMobile ? "flex-col gap-2" : "flex-row gap-4 flex-wrap"}>
                        <View className="flex-1">
                          <Field label="Primary Research Domain (Expertise)" value={keahlian} onChangeText={setKeahlian} />
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="bg-tier-surface-sunken border border-tier-border-subtle rounded-base p-5 my-3 gap-3.5">
                    <View className="flex-row items-center gap-2.5">
                      <Cpu color="#8B5CF6" size={16} />
                      <Text className="text-[10px] font-bold tracking-[1.5px] text-tier-accent-violet">AI LLM PERSONALIZATION CONSTRAINTS</Text>
                    </View>
                    <Text className="text-[11px] text-tier-text-secondary leading-[16px]">
                      Define custom instructions that will be injected into the AI system prompt when analyzing your students' submissions.
                      This allows you to personalize how the AI evaluates and provides feedback based on your specific academic standards.
                    </Text>
                    <View className="relative">
                      <TextInput
                        value={aiConstraints}
                        onChangeText={setAiConstraints}
                        placeholder="e.g., Focus on methodology validation. Use APA 7th edition. Prioritize quantitative analysis rigor..."
                        placeholderTextColor="#64748B"
                        multiline
                        numberOfLines={4}
                        className={`text-tier-text-primary bg-tier-surface-sunken border border-tier-border-subtle rounded-base p-3.5 text-[13px] font-medium leading-[22px] outline-none ${isMobile ? "min-h-[80px]" : "min-h-[100px]"}`}
                        style={RNPlatform.OS === "web" ? ({ textAlignVertical: "top", outlineStyle: "none" } as any) : { textAlignVertical: "top" }}
                      />
                    </View>
                  </View>
                </>
              )}

              {message ? (
                <View className={`flex-row items-center gap-2.5 rounded-base border p-3.5 my-2 ${
                  isSuccess
                    ? "bg-tier-accent-success/10 border-tier-accent-success/20"
                    : "bg-tier-accent-rose/10 border-tier-accent-rose/20"
                }`}>
                  {isSuccess ? (
                    <CheckCircle color="#10B981" size={18} />
                  ) : (
                    <AlertCircle color="#F43F5E" size={18} />
                  )}
                  <Text className={`text-[13px] font-semibold flex-1 ${isSuccess ? "text-tier-accent-success" : "text-tier-accent-danger"}`}>
                    {message}
                  </Text>
                </View>
              ) : null}

              <View className="mt-2">
                <Button title={saving ? "Saving..." : "Save Changes"} onPress={() => void save()} disabled={saving} />
              </View>
            </View>
          </GlassCard>
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
