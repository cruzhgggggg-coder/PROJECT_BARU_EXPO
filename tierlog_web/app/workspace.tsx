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
import { AlertCircle, Archive, BookOpen, CheckCircle, ChevronLeft, ChevronRight, Clock, Grid, Maximize2, MessageSquare, Minimize2, User, X } from "lucide-react-native";

import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Badge, Button, Card, Heading, Page, StatCard } from "@/src/components/ui";
import { API_URL, getFileDownloadUrl } from "@/src/lib/config";
import { useAuth } from "@/src/providers/AuthProvider";
import { useResponsive } from "@/src/lib/responsive";
import { MotionDiv } from "@/src/lib/motion";
import { motionPresets } from "@/src/lib/motion-config";
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
  if (sessions === 0) return "#64748B"; // tier-text-tertiary
  if (pending > 0) return "#D97706"; // tier-accent-caution
  return "#059669"; // tier-accent-success
}

function statusLabel(pending: number, sessions: number) {
  if (sessions === 0) return "NO SESSIONS";
  if (pending > 0) return `${pending} PENDING`;
  return "ALL CLEAR";
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View className="flex-row items-center gap-2.5 border-b border-tier-divider-light pb-4 mb-5">
      {icon}
      <Text className="text-tier-text-primary text-base font-extrabold tracking-tight font-sans">{title}</Text>
    </View>
  );
}

type TypingIndicatorProps = {
  label?: string;
  color?: string;
};

const TypingIndicator = ({ label = "SENDING MESSAGE", color = "#06B6D4" }: TypingIndicatorProps) => {
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
    <View className="p-3 rounded-tier-lg max-w-[85%] gap-[5px] bg-tier-surface border border-tier-divider-light self-start flex-row items-center py-3 px-3.5" style={{ shadowColor: color, shadowOpacity: 0.05, shadowRadius: 10 } as any}>
      <Text style={{ color }} className="text-xs font-bold uppercase tracking-wider mr-1">{label}</Text>
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }, getInterpolatedStyle(dot1)]} />
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }, getInterpolatedStyle(dot2)]} />
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }, getInterpolatedStyle(dot3)]} />
    </View>
  );
};

