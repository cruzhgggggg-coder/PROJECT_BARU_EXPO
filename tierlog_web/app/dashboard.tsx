import React, { useEffect, useState } from "react";
import { Text, View, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import { Cpu, CheckCircle, Clock, AlertCircle, User, Archive } from "lucide-react-native";
import { MotionDiv } from "@/src/lib/motion";
import { staggerContainer, staggerItem, fadeIn } from "@/src/lib/animations";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Heading, Page, StatCard, Badge } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { API_URL } from "@/src/lib/config";
import type { DashboardStats, StudentProfile, ConsultationLog } from "@/src/types";

export default function DashboardScreen() {
  const { api, accessToken, user, booting } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  
  useEffect(() => {
    if (user?.role === "lecturer") {
      router.replace("/lecturer-dashboard");
    }
  }, [user?.role]);

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [consultations, setConsultations] = useState<ConsultationLog[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    if (booting || !accessToken) return;
    if (user?.role === "lecturer") return;
    api<DashboardStats>("/dashboard/stats")
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stats"));

    if (user?.role === "student") {
      api<{ data: ConsultationLog[] }>("/consultations")
        .then((res) => setConsultations(res.data))
        .catch(console.error);
    }
  }, [api, booting, accessToken, user?.role]);

  useEffect(() => {
    if (!accessToken || consultations.length === 0) {
      return;
    }

    const socket = new WebSocket(`${API_URL.replace("http", "ws")}/ws`);
    
    socket.onopen = () => {
      socket.send(JSON.stringify({ action: "auth", token: accessToken }));
      consultations.forEach((log) => {
        socket.send(JSON.stringify({ action: "subscribe", room: `consultation.${log.id}` }));
      });
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { event: string; data: any };
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

          api<DashboardStats>("/dashboard/stats")
            .then(setStats)
            .catch(console.error);
        }
      } catch (err) {
        console.error("Failed to parse websocket message:", err);
      }
    };

    return () => {
      socket.close();
    };
  }, [accessToken, consultations.length, api]);

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
      <Page>
        <MotionDiv variants={fadeIn} initial="hidden" animate="visible" className="relative w-full flex flex-col gap-6">
        <NavBar />
        
        <Heading
          title={user?.role === "lecturer" ? "Academic Evaluation Portal" : "Academic Progress Dashboard"}
          subtitle={
            user?.role === "lecturer" 
              ? "Centralized oversight of student supervision logs, revision draft validation, and thesis milestone tracking."
              : "Monitor thesis draft consultation progress, manage assigned revision tasks, and review formal advisings."
          }
        />

        {error ? (
          <GlassCard className="flex-row items-center gap-3 bg-red-500/[0.05] border-red-500/[0.15] p-4">
            <AlertCircle color="#DC2626" size={20} />
            <Text className="text-red-600 text-sm font-semibold">{error}</Text>
          </GlassCard>
        ) : null}

        <MotionDiv variants={staggerContainer} initial="hidden" animate="visible" className="w-full flex flex-col">
        <View className="flex-row gap-4 flex-wrap w-full">
          {user?.role === "student" ? (
            <>
              <MotionDiv variants={staggerItem} className="flex-1 min-w-[45%] flex">
              <StatCard 
                label="Approved Sessions" 
                value={stats ? Math.max(0, stats.total_consultations - (stats.pending_feedback > 0 ? 1 : 0)) : "0"} 
                glowColor="#059669"
              />
              </MotionDiv>
              <MotionDiv variants={staggerItem} className="flex-1 min-w-[45%] flex">
              <StatCard 
                label="Pending Revisions" 
                value={stats?.pending_feedback ?? "0"} 
                glowColor="#DC2626"
              />
              </MotionDiv>
              <MotionDiv variants={staggerItem} className="flex-1 min-w-[45%] flex">
              <StatCard 
                label="Completion Rate" 
                value={stats ? `${stats.completion_rate}%` : "0%"} 
                glowColor="#6366F1"
              />
              </MotionDiv>
              <MotionDiv variants={staggerItem} className="flex-1 min-w-[45%] flex">
              <StatCard 
                label="Total Document Drafts" 
                value={stats?.draft_count ?? "0"} 
                glowColor="#4F46E5"
              />
              </MotionDiv>
            </>
          ) : (
            <>
              <MotionDiv variants={staggerItem} className="flex-1 min-w-[45%] flex">
              <StatCard 
                label="Total Consultations" 
                value={stats?.total_consultations ?? "0"} 
                glowColor="#4F46E5"
              />
              </MotionDiv>
              <MotionDiv variants={staggerItem} className="flex-1 min-w-[45%] flex">
              <StatCard 
                label="Validation Queue" 
                value={stats?.pending_feedback ?? "0"} 
                glowColor="#D97706"
              />
              </MotionDiv>
              <MotionDiv variants={staggerItem} className="flex-1 min-w-[45%] flex">
              <StatCard 
                label="Average Completion" 
                value={stats ? `${stats.completion_rate}%` : "0%"} 
                glowColor="#6366F1"
              />
              </MotionDiv>
              <MotionDiv variants={staggerItem} className="flex-1 min-w-[45%] flex">
              <StatCard 
                label="Active Students" 
                value={stats?.student_count ?? "0"} 
                glowColor="#3B82F6"
              />
              </MotionDiv>
            </>
          )}
        </View>
        </MotionDiv>

        {user?.role === "student" ? (
          <GlassCard className="p-7">
            <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-6">
              <Cpu color="#4F46E5" size={20} />
              <Text className="text-slate-50 text-lg font-black tracking-tight">Active Revision Tasks</Text>
            </View>
            
            <MotionDiv variants={staggerContainer} initial="hidden" animate="visible">
            <View className="gap-3.5">
              {stats?.upcoming_quests?.length ? (
                stats.upcoming_quests.map((item) => {
                  const isValidated = item.status === "Validated";
                  const isFixed = item.status === "Fixed";

                  return (
                    <MotionDiv key={item.id} variants={staggerItem}>
                    <View className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-[18px] gap-3">
                      <View className="flex-row justify-between items-center flex-wrap gap-2.5">
                          <Badge 
                          text={`${item.category} • ${isFixed ? "SUBMITTED FOR REVIEW" : isValidated ? "APPROVED & VALIDATED" : "PENDING REVISION"}`} 
                          color={isValidated ? "#059669" : isFixed ? "#0891B2" : "#D97706"} 
                        />
                        <View className="flex-row items-center gap-1.5">
                          {isValidated ? (
                            <CheckCircle color="#059669" size={16} />
                          ) : isFixed ? (
                            <Clock color="#0891B2" size={16} />
                          ) : (
                            <Clock color="#D97706" size={16} />
                          )}
                          <Text className={`text-[9px] font-black tracking-widest ${
                            isValidated ? "text-emerald-500" : isFixed ? "text-cyan-500" : "text-amber-500"
                          }`}>
                            {isValidated ? "APPROVED & VALIDATED" : isFixed ? "Awaiting Validation" : "Pending Execution"}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-slate-300 text-sm leading-[22px] font-medium">{item.content}</Text>
                    </View>
                    </MotionDiv>
                  );
                })
              ) : (
                <View className="py-[50px] w-full items-center justify-center gap-3">
                  <CheckCircle color="#0F766E" size={24} />
                  <Text className="text-slate-400 text-sm font-semibold text-center">No active revision tasks at this time.</Text>
                </View>
              )}
            </View>
            </MotionDiv>
          </GlassCard>
        ) : (
          <GlassCard className="p-7">
            <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-6">
              <User color="#3B82F6" size={20} />
              <Text className="text-slate-50 text-lg font-black tracking-tight">Active Supervised Students</Text>
            </View>
 
            <MotionDiv variants={staggerContainer} initial="hidden" animate="visible">
            <View className="flex-row gap-5 flex-wrap w-full">
              {students.map((student) => {
                const status = getStudentStatus(student.id);
                const isHovered = hoveredCard === student.id;
                const statusColor = status === "NEW SUBMISSIONS" ? "#0891B2" : status === "ALL CLEAR" ? "#059669" : "#6366F1";

                return (
                  <MotionDiv key={student.id} variants={staggerItem}>
                  <Pressable
                    onHoverIn={Platform.OS === "web" ? () => setHoveredCard(student.id) : undefined}
                    onHoverOut={Platform.OS === "web" ? () => setHoveredCard(null) : undefined}
                    className={`flex-1 min-w-[320px] max-w-[48%] rounded-[20px] border border-white/[0.06] gap-3.5 p-[22px] ${
                      isHovered ? "bg-white/[0.06] border-white/[0.12] shadow-[0_0_20px_rgba(99,102,241,0.12)]" : "bg-white/[0.03]"
                    }`}
                    style={({ pressed }) => ({
                      transform: [{ scale: pressed ? 0.98 : isHovered ? 1.01 : 1 }],
                    })}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="w-10 h-10 rounded-full bg-indigo-500/[0.10] items-center justify-center border border-indigo-500/[0.25]">
                        <User color="#6366F1" size={20} />
                      </View>
                      <Badge text={status} color={statusColor} />
                    </View>

                    <Text className="text-slate-50 text-base font-extrabold tracking-tight">{student.name}</Text>
                    <Text className="text-slate-400 text-xs font-semibold -mt-2">ID. {student.nim} • {student.prodi}</Text>
                    
                    <View className="flex-row gap-2 items-start bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                      <Archive color="#94A3B8" size={14} className="mt-0.5" />
                      <Text className="text-slate-400 text-xs leading-[18px] flex-1 font-medium" numberOfLines={2}>
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
                  <Text className="text-slate-400 text-sm font-semibold text-center">No supervised students currently assigned.</Text>
                </View>
              )}
            </View>
            </MotionDiv>
          </GlassCard>
        )}
        </MotionDiv>
      </Page>
    </RequireAuth>
  );
}
