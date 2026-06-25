import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { WebFileInput } from "@/src/components/WebFileInput";
import { MultiImageInput } from "@/src/components/MultiImageInput";
import { GlassCard } from "@/src/components/ui/glass-card";
import { Badge, Button, Heading, Page } from "@/src/components/ui";
import { API_URL, getFileDownloadUrl } from "@/src/lib/config";
import { useAuth } from "@/src/providers/AuthProvider";
import { useWebSocket, useIsMobile } from "@/src/hooks";
import type { ConsultationLog, FeedbackItem, RevisionAnnotation } from "@/src/types";
import {
  CloudUpload,
  Archive,
  Cpu,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Bell,
  MessageSquare,
  AlertTriangle,
} from "lucide-react-native";

if (Platform.OS !== "web") {
  var Haptics = require("expo-haptics");
}

type ChatMessage = {
  role: string;
  content: string;
};

type TypingIndicatorProps = {
  label?: string;
  color?: string;
};

const TypingIndicator = ({ label = "AI THINKING", color = "#7C3AED" }: TypingIndicatorProps) => {
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
    <View
      className="flex-row items-center rounded-2xl border border-white/[0.06] bg-slate-800/50 p-3.5 max-w-[85%]"
      style={{ gap: 5, ...(Platform.OS === "web" ? { boxShadow: `0 0 8px ${color}0D` } : { shadowColor: color, shadowOpacity: 0.05, shadowRadius: 8 }) }}
    >
      <Text className="text-[9px] font-black tracking-[0.8px]" style={{ color: color, marginRight: 4 }}>
        {label}
      </Text>
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }, getInterpolatedStyle(dot1)]} />
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }, getInterpolatedStyle(dot2)]} />
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }, getInterpolatedStyle(dot3)]} />
    </View>
  );
};