export default function WorkspaceScreen() {
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
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [activeMobileTab, setActiveMobileTab] = useState<"ROSTER" | "OVERVIEW" | "REVISIONS" | "CHAT">("ROSTER");
  interface WindowPanel {
    id: 'roster' | 'history' | 'revisions' | 'chat' | 'queue';
    title: string;
    visible: boolean;
    x: number;
    y: number;
    w: number;
    h: number;
    zIndex: number;
    isMaximized: boolean;
  }

  const [panels, setPanels] = useState<WindowPanel[]>([
    { id: 'roster', title: 'Student Roster', visible: true, x: 20, y: 20, w: 320, h: 580, zIndex: 10, isMaximized: false },
    { id: 'history', title: 'Guidance History', visible: true, x: 360, y: 20, w: 440, h: 580, zIndex: 9, isMaximized: false },
    { id: 'revisions', title: 'Dispatch Feedback', visible: true, x: 820, y: 20, w: 440, h: 580, zIndex: 8, isMaximized: false },
    { id: 'chat', title: 'Advisor Chat', visible: false, x: 400, y: 150, w: 440, h: 420, zIndex: 7, isMaximized: false },
    { id: 'queue', title: 'Validation Queue', visible: false, x: 100, y: 100, w: 640, h: 440, zIndex: 6, isMaximized: false },
  ]);

  const [containerBounds, setContainerBounds] = useState({ width: 1200, height: 600 });
  const [maxZIndex, setMaxZIndex] = useState(10);

  const focusPanel = (id: string) => {
    const nextZ = maxZIndex + 1;
    setMaxZIndex(nextZ);
    setPanels(prev => prev.map(p => p.id === id ? { ...p, zIndex: nextZ } : p));
  };

  const startMove = (id: string, e: React.MouseEvent) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    focusPanel(id);
    const panel = panels.find(p => p.id === id);
    if (!panel || panel.isMaximized) return;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = panel.x;
    const startY = panel.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;
      
      const newX = Math.max(0, startX + deltaX);
      const newY = Math.max(0, startY + deltaY);
      
      setPanels(prev => prev.map(p => p.id === id ? { ...p, x: newX, y: newY } : p));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const startResize = (id: string, e: React.MouseEvent) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    e.stopPropagation();
    focusPanel(id);
    const panel = panels.find(p => p.id === id);
    if (!panel || panel.isMaximized) return;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startW = panel.w;
    const startH = panel.h;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;
      
      const newW = Math.max(250, startW + deltaX);
      const newH = Math.max(200, startH + deltaY);

      setPanels(prev => prev.map(p => p.id === id ? { ...p, w: newW, h: newH } : p));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const tileWorkspace = () => {
    const active = panels.filter(p => p.visible && (p.id === 'roster' || p.id === 'queue' || selectedStudentId !== null));
    if (active.length === 0) return;
    
    const containerW = containerBounds.width;
    const containerH = containerBounds.height;
    
    const panelW = Math.floor((containerW - (active.length + 1) * 10) / active.length);
    const panelH = Math.max(400, containerH - 20);

    setPanels(prev => prev.map(p => {
      if (!p.visible || (p.id !== 'roster' && p.id !== 'queue' && selectedStudentId === null)) return p;
      const index = active.findIndex(ap => ap.id === p.id);
      return {
        ...p,
        x: 10 + index * (panelW + 10),
        y: 10,
        w: panelW,
        h: panelH,
        isMaximized: false
      };
    }));
  };

  useEffect(() => {
    setRevisionPage(1);
    setSelectedFilterSessionId(null);
    tileWorkspace();
  }, [selectedStudentId, containerBounds.width, containerBounds.height]);

  const togglePanelVisibility = (id: 'roster' | 'history' | 'revisions' | 'chat' | 'queue') => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p));
  };

  const toggleMaximize = (id: string) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, isMaximized: !p.isMaximized } : p));
  };

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
    } catch {
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

  const activeRightTab = panelView === "chat" ? "chat" : "revisions";

  // Reusable Student Roster List for Tablet / Desktop
  const renderStudentRoster = (isMobileOrTabletLayout: boolean) => (
    <View className="gap-2.5">
      {students.length === 0 && (
        <View className="py-10 items-center justify-center gap-3 w-full">
          <User color="#64748B" size={28} />
          <Text className="text-tier-text-tertiary text-[13px] font-semibold text-center">No supervised students found.</Text>
        </View>
      )}

      {students.map((student, idx) => {
        const { sessions, pending, fixed, validated } = getStudentStats(student.id, logs);
        const sc = statusColor(pending, sessions);
        const sl = statusLabel(pending, sessions);
        const isSelected = selectedStudentId === student.id;
        const isHovered = hoveredStudentId === student.id;

        return (
          <MotionDiv key={student.id} {...motionPresets.fadeUp(idx)}>
            <Pressable
              onPress={() => {
                setSelectedStudentId(student.id);
                if (isMobileOrTabletLayout) {
                  setPanelView("overview");
                  if (isMobile) setActiveMobileTab("OVERVIEW");
                }
              }}
              onHoverIn={Platform.OS === "web" ? () => setHoveredStudentId(student.id) : undefined}
              onHoverOut={Platform.OS === "web" ? () => setHoveredStudentId(null) : undefined}
              className={`bg-tier-surface border rounded-tier-xl p-4 gap-3 transition-all ${
                isSelected
                  ? "bg-tier-overlay-active border-tier-accent-primary/25 shadow-tier-base"
                  : isHovered
                  ? "bg-tier-surface-raised border-tier-divider-base"
                  : "border-tier-divider-light"
              }`}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.985 : 1 }],
              })}
            >
              <View className="flex-row items-center gap-3">
                <View className={`w-[34px] h-[34px] rounded-tier-full items-center justify-center shrink-0 border ${
                  isSelected
                    ? "bg-tier-accent-primary border-tier-accent-primary"
                    : "bg-tier-accent-primary/10 border-tier-accent-primary/20"
                }`}>
                  <User
                    color={isSelected ? "#ffffff" : "#94A3B8"}
                    size={16}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-extrabold tracking-tight text-tier-text-primary" numberOfLines={1}>
                    {student.name}
                  </Text>
                  <Text className="text-tier-text-secondary text-[11px] font-semibold mt-0.5">Student NIM: {student.nim}</Text>
                </View>
                <Badge text={sl} color={sc} />
              </View>

              <View className="flex-row justify-between bg-tier-surface-raised rounded-tier-base p-2.5 border border-tier-divider-light">
                <View className="items-center gap-0.5">
                  <Text className="text-tier-text-primary text-base font-black tracking-tight">{sessions}</Text>
                  <Text className="text-tier-text-secondary text-[9px] font-bold uppercase tracking-[0.5px]">Sessions</Text>
                </View>
                <View className="items-center gap-0.5">
                  <Text className={`text-base font-black tracking-tight ${pending > 0 ? "text-tier-accent-caution" : "text-tier-text-primary"}`}>
                    {pending}
                  </Text>
                  <Text className="text-tier-text-secondary text-[9px] font-bold uppercase tracking-[0.5px]">Pending</Text>
                </View>
                <View className="items-center gap-0.5">
                  <Text className={`text-base font-black tracking-tight ${fixed > 0 ? "text-tier-accent-cyan" : "text-tier-text-primary"}`}>
                    {fixed}
                  </Text>
                  <Text className="text-tier-text-secondary text-[9px] font-bold uppercase tracking-[0.5px]">To Validate</Text>
                </View>
                <View className="items-center gap-0.5">
                  <Text className={`text-base font-black tracking-tight ${validated > 0 ? "text-tier-accent-success" : "text-tier-text-primary"}`}>
                    {validated}
                  </Text>
                  <Text className="text-tier-text-secondary text-[9px] font-bold uppercase tracking-[0.5px]">Validated</Text>
                </View>
              </View>
            </Pressable>
          </MotionDiv>
        );
      })}
    </View>
  );

  // Reusable Validation Queue component
  const renderValidationQueue = () => (
    <GlassCard className="p-7">
      <SectionHeader
        icon={<AlertCircle color="#06B6D4" size={18} />}
        title="Validation Queue — Student Revisions Awaiting Review"
      />

      {fixedAwaitingValidation.length === 0 ? (
        <View className="py-10 items-center justify-center gap-3 w-full">
          <CheckCircle color="#059669" size={28} />
          <Text className="text-tier-text-secondary text-[13px] font-semibold text-center">
            No revisions awaiting validation. All submissions are up to date.
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-4">
          {fixedAwaitingValidation.map((item, idx) => {
            const parentLog = logs.find((l) => (l.feedback_items ?? []).some((f) => f.id === item.id));
            const parentStudent = students.find((s) => s.id === parentLog?.student_id);

            return (
              <MotionDiv key={item.id} {...motionPresets.fadeUp(idx)} className="flex-1 min-w-[280px] max-w-[48%] flex">
                <View className="flex-1 bg-tier-surface-raised border border-tier-divider-light rounded-tier-xl p-[18px] gap-2.5">
                  <View className="flex-row justify-between items-center flex-wrap gap-2">
                    <View className="flex-row items-center gap-2">
                      <View className="w-[22px] h-[22px] rounded-tier-full bg-tier-accent-primary/10 border border-tier-accent-primary/20 items-center justify-center">
                        <User color="#64748B" size={12} />
                      </View>
                      <Text className="text-tier-text-secondary text-xs font-bold">
                        {parentStudent?.name ?? "Unknown Student"}
                      </Text>
                    </View>
                    <Badge text={item.category} color={item.category === "Major" ? "#DC2626" : "#6366F1"} />
                  </View>
                  <Text className="text-tier-text-primary text-[13px] leading-5 font-medium flex-1" numberOfLines={3}>
                    {item.content}
                  </Text>
                  {item.fix_proof_text && (
                    <View className="bg-tier-accent-success/5 border border-tier-accent-success/15 rounded-tier-base p-2.5 gap-1 mt-1">
                      <Text className="text-tier-accent-success text-[8.5px] font-extrabold tracking-[1px]">STUDENT DESCRIPTION</Text>
                      <Text className="text-tier-text-secondary text-[11px] leading-4" numberOfLines={2}>{item.fix_proof_text}</Text>
                    </View>
                  )}
                  <View className="flex-row gap-2.5 mt-2">
                    <Pressable
                      onPress={() => handleValidate(item.id)}
                      disabled={validatingId === item.id}
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-[9px] rounded-tier-base bg-tier-accent-success/10 border border-tier-accent-success/20 transition-all"
                      style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.85 : 1 })}
                    >
                      <CheckCircle color="#059669" size={14} />
                      <Text className="text-tier-accent-success text-xs font-extrabold tracking-[0.3px]">
                        {validatingId === item.id ? "Validating…" : "Approve Fix"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleRejectFix(item.id)}
                      disabled={validatingId === item.id}
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-[9px] rounded-tier-base bg-tier-accent-danger/10 border border-tier-accent-danger/20"
                      style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.85 : 1 })}
                    >
                      <AlertCircle color="#DC2626" size={14} />
                      <Text className="text-tier-accent-danger-bright text-xs font-extrabold">
                        {validatingId === item.id ? "Rejecting…" : "Reject Fix"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </MotionDiv>
            );
          })}
        </View>
      )}
    </GlassCard>
  );

  // Reusable Student detail overview section (Left header and stats card)
  const renderStudentDetailOverview = () => {
    if (!selectedStudent) return null;
    const { sessions, pending, fixed, validated } = getStudentStats(selectedStudent.id, logs);
    const total = pending + fixed + validated;
    const completionPct = total > 0 ? Math.round((validated / total) * 100) : 0;

    return (
      <View className="gap-4">
        {/* Statistics Cards Row */}
        <View className="flex-row justify-between flex-wrap gap-3">
          {[
            { label: "Total Sessions", val: sessions, color: "#6366F1" },
            { label: "Pending Revisions", val: pending, color: "#D97706" },
            { label: "To Validate", val: fixed, color: "#06B6D4" },
            { label: "Validated Items", val: validated, color: "#059669" },
          ].map((item) => (
            <View key={item.label} className="items-center gap-1 flex-1 min-w-[70px] bg-tier-surface-raised rounded-tier-base p-3.5 border border-tier-divider-light">
              <Text className="text-[24px] font-black tracking-tight" style={{ color: item.color }}>
                {item.val}
              </Text>
              <Text className="text-tier-text-secondary text-[9px] font-bold uppercase tracking-[0.5px] text-center">{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        <View className="gap-2 bg-tier-surface-raised rounded-tier-base p-4 border border-tier-divider-light">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-tier-text-primary text-xs font-bold">Thesis Progress Validation</Text>
            <Text className="text-tier-accent-success text-xs font-extrabold">{completionPct}%</Text>
          </View>
          <View className="h-2 rounded-tier-full bg-tier-surface border border-tier-divider-light overflow-hidden">
            <View
              className="h-full rounded-tier-full bg-tier-accent-success"
              style={{ width: `${completionPct}%` as any, ...(Platform.OS === "web" ? { transition: "width 0.6s cubic-bezier(0.25, 0.1, 0.25, 1.0)" } : {}) } as any}
            />
          </View>
          <Text className="text-tier-text-secondary text-[11px] font-semibold">{validated} of {total} revisions validated</Text>
        </View>

        {/* Latest Session Details */}
        {latestLog && (
          <View className="bg-tier-surface-raised rounded-tier-xl p-4 gap-3 border border-tier-divider-light">
            <Text className="text-tier-text-tertiary text-[9px] font-extrabold tracking-[1.5px] uppercase">LATEST SUPERVISION SESSION</Text>
            <Text className="text-tier-accent-primary text-xs font-bold">
              {new Date(latestLog.created_at).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
            {Platform.OS === "web" && latestLog.transcript_text ? (
              <Text className="text-tier-text-secondary text-[13px] leading-[22px] font-medium" numberOfLines={4}>
                {latestLog.transcript_text}
              </Text>
            ) : Platform.OS === "web" ? (
              <Text className="text-tier-text-tertiary text-xs italic">
                No transcript available for this session.
              </Text>
            ) : null}
            {latestLog.paper_filename ? (
              <View className="mt-3 border-t border-tier-divider-light pt-3 flex-row justify-between items-center">
                <View className="flex-1 mr-2.5">
                  <Text className="text-tier-text-tertiary text-[9px] font-extrabold tracking-widest uppercase mb-0.5">SUBMITTED MANUSCRIPT</Text>
                  <Text className="text-tier-text-primary text-xs font-semibold" numberOfLines={1}>{latestLog.paper_filename}</Text>
                </View>
                <Pressable
                  onPress={() => Linking.openURL(getFileDownloadUrl("paper", latestLog.paper_filename, accessToken!))}
                  className="px-3 py-1.5 rounded-tier-md bg-tier-accent-primary/10 border border-tier-accent-primary/20"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-tier-accent-primary text-[10px] font-extrabold tracking-[0.5px]">DOWNLOAD DRAFT</Text>
                </Pressable>
              </View>
            ) : null}
            {latestLog.revised_document_filename ? (
              <View className="mt-2 border-t border-tier-divider-light pt-3 flex-row justify-between items-center">
                <View className="flex-1 mr-2.5">
                  <Text className="text-tier-accent-violet text-[9px] font-extrabold tracking-widest uppercase mb-0.5">REVISED DRAFT</Text>
                  <Text className="text-tier-text-primary text-xs font-semibold" numberOfLines={1}>{latestLog.revised_document_filename}</Text>
                </View>
                <Pressable
                  onPress={() => Linking.openURL(getFileDownloadUrl("revised", latestLog.revised_document_filename || "", accessToken!))}
                  className="px-3 py-1.5 rounded-tier-md bg-tier-accent-violet/10 border border-tier-accent-violet/20"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-tier-accent-violet text-[10px] font-extrabold tracking-[0.5px]">DOWNLOAD REVISED</Text>
                </Pressable>
              </View>
            ) : null}
            {latestLog.final_document_filename ? (
              <View className="mt-2 border-t border-tier-divider-light pt-3 flex-row justify-between items-center">
                <View className="flex-1 mr-2.5">
                  <Text className="text-tier-accent-success text-[9px] font-extrabold tracking-widest uppercase mb-0.5">FINAL DOCUMENT</Text>
                  <Text className="text-tier-text-primary text-xs font-semibold" numberOfLines={1}>{latestLog.final_document_filename}</Text>
                </View>
                <Pressable
                  onPress={() => Linking.openURL(getFileDownloadUrl("final", latestLog.final_document_filename || "", accessToken!))}
                  className="px-3 py-1.5 rounded-tier-md bg-tier-accent-success/10 border border-tier-accent-success/20"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-tier-accent-success text-[10px] font-extrabold tracking-[0.5px]">DOWNLOAD FINAL</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  // Reusable Timeline Session History component
  const renderSessionHistory = () => (
    <View className="gap-4">
      {selectedStudentLogs.length === 0 ? (
        <View className="py-10 items-center justify-center gap-3 w-full bg-tier-surface rounded-tier-xl border border-tier-divider-light">
          <Archive color="#64748B" size={28} />
          <Text className="text-tier-text-tertiary text-[13px] font-semibold text-center">
            No consultation sessions recorded yet.
          </Text>
        </View>
      ) : (
        <View className="gap-0 bg-tier-surface rounded-tier-xl border border-tier-divider-light p-4">
          {selectedStudentLogs.map((log, idx) => {
            const totalItems = (log.feedback_items ?? []).length;
            const pendingItems = (log.feedback_items ?? []).filter((f) => f.status === "Pending").length;
            const validatedItems = (log.feedback_items ?? []).filter((f) => f.status === "Validated").length;

            return (
              <View key={log.id} className="flex-row gap-4 min-h-[90px]">
                <View className="items-center w-8 gap-0">
                  <View className="w-8 h-8 rounded-tier-full bg-tier-accent-primary/10 border border-tier-accent-primary/20 items-center justify-center shrink-0">
                    <Text className="text-tier-accent-primary text-[11px] font-black">
                      #{selectedStudentLogs.length - idx}
                    </Text>
                  </View>
                  {idx < selectedStudentLogs.length - 1 && (
                    <View className="w-[1px] flex-1 mt-1.5 mb-1.5 bg-tier-divider-base" />
                  )}
                </View>

                <View className="flex-1 pb-5 gap-2">
                  <View className="flex-row justify-between items-center flex-wrap gap-2">
                    <Text className="text-tier-text-primary text-[13px] font-extrabold tracking-tight">
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
                          : "#6366F1"
                      }
                    />
                  </View>

                  {Platform.OS === "web" && log.transcript_text ? (
                    <Text className="text-tier-text-secondary text-xs leading-[18px] font-medium" numberOfLines={2}>
                      {log.transcript_text}
                    </Text>
                  ) : null}

                  <View className="flex-row items-center gap-2 flex-wrap mt-1">
                    {log.paper_filename && (
                      <Pressable
                        onPress={() => Linking.openURL(getFileDownloadUrl("paper", log.paper_filename, accessToken!))}
                        className="px-2 py-0.5 rounded-tier-sm bg-tier-accent-primary/10 border border-tier-accent-primary/20"
                        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                      >
                        <Text className="text-tier-accent-primary text-[10px] font-bold">
                          Paper (Download)
                        </Text>
                      </Pressable>
                    )}
                    <Text className="text-tier-text-secondary text-[11px] font-semibold ml-1">
                      {totalItems} feedback item{totalItems !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  // Reusable Feedback composer and Revisions List component
  const renderRevisionsPanel = () => (
    <View className="flex-1 flex-col min-h-0 gap-4">
      {/* Dispatch Feedback Form */}
      <View className="bg-tier-surface rounded-tier-xl p-[18px] gap-3 border border-tier-divider-light shrink-0">
        <Text className="text-tier-accent-primary text-[10px] font-extrabold tracking-[1.5px] uppercase">DISPATCH FEEDBACK</Text>
        <Text className="text-tier-text-secondary text-xs leading-[18px] font-medium mb-1">
          Type your feedback below. The student will organize and classify this using their AI Oracle.
        </Text>

        <TextInput
          value={feedbackText}
          onChangeText={setFeedbackText}
          placeholder="Describe the revision requirement in detail (e.g., 'Expand literature review background' or 'Correct citation formatting')."
          placeholderTextColor="#64748B"
          multiline
          numberOfLines={3}
          className="text-tier-text-primary bg-tier-surface-raised border border-tier-divider-base rounded-tier-base p-3.5 text-sm font-medium leading-[22px] min-h-[80px]"
          style={{ outlineStyle: "none" } as any}
        />

        {feedbackSuccess ? (
          <Text className="text-tier-accent-success text-xs font-bold">{feedbackSuccess}</Text>
        ) : null}
        {feedbackError ? (
          <Text className="text-tier-accent-danger-bright text-xs font-bold">{feedbackError}</Text>
        ) : null}

        <Button
          title={submittingFeedback ? "Dispatching…" : "Dispatch Feedback"}
          disabled={submittingFeedback || !feedbackText.trim() || !latestLog}
          onPress={handleAddFeedback}
          tone="primary"
        />
      </View>

      {/* Filter by Session */}
      {selectedStudentLogs.length > 0 && (
        <View className="gap-2 shrink-0">
          <Text className="text-tier-text-secondary text-[10px] font-extrabold tracking-[1.5px] uppercase">Filter by Session</Text>
          <View className="flex-row flex-wrap gap-2 pb-2 border-b border-tier-divider-light">
            <Pressable
              onPress={() => setSelectedFilterSessionId(null)}
              className={`px-3.5 py-2 rounded-tier-base border transition-all ${
                selectedFilterSessionId === null
                  ? "bg-tier-overlay-active border-tier-accent-primary/25 shadow-tier-base"
                  : "bg-tier-surface border-tier-divider-light"
              }`}
            >
              <Text className={`text-xs font-extrabold tracking-[0.3px] uppercase ${selectedFilterSessionId === null ? "text-tier-accent-primary" : "text-tier-text-secondary"}`}>
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
                  className={`px-3.5 py-2 rounded-tier-base border transition-all ${
                    isSelected
                      ? "bg-tier-overlay-active border-tier-accent-primary/25 shadow-tier-base"
                      : "bg-tier-surface border-tier-divider-light"
                  }`}
                >
                  <Text className={`text-xs font-extrabold tracking-[0.3px] uppercase ${isSelected ? "text-tier-accent-primary" : "text-tier-text-secondary"}`}>
                    Session #{sessionNum} ({sessionDate})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Revisions items list */}
      <ScrollView className="flex-1 min-h-0" contentContainerStyle={{ gap: 16, paddingBottom: 24 }} nestedScrollEnabled={true}>
        <View className="gap-5 mt-1">
          {paginatedRevisionsBySession.map(({ log, items }) => {
            const sessionDate = new Date(log.created_at).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <View key={log.id} className="gap-3">
                <View className="flex-row items-center gap-2 border-b border-tier-divider-light pb-2 mb-1">
                  <View className="px-2 py-0.5 rounded-tier-sm bg-tier-accent-primary/10 border border-tier-accent-primary/20">
                    <Text className="text-tier-accent-primary text-[10px] font-black uppercase tracking-wider">
                      Session #{selectedStudentLogs.length - selectedStudentLogs.findIndex((l) => l.id === log.id)}
                    </Text>
                  </View>
                  <Text className="text-tier-text-secondary text-xs font-semibold">{sessionDate}</Text>
                </View>

                <View className="gap-3.5">
                  {items.map((item) => {
                    const isPending = item.status === "Pending";
                    const isFixed = item.status === "Fixed";
                    const isValidated = item.status === "Validated";
                    const iColor = isPending
                      ? "#D97706"
                      : isFixed
                      ? "#06B6D4"
                      : "#059669";

                    return (
                      <View key={item.id} className="bg-tier-surface rounded-tier-xl p-4 gap-2.5 border border-tier-divider-light">
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
                                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-tier-base bg-tier-accent-success/10 border border-tier-accent-success/20 transition-all"
                                style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.8 : 1 })}
                              >
                                <CheckCircle color="#059669" size={12} />
                                <Text className="text-tier-accent-success text-[11px] font-extrabold tracking-[0.3px]">
                                  {validatingId === item.id ? "Validating…" : "Approve"}
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleRejectFix(item.id)}
                                disabled={validatingId === item.id}
                                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-tier-base bg-tier-accent-danger/10 border border-tier-accent-danger/20"
                                style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.8 : 1 })}
                              >
                                <AlertCircle color="#DC2626" size={12} />
                                <Text className="text-tier-accent-danger-bright text-[11px] font-extrabold tracking-[0.3px]">
                                  {validatingId === item.id ? "Rejecting…" : "Reject"}
                                </Text>
                              </Pressable>
                            </View>
                          )}
                          {isValidated && (
                            <View className="flex-row items-center gap-2.5">
                              <View className="flex-row items-center gap-[5px]">
                                <CheckCircle color="#059669" size={13} />
                                <Text className="text-tier-accent-success text-[11px] font-bold">Validated</Text>
                              </View>
                              <Pressable
                                onPress={() => handleRejectFix(item.id)}
                                disabled={validatingId === item.id}
                                className="flex-row items-center gap-1 px-2 py-1 rounded-tier-sm bg-tier-accent-caution/10 border border-tier-accent-caution/20"
                                style={({ pressed }) => ({ opacity: validatingId === item.id ? 0.5 : pressed ? 0.8 : 1 })}
                              >
                                <Text className="text-tier-accent-caution text-[10px] font-extrabold tracking-[0.3px]">Undo</Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                        <Text className="text-tier-text-primary text-[13px] leading-5 font-medium">{item.content}</Text>

                        {/* Fix Proof Text Display */}
                        {item.fix_proof_text ? (
                          <View className="bg-tier-accent-success/5 border border-tier-accent-success/15 rounded-tier-base p-2.5 gap-1">
                            <Text className="text-tier-accent-success text-[9px] font-black tracking-[1.5px]">STUDENT FIX DESCRIPTION</Text>
                            <Text className="text-tier-text-secondary text-[12px] font-medium leading-[18px]">
                              {item.fix_proof_text}
                            </Text>
                          </View>
                        ) : null}

                        {/* Comments Thread */}
                        {item.comments && item.comments.length > 0 && (
                          <View className="mt-2 gap-2 border-t border-tier-divider-light pt-2">
                            <Text className="text-tier-text-tertiary text-[9px] font-black tracking-[1.5px]">COMMENTS</Text>
                            {item.comments.map((comment) => (
                              <View
                                key={comment.id}
                                className={`rounded-tier-base p-2.5 border ${
                                  comment.author_role === "lecturer"
                                    ? "bg-tier-accent-primary/5 border-tier-accent-primary/15 ml-4"
                                    : "bg-tier-surface-raised border-tier-divider-light mr-4"
                                }`}
                              >
                                <Text className="text-[9px] font-black tracking-[1px] text-tier-text-secondary mb-1">
                                  {comment.author_role === "lecturer" ? "ADVISOR" : "STUDENT"}
                                </Text>
                                <Text className="text-tier-text-primary text-[12px] leading-[18px] font-medium">{comment.content}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Add Comment Button */}
                        {commentingOnFeedbackId === item.id ? (
                          <View className="mt-2 gap-2 border-t border-tier-divider-light pt-2">
                            <TextInput
                              value={commentText}
                              onChangeText={setCommentText}
                              placeholder="Add a comment to this revision..."
                              placeholderTextColor="#64748B"
                              multiline
                              className="bg-tier-surface-raised border border-tier-divider-base rounded-tier-base text-tier-text-primary p-2.5 text-[12px] font-medium min-h-[60px]"
                              style={{ outlineStyle: "none", textAlignVertical: "top" } as any}
                            />
                            <View className="flex-row gap-2">
                              <Pressable
                                onPress={() => { setCommentingOnFeedbackId(null); setCommentText(""); }}
                                className="px-3 py-1.5 rounded-tier-base bg-tier-surface-raised border border-tier-divider-light"
                              >
                                <Text className="text-tier-text-secondary text-[11px] font-bold">Cancel</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => void handleAddComment(item.id)}
                                disabled={!commentText.trim()}
                                className="px-3 py-1.5 rounded-tier-base bg-tier-accent-primary/10 border border-tier-accent-primary/20"
                                style={{ opacity: commentText.trim() ? 1 : 0.5 }}
                              >
                                <Text className="text-tier-accent-primary text-[11px] font-bold">Post Comment</Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => setCommentingOnFeedbackId(item.id)}
                            className="mt-2 self-start px-2.5 py-1 rounded-tier-sm bg-tier-surface-raised border border-tier-divider-light"
                          >
                            <Text className="text-tier-text-secondary text-[10px] font-bold">+ Add Comment</Text>
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
          <View className="py-10 items-center justify-center gap-3 w-full bg-tier-surface border border-tier-divider-light rounded-tier-xl">
            <CheckCircle color="#059669" size={24} />
            <Text className="text-tier-text-secondary text-[13px] font-semibold text-center">
              No revision items recorded for this student yet.
            </Text>
          </View>
        )}

        {totalRevisionPages > 1 && (
          <View className="flex-row justify-end items-center gap-3 mt-4">
            <Text className="text-tier-text-secondary text-xs font-semibold">
              Page {revisionPage} of {totalRevisionPages}
            </Text>
            <View className="flex-row gap-1">
              <Pressable
                onPress={() => setRevisionPage((prev) => Math.max(prev - 1, 1))}
                disabled={revisionPage === 1}
                className={`w-8 h-8 rounded-tier-base items-center justify-center border transition-all ${
                  revisionPage === 1
                    ? "border-tier-divider-light bg-tier-surface opacity-40"
                    : "border-tier-divider-base bg-tier-surface-raised active:scale-95"
                }`}
              >
                <ChevronLeft color={revisionPage === 1 ? "#64748B" : "#F8FAFC"} size={16} />
              </Pressable>
              <Pressable
                onPress={() => setRevisionPage((prev) => Math.min(prev + 1, totalRevisionPages))}
                disabled={revisionPage === totalRevisionPages}
                className={`w-8 h-8 rounded-tier-base items-center justify-center border transition-all ${
                  revisionPage === totalRevisionPages
                    ? "border-tier-divider-light bg-tier-surface opacity-40"
                    : "border-tier-divider-base bg-tier-surface-raised active:scale-95"
                }`}
              >
                <ChevronRight color={revisionPage === totalRevisionPages ? "#64748B" : "#F8FAFC"} size={16} />
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Reusable Chat component
  const renderChatPanel = () => (
    <View className="flex-1 flex-col min-h-0 gap-3">
      {latestLog ? (
        <View className="flex-1 flex-col min-h-0 gap-2.5">
          <ScrollView
            ref={chatScrollRef}
            showsVerticalScrollIndicator={true}
            className="flex-1 bg-tier-surface border border-tier-divider-light rounded-tier-xl p-3"
            contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
            nestedScrollEnabled={true}
          >
            {directMessages.map((message, index) => {
              const isUser = message.sender_role === "lecturer";
              return (
                <View
                  key={`direct-msg-${message.id || index}`}
                  className={`p-3 rounded-tier-xl max-w-[85%] gap-1 ${
                    isUser
                      ? "bg-tier-accent-primary/10 border border-tier-accent-primary/20 self-end"
                      : "bg-tier-surface-raised border border-tier-divider-light self-start"
                  }`}
                >
                  <Text className="text-tier-text-secondary text-[9px] font-black tracking-[1.5px]">
                    {isUser ? "ADVISOR" : "STUDENT"}
                  </Text>
                  <Text className="text-tier-text-primary text-[13px] leading-[18px] font-medium">
                    {message.content}
                  </Text>
                </View>
              );
            })}
            {chatLoading && <TypingIndicator label="SENDING MESSAGE" color="#06B6D4" />}
            {!directMessages.length && !chatLoading && (
              <View className="py-[60px] items-center">
                <Text className="text-tier-text-secondary text-[12.5px] font-semibold text-center leading-[18px]">
                  No messages with this student yet. Send a message to start direct consultation.
                </Text>
              </View>
            )}
          </ScrollView>

          <View className="flex-row gap-2 items-center shrink-0">
            <TextInput
              value={chatQuery}
              onChangeText={setChatQuery}
              editable={!chatLoading}
              placeholder={chatLoading ? "Sending message..." : "Type a message to the student..."}
              placeholderTextColor="#64748B"
              onSubmitEditing={() => void sendDirectMessage()}
              className="flex-1 bg-tier-surface border border-tier-divider-base rounded-tier-base text-tier-text-primary px-3.5 py-3 text-[13px] font-medium"
              style={{ outlineStyle: "none", opacity: chatLoading ? 0.6 : 1 } as any}
            />
            <Pressable
              onPress={() => void sendDirectMessage()}
              disabled={chatLoading || !chatQuery.trim()}
              className="bg-tier-accent-primary px-4 py-3 rounded-tier-base self-stretch items-center justify-center"
              style={{ opacity: chatLoading || !chatQuery.trim() ? 0.5 : 1 }}
            >
              <Text className="text-white text-[13px] font-extrabold">
                Send
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="py-10 items-center justify-center gap-3 w-full bg-tier-surface border border-tier-divider-light rounded-tier-xl flex-1">
          <Archive color="#64748B" size={28} />
          <Text className="text-tier-text-tertiary text-[13px] font-semibold text-center">
            No active session found. Messages cannot be sent without an active log.
          </Text>
        </View>
      )}
    </View>
  );

  const mainContent = (
    <View className="flex-1" style={isMobile ? { flex: 1, display: "flex", flexDirection: "column" } : undefined}>
      <Page
        scrollable={!(isDesktop)}
        fullWidth={isDesktop}
        style={isDesktop ? { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, height: '100vh', display: 'flex', flexDirection: 'column', flex: 1 } : (isMobile ? { flex: 1, display: "flex", flexDirection: "column" } : undefined)}
      >
        <NavBar />

        {isDesktop ? (
          // ==================== DESKTOP WORKSPACE LAYOUT ====================
          <>
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-tier-divider-light bg-tier-surface shrink-0">
              <View className="flex-1">
                <Heading
                  title="Supervisor Workspace"
                  subtitle="Modular Sandbox Playground"
                />
              </View>
              <View className="flex-row bg-tier-surface border border-tier-divider-light p-1 rounded-tier-xl items-center gap-1.5 flex-wrap">
                <Text className="text-tier-text-tertiary text-[10px] font-extrabold tracking-[0.5px] uppercase px-2">
                  Workspace View:
                </Text>
                {[
                  { id: 'roster', label: "Roster", icon: <User size={13} />, state: panels.find(p => p.id === 'roster')?.visible, setter: () => togglePanelVisibility('roster') },
                  { id: 'history', label: "History", icon: <BookOpen size={13} />, state: panels.find(p => p.id === 'history')?.visible, setter: () => togglePanelVisibility('history') },
                  { id: 'revisions', label: "Feedback", icon: <Clock size={13} />, state: panels.find(p => p.id === 'revisions')?.visible, setter: () => togglePanelVisibility('revisions') },
                  { id: 'chat', label: "Chat", icon: <MessageSquare size={13} />, state: panels.find(p => p.id === 'chat')?.visible, setter: () => togglePanelVisibility('chat') },
                  { id: 'queue', label: "Queue", icon: <AlertCircle size={13} />, state: panels.find(p => p.id === 'queue')?.visible, setter: () => togglePanelVisibility('queue') },
                ].map(item => (
                  <Pressable
                    key={item.id}
                    onPress={item.setter}
                    className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-tier-lg border transition-all ${
                      item.state 
                        ? "bg-tier-overlay-active border-tier-accent-primary/25 text-tier-accent-primary" 
                        : "bg-transparent border-transparent text-tier-text-secondary"
                    }`}
                  >
                    {React.cloneElement(item.icon, { color: item.state ? "#6366F1" : "#94A3B8" } as any)}
                    <Text className={`text-[11px] font-bold ${item.state ? "text-tier-accent-primary" : "text-tier-text-secondary"}`}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}

                <View className="w-[1px] h-4 bg-tier-divider-light mx-1" />

                <Pressable
                  onPress={tileWorkspace}
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-tier-lg border border-tier-divider-light bg-tier-surface hover:bg-tier-surface-raised active:scale-95"
                >
                  <Grid size={13} color="#94A3B8" />
                  <Text className="text-[11px] font-bold text-tier-text-secondary">
                    Tile Layout
                  </Text>
                </Pressable>
              </View>
            </View>

            {error ? (
              <GlassCard className="mx-6 my-4 flex-row items-center gap-3 bg-tier-accent-danger/10 border border-tier-accent-danger/20 p-4 rounded-tier-xl shrink-0">
                <AlertCircle color="#DC2626" size={18} />
                <Text className="text-tier-accent-danger-bright text-sm font-semibold">{error}</Text>
              </GlassCard>
            ) : null}
          </>
        ) : (
          // ==================== MOBILE/TABLET PORTAL HEADER ====================
          <>
            {(!isMobile || activeMobileTab === "ROSTER") && (
              <View className={isMobile ? "w-full" : "flex-row justify-between items-center mb-5 flex-wrap gap-4 px-4"}>
                <View className="flex-1 min-w-[280px]">
                  <Heading
                    title="Supervisor Portal"
                    subtitle={isMobile ? undefined : "Monitor student guidance progress, validate revisions, and dispatch structured feedback."}
                  />
                </View>
              </View>
            )}

            {error ? (
              <GlassCard className="flex-row items-center gap-3 bg-tier-accent-danger/10 border border-tier-accent-danger/20 p-4 rounded-tier-xl">
                <AlertCircle color="#DC2626" size={18} />
                <Text className="text-tier-accent-danger-bright text-sm font-semibold">{error}</Text>
              </GlassCard>
            ) : null}
          </>
        )}

        {isMobile ? (
          // ==================== MOBILE SCREEN ====================
          <View className="flex-1 flex-col min-h-0">
            {/* Top segment control */}
            <View className="flex-row bg-tier-surface border border-tier-divider-light p-1 rounded-tier-xl mb-4 shrink-0">
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
                    className={`flex-1 py-2 rounded-tier-base items-center justify-center ${
                      isActive ? "bg-tier-accent-primary" : "bg-transparent"
                    } ${isDisabled ? "opacity-30" : ""}`}
                  >
                    <Text className={`text-[10px] font-bold tracking-wider ${isActive ? "text-white" : "text-tier-text-secondary"}`}>
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Content view based on active tab */}
            <View className="flex-1 min-h-0">
              {activeMobileTab === "ROSTER" && (
                <ScrollView className="flex-1" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
                  {/* General Stats */}
                  <View className="flex-row gap-4 flex-wrap">
                    <StatCard
                      label="Active Students"
                      value={stats?.student_count ?? students.length}
                      glowColor="#6366F1"
                    />
                    <StatCard
                      label="Pending Revisions"
                      value={pendingAcrossAll.length}
                      glowColor="#D97706"
                    />
                    <StatCard
                      label="Awaiting Validation"
                      value={fixedAwaitingValidation.length}
                      glowColor="#06B6D4"
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
                      <User color="#6366F1" size={18} />
                      <Text className="text-tier-text-primary text-base font-extrabold tracking-tight">Student Roster</Text>
                    </View>
                    {renderStudentRoster(true)}
                  </GlassCard>

                  {/* Validation Queue */}
                  {renderValidationQueue()}
                </ScrollView>
              )}

              {selectedStudent && activeMobileTab === "OVERVIEW" && (
                <View className="flex-1 flex-col min-h-0 gap-3">
                  {/* Student Header Summary Card */}
                  <GlassCard className="p-3 gap-2">
                    <View className="flex-row items-center gap-3">
                      <View className="w-[36px] h-[36px] rounded-tier-full bg-tier-accent-primary/10 border border-tier-accent-primary/15 items-center justify-center">
                        <User color="#6366F1" size={18} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-tier-text-primary text-base font-extrabold tracking-tight" numberOfLines={1}>{selectedStudent.name}</Text>
                        <Text className="text-tier-text-secondary text-[10px] font-semibold">
                          NIM: {selectedStudent.nim} · {selectedStudent.prodi}
                        </Text>
                      </View>
                    </View>
                    {selectedStudent.thesis_title && (
                      <View className="bg-tier-surface p-2 rounded-tier-base border border-tier-divider-light">
                        <Text className="text-tier-text-secondary text-[11px] leading-4 font-medium" numberOfLines={2}>
                          {selectedStudent.thesis_title}
                        </Text>
                      </View>
                    )}
                    {/* Sub-navigation Switcher inside Overview tab */}
                    <View className="flex-row bg-tier-surface border border-tier-divider-light p-0.5 rounded-tier-base mt-1">
                      <Pressable
                        onPress={() => setPanelView("overview")}
                        className={`flex-1 py-1.5 rounded-tier-sm items-center justify-center ${
                          panelView === "overview" ? "bg-tier-overlay-active border border-tier-accent-primary/20" : ""
                        }`}
                      >
                        <Text className={`text-[10px] font-bold uppercase ${panelView === "overview" ? "text-tier-accent-primary" : "text-tier-text-secondary"}`}>
                          Progress
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setPanelView("sessions")}
                        className={`flex-1 py-1.5 rounded-tier-sm items-center justify-center ${
                          panelView === "sessions" ? "bg-tier-overlay-active border border-tier-accent-primary/20" : ""
                        }`}
                      >
                        <Text className={`text-[10px] font-bold uppercase ${panelView === "sessions" ? "text-tier-accent-primary" : "text-tier-text-secondary"}`}>
                          Session History
                        </Text>
                      </Pressable>
                    </View>
                  </GlassCard>

                  {/* Render Overview or Sessions timeline content */}
                  <GlassCard className="flex-1 p-4 min-h-0">
                    <ScrollView className="flex-1" contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
                      {panelView === "overview" ? (
                        <>
                          <SectionHeader
                            icon={<CheckCircle color="#059669" size={16} />}
                            title="Guidance Progress"
                          />
                          {renderStudentDetailOverview()}
                        </>
                      ) : (
                        <>
                          <SectionHeader
                            icon={<Archive color="#06B6D4" size={16} />}
                            title="Session History"
                          />
                          {renderSessionHistory()}
                        </>
                      )}
                    </ScrollView>
                  </GlassCard>
                </View>
              )}

              {selectedStudent && activeMobileTab === "REVISIONS" && (
                <View className="flex-1 flex-col min-h-0 gap-3">
                  <GlassCard className="p-3">
                    <View className="flex-row items-center gap-3">
                      <View className="w-[36px] h-[36px] rounded-tier-full bg-tier-accent-primary/10 border border-tier-accent-primary/15 items-center justify-center">
                        <User color="#6366F1" size={18} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-tier-text-primary text-base font-extrabold tracking-tight" numberOfLines={1}>{selectedStudent.name}</Text>
                        <Text className="text-tier-text-secondary text-[10px] font-semibold">NIM: {selectedStudent.nim} · {selectedStudent.prodi}</Text>
                      </View>
                    </View>
                  </GlassCard>

                  <GlassCard className="flex-1 p-4 min-h-0 flex-col gap-3">
                    <SectionHeader
                      icon={<Clock color="#D97706" size={16} />}
                      title="Revision Workspace"
                    />

                    {/* Dispatch Feedback Form - Collapsible inside workspace */}
                    <View className="bg-tier-surface-raised border border-tier-divider-light rounded-tier-xl p-3 gap-2.5 shrink-0">
                      <Pressable
                        onPress={() => setShowMobileDispatchForm(!showMobileDispatchForm)}
                        className="flex-row justify-between items-center"
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <View className="flex-row items-center gap-2">
                          <Text className="text-tier-accent-primary text-[10px] font-extrabold tracking-[1.5px] uppercase">
                            DISPATCH FEEDBACK
                          </Text>
                          {feedbackText.trim().length > 0 && !showMobileDispatchForm && (
                            <View className="w-1.5 h-1.5 rounded-tier-full bg-tier-accent-primary" />
                          )}
                        </View>
                        <View className="px-2.5 py-1 rounded-tier-base bg-tier-accent-primary/10 border border-tier-accent-primary/15">
                          <Text className="text-tier-accent-primary text-[9px] font-bold">
                            {showMobileDispatchForm ? "Collapse" : "Expand +"}
                          </Text>
                        </View>
                      </Pressable>

                      {showMobileDispatchForm && (
                        <View className="gap-3 mt-2 border-t border-tier-divider-light pt-3">
                          <TextInput
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                            placeholder="Describe the revision requirement..."
                            placeholderTextColor="#64748B"
                            multiline
                            numberOfLines={3}
                            className="text-tier-text-primary bg-tier-surface border border-tier-divider-light rounded-tier-base p-3 text-xs font-medium leading-[18px] min-h-[60px]"
                          />

                          {feedbackSuccess ? (
                            <Text className="text-tier-accent-success text-xs font-bold">{feedbackSuccess}</Text>
                          ) : null}
                          {feedbackError ? (
                            <Text className="text-tier-accent-danger-bright text-xs font-bold">{feedbackError}</Text>
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

                    {renderRevisionsPanel()}
                  </GlassCard>
                </View>
              )}

              {selectedStudent && activeMobileTab === "CHAT" && (
                <View className="flex-1 flex-col min-h-0 gap-3">
                  <GlassCard className="p-3">
                    <View className="flex-row items-center gap-3">
                      <View className="w-[36px] h-[36px] rounded-tier-full bg-tier-accent-primary/10 border border-tier-accent-primary/15 items-center justify-center">
                        <User color="#6366F1" size={18} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-tier-text-primary text-base font-extrabold tracking-tight" numberOfLines={1}>{selectedStudent.name}</Text>
                        <Text className="text-tier-text-secondary text-[10px] font-semibold">NIM: {selectedStudent.nim} · {selectedStudent.prodi}</Text>
                      </View>
                    </View>
                  </GlassCard>

                  <GlassCard className="flex-1 p-3.5 min-h-0 flex-col">
                    <View className="flex-row items-center gap-2 border-b border-tier-divider-light pb-2 mb-2">
                      <Clock color="#06B6D4" size={16} />
                      <Text className="text-tier-text-primary text-sm font-extrabold tracking-tight">Direct Chat Consultation</Text>
                    </View>
                    {renderChatPanel()}
                  </GlassCard>
                </View>
              )}
            </View>
          </View>
        ) : isTablet ? (
          // ==================== TABLET VIEW (2 Columns) ====================
          <View className="w-full flex-col gap-4 flex-1">
            {/* Stats Row */}
            <View className="flex-row gap-4 flex-wrap">
              <StatCard
                label="Active Students"
                value={stats?.student_count ?? students.length}
                glowColor="#6366F1"
              />
              <StatCard
                label="Pending Revisions"
                value={pendingAcrossAll.length}
                glowColor="#D97706"
              />
              <StatCard
                label="Awaiting Validation"
                value={fixedAwaitingValidation.length}
                glowColor="#06B6D4"
              />
              <StatCard
                label="Avg. Completion"
                value={stats ? `${stats.completion_rate}%` : "0%"}
                glowColor="#059669"
              />
            </View>

            <View className="flex-row gap-5 items-start">
              {/* Left Column: Student Roster */}
              <GlassCard className="w-[300px] shrink-0 p-5">
                <SectionHeader
                  icon={<User color="#6366F1" size={18} />}
                  title="Student Roster"
                />
                {renderStudentRoster(true)}
              </GlassCard>

              {/* Right Column: Details Pane */}
              <View className="flex-1 min-w-0">
                {selectedStudent ? (
                  <GlassCard className="p-6 gap-5">
                    {/* Header */}
                    <View className="flex-row items-center gap-4">
                      <View className="w-[52px] h-[52px] rounded-tier-full bg-tier-accent-primary/10 border border-tier-accent-primary/15 items-center justify-center">
                        <User color="#6366F1" size={28} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-tier-text-primary text-xl font-extrabold tracking-tight">{selectedStudent.name}</Text>
                        <Text className="text-tier-text-secondary text-xs font-semibold mt-0.5">
                          Student NIM: {selectedStudent.nim} · Prodi: {selectedStudent.prodi}
                        </Text>
                      </View>
                      {(() => {
                        const { sessions, pending } = getStudentStats(selectedStudent.id, logs);
                        const sc = statusColor(pending, sessions);
                        const sl = statusLabel(pending, sessions);
                        return <Badge text={sl} color={sc} />;
                      })()}
                    </View>

                    {selectedStudent.thesis_title && (
                      <View className="bg-tier-surface-raised border border-tier-divider-light rounded-tier-xl p-4 flex-row gap-2">
                        <Archive color="#94A3B8" size={14} className="mt-0.5" />
                        <Text className="flex-1 text-tier-text-secondary text-xs leading-[18px] font-medium" numberOfLines={3}>
                          {selectedStudent.thesis_title}
                        </Text>
                      </View>
                    )}

                    {/* Tab Navigation Switcher */}
                    <View className="flex-row gap-2 pb-2 border-b border-tier-divider-light">
                      {(["overview", "revisions", "sessions", "chat"] as PanelView[]).map((tab) => (
                        <Pressable
                          key={tab}
                          onPress={() => setPanelView(tab)}
                          className={`px-4 py-2 rounded-tier-base border transition-all ${
                            panelView === tab
                              ? "bg-tier-overlay-active border-tier-accent-primary/25 shadow-tier-base"
                              : "bg-tier-surface border-tier-divider-light"
                          }`}
                        >
                          <Text className={`text-xs font-extrabold tracking-[0.3px] uppercase ${panelView === tab ? "text-tier-accent-primary" : "text-tier-text-secondary"}`}>
                            {tab === "overview"
                              ? "Overview"
                              : tab === "revisions"
                              ? "Revisions"
                              : tab === "sessions"
                              ? "History"
                              : "Advisor Chat"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Tab Panels */}
                    <View className="min-h-[350px]">
                      {panelView === "overview" && renderStudentDetailOverview()}
                      {panelView === "sessions" && renderSessionHistory()}
                      {panelView === "revisions" && renderRevisionsPanel()}
                      {panelView === "chat" && renderChatPanel()}
                    </View>
                  </GlassCard>
                ) : (
                  <GlassCard className="items-center justify-center p-[60px] gap-4 min-h-[300px]">
                    <User color="#64748B" size={40} />
                    <Text className="text-tier-text-secondary text-sm text-center font-semibold max-w-[280px] leading-[22px]">
                      Select a student from the roster to view detailed guidance information.
                    </Text>
                  </GlassCard>
                )}
              </View>
            </View>

            {/* Validation Queue */}
            {renderValidationQueue()}
          </View>
        ) : (
          // ==================== DESKTOP VIEW ====================
          <View className="w-full flex-1 relative bg-tier-surface-sunken overflow-hidden" onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setContainerBounds({ width, height });
              }}>
            {/* Floating Windows Manager Workspace Area */}
            {panels.map((panel) => {
              if (!panel.visible) return null;
              const hasSelectedStudent = selectedStudentId !== null;

              return (
                <View
                  key={panel.id}
                  style={{
                    position: 'absolute',
                    left: panel.isMaximized ? 0 : panel.x,
                    top: panel.isMaximized ? 0 : panel.y,
                    width: panel.isMaximized ? '100%' : panel.w,
                    height: panel.isMaximized ? '100%' : panel.h,
                    zIndex: panel.zIndex,
                    cursor: 'default',
                  } as any}
                  {...({
                    onMouseDown: () => focusPanel(panel.id),
                    className: "bg-tier-surface border border-tier-divider-base rounded-tier-xl shadow-tier-lg overflow-hidden flex-col"
                  } as any)}
                >
                  {/* Panel Title Bar (Drag Handler) */}
                  <View
                    {...({
                      onMouseDown: (e: React.MouseEvent) => startMove(panel.id, e),
                      className: "flex-row items-center justify-between px-4 py-3 bg-tier-surface-raised border-b border-tier-divider-light select-none cursor-move shrink-0"
                    } as any)}
                  >
                    <View className="flex-row items-center gap-2">
                      {panel.id === 'roster' && <User size={13} color="#6366F1" />}
                      {panel.id === 'history' && <BookOpen size={13} color="#6366F1" />}
                      {panel.id === 'revisions' && <Clock size={13} color="#059669" />}
                      {panel.id === 'chat' && <MessageSquare size={13} color="#06B6D4" />}
                      {panel.id === 'queue' && <AlertCircle size={13} color="#06B6D4" />}
                      <Text className="text-tier-text-primary text-xs font-extrabold uppercase tracking-wider">
                        {panel.title}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center gap-2">
                      {/* Maximize / Restore Toggle */}
                      <Pressable
                        onPress={() => toggleMaximize(panel.id)}
                        className="p-1 rounded hover:bg-tier-divider-light active:scale-95"
                      >
                        {panel.isMaximized ? (
                          <Minimize2 size={13} color="#94A3B8" />
                        ) : (
                          <Maximize2 size={13} color="#94A3B8" />
                        )}
                      </Pressable>

                      {/* Minimize/Close Button */}
                      <Pressable
                        onPress={() => togglePanelVisibility(panel.id)}
                        className="p-1 rounded hover:bg-tier-accent-danger/20 active:scale-95"
                      >
                        <X size={13} color="#94A3B8" />
                      </Pressable>
                    </View>
                  </View>

                  {/* Panel Window Content */}
                  <View className="flex-1 p-4 min-h-0">
                    {panel.id === 'roster' && (
                      <ScrollView className="flex-1" showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                        {renderStudentRoster(false)}
                      </ScrollView>
                    )}

                    {panel.id === 'history' && (
                      hasSelectedStudent ? (
                        <ScrollView className="flex-1" showsVerticalScrollIndicator={true} nestedScrollEnabled={true} contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>
                          {renderStudentDetailOverview()}
                          <View className="border-t border-tier-divider-light pt-4 mt-2">
                            <Text className="text-tier-text-primary text-xs font-bold uppercase tracking-wider mb-3">Timeline Logs</Text>
                            {renderSessionHistory()}
                          </View>
                        </ScrollView>
                      ) : (
                        <View className="flex-1 items-center justify-center p-6 gap-3">
                          <User color="#64748B" size={32} />
                          <Text className="text-tier-text-secondary text-xs text-center font-semibold max-w-[200px] leading-5">
                            Select a student from the roster to view detailed guidance history.
                          </Text>
                        </View>
                      )
                    )}

                    {panel.id === 'revisions' && (
                      hasSelectedStudent ? (
                        renderRevisionsPanel()
                      ) : (
                        <View className="flex-1 items-center justify-center p-6 gap-3">
                          <Clock color="#64748B" size={32} />
                          <Text className="text-tier-text-secondary text-xs text-center font-semibold max-w-[200px] leading-5">
                            Select a student from the roster to open dispatch feedback tools.
                          </Text>
                        </View>
                      )
                    )}

                    {panel.id === 'chat' && (
                      hasSelectedStudent ? (
                        renderChatPanel()
                      ) : (
                        <View className="flex-1 items-center justify-center p-6 gap-3">
                          <MessageSquare color="#64748B" size={32} />
                          <Text className="text-tier-text-secondary text-xs text-center font-semibold max-w-[200px] leading-5">
                            Select a student from the roster to open direct chat consultation.
                          </Text>
                        </View>
                      )
                    )}

                    {panel.id === 'queue' && (
                      <ScrollView className="flex-1" showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                        {renderValidationQueue()}
                      </ScrollView>
                    )}
                  </View>

                  {/* Window Resize Handle */}
                  {!panel.isMaximized && Platform.OS === 'web' && (
                    <View
                      {...({
                        onMouseDown: (e: React.MouseEvent) => startResize(panel.id, e),
                        className: "absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize items-end justify-end p-0.5 z-[99]",
                        style: { userSelect: 'none' }
                      } as any)}
                    >
                      <View className="w-1.5 h-1.5 border-r border-b border-tier-text-secondary opacity-60" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Page>

      {/* Floating Notifications (Toast list) */}
      <View 
        className="z-[99999] gap-2.5" 
        style={{ 
          position: Platform.OS === "web" ? "fixed" : "absolute", 
          top: isMobile ? 60 : 80, 
          left: isMobile ? 16 : undefined,
          right: isMobile ? 16 : 20, 
          width: isMobile ? undefined : 320,
          maxWidth: isMobile ? undefined : 320,
        } as any}
      >
        {toasts.map(toast => {
          const translateAnim = toast.animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [isMobile ? -100 : 340, 0],
          });
          const opacityAnim = toast.animatedValue;
          
          let color = "#6366F1"; // tier-accent-primary
          if (toast.type === "chat") {
            color = "#06B6D4"; // tier-accent-cyan
          } else if (toast.type === "revision") {
            color = "#059669"; // tier-accent-success
          }
          
          return (
            <Animated.View
              key={toast.id}
              className="p-4 rounded-tier-xl border border-tier-divider-base bg-tier-surface-raised flex-row gap-3 items-center"
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
                <Text className="text-tier-text-primary text-[13px] font-extrabold">{toast.title}</Text>
                <Text className="text-tier-text-secondary text-[11px] font-medium" numberOfLines={2}>{toast.message}</Text>
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
}
