import { Redirect, router } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform as RNPlatform, Dimensions, Modal } from "react-native";

import { Field } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { AuthPageLayout } from "@/src/components/ui/auth-page-layout";
import { MotionDiv } from "@/src/lib/motion";
import { motionPresets } from "@/src/lib/motion-config";
import { Shield, Eye, EyeOff } from "lucide-react-native";
import { useIsMobile } from "@/src/hooks";

export default function RegisterScreen() {
  const { register, user, api } = useAuth();
  const isMobile = useIsMobile();
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
  const [showPassword, setShowPassword] = useState(false);
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
        console.warn("Failed to load lecturers:", err);
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

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setError("Name, Email, and Password are required.");
      return;
    }
    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setError(passwordError);
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

  const content = (
    <AuthPageLayout
      align="start"
      leftContent={
        <>
          {/* Badge — minimal inline indicator */}
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-2 h-2 rounded-full bg-tier-accent-primary" />
            <Text className="text-[10px] font-black uppercase tracking-[1.5px] text-tier-text-secondary">
              Account Registration
            </Text>
          </View>

          {/* Headline — Apple typography hierarchy */}
          <MotionDiv {...motionPresets.fadeUp(0)}>
            <Text className="text-4xl md:text-5xl font-display font-bold tracking-tight leading-tight text-tier-text-primary">
              Create Your{"\n"}Academic Profile
            </Text>
          </MotionDiv>

          <MotionDiv {...motionPresets.fadeUp(0.1)}>
            <Text className="text-sm leading-relaxed text-tier-text-tertiary mt-4">
              Register your profile to initiate structured thesis tracking. Connect with
              your advisor, manage revision loops, and compile supervision milestones.
            </Text>
          </MotionDiv>

          {/* Info card */}
          <MotionDiv {...motionPresets.fadeUp(0.2)}>
            <GlassCard className="flex-row gap-4 items-start p-5">
              <View className="h-9 w-9 rounded-lg bg-tier-accent-success/10 items-center justify-center mt-0.5">
                <Shield size={16} color="#14B8A6" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-black uppercase tracking-[1px] text-tier-accent-cyan mb-1">
                  Role-Based Controls
                </Text>
                <Text className="text-xs leading-[18px] text-tier-text-tertiary font-medium">
                  Access levels are strictly segregated between students and advisors to
                  maintain professional boundaries and progress audit compliance.
                </Text>
              </View>
            </GlassCard>
          </MotionDiv>
        </>
      }
      rightContent={
        <GlassCard
          className={isMobile ? "px-4 py-3" : "p-8"}
          style={isMobile
            ? { borderWidth: 0, backgroundColor: "transparent", zIndex: showLecturerDropdown ? 50 : 1 }
            : { zIndex: showLecturerDropdown ? 50 : 1 }
          }
        >
          <Text className={`${isMobile ? "text-lg" : "text-xl"} font-display font-bold tracking-tight text-tier-text-primary mb-0.5`}>
            Create Account
          </Text>
          <Text className={`text-xs font-medium text-tier-text-tertiary ${isMobile ? "mb-2" : "mb-4"}`}>
            Choose your role and fill in your details.
          </Text>

          {/* Role Switcher Tabs */}
          <View className={`flex-row bg-tier-surface-raised border border-tier-divider-light rounded-xl p-1 ${isMobile ? "mb-3" : "mb-6"} gap-1`}>
            <Pressable
              onPress={() => setRole("student")}
              className={`flex-1 py-3 rounded-lg items-center justify-center ${
                role === "student" ? "bg-tier-accent-primary" : ""
              }`}
            >
              <Text className={`text-xs font-bold ${
                role === "student" ? "text-tier-text-inverse" : "text-tier-text-tertiary"
              }`}>
                Student Profile
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRole("lecturer")}
              className={`flex-1 py-3 rounded-lg items-center justify-center ${
                role === "lecturer" ? "bg-tier-accent-primary" : ""
              }`}
            >
              <Text className={`text-xs font-bold ${
                role === "lecturer" ? "text-tier-text-inverse" : "text-tier-text-tertiary"
              }`}>
                Academic Advisor
              </Text>
            </Pressable>
          </View>

          {/* Form Fields */}
          <View className="gap-0" style={{ zIndex: showLecturerDropdown ? 100 : 1, elevation: showLecturerDropdown ? 100 : 1 }}>
            <Field
              label="Full Name & Credentials"
              placeholder="Jonathan Doe, M.Sc."
              value={form.name}
              onChangeText={(v) => patch("name", v)}
              returnKeyType="next"
              autoComplete="name"
            />
            <Field
              label="Institutional Email Address"
              placeholder="email@university.edu"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(v) => patch("email", v)}
              returnKeyType="next"
              autoComplete="email"
            />
            <Field
              label="Account Password"
              placeholder="Minimum 8 characters"
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(v) => patch("password", v)}
              returnKeyType="done"
              autoComplete="new-password"
              onSubmitEditing={() => void handleRegister()}
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

            {role === "student" ? (
              <View className="gap-1" style={{ zIndex: showLecturerDropdown ? 101 : 1, elevation: showLecturerDropdown ? 101 : 1 }}>
                <View
                  className={isMobile ? "flex-col" : "flex-row gap-3"}
                  style={{
                    zIndex: showLecturerDropdown ? 102 : 1,
                    elevation: showLecturerDropdown ? 102 : 1,
                  }}
                >
                  <View className={isMobile ? "w-full" : "flex-1"}>
                    <Field
                      label="Student ID (NIM)"
                      placeholder="240601..."
                      value={form.nim}
                      onChangeText={(v) => patch("nim", v)}
                    />
                  </View>
                  <View
                    className={isMobile ? "w-full relative mb-2" : "flex-1 relative mb-2"}
                    style={{
                      zIndex: showLecturerDropdown ? 999 : 1,
                      elevation: showLecturerDropdown ? 999 : 1,
                    }}
                  >
                    <Text className="text-xs font-bold uppercase tracking-wider pl-0.5 text-tier-text-secondary mb-1.5">
                      Academic Advisor
                    </Text>
                    <Pressable
                      onPress={() => setShowLecturerDropdown(!showLecturerDropdown)}
                      className="flex-row items-center justify-between bg-tier-surface-raised border border-tier-divider-light rounded-xl px-4 py-3.5 min-h-[48px]"
                      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                    >
                      <Text className="text-xs font-medium text-tier-text-primary" numberOfLines={1}>
                        {selectedLecturerName}
                      </Text>
                      <Text className="text-[10px] font-black text-tier-accent-primary">
                        {showLecturerDropdown ? "\u25B2" : "\u25BC"}
                      </Text>
                    </Pressable>

                    {isMobile && (
                      <Modal
                        visible={showLecturerDropdown}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowLecturerDropdown(false)}
                      >
                        <View style={{ flex: 1, justifyContent: "flex-end" }}>
                          <Pressable
                            onPress={() => setShowLecturerDropdown(false)}
                            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)" }}
                          />
                          <View style={{ backgroundColor: "#0F172A", borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 16, maxHeight: Dimensions.get("window").height * 0.6 }}>
                            <View style={{ alignItems: "center", marginBottom: 12 }}>
                              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 12 }} />
                              <Text className="text-sm font-bold text-tier-text-primary">Select Academic Advisor</Text>
                            </View>
                            <ScrollView nestedScrollEnabled={true} contentContainerStyle={{ gap: 6 }}>
                              {lecturers.map((lec) => {
                                const isSelected = String(lec.id) === form.lecturer_id;
                                return (
                                  <Pressable
                                    key={lec.id}
                                    onPress={() => {
                                      patch("lecturer_id", String(lec.id));
                                      setShowLecturerDropdown(false);
                                    }}
                                    className="flex-row items-center justify-between p-3 rounded-lg"
                                    style={{
                                      backgroundColor: isSelected ? "rgba(99, 102, 241, 0.08)" : "transparent",
                                      borderWidth: 1,
                                      borderColor: isSelected ? "rgba(99, 102, 241, 0.15)" : "transparent",
                                    }}
                                  >
                                    <View className="flex-1">
                                      <Text className={`text-sm font-bold ${isSelected ? "text-tier-accent-primary" : "text-tier-text-primary"}`} numberOfLines={1}>
                                        {lec.name}
                                      </Text>
                                      <Text className="text-[11px] text-tier-text-tertiary mt-0.5">
                                        NIP: {lec.nip} | {lec.faculty}
                                      </Text>
                                    </View>
                                    {isSelected && <View className="w-2 h-2 rounded-full bg-tier-accent-primary" />}
                                  </Pressable>
                                );
                              })}
                              {lecturers.length === 0 && (
                                <Text className="text-tier-text-tertiary text-xs text-center py-3">
                                  No advisors registered yet
                                </Text>
                              )}
                            </ScrollView>
                            <Pressable onPress={() => setShowLecturerDropdown(false)} className="mt-3 py-3 items-center">
                              <Text className="text-tier-accent-primary text-sm font-bold">Cancel</Text>
                            </Pressable>
                          </View>
                        </View>
                      </Modal>
                    )}

                    {!isMobile && showLecturerDropdown && (
                      <GlassCard
                        className="absolute top-[54px] left-0 right-0 max-h-[200px] p-2 bg-tier-surface border-tier-divider-light"
                        style={{
                          boxShadow: "0 10px 15px rgba(0,0,0,0.3)",
                          zIndex: 9999,
                          elevation: 9999,
                        }}
                      >
                        <ScrollView
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
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
                                className="flex-row items-center justify-between p-3 rounded-lg"
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
                                  <Text className={`text-xs font-bold ${isSelected ? "text-tier-accent-primary" : "text-tier-text-primary"}`} numberOfLines={1}>
                                    {lec.name}
                                  </Text>
                                  <Text className="text-[10px] text-tier-text-tertiary mt-0.5">
                                    NIP: {lec.nip} | {lec.faculty}
                                  </Text>
                                </View>
                                {isSelected && <View className="w-1.5 h-1.5 rounded-full bg-tier-accent-primary" />}
                              </Pressable>
                            );
                          })}
                          {lecturers.length === 0 && (
                            <Text className="text-tier-text-tertiary text-xs text-center py-2">
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
                <View className={isMobile ? "flex-col" : "flex-row gap-3"}>
                  <View className={isMobile ? "w-full" : "flex-1"}>
                    <Field
                      label="Advisor ID Number (NIP)"
                      placeholder="198001..."
                      value={form.nip}
                      onChangeText={(v) => patch("nip", v)}
                    />
                  </View>
                  <View className={isMobile ? "w-full" : "flex-1"}>
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
              <Pressable onPress={() => setError("")} className="bg-tier-accent-danger/8 border border-tier-accent-danger/15 rounded-xl p-3 mb-4">
                <Text className="text-tier-accent-danger-bright text-sm font-semibold text-center">{error}</Text>
              </Pressable>
            ) : null}

            <View className={`${isMobile ? "mt-1" : "mt-2"}`}>
              <ElegantButton
                title={loading ? "Registering Profile..." : "Register Profile"}
                onPress={() => void handleRegister()}
                disabled={loading}
                tone="primary"
                accessibilityLabel="Register account"
              />
            </View>
          </View>

          <View className={`flex-row justify-between items-center ${isMobile ? "mt-3 pt-3" : "mt-6 pt-5"} border-t border-tier-divider-light`}>
            <Text className="text-xs text-tier-text-tertiary font-medium">Already have a registered account?</Text>
            <Pressable onPress={() => router.push("/login")} className="py-3 px-3" accessibilityLabel="Sign in instead">
              <Text className="text-xs font-bold text-tier-accent-primary">Sign In →</Text>
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
