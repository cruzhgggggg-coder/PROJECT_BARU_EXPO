import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { AlertCircle, Archive, CheckCircle, ChevronLeft, ChevronRight, Clock, User } from "lucide-react-native";

import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Badge, Button, Card, Heading, Page, StatCard } from "@/src/components/ui";
import { API_URL, getFileDownloadUrl } from "@/src/lib/config";
import { useAuth } from "@/src/providers/AuthProvider";
import { useIsMobile } from "@/src/hooks";
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
  const [revisionPage, setRevisionPage] = useState(1);
  const [selectedFilterSessionId, setSelectedFilterSessionId] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState<"ROSTER" | "OVERVIEW" | "REVISIONS" | "CHAT">("ROSTER");

  useEffect(() => {
    setRevisionPage(1);
    setSelectedFilterSessionId(null);
  }, [selectedStudentId]);

  useEffect(() => {
    setRevisionPage(1);
  }, [selectedFilterSessionId]);

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
  const [showMobileDispatchForm, setShowMobileDispatchForm] = useState(false);
  const [commentingOnFeedbackId, setCommentingOnFeedbackId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

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
          api<DashboardStats>("/dashboard/stats").then(setStats).catch(console.warn);
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
          api<DashboardStats>("/dashboard/stats").then(setStats).catch(console.warn);

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

        if (payload.event === "feedback.comment") {
          const newComment = payload.data;
          setLogs((current) =>
            current.map((log) =>
              log.id !== newComment.log_id
                ? log
                : {
                    ...log,
                    feedback_items: (log.feedback_items ?? []).map((f) =>
                      f.id === newComment.feedback_id
                        ? {
                            ...f,
                            comments: (f.comments ?? []).some((c: any) => c.id === newComment.id)
                              ? f.comments
                              : [...(f.comments ?? []), newComment],
                          }
                        : f
                    ),
                  }
            )
          );
        }
      } catch (e) {
        console.warn("[WS] parse error:", e);
      }
    };

    socket.onerror = (e) => console.log("[WS] error (connection issue):", e);

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

  const filteredLogs = useMemo(() => {
    if (selectedFilterSessionId === null) {
      return selectedStudentLogs;
    }
    return selectedStudentLogs.filter((log) => log.id === selectedFilterSessionId);
  }, [selectedStudentLogs, selectedFilterSessionId]);

  const allFeedbackItems = useMemo(() => {
    return filteredLogs.flatMap((log) => log.feedback_items ?? []);
  }, [filteredLogs]);

  const REVISIONS_PER_PAGE = 5;
  const totalRevisionPages = Math.ceil(allFeedbackItems.length / REVISIONS_PER_PAGE);

  const paginatedFeedbackItems = useMemo(() => {
    const startIndex = (revisionPage - 1) * REVISIONS_PER_PAGE;
    return allFeedbackItems.slice(startIndex, startIndex + REVISIONS_PER_PAGE);
  }, [allFeedbackItems, revisionPage]);

  const paginatedRevisionsBySession = useMemo(() => {
    const groups: { log: ConsultationLog; items: FeedbackItem[] }[] = [];
    
    paginatedFeedbackItems.forEach((item) => {
      const logId = item.consultation_log_id;
      const log = selectedStudentLogs.find((l) => l.id === logId);
      if (!log) return;
      
      let group = groups.find((g) => g.log.id === logId);
      if (!group) {
        group = { log, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    
    groups.sort((a, b) => {
      const idxA = selectedStudentLogs.findIndex((l) => l.id === a.log.id);
      const idxB = selectedStudentLogs.findIndex((l) => l.id === b.log.id);
      return idxA - idxB;
    });

    return groups;
  }, [paginatedFeedbackItems, selectedStudentLogs]);

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
      console.warn("Validation error:", e);
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
      console.warn("Rejection error:", e);
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

  const handleAddComment = async (feedbackId: number) => {
    if (!commentText.trim()) return;
    const content = commentText.trim();
    setCommentText("");
    setCommentingOnFeedbackId(null);

    try {
      await api(`/consultations/feedback/${feedbackId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      // Comment will arrive via WebSocket broadcast "feedback.comment"
    } catch {
      // If API fails, add comment locally as fallback
      const localComment = {
        id: Date.now(),
        feedback_id: feedbackId,
        author_role: user?.role ?? "lecturer",
        content,
        created_at: new Date().toISOString(),
      };
      setLogs((current) =>
        current.map((log) => ({
          ...log,
          feedback_items: (log.feedback_items ?? []).map((f) =>
            f.id === feedbackId
              ? { ...f, comments: [...(f.comments ?? []), localComment] }
              : f
          ),
        }))
      );
    }
  };

  const loadDirectMessages = async (logId: number) => {
    try {
      const res = await api<{ data: any[] }>(`/consultations/${logId}/direct-messages`);
      setDirectMessages(res.data);
    } catch (err) {
      console.warn("Failed to load direct messages:", err);
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
      console.warn("Failed to send direct message:", err);
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

  const mainContent = (
    <View className="flex-1" style={isMobile ? { flex: 1, display: "flex", flexDirection: "column" } : undefined}>
      <Page
        scrollable={!isMobile}
        style={isMobile ? { flex: 1, display: "flex", flexDirection: "column" } : undefined}
      >
        <NavBar />

        {(!isMobile || activeMobileTab === "ROSTER") && (
          <Heading
            title="Supervisor Portal"
            subtitle={isMobile ? undefined : "Monitor student guidance progress, validate revisions, and dispatch structured feedback in one centralized workspace."}
          />
        )}

        {error ? (
          <GlassCard className="flex-row items-center gap-3 bg-red-500/[0.06] border-red-500/[0.15] p-4">
            <AlertCircle color="#DC2626" size={18} />
            <Text className="text-red-600 text-sm font-semibold">{error}</Text>
          </GlassCard>
        ) : null}

        {isMobile ? (
          <View className="flex-1 flex-col min-h-0">
            {/* Top level tab switcher segment bar */}
            <View className="flex-row bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl mb-4 shrink-0">
              {(["ROSTER", "OVERVIEW", "REVISIONS", "CHAT"] as const).map((tab) => {
                const isActive = activeMobileTab === tab;
                const isDisabled = tab !== "ROSTER" && !selectedStudentId;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => {
                      if (!isDisabled) {
                        setActiveMobileTab(tab);
                        if (tab === "OVERVIEW") {
                          if (panelView !== "overview" && panelView !== "sessions") {
                            setPanelView("overview");
                          }
                        } else if (tab === "REVISIONS") {
                          setPanelView("revisions");
                        } else if (tab === "CHAT") {
                          setPanelView("chat");
                        }
                      }
                    }}
                    disabled={isDisabled}
                    className={`flex-1 py-2 rounded-lg items-center justify-center ${
                      isActive ? "bg-indigo-500" : "bg-transparent"
                    } ${isDisabled ? "opacity-30" : ""}`}
                  >
                    <Text className={`text-[10px] font-bold tracking-wider ${isActive ? "text-white" : "text-slate-400"}`}>
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* View container */}
            <View className="flex-1 min-h-0">
              {activeMobileTab === "ROSTER" && (
                <ScrollView className="flex-1" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
                  {/* General Stats */}
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

                  {/* Student Roster List */}
                  <GlassCard className="p-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <User color="#4F46E5" size={18} />
                      <Text className="text-slate-50 text-base font-black tracking-tight">Student Roster</Text>
                    </View>

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

                        return (
                          <Pressable
                            key={student.id}
                            onPress={() => {
                              setSelectedStudentId(student.id);
                              setPanelView("overview");
                              setActiveMobileTab("OVERVIEW");
                            }}
                            className={`bg-white/[0.02] border rounded-2xl p-4 gap-3 ${
                              isSelected
                                ? "bg-indigo-500/[0.08] border-indigo-500/[0.25]"
                                : "border-white/[0.06]"
                            }`}
                            style={({ pressed }) => ({
                              transform: [{ scale: pressed ? 0.985 : 1 }],
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
                                <Text className="text-slate-400 text-[11px] font-semibold mt-0.5">Student NIM: {student.nim}</Text>
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

                  {/* Validation Queue */}
                  <GlassCard className="p-4">
                    <SectionHeader
                      icon={<AlertCircle color="#0891B2" size={18} />}
                      title="Validation Queue"
                    />

                    {fixedAwaitingValidation.length === 0 ? (
                      <View className="py-10 items-center justify-center gap-3 w-full">
                        <CheckCircle color="#059669" size={28} />
                        <Text className="text-slate-400 text-[13px] font-semibold text-center">
                          No revisions awaiting validation.
                        </Text>
                      </View>
                    ) : (
                      <View className="gap-3">
                        {fixedAwaitingValidation.map((item) => {
                          const parentLog = logs.find((l) =>
                            (l.feedback_items ?? []).some((f) => f.id === item.id)
                          );
                          const parentStudent = students.find(
                            (s) => s.id === parentLog?.student_id
                          );

                          return (
                            <View key={item.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 gap-2.5">
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
                                  className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-emerald-500/[0.06] border border-emerald-500/[0.15]"
                                  style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.85 : 1 })}
                                >
                                  <CheckCircle color="#059669" size={14} />
                                  <Text className="text-emerald-500 text-xs font-extrabold">
                                    {validatingId === item.id ? "Validating…" : "Approve"}
                                  </Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => handleRejectFix(item.id)}
                                  disabled={validatingId === item.id}
                                  className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-red-500/[0.06] border border-red-500/[0.15]"
                                  style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.85 : 1 })}
                                >
                                  <AlertCircle color="#DC2626" size={14} />
                                  <Text className="text-red-600 text-xs font-extrabold">
                                    {validatingId === item.id ? "Rejecting…" : "Reject"}
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </GlassCard>
                </ScrollView>
              )}

              {selectedStudent && activeMobileTab === "OVERVIEW" && (
                <View className="flex-1 flex-col min-h-0 gap-3">
                  {/* Selected Student compact banner */}
                  <GlassCard className="p-3 gap-2">
                    <View className="flex-row items-center gap-3">
                      <View className="w-[36px] h-[36px] rounded-full bg-indigo-500/[0.06] border border-indigo-500/[0.15] items-center justify-center">
                        <User color="#6366F1" size={18} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-50 text-base font-black tracking-tight" numberOfLines={1}>{selectedStudent.name}</Text>
                        <Text className="text-slate-400 text-[10px] font-semibold">
                          NIM: {selectedStudent.nim} · {selectedStudent.prodi}
                        </Text>
                      </View>
                    </View>
                    {selectedStudent.thesis_title && (
                      <View className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                        <Text className="text-slate-300 text-[11px] leading-4 font-medium" numberOfLines={2}>
                          {selectedStudent.thesis_title}
                        </Text>
                      </View>
                    )}
                    {/* Sub-tab switcher for Overview vs Sessions */}
                    <View className="flex-row bg-white/[0.02] border border-white/[0.06] p-0.5 rounded-lg mt-1">
                      <Pressable
                        onPress={() => setPanelView("overview")}
                        className={`flex-1 py-1.5 rounded-md items-center justify-center ${
                          panelView === "overview" ? "bg-indigo-500/[0.12] border border-indigo-500/[0.25]" : ""
                        }`}
                      >
                        <Text className={`text-[10px] font-bold uppercase ${panelView === "overview" ? "text-indigo-400" : "text-slate-400"}`}>
                          Progress
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setPanelView("sessions")}
                        className={`flex-1 py-1.5 rounded-md items-center justify-center ${
                          panelView === "sessions" ? "bg-indigo-500/[0.12] border border-indigo-500/[0.25]" : ""
                        }`}
                      >
                        <Text className={`text-[10px] font-bold uppercase ${panelView === "sessions" ? "text-indigo-400" : "text-slate-400"}`}>
                          Session History
                        </Text>
                      </Pressable>
                    </View>
                  </GlassCard>

                  {/* Render Overview or Sessions inside ScrollView */}
                  {panelView === "overview" && (
                    <GlassCard className="flex-1 p-4 min-h-0">
                      <ScrollView className="flex-1" contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
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
                              <View className="flex-row justify-between flex-wrap gap-2.5">
                                {[
                                  { label: "Sessions", val: sessions, color: "#4F46E5" },
                                  { label: "Pending", val: pending, color: "#D97706" },
                                  { label: "To Validate", val: fixed, color: "#0891B2" },
                                  { label: "Validated", val: validated, color: "#059669" },
                                ].map((item) => (
                                  <View key={item.label} className="items-center gap-0.5 flex-1 min-w-[70px] bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
                                    <Text className="text-[20px] font-black tracking-tight" style={{ color: item.color }}>
                                      {item.val}
                                    </Text>
                                    <Text className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.5px] text-center">{item.label}</Text>
                                  </View>
                                ))}
                              </View>

                              <View className="gap-2 my-2">
                                <View className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                  <View
                                    className="h-full rounded-full bg-indigo-500"
                                    style={{ width: `${completionPct}%` as any }}
                                  />
                                </View>
                                <Text className="text-slate-400 text-[10px] font-semibold">{completionPct}% revisions validated</Text>
                              </View>

                              {latestLog && (
                                <View className="bg-white/[0.02] rounded-[14px] p-3.5 gap-2 border border-white/[0.04]">
                                  <Text className="text-slate-400 text-[9px] font-extrabold tracking-[1.5px] uppercase">LATEST SESSION</Text>
                                  <Text className="text-indigo-500 text-[11px] font-bold">
                                    {new Date(latestLog.created_at).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </Text>
                                  {Platform.OS === "web" && latestLog.transcript_text ? (
                                    <Text className="text-slate-300 text-xs leading-5 font-medium" numberOfLines={4}>
                                      {latestLog.transcript_text}
                                    </Text>
                                  ) : Platform.OS === "web" ? (
                                    <Text className="text-slate-500 text-xs italic">
                                      No transcript available for this session.
                                    </Text>
                                  ) : null}
                                  {latestLog.paper_filename ? (
                                    <View className="mt-2.5 border-t border-white/[0.06] pt-2.5 flex-row justify-between items-center">
                                      <View className="flex-1 mr-2">
                                        <Text className="text-slate-400 text-[8px] font-extrabold tracking-widest uppercase mb-0.5">SUBMITTED MANUSCRIPT</Text>
                                        <Text className="text-slate-300 text-xs font-semibold" numberOfLines={1}>{latestLog.paper_filename}</Text>
                                      </View>
                                      <Pressable
                                        onPress={() => Linking.openURL(getFileDownloadUrl("paper", latestLog.paper_filename, accessToken!))}
                                        className="px-2.5 py-2 rounded-lg bg-indigo-500/[0.12] border border-indigo-500/[0.25]"
                                      >
                                        <Text className="text-indigo-400 text-[10px] font-extrabold">DOWNLOAD DRAFT</Text>
                                      </Pressable>
                                    </View>
                                  ) : null}
                                  {latestLog.revised_document_filename ? (
                                    <View className="mt-2 border-t border-white/[0.06] pt-2.5 flex-row justify-between items-center">
                                      <View className="flex-1 mr-2">
                                        <Text className="text-violet-400 text-[8px] font-extrabold tracking-widest uppercase mb-0.5">REVISED DRAFT</Text>
                                        <Text className="text-slate-300 text-xs font-semibold" numberOfLines={1}>{latestLog.revised_document_filename}</Text>
                                      </View>
                                      <Pressable
                                        onPress={() => Linking.openURL(getFileDownloadUrl("revised", latestLog.revised_document_filename || "", accessToken!))}
                                        className="px-2.5 py-2 rounded-lg bg-violet-500/[0.12] border border-violet-500/[0.25]"
                                      >
                                        <Text className="text-violet-400 text-[10px] font-extrabold">DOWNLOAD REVISED</Text>
                                      </Pressable>
                                    </View>
                                  ) : null}
                                  {latestLog.final_document_filename ? (
                                    <View className="mt-2 border-t border-white/[0.06] pt-2.5 flex-row justify-between items-center">
                                      <View className="flex-1 mr-2">
                                        <Text className="text-emerald-400 text-[8px] font-extrabold tracking-widest uppercase mb-0.5">FINAL DOCUMENT</Text>
                                        <Text className="text-slate-300 text-xs font-semibold" numberOfLines={1}>{latestLog.final_document_filename}</Text>
                                      </View>
                                      <Pressable
                                        onPress={() => Linking.openURL(getFileDownloadUrl("final", latestLog.final_document_filename || "", accessToken!))}
                                        className="px-2.5 py-2 rounded-lg bg-emerald-500/[0.12] border border-emerald-500/[0.25]"
                                      >
                                        <Text className="text-emerald-400 text-[10px] font-extrabold">DOWNLOAD FINAL</Text>
                                      </Pressable>
                                    </View>
                                  ) : null}
                                </View>
                              )}
                            </>
                          );
                        })()}
                      </ScrollView>
                    </GlassCard>
                  )}

                  {panelView === "sessions" && (
                    <GlassCard className="flex-1 p-4 min-h-0">
                      <ScrollView className="flex-1" contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
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
                                <View key={log.id} className="flex-row gap-3 min-h-[80px]">
                                  <View className="items-center w-6 gap-0">
                                    <View className="w-6 h-6 rounded-full bg-indigo-500/[0.08] border border-indigo-500/[0.15] items-center justify-center shrink-0">
                                      <Text className="text-indigo-500 text-[9px] font-black">
                                        #{selectedStudentLogs.length - idx}
                                      </Text>
                                    </View>
                                    {idx < selectedStudentLogs.length - 1 && (
                                      <View className="w-[1px] flex-1 mt-1 mb-1 bg-indigo-500/[0.12]" />
                                    )}
                                  </View>

                                  <View className="flex-1 pb-4 gap-1.5">
                                    <View className="flex-row justify-between items-center flex-wrap gap-1.5">
                                      <Text className="text-slate-50 text-[12px] font-extrabold">
                                        {new Date(log.created_at).toLocaleDateString("en-US", {
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

                                    {Platform.OS === "web" && log.transcript_text ? (
                                      <Text className="text-slate-400 text-[11px] leading-[16px] font-medium" numberOfLines={2}>
                                        {log.transcript_text}
                                      </Text>
                                    ) : null}

                                    <View className="flex-row items-center gap-1.5 flex-wrap">
                                      {log.paper_filename && (
                                        <Pressable
                                          onPress={() => Linking.openURL(getFileDownloadUrl("paper", log.paper_filename, accessToken!))}
                                          className="px-1.5 py-0.5 rounded bg-indigo-500/[0.06] border border-indigo-500/[0.12]"
                                        >
                                          <Text className="text-indigo-500 text-[9px] font-bold">
                                            Paper (Download)
                                          </Text>
                                        </Pressable>
                                      )}
                                      <Text className="text-slate-400 text-[10px] font-semibold ml-1">
                                        {totalItems} feedback item{totalItems !== 1 ? "s" : ""}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </ScrollView>
                    </GlassCard>
                  )}
                </View>
              )}

              {selectedStudent && activeMobileTab === "REVISIONS" && (
                <View className="flex-1 flex-col min-h-0 gap-3">
                  {/* Selected Student compact banner */}
                  <GlassCard className="p-3 gap-2">
                    <View className="flex-row items-center gap-3">
                      <View className="w-[36px] h-[36px] rounded-full bg-indigo-500/[0.06] border border-indigo-500/[0.15] items-center justify-center">
                        <User color="#6366F1" size={18} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-50 text-base font-black tracking-tight" numberOfLines={1}>{selectedStudent.name}</Text>
                        <Text className="text-slate-400 text-[10px] font-semibold">
                          NIM: {selectedStudent.nim} · {selectedStudent.prodi}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>

                  <GlassCard className="flex-1 p-4 min-h-0 flex-col gap-3">
                    <SectionHeader
                      icon={<Clock color="#D97706" size={16} />}
                      title="Revision Items"
                    />

                    {/* Dispatch Feedback Form - Collapsible on Mobile */}
                    <View className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 gap-2.5 shrink-0">
                      <Pressable
                        onPress={() => setShowMobileDispatchForm(!showMobileDispatchForm)}
                        className="flex-row justify-between items-center"
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <View className="flex-row items-center gap-2">
                          <Text className="text-indigo-500 text-[10px] font-extrabold tracking-[1.5px] uppercase">
                            DISPATCH FEEDBACK
                          </Text>
                          {feedbackText.trim().length > 0 && !showMobileDispatchForm && (
                            <View className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          )}
                        </View>
                        <View className="px-2.5 py-1 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/[0.15]">
                          <Text className="text-indigo-400 text-[9px] font-bold">
                            {showMobileDispatchForm ? "Collapse" : "Expand +"}
                          </Text>
                        </View>
                      </Pressable>

                      {showMobileDispatchForm && (
                        <View className="gap-3 mt-2 border-t border-white/[0.04] pt-3">
                          <TextInput
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                            placeholder="Describe the revision requirement..."
                            placeholderTextColor="#475569"
                            multiline
                            numberOfLines={3}
                            className="text-slate-50 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-xs font-medium leading-[18px] min-h-[60px]"
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
                            onPress={async () => {
                              await handleAddFeedback();
                              setShowMobileDispatchForm(false);
                            }}
                            tone="primary"
                          />
                        </View>
                      )}
                    </View>

                    {/* Filter by Session - Fixed below Form */}
                    {selectedStudentLogs.length > 0 && (
                      <View className="gap-2 shrink-0">
                        <Text className="text-slate-400 text-[9px] font-extrabold tracking-[1.5px] uppercase">Filter by Session</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                          <Pressable
                            onPress={() => setSelectedFilterSessionId(null)}
                            className={`px-3 py-2 rounded-xl border ${
                              selectedFilterSessionId === null
                                ? "bg-indigo-500/[0.08] border-indigo-500/[0.25]"
                                : "bg-white/[0.02] border-white/[0.06]"
                            }`}
                          >
                            <Text className={`text-[10px] font-bold uppercase ${selectedFilterSessionId === null ? "text-indigo-400" : "text-slate-400"}`}>
                              All
                            </Text>
                          </Pressable>

                          {selectedStudentLogs.map((log) => {
                            const sessionNum = selectedStudentLogs.length - selectedStudentLogs.findIndex((l) => l.id === log.id);
                            const isSelected = selectedFilterSessionId === log.id;
                            const sessionDate = new Date(log.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });

                            return (
                              <Pressable
                                key={log.id}
                                onPress={() => setSelectedFilterSessionId(log.id)}
                                className={`px-3 py-2 rounded-xl border ${
                                  isSelected
                                    ? "bg-indigo-500/[0.08] border-indigo-500/[0.25]"
                                    : "bg-white/[0.02] border-white/[0.06]"
                                }`}
                              >
                                <Text className={`text-[10px] font-bold uppercase ${isSelected ? "text-indigo-400" : "text-slate-400"}`}>
                                  S#{sessionNum} ({sessionDate})
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {/* Revisions list - Independent Scroll Container */}
                    <ScrollView className="flex-1 min-h-0" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
                      <View className="gap-4">
                        {paginatedRevisionsBySession.map(({ log, items }) => {
                          const sessionDate = new Date(log.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });

                          return (
                            <View key={log.id} className="gap-2.5">
                              <View className="flex-row items-center gap-2 border-b border-white/[0.04] pb-1.5">
                                <View className="px-1.5 py-0.5 rounded bg-indigo-500/[0.1] border border-indigo-500/[0.2]">
                                  <Text className="text-indigo-400 text-[9px] font-black uppercase">
                                    Session #{selectedStudentLogs.length - selectedStudentLogs.findIndex((l) => l.id === log.id)}
                                  </Text>
                                </View>
                                <Text className="text-slate-400 text-[11px] font-semibold">{sessionDate}</Text>
                              </View>

                              <View className="gap-3">
                                {items.map((item) => {
                                  const isPending = item.status === "Pending";
                                  const isFixed = item.status === "Fixed";
                                  const isValidated = item.status === "Validated";
                                  const iColor = isPending
                                    ? "#D97706"
                                    : isFixed
                                    ? "#0891B2"
                                    : "#059669";

                                  return (
                                    <View key={item.id} className="bg-white/[0.02] rounded-[14px] p-3.5 gap-2 border border-white/[0.04]">
                                      <View className="flex-row justify-between items-center flex-wrap gap-2">
                                        <Badge
                                          text={`${item.category} · ${item.status}`}
                                          color={iColor}
                                        />
                                        {isFixed && (
                                          <View className="flex-row gap-1.5">
                                            <Pressable
                                              onPress={() => handleValidate(item.id)}
                                              disabled={validatingId === item.id}
                                              className="flex-row items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.15]"
                                            >
                                              <CheckCircle color="#059669" size={12} />
                                              <Text className="text-emerald-500 text-[10px] font-extrabold">
                                                Approve
                                              </Text>
                                            </Pressable>
                                            <Pressable
                                              onPress={() => handleRejectFix(item.id)}
                                              disabled={validatingId === item.id}
                                              className="flex-row items-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/[0.06] border border-red-500/[0.15]"
                                            >
                                              <AlertCircle color="#DC2626" size={12} />
                                              <Text className="text-red-600 text-[10px] font-extrabold">
                                                Reject
                                              </Text>
                                            </Pressable>
                                          </View>
                                        )}
                                        {isValidated && (
                                          <View className="flex-row items-center gap-2">
                                            <Text className="text-emerald-500 text-[10px] font-bold">Approved</Text>
                                            <Pressable
                                              onPress={() => handleRejectFix(item.id)}
                                              disabled={validatingId === item.id}
                                              className="px-1.5 py-1 rounded bg-amber-500/[0.06] border border-amber-500/[0.15]"
                                            >
                                              <Text className="text-amber-500 text-[9px] font-extrabold">Undo</Text>
                                            </Pressable>
                                          </View>
                                        )}
                                      </View>
                                      <Text className="text-slate-300 text-xs leading-5 font-medium">{item.content}</Text>

                                      {item.fix_proof_text ? (
                                        <View className="mt-1.5 bg-emerald-500/[0.04] border border-emerald-500/[0.12] rounded-lg p-2">
                                          <Text className="text-[#CBD5E1] text-[11px] font-medium leading-4">
                                            {item.fix_proof_text}
                                          </Text>
                                        </View>
                                      ) : null}

                                      {/* Comments Thread */}
                                      {item.comments && item.comments.length > 0 && (
                                        <View className="mt-1.5 gap-1.5 border-t border-white/[0.04] pt-1.5">
                                          {item.comments.map((comment) => (
                                            <View
                                              key={comment.id}
                                              className={`rounded-lg p-2 border ${
                                                comment.author_role === "lecturer"
                                                  ? "bg-indigo-500/[0.06] border-indigo-500/[0.12] ml-3"
                                                  : "bg-white/[0.03] border-white/[0.06] mr-3"
                                              }`}
                                            >
                                              <Text className="text-[8px] font-black tracking-[1px] text-slate-400 mb-0.5">
                                                {comment.author_role === "lecturer" ? "ADVISOR" : "STUDENT"}
                                              </Text>
                                              <Text className="text-slate-200 text-[11px] leading-[15px] font-medium">{comment.content}</Text>
                                            </View>
                                          ))}
                                        </View>
                                      )}

                                      {commentingOnFeedbackId === item.id ? (
                                        <View className="mt-1.5 gap-1.5 border-t border-white/[0.04] pt-1.5">
                                          <TextInput
                                            value={commentText}
                                            onChangeText={setCommentText}
                                            placeholder="Add comment..."
                                            placeholderTextColor="#475569"
                                            multiline
                                            className="bg-white/[0.02] border border-white/[0.06] rounded-lg text-slate-50 p-2 text-[11px] font-medium min-h-[40px]"
                                          />
                                          <View className="flex-row gap-1.5">
                                            <Pressable
                                              onPress={() => { setCommentingOnFeedbackId(null); setCommentText(""); }}
                                              className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06]"
                                            >
                                              <Text className="text-slate-400 text-[10px] font-bold">Cancel</Text>
                                            </Pressable>
                                            <Pressable
                                              onPress={() => void handleAddComment(item.id)}
                                              disabled={!commentText.trim()}
                                              className="px-2 py-1 rounded bg-indigo-500/[0.12] border border-indigo-500/[0.25]"
                                            >
                                              <Text className="text-indigo-400 text-[10px] font-bold">Post</Text>
                                            </Pressable>
                                          </View>
                                        </View>
                                      ) : (
                                        <Pressable
                                          onPress={() => setCommentingOnFeedbackId(item.id)}
                                          className="mt-1 self-start px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]"
                                        >
                                          <Text className="text-slate-400 text-[9px] font-bold">+ Add Comment</Text>
                                        </Pressable>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          );
                        })}
                      </View>

                      {allFeedbackItems.length === 0 && (
                        <View className="py-10 items-center justify-center gap-3 w-full">
                          <CheckCircle color="#059669" size={24} />
                          <Text className="text-slate-400 text-[13px] font-semibold text-center">
                            No revision items recorded yet.
                          </Text>
                        </View>
                      )}

                      {totalRevisionPages > 1 && (
                        <View className="flex-row justify-end items-center gap-3 mt-2">
                          <Text className="text-slate-400 text-[11px] font-semibold">
                            {revisionPage} of {totalRevisionPages}
                          </Text>
                          <View className="flex-row gap-1">
                            <Pressable
                              onPress={() => setRevisionPage((prev) => Math.max(prev - 1, 1))}
                              disabled={revisionPage === 1}
                              className={`w-7 h-7 rounded-lg items-center justify-center border ${
                                revisionPage === 1 ? "border-white/[0.04] opacity-40" : "border-white/[0.08] bg-white/[0.02]"
                              }`}
                            >
                              <ChevronLeft color={revisionPage === 1 ? "#64748B" : "#F8FAFC"} size={14} />
                            </Pressable>
                            <Pressable
                              onPress={() => setRevisionPage((prev) => Math.min(prev + 1, totalRevisionPages))}
                              disabled={revisionPage === totalRevisionPages}
                              className={`w-7 h-7 rounded-lg items-center justify-center border ${
                                revisionPage === totalRevisionPages ? "border-white/[0.04] opacity-40" : "border-white/[0.08] bg-white/[0.02]"
                              }`}
                            >
                              <ChevronRight color={revisionPage === totalRevisionPages ? "#64748B" : "#F8FAFC"} size={14} />
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </ScrollView>
                  </GlassCard>
                </View>
              )}

              {selectedStudent && activeMobileTab === "CHAT" && (
                <View className="flex-1 flex-col min-h-0 gap-3">
                  {/* Selected Student compact banner */}
                  <GlassCard className="p-3">
                    <View className="flex-row items-center gap-3">
                      <View className="w-[36px] h-[36px] rounded-full bg-indigo-500/[0.06] border border-indigo-500/[0.15] items-center justify-center">
                        <User color="#6366F1" size={18} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-50 text-base font-black tracking-tight" numberOfLines={1}>{selectedStudent.name}</Text>
                        <Text className="text-slate-400 text-[10px] font-semibold">
                          NIM: {selectedStudent.nim} · {selectedStudent.prodi}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>

                  <GlassCard className="flex-1 p-3.5 min-h-0 flex-col">
                    <View className="flex-row items-center gap-2 border-b border-white/[0.08] pb-2 mb-2">
                      <Clock color="#0891B2" size={16} />
                      <Text className="text-slate-50 text-sm font-black tracking-tight">Direct Chat Consultation</Text>
                    </View>

                    {latestLog ? (
                      <View className="flex-1 flex-col min-h-0 gap-2.5">
                        <ScrollView
                          ref={chatScrollRef}
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          className="flex-1 bg-slate-900/[0.6] border border-white/[0.06] rounded-[14px] p-3"
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
                          {chatLoading && <TypingIndicator label="SENDING" color="#0891B2" />}
                          {!directMessages.length && !chatLoading && (
                            <View className="py-10 items-center">
                              <Text className="text-slate-400 text-[11.5px] font-semibold text-center">
                                No messages yet.
                              </Text>
                            </View>
                          )}
                        </ScrollView>

                        <View className="flex-row gap-2 items-center">
                          <TextInput
                            value={chatQuery}
                            onChangeText={setChatQuery}
                            editable={!chatLoading}
                            placeholder={chatLoading ? "Sending..." : "Type a message..."}
                            placeholderTextColor="#475569"
                            onSubmitEditing={() => void sendDirectMessage()}
                            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-50 px-3.5 py-3 text-[13px] font-medium"
                            style={{ outlineStyle: "none", opacity: chatLoading ? 0.6 : 1 } as any}
                          />
                          <Pressable
                            onPress={() => void sendDirectMessage()}
                            disabled={chatLoading || !chatQuery.trim()}
                            className="bg-indigo-500 px-4 py-3 rounded-xl items-center justify-center"
                            style={{ opacity: chatLoading || !chatQuery.trim() ? 0.5 : 1 }}
                          >
                            <Text className="text-white text-[13px] font-extrabold">Send</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View className="py-10 items-center justify-center gap-3 w-full flex-1">
                        <Archive color="#64748B" size={28} />
                        <Text className="text-slate-500 text-[13px] font-semibold text-center">
                          No active session found.
                        </Text>
                      </View>
                    )}
                  </GlassCard>
                </View>
              )}
            </View>
          </View>
        ) : (
          <>
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
                                    style={{ width: `${completionPct}%` as any, ...(Platform.OS === "web" ? { transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" } : {}) } as any}
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
                                  {Platform.OS === "web" && latestLog.transcript_text ? (
                                    <Text className="text-slate-300 text-[13px] leading-5 font-medium" numberOfLines={4}>
                                      {latestLog.transcript_text}
                                    </Text>
                                  ) : Platform.OS === "web" ? (
                                    <Text className="text-slate-500 text-xs italic">
                                      No transcript available for this session.
                                    </Text>
                                  ) : null}
                                  {latestLog.paper_filename ? (
                                    <View className="mt-3 border-t border-white/[0.06] pt-3 flex-row justify-between items-center">
                                      <View className="flex-1 mr-2.5">
                                        <Text className="text-slate-400 text-[9px] font-extrabold tracking-widest uppercase mb-0.5">SUBMITTED MANUSCRIPT</Text>
                                        <Text className="text-slate-300 text-xs font-semibold" numberOfLines={1}>{latestLog.paper_filename}</Text>
                                      </View>
                                      <Pressable
                                        onPress={() => Linking.openURL(getFileDownloadUrl("paper", latestLog.paper_filename, accessToken!))}
                                        className="px-3 py-1.5 rounded-lg bg-indigo-500/[0.12] border border-indigo-500/[0.25]"
                                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                                      >
                                        <Text className="text-indigo-500 text-[11px] font-extrabold tracking-[0.5px]">DOWNLOAD DRAFT</Text>
                                      </Pressable>
                                    </View>
                                  ) : null}
                                  {latestLog.revised_document_filename ? (
                                    <View className="mt-2 border-t border-white/[0.06] pt-3 flex-row justify-between items-center">
                                      <View className="flex-1 mr-2.5">
                                        <Text className="text-violet-400 text-[9px] font-extrabold tracking-widest uppercase mb-0.5">REVISED DRAFT</Text>
                                        <Text className="text-slate-300 text-xs font-semibold" numberOfLines={1}>{latestLog.revised_document_filename}</Text>
                                        {latestLog.revised_document_uploaded_at && (
                                          <Text className="text-slate-400 text-[10px] mt-0.5">
                                            Uploaded: {new Date(latestLog.revised_document_uploaded_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                          </Text>
                                        )}
                                      </View>
                                      <Pressable
                                        onPress={() => Linking.openURL(getFileDownloadUrl("revised", latestLog.revised_document_filename || "", accessToken!))}
                                        className="px-3 py-1.5 rounded-lg bg-violet-500/[0.12] border border-violet-500/[0.25]"
                                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                                      >
                                        <Text className="text-violet-500 text-[11px] font-extrabold tracking-[0.5px]">DOWNLOAD REVISED</Text>
                                      </Pressable>
                                    </View>
                                  ) : null}
                                  {latestLog.final_document_filename ? (
                                    <View className="mt-2 border-t border-white/[0.06] pt-3 flex-row justify-between items-center">
                                      <View className="flex-1 mr-2.5">
                                        <Text className="text-emerald-400 text-[9px] font-extrabold tracking-widest uppercase mb-0.5">FINAL DOCUMENT</Text>
                                        <Text className="text-slate-300 text-xs font-semibold" numberOfLines={1}>{latestLog.final_document_filename}</Text>
                                        {latestLog.final_document_uploaded_at && (
                                          <Text className="text-slate-400 text-[10px] mt-0.5">
                                            Uploaded: {new Date(latestLog.final_document_uploaded_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                          </Text>
                                        )}
                                      </View>
                                      <Pressable
                                        onPress={() => Linking.openURL(getFileDownloadUrl("final", latestLog.final_document_filename || "", accessToken!))}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/[0.12] border border-emerald-500/[0.25]"
                                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                                      >
                                        <Text className="text-emerald-500 text-[11px] font-extrabold tracking-[0.5px]">DOWNLOAD FINAL</Text>
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

                        <View className="gap-5">
                          {selectedStudentLogs.length > 0 && (
                            <View className="gap-2 mb-2">
                              <Text className="text-slate-400 text-[10px] font-extrabold tracking-[1.5px] uppercase">Filter by Session</Text>
                              <View className="flex-row flex-wrap gap-2 pb-3 border-b border-white/[0.06]">
                                <Pressable
                                  onPress={() => setSelectedFilterSessionId(null)}
                                  className={`px-3.5 py-2 rounded-xl border transition-all ${
                                    selectedFilterSessionId === null
                                      ? "bg-indigo-500/[0.08] border-indigo-500/[0.25]"
                                      : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                                  }`}
                                  style={({ pressed }) => ({
                                    transform: [{ scale: pressed ? 0.97 : 1 }],
                                  })}
                                >
                                  <Text
                                    className={`text-xs font-extrabold tracking-[0.3px] uppercase ${
                                      selectedFilterSessionId === null ? "text-indigo-400" : "text-slate-400"
                                    }`}
                                  >
                                    All Sessions
                                  </Text>
                                </Pressable>

                                {selectedStudentLogs.map((log) => {
                                  const sessionNum = selectedStudentLogs.length - selectedStudentLogs.findIndex((l) => l.id === log.id);
                                  const isSelected = selectedFilterSessionId === log.id;
                                  const sessionDate = new Date(log.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  });

                                  return (
                                    <Pressable
                                      key={log.id}
                                      onPress={() => setSelectedFilterSessionId(log.id)}
                                      className={`px-3.5 py-2 rounded-xl border transition-all ${
                                        isSelected
                                          ? "bg-indigo-500/[0.08] border-indigo-500/[0.25]"
                                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                                      }`}
                                      style={({ pressed }) => ({
                                        transform: [{ scale: pressed ? 0.97 : 1 }],
                                      })}
                                    >
                                      <Text
                                        className={`text-xs font-extrabold tracking-[0.3px] uppercase ${
                                          isSelected ? "text-indigo-400" : "text-slate-400"
                                        }`}
                                      >
                                        Session #{sessionNum} ({sessionDate})
                                      </Text>
                                    </Pressable>
                                  );
                                })}
                              </View>
                            </View>
                          )}
                          {paginatedRevisionsBySession.map(({ log, items }) => {
                            const sessionDate = new Date(log.created_at).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            });

                            return (
                              <View key={log.id} className="gap-3">
                                <View className="flex-row items-center gap-2 border-b border-white/[0.04] pb-2 mb-1">
                                  <View className="px-2 py-0.5 rounded-md bg-indigo-500/[0.1] border border-indigo-500/[0.2]">
                                    <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                      Session #{selectedStudentLogs.length - selectedStudentLogs.findIndex((l) => l.id === log.id)}
                                    </Text>
                                  </View>
                                  <Text className="text-slate-400 text-xs font-semibold">{sessionDate}</Text>
                                </View>

                                <View className="gap-3">
                                  {items.map((item) => {
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

                                        {/* Fix Proof Text Display */}
                                        {item.fix_proof_text ? (
                                          <View className="mt-2 bg-emerald-500/[0.04] border border-emerald-500/[0.12] rounded-lg p-2.5 gap-1">
                                            <Text className="text-emerald-500 text-[9px] font-black tracking-[1.5px]">STUDENT FIX DESCRIPTION</Text>
                                            <Text className="text-slate-300 text-[12px] font-medium" style={{ lineHeight: 18 }}>
                                              {item.fix_proof_text}
                                            </Text>
                                          </View>
                                        ) : null}

                                        {/* Comments Thread */}
                                        {item.comments && item.comments.length > 0 && (
                                          <View className="mt-2 gap-2 border-t border-white/[0.04] pt-2">
                                            <Text className="text-slate-400 text-[9px] font-black tracking-[1.5px]">COMMENTS</Text>
                                            {item.comments.map((comment) => (
                                              <View
                                                key={comment.id}
                                                className={`rounded-lg p-2.5 border ${
                                                  comment.author_role === "lecturer"
                                                    ? "bg-indigo-500/[0.06] border-indigo-500/[0.12] ml-4"
                                                    : "bg-white/[0.03] border-white/[0.06] mr-4"
                                                }`}
                                              >
                                                <Text className="text-[9px] font-black tracking-[1px] text-slate-400 mb-1">
                                                  {comment.author_role === "lecturer" ? "ADVISOR" : "STUDENT"}
                                                </Text>
                                                <Text className="text-slate-200 text-[12px] leading-[18px] font-medium">{comment.content}</Text>
                                              </View>
                                            ))}
                                          </View>
                                        )}

                                        {/* Add Comment Button */}
                                        {commentingOnFeedbackId === item.id ? (
                                          <View className="mt-2 gap-2 border-t border-white/[0.04] pt-2">
                                            <TextInput
                                              value={commentText}
                                              onChangeText={setCommentText}
                                              placeholder="Add a comment to this revision..."
                                              placeholderTextColor="#475569"
                                              multiline
                                              className="bg-white/[0.02] border border-white/[0.06] rounded-lg text-slate-50 p-2.5 text-[12px] font-medium min-h-[60px]"
                                              style={{ outlineStyle: "none", textAlignVertical: "top" } as any}
                                            />
                                            <View className="flex-row gap-2">
                                              <Pressable
                                                onPress={() => { setCommentingOnFeedbackId(null); setCommentText(""); }}
                                                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                                              >
                                                <Text className="text-slate-400 text-[11px] font-bold">Cancel</Text>
                                              </Pressable>
                                              <Pressable
                                                onPress={() => void handleAddComment(item.id)}
                                                disabled={!commentText.trim()}
                                                className="px-3 py-1.5 rounded-lg bg-indigo-500/[0.12] border border-indigo-500/[0.25]"
                                                style={{ opacity: commentText.trim() ? 1 : 0.5 }}
                                              >
                                                <Text className="text-indigo-400 text-[11px] font-bold">Post Comment</Text>
                                              </Pressable>
                                            </View>
                                          </View>
                                        ) : (
                                          <Pressable
                                            onPress={() => setCommentingOnFeedbackId(item.id)}
                                            className="mt-2 self-start px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]"
                                          >
                                            <Text className="text-slate-400 text-[10px] font-bold">+ Add Comment</Text>
                                          </Pressable>
                                        )}
                                      </View>
                                    );
                                  })}
                                </View>
                              </View>
                            );
                          })}

                          {allFeedbackItems.length === 0 && (
                            <View className="py-10 items-center justify-center gap-3 w-full">
                              <CheckCircle color="#059669" size={24} />
                              <Text className="text-slate-400 text-[13px] font-semibold text-center">
                                No revision items recorded for this student yet.
                              </Text>
                            </View>
                          )}

                          {totalRevisionPages > 1 && (
                            <View className="flex-row justify-end items-center gap-3 mt-4">
                              <Text className="text-slate-400 text-xs font-semibold">
                                Page {revisionPage} of {totalRevisionPages}
                              </Text>
                              <View className="flex-row gap-1">
                                <Pressable
                                  onPress={() => setRevisionPage((prev) => Math.max(prev - 1, 1))}
                                  disabled={revisionPage === 1}
                                  className={`w-8 h-8 rounded-lg items-center justify-center border transition-all ${
                                    revisionPage === 1
                                      ? "border-white/[0.04] bg-white/[0.01] opacity-40"
                                      : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] active:scale-95"
                                  }`}
                                >
                                  <ChevronLeft color={revisionPage === 1 ? "#64748B" : "#F8FAFC"} size={16} />
                                </Pressable>
                                <Pressable
                                  onPress={() => setRevisionPage((prev) => Math.min(prev + 1, totalRevisionPages))}
                                  disabled={revisionPage === totalRevisionPages}
                                  className={`w-8 h-8 rounded-lg items-center justify-center border transition-all ${
                                    revisionPage === totalRevisionPages
                                      ? "border-white/[0.04] bg-white/[0.01] opacity-40"
                                      : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] active:scale-95"
                                  }`}
                                >
                                  <ChevronRight color={revisionPage === totalRevisionPages ? "#64748B" : "#F8FAFC"} size={16} />
                                </Pressable>
                              </View>
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

                                    {Platform.OS === "web" && log.transcript_text ? (
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
                                          onPress={() => Linking.openURL(getFileDownloadUrl("paper", log.paper_filename, accessToken!))}
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
          </>
        )}
      </Page>

      <View 
        className="z-[99999] gap-2.5" 
        style={{ 
          position: Platform.OS === "web" ? "fixed" : "absolute", 
          top: isMobile ? 60 : 80, 
          left: isMobile ? 16 : undefined,
          right: isMobile ? 16 : 20, 
          width: isMobile ? undefined : 320,
          maxWidth: isMobile ? undefined : 320,
        }}
      >
        {toasts.map(toast => {
          const translateAnim = toast.animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [isMobile ? -100 : 340, 0],
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
              className="p-4 rounded-[14px] border border-white/[0.1] bg-slate-900/[0.95] flex-row gap-3 items-center"
              style={{
                opacity: opacityAnim,
                transform: [
                  isMobile 
                    ? { translateY: translateAnim } 
                    : { translateX: translateAnim }
                ],
                shadowColor: color,
                shadowOpacity: 0.12,
                shadowRadius: 16,
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
  );

  if (isMobile) {
    return (
      <RequireAuth>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          style={{ flex: 1 }}
        >
          {mainContent}
        </KeyboardAvoidingView>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      {mainContent}
    </RequireAuth>
  );
};
