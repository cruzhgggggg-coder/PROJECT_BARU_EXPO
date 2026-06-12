import { Redirect, router } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";

import { Field } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { AnimatedBadge } from "@/src/components/ui/animated-badge";
import { GradientText } from "@/src/components/ui/gradient-text";
import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { AuthPageLayout } from "@/src/components/ui/auth-page-layout";
import { Shield } from "lucide-react";

export default function RegisterScreen() {
  const { register, user, api } = useAuth();
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [showLecturerDropdown, setShowLecturerDropdown] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    nim: "",
    lecturer_id: "",
    prodi: "",
    thesis_title: "",
    nip: "",
    faculty: "",
    keahlian: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const response = await api<{ data: any[] }>("/auth/lecturers", { auth: false });
        if (response && response.data) {
          setLecturers(response.data);
          if (response.data.length > 0) {
            setForm((current) => ({
              ...current,
              lecturer_id: String(response.data[0].id),
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load lecturers:", err);
      }
    };
    void fetchLecturers();
  }, [api]);

  if (user) {
    return <Redirect href="/dashboard" />;
  }

  const patch = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const selectedLecturer = lecturers.find((lec) => String(lec.id) === form.lecturer_id);
  const selectedLecturerName = selectedLecturer ? selectedLecturer.name : "Select Advisor...";

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setError("Name, Email, and Password are required.");
      return;
    }
    if (role === "student" && !form.lecturer_id) {
      setError("Academic Advisor selection is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        nim: form.nim,
        lecturer_id: Number(form.lecturer_id),
        prodi: form.prodi,
        thesis_title: form.thesis_title,
        nip: form.nip,
        faculty: form.faculty,
        keahlian: form.keahlian,
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      align="start"
      leftContent={
        <>
          <AnimatedBadge label="ACCOUNT REGISTRATION" dotColor="bg-indigo-500/80" />

          <GradientText
            gradientFrom="from-white"
            gradientTo="to-white/70"
            className="text-4xl md:text-5xl font-black tracking-tight leading-tight"
          >
            Create Your{"\n"}Academic Profile
          </GradientText>

          <Text className="text-white/40 text-sm leading-relaxed">
            Register your profile to initiate structured thesis tracking. Connect with
            your advisor, manage revision loops, and compile supervision milestones.
          </Text>

          <GlassCard className="flex-row gap-4 items-start p-5">
            <View className="h-9 w-9 rounded-lg bg-emerald-500/10 items-center justify-center mt-0.5">
              <Shield size={16} color="#14B8A6" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-black uppercase tracking-[1px] text-emerald-400 mb-1">
                Role-Based Controls
              </Text>
              <Text className="text-xs leading-[18px] text-white/40 font-medium">
                Access levels are strictly segregated between students and advisors to
                maintain professional boundaries and progress audit compliance.
              </Text>
            </View>
          </GlassCard>
        </>
      }
      rightContent={
        <GlassCard className="p-8">
          <Text className="text-xl font-black tracking-tight text-white mb-1">
            Registration Console
          </Text>
          <Text className="text-xs font-medium text-white/40 mb-6">
            Select your academic role and provide the required information.
          </Text>

          {/* Role Switcher Tabs */}
          <View className="flex-row bg-white/[0.02] border border-white/[0.08] rounded-xl p-1 mb-6 gap-1">
            <Pressable
              onPress={() => setRole("student")}
              className={`flex-1 py-2.5 rounded-lg items-center justify-center ${
                role === "student" ? "bg-indigo-600" : ""
              }`}
            >
              <Text className={`text-xs font-bold ${
                role === "student" ? "text-white" : "text-white/40"
              }`}>
                Student Profile
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRole("lecturer")}
              className={`flex-1 py-2.5 rounded-lg items-center justify-center ${
                role === "lecturer" ? "bg-indigo-600" : ""
              }`}
            >
              <Text className={`text-xs font-bold ${
                role === "lecturer" ? "text-white" : "text-white/40"
              }`}>
                Academic Advisor
              </Text>
            </Pressable>
          </View>

          {/* Form Fields */}
          <View className="gap-1" style={{ zIndex: showLecturerDropdown ? 100 : 1 }}>
            <Field
              label="Full Name & Credentials"
              placeholder="Jonathan Doe, M.Sc."
              value={form.name}
              onChangeText={(v) => patch("name", v)}
            />
            <Field
              label="Institutional Email Address"
              placeholder="email@university.edu"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(v) => patch("email", v)}
            />
            <Field
              label="Account Password"
              placeholder="Minimum 8 characters"
              secureTextEntry
              value={form.password}
              onChangeText={(v) => patch("password", v)}
            />

            {role === "student" ? (
              <View className="gap-1" style={{ zIndex: showLecturerDropdown ? 101 : 1 }}>
                <View className="flex-row gap-3" style={{ zIndex: showLecturerDropdown ? 102 : 1 }}>
                  <View className="flex-1">
                    <Field
                      label="Student ID (NIM)"
                      placeholder="240601..."
                      value={form.nim}
                      onChangeText={(v) => patch("nim", v)}
                    />
                  </View>
                  <View className="flex-1 relative z-[999]">
                    <Text className="text-xs font-bold uppercase tracking-wider pl-0.5 text-[#94A3B8] mb-1.5">
                      Academic Advisor
                    </Text>
                    <Pressable
                      onPress={() => setShowLecturerDropdown(!showLecturerDropdown)}
                      className="flex-row items-center justify-between bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3.5 h-[48px]"
                      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                    >
                      <Text className="text-xs font-medium text-slate-200" numberOfLines={1}>
                        {selectedLecturerName}
                      </Text>
                      <Text className="text-[10px] font-black text-indigo-400">
                        {showLecturerDropdown ? "\u25B2" : "\u25BC"}
                      </Text>
                    </Pressable>

                    {showLecturerDropdown && (
                      <GlassCard
                        className="absolute top-[54px] left-0 right-0 max-h-[200px] p-2 z-[9999] bg-slate-950/95 border-white/[0.08]"
                        style={{ boxShadow: "0 10px 15px rgba(0,0,0,0.3)" }}
                      >
                        <ScrollView
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          {...({ className: "ultra-thin-scroll" } as any)}
                          contentContainerStyle={{ gap: 6 }}
                        >
                          {lecturers.map((lec) => {
                            const isSelected = String(lec.id) === form.lecturer_id;
                            return (
                              <Pressable
                                key={lec.id}
                                onPress={() => {
                                  patch("lecturer_id", String(lec.id));
                                  setShowLecturerDropdown(false);
                                }}
                                className="flex-row items-center justify-between p-2 rounded-lg"
                                style={({ pressed }) => [
                                  {
                                    backgroundColor: isSelected ? "rgba(99, 102, 241, 0.08)" : "transparent",
                                    borderWidth: 1,
                                    borderColor: isSelected ? "rgba(99, 102, 241, 0.15)" : "transparent",
                                    transform: [{ scale: pressed ? 0.98 : 1 }]
                                  }
                                ]}
                              >
                                <View className="flex-1">
                                  <Text className={`text-xs font-bold ${isSelected ? "text-indigo-400" : "text-slate-300"}`} numberOfLines={1}>
                                    {lec.name}
                                  </Text>
                                  <Text className="text-[10px] text-slate-500 mt-0.5">
                                    NIP: {lec.nip} | {lec.faculty}
                                  </Text>
                                </View>
                                {isSelected && <View className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                              </Pressable>
                            );
                          })}
                          {lecturers.length === 0 && (
                            <Text className="text-slate-500 text-xs text-center py-2">
                              No advisors registered yet
                            </Text>
                          )}
                        </ScrollView>
                      </GlassCard>
                    )}
                  </View>
                </View>
                <Field
                  label="Program of Study"
                  placeholder="Computer Science"
                  value={form.prodi}
                  onChangeText={(v) => patch("prodi", v)}
                />
                <Field
                  label="Thesis Research Title"
                  placeholder="Secure Distributed Architecture in Go"
                  value={form.thesis_title}
                  onChangeText={(v) => patch("thesis_title", v)}
                />
              </View>
            ) : (
              <View className="gap-1">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Field
                      label="Advisor ID Number (NIP)"
                      placeholder="198001..."
                      value={form.nip}
                      onChangeText={(v) => patch("nip", v)}
                    />
                  </View>
                  <View className="flex-1">
                    <Field
                      label="Faculty / Department"
                      placeholder="Science and Mathematics"
                      value={form.faculty}
                      onChangeText={(v) => patch("faculty", v)}
                    />
                  </View>
                </View>
                <Field
                  label="Primary Research Domain"
                  placeholder="Distributed Systems & Software Engineering"
                  value={form.keahlian}
                  onChangeText={(v) => patch("keahlian", v)}
                />
              </View>
            )}

            {error ? (
              <View className="bg-red-500/[0.06] border border-red-500/[0.15] rounded-xl p-3 mb-4">
                <Text className="text-red-600 text-sm font-semibold text-center">{error}</Text>
              </View>
            ) : null}

            <View className="mt-2">
              <ElegantButton
                title={loading ? "Registering Profile..." : "Register Profile"}
                onPress={() => void handleRegister()}
                disabled={loading}
                tone="primary"
              />
            </View>
          </View>

          <View className="flex-row justify-between items-center mt-6 pt-5 border-t border-white/[0.08]">
            <Text className="text-xs text-white/30 font-medium">Already have a registered account?</Text>
            <Pressable onPress={() => router.push("/login")} className="py-1 px-1">
              <Text className="text-xs font-extrabold text-indigo-400">Sign In →</Text>
            </Pressable>
          </View>
        </GlassCard>
      }
    />
  );
}
