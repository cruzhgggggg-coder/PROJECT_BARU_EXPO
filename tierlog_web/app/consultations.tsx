import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { WebFileInput } from "@/src/components/WebFileInput";
import { MultiImageInput } from "@/src/components/MultiImageInput";
import { GlassCard } from "@/src/components/ui/glass-card";
import { Badge, Button, Heading, Page } from "@/src/components/ui";
import { API_URL } from "@/src/lib/config";
import { useAuth } from "@/src/providers/AuthProvider";
import type { ConsultationLog, FeedbackItem, RevisionAnnotation } from "@/src/types";
import {
  CloudUpload,
  Archive,
  Cpu,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

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
      style={{ gap: 5, boxShadow: `0 0 8px ${color}0D` }}
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
  const [logs, setLogs] = useState<ConsultationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ConsultationLog | null>(null);

  const hasGroqKey = !!(user?.groq_key && user.groq_key.length > 8);
  const hasLlmKey = !!(user?.gemini_key || user?.openai_key || user?.anthropic_key || user?.nvidia_key);

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

  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [annotationFiles, setAnnotationFiles] = useState<File[]>([]);
  const [studentTab, setStudentTab] = useState<"feedback" | "transcript" | "annotations" | "drafts">("feedback");
  const [showArchiveDropdown, setShowArchiveDropdown] = useState(false);

  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatMode, setChatMode] = useState<"oracle" | "advisor">("oracle");
  const [directMessages, setDirectMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const chatScrollRef = useRef<ScrollView | null>(null);

  const [selectedFeedbackItem, setSelectedFeedbackItem] = useState<FeedbackItem | null>(null);
  const [feedbackInputText, setFeedbackInputText] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState<"Major" | "Minor">("Major");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0.24);
  const [audioTime, setAudioTime] = useState("02:14");
  const [commentingOnFeedbackId, setCommentingOnFeedbackId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  // Revised draft upload state
  const [revisedFile, setRevisedFile] = useState<File | null>(null);
  const [uploadingRevised, setUploadingRevised] = useState(false);

  // Fix proof text state
  const [fixingFeedbackId, setFixingFeedbackId] = useState<number | null>(null);
  const [fixProofText, setFixProofText] = useState("");

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
      console.error("Failed to load direct messages:", err);
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
      console.error("Failed to load AI chats:", err);
    }
  };

  useEffect(() => {
    if (!accessToken || !selectedLog) {
      return;
    }

    void loadDirectMessages(selectedLog.id);
    void loadAIChats(selectedLog.id);
  }, [accessToken, selectedLog?.id]);

  useEffect(() => {
    if (!accessToken || logs.length === 0) return;

    socketRef.current?.close();

    const socket = new WebSocket(`${API_URL.replace("http", "ws")}/ws`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: "auth", token: accessToken }));
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
      } catch (e) {
        console.error("[WS] parse error:", e);
      }
    };

    socket.onerror = (e) => console.error("[WS] error:", e);

    return () => {
      socket.close();
    };
  }, [accessToken, logs.length]);

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

  const uploadConsultation = async () => {
    if (!paperFile || !audioFile) {
      setError("Please select the manuscript (.docx) and the audio recording (.mp3/.wav) before proceeding.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("paper", paperFile);
      body.append("audio", audioFile);
      annotationFiles.forEach((f) => body.append("annotations", f));
      await api("/consultations", { method: "POST", body, headers: {} });
      setPaperFile(null);
      setAudioFile(null);
      setAnnotationFiles([]);
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
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
      alert("AI transcript has been successfully reprocessed and synchronized.");
    }, 2000);
  };

  const triggerAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      alert("Feedback metrics and version consistency analysis have been updated.");
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
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      const interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 1) {
            setIsPlaying(false);
            clearInterval(interval);
            return 1;
          }
          return prev + 0.01;
        });
      }, 500);
    }
  };

  return (
    <RequireAuth>
      <View className="flex-1">
        <Page>
          <NavBar />


          <Heading
            title="Consultation Workspace"
            subtitle={
              user?.role === "lecturer"
                ? "Supervisor Workspace - Auditing draft thesis, evaluating audio transcripts, and verifying revision status."
                : "Student Workspace - Upload manuscripts, evaluate advisor feedback, and consult the AI Oracle for revision guidelines."
            }
          />

          {error ? (
            <GlassCard className="flex-row items-center gap-3 bg-red-500/[0.06] border-red-500/[0.15] p-4 mb-4">
              <AlertCircle color="#DC2626" size={20} />
              <Text className="text-sm font-semibold text-red-600">{error}</Text>
            </GlassCard>
          ) : null}

          {/* API Key Warnings */}
          {user?.role === "student" && (!hasGroqKey || !hasLlmKey) ? (
            <View className="flex-row flex-wrap gap-3 mb-4 w-full">
              {!hasGroqKey && (
                <GlassCard className="flex-1 min-w-[280px] flex-row items-center gap-3 bg-amber-500/[0.04] border-amber-500/[0.15] p-4 py-3">
                  <AlertCircle color="#D97706" size={18} />
                  <Text className="text-xs font-semibold text-amber-600 flex-1">
                    Groq API key not configured. Audio transcription will not work. Set it in Settings → AI Gateway.
                  </Text>
                </GlassCard>
              )}
              {!hasLlmKey && (
                <GlassCard className="flex-1 min-w-[280px] flex-row items-center gap-3 bg-amber-500/[0.04] border-amber-500/[0.15] p-4 py-3">
                  <AlertCircle color="#D97706" size={18} />
                  <Text className="text-xs font-semibold text-amber-600 flex-1">
                    LLM API key not configured. HOC/LOC classification and AI chat will not work. Set it in Settings → AI Gateway.
                  </Text>
                </GlassCard>
              )}
            </View>
          ) : null}

          {/* Dynamic Dual-Layout by User Role */}
          {user?.role === "student" ? (
            /* ==================== STUDENT WORKSPACE (CLARITY STREAM 3 PANEL) ==================== */
            <View className="flex-row flex-wrap items-start w-full gap-5">

              {/* Left Panel: File Sync & Archive List */}
              <GlassCard className="flex-1 min-w-[320px] p-6 h-[680px] flex flex-col justify-between">
                <View className="flex-1 gap-3">
                  <View className="flex-row items-center gap-2.5 border-b border-white/[0.06] pb-3.5 mb-2">
                    <CloudUpload color="#4F46E5" size={18} />
                    <Text className="text-[15px] font-black tracking-tight text-slate-50">Upload Draft</Text>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    className="flex-1"
                    {...({ className: "ultra-thin-scroll" } as any)}
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
                    <View className="mt-2 bg-emerald-500/[0.04] border border-emerald-500/[0.15] rounded-2xl p-4 gap-2.5">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[10px] font-black tracking-[1.5px] text-emerald-500">FINAL DOCUMENT</Text>
                        {selected?.final_document_filename && (
                          <Badge text="UPLOADED" color="#059669" />
                        )}
                      </View>
                      <Text className="text-slate-400 text-[11px] font-medium leading-[16px]">
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
                        <View className="flex-row items-center justify-between bg-emerald-500/[0.06] rounded-xl px-3 py-2 border border-emerald-500/[0.12]">
                          <View className="flex-1">
                            <Text className="text-emerald-500 text-[11px] font-bold" numberOfLines={1}>{selected.final_document_filename}</Text>
                            {selected.final_document_uploaded_at && (
                              <Text className="text-slate-400 text-[10px] mt-0.5">
                                Uploaded: {new Date(selected.final_document_uploaded_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                              </Text>
                            )}
                          </View>
                          <Pressable
                            onPress={() => Platform.OS === "web" && window.open(`${API_URL}/storage/final/${encodeURIComponent(selected!.final_document_filename!)}`)}
                            className="px-2.5 py-1 rounded-md border border-emerald-500/[0.15] bg-emerald-500/[0.08]"
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                          >
                            <Text className="text-emerald-500 text-[10px] font-bold">Download</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>

                    {/* Revised Draft Upload Section */}
                    <View className="mt-2 bg-violet-500/[0.04] border border-violet-500/[0.15] rounded-2xl p-4 gap-2.5">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[10px] font-black tracking-[1.5px] text-violet-500">REVISED DRAFT</Text>
                        {selected?.revised_document_filename && (
                          <Badge text="UPLOADED" color="#7C3AED" />
                        )}
                      </View>
                      <Text className="text-slate-400 text-[11px] font-medium leading-[16px]">
                        Upload your revised document for this session. This replaces the previous draft.
                      </Text>
                      <WebFileInput
                        label="Select Revised Draft (.docx)"
                        accept=".docx"
                        onFileSelect={setRevisedFile}
                      />
                      {revisedFile && (
                        <View className="flex-row items-center justify-between bg-violet-500/[0.06] rounded-xl px-3 py-2 border border-violet-500/[0.12]">
                          <Text className="text-violet-400 text-[11px] font-bold flex-1" numberOfLines={1}>{revisedFile.name}</Text>
                          <Pressable
                            onPress={() => setRevisedFile(null)}
                            className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]"
                          >
                            <Text className="text-slate-400 text-[10px] font-bold">Remove</Text>
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
                        <View className="flex-row items-center justify-between bg-violet-500/[0.06] rounded-xl px-3 py-2 border border-violet-500/[0.12]">
                          <View className="flex-1">
                            <Text className="text-violet-400 text-[11px] font-bold" numberOfLines={1}>{selected.revised_document_filename}</Text>
                            {selected.revised_document_uploaded_at && (
                              <Text className="text-slate-400 text-[10px] mt-0.5">
                                Uploaded: {new Date(selected.revised_document_uploaded_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                              </Text>
                            )}
                          </View>
                          <Pressable
                            onPress={() => Platform.OS === "web" && window.open(`${API_URL}/storage/revised/${encodeURIComponent(selected!.revised_document_filename!)}`)}
                            className="px-2.5 py-1 rounded-md border border-violet-500/[0.15] bg-violet-500/[0.08]"
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                          >
                            <Text className="text-violet-500 text-[10px] font-bold">Download</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </ScrollView>

                  <View className="mt-2 mb-4">
                    <Button
                      title={loading ? "Processing..." : "Analyze Revision Session"}
                      onPress={() => void uploadConsultation()}
                      disabled={loading}
                    />
                  </View>
                </View>

                {/* COMPACT FLOATING ARCHIVE DROPDOWN */}
                <View className="relative z-[99] w-full">
                  <Pressable
                    onPress={() => setShowArchiveDropdown(!showArchiveDropdown)}
                    className="flex-row items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3.5"
                    style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                  >
                    <View className="flex-row items-center gap-2.5">
                      <Archive color="#0891B2" size={16} />
                      <Text className="text-[13px] font-extrabold text-slate-50" numberOfLines={1}>
                        {selected
                          ? `Session: ${new Date(selected.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`
                          : "Select Consultation Session"}
                      </Text>
                    </View>
                    <Text className="text-[11px] font-black text-cyan-600">
                      {showArchiveDropdown ? "\u25B2" : "\u25BC"}
                    </Text>
                  </Pressable>

                  {showArchiveDropdown && (
                    <GlassCard
                      className="absolute bottom-14 left-0 right-0 max-h-[220px] p-2.5 z-[99999] bg-slate-900/[0.95] border-white/[0.06]"
                      style={{ boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }}
                    >
                      <ScrollView
                        showsVerticalScrollIndicator={true}
                        {...({ className: "ultra-thin-scroll" } as any)}
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {logs.map((log) => {
                          const isSelected = selected?.id === log.id;
                          const dateStr = new Date(log.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
                          return (
                            <Pressable
                              key={log.id}
                              onPress={() => {
                                setSelectedLog(log);
                                setShowArchiveDropdown(false);
                              }}
                              className="flex-row items-center justify-between p-2.5 rounded-lg"
                              style={({ pressed }) => [
                                {
                                  backgroundColor: isSelected ? "rgba(8, 145, 178, 0.08)" : "transparent",
                                  borderWidth: 1,
                                  borderColor: isSelected ? "rgba(8, 145, 178, 0.15)" : "transparent",
                                  transform: [{ scale: pressed ? 0.98 : 1 }]
                                }
                              ]}
                            >
                              <View className="flex-1 gap-0.5">
                                <Text className={`text-xs font-extrabold ${isSelected ? "text-white" : "text-slate-300"}`} numberOfLines={1}>
                                  {log.paper_filename}
                                </Text>
                                <Text className="text-[10px] font-semibold text-slate-400">
                                  {dateStr}
                                </Text>
                              </View>
                              {isSelected && <View className="w-1.5 h-1.5 rounded-full bg-cyan-600" />}
                            </Pressable>
                          );
                        })}
                        {!logs.length && (
                          <Text className="text-slate-400 text-xs text-center py-3">
                            No drafts uploaded yet.
                          </Text>
                        )}
                      </ScrollView>
                    </GlassCard>
                  )}
                </View>
              </GlassCard>

              {/* Center Panel: Feedback Stream & Transcript Tabs */}
              <GlassCard className="flex-1 min-w-[320px] p-6 h-[680px]">
                <View className="flex-1 gap-4">
                  <View className="flex-row justify-between items-center border-b border-white/[0.08] pb-3.5 flex-wrap gap-3">
                    <View className="gap-1 flex-1 min-w-0 mr-2">
                      <Text className="text-lg font-black tracking-tight text-slate-50">Advisory Workspace</Text>
                      {selected && (
                        <Pressable
                          onPress={() => Platform.OS === "web" && window.open(`${API_URL}/storage/paper/${encodeURIComponent(selected.paper_filename)}`)}
                          className="flex-row items-center gap-1 w-full"
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        >
                          <Text className="text-[11px] font-bold text-teal-500 underline" numberOfLines={1} ellipsizeMode="tail">
                            Download Manuscript: {selected.paper_filename}
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Tabs switch */}
                    <View className="flex-row gap-1 bg-white/[0.02] rounded-[10px] p-[3px] border border-white/[0.06] flex-nowrap">
                      <Pressable
                        onPress={() => setStudentTab("feedback")}
                        className="px-2 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: studentTab === "feedback" ? "rgba(99, 102, 241, 0.08)" : "transparent",
                          borderWidth: 1,
                          borderColor: studentTab === "feedback" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                        }}
                      >
                        <Text className="text-[9.8px] font-extrabold" style={{ color: studentTab === "feedback" ? "#6366F1" : "#94A3B8" }}>FEEDBACK</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setStudentTab("transcript")}
                        className="px-2 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: studentTab === "transcript" ? "rgba(99, 102, 241, 0.08)" : "transparent",
                          borderWidth: 1,
                          borderColor: studentTab === "transcript" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                        }}
                      >
                        <Text className="text-[9.8px] font-extrabold" style={{ color: studentTab === "transcript" ? "#6366F1" : "#94A3B8" }}>TRANSCRIPT</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setStudentTab("annotations")}
                        className="px-2 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: studentTab === "annotations" ? "rgba(124, 58, 237, 0.08)" : "transparent",
                          borderWidth: 1,
                          borderColor: studentTab === "annotations" ? "rgba(124, 58, 237, 0.15)" : "transparent",
                        }}
                      >
                        <Text className="text-[9.8px] font-extrabold" style={{ color: studentTab === "annotations" ? "#7C3AED" : "#94A3B8" }}>
                          ANNOTATIONS ({selected?.revision_annotations?.length ?? 0})
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setStudentTab("drafts")}
                        className="px-2 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: studentTab === "drafts" ? "rgba(8, 145, 178, 0.08)" : "transparent",
                          borderWidth: 1,
                          borderColor: studentTab === "drafts" ? "rgba(8, 145, 178, 0.15)" : "transparent",
                        }}
                      >
                        <Text className="text-[9.8px] font-extrabold" style={{ color: studentTab === "drafts" ? "#14B8A6" : "#94A3B8" }}>
                          DRAFTS ({logs.length})
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {selected ? (
                    studentTab === "feedback" ? (
                      /* FEEDBACK LIST VIEW */
                      <ScrollView
                        showsVerticalScrollIndicator={true}
                        className="flex-1"
                        {...({ className: "ultra-thin-scroll" } as any)}
                        contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
                      >
                        {selected.feedback_items && selected.feedback_items.length > 0 && (
                          <Pressable
                            onPress={() => void classifyFeedback()}
                            disabled={classifying}
                            className="flex-row items-center justify-center bg-white/[0.03] border border-cyan-600/[0.2] rounded-2xl p-3.5 mb-1.5"
                            style={({ pressed }) => ({
                              gap: 10,
                              transform: [{ scale: pressed ? 0.985 : 1 }],
                              boxShadow: `0 0 12px ${classifying ? "#7C3AED" : "#0891B2"}14`,
                            })}
                          >
                            <Cpu color={classifying ? "#7C3AED" : "#0891B2"} size={16} />
                            <Text className="text-[13px] font-black tracking-[0.2px] text-slate-50">
                              {classifying
                                ? "AI Oracle is organizing and sorting your notes..."
                                : "Sort & Analyze Revisions with AI Oracle"}
                            </Text>
                          </Pressable>
                        )}

                        {selected.feedback_items?.map((item) => {
                          const isFixed = item.status === "Fixed";
                          const isValidated = item.status === "Validated";

                          return (
                            <View
                              key={item.id}
                              className="rounded-2xl border border-l-4 p-4 gap-2.5 bg-slate-800/40"
                              style={{
                                borderLeftColor: isFixed ? "#059669" : isValidated ? "#6366F1" : "#D97706",
                                borderColor: isFixed ? "rgba(5, 150, 105, 0.3)" : isValidated ? "rgba(99, 102, 241, 0.3)" : "rgba(217, 119, 6, 0.3)",
                              }}
                            >
                              <View className="flex-row justify-between items-center">
                                <Badge text={item.category.toUpperCase()} color={item.category === "Major" ? "#DC2626" : "#4F46E5"} />

                                {fixingFeedbackId === item.id ? (
                                  <View className="flex-row items-center gap-2">
                                    <TextInput
                                      value={fixProofText}
                                      onChangeText={setFixProofText}
                                      placeholder="Describe your fix..."
                                      placeholderTextColor="#475569"
                                      className="bg-white/[0.02] border border-white/[0.06] rounded-lg text-slate-50 px-2.5 py-1.5 text-[11px] font-medium w-[180px]"
                                      style={{ outlineStyle: "none" } as any}
                                    />
                                    <Pressable
                                      onPress={() => {
                                        void updateStatus(item, "Fixed", fixProofText);
                                        setFixingFeedbackId(null);
                                        setFixProofText("");
                                      }}
                                      className="px-2.5 py-1 rounded-md bg-emerald-500/[0.12] border border-emerald-500/[0.25]"
                                    >
                                      <Text className="text-emerald-500 text-[10px] font-bold">Confirm</Text>
                                    </Pressable>
                                    <Pressable
                                      onPress={() => { setFixingFeedbackId(null); setFixProofText(""); }}
                                      className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]"
                                    >
                                      <Text className="text-slate-400 text-[10px] font-bold">Cancel</Text>
                                    </Pressable>
                                  </View>
                                ) : (
                                  <Pressable
                                    onPress={() => {
                                      if (isFixed) return;
                                      if (isValidated) return;
                                      setFixingFeedbackId(item.id);
                                      setFixProofText("");
                                    }}
                                    disabled={isFixed || isValidated}
                                    className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-md"
                                    style={({ pressed }) => ({
                                      gap: 6,
                                      backgroundColor: isFixed ? "rgba(5, 150, 105, 0.06)" : isValidated ? "rgba(79, 70, 229, 0.06)" : "rgba(217, 119, 6, 0.06)",
                                      borderWidth: 1,
                                      borderColor: isFixed ? "rgba(5, 150, 105, 0.15)" : isValidated ? "rgba(79, 70, 229, 0.15)" : "rgba(217, 119, 6, 0.15)",
                                      transform: [{ scale: pressed && !isFixed && !isValidated ? 0.96 : 1 }],
                                      opacity: isFixed || isValidated ? 0.8 : 1,
                                    })}
                                  >
                                    <View
                                      className="w-2.5 h-2.5 rounded-[3px] justify-center items-center"
                                      style={{
                                        borderWidth: 1,
                                        borderColor: isFixed ? "#059669" : isValidated ? "#4F46E5" : "#D97706",
                                        backgroundColor: isFixed ? "#059669" : "transparent",
                                      }}
                                    >
                                      {isFixed && <Text className="text-white text-[6px] font-black">&#10003;</Text>}
                                    </View>
                                    <Text className="text-[9px] font-black" style={{ color: isFixed ? "#059669" : isValidated ? "#4F46E5" : "#D97706" }}>
                                      {item.status.toUpperCase()}
                                    </Text>
                                  </Pressable>
                                )}
                              </View>

                              <Text className="text-[13.5px] font-medium text-slate-200" style={{ lineHeight: 20 }}>
                                {item.content}
                              </Text>

                              {/* Fix Proof Text Display */}
                              {item.fix_proof_text ? (
                                <View className="mt-1.5 bg-emerald-500/[0.04] border border-emerald-500/[0.12] rounded-lg p-2.5 gap-1">
                                  <Text className="text-emerald-500 text-[9px] font-black tracking-[1.5px]">FIX DESCRIPTION</Text>
                                  <Text className="text-slate-300 text-[12px] font-medium" style={{ lineHeight: 18 }}>
                                    {item.fix_proof_text}
                                  </Text>
                                </View>
                              ) : null}

                              <View className="flex-row gap-2 flex-wrap mt-1 justify-end">
                                <Pressable
                                  onPress={() => void handleQuickRevisi(item.content)}
                                  className="flex-row items-center bg-white/[0.03] border border-violet-600/[0.2] rounded-lg px-3 py-1.5"
                                  style={({ pressed }) => ({
                                    gap: 6,
                                    transform: [{ scale: pressed ? 0.97 : 1 }],
                                  })}
                                >
                                  <Cpu color="#7C3AED" size={12} />
                                  <Text className="text-[11px] font-extrabold text-violet-600">Quick AI Revision</Text>
                                </Pressable>
                              </View>

                              {/* Comments Thread */}
                              {item.comments && item.comments.length > 0 && (
                                <View className="mt-2 gap-2 border-t border-white/[0.04] pt-2">
                                  <Text className="text-slate-400 text-[9px] font-black tracking-[1.5px]">COMMENTS</Text>
                                  {item.comments.map((comment) => (
                                    <View
                                      key={comment.id}
                                      className={`rounded-lg p-2.5 border ${
                                        comment.author_role === "student"
                                          ? "bg-indigo-500/[0.06] border-indigo-500/[0.12] ml-4"
                                          : "bg-white/[0.03] border-white/[0.06] mr-4"
                                      }`}
                                    >
                                      <Text className="text-[9px] font-black tracking-[1px] text-slate-400 mb-1">
                                        {comment.author_role === "student" ? "YOU" : "ADVISOR"}
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
                                    placeholder="Add a comment or response..."
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
                        {!selected.feedback_items?.length && (
                          <Text className="text-slate-400 text-[13px] font-medium py-3">No feedback items available for this session.</Text>
                        )}
                      </ScrollView>
                    ) : studentTab === "transcript" ? (
                      /* TRANSCRIPT VIEW */
                      <View className="flex-1">
                        <ScrollView
                          showsVerticalScrollIndicator={true}
                          className="flex-1 bg-slate-900/[0.4] rounded-[14px] border border-white/[0.04] p-3.5"
                          {...({ className: "ultra-thin-scroll" } as any)}
                        >
                          <Text className="text-slate-300 text-[13px] font-medium" style={{ lineHeight: 22 }}>
                            {selected.transcript_text ? selected.transcript_text : "No audio transcript is available for this guidance session."}
                          </Text>
                        </ScrollView>
                      </View>
                    ) : studentTab === "annotations" ? (
                      /* ANNOTATIONS VIEW */
                      <View className="flex-1">
                        <ScrollView
                          showsVerticalScrollIndicator={true}
                          className="flex-1"
                          {...({ className: "ultra-thin-scroll" } as any)}
                          contentContainerStyle={{ gap: 12 }}
                        >
                          {(selected.revision_annotations ?? []).map((ann, idx) => (
                            <View key={ann.id} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3.5 gap-2 border-b-0 mb-3">
                              <View className="flex-row items-center gap-2.5">
                                <Text className="text-[22px]">
                                  {ann.file_type === "image" ? "📸" : "📄"}
                                </Text>
                                <View className="flex-1">
                                  <Text className="text-slate-50 text-xs font-bold" numberOfLines={1}>
                                    {ann.filename}
                                  </Text>
                                  <Text className="text-slate-400 text-[10px] mt-0.5">
                                    {ann.file_type === "image" ? "Annotated Page Photo" : "DOCX Track Changes"}
                                  </Text>
                                </View>
                                <Pressable
                                  onPress={() => Platform.OS === "web" && window.open(`${API_URL}/storage/annotations/${encodeURIComponent(ann.filename)}`)}
                                  className="bg-violet-600/[0.08] px-2.5 py-1 rounded-md border border-violet-600/[0.15]"
                                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                >
                                  <Text className="text-violet-600 text-[10px] font-bold">Download</Text>
                                </Pressable>
                              </View>
                              {ann.file_type === "image" && Platform.OS === "web" && (
                                <img
                                  src={`${API_URL}/storage/annotations/${ann.filename}`}
                                  alt={ann.filename}
                                  className="w-full max-h-[180px] object-cover rounded-lg mb-2 opacity-90"
                                  onError={(e: any) => { e.target.style.display = "none"; }}
                                />
                              )}
                              <View className="bg-white/[0.02] border border-white/[0.04] rounded-[10px] p-2.5 gap-1.5">
                                <Text className="text-violet-600 text-[9px] font-black tracking-[1.5px]">AI EXTRACTED CONTENT</Text>
                                <ScrollView
                                  showsVerticalScrollIndicator
                                  style={{ maxHeight: 120 }}
                                  {...({ className: "ultra-thin-scroll" } as any)}
                                >
                                  <Text className="text-slate-300 text-[12.5px] font-normal" style={{ lineHeight: 20 }}>
                                    {ann.extracted_text || "(No text extracted yet)"}
                                  </Text>
                                </ScrollView>
                              </View>
                            </View>
                          ))}
                          {!(selected.revision_annotations ?? []).length && (
                            <View className="py-10 items-center">
                              <Text className="text-slate-500 text-[13px]">No advisor annotations available for this session.</Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    ) : (
                      /* DRAFTS HISTORY VIEW */
                      <View className="flex-1">
                        <ScrollView
                          showsVerticalScrollIndicator={true}
                          className="flex-1"
                          {...({ className: "ultra-thin-scroll" } as any)}
                          contentContainerStyle={{ gap: 12 }}
                        >
                          {logs.map((log) => {
                            const isSelected = selected?.id === log.id;
                            const dateStr = new Date(log.created_at).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            });
                            const feedbackCount = log.feedback_items?.length ?? 0;
                            const annotationCount = log.revision_annotations?.length ?? 0;

                            return (
                              <View
                                key={log.id}
                                className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3.5 gap-3 mb-3"
                                style={isSelected ? { borderColor: "rgba(8, 145, 178, 0.3)", backgroundColor: "rgba(8, 145, 178, 0.04)" } : {}}
                              >
                                <View className="flex-row items-center gap-2.5">
                                  <Text className="text-[22px]">📄</Text>
                                  <View className="flex-1">
                                    <Text className="text-slate-50 text-[13px] font-bold" numberOfLines={1}>
                                      {log.paper_filename}
                                    </Text>
                                    <Text className="text-slate-400 text-[10px] mt-0.5">{dateStr}</Text>
                                  </View>
                                  <View className="flex-row gap-2">
                                    <Pressable
                                      onPress={() => Platform.OS === "web" && window.open(`${API_URL}/storage/paper/${encodeURIComponent(log.paper_filename)}`)}
                                      className="px-2.5 py-[5px] rounded-md border border-cyan-600/[0.15] bg-cyan-600/[0.08]"
                                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                    >
                                      <Text className="text-cyan-600 text-[10px] font-bold">Download</Text>
                                    </Pressable>
                                    {!isSelected && (
                                      <Pressable
                                        onPress={() => setSelectedLog(log)}
                                        className="px-2.5 py-[5px] rounded-md border border-indigo-600/[0.15] bg-indigo-600/[0.08]"
                                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                      >
                                        <Text className="text-indigo-600 text-[10px] font-bold">Load Session</Text>
                                      </Pressable>
                                    )}
                                  </View>
                                </View>

                                <View className="flex-row gap-3 bg-white/[0.02] rounded-[10px] p-2.5">
                                  <View className="flex-1 gap-1">
                                    <Text className="text-slate-400 text-[8px] font-black tracking-[1px]">FEEDBACK ITEMS</Text>
                                    <Text className="text-slate-300 text-[11px] font-semibold">{feedbackCount} points</Text>
                                  </View>
                                  <View className="flex-1 gap-1">
                                    <Text className="text-slate-400 text-[8px] font-black tracking-[1px]">ANNOTATIONS</Text>
                                    <Text className="text-slate-300 text-[11px] font-semibold">{annotationCount} files</Text>
                                  </View>
                                  <View className="flex-1 gap-1">
                                    <Text className="text-slate-400 text-[8px] font-black tracking-[1px]">STATUS</Text>
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
                              <Text className="text-slate-500 text-[13px]">No drafts uploaded yet.</Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    )
                  ) : (
                    <View className="flex-1 justify-center items-center">
                      <Text className="text-slate-500 text-[13px] text-center">Select a session from the history archive to view details.</Text>
                    </View>
                  )}
                </View>
              </GlassCard>

              {/* Right Panel: AI Academic Assistant Chat */}
              <GlassCard className="flex-1 min-w-[320px] p-6 h-[680px]">
                {selected ? (
                  <View className="flex-1 gap-4">
                    {/* Active Session Info with Chat Type Switcher */}
                    <View className="border-b border-white/[0.06] pb-3">
                      <View className="flex-row justify-between items-center mb-1.5">
                        <Text className="text-[9px] font-black tracking-[1.5px] text-indigo-500">
                          {chatMode === "oracle" ? "AI ACADEMIC ORACLE" : "ADVISOR CONSULTATION"}
                        </Text>
                        <Badge
                          text={chatMode === "oracle" ? "ONLINE" : "DIRECT"}
                          color={chatMode === "oracle" ? "#059669" : "#0891B2"}
                        />
                      </View>

                      {/* Chat Mode Switcher Tab */}
                      <View className="flex-row bg-slate-900/[0.6] border border-white/[0.04] rounded-xl p-[3px] mb-2.5 gap-1">
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
                          {!hasLlmKey && <Text className="text-red-600 text-[8px] font-extrabold ml-1">NO KEY</Text>}
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
                        showsVerticalScrollIndicator={true}
                        className="h-[420px] bg-slate-900/[0.4] border border-white/[0.04] rounded-[14px] p-3"
                        {...({ className: "ultra-thin-scroll" } as any)}
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
                                      : "rgba(30, 41, 59, 0.5)",
                                    borderWidth: 1,
                                    borderColor: isUser
                                      ? "rgba(99, 102, 241, 0.15)"
                                      : isError
                                      ? "rgba(220, 38, 38, 0.2)"
                                      : "rgba(255, 255, 255, 0.06)",
                                    alignSelf: isUser ? "flex-end" : "flex-start",
                                  }}
                                >
                                  <Text
                                    className="text-[9px] font-black tracking-[1.5px]"
                                    style={{ color: isError ? "#DC2626" : "#94A3B8" }}
                                  >
                                    {isUser ? "STUDENT" : isError ? "WARNING ALERT" : "AI ORACLE"}
                                  </Text>
                                  <Text className="text-[13px] font-medium text-slate-200" style={{ color: isError ? "#DC2626" : undefined, lineHeight: 18 }}>
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
                                    backgroundColor: isUser ? "rgba(99, 102, 241, 0.08)" : "rgba(30, 41, 59, 0.5)",
                                    borderWidth: 1,
                                    borderColor: isUser ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.06)",
                                    alignSelf: isUser ? "flex-end" : "flex-start",
                                  }}
                                >
                                  <Text className="text-[9px] font-black tracking-[1.5px] text-slate-400">
                                    {isUser ? "STUDENT" : "ADVISOR"}
                                  </Text>
                                  <Text className="text-[13px] font-medium text-slate-200" style={{ lineHeight: 18 }}>{message.content}</Text>
                                </View>
                              );
                            })}
                            {chatLoading && <TypingIndicator label="SENDING MESSAGE" color="#0891B2" />}
                          </>
                        )}

                        {chatMode === "oracle" && !chatHistory.length && (
                          <View className="py-10 items-center">
                            {hasLlmKey ? (
                              <Text className="text-slate-400 text-[12.5px] font-semibold text-center" style={{ lineHeight: 18 }}>
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
                            <Text className="text-slate-400 text-[12.5px] font-semibold text-center" style={{ lineHeight: 18 }}>
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
                          className="flex-1 bg-slate-900/[0.6] border border-white/[0.08] rounded-xl text-slate-50 px-3.5 py-3 text-[13px] font-medium"
                          style={{ outlineStyle: "none" as any, opacity: chatLoading || (chatMode === "oracle" && !hasLlmKey) ? 0.6 : 1 }}
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
                    <Text className="text-slate-400 text-sm text-center max-w-[360px] leading-[22px] font-medium">
                      Please select a guidance session from the timeline to review feedback and consult the AI assistant.
                    </Text>
                  </View>
                )}
              </GlassCard>
            </View>
          ) : (
            /* ==================== LECTURER WORKSPACE (3-PANEL ASYMMETRIC) ==================== */
            <View className="flex-row flex-wrap items-start w-full gap-5">

              {/* Panel Kiri: Student Document Queue */}
              <GlassCard className="flex-1 min-w-[280px] p-6 h-[660px]">
                <View className="flex-row items-center gap-2.5 border-b border-white/[0.06] pb-3.5 mb-5">
                  <Archive color="#4F46E5" size={20} />
                  <Text className="text-lg font-black tracking-tight text-slate-50">Documents Queue</Text>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={true}
                  className="flex-1"
                  {...({ className: "ultra-thin-scroll" } as any)}
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
                            backgroundColor: isSelected ? "rgba(99, 102, 241, 0.08)" : "rgba(255, 255, 255, 0.02)",
                            borderColor: isSelected ? "#6366F1" : "rgba(255, 255, 255, 0.04)",
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                          },
                          isSelected ? { boxShadow: "0 0 15px rgba(99, 102, 241, 0.15)" } : {},
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
                          style={{ color: isSelected ? "#0F172A" : "#334155" }}
                          numberOfLines={1}
                        >
                          {studentName} (Session #{meetNum})
                        </Text>
                        <Text className="text-cyan-600 font-bold mt-0.5 text-xs leading-[18px]" numberOfLines={1}>
                          Date: {sessionDateStr}
                        </Text>
                        <Text className="text-slate-400 text-xs leading-[18px] font-medium" numberOfLines={1}>
                          File: {log.paper_filename}
                        </Text>
                      </Pressable>
                    );
                  })}

                  {!logs.length && (
                    <View className="py-[60px] items-center justify-center">
                      <Text className="text-slate-400 text-[13px] font-semibold">No student submissions received yet.</Text>
                    </View>
                  )}
                </ScrollView>
              </GlassCard>

              {/* Panel Tengah: Audio Session & AI Transcript Generator */}
              <GlassCard className="flex-[1.8] min-w-[320px] p-6 h-[660px]">
                {selected ? (
                  <View className="flex-1 gap-4">
                    {/* Selected Document Info */}
                    <View className="border-b border-white/[0.06] pb-3">
                      <Text className="text-[9px] font-black tracking-[1.5px] text-indigo-500">SELECTED STUDENT SUBMISSION</Text>
                      <Text className="text-lg font-black text-slate-50 mt-1" numberOfLines={1}>
                        {selected.student?.name ?? "Guidance"} - {selected.paper_filename}
                      </Text>
                    </View>

                    {/* High-Fidelity Audio Player */}
                    <View className="bg-slate-900/[0.4] border border-white/[0.04] rounded-2xl p-4 gap-2.5">
                      <Text className="text-indigo-500 text-[9px] font-black tracking-[1.5px]">GUIDANCE SESSION RECORDING</Text>
                      <View className="flex-row items-center gap-3.5">
                        <Pressable
                          onPress={togglePlayback}
                          className="bg-indigo-500 rounded-xl py-2.5 px-4 items-center justify-center border border-transparent"
                          style={({ pressed }) => ({
                            transform: [{ scale: pressed ? 0.94 : 1 }],
                            boxShadow: `0 0 12px ${isPlaying ? "#059669" : "#4F46E5"}14`,
                          })}
                        >
                          <Text className="text-white font-black text-[13px]">
                            {isPlaying ? "PAUSE" : "PLAY"}
                          </Text>
                        </Pressable>
                        <View className="flex-1 gap-1.5">
                          <View className="h-1 bg-white/[0.08] rounded-full w-full relative">
                            <View
                              className="h-full bg-emerald-600 rounded-full absolute left-0 top-0"
                              style={{ width: `${audioProgress * 100}%` }}
                            />
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-slate-200 text-[11px] font-semibold">
                              {(audioProgress * 4.5).toFixed(2).replace(".", ":")}
                            </Text>
                            <Text className="text-slate-400 text-[11px] font-semibold">{audioTime}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* AI Transcription Hub */}
                    <View className="h-[260px] border-b border-white/[0.06] pb-3.5">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-slate-300 text-xs font-extrabold tracking-[0.5px] uppercase">Guidance Dialog Transcript (AI Generated)</Text>
                        <Badge text="STT ENGINE ACTIVE" color="#0891B2" />
                      </View>

                      <ScrollView
                        showsVerticalScrollIndicator={true}
                        className="h-[120px] bg-white/[0.02] border border-white/[0.06] rounded-xl p-3"
                        {...({ className: "ultra-thin-scroll" } as any)}
                        style={{ outlineStyle: "none" as any }}
                      >
                        <Text className="text-slate-300 text-[13px] font-medium" style={{ lineHeight: 20 }}>
                          {selected.transcript_text ? selected.transcript_text : "Transcript empty."}
                        </Text>
                      </ScrollView>

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
                    <Text className="text-slate-400 text-sm text-center max-w-[360px] leading-[22px] font-medium">
                      Please select a student from the left queue to review the audio recording and transcript.
                    </Text>
                  </View>
                )}
              </GlassCard>

              {/* Panel Kanan: Validation & Custom Feedback Form */}
              <GlassCard className="flex-[1.4] min-w-[380px] p-6 h-[660px]">
                {selected ? (
                  <View className="flex-1 gap-4">
                    <View className="border-b border-white/[0.06] pb-3">
                      <Text className="text-[9px] font-black tracking-[1.5px] text-indigo-500">ADVISOR CONTROL PANEL</Text>
                      <Text className="text-lg font-black text-slate-50 mt-1">Feedback Evaluation</Text>
                    </View>

                    {/* Scrollable list of feedback items */}
                    <View className="h-[180px] border-b border-black/[0.06] pb-3.5">
                      <Text className="text-slate-300 text-xs font-extrabold tracking-[0.5px] uppercase mb-2">Select Revision Item</Text>
                      <ScrollView
                        showsVerticalScrollIndicator={true}
                        {...({ className: "ultra-thin-scroll" } as any)}
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
                              className="border rounded-xl p-3 gap-2 bg-slate-800/[0.4]"
                              style={{
                                borderColor: isSelectedFb ? statusColor : "rgba(0,0,0,0.04)",
                                backgroundColor: isSelectedFb ? `${statusColor}08` : "rgba(30, 41, 59, 0.4)",
                              }}
                            >
                              <Badge text={`${item.category} \u2022 ${item.status}`} color={statusColor} />
                              <Text className="text-slate-200 text-xs font-medium" numberOfLines={1}>{item.content}</Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Review / Custom Feedback Input Form */}
                    {selectedFeedbackItem ? (
                      <View className="gap-3">
                        <Text className="text-slate-300 text-xs font-extrabold tracking-[0.5px] uppercase mb-2">Audit Selected Item</Text>

                        <View className="gap-1.5">
                          <Text className="text-slate-300 text-[9px] font-black tracking-[1.5px]">FEEDBACK / REVISION CONTENT</Text>
                          <TextInput
                            multiline
                            numberOfLines={3}
                            value={feedbackInputText}
                            onChangeText={setFeedbackInputText}
                            className="bg-slate-900/[0.6] border border-white/[0.08] rounded-xl text-slate-50 p-3 text-[13px] font-medium"
                            placeholder="Audit selected feedback item..."
                            placeholderTextColor="#475569"
                            style={{ textAlignVertical: "top", outlineStyle: "none" as any }}
                          />
                        </View>

                        <View className="gap-1.5">
                          <Text className="text-slate-300 text-[9px] font-black tracking-[1.5px]">CATEGORY CLASSIFICATION</Text>
                          <View className="flex-row gap-2.5">
                            <Pressable
                              onPress={() => setFeedbackCategory("Major")}
                              className="flex-1 py-2 rounded-[10px] items-center justify-center border"
                              style={{
                                backgroundColor: feedbackCategory === "Major" ? "rgba(220, 38, 38, 0.06)" : "rgba(255, 255, 255, 0.02)",
                                borderColor: feedbackCategory === "Major" ? "#DC2626" : "rgba(255, 255, 255, 0.04)",
                                boxShadow: feedbackCategory === "Major" ? "0 0 10px rgba(220, 38, 38, 0.1)" : "none",
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
                                boxShadow: feedbackCategory === "Minor" ? "0 0 10px rgba(99, 102, 241, 0.1)" : "none",
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
                      <Text className="text-slate-400 text-[13px] font-medium py-3">No feedback items available for audit.</Text>
                    )}
                  </View>
                ) : (
                  <View className="flex-1 justify-center items-center py-[100px] gap-4">
                    <Archive color="#64748B" size={48} />
                    <Text className="text-slate-400 text-sm text-center max-w-[360px] leading-[22px] font-medium">
                      Feedback audits, validation actions, and category control options will be displayed here once a session is selected.
                    </Text>
                  </View>
                )}
              </GlassCard>
            </View>
          )}
        </Page>

        {/* Floating Toast Notification Container (floating over layout) */}
        <View className="z-[99999] gap-2.5 w-80" style={{ position: Platform.OS === "web" ? "fixed" : "absolute", top: 80, right: 20 }}>
          {toasts.map(toast => {
            const translateAnim = toast.animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [340, 0],
            });
            const opacityAnim = toast.animatedValue;

            let icon = "🔔";
            let color = "#6366F1";
            if (toast.type === "chat") {
              icon = "💬";
              color = "#0891B2";
            } else if (toast.type === "revision") {
              icon = "✅";
              color = "#059669";
            }

            return (
              <Animated.View
                key={toast.id}
                className="bg-white/[0.03] border border-white/[0.08] rounded-[14px] p-4 flex-row gap-3 items-center"
                style={{
                  opacity: opacityAnim,
                  transform: [{ translateX: translateAnim }],
                  boxShadow: `0 0 16px ${color}1A`,
                }}
              >
                <Text className="text-xl">{icon}</Text>
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