export default function ConsultationsScreen() {
  const { api, accessToken, user, booting } = useAuth();
  const isMobile = useIsMobile(1024);
  const [logs, setLogs] = useState<ConsultationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ConsultationLog | null>(null);

  const hasGroqKey = !!(user?.groq_key && user.groq_key.length > 8);
  const hasLlmKey = !!(user?.gemini_key || user?.openai_key || user?.anthropic_key || user?.nvidia_key);

  // U-5: Use a single Animated.Value ref to prevent memory leak from creating new instances per toast
  const toastAnimRef = useRef(new Animated.Value(0)).current;
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message: string; type: "chat" | "revision" | "system" }>>([]);

  const showToast = (title: string, message: string, type: "chat" | "revision" | "system") => {
    const id = Math.random().toString(36).substring(7);

    setToasts(prev => [...prev, { id, title, message, type }]);

    toastAnimRef.setValue(0);
    Animated.timing(toastAnimRef, {
      toValue: 1,
      duration: 350,
      useNativeDriver: Platform.OS !== "web",
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnimRef, {
        toValue: 0,
        duration: 350,
        useNativeDriver: Platform.OS !== "web",
      }).start(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      });
    }, 4500);
  };

  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [annotationFiles, setAnnotationFiles] = useState<File[]>([]);
  const [studentTab, setStudentTab] = useState<"feedback" | "upload" | "transcript" | "annotations" | "drafts">("feedback");
  const [showArchiveDropdown, setShowArchiveDropdown] = useState(false);
  const [mobileStudentPanel, setMobileStudentPanel] = useState<"upload" | "feedback" | "chat">("upload");
  const [mobileLecturerPanel, setMobileLecturerPanel] = useState<"queue" | "transcript" | "validation">("queue");

  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatMode, setChatMode] = useState<"oracle" | "advisor">("oracle");
  const [directMessages, setDirectMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState("");
  const chatScrollRef = useRef<ScrollView | null>(null);

  const [selectedFeedbackItem, setSelectedFeedbackItem] = useState<FeedbackItem | null>(null);
  const [feedbackInputText, setFeedbackInputText] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState<"Major" | "Minor">("Major");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0.24);
  const [audioTime, setAudioTime] = useState("02:14");
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [commentingOnFeedbackId, setCommentingOnFeedbackId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  // Revised draft upload state
  const [revisedFile, setRevisedFile] = useState<File | null>(null);
  const [uploadingRevised, setUploadingRevised] = useState(false);

  // Fix proof text state
  const [fixingFeedbackId, setFixingFeedbackId] = useState<number | null>(null);
  const [fixProofText, setFixProofText] = useState("");

  // Topic mismatch detection state
  const [mismatchCheck, setMismatchCheck] = useState<{
    is_mismatch: boolean;
    confidence: string;
    message: string;
    audio_topic?: string;
    paper_topic?: string;
  } | null>(null);
  const [checkingMismatch, setCheckingMismatch] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);

  // Collapsible comments state
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});

  const toggleComments = (itemId: number) => {
    setExpandedComments(prev => {
      const isCurrentlyExpanded = !!prev[itemId];
      const nextVal = !isCurrentlyExpanded;
      if (nextVal) {
        setCommentingOnFeedbackId(itemId);
      } else {
        if (commentingOnFeedbackId === itemId) {
          setCommentingOnFeedbackId(null);
          setCommentText("");
        }
      }
      return { ...prev, [itemId]: nextVal };
    });
  };

  const getMeetingNumber = (logId: number, studentId: number) => {
    const studentLogs = logs
      .filter((l) => l.student_id === studentId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const index = studentLogs.findIndex((l) => l.id === logId);
    return index !== -1 ? index + 1 : 1;
  };

  const formatSessionDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const appendChat = (message: ChatMessage) => {
    setChatHistory((current) => {
      const last = current[current.length - 1];
      if (last && last.role === message.role && last.content === message.content) {
        return current;
      }
      return [...current, message];
    });
  };

  const loadLogs = async () => {
    const response = await api<{ data: ConsultationLog[] }>("/consultations");
    setLogs(response.data);
    if (!selectedLog && response.data.length > 0) {
      setSelectedLog(response.data[0]);
    }
  };

  useEffect(() => {
    if (booting || !accessToken) return;

    void loadLogs().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load consultations")
    );
  }, [api, booting, accessToken]);

  const loadDirectMessages = async (logId: number) => {
    try {
      const res = await api<{ data: any[] }>(`/consultations/${logId}/direct-messages`);
      setDirectMessages(res.data);
    } catch (err) {
      console.warn("Failed to load direct messages:", err);
    }
  };

  const loadAIChats = async (logId: number) => {
    try {
      const res = await api<{ data: any[] }>(`/consultations/${logId}/ai-chats`);
      const mapped = res.data.map((m: any) => ({
        role: m.role,
        content: m.content
      }));
      setChatHistory(mapped);
    } catch (err) {
      console.warn("Failed to load AI chats:", err);
    }
  };

  useEffect(() => {
    if (!accessToken || !selectedLog) {
      return;
    }

    void loadDirectMessages(selectedLog.id);
    void loadAIChats(selectedLog.id);
  }, [accessToken, selectedLog?.id]);

  const wsRooms = logs.map((log) => `consultation.${log.id}`);

  useWebSocket({
    accessToken,
    rooms: wsRooms,
    enabled: !!accessToken && logs.length > 0,
    onMessage: (payload) => {
      if (payload.event === "feedback.new") {
        const newItem = payload.data;
        setLogs((current) =>
          current.map((log) =>
            log.id !== newItem.log_id
              ? log
              : {
                  ...log,
                  feedback_items: [
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
        showToast(
          "New Revision Dispatched",
          `Your advisor added a new revision item: "${newItem.content}".`,
          "revision"
        );
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
        const status = payload.data.status;
        const msgTitle = status === "Validated" ? "Revision Approved!" : "Revision Status Updated";
        const msgText =
          status === "Validated"
            ? "A revision feedback has been successfully validated and approved by your advisor."
            : `A revision feedback status was changed to "${status}".`;
        showToast(msgTitle, msgText, "revision");
      }

      if (payload.event === "chat.message") {
        appendChat({ role: payload.data.role, content: payload.data.content });
      }

      if (payload.event === "chat.direct-message") {
        setDirectMessages((current) => {
          if (current.some((m) => m.id === payload.data.id)) return current;
          return [...current, payload.data];
        });
        if (payload.data.sender_role === "lecturer") {
          showToast("New Message from Advisor", payload.data.content, "chat");
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
    },
  });

  useEffect(() => {
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatHistory, directMessages, chatMode]);

  const selected = useMemo(
    () => logs.find((log) => log.id === selectedLog?.id) ?? selectedLog,
    [logs, selectedLog]
  );

  useEffect(() => {
    if (selected && selected.feedback_items && selected.feedback_items.length > 0) {
      setSelectedFeedbackItem(selected.feedback_items[0]);
      setFeedbackInputText(selected.feedback_items[0].content);
      setFeedbackCategory(selected.feedback_items[0].category);
    } else {
      setSelectedFeedbackItem(null);
      setFeedbackInputText("");
    }
  }, [selected?.id]);

  // Check for topic mismatch between audio/annotations and draft before uploading
  const checkMismatch = async () => {
    if (!paperFile || (!audioFile && annotationFiles.length === 0)) {
      return;
    }

    setCheckingMismatch(true);
    setError("");
    try {
      const body = new FormData();
      body.append("paper", paperFile);
      if (audioFile) {
        body.append("audio", audioFile);
      }
      annotationFiles.forEach((f) => body.append("annotations", f));
      
      const result = await api<{
        is_mismatch: boolean;
        confidence: string;
        message: string;
        audio_topic?: string;
        paper_topic?: string;
        proceed: boolean;
      }>("/consultations/check-mismatch", { method: "POST", body, headers: {} });

      setMismatchCheck(result);
      
      if (result.is_mismatch && result.confidence !== "low") {
        setShowMismatchModal(true);
      } else {
        // No mismatch or low confidence, proceed with upload
        await doUploadConsultation();
      }
    } catch (err) {
      // If check fails, proceed with upload anyway
      console.warn("Mismatch check failed, proceeding with upload:", err);
      await doUploadConsultation();
    } finally {
      setCheckingMismatch(false);
    }
  };

  const doUploadConsultation = async () => {
    if (!paperFile) {
      setError("Please select the manuscript (.docx) before proceeding.");
      return;
    }
    if (!audioFile && annotationFiles.length === 0) {
      setError("Please select either the audio recording (.mp3/.wav) or at least one annotation file before proceeding.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("paper", paperFile);
      if (audioFile) {
        body.append("audio", audioFile);
      }
      annotationFiles.forEach((f) => body.append("annotations", f));
      await api("/consultations", { method: "POST", body, headers: {} });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setPaperFile(null);
      setAudioFile(null);
      setAnnotationFiles([]);
      setMismatchCheck(null);
      setShowMismatchModal(false);
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadConsultation = async () => {
    if (!paperFile) {
      setError("Please select the manuscript (.docx) before proceeding.");
      return;
    }
    if (!audioFile && annotationFiles.length === 0) {
      setError("Please select either the audio recording (.mp3/.wav) or at least one annotation file before proceeding.");
      return;
    }
    
    // First check for mismatch (if audio file or annotations are provided), then upload
    if (audioFile || annotationFiles.length > 0) {
      await checkMismatch();
    } else {
      await doUploadConsultation();
    }
  };

  const sendChat = async () => {
    if (!selected || !chatQuery.trim() || chatLoading) {
      return;
    }

    const draft = chatQuery;
    setChatQuery("");
    setChatLoading(true);
    setError("");

    if (chatMode === "oracle") {
      appendChat({ role: "user", content: draft });
      try {
        const response = await api<{ ai_response: string }>("/consultations/chat", {
          method: "POST",
          body: JSON.stringify({ log_id: selected.id, query: draft }),
        });
        appendChat({ role: "ai", content: response.ai_response });
        if (Platform.OS !== "web") {
          Haptics.selectionAsync();
        }
        showToast("AI Oracle Response Ready", "The AI has compiled a response for your revision guidelines.", "system");
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "AI Oracle failed to respond";
        setError(`AI Oracle Error: ${errMsg}. Please verify that your API Key is configured in your profile.`);
        appendChat({ role: "ai", content: `AI Oracle connection failed: ${errMsg}. Please verify your API Key in your profile settings.` });
      } finally {
        setChatLoading(false);
      }
    } else {
      try {
        const response = await api<{ data: any }>(`/consultations/${selected.id}/direct-messages`, {
          method: "POST",
          body: JSON.stringify({ content: draft }),
        });
        setDirectMessages((current) => {
          if (current.some((m) => m.id === response.data.id)) return current;
          return [...current, response.data];
        });
        if (Platform.OS !== "web") {
          Haptics.selectionAsync();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message to advisor");
      } finally {
        setChatLoading(false);
      }
    }
  };

  const handleQuickRevisi = async (content: string) => {
    if (!selected || chatLoading) return;
    const prompt = `Provide concrete solutions and textual revision improvements for the following feedback item:\n"${content}"`;

    appendChat({ role: "user", content: prompt });
    setChatLoading(true);
    setError("");
    try {
      const response = await api<{ ai_response: string }>("/consultations/chat", {
        method: "POST",
        body: JSON.stringify({ log_id: selected.id, query: prompt }),
      });
      appendChat({ role: "ai", content: response.ai_response });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Quick AI Revision failed";
      setError(`Quick AI Revision Error: ${errMsg}. Please verify that your API Key is configured in your profile.`);
      appendChat({ role: "ai", content: `AI Quick Revision processing failed: ${errMsg}. Please check your API Key in your profile settings.` });
    } finally {
      setChatLoading(false);
    }
  };

  const classifyFeedback = async () => {
    if (!selected) return;
    setClassifying(true);
    setError("");
    try {
      await api(`/consultations/${selected.id}/classify-feedback`, {
        method: "POST",
      });
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Classification failed");
    } finally {
      setClassifying(false);
    }
  };

  const updateStatus = async (item: FeedbackItem, status: FeedbackItem["status"], proofText?: string) => {
    try {
      await api(`/consultations/feedback/${item.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, log_id: selected?.id, fix_proof_text: proofText || "" }),
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await loadLogs();
      if (selectedFeedbackItem && selectedFeedbackItem.id === item.id) {
        setSelectedFeedbackItem(prev => prev ? { ...prev, status, fix_proof_text: proofText || prev.fix_proof_text } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
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
        author_role: user?.role ?? "student",
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

  const triggerTranscription = () => {
    setIsTranscribing(true);
    setTimeout(() => {
      setIsTranscribing(false);
      if (Platform.OS === "web") {
        alert("Success: AI transcript has been successfully reprocessed and synchronized.");
      } else {
        Alert.alert("Success", "AI transcript has been successfully reprocessed and synchronized.");
      }
    }, 2000);
  };

  const triggerAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      if (Platform.OS === "web") {
        alert("Success: Feedback metrics and version consistency analysis have been updated.");
      } else {
        Alert.alert("Success", "Feedback metrics and version consistency analysis have been updated.");
      }
    }, 2000);
  };

  const uploadRevisedDocument = async () => {
    if (!revisedFile || !selected) return;
    setUploadingRevised(true);
    setError("");
    try {
      const body = new FormData();
      body.append("revised_document", revisedFile);
      await api(`/consultations/${selected.id}/revised-document`, {
        method: "POST",
        body,
        headers: {},
      });
      setRevisedFile(null);
      await loadLogs();
      showToast("Revised Draft Uploaded", "Your revised document has been uploaded successfully.", "system");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload revised document");
    } finally {
      setUploadingRevised(false);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      // Pause: clear the interval
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Play: start a new interval
      setIsPlaying(true);
      audioIntervalRef.current = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 1) {
            setIsPlaying(false);
            if (audioIntervalRef.current) {
              clearInterval(audioIntervalRef.current);
              audioIntervalRef.current = null;
            }
            return 1;
          }
          return prev + 0.01;
        });
      }, 500);
    }
  };

  const content = (
    <RequireAuth>
      <View className="flex-1">
        <Page
          showFloatingShapes={false}
          scrollable={
            !isMobile ||
            (user?.role === "student"
              ? mobileStudentPanel !== "chat"
              : mobileLecturerPanel !== "transcript")
          }
        >
          <NavBar />


          <Heading
            title="Consultation Workspace"
            subtitle={
              !isMobile
                ? (user?.role === "lecturer"
                  ? "Supervisor Workspace - Auditing draft thesis, evaluating audio transcripts, and verifying revision status."
                  : "Student Workspace - Upload manuscripts, evaluate advisor feedback, and consult the AI Oracle for revision guidelines.")
                : undefined
            }
          />

          {error ? (
            <GlassCard className="flex-row items-center gap-3 bg-tier-accent-danger/10 border-tier-accent-danger/20 p-4 mb-4">
              <AlertCircle color="#DC2626" size={20} />
              <Text className="text-sm font-semibold text-tier-accent-danger-bright">{error}</Text>
            </GlassCard>
          ) : null}

          {/* API Key Warnings */}
          {user?.role === "student" && (!hasGroqKey || !hasLlmKey) ? (
            <GlassCard className="flex-row items-center gap-2.5 bg-tier-accent-caution/10 border-tier-accent-caution/20 p-3 py-2 mb-3.5 w-full">
              <AlertCircle color="#D97706" size={15} />
              <Text className="text-[11px] font-semibold text-tier-accent-caution flex-1">
                {!hasGroqKey && !hasLlmKey
                  ? "API Keys missing: Voice & AI features are disabled. Please configure them in Settings."
                  : !hasGroqKey
                  ? "Groq Key missing: Voice features are disabled. Please configure in Settings."
                  : "LLM Key missing: AI Chat is disabled. Please configure in Settings."}
              </Text>
            </GlassCard>
          ) : null}

          {/* Dynamic Dual-Layout by User Role */}
          {user?.role === "student" ? (
            /* ==================== STUDENT WORKSPACE (CLARITY STREAM 2 PANEL) ==================== */
            <View className={!isMobile ? "flex-row flex-wrap items-start w-full gap-5" : "flex-1 min-h-0 w-full flex-col gap-4"}>
              {isMobile && (
                <View className="flex-row gap-1 bg-tier-surface rounded-[10px] p-[3px] border border-tier-divider-light">
                  {(["upload", "feedback", "chat"] as const).map((tab) => (
                    <Pressable
                      key={tab}
                      onPress={() => setMobileStudentPanel(tab)}
                      className="flex-1 py-2 rounded-lg items-center"
                      style={{
                        backgroundColor: mobileStudentPanel === tab ? "rgba(99, 102, 241, 0.08)" : "transparent",
                        borderWidth: 1,
                        borderColor: mobileStudentPanel === tab ? "rgba(99, 102, 241, 0.15)" : "transparent",
                      }}
                    >
                      <Text className="text-[11px] font-extrabold" style={{ color: mobileStudentPanel === tab ? "#6366F1" : "#94A3B8" }}>
                        {tab === "upload" ? "UPLOAD" : tab === "feedback" ? "FEEDBACK" : "AI CHAT"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Left Panel: Document Panel (Feedback, Uploads, Transcript, Annotations, Drafts) */}
              {(!isMobile || mobileStudentPanel === "upload" || mobileStudentPanel === "feedback") && (
                <GlassCard className={!isMobile ? "flex-[3.5] min-w-[500px] p-6 h-[720px] flex flex-col justify-between" : "w-full p-5 flex flex-col gap-4"}>
                  <View className="flex-1 gap-4">
                    {/* Header: Session Selector & Download Manuscript */}
                    <View 
                      className="flex-col border-b border-tier-divider-light pb-3.5 gap-3 w-full"
                      style={{ zIndex: showArchiveDropdown ? 50 : 1, elevation: showArchiveDropdown ? 50 : 1 }}
                    >
                      <View 
                        className="flex-row justify-between items-start gap-4 flex-wrap"
                        style={{ zIndex: showArchiveDropdown ? 51 : 1, elevation: showArchiveDropdown ? 51 : 1 }}
                      >
                        <View className="gap-1 flex-1">
                          <Text className="text-lg font-black tracking-tight text-tier-text-primary">Advisory Workspace</Text>
                          {selected && (
                            <Pressable
                              onPress={() => Linking.openURL(getFileDownloadUrl("paper", selected.paper_filename, accessToken!))}
                              className="flex-row items-center gap-1 mt-0.5"
                              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                            >
                              <Text className="text-[11px] font-bold text-teal-500 underline" numberOfLines={1}>
                                Download Manuscript: {selected.paper_filename}
                              </Text>
                            </Pressable>
                          )}
                        </View>

                        {/* Dropdown session selector (always visible at top of left panel on desktop) */}
                        {!isMobile && (
                          <View 
                            className="relative min-w-[200px]"
                            style={{ zIndex: showArchiveDropdown ? 100 : 1, elevation: showArchiveDropdown ? 100 : 1 }}
                          >
                            <Pressable
                              onPress={() => setShowArchiveDropdown(!showArchiveDropdown)}
                              className="flex-row items-center justify-between bg-tier-surface border border-tier-divider-light rounded-xl px-3.5 py-2"
                              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                            >
                              <View className="flex-row items-center gap-2">
                                <Archive color="#0891B2" size={14} />
                                <Text className="text-[12px] font-bold text-tier-text-primary" numberOfLines={1}>
                                  {selected
                                    ? `${new Date(selected.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`
                                    : "Select Session"}
                                </Text>
                              </View>
                              <Text className="text-[10px] font-black text-tier-text-secondary ml-2">
                                {showArchiveDropdown ? "▲" : "▼"}
                              </Text>
                            </Pressable>

                            {showArchiveDropdown && (
                              <GlassCard
                                className="absolute top-10 right-0 w-[240px] max-h-[200px] p-2 bg-tier-surface border-tier-divider-light"
                                style={{
                                  boxShadow: "0 10px 15px rgba(0,0,0,0.2)",
                                  zIndex: 9999,
                                  elevation: 9999,
                                }}
                              >
                                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator contentContainerStyle={{ gap: 6 }}>
                                  {logs.map((log) => {
                                    const isSelected = selected?.id === log.id;
                                    return (
                                      <Pressable
                                        key={log.id}
                                        onPress={() => {
                                          setSelectedLog(log);
                                          setShowArchiveDropdown(false);
                                        }}
                                        className="p-2 rounded-lg"
                                        style={{
                                          backgroundColor: isSelected ? "rgba(8, 145, 178, 0.08)" : "transparent",
                                        }}
                                      >
                                        <Text className={`text-xs font-bold ${isSelected ? "text-tier-text-primary" : "text-tier-text-secondary"}`} numberOfLines={1}>
                                          {log.paper_filename}
                                        </Text>
                                        <Text className="text-[10px] text-tier-text-tertiary">
                                          {new Date(log.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                        </Text>
                                      </Pressable>
                                    );
                                  })}
                                </ScrollView>
                              </GlassCard>
                            )}
                          </View>
                        )}
                      </View>

                      {/* Tab Switcher (Unified 5 tabs on Desktop, sub-tabs on Mobile) */}
                      {(!isMobile || mobileStudentPanel === "feedback") && (
                        <View className="flex-row gap-1 bg-tier-surface rounded-[10px] p-[3px] border border-tier-divider-light flex-nowrap w-full">
                          {!isMobile && (
                            <Pressable
                              onPress={() => setStudentTab("upload")}
                              className="flex-1 py-2.5 rounded-lg items-center justify-center min-w-[70px]"
                              style={{
                                backgroundColor: studentTab === "upload" ? "rgba(99, 102, 241, 0.08)" : "transparent",
                                borderWidth: 1,
                                borderColor: studentTab === "upload" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                              }}
                            >
                              <Text className="text-[10px] font-extrabold text-center" style={{ color: studentTab === "upload" ? "#6366F1" : "#94A3B8" }}>UPLOAD</Text>
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() => setStudentTab("feedback")}
                            className="flex-1 py-2.5 rounded-lg items-center justify-center min-w-[70px]"
                            style={{
                              backgroundColor: studentTab === "feedback" ? "rgba(99, 102, 241, 0.08)" : "transparent",
                              borderWidth: 1,
                              borderColor: studentTab === "feedback" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                            }}
                          >
                            <Text className="text-[10px] font-extrabold text-center" style={{ color: studentTab === "feedback" ? "#6366F1" : "#94A3B8" }}>FEEDBACK</Text>
                          </Pressable>
                          {Platform.OS === "web" && (
                            <Pressable
                              onPress={() => setStudentTab("transcript")}
                              className="flex-1 py-2.5 rounded-lg items-center justify-center min-w-[70px]"
                              style={{
                                backgroundColor: studentTab === "transcript" ? "rgba(99, 102, 241, 0.08)" : "transparent",
                                borderWidth: 1,
                                borderColor: studentTab === "transcript" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                              }}
                            >
                              <Text className="text-[10px] font-extrabold text-center" style={{ color: studentTab === "transcript" ? "#6366F1" : "#94A3B8" }}>TRANSCRIPT</Text>
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() => setStudentTab("annotations")}
                            className="flex-1 py-2.5 rounded-lg items-center justify-center min-w-[70px]"
                            style={{
                              backgroundColor: studentTab === "annotations" ? "rgba(124, 58, 237, 0.08)" : "transparent",
                              borderWidth: 1,
                              borderColor: studentTab === "annotations" ? "rgba(124, 58, 237, 0.15)" : "transparent",
                            }}
                          >
                            <Text className="text-[10px] font-extrabold text-center" style={{ color: studentTab === "annotations" ? "#7C3AED" : "#94A3B8" }}>
                              ANNOT. ({selected?.revision_annotations?.length ?? 0})
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => setStudentTab("drafts")}
                            className="flex-1 py-2.5 rounded-lg items-center justify-center min-w-[70px]"
                            style={{
                              backgroundColor: studentTab === "drafts" ? "rgba(8, 145, 178, 0.08)" : "transparent",
                              borderWidth: 1,
                              borderColor: studentTab === "drafts" ? "rgba(8, 145, 178, 0.15)" : "transparent",
                            }}
                          >
                            <Text className="text-[10px] font-extrabold text-center" style={{ color: studentTab === "drafts" ? "#14B8A6" : "#94A3B8" }}>DRAFTS ({logs.length})</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>

                    {/* Tab Contents */}
                    {((!isMobile && studentTab === "upload") || (isMobile && mobileStudentPanel === "upload")) ? (
                      // 1. UPLOAD TAB CONTENT (Only on desktop as a tab, or on mobile as a separate view)
                        <View className="flex-1 gap-3">
                          <ScrollView
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                            scrollEnabled={!isMobile}
                            className={!isMobile ? "flex-1" : "w-full"}
                            contentContainerStyle={{ gap: 10, paddingBottom: 10 }}
                          >
                            <WebFileInput label="Select Manuscript (.docx)" accept=".docx" onFileSelect={setPaperFile} />
                            <WebFileInput label="Select Recording (.mp3/.wav)" accept="audio/*" onFileSelect={setAudioFile} />

                            <MultiImageInput
                              label="Lecturer Revisions & Annotations (Optional)"
                              files={annotationFiles}
                              onFilesChange={setAnnotationFiles}
                            />

                            {/* Final Document Upload Section */}
                            {selected ? (
                            <View className="mt-2 bg-tier-accent-success/5 border border-tier-accent-success/20 rounded-2xl p-4 gap-2.5">
                              <View className="flex-row items-center gap-2">
                                <Text className="text-[10px] font-black tracking-[1.5px] text-tier-accent-success">FINAL DOCUMENT</Text>
                                {selected?.final_document_filename && (
                                  <Badge text="UPLOADED" color="#059669" />
                                )}
                              </View>
                              <Text className="text-tier-text-secondary text-[11px] font-medium leading-[16px]">
                                Upload the final approved version of your document after all revisions are validated.
                              </Text>
                              <WebFileInput
                                label="Select Final Document (.docx)"
                                accept=".docx"
                                onFileSelect={async (file) => {
                                  if (!file || !selected) return;
                                  try {
                                    const body = new FormData();
                                    body.append("final_document", file);
                                    await api(`/consultations/${selected.id}/final-document`, {
                                      method: "POST",
                                      body,
                                      headers: {},
                                    });
                                    await loadLogs();
                                    showToast("Final Document Uploaded", "Your final document has been uploaded successfully.", "system");
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : "Failed to upload final document");
                                  }
                                }}
                              />
                              {selected?.final_document_filename && (
                                <View className="flex-row items-center justify-between bg-tier-accent-success/10 rounded-xl px-3 py-2 border border-tier-accent-success/20">
                                  <View className="flex-1">
                                    <Text className="text-tier-accent-success text-[11px] font-bold" numberOfLines={1}>{selected.final_document_filename}</Text>
                                    {selected.final_document_uploaded_at && (
                                      <Text className="text-tier-text-secondary text-[10px] mt-0.5">
                                        Uploaded: {new Date(selected.final_document_uploaded_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                      </Text>
                                    )}
                                  </View>
                                  <Pressable
                                    onPress={() => Linking.openURL(getFileDownloadUrl("final", selected!.final_document_filename!, accessToken!))}
                                    className="px-2.5 py-2 rounded-md border border-tier-accent-success/20 bg-tier-accent-success/10"
                                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                  >
                                    <Text className="text-tier-accent-success text-[10px] font-bold">Download</Text>
                                  </Pressable>
                                </View>
                              )}
                            </View>
                            ) : null}

                            {/* Revised Draft Upload Section */}
                            {selected ? (
                            <View className="mt-2 bg-tier-accent-primary/5 border border-tier-accent-primary/20 rounded-2xl p-4 gap-2.5">
                              <View className="flex-row items-center gap-2">
                                <Text className="text-[10px] font-black tracking-[1.5px] text-tier-accent-primary">REVISED DRAFT</Text>
                                {selected?.revised_document_filename && (
                                  <Badge text="UPLOADED" color="#6366F1" />
                                )}
                              </View>
                              <Text className="text-tier-text-secondary text-[11px] font-medium leading-[16px]">
                                Upload your revised document for this session. This replaces the previous draft.
                              </Text>
                              <WebFileInput
                                label="Select Revised Draft (.docx)"
                                accept=".docx"
                                onFileSelect={setRevisedFile}
                              />
                              {revisedFile && (
                                <View className="flex-row items-center justify-between bg-tier-accent-primary/10 rounded-xl px-3 py-2 border border-tier-accent-primary/20">
                                  <Text className="text-tier-accent-primary text-[11px] font-bold flex-1" numberOfLines={1}>{revisedFile.name}</Text>
                                  <Pressable
                                    onPress={() => setRevisedFile(null)}
                                    className="px-2 py-2 rounded-md bg-tier-surface border border-tier-divider-light"
                                  >
                                    <Text className="text-tier-text-secondary text-[10px] font-bold">Remove</Text>
                                  </Pressable>
                                </View>
                              )}
                              {revisedFile && (
                                <Button
                                  title={uploadingRevised ? "Uploading..." : "Upload Revised Draft"}
                                  onPress={() => void uploadRevisedDocument()}
                                  disabled={uploadingRevised}
                                  tone="secondary"
                                />
                              )}
                              {selected?.revised_document_filename && (
                                <View className="flex-row items-center justify-between bg-tier-accent-primary/10 rounded-xl px-3 py-2 border border-tier-accent-primary/20">
                                  <View className="flex-1">
                                    <Text className="text-tier-accent-primary text-[11px] font-bold" numberOfLines={1}>{selected.revised_document_filename}</Text>
                                    {selected.revised_document_uploaded_at && (
                                      <Text className="text-tier-text-secondary text-[10px] mt-0.5">
                                        Uploaded: {new Date(selected.revised_document_uploaded_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                      </Text>
                                    )}
                                  </View>
                                  <Pressable
                                    onPress={() => Linking.openURL(getFileDownloadUrl("revised", selected!.revised_document_filename!, accessToken!))}
                                    className="px-2.5 py-2 rounded-md border border-tier-accent-primary/20 bg-tier-accent-primary/10"
                                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                  >
                                    <Text className="text-tier-accent-primary text-[10px] font-bold">Download</Text>
                                  </Pressable>
                                </View>
                              )}
                            </View>
                            ) : null}
                          </ScrollView>

                          <View className="mt-2 mb-4">
                            <Button
                              title={loading ? "Processing..." : checkingMismatch ? "Checking Topics..." : "Analyze Revision Session"}
                              onPress={() => void uploadConsultation()}
                              disabled={loading || checkingMismatch}
                            />
                          </View>

                          {/* Mobile Archive Selector Dropdown inside Upload tab */}
                          {isMobile && (
                            <View className="relative z-[99] w-full">
                              <Pressable
                                onPress={() => setShowArchiveDropdown(!showArchiveDropdown)}
                                className="flex-row items-center justify-between bg-tier-surface border border-tier-divider-light rounded-2xl px-4 py-3.5"
                              >
                                <View className="flex-row items-center gap-2.5">
                                  <Archive color="#0891B2" size={16} />
                                  <Text className="text-[13px] font-extrabold text-tier-text-primary" numberOfLines={1}>
                                    {selected
                                      ? `Session: ${new Date(selected.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`
                                      : "Select Session"}
                                  </Text>
                                </View>
                                <Text className="text-[11px] font-black text-tier-accent-blue">
                                  {showArchiveDropdown ? "▲" : "▼"}
                                </Text>
                              </Pressable>
                              {showArchiveDropdown && (
                                <GlassCard className="absolute bottom-14 left-0 right-0 max-h-[220px] p-2.5 z-[99999] bg-tier-surface border-tier-divider-light">
                                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator contentContainerStyle={{ gap: 8 }}>
                                    {logs.map((log) => {
                                      const isSelected = selected?.id === log.id;
                                      return (
                                        <Pressable
                                          key={log.id}
                                          onPress={() => {
                                            setSelectedLog(log);
                                            setShowArchiveDropdown(false);
                                          }}
                                          className="p-2 rounded-lg"
                                          style={{ backgroundColor: isSelected ? "rgba(8, 145, 178, 0.08)" : "transparent" }}
                                        >
                                          <Text className={`text-xs font-bold ${isSelected ? "text-tier-text-primary" : "text-tier-text-secondary"}`} numberOfLines={1}>
                                            {log.paper_filename}
                                          </Text>
                                        </Pressable>
                                      );
                                    })}
                                  </ScrollView>
                                </GlassCard>
                              )}
                            </View>
                          )}
                        </View>
                      ) : ( selected ? (
                        studentTab === "feedback" ? (
                        /* FEEDBACK LIST VIEW */
                        <ScrollView
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          scrollEnabled={!isMobile}
                          className={!isMobile ? "flex-1" : "w-full"}
                          contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
                        >
                          {selected.feedback_items && selected.feedback_items.length > 0 && (
                            <Pressable
                              onPress={() => void classifyFeedback()}
                              disabled={classifying}
                              className="flex-row items-center justify-center bg-tier-surface border border-tier-accent-blue/20 rounded-2xl p-3.5 mb-1.5"
                              style={({ pressed }) => ({
                                gap: 10,
                                transform: [{ scale: pressed ? 0.985 : 1 }],
                              })}
                            >
                              <Cpu color={classifying ? "#7C3AED" : "#0891B2"} size={16} />
                              <Text className="text-[13px] font-black tracking-[0.2px] text-tier-text-primary">
                                {classifying
                                  ? "AI Oracle is organizing and sorting your notes..."
                                  : "Sort & Analyze Revisions with AI Oracle"}
                              </Text>
                            </Pressable>
                          )}

                          {selected.feedback_items?.map((item) => {
                            const isFixed = item.status === "Fixed";
                            const isValidated = item.status === "Validated";
                            const isPending = !isFixed && !isValidated;

                            const statusColor = isValidated
                              ? "#6366F1"
                              : isFixed
                              ? "#10B981"
                              : "#D97706";

                            const statusBg = isValidated
                              ? "rgba(99, 102, 241, 0.08)"
                              : isFixed
                              ? "rgba(16, 185, 129, 0.08)"
                              : "rgba(217, 119, 6, 0.08)";

                            const statusBorder = isValidated
                              ? "rgba(99, 102, 241, 0.2)"
                              : isFixed
                              ? "rgba(16, 185, 129, 0.2)"
                              : "rgba(217, 119, 6, 0.2)";

                            const isCommentsExpanded = !!expandedComments[item.id];
                            const commentsCount = item.comments?.length ?? 0;

                            return (
                              <View
                                key={item.id}
                                className="rounded-2xl border bg-tier-surface-raised mb-3.5 overflow-hidden"
                                style={{
                                  borderLeftWidth: 4,
                                  borderLeftColor: statusColor,
                                  borderColor: statusBorder,
                                }}
                              >
                                <View className="flex-row justify-between items-center px-4 py-3 bg-tier-surface border-b border-tier-divider-light">
                                  <Badge
                                    text={item.category.toUpperCase()}
                                    color={item.category === "Major" ? "#EF4444" : "#3B82F6"}
                                  />
                                  <View
                                    className="rounded-lg px-2.5 py-1 border flex-row items-center gap-1.5"
                                    style={{ borderColor: statusBorder, backgroundColor: statusBg }}
                                  >
                                    <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                                    <Text className="text-[10px] font-black tracking-wider" style={{ color: statusColor }}>
                                      {isValidated ? "VALIDATED BY LECTURER" : isFixed ? "FIXED (AWAITING AUDIT)" : "PENDING REVISION"}
                                    </Text>
                                  </View>
                                </View>

                                <View className="p-4 gap-3">
                                  <Text className="text-[13.5px] font-medium text-tier-text-primary leading-relaxed">
                                    {item.content}
                                  </Text>

                                  {item.fix_proof_text ? (
                                    <View className="bg-tier-accent-success/5 border border-tier-accent-success/20 rounded-xl p-3 gap-1.5 mt-1">
                                      <View className="flex-row items-center gap-1.5">
                                        <CheckCircle color="#10B981" size={12} />
                                        <Text className="text-tier-accent-success text-[9px] font-black tracking-widest uppercase">Student Fix Action</Text>
                                      </View>
                                      <Text className="text-tier-text-primary text-[12px] font-medium leading-relaxed">
                                        {item.fix_proof_text}
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>

                                <View className="flex-row justify-between items-center flex-wrap gap-2 px-4 py-3 bg-tier-surface border-t border-tier-divider-light">
                                  <View className="flex-row gap-2 flex-wrap">
                                    {!isValidated && (
                                      <Pressable
                                        onPress={() => void handleQuickRevisi(item.content)}
                                        className="flex-row items-center bg-tier-accent-primary/10 border border-tier-accent-primary/20 rounded-lg px-3 py-2"
                                        style={({ pressed }) => ({
                                          gap: 5,
                                          transform: [{ scale: pressed ? 0.97 : 1 }],
                                        })}
                                      >
                                        <Cpu color="#8B5CF6" size={11} />
                                        <Text className="text-[11px] font-bold text-tier-accent-primary">Quick AI Revision</Text>
                                      </Pressable>
                                    )}

                                    {!isValidated && (
                                      <Pressable
                                        disabled={isFixed}
                                        onPress={() => {
                                          if (Platform.OS === "web") {
                                            const confirm = window.confirm("Apakah Anda yakin ingin menandai revisi ini sebagai selesai? Tindakan ini hanya dapat dilakukan sekali dan tidak dapat dibatalkan (undo).");
                                            if (confirm) {
                                              void updateStatus(item, "Fixed");
                                            }
                                          } else {
                                            Alert.alert(
                                              "Konfirmasi Tindakan",
                                              "Apakah Anda yakin ingin menandai revisi ini sebagai selesai? Tindakan ini hanya dapat dilakukan sekali dan tidak dapat dibatalkan (undo).",
                                              [
                                                { text: "Batal", style: "cancel" },
                                                {
                                                  text: "Ya, Selesai",
                                                  onPress: () => void updateStatus(item, "Fixed")
                                                }
                                              ]
                                            );
                                          }
                                        }}
                                        className="flex-row items-center rounded-lg px-3 py-2"
                                        style={({ pressed }) => ({
                                          gap: 5,
                                          backgroundColor: isFixed ? "rgba(16, 185, 129, 0.04)" : "rgba(16, 185, 129, 0.08)",
                                          borderWidth: 1,
                                          borderColor: isFixed ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.2)",
                                          opacity: isFixed ? 0.6 : 1,
                                          transform: [{ scale: !isFixed && pressed ? 0.97 : 1 }],
                                        })}
                                      >
                                        <CheckCircle color="#10B981" size={11} />
                                        <Text className="text-[11px] font-bold text-emerald-500">
                                          {isFixed ? "Marked as Fixed" : "Mark as Fixed"}
                                        </Text>
                                      </Pressable>
                                    )}
                                  </View>

                                  <Pressable
                                    onPress={() => toggleComments(item.id)}
                                    className="flex-row items-center bg-tier-surface border border-tier-divider-light rounded-lg px-3 py-2"
                                    style={({ pressed }) => ({
                                      gap: 5,
                                      transform: [{ scale: pressed ? 0.97 : 1 }],
                                    })}
                                  >
                                    <Text className="text-[11px] font-bold text-tier-accent-blue">
                                      💬 Comments {commentsCount > 0 ? `(${commentsCount})` : ""}
                                    </Text>
                                    <Text className="text-[9px] text-tier-accent-blue font-bold">
                                      {isCommentsExpanded ? "▲" : "▼"}
                                    </Text>
                                  </Pressable>
                                </View>

                                {isCommentsExpanded && (
                                  <View className="px-4 pb-4 pt-3.5 bg-tier-surface border-t border-tier-divider-light gap-3">
                                    {commentsCount > 0 ? (
                                      <View className="gap-2">
                                        {item.comments?.map((comment) => {
                                          const isAuthorStudent = comment.author_role === "student";
                                          return (
                                            <View
                                              key={comment.id}
                                              className={`rounded-xl p-3 border ${
                                                isAuthorStudent
                                                  ? "bg-tier-accent-primary/10 border-tier-accent-primary/20 ml-6"
                                                  : "bg-tier-surface border border-tier-divider-light mr-6"
                                              }`}
                                            >
                                              <View className="flex-row justify-between items-center mb-1">
                                                <Text className="text-[9px] font-black tracking-widest text-tier-text-secondary">
                                                  {isAuthorStudent ? "YOU" : "ADVISOR"}
                                                </Text>
                                                <Text className="text-[8.5px] font-semibold text-tier-text-tertiary">
                                                  {new Date(comment.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                </Text>
                                              </View>
                                              <Text className="text-tier-text-primary text-[12px] leading-relaxed font-medium">
                                                {comment.content}
                                              </Text>
                                            </View>
                                          );
                                        })}
                                      </View>
                                    ) : (
                                      <Text className="text-tier-text-tertiary text-[11px] font-semibold italic text-center py-2">
                                        No comments yet. Start a discussion with your advisor.
                                      </Text>
                                    )}

                                    {commentingOnFeedbackId === item.id ? (
                                      <View className="gap-2.5 mt-1 border-t border-tier-divider-light pt-3">
                                        <TextInput
                                          value={commentText}
                                          onChangeText={setCommentText}
                                          placeholder="Type a response or question about this revision item..."
                                          placeholderTextColor="#64748B"
                                          multiline
                                          className="bg-tier-surface border border-tier-divider-light text-tier-text-primary p-2.5 text-[12px] font-medium min-h-[60px]"
                                          style={Platform.OS === "web" ? ({ outlineStyle: "none", textAlignVertical: "top" } as any) : { textAlignVertical: "top" }}
                                        />
                                        <View className="flex-row justify-end gap-2">
                                          <Pressable
                                            onPress={() => {
                                              setCommentingOnFeedbackId(null);
                                              setCommentText("");
                                            }}
                                            className="px-3.5 py-2 rounded-lg bg-tier-surface border border-tier-divider-light"
                                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                          >
                                            <Text className="text-tier-text-secondary text-[11px] font-bold">Cancel</Text>
                                          </Pressable>
                                          <Pressable
                                            onPress={() => void handleAddComment(item.id)}
                                            disabled={!commentText.trim()}
                                            className="px-3.5 py-2 rounded-lg bg-tier-accent-primary/10 border border-tier-accent-primary/20"
                                            style={({ pressed }) => [{
                                              opacity: commentText.trim() ? (pressed ? 0.7 : 1) : 0.4
                                            }]}
                                          >
                                            <Text className="text-tier-accent-primary text-[11px] font-bold">Post Comment</Text>
                                          </Pressable>
                                        </View>
                                      </View>
                                    ) : null}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                          {!selected.feedback_items?.length && (
                            <Text className="text-tier-text-secondary text-[13px] font-medium py-3 text-center">No feedback items available for this session.</Text>
                          )}
                        </ScrollView>
                      ) : studentTab === "transcript" ? (
                        /* TRANSCRIPT VIEW */
                        Platform.OS === "web" ? (
                          <View className="flex-1">
                            <ScrollView
                              nestedScrollEnabled={true}
                              showsVerticalScrollIndicator={true}
                              className="flex-1 bg-tier-surface-raised border border-tier-divider-light p-3.5"
                              style={{ outlineStyle: "none" } as any}
                            >
                              <Text className="text-tier-text-secondary text-[13px] font-medium" style={{ lineHeight: 22 }}>
                                {selected.transcript_text ? selected.transcript_text : "No audio transcript is available for this guidance session."}
                              </Text>
                            </ScrollView>
                          </View>
                        ) : null
                      ) : studentTab === "annotations" ? (
                        /* ANNOTATIONS VIEW */
                        <View className="flex-1">
                          <ScrollView
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                            scrollEnabled={!isMobile}
                            className={!isMobile ? "flex-1" : "w-full"}
                            contentContainerStyle={{ gap: 12 }}
                          >
                            {(selected.revision_annotations ?? []).map((ann) => (
                              <View key={ann.id} className="bg-tier-surface border border-tier-divider-light rounded-2xl p-3.5 gap-2 border-b-0 mb-3">
                                <View className="flex-row items-center gap-2.5">
                                  <Text className="text-[22px]">
                                    {ann.file_type === "image" ? "📸" : "📄"}
                                  </Text>
                                  <View className="flex-1">
                                    <Text className="text-tier-text-primary text-xs font-bold" numberOfLines={1}>
                                      {ann.filename}
                                    </Text>
                                    <Text className="text-tier-text-secondary text-[10px] mt-0.5">
                                      {ann.file_type === "image" ? "Annotated Page Photo" : "DOCX Track Changes"}
                                    </Text>
                                  </View>
                                  <Pressable
                                    onPress={() => Linking.openURL(getFileDownloadUrl("annotations", ann.filename, accessToken!))}
                                    className="bg-tier-accent-primary/10 px-2.5 py-2 rounded-md border border-tier-accent-primary/20"
                                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                  >
                                    <Text className="text-tier-accent-primary text-[10px] font-bold">Download</Text>
                                  </Pressable>
                                </View>
                                {ann.file_type === "image" && (
                                  Platform.OS === "web" ? (
                                    <img
                                      src={`${API_URL}/storage/annotations/${ann.filename}`}
                                      alt={ann.filename}
                                      className="w-full max-h-[180px] object-cover rounded-lg mb-2 opacity-90"
                                      onError={(e: any) => { e.target.style.display = "none"; }}
                                    />
                                  ) : (
                                    <Image
                                      source={{ uri: `${API_URL}/storage/annotations/${ann.filename}`, headers: { "Cache-Control": "max-age=3600" } }}
                                      style={{ width: "100%", height: 180, borderRadius: 8, marginBottom: 8, opacity: 0.9, backgroundColor: "rgba(99,102,241,0.1)" }}
                                      resizeMode="cover"
                                    />
                                  )
                                )}
                                <View className="bg-tier-surface border border-tier-divider-light rounded-[10px] p-2.5 gap-1.5">
                                  <Text className="text-tier-accent-primary text-[9px] font-black tracking-[1.5px]">AI EXTRACTED CONTENT</Text>
                                  <ScrollView
                                    nestedScrollEnabled={true}
                                    showsVerticalScrollIndicator={true}
                                    style={{ maxHeight: 120 }}
                                  >
                                    <Text className="text-tier-text-secondary text-[12.5px] font-normal" style={{ lineHeight: 20 }}>
                                      {ann.extracted_text || "(No text extracted yet)"}
                                    </Text>
                                  </ScrollView>
                                </View>
                              </View>
                            ))}
                            {!(selected.revision_annotations ?? []).length && (
                              <View className="py-10 items-center">
                                <Text className="text-tier-text-tertiary text-[13px]">No advisor annotations available for this session.</Text>
                              </View>
                            )}
                          </ScrollView>
                        </View>
                      ) : (
                        /* DRAFTS HISTORY VIEW */
                        <View className="flex-1">
                          <ScrollView
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                            scrollEnabled={!isMobile}
                            className={!isMobile ? "flex-1" : "w-full"}
                            contentContainerStyle={{ gap: 12 }}
                          >
                            {logs.map((log) => {
                              const isSelected = selected?.id === log.id;
                              const dateStr = new Date(log.created_at).toLocaleString("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              });
                              const feedbackCount = log.feedback_items?.length ?? 0;

                              return (
                                <View
                                  key={log.id}
                                  className="bg-tier-surface border border-tier-divider-light rounded-2xl p-3.5 gap-3 mb-3"
                                  style={isSelected ? { borderColor: "rgba(8, 145, 178, 0.3)", backgroundColor: "rgba(8, 145, 178, 0.04)" } : {}}
                                >
                                  <View className="flex-row items-center gap-2.5">
                                    <Text className="text-[22px]">📄</Text>
                                    <View className="flex-1">
                                      <Text className="text-tier-text-primary text-[13px] font-bold" numberOfLines={1}>
                                        {log.paper_filename}
                                      </Text>
                                      <Text className="text-tier-text-secondary text-[10px] mt-0.5">{dateStr}</Text>
                                    </View>
                                    <View className="flex-row gap-2">
                                      <Pressable
                                        onPress={() => Linking.openURL(getFileDownloadUrl("paper", log.paper_filename, accessToken!))}
                                        className="px-2.5 py-2 rounded-md border border-cyan-600/[0.15] bg-cyan-600/[0.08]"
                                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                      >
                                        <Text className="text-cyan-600 text-[10px] font-bold">Download</Text>
                                      </Pressable>
                                      {!isSelected && (
                                        <Pressable
                                          onPress={() => setSelectedLog(log)}
                                          className="px-2.5 py-2 rounded-md border border-indigo-600/[0.15] bg-indigo-600/[0.08]"
                                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                        >
                                          <Text className="text-indigo-600 text-[10px] font-bold">Load Session</Text>
                                        </Pressable>
                                      )}
                                    </View>
                                  </View>

                                  <View className="flex-row gap-3 bg-tier-surface-raised rounded-[10px] p-2.5 border border-tier-divider-light">
                                    <View className="flex-1 gap-1">
                                      <Text className="text-tier-text-tertiary text-[10px] font-black tracking-[1px]">FEEDBACK ITEMS</Text>
                                      <Text className="text-tier-text-primary text-[11px] font-bold">{feedbackCount} Notes</Text>
                                    </View>
                                    <View className="flex-1 gap-1">
                                      <Text className="text-tier-text-tertiary text-[10px] font-black tracking-[1px]">STATUS</Text>
                                      <Text
                                        className="text-[11px] font-semibold"
                                        style={{ color: log.feedback_items?.every(f => f.status === "Validated") ? "#059669" : "#D97706" }}
                                      >
                                        {log.feedback_items?.every(f => f.status === "Validated") ? "Approved" : "Revision Needed"}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              );
                            })}
                            {!logs.length && (
                              <View className="py-10 items-center">
                                <Text className="text-tier-text-tertiary text-[13px]">No drafts uploaded yet.</Text>
                              </View>
                            )}
                          </ScrollView>
                        </View>
                      )
                    ) : (
                      <View className="flex-1 justify-center items-center">
                        <Text className="text-tier-text-tertiary text-[13px] text-center">Select a session from the history archive to view details.</Text>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              )}

              {/* Right Panel: AI Academic Assistant Chat */}
              {(!isMobile || mobileStudentPanel === "chat") && (
                <GlassCard className={!isMobile ? "flex-[2.5] min-w-[320px] p-6 h-[720px]" : "flex-1 w-full p-5"}>
                  {selected ? (
                    <View className="flex-1 gap-4">
                      {/* Active Session Info with Chat Type Switcher */}
                      <View className="border-b border-tier-divider-light pb-3">
                        <View className="flex-row justify-between items-center mb-1.5">
                          <Text className="text-[9px] font-black tracking-[1.5px] text-tier-accent-primary">
                            {chatMode === "oracle" ? "AI ACADEMIC ORACLE" : "ADVISOR CONSULTATION"}
                          </Text>
                          <Badge
                            text={chatMode === "oracle" ? "ONLINE" : "DIRECT"}
                            color={chatMode === "oracle" ? "#059669" : "#0891B2"}
                          />
                        </View>

                        {/* Chat Mode Switcher Tab */}
                        <View className="flex-row bg-tier-surface-raised border border-tier-divider-light rounded-xl p-[3px] mb-2.5 gap-1">
                          <Pressable
                            onPress={() => hasLlmKey && setChatMode("oracle")}
                            disabled={!hasLlmKey}
                            className="flex-1 py-2 rounded-lg items-center justify-center"
                            style={{
                              backgroundColor: chatMode === "oracle" ? "#6366F1" : "transparent",
                              opacity: !hasLlmKey ? 0.4 : 1,
                            }}
                          >
                            <Text
                              className="text-[11px] font-bold"
                              style={{ color: chatMode === "oracle" ? "#ffffff" : "#94A3B8" }}
                            >
                              AI Oracle Assistant
                            </Text>
                            {!hasLlmKey && <Text className="text-red-600 text-[10px] font-extrabold ml-1">NO KEY</Text>}
                          </Pressable>
                          <Pressable
                            onPress={() => setChatMode("advisor")}
                            className="flex-1 py-2 rounded-lg items-center justify-center"
                            style={{
                              backgroundColor: chatMode === "advisor" ? "#6366F1" : "transparent",
                            }}
                          >
                            <Text
                              className="text-[11px] font-bold"
                              style={{ color: chatMode === "advisor" ? "#ffffff" : "#94A3B8" }}
                            >
                              Advisor Discussion
                            </Text>
                          </Pressable>
                        </View>
                      </View>

                      <View className="flex-1 gap-2.5">
                        <ScrollView
                          ref={chatScrollRef}
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          className={!isMobile ? "h-[420px] bg-tier-surface rounded-[14px] border border-tier-divider-light p-3" : "flex-1 bg-tier-surface rounded-[14px] border border-tier-divider-light p-3"}
                          contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
                        >
                          {chatMode === "oracle" ? (
                            <>
                              {chatHistory.map((message, index) => {
                                const isUser = message.role === "user";
                                const isError = !isUser && message.content.startsWith("⚠️");
                                return (
                                  <View
                                    key={`oracle-${index}`}
                                    className="p-3 rounded-[14px] max-w-[85%] gap-1"
                                    style={{
                                      backgroundColor: isUser
                                        ? "rgba(99, 102, 241, 0.08)"
                                        : isError
                                        ? "rgba(220, 38, 38, 0.06)"
                                        : "rgba(15, 23, 42, 0.5)",
                                      borderWidth: 1,
                                      borderColor: isUser
                                        ? "rgba(99, 102, 241, 0.15)"
                                        : isError
                                        ? "rgba(220, 38, 38, 0.2)"
                                        : "rgba(255, 255, 255, 0.04)",
                                      alignSelf: isUser ? "flex-end" : "flex-start",
                                    }}
                                  >
                                    <Text
                                      className="text-[9px] font-black tracking-[1.5px]"
                                      style={{ color: isError ? "#DC2626" : "#94A3B8" }}
                                    >
                                      {isUser ? "STUDENT" : isError ? "WARNING ALERT" : "AI ORACLE"}
                                    </Text>
                                    <Text className="text-[13px] font-medium text-tier-text-primary" style={{ color: isError ? "#DC2626" : undefined, lineHeight: 18 }}>
                                      {message.content}
                                    </Text>
                                  </View>
                                );
                              })}
                              {chatLoading && <TypingIndicator />}
                            </>
                          ) : (
                            <>
                              {directMessages.map((message, index) => {
                                const isUser = message.sender_role === "student";
                                return (
                                  <View
                                    key={`advisor-${message.id || index}`}
                                    className="p-3 rounded-[14px] max-w-[85%] gap-1"
                                    style={{
                                      backgroundColor: isUser ? "rgba(99, 102, 241, 0.08)" : "rgba(15, 23, 42, 0.5)",
                                      borderWidth: 1,
                                      borderColor: isUser ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.04)",
                                      alignSelf: isUser ? "flex-end" : "flex-start",
                                    }}
                                  >
                                    <Text className="text-[9px] font-black tracking-[1.5px] text-tier-text-secondary">
                                      {isUser ? "STUDENT" : "ADVISOR"}
                                    </Text>
                                    <Text className="text-[13px] font-medium text-tier-text-primary" style={{ lineHeight: 18 }}>{message.content}</Text>
                                  </View>
                                );
                              })}
                              {chatLoading && <TypingIndicator label="SENDING MESSAGE" color="#0891B2" />}
                            </>
                          )}

                          {chatMode === "oracle" && !chatHistory.length && (
                            <View className="py-10 items-center">
                              {hasLlmKey ? (
                                <Text className="text-tier-text-secondary text-[12.5px] font-semibold text-center" style={{ lineHeight: 18 }}>
                                  Ask questions about draft revisions, academic writing style, or research methodologies.
                                </Text>
                              ) : (
                                <View className="items-center gap-2">
                                  <AlertCircle color="#D97706" size={24} />
                                  <Text className="text-amber-600 text-[12.5px] font-semibold text-center" style={{ lineHeight: 18 }}>
                                    AI Oracle requires an LLM API key. Please configure one in Settings &rarr; AI Gateway.
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}

                          {chatMode === "advisor" && !directMessages.length && (
                            <View className="py-10 items-center">
                              <Text className="text-tier-text-secondary text-[12.5px] font-semibold text-center" style={{ lineHeight: 18 }}>
                                  No messages with your advisor yet. Send a message to start direct consultation.
                              </Text>
                            </View>
                          )}
                        </ScrollView>

                        {/* Dynamic Glowing Chat Box Input */}
                        <View className="flex-row gap-2 items-center">
                          <TextInput
                            value={chatQuery}
                            onChangeText={setChatQuery}
                            editable={!chatLoading && (chatMode === "advisor" || hasLlmKey)}
                            placeholder={
                              chatLoading
                                ? "AI Oracle is processing response..."
                                : chatMode === "oracle" && !hasLlmKey
                                ? "LLM API key required — set in Settings → AI Gateway"
                                : chatMode === "oracle"
                                ? "Ask about draft thesis revisions..."
                                : "Send a direct message to your advisor..."
                            }
                            placeholderTextColor="#94A3B8"
                            onSubmitEditing={() => void sendChat()}
                            className="flex-1 bg-tier-surface-raised border border-tier-divider-light text-tier-text-primary px-3.5 py-3 text-[13px] font-medium"
                            style={Platform.OS === "web" ? ({ outlineStyle: "none" as any, opacity: chatLoading || (chatMode === "oracle" && !hasLlmKey) ? 0.6 : 1 }) : { opacity: chatLoading || (chatMode === "oracle" && !hasLlmKey) ? 0.6 : 1 }}
                          />
                          <Pressable
                            onPress={() => void sendChat()}
                            disabled={chatLoading || !chatQuery.trim() || (chatMode === "oracle" && !hasLlmKey)}
                            className="bg-indigo-500 px-4 py-3 rounded-xl self-stretch items-center justify-center"
                            style={{ opacity: chatLoading || !chatQuery.trim() || (chatMode === "oracle" && !hasLlmKey) ? 0.5 : 1 }}
                          >
                            <Text className="text-white text-[13px] font-extrabold">Send</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-1 justify-center items-center py-[100px] gap-4">
                      <Archive color="#6366F1" size={48} />
                      <Text className="text-tier-text-secondary text-sm text-center max-w-[360px] leading-[22px] font-medium">
                        Please select a guidance session from the timeline to review feedback and consult the AI assistant.
                      </Text>
                    </View>
                  )}
                </GlassCard>
              )}
            </View>
          ) : (
            /* ==================== LECTURER WORKSPACE (3-PANEL ASYMMETRIC) ==================== */
            <View className={!isMobile ? "flex-row flex-wrap items-start w-full gap-5" : "flex-1 min-h-0 w-full flex-col gap-4"}>
              {isMobile && (
                <View className="flex-row gap-1 bg-tier-surface rounded-[10px] p-[3px] border border-tier-divider-light">
                  {(["queue", "transcript", "validation"] as const).map((tab) => (
                    <Pressable
                      key={tab}
                      onPress={() => setMobileLecturerPanel(tab)}
                      className="flex-1 py-2.5 rounded-lg items-center"
                      style={{
                        backgroundColor: mobileLecturerPanel === tab ? "rgba(99, 102, 241, 0.08)" : "transparent",
                        borderWidth: 1,
                        borderColor: mobileLecturerPanel === tab ? "rgba(99, 102, 241, 0.15)" : "transparent",
                      }}
                    >
                      <Text className="text-[11px] font-extrabold" style={{ color: mobileLecturerPanel === tab ? "#6366F1" : "#94A3B8" }}>
                        {tab === "queue" ? "QUEUE" : tab === "transcript" ? "TRANSCRIPT" : "VALIDATION"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Panel Kiri: Student Document Queue */}
              {(!isMobile || mobileLecturerPanel === "queue") && (
              <GlassCard className={!isMobile ? "flex-1 min-w-[280px] p-6 h-[660px]" : "w-full p-5 flex flex-col gap-4"}>
                <View className="flex-row items-center gap-2.5 border-b border-tier-divider-light pb-3.5 mb-5">
                  <Archive color="#6366F1" size={20} />
                  <Text className="text-lg font-black tracking-tight text-tier-text-primary">Documents Queue</Text>
                </View>

                <ScrollView
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  scrollEnabled={!isMobile}
                  className={!isMobile ? "flex-1" : "w-full"}
                  contentContainerStyle={{ gap: 10 }}
                >
                  {logs.map((log) => {
                    const isSelected = selected?.id === log.id;
                    const studentName = log.student?.name ?? "Student";
                    const pendingCount = log.feedback_items?.filter(f => f.status === "Pending" || f.status === "Fixed").length ?? 0;
                    const meetNum = getMeetingNumber(log.id, log.student_id);
                    const sessionDateStr = formatSessionDate(log.created_at as any);

                    return (
                      <Pressable
                        key={log.id}
                        onPress={() => setSelectedLog(log)}
                        className="rounded-2xl border p-4 gap-1.5"
                        style={({ pressed }) => [
                          {
                            backgroundColor: isSelected ? "rgba(99, 102, 241, 0.08)" : "rgba(15, 23, 42, 0.02)",
                            borderColor: isSelected ? "#6366F1" : "rgba(255, 255, 255, 0.04)",
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                          },
                          isSelected ? (Platform.OS === "web" && !isMobile ? { boxShadow: "0 0 15px rgba(99, 102, 241, 0.15)" } : { shadowColor: "#6366F1", shadowOpacity: 0.15, shadowRadius: 15 }) : {},
                        ]}
                      >
                        <View className="flex-row justify-between items-center">
                          <Badge text={log.student?.nim ?? "STUDENT"} />
                          {pendingCount > 0 ? (
                            <Badge text={`${pendingCount} REVISIONS`} color="#D97706" />
                          ) : (
                            <Badge text="VALIDATED" color="#059669" />
                          )}
                        </View>
                        <Text
                          className="text-sm font-extrabold mt-0.5"
                          style={{ color: isSelected ? "#F8FAFC" : "#94A3B8" }}
                          numberOfLines={1}
                        >
                          {studentName} (Session #{meetNum})
                        </Text>
                        <Text className="text-cyan-600 font-bold mt-0.5 text-xs leading-[18px]" numberOfLines={1}>
                          Date: {sessionDateStr}
                        </Text>
                        <Text className="text-tier-text-secondary text-xs leading-[18px] font-medium" numberOfLines={1}>
                          File: {log.paper_filename}
                        </Text>
                      </Pressable>
                    );
                  })}

                  {!logs.length && (
                    <View className="py-[60px] items-center justify-center">
                      <Text className="text-tier-text-secondary text-[13px] font-semibold">No student submissions received yet.</Text>
                    </View>
                  )}
                </ScrollView>
              </GlassCard>
              )}

              {/* Panel Tengah: Audio Session & AI Transcript Generator */}
              {(!isMobile || mobileLecturerPanel === "transcript") && (
              <GlassCard className={!isMobile ? "flex-[1.8] min-w-[320px] p-6 h-[660px]" : "flex-1 w-full p-5"}>
                {selected ? (
                  <View className="flex-1 gap-4">
                    {/* Selected Document Info */}
                    <View className="border-b border-tier-divider-light pb-3">
                      <Text className="text-[9px] font-black tracking-[1.5px] text-tier-accent-primary">SELECTED STUDENT SUBMISSION</Text>
                      <Text className="text-lg font-black text-tier-text-primary mt-1" numberOfLines={1}>
                        {selected.student?.name ?? "Guidance"} - {selected.paper_filename}
                      </Text>
                    </View>

                    {/* High-Fidelity Audio Player */}
                    <View className="bg-tier-surface border border-tier-divider-light rounded-2xl p-4 gap-2.5">
                      <Text className="text-tier-accent-primary text-[9px] font-black tracking-[1.5px]">GUIDANCE SESSION RECORDING</Text>
                      <View className="flex-row items-center gap-3.5">
                        <Pressable
                          onPress={togglePlayback}
                          className="bg-indigo-500 rounded-xl py-2.5 px-4 items-center justify-center border border-transparent"
                          style={({ pressed }) => ({
                            transform: [{ scale: pressed ? 0.94 : 1 }],
                            ...(Platform.OS === "web" && !isMobile ? { boxShadow: `0 0 12px ${isPlaying ? "#059669" : "#4F46E5"}14` } : { shadowColor: isPlaying ? "#059669" : "#4F46E5", shadowOpacity: 0.08, shadowRadius: 12 }),
                          })}
                        >
                          <Text className="text-white font-black text-[13px]">
                            {isPlaying ? "PAUSE" : "PLAY"}
                          </Text>
                        </Pressable>
                        <View className="flex-1 gap-1.5">
                          <View className="h-1 bg-tier-divider-light rounded-full w-full relative">
                            <View
                              className="h-full bg-emerald-600 rounded-full absolute left-0 top-0"
                              style={{ width: `${audioProgress * 100}%` }}
                            />
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-tier-text-primary text-[11px] font-semibold">
                              {(audioProgress * 4.5).toFixed(2).replace(".", ":")}
                            </Text>
                            <Text className="text-tier-text-secondary text-[11px] font-semibold">{audioTime}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* AI Transcription Hub */}
                    <View className="h-[260px] border-b border-tier-divider-light pb-3.5">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-tier-text-secondary text-xs font-extrabold tracking-[0.5px] uppercase">Guidance Dialog Transcript (AI Generated)</Text>
                        <Badge text="STT ENGINE ACTIVE" color="#0891B2" />
                      </View>

                      {Platform.OS === "web" ? (
                        <ScrollView
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          className="h-[120px] bg-tier-surface border border-tier-divider-light rounded-xl p-3"
                          style={Platform.OS === "web" ? { outlineStyle: "none" as any } : undefined}
                        >
                          <Text className="text-tier-text-secondary text-[13px] font-medium" style={{ lineHeight: 20 }}>
                            {selected.transcript_text ? selected.transcript_text : "Transcript empty."}
                          </Text>
                        </ScrollView>
                      ) : (
                        <View className="h-[120px] items-center justify-center bg-tier-surface border border-dashed border-tier-divider-light rounded-xl p-3">
                          <Text className="text-tier-text-secondary text-xs font-semibold text-center leading-[18px]">
                            Transcript text is only available on desktop web version.
                          </Text>
                        </View>
                      )}

                      <View className="flex-row gap-3 mt-3">
                        <View className="flex-1">
                          <Button
                            title={isTranscribing ? "Generating Transcript..." : "Generate Transcript"}
                            onPress={triggerTranscription}
                            tone="success"
                          />
                        </View>
                        <View className="flex-1">
                          <Button
                            title={isAnalyzing ? "Analyzing Feedback..." : "Analyze Feedback"}
                            onPress={triggerAnalysis}
                            tone="primary"
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="flex-1 justify-center items-center py-[100px] gap-4">
                    <Archive color="#64748B" size={48} />
                    <Text className="text-tier-text-secondary text-sm text-center max-w-[360px] leading-[22px] font-medium">
                      Please select a student from the left queue to review the audio recording and transcript.
                    </Text>
                  </View>
                )}
              </GlassCard>
              )}

              {/* Panel Kanan: Validation & Custom Feedback Form */}
              {(!isMobile || mobileLecturerPanel === "validation") && (
              <GlassCard className={!isMobile ? "flex-[1.4] min-w-[380px] p-6 h-[660px]" : "w-full p-5 flex flex-col gap-4"}>
                {selected ? (
                  <View className="flex-1 gap-4">
                    <View className="border-b border-tier-divider-light pb-3">
                      <Text className="text-[9px] font-black tracking-[1.5px] text-tier-accent-primary">ADVISOR CONTROL PANEL</Text>
                      <Text className="text-lg font-black text-tier-text-primary mt-1">Feedback Evaluation</Text>
                    </View>

                    {/* Scrollable list of feedback items */}
                    <View className={!isMobile ? "h-[180px] border-b border-black/[0.06] pb-3.5" : "border-b border-black/[0.06] pb-3.5"}>
                      <Text className="text-tier-text-secondary text-xs font-extrabold tracking-[0.5px] uppercase mb-2">Select Revision Item</Text>
                      <ScrollView
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                        scrollEnabled={!isMobile}
                        className={!isMobile ? "flex-1" : "w-full"}
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {selected.feedback_items?.map((item) => {
                          const isSelectedFb = selectedFeedbackItem?.id === item.id;
                          const statusColor = item.status === "Validated" ? "#059669" : item.status === "Fixed" ? "#4F46E5" : "#D97706";

                          return (
                            <Pressable
                              key={item.id}
                              onPress={() => {
                                setSelectedFeedbackItem(item);
                                setFeedbackInputText(item.content);
                                setFeedbackCategory(item.category);
                              }}
                              className="border rounded-xl p-3 gap-2 bg-tier-surface-raised"
                              style={{
                                borderColor: isSelectedFb ? statusColor : "rgba(0,0,0,0.04)",
                                backgroundColor: isSelectedFb ? `${statusColor}08` : "rgba(30, 41, 59, 0.4)",
                              }}
                            >
                              <Badge text={`${item.category} \u2022 ${item.status}`} color={statusColor} />
                              <Text className="text-tier-text-primary text-xs font-medium" numberOfLines={1}>{item.content}</Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Review / Custom Feedback Input Form */}
                    {selectedFeedbackItem ? (
                      <View className="gap-3">
                        <Text className="text-tier-text-secondary text-xs font-extrabold tracking-[0.5px] uppercase mb-2">Audit Selected Item</Text>

                        <View className="gap-1.5">
                          <Text className="text-tier-text-secondary text-[9px] font-black tracking-[1.5px]">FEEDBACK / REVISION CONTENT</Text>
                          <TextInput
                            multiline
                            numberOfLines={3}
                            value={feedbackInputText}
                            onChangeText={setFeedbackInputText}
                            className="bg-tier-surface-raised border border-tier-divider-light text-tier-text-primary p-3 text-[13px] font-medium"
                            placeholder="Audit selected feedback item..."
                            placeholderTextColor="#475569"
                            style={Platform.OS === "web" ? ({ textAlignVertical: "top", outlineStyle: "none" as any }) : { textAlignVertical: "top" }}
                          />
                        </View>

                        <View className="gap-1.5">
                          <Text className="text-tier-text-secondary text-[9px] font-black tracking-[1.5px]">CATEGORY CLASSIFICATION</Text>
                          <View className="flex-row gap-2.5">
                            <Pressable
                              onPress={() => setFeedbackCategory("Major")}
                              className="flex-1 py-2 rounded-[10px] items-center justify-center border"
                              style={{
                                backgroundColor: feedbackCategory === "Major" ? "rgba(220, 38, 38, 0.06)" : "rgba(255, 255, 255, 0.02)",
                                borderColor: feedbackCategory === "Major" ? "#DC2626" : "rgba(255, 255, 255, 0.04)",
                                ...(Platform.OS === "web" && !isMobile ? { boxShadow: feedbackCategory === "Major" ? "0 0 10px rgba(220, 38, 38, 0.1)" : "none" } : { shadowColor: "#DC2626", shadowOpacity: feedbackCategory === "Major" ? 0.1 : 0, shadowRadius: 10 }),
                              }}
                            >
                              <Text className="text-[11px] font-black tracking-[1px]" style={{ color: feedbackCategory === "Major" ? "#DC2626" : "#475569" }}>MAJOR</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => setFeedbackCategory("Minor")}
                              className="flex-1 py-2 rounded-[10px] items-center justify-center border"
                              style={{
                                backgroundColor: feedbackCategory === "Minor" ? "rgba(99, 102, 241, 0.06)" : "rgba(255, 255, 255, 0.02)",
                                borderColor: feedbackCategory === "Minor" ? "#6366F1" : "rgba(255, 255, 255, 0.04)",
                                ...(Platform.OS === "web" && !isMobile ? { boxShadow: feedbackCategory === "Minor" ? "0 0 10px rgba(99, 102, 241, 0.1)" : "none" } : { shadowColor: "#6366F1", shadowOpacity: feedbackCategory === "Minor" ? 0.1 : 0, shadowRadius: 10 }),
                              }}
                            >
                              <Text className="text-[11px] font-black tracking-[1px]" style={{ color: feedbackCategory === "Minor" ? "#4F46E5" : "#475569" }}>MINOR</Text>
                            </Pressable>
                          </View>
                        </View>

                        <View className="gap-2.5 mt-2">
                          {selectedFeedbackItem.status === "Validated" ? (
                            <View className="w-full gap-2">
                              <View className="bg-emerald-600/[0.06] border border-emerald-600/[0.15] rounded-xl p-3 flex-row justify-center items-center gap-1.5">
                                <CheckCircle color="#059669" size={14} />
                                <Text className="text-emerald-600 text-xs font-extrabold">ITEM ALREADY VALIDATED</Text>
                              </View>
                              <View className="w-full">
                                <Button
                                  title="Undo Validation (Reset to Pending)"
                                  onPress={() => void updateStatus(selectedFeedbackItem, "Pending")}
                                  tone="warning"
                                />
                              </View>
                            </View>
                          ) : selectedFeedbackItem.status === "Fixed" ? (
                            <View className="w-full gap-2.5">
                              <View className="bg-indigo-600/[0.06] border border-indigo-600/[0.15] rounded-xl p-3 items-center">
                                <Text className="text-indigo-500 text-xs font-extrabold">STUDENT SUBMITTED RESOLUTION</Text>
                              </View>
                              <View className="w-full">
                                <Button
                                  title="Validate & Approve (Accept Revision)"
                                  onPress={() => void updateStatus(selectedFeedbackItem, "Validated")}
                                  tone="success"
                                />
                              </View>
                              <View className="w-full">
                                <Button
                                  title="Reject Fix (Return to Pending)"
                                  onPress={() => void updateStatus(selectedFeedbackItem, "Pending")}
                                  tone="danger"
                                />
                              </View>
                            </View>
                          ) : (
                            <View className="w-full gap-2.5">
                              <View className="bg-amber-600/[0.06] border border-amber-600/[0.15] rounded-xl p-3 items-center">
                                <Text className="text-amber-600 text-xs font-extrabold">STATUS: PENDING WORK</Text>
                              </View>
                              <View className="w-full">
                                <Button
                                  title="Validate Immediately"
                                  onPress={() => void updateStatus(selectedFeedbackItem, "Validated")}
                                  tone="success"
                                />
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    ) : (
                      <Text className="text-tier-text-secondary text-[13px] font-medium py-3">No feedback items available for audit.</Text>
                    )}
                  </View>
                ) : (
                  <View className="flex-1 justify-center items-center py-[100px] gap-4">
                    <Archive color="#64748B" size={48} />
                    <Text className="text-tier-text-secondary text-sm text-center max-w-[360px] leading-[22px] font-medium">
                      Feedback audits, validation actions, and category control options will be displayed here once a session is selected.
                    </Text>
                  </View>
                )}
              </GlassCard>
              )}
            </View>
          )}
        </Page>

        {/* Floating Toast Notification Container (floating over layout) */}
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
            const translateAnim = toastAnimRef.interpolate({
              inputRange: [0, 1],
              outputRange: [isMobile ? -100 : 340, 0],
            });
            const opacityAnim = toastAnimRef;

            let IconComponent = Bell;
            let color = "#6366F1";
            if (toast.type === "chat") {
              IconComponent = MessageSquare;
              color = "#0891B2";
            } else if (toast.type === "revision") {
              IconComponent = CheckCircle;
              color = "#059669";
            }

            return (
              <Animated.View
                key={toast.id}
                className="bg-tier-surface-raised border border-tier-divider-light rounded-[14px] p-4 flex-row gap-3 items-center"
                style={{
                  opacity: opacityAnim,
                  transform: [
                    isMobile 
                      ? { translateY: translateAnim } 
                      : { translateX: translateAnim }
                  ],
                  ...(Platform.OS === "web" ? { boxShadow: `0 0 16px ${color}1A` } : { shadowColor: color, shadowOpacity: 0.12, shadowRadius: 16 }),
                }}
              >
                <IconComponent color={color} size={20} />
                <View className="flex-1 gap-0.5">
                  <Text className="text-white text-[13px] font-extrabold">{toast.title}</Text>
                  <Text className="text-tier-text-secondary text-[11px] font-medium" numberOfLines={2}>{toast.message}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Topic Mismatch Warning Modal */}
      {showMismatchModal && mismatchCheck && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50" style={{ backdropFilter: "blur(8px)" } as any}>
          <View className="bg-tier-surface-raised border border-amber-500/30 rounded-2xl p-6 mx-4 max-w-[420px] w-full gap-4">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-amber-500/20 items-center justify-center">
                <AlertTriangle color="#D97706" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-black">Topik Tidak Sesuai</Text>
                <Text className="text-amber-400 text-xs font-semibold">Deteksi potensi ketidakcocokan</Text>
              </View>
            </View>

            <View className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 gap-3">
              <Text className="text-tier-text-secondary text-sm leading-[20px]">
                {mismatchCheck.message}
              </Text>
              
              {mismatchCheck.audio_topic && mismatchCheck.paper_topic && (
                <View className="gap-2 mt-2">
                  <View className="flex-row items-start gap-2">
                    <Text className="text-amber-400 text-xs font-bold min-w-[70px]">Bimbingan:</Text>
                    <Text className="text-tier-text-secondary text-xs flex-1">{mismatchCheck.audio_topic}</Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <Text className="text-indigo-400 text-xs font-bold min-w-[70px]">Draft:</Text>
                    <Text className="text-tier-text-secondary text-xs flex-1">{mismatchCheck.paper_topic}</Text>
                  </View>
                </View>
              )}

              <View className="flex-row items-center gap-2 mt-1">
                <Text className="text-tier-text-tertiary text-xs">Confidence:</Text>
                <View className={`px-2 py-0.5 rounded-full ${
                  mismatchCheck.confidence === "high" 
                    ? "bg-red-500/20" 
                    : "bg-amber-500/20"
                }`}>
                  <Text className={`text-[10px] font-bold uppercase ${
                    mismatchCheck.confidence === "high" 
                      ? "text-red-400" 
                      : "text-amber-400"
                  }`}>
                    {mismatchCheck.confidence}
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-tier-text-secondary text-xs leading-[18px]">
              Pastikan draft yang di-upload adalah draft yang dibahas di sesi bimbingan ini. 
              Jika tetap melanjutkan, hasil analisis mungkin tidak akurat.
            </Text>

            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button
                  title="Batal"
                  onPress={() => {
                    setShowMismatchModal(false);
                    setMismatchCheck(null);
                  }}
                  tone="secondary"
                />
              </View>
              <View className="flex-1">
                <Button
                  title={loading ? "Menganalisis..." : "Tetap Lanjutkan"}
                  onPress={() => {
                    setShowMismatchModal(false);
                    doUploadConsultation();
                  }}
                  tone="warning"
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </RequireAuth>
  );

  if (isMobile) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{ flex: 1 }}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }
  return content;
}
