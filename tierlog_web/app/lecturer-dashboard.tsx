import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { AlertCircle, Archive, CheckCircle, ChevronRight, Clock, User } from "lucide-react";

import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Badge, Button, Card, Heading, Page, StatCard } from "@/src/components/ui";
import { API_URL } from "@/src/lib/config";
import { useAuth } from "@/src/providers/AuthProvider";
import type { ConsultationLog, DashboardStats, FeedbackItem, StudentProfile } from "@/src/types";

type PanelView = "overview" | "revisions" | "sessions" | "chat";

interface StudentPanelState {
  studentId: number;
  view: PanelView;
}

function getStudentStats(studentId: number, logs: ConsultationLog[]) {
  const studentLogs = logs.filter((l) => l.student_id === studentId);
  let pending = 0;
  let fixed = 0;
  let validated = 0;

  studentLogs.forEach((log) => {
    (log.feedback_items ?? []).forEach((f) => {
      if (f.status === "Pending") pending++;
      else if (f.status === "Fixed") fixed++;
      else if (f.status === "Validated") validated++;
    });
  });

  return { sessions: studentLogs.length, pending, fixed, validated };
}

function statusColor(pending: number, sessions: number) {
  if (sessions === 0) return "#475569";
  if (pending > 0) return "#D97706";
  return "#059669";
}

function statusLabel(pending: number, sessions: number) {
  if (sessions === 0) return "NO SESSIONS";
  if (pending > 0) return `${pending} PENDING`;
  return "ALL CLEAR";
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-5">
      {icon}
      <Text className="text-slate-50 text-base font-black tracking-tight">{title}</Text>
    </View>
  );
}

type TypingIndicatorProps = {
  label?: string;
  color?: string;
};

const TypingIndicator = ({ label = "SENDING MESSAGE", color = "#0891B2" }: TypingIndicatorProps) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 350,
            useNativeDriver: Platform.OS !== "web",
          }),
        ])
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 100);
    const anim3 = createAnimation(dot3, 200);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const getInterpolatedStyle = (dot: Animated.Value) => {
    return {
      opacity: dot.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
      }),
      transform: [
        {
          translateY: dot.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -3],
          }),
        },
      ],
    };
  };

  return (
    <View className="p-3 rounded-[14px] max-w-[85%] gap-[5px] bg-white/[0.04] border border-white/[0.08] self-start flex-row items-center py-3 px-3.5" style={{ shadowColor: color, shadowOpacity: 0.05, shadowRadius: 10 } as any}>
      <Text style={{ color }}>{label}</Text>
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }, getInterpolatedStyle(dot1)]} />
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }, getInterpolatedStyle(dot2)]} />
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }, getInterpolatedStyle(dot3)]} />
    </View>
  );
};

