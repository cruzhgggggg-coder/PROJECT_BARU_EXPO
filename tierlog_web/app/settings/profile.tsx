import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
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

  const save = async () => {
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
            <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-6">
              <User color="#4F46E5" size={20} />
              <Text className="text-lg font-black tracking-tight text-[#F8FAFC]">Account Information</Text>
            </View>

            <View className="gap-2">
              <View className={isMobile ? "flex-col gap-2" : "flex-row gap-4 flex-wrap"}>
                <View className="flex-1">
                  <Field label="Full Name" value={name} onChangeText={setName} />
                </View>
                <View className="flex-1">
                  <Field label="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" />
                </View>
              </View>

              {user?.role === "student" ? (
                <View className="bg-white/[0.02] border border-white/[0.06] rounded-[18px] p-5 my-3 gap-3.5">
                  <Text className="text-[10px] font-black tracking-[1.5px] text-[#6366F1]">ACADEMIC AFFILIATION (STUDENT)</Text>
                  <View className="gap-2">
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
                        <Field label="Academic Advisor ID" value={lecturerId} onChangeText={setLecturerId} />
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <>
                <View className="bg-white/[0.02] border border-white/[0.06] rounded-[18px] p-5 my-3 gap-3.5">
                  <Text className="text-[10px] font-black tracking-[1.5px] text-[#6366F1]">ACADEMIC AFFILIATION (LECTURER)</Text>
                  <View className="gap-2">
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

                <View className="bg-white/[0.02] border border-white/[0.06] rounded-[18px] p-5 my-3 gap-3.5">
                  <View className="flex-row items-center gap-2.5">
                    <Cpu color="#7C3AED" size={16} />
                    <Text className="text-[10px] font-black tracking-[1.5px] text-[#7C3AED]">AI LLM PERSONALIZATION CONSTRAINTS</Text>
                  </View>
                  <Text className="text-[11px] text-slate-400 leading-[16px]">
                    Define custom instructions that will be injected into the AI system prompt when analyzing your students' submissions.
                    This allows you to personalize how the AI evaluates and provides feedback based on your specific academic standards.
                  </Text>
                  <TextInput
                    value={aiConstraints}
                    onChangeText={setAiConstraints}
                    placeholder="e.g., Focus on methodology validation. Use APA 7th edition. Prioritize quantitative analysis rigor..."
                    placeholderTextColor="#475569"
                    multiline
                    numberOfLines={4}
                    className={`text-slate-50 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 text-[13px] font-medium leading-[22px] ${isMobile ? "min-h-[80px]" : "min-h-[100px]"}`}
                    style={{ textAlignVertical: "top", outlineStyle: "none" } as any}
                  />
                </View>
                </>
              )}

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

              <Button title="Save Changes" onPress={() => void save()} />
            </View>
          </GlassCard>
        </View>
      </Page>
    </RequireAuth>
  );

  if (Platform.OS !== "web") {
    return (
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {content}
      </KeyboardAvoidingView>
    );
  }
  return content;
}
