import React, { useEffect, useCallback, useState, useRef } from "react";
import { Text, View, Pressable, Platform, BackHandler } from "react-native";
import { router } from "expo-router";
import { Cpu, CheckCircle, Clock, AlertCircle, User, Archive } from "lucide-react-native";
import { MotionDiv } from "@/src/lib/motion";
import { motionPresets } from "@/src/lib/motion-config";

import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Heading, Page, StatCard, Badge } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { useWebSocket, useIsMobile } from "@/src/hooks";
import type { DashboardStats, StudentProfile, ConsultationLog } from "@/src/types";

export default function DashboardScreen() {
  const { api, accessToken, user, booting } = useAuth();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  
  useEffect(() => {
    if (user?.role === "lecturer") {
      router.replace("/lecturer-dashboard");
    }
  }, [user?.role]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [consultations, setConsultations] = useState<ConsultationLog[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (booting || !accessToken) return;
    if (user?.role === "lecturer") {
      // Fetch lecturer-specific data
      try {
        const [statsRes, studentsRes, consultRes] = await Promise.all([
          api<DashboardStats>("/dashboard/stats"),
          api<{ data: StudentProfile[] }>("/lecturer/students"),
          api<{ data: ConsultationLog[] }>("/lecturer/consultations"),
        ]);
        setStats(statsRes);
        setStudents(studentsRes.data ?? []);
        setConsultations(consultRes.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      }
      return;
    }
    try {
      const [s, c] = await Promise.all([
        api<DashboardStats>("/dashboard/stats"),
        user?.role === "student"
          ? api<{ data: ConsultationLog[] }>("/consultations").then((res) => res.data)
          : Promise.resolve([] as ConsultationLog[]),
      ]);
      setStats(s);
      setConsultations(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    }
  }, [api, booting, accessToken, user?.role]);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  // F-7: Use stable ref to prevent dependency loop - loadData changes won't trigger re-fetch
  useEffect(() => {
    if (booting || !accessToken) return;
    loadDataRef.current();
  }, [booting, accessToken, user?.role]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const wsRooms = consultations.map((log) => `consultation.${log.id}`);

  useWebSocket({
    accessToken,
    rooms: wsRooms,
    enabled: !!accessToken && consultations.length > 0,
    onMessage: (payload) => {
      if (payload.event === "feedback.status-updated") {
        setConsultations((current) =>
          current.map((log) =>
            log.id !== payload.data.log_id
              ? log
              : {
                  ...log,
                  feedback_items: log.feedback_items.map((item) =>
                    item.id === payload.data.feedback_id
                      ? { ...item, status: payload.data.status, category: payload.data.category ?? item.category }
                      : item
                  ),
                }
          )
        );
        api<DashboardStats>("/dashboard/stats").then(setStats).catch(console.warn);
      }
    },
  });

  const getStudentStatus = (studentId: number) => {
    const studentLogs = consultations.filter(c => c.student_id === studentId);
    if (!studentLogs.length) return "NO SUBMISSIONS";
    
    let hasPending = false;
    studentLogs.forEach(log => {
      if (log.feedback_items?.some(item => item.status === "Pending" || item.status === "Fixed")) {
        hasPending = true;
      }
    });
    return hasPending ? "NEW SUBMISSIONS" : "ALL CLEAR";
  };

  return (
    <RequireAuth>
      <Page showFloatingShapes={false} onRefresh={onRefresh} refreshing={refreshing}>
        <MotionDiv {...motionPresets.fadeIn} className="relative w-full flex flex-col gap-6">
        <NavBar />
        
        <Heading
          title={user?.role === "lecturer" ? "Academic Evaluation Portal" : "Academic Progress Dashboard"}
          subtitle={
            isMobile ? undefined : (
              user?.role === "lecturer"
                ? "Centralized oversight of student supervision logs, revision draft validation, and thesis milestone tracking."
                : "Monitor thesis draft consultation progress, manage assigned revision tasks, and review formal advisings."
            )
          }
        />

        {error ? (
          <GlassCard className="flex-row items-center gap-3 bg-tier-accent-danger/10 border-tier-accent-danger/20 p-4">
            <AlertCircle color="#DC2626" size={20} />
            <Text className="text-tier-accent-danger-bright text-sm font-semibold">{error}</Text>
          </GlassCard>
        ) : null}

        <View className="w-full flex flex-col gap-3">
          <View className="flex-row flex-wrap gap-3 w-full">
            {user?.role === "student" ? (
              <>
                <MotionDiv {...motionPresets.fadeUp(0)} className={`${isMobile ? "w-[48%]" : "flex-1 min-w-[45%]"} flex`}>
                  <StatCard 
                    label={isMobile ? "Approved" : "Approved Sessions"} 
                    value={stats ? Math.max(0, stats.total_consultations - (stats.pending_feedback > 0 ? 1 : 0)) : "0"} 
                    glowColor="#059669"
                    className={isMobile ? "p-4 min-w-0" : ""}
                  />
                </MotionDiv>
                <MotionDiv {...motionPresets.fadeUp(1)} className={`${isMobile ? "w-[48%]" : "flex-1 min-w-[45%]"} flex`}>
                  <StatCard 
                    label={isMobile ? "Pending" : "Pending Revisions"} 
                    value={stats?.pending_feedback ?? "0"} 
                    glowColor="#DC2626"
                    className={isMobile ? "p-4 min-w-0" : ""}
                  />
                </MotionDiv>
                <MotionDiv {...motionPresets.fadeUp(2)} className={`${isMobile ? "w-[48%]" : "flex-1 min-w-[45%]"} flex`}>
                  <StatCard 
                    label="Completion Rate" 
                    value={stats ? `${stats.completion_rate}%` : "0%"} 
                    glowColor="#6366F1"
                    className={isMobile ? "p-4 min-w-0" : ""}
                  />
                </MotionDiv>
                <MotionDiv {...motionPresets.fadeUp(3)} className={`${isMobile ? "w-[48%]" : "flex-1 min-w-[45%]"} flex`}>
                  <StatCard 
                    label={isMobile ? "Total Drafts" : "Total Document Drafts"} 
                    value={stats?.draft_count ?? "0"} 
                    glowColor="#4F46E5"
                    className={isMobile ? "p-4 min-w-0" : ""}
                  />
                </MotionDiv>
              </>
            ) : (
              <>
                <MotionDiv {...motionPresets.fadeUp(0)} className={`${isMobile ? "w-[48%]" : "flex-1 min-w-[45%]"} flex`}>
                  <StatCard 
                    label={isMobile ? "Consultations" : "Total Consultations"} 
                    value={stats?.total_consultations ?? "0"} 
                    glowColor="#4F46E5"
                    className={isMobile ? "p-4 min-w-0" : ""}
                  />
                </MotionDiv>
                <MotionDiv {...motionPresets.fadeUp(1)} className={`${isMobile ? "w-[48%]" : "flex-1 min-w-[45%]"} flex`}>
                  <StatCard 
                    label={isMobile ? "Queue" : "Validation Queue"} 
                    value={stats?.pending_feedback ?? "0"} 
                    glowColor="#D97706"
                    className={isMobile ? "p-4 min-w-0" : ""}
                  />
                </MotionDiv>
                <MotionDiv {...motionPresets.fadeUp(2)} className={`${isMobile ? "w-[48%]" : "flex-1 min-w-[45%]"} flex`}>
                  <StatCard 
                    label={isMobile ? "Completion" : "Average Completion"} 
                    value={stats ? `${stats.completion_rate}%` : "0%"} 
                    glowColor="#6366F1"
                    className={isMobile ? "p-4 min-w-0" : ""}
                  />
                </MotionDiv>
                <MotionDiv {...motionPresets.fadeUp(3)} className={`${isMobile ? "w-[48%]" : "flex-1 min-w-[45%]"} flex`}>
                  <StatCard 
                    label={isMobile ? "Students" : "Active Students"} 
                    value={stats?.student_count ?? "0"} 
                    glowColor="#3B82F6"
                    className={isMobile ? "p-4 min-w-0" : ""}
                  />
                </MotionDiv>
              </>
            )}
          </View>
        </View>

        {user?.role === "student" ? (
          <View className={isMobile ? "flex-col gap-6" : "flex-row flex-wrap gap-6 items-start w-full"}>
            {/* Left Column (60% width on Desktop) */}
            <View className={isMobile ? "w-full" : "flex-1 min-w-[320px] flex flex-col gap-6"}>
              <GlassCard className={isMobile ? "p-4" : "p-7"}>
                <View className="flex-row items-center gap-2.5 border-b border-tier-divider-light pb-4 mb-6">
                  <Cpu color="#6366F1" size={20} />
                  <Text className="text-tier-text-primary text-lg font-bold tracking-tight">Active Revision Tasks</Text>
                </View>
                
                <View className="gap-3.5">
                  {stats?.upcoming_quests?.length ? (
                    stats.upcoming_quests.map((item, index) => {
                      const isValidated = item.status === "Validated";
                      const isFixed = item.status === "Fixed";

                      return (
                        <MotionDiv key={item.id} {...motionPresets.fadeUp(index)}>
                          <View className="bg-tier-bg border border-tier-divider-light hover:border-tier-divider-base rounded-base p-4 gap-3">
                            <View className="flex-row justify-between items-center flex-wrap gap-2.5">
                              <Badge 
                                text={isMobile 
                                  ? `${item.category} • ${isFixed ? "REVIEW" : isValidated ? "APPROVED" : "PENDING"}`
                                  : `${item.category} • ${isFixed ? "SUBMITTED FOR REVIEW" : isValidated ? "APPROVED & VALIDATED" : "PENDING REVISION"}`
                                } 
                                color={isValidated ? "#10B981" : isFixed ? "#6366F1" : "#F59E0B"} 
                              />
                              <View className="flex-row items-center gap-1.5">
                                {isValidated ? (
                                  <CheckCircle color="#10B981" size={16} />
                                ) : isFixed ? (
                                  <Clock color="#6366F1" size={16} />
                                ) : (
                                  <Clock color="#F59E0B" size={16} />
                                )}
                                <Text className={`text-[11px] font-bold tracking-widest ${
                                  isValidated ? "text-tier-accent-success" : isFixed ? "text-tier-accent-primary" : "text-tier-accent-caution"
                                }`}>
                                  {isMobile 
                                    ? (isValidated ? "APPROVED" : isFixed ? "AWAITING" : "PENDING")
                                    : (isValidated ? "APPROVED & VALIDATED" : isFixed ? "Awaiting Validation" : "Pending Execution")
                                  }
                                </Text>
                              </View>
                            </View>
                            <Text className="text-tier-text-secondary text-sm leading-[22px] font-normal">{item.content}</Text>
                          </View>
                        </MotionDiv>
                      );
                    })
                  ) : (
                    <View className="py-[50px] w-full items-center justify-center gap-3">
                      <CheckCircle color="#10B981" size={24} />
                      <Text className="text-tier-text-secondary text-sm font-medium text-center">No active revision tasks at this time.</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            </View>

            {/* Right Column (40% width on Desktop) */}
            <View className={isMobile ? "w-full" : "w-[360px] shrink-0 flex flex-col gap-6"}>
              {/* Quick Actions Card */}
              <GlassCard className="p-6">
                <Text className="text-tier-text-primary text-base font-bold tracking-tight mb-4">Quick Actions</Text>
                <View className="flex-col gap-3">
                  <Pressable 
                    onPress={() => router.push("/consultations")}
                    className="flex-row items-center justify-between p-3.5 bg-tier-bg border border-tier-divider-light rounded-xl hover:border-tier-accent-primary"
                  >
                    <Text className="text-tier-text-primary text-sm font-semibold">📄 Open Consultations</Text>
                    <Text className="text-tier-text-tertiary text-xs font-bold">→</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => router.push("/archive")}
                    className="flex-row items-center justify-between p-3.5 bg-tier-bg border border-tier-divider-light rounded-xl hover:border-tier-accent-primary"
                  >
                    <Text className="text-tier-text-primary text-sm font-semibold">📁 View Past Archives</Text>
                    <Text className="text-tier-text-tertiary text-xs font-bold">→</Text>
                  </Pressable>
                </View>
              </GlassCard>

              {/* AI Oracle Widget */}
              <GlassCard className="p-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-2.5 h-2.5 rounded-full bg-tier-accent-cyan" />
                  <Text className="text-tier-text-primary text-base font-bold tracking-tight">AI Oracle Assistant</Text>
                </View>
                <Text className="text-tier-text-secondary text-xs leading-relaxed mb-4">
                  Need help addressing your advisor's revision requests? Open your consultations workspace to chat privately with the AI Oracle, which scans your lecturer's feedback for clarification.
                </Text>
                <ElegantButton 
                  title="Ask AI Oracle" 
                  tone="primary" 
                  size="md" 
                  onPress={() => router.push("/consultations")}
                />
              </GlassCard>
            </View>
          </View>
        ) : (
          <GlassCard className="p-7">
            <View className="flex-row items-center gap-2.5 border-b border-tier-border-subtle pb-4 mb-6">
              <User color="#6366F1" size={20} />
              <Text className="text-tier-text-primary text-lg font-bold tracking-tight">Active Supervised Students</Text>
            </View>
 
            <View className={`${isMobile ? "flex-col gap-3" : "flex-row flex-wrap gap-5"} w-full`}>
              {students.map((student, index) => {
                const status = getStudentStatus(student.id);
                const isHovered = hoveredCard === student.id;
                const statusColor = status === "NEW SUBMISSIONS" ? "#6366F1" : status === "ALL CLEAR" ? "#10B981" : "#64748B";

                return (
                  <MotionDiv key={student.id} {...motionPresets.fadeUp(index)} className={isMobile ? "w-full" : undefined}>
                    <Pressable
                      onHoverIn={Platform.OS === "web" ? () => setHoveredCard(student.id) : undefined}
                      onHoverOut={Platform.OS === "web" ? () => setHoveredCard(null) : undefined}
                      className={`flex-1 ${isMobile ? "w-full" : "min-w-[320px] max-w-[48%]"} rounded-base border border-tier-border-subtle gap-3.5 p-[22px] ${
                        isHovered ? "bg-tier-bg-secondary border-tier-border-medium shadow-card-hover" : "bg-tier-bg-secondary"
                      }`}
                      style={({ pressed }) => ({
                        transform: [{ scale: pressed ? 0.98 : isHovered ? 1.01 : 1 }],
                      })}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="w-10 h-10 rounded-full bg-tier-accent-indigo/10 items-center justify-center border border-tier-accent-indigo/20">
                          <User color="#6366F1" size={20} />
                        </View>
                        <Badge text={status} color={statusColor} />
                      </View>

                      <Text className="text-tier-text-primary text-base font-bold tracking-tight">{student.name}</Text>
                      <Text className="text-tier-text-secondary text-xs font-medium -mt-2">ID. {student.nim} • {student.prodi}</Text>
                      
                      <View className="flex-row gap-2 items-start bg-tier-bg p-3 rounded-base border border-tier-border-subtle">
                        <Archive color="#94A3B8" size={14} className="mt-0.5" />
                        <Text className="text-tier-text-secondary text-xs leading-[18px] flex-1 font-normal" numberOfLines={2}>
                          {student.thesis_title || "Research title not registered yet."}
                        </Text>
                      </View>
                    </Pressable>
                  </MotionDiv>
                );
              })}

              {!students.length && (
                <View className="py-[50px] w-full items-center justify-center gap-3">
                  <User color="#6366F1" size={32} />
                  <Text className="text-tier-text-secondary text-sm font-medium text-center">No supervised students currently assigned.</Text>
                </View>
              )}
            </View>
          </GlassCard>
        )}
        </MotionDiv>
      </Page>
    </RequireAuth>
  );
}