export default function LecturerDashboardScreen() {
  const { api, accessToken, user, booting } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [logs, setLogs] = useState<ConsultationLog[]>([]);
  const [error, setError] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [panelView, setPanelView] = useState<PanelView>("overview");
  const [hoveredStudentId, setHoveredStudentId] = useState<number | null>(null);

  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message: string; type: "chat" | "revision" | "system"; animatedValue: Animated.Value }>>([]);

  const showToast = (title: string, message: string, type: "chat" | "revision" | "system") => {
    const id = Math.random().toString(36).substring(7);
    const anim = new Animated.Value(0);
    
    setToasts(prev => [...prev, { id, title, message, type, animatedValue: anim }]);
    
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: Platform.OS !== "web",
    }).start();
    
    setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: Platform.OS !== "web",
      }).start(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      });
    }, 4500);
  };

  const [directMessages, setDirectMessages] = useState<any[]>([]);
  const [chatQuery, setChatQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView | null>(null);

  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [composerCategory, setComposerCategory] = useState<"Auto" | "Major" | "Minor">("Auto");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [validatingId, setValidatingId] = useState<number | null>(null);

  const loadAll = async () => {
    const [s, st, lg] = await Promise.all([
      api<DashboardStats>("/dashboard/stats"),
      api<{ data: StudentProfile[] }>("/lecturer/students"),
      api<{ data: ConsultationLog[] }>("/lecturer/consultations"),
    ]);
    setStats(s);
    setStudents(st.data);
    setLogs(lg.data);
    if (!selectedStudentId && st.data.length > 0) {
      setSelectedStudentId(st.data[0].id);
    }
  };

  useEffect(() => {
    if (booting || !accessToken) return;

    loadAll().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
    );
  }, [api, booting, accessToken]);

  useEffect(() => {
    if (!accessToken || logs.length === 0) return;

    const socket = new WebSocket(`${API_URL.replace("http", "ws")}/ws?token=${accessToken}`);

    socket.onopen = () => {
      logs.forEach((log) => {
        socket.send(JSON.stringify({ action: "subscribe", room: `consultation.${log.id}` }));
      });
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { event: string; data: any };

        if (payload.event === "feedback.new") {
          const newItem = payload.data;
          setLogs((current) =>
            current.map((log) =>
              log.id !== newItem.log_id
                ? log
                : {
                    ...log,
                    feedback_items: (log.feedback_items ?? []).some(
                      (i) => i.id === (newItem.id ?? newItem.feedback_id)
                    )
                      ? log.feedback_items
                      : [
                          ...(log.feedback_items ?? []),
                          {
                            id: newItem.id ?? newItem.feedback_id,
                            consultation_log_id: newItem.log_id,
                            content: newItem.content,
                            category: newItem.category,
                            status: newItem.status,
                            created_at: newItem.created_at ?? new Date().toISOString(),
                            updated_at: newItem.created_at ?? new Date().toISOString(),
                          } as any,
                        ],
                  }
            )
          );
          api<DashboardStats>("/dashboard/stats").then(setStats).catch(console.error);
        }

        if (payload.event === "feedback.status-updated") {
          setLogs((current) =>
            current.map((log) =>
              log.id !== payload.data.log_id
                ? log
                : {
                    ...log,
                    feedback_items: (log.feedback_items ?? []).map((item) =>
                      item.id === payload.data.feedback_id
                        ? { ...item, status: payload.data.status, category: payload.data.category ?? item.category }
                        : item
                    ),
                  }
            )
          );
          api<DashboardStats>("/dashboard/stats").then(setStats).catch(console.error);

          if (payload.data.status === "Fixed") {
            const parentLog = logs.find((l) => l.id === payload.data.log_id);
            const studentName = parentLog?.student?.name ?? "A student";
            showToast(
              "Revision Fixed by Student",
              `${studentName} has marked a revision item as Fixed and submitted it for validation.`,
              "revision"
            );
          }
          if (payload.data.status === "Validated" && payload.data.updated_by_role === "lecturer") {
          }
        }

        if (payload.event === "chat.direct-message") {
          setDirectMessages((current) => {
            if (current.some((m) => m.id === payload.data.id)) return current;
            return [...current, payload.data];
          });
          if (payload.data.sender_role === "student") {
            const parentLog = logs.find((l) => l.id === payload.data.log_id);
            const studentName = parentLog?.student?.name ?? "Student";
            showToast(`New Message from ${studentName}`, payload.data.content, "chat");
          }
        }
      } catch (e) {
        console.error("[WS] parse error:", e);
      }
    };

    socket.onerror = (e) => console.error("[WS] error:", e);

    return () => socket.close();
  }, [accessToken, logs.length, api]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

  const selectedStudentLogs = useMemo(
    () => logs.filter((l) => l.student_id === selectedStudentId),
    [logs, selectedStudentId]
  );

  const latestLog = selectedStudentLogs[0] ?? null;

  const pendingAcrossAll = useMemo(
    () => logs.flatMap((l) => (l.feedback_items ?? []).filter((f) => f.status === "Pending")),
    [logs]
  );

  const fixedAwaitingValidation = useMemo(
    () => logs.flatMap((l) => (l.feedback_items ?? []).filter((f) => f.status === "Fixed")),
    [logs]
  );

  const handleValidate = async (feedbackId: number) => {
    setValidatingId(feedbackId);
    setError("");
    const parentLog = logs.find((l) =>
      (l.feedback_items ?? []).some((f) => f.id === feedbackId)
    );
    try {
      await api(`/consultations/feedback/${feedbackId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Validated", log_id: parentLog?.id ?? 0 }),
      });
      setLogs((current) =>
        current.map((log) => ({
          ...log,
          feedback_items: (log.feedback_items ?? []).map((f) =>
            f.id === feedbackId ? { ...f, status: "Validated" } : f
          ),
        }))
      );
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to validate revision item.");
    } finally {
      setValidatingId(null);
    }
  };

  const handleRejectFix = async (feedbackId: number) => {
    setValidatingId(feedbackId);
    setError("");
    const parentLog = logs.find((l) =>
      (l.feedback_items ?? []).some((f) => f.id === feedbackId)
    );
    try {
      await api(`/consultations/feedback/${feedbackId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Pending", log_id: parentLog?.id ?? 0 }),
      });
      setLogs((current) =>
        current.map((log) => ({
          ...log,
          feedback_items: (log.feedback_items ?? []).map((f) =>
            f.id === feedbackId ? { ...f, status: "Pending" } : f
          ),
        }))
      );
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to reject revision fix.");
    } finally {
      setValidatingId(null);
    }
  };

  const handleAddFeedback = async () => {
    if (!latestLog || !feedbackText.trim()) return;
    setSubmittingFeedback(true);
    setFeedbackError("");
    setFeedbackSuccess("");
    try {
      const categoryParam = composerCategory === "Auto" ? "" : composerCategory;
      const res = await api<{ data: FeedbackItem }>(`/consultations/${latestLog.id}/add-feedback`, {
        method: "POST",
        body: JSON.stringify({ 
          content: feedbackText.trim(),
          category: categoryParam
        }),
      });
      setLogs((current) =>
        current.map((log) =>
          log.id !== latestLog.id
            ? log
            : { ...log, feedback_items: [...(log.feedback_items ?? []), res.data] }
        )
      );
      setFeedbackText("");
      setComposerCategory("Auto");
      setFeedbackSuccess("Feedback dispatched successfully.");
      setTimeout(() => setFeedbackSuccess(""), 3000);
    } catch (e) {
      setFeedbackError(e instanceof Error ? e.message : "Failed to add feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const loadDirectMessages = async (logId: number) => {
    try {
      const res = await api<{ data: any[] }>(`/consultations/${logId}/direct-messages`);
      setDirectMessages(res.data);
    } catch (err) {
      console.error("Failed to load direct messages:", err);
    }
  };

  const sendDirectMessage = async () => {
    if (!latestLog || !chatQuery.trim() || chatLoading) return;
    const draft = chatQuery;
    setChatQuery("");
    setChatLoading(true);
    try {
      const response = await api<{ data: any }>(`/consultations/${latestLog.id}/direct-messages`, {
        method: "POST",
        body: JSON.stringify({ content: draft }),
      });
      setDirectMessages((current) => {
        if (current.some((m) => m.id === response.data.id)) return current;
        return [...current, response.data];
      });
    } catch (err) {
      console.error("Failed to send direct message:", err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (latestLog?.id) {
      void loadDirectMessages(latestLog.id);
    } else {
      setDirectMessages([]);
    }
  }, [latestLog?.id]);

  useEffect(() => {
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [directMessages, panelView]);

  return (
    <RequireAuth>
      <View className="flex-1">
        <Page>
          <NavBar />

        <Heading
          title="Supervisor Portal"
          subtitle="Monitor student guidance progress, validate revisions, and dispatch structured feedback in one centralized workspace."
        />

        {error ? (
          <GlassCard className="flex-row items-center gap-3 bg-red-500/[0.06] border-red-500/[0.15] p-4">
            <AlertCircle color="#DC2626" size={18} />
            <Text className="text-red-600 text-sm font-semibold">{error}</Text>
          </GlassCard>
        ) : null}

        <View className="flex-row gap-4 flex-wrap">
          <StatCard
            label="Active Students"
            value={stats?.student_count ?? students.length}
            glowColor="#4F46E5"
          />
          <StatCard
            label="Pending Revisions"
            value={pendingAcrossAll.length}
            glowColor="#D97706"
          />
          <StatCard
            label="Awaiting Validation"
            value={fixedAwaitingValidation.length}
            glowColor="#0891B2"
          />
          <StatCard
            label="Avg. Completion"
            value={stats ? `${stats.completion_rate}%` : "0%"}
            glowColor="#059669"
          />
        </View>

        <View className="flex-row gap-5 items-start">
          <GlassCard className="w-[340px] min-w-[300px] p-6 shrink-0">
            <SectionHeader
              icon={<User color="#4F46E5" size={18} />}
              title="Student Roster"
            />

            <View className="gap-2.5">
              {students.length === 0 && (
                <View className="py-10 items-center justify-center gap-3 w-full">
                  <User color="#64748B" size={28} />
                  <Text className="text-slate-500 text-[13px] font-semibold text-center">No supervised students found.</Text>
                </View>
              )}

              {students.map((student) => {
                const { sessions, pending, fixed, validated } = getStudentStats(
                  student.id,
                  logs
                );
                const sc = statusColor(pending, sessions);
                const sl = statusLabel(pending, sessions);
                const isSelected = selectedStudentId === student.id;
                const isHovered = hoveredStudentId === student.id;

                return (
                  <Pressable
                    key={student.id}
                    onPress={() => {
                      setSelectedStudentId(student.id);
                      setPanelView("overview");
                    }}
                    onHoverIn={Platform.OS === "web" ? () => setHoveredStudentId(student.id) : undefined}
                    onHoverOut={Platform.OS === "web" ? () => setHoveredStudentId(null) : undefined}
                    className={`bg-white/[0.02] border rounded-2xl p-4 gap-3 transition-all ${
                      isSelected
                        ? "bg-indigo-500/[0.08] border-indigo-500/[0.25]"
                        : isHovered
                        ? "bg-white/[0.04] border-white/[0.08]"
                        : "border-white/[0.06]"
                    }`}
                    style={({ pressed }) => ({
                      transform: [{ scale: pressed ? 0.985 : 1 }],
                      ...(isSelected ? { shadowColor: "#4F46E5", shadowOpacity: 0.08, shadowRadius: 12 } : {}),
                    })}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className={`w-[34px] h-[34px] rounded-full items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-indigo-500 border-indigo-500"
                          : "bg-indigo-500/[0.06] border-indigo-500/[0.12]"
                      }`}>
                        <User
                          color={isSelected ? "#ffffff" : "#94A3B8"}
                          size={16}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`text-sm font-extrabold tracking-tight ${isSelected ? "text-white" : "text-slate-50"}`} numberOfLines={1}>
                          {student.name}
                        </Text>
                        <Text className="text-slate-400 text-[11px] font-semibold mt-0.5">Student ID: {student.nim}</Text>
                      </View>
                      <Badge text={sl} color={sc} />
                    </View>

                    <View className="flex-row justify-between bg-white/[0.02] rounded-[10px] p-2.5 border border-white/[0.04]">
                      <View className="items-center gap-0.5">
                        <Text className="text-slate-50 text-base font-black tracking-tight">{sessions}</Text>
                        <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.5px]">Sessions</Text>
                      </View>
                      <View className="items-center gap-0.5">
                        <Text className={`text-base font-black tracking-tight ${pending > 0 ? "text-amber-500" : "text-slate-50"}`}>
                          {pending}
                        </Text>
                        <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.5px]">Pending</Text>
                      </View>
                      <View className="items-center gap-0.5">
                        <Text className={`text-base font-black tracking-tight ${fixed > 0 ? "text-cyan-500" : "text-slate-50"}`}>
                          {fixed}
                        </Text>
                        <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.5px]">To Validate</Text>
                      </View>
                      <View className="items-center gap-0.5">
                        <Text className={`text-base font-black tracking-tight ${validated > 0 ? "text-emerald-500" : "text-slate-50"}`}>
                          {validated}
                        </Text>
                        <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.5px]">Validated</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>

          <View className="flex-1 gap-4 min-w-0">
            {selectedStudent ? (
              <>
                <GlassCard className="p-[22px] gap-4">
                  <View className="flex-row items-center gap-3.5">
                    <View className="w-[52px] h-[52px] rounded-full bg-indigo-500/[0.06] border border-indigo-500/[0.15] items-center justify-center">
                      <User color="#6366F1" size={28} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-50 text-xl font-black tracking-tight">{selectedStudent.name}</Text>
                      <Text className="text-slate-400 text-xs font-semibold mt-0.5">
                        Student ID: {selectedStudent.nim} · Department: {selectedStudent.prodi}
                      </Text>
                    </View>
                    {(() => {
                      const { sessions, pending } = getStudentStats(selectedStudent.id, logs);
                      const sc = statusColor(pending, sessions);
                      const sl = statusLabel(pending, sessions);
                      return <Badge text={sl} color={sc} />;
                    })()}
                  </View>

                  <View className="flex-row gap-2.5 items-start bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.04]">
                    <Archive color="#94A3B8" size={13} />
                    <Text className="flex-1 text-slate-300 text-xs leading-[18px] font-medium" numberOfLines={3}>
                      {selectedStudent.thesis_title || "No thesis title recorded yet."}
                    </Text>
                  </View>

                  <View className="flex-row gap-2">
                    {(["overview", "revisions", "sessions", "chat"] as PanelView[]).map((tab) => (
                      <Pressable
                        key={tab}
                        onPress={() => setPanelView(tab)}
                        className={`px-4 py-2 rounded-[10px] border transition-all ${
                          panelView === tab
                            ? "bg-indigo-500/[0.08] border-indigo-500/[0.15]"
                            : "bg-white/[0.02] border-white/[0.06]"
                        }`}
                      >
                        <Text
                          className={`text-xs font-extrabold tracking-[0.3px] uppercase ${
                            panelView === tab ? "text-indigo-500" : "text-slate-400"
                          }`}
                        >
                          {tab === "overview"
                            ? "Overview"
                            : tab === "revisions"
                            ? "Revisions"
                            : tab === "sessions"
                            ? "Sessions"
                            : "Advisor Chat"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </GlassCard>

                {panelView === "overview" && (
                  <GlassCard className="p-6">
                    <SectionHeader
                      icon={<CheckCircle color="#059669" size={16} />}
                      title="Guidance Progress"
                    />
                    {(() => {
                      const { sessions, pending, fixed, validated } = getStudentStats(
                        selectedStudent.id,
                        logs
                      );
                      const total = pending + fixed + validated;
                      const completionPct = total > 0 ? Math.round((validated / total) * 100) : 0;

                      return (
                        <>
                          <View className="flex-row justify-between flex-wrap gap-3 mb-5">
                            {[
                              { label: "Total Sessions", val: sessions, color: "#4F46E5" },
                              { label: "Pending", val: pending, color: "#D97706" },
                              { label: "Awaiting Validation", val: fixed, color: "#0891B2" },
                              { label: "Validated", val: validated, color: "#059669" },
                            ].map((item) => (
                              <View key={item.label} className="items-center gap-1 flex-1 min-w-[70px] bg-white/[0.02] rounded-xl p-3.5 border border-white/[0.04]">
                                <Text className="text-[28px] font-black tracking-tight" style={{ color: item.color }}>
                                  {item.val}
                                </Text>
                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.5px] text-center">{item.label}</Text>
                              </View>
                            ))}
                          </View>

                          <View className="gap-2 mb-5">
                            <View className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                              <View
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${completionPct}%` as any, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" } as any}
                              />
                            </View>
                            <Text className="text-slate-400 text-[11px] font-semibold">{completionPct}% revisions validated</Text>
                          </View>

                          {latestLog && (
                            <View className="bg-white/[0.02] rounded-[14px] p-4 gap-2 border border-white/[0.04]">
                              <Text className="text-slate-400 text-[9px] font-extrabold tracking-[1.5px] uppercase">LATEST SESSION</Text>
                              <Text className="text-indigo-500 text-xs font-bold">
                                {new Date(latestLog.created_at).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </Text>
                              {latestLog.transcript_text ? (
                                <Text className="text-slate-300 text-[13px] leading-5 font-medium" numberOfLines={4}>
                                  {latestLog.transcript_text}
                                </Text>
                              ) : (
                                <Text className="text-slate-500 text-xs italic">
                                  No transcript available for this session.
                                </Text>
                              )}
                              {latestLog.paper_filename ? (
                                <View className="mt-3 border-t border-white/[0.06] pt-3 flex-row justify-between items-center">
                                  <View className="flex-1 mr-2.5">
                                    <Text className="text-slate-400 text-[9px] font-extrabold tracking-widest uppercase mb-0.5">SUBMITTED MANUSCRIPT</Text>
                                    <Text className="text-slate-300 text-xs font-semibold" numberOfLines={1}>{latestLog.paper_filename}</Text>
                                  </View>
                                  <Pressable
                                    onPress={() => Platform.OS === "web" && window.open(`${API_URL}/storage/paper/${latestLog.paper_filename}`)}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-500/[0.12] border border-indigo-500/[0.25]"
                                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                                  >
                                    <Text className="text-indigo-500 text-[11px] font-extrabold tracking-[0.5px]">DOWNLOAD DRAFT</Text>
                                  </Pressable>
                                </View>
                              ) : null}
                            </View>
                          )}
                        </>
                      );
                    })()}
                  </GlassCard>
                )}

                {panelView === "revisions" && (
                  <GlassCard className="p-6">
                    <SectionHeader
                      icon={<Clock color="#D97706" size={16} />}
                      title="Revision Items"
                    />

                    <View className="bg-white/[0.02] rounded-2xl p-[18px] gap-3 mb-5 border border-white/[0.06]">
                      <Text className="text-indigo-500 text-[10px] font-extrabold tracking-[1.5px] uppercase">DISPATCH FEEDBACK</Text>
                      <Text className="text-slate-400 text-xs leading-[18px] font-medium mb-1">
                        Type your feedback below. The student will organize and classify this using their AI Oracle.
                      </Text>

                      <TextInput
                        value={feedbackText}
                        onChangeText={setFeedbackText}
                        placeholder="Describe the revision requirement in detail (e.g., 'Expand literature review background' or 'Correct citation formatting guidelines')."
                        placeholderTextColor="#475569"
                        multiline
                        numberOfLines={3}
                        className="text-slate-50 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 text-sm font-medium leading-[22px] min-h-[80px]"
                        style={{ outlineStyle: "none", transition: "border-color 0.2s ease" } as any}
                      />

                      {feedbackSuccess ? (
                        <Text className="text-emerald-500 text-xs font-bold">{feedbackSuccess}</Text>
                      ) : null}
                      {feedbackError ? (
                        <Text className="text-red-600 text-xs font-bold">{feedbackError}</Text>
                      ) : null}

                      <Button
                        title={submittingFeedback ? "Dispatching…" : "Dispatch Feedback"}
                        disabled={submittingFeedback || !feedbackText.trim() || !latestLog}
                        onPress={handleAddFeedback}
                        tone="primary"
                      />
                    </View>

                    <View className="gap-3">
                      {selectedStudentLogs.flatMap((log) =>
                        (log.feedback_items ?? []).map((item) => {
                          const isPending = item.status === "Pending";
                          const isFixed = item.status === "Fixed";
                          const isValidated = item.status === "Validated";
                          const iColor = isPending
                            ? "#D97706"
                            : isFixed
                            ? "#0891B2"
                            : "#059669";

                          return (
                            <View key={item.id} className="bg-white/[0.02] rounded-[14px] p-4 gap-2.5 border border-white/[0.04]">
                              <View className="flex-row justify-between items-center flex-wrap gap-2">
                                <Badge
                                  text={`${item.category} · ${item.status}`}
                                  color={iColor}
                                />
                                {isFixed && (
                                  <View className="flex-row gap-2">
                                    <Pressable
                                      onPress={() => handleValidate(item.id)}
                                      disabled={validatingId === item.id}
                                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.15] transition-all"
                                      style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.8 : 1 })}
                                    >
                                      <CheckCircle color="#059669" size={14} />
                                      <Text className="text-emerald-500 text-[11px] font-extrabold tracking-[0.3px]">
                                        {validatingId === item.id ? "Validating…" : "Approve"}
                                      </Text>
                                    </Pressable>
                                    <Pressable
                                      onPress={() => handleRejectFix(item.id)}
                                      disabled={validatingId === item.id}
                                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/[0.06] border border-red-500/[0.15]"
                                      style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.8 : 1 })}
                                    >
                                      <AlertCircle color="#DC2626" size={14} />
                                      <Text className="text-red-600 text-[11px] font-extrabold tracking-[0.3px]">
                                        {validatingId === item.id ? "Rejecting…" : "Reject"}
                                      </Text>
                                    </Pressable>
                                  </View>
                                )}
                                {isValidated && (
                                  <View className="flex-row items-center gap-2.5">
                                    <View className="flex-row items-center gap-[5px]">
                                      <CheckCircle color="#059669" size={13} />
                                      <Text className="text-emerald-500 text-[11px] font-bold">Validated</Text>
                                    </View>
                                    <Pressable
                                      onPress={() => handleRejectFix(item.id)}
                                      disabled={validatingId === item.id}
                                      className="flex-row items-center gap-1 px-2 py-1 rounded-md bg-amber-500/[0.06] border border-amber-500/[0.15]"
                                      style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.8 : 1 })}
                                    >
                                      <Text className="text-amber-500 text-[10px] font-extrabold tracking-[0.3px]">Undo</Text>
                                    </Pressable>
                                  </View>
                                )}
                              </View>
                              <Text className="text-slate-300 text-[13px] leading-5 font-medium">{item.content}</Text>
                            </View>
                          );
                        })
                      )}

                      {selectedStudentLogs.every(
                        (l) => (l.feedback_items ?? []).length === 0
                      ) && (
                        <View className="py-10 items-center justify-center gap-3 w-full">
                          <CheckCircle color="#059669" size={24} />
                          <Text className="text-slate-400 text-[13px] font-semibold text-center">
                            No revision items recorded for this student yet.
                          </Text>
                        </View>
                      )}
                    </View>
                  </GlassCard>
                )}

                {panelView === "sessions" && (
                  <GlassCard className="p-6">
                    <SectionHeader
                      icon={<Archive color="#0891B2" size={16} />}
                      title="Session History"
                    />

                    {selectedStudentLogs.length === 0 ? (
                      <View className="py-10 items-center justify-center gap-3 w-full">
                        <Archive color="#64748B" size={28} />
                        <Text className="text-slate-500 text-[13px] font-semibold text-center">
                          No consultation sessions recorded yet.
                        </Text>
                      </View>
                    ) : (
                      <View className="gap-0">
                        {selectedStudentLogs.map((log, idx) => {
                          const totalItems = (log.feedback_items ?? []).length;
                          const pendingItems = (log.feedback_items ?? []).filter(
                            (f) => f.status === "Pending"
                          ).length;
                          const validatedItems = (log.feedback_items ?? []).filter(
                            (f) => f.status === "Validated"
                          ).length;

                          return (
                            <View key={log.id} className="flex-row gap-4 min-h-[90px]">
                              <View className="items-center w-8 gap-0">
                                <View className="w-8 h-8 rounded-full bg-indigo-500/[0.08] border border-indigo-500/[0.15] items-center justify-center shrink-0">
                                  <Text className="text-indigo-500 text-[11px] font-black">
                                    #{selectedStudentLogs.length - idx}
                                  </Text>
                                </View>
                                {idx < selectedStudentLogs.length - 1 && (
                                  <View className="w-[1px] flex-1 mt-1.5 mb-1.5 bg-indigo-500/[0.12]" />
                                )}
                              </View>

                              <View className="flex-1 pb-5 gap-2">
                                <View className="flex-row justify-between items-center flex-wrap gap-2">
                                  <Text className="text-slate-50 text-[13px] font-extrabold tracking-tight">
                                    {new Date(log.created_at).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </Text>
                                  <Badge
                                    text={
                                      pendingItems > 0
                                        ? `${pendingItems} Pending`
                                        : validatedItems === totalItems && totalItems > 0
                                        ? "All Validated"
                                        : `${totalItems} Items`
                                    }
                                    color={
                                      pendingItems > 0
                                        ? "#D97706"
                                        : validatedItems === totalItems && totalItems > 0
                                        ? "#059669"
                                        : "#4F46E5"
                                    }
                                  />
                                </View>

                                {log.transcript_text ? (
                                  <Text className="text-slate-400 text-xs leading-[18px] font-medium" numberOfLines={2}>
                                    {log.transcript_text}
                                  </Text>
                                ) : null}

                                <View className="flex-row items-center gap-2 flex-wrap">
                                  {log.audio_filename && (
                                    <View className="px-2 py-0.5 rounded-md bg-indigo-500/[0.06] border border-indigo-500/[0.12]">
                                      <Text className="text-indigo-500 text-[10px] font-bold">
                                        Audio
                                      </Text>
                                    </View>
                                  )}
                                  {log.paper_filename && (
                                    <Pressable
                                      onPress={() => Platform.OS === "web" && window.open(`${API_URL}/storage/paper/${log.paper_filename}`)}
                                      className="px-2 py-0.5 rounded-md bg-indigo-500/[0.06] border border-indigo-500/[0.12]"
                                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                                    >
                                      <Text className="text-indigo-500 text-[10px] font-bold">
                                        Paper (Download)
                                      </Text>
                                    </Pressable>
                                  )}
                                  <Text className="text-slate-400 text-[11px] font-semibold ml-1">
                                    {totalItems} feedback item{totalItems !== 1 ? "s" : ""}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </GlassCard>
                )}

                {panelView === "chat" && (
                  <GlassCard className="p-6" style={{ height: 500 } as any}>
                    <SectionHeader
                      icon={<Clock color="#0891B2" size={16} />}
                      title="Direct Chat Consultation"
                    />
                    {latestLog ? (
                      <View className="flex-1 gap-2.5">
                        <ScrollView
                          ref={chatScrollRef}
                          showsVerticalScrollIndicator={true}
                          className="flex-1 bg-slate-900/[0.6] border border-white/[0.06] rounded-[14px] p-3"
                          {...({ className: "ultra-thin-scroll" } as any)}
                          contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
                        >
                          {directMessages.map((message, index) => {
                            const isUser = message.sender_role === "lecturer";
                            return (
                              <View
                                key={`direct-msg-${message.id || index}`}
                                className={`p-3 rounded-[14px] max-w-[85%] gap-1 ${
                                  isUser
                                    ? "bg-indigo-500/[0.12] border border-indigo-500/[0.22] self-end"
                                    : "bg-white/[0.04] border border-white/[0.08] self-start"
                                }`}
                              >
                                <Text className="text-slate-400 text-[9px] font-black tracking-[1.5px]">
                                  {isUser ? "ADVISOR" : "STUDENT"}
                                </Text>
                                <Text className="text-slate-50 text-[13px] leading-[18px] font-medium">
                                  {message.content}
                                </Text>
                              </View>
                            );
                          })}
                          {chatLoading && <TypingIndicator label="SENDING MESSAGE" color="#0891B2" />}
                          {!directMessages.length && !chatLoading && (
                            <View className="py-[60px] items-center">
                              <Text className="text-slate-400 text-[12.5px] font-semibold text-center leading-[18px]">
                                No messages with this student yet. Send a message to start direct consultation.
                              </Text>
                            </View>
                          )}
                        </ScrollView>

                        <View className="flex-row gap-2 items-center">
                          <TextInput
                            value={chatQuery}
                            onChangeText={setChatQuery}
                            editable={!chatLoading}
                            placeholder={chatLoading ? "Sending message..." : "Type a message to the student..."}
                            placeholderTextColor="#475569"
                            onSubmitEditing={() => void sendDirectMessage()}
                            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-50 px-3.5 py-3 text-[13px] font-medium"
                            style={{ outlineStyle: "none", opacity: chatLoading ? 0.6 : 1 } as any}
                          />
                          <Pressable
                            onPress={() => void sendDirectMessage()}
                            disabled={chatLoading || !chatQuery.trim()}
                            className="bg-indigo-500 px-4 py-3 rounded-xl self-stretch items-center justify-center"
                            style={{ opacity: chatLoading || !chatQuery.trim() ? 0.5 : 1 }}
                          >
                            <Text className="text-white text-[13px] font-extrabold">
                              Send
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View className="py-10 items-center justify-center gap-3 w-full">
                        <Archive color="#64748B" size={28} />
                        <Text className="text-slate-500 text-[13px] font-semibold text-center">
                          No logs found for this student. Messages cannot be sent without an active log.
                        </Text>
                      </View>
                    )}
                  </GlassCard>
                )}
              </>
            ) : (
              <GlassCard className="items-center justify-center p-[60px] gap-4 flex-1 min-h-[240px]">
                <User color="#64748B" size={40} />
                <Text className="text-slate-400 text-sm text-center font-semibold max-w-[280px] leading-[22px]">
                  Select a student from the roster to view detailed guidance information.
                </Text>
              </GlassCard>
            )}
          </View>
        </View>

        <GlassCard className="p-7">
          <SectionHeader
            icon={<AlertCircle color="#0891B2" size={18} />}
            title="Validation Queue — Student Revisions Awaiting Review"
          />

          {fixedAwaitingValidation.length === 0 ? (
            <View className="py-10 items-center justify-center gap-3 w-full">
              <CheckCircle color="#059669" size={28} />
              <Text className="text-slate-400 text-[13px] font-semibold text-center">
                No revisions awaiting validation. All submissions are up to date.
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-4">
              {fixedAwaitingValidation.map((item) => {
                const parentLog = logs.find((l) =>
                  (l.feedback_items ?? []).some((f) => f.id === item.id)
                );
                const parentStudent = students.find(
                  (s) => s.id === parentLog?.student_id
                );

                return (
                  <View key={item.id} className="flex-1 min-w-[280px] max-w-[48%] bg-white/[0.02] border border-white/[0.06] rounded-2xl p-[18px] gap-2.5 transition-all">
                    <View className="flex-row justify-between items-center flex-wrap gap-2">
                      <View className="flex-row items-center gap-2">
                        <View className="w-[22px] h-[22px] rounded-full bg-indigo-500/[0.06] border border-indigo-500/[0.12] items-center justify-center">
                          <User color="#64748B" size={12} />
                        </View>
                        <Text className="text-slate-300 text-xs font-bold">
                          {parentStudent?.name ?? "Unknown Student"}
                        </Text>
                      </View>
                      <Badge text={item.category} color={item.category === "Major" ? "#DC2626" : "#4F46E5"} />
                    </View>
                    <Text className="text-slate-300 text-[13px] leading-5 font-medium" numberOfLines={2}>
                      {item.content}
                    </Text>
                    <View className="flex-row gap-2.5 mt-2.5">
                      <Pressable
                        onPress={() => handleValidate(item.id)}
                        disabled={validatingId === item.id}
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-[9px] rounded-[10px] bg-emerald-500/[0.06] border border-emerald-500/[0.15] transition-all"
                        style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.85 : 1 })}
                      >
                        <CheckCircle color="#059669" size={14} />
                        <Text className="text-emerald-500 text-xs font-extrabold tracking-[0.3px]">
                          {validatingId === item.id ? "Validating…" : "Approve Fix"}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleRejectFix(item.id)}
                        disabled={validatingId === item.id}
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-[9px] rounded-[10px] bg-red-500/[0.06] border border-red-500/[0.15]"
                        style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.85 : 1 })}
                      >
                        <AlertCircle color="#DC2626" size={14} />
                        <Text className="text-red-600 text-xs font-extrabold">
                          {validatingId === item.id ? "Rejecting…" : "Reject Fix"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </GlassCard>
      </Page>
      
      <View className="gap-2.5 w-80" style={{ position: Platform.OS === "web" ? "fixed" : "absolute", top: 80, right: 20, zIndex: 99999 }}>
        {toasts.map(toast => {
          const translateAnim = toast.animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [340, 0],
          });
          const opacityAnim = toast.animatedValue;
          
          let icon = "bell";
          let color = "#6366F1";
          if (toast.type === "chat") {
            color = "#0891B2";
          } else if (toast.type === "revision") {
            color = "#059669";
          }
          
          return (
            <Animated.View
              key={toast.id}
              className="p-4 rounded-[14px] border border-white/[0.08] bg-slate-900/[0.95] flex-row gap-3 items-center"
              style={{
                opacity: opacityAnim,
                transform: [{ translateX: translateAnim }],
                shadowColor: color,
                shadowOpacity: 0.1,
                shadowRadius: 10,
              }}
            >
              {toast.type === "chat" ? (
                <Clock color={color} size={20} />
              ) : toast.type === "revision" ? (
                <CheckCircle color={color} size={20} />
              ) : (
                <AlertCircle color={color} size={20} />
              )}
              <View className="flex-1 gap-0.5">
                <Text className="text-white text-[13px] font-extrabold">{toast.title}</Text>
                <Text className="text-slate-300 text-[11px] font-medium" numberOfLines={2}>{toast.message}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  </RequireAuth>
);
}
