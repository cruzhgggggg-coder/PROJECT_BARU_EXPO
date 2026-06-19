import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, Text, View, ScrollView, Pressable, Platform, Linking, Image, TextInput } from "react-native";
import { MotionDiv } from "@/src/lib/motion";
import { motionPresets } from "@/src/lib/motion-config";
import { Archive, AlertCircle, CheckCircle, Clock, User, ChevronDown, ChevronRight, Search } from "lucide-react-native";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Heading, Page, Badge } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { useIsMobile } from "@/src/hooks";
import type { ConsultationLog, StudentProfile } from "@/src/types";
import { API_URL, getFileDownloadUrl } from "@/src/lib/config";

function TimelineItem({ log, sessionNumber }: { log: ConsultationLog; sessionNumber: number }) {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"feedback" | "transcript" | "annotations">("feedback");
  const [expanded, setExpanded] = useState(false);
  const isAllValidated = !log.feedback_items || log.feedback_items.length === 0 || log.feedback_items.every((item) => item.status === "Validated");
  const statusLabel = isAllValidated ? "APPROVED" : "REVISION REQUIRED";
  const statusColor = isAllValidated ? "#10B981" : "#F59E0B"; // Emerald vs Amber
  const annotationCount = log.revision_annotations?.length ?? 0;
  const feedbackCount = log.feedback_items?.length ?? 0;
  const validatedCount = log.feedback_items?.filter((f) => f.status === "Validated").length ?? 0;

  const isMobile = useIsMobile();

  return (
    <View className="relative pl-9">
      {/* Timeline dot */}
      <View
        className="absolute left-1.5 top-6 w-3 h-3 rounded-full z-[2]"
        style={
          Platform.OS === "web"
            ? ({ backgroundColor: statusColor, shadowColor: statusColor, elevation: 4, boxShadow: `0 0 8px ${statusColor}` } as any)
            : { backgroundColor: statusColor, shadowColor: statusColor, elevation: 4 }
        }
      />

      <GlassCard className={isMobile ? "p-4 gap-4" : "p-[22px] gap-4"}>
        {/* Header: session info + expand toggle */}
        <Pressable
          onPress={() => setExpanded(!expanded)}
          accessibilityLabel={expanded ? "Collapse session details" : "Expand session details"}
          accessibilityRole="button"
          className="flex-row justify-between items-start gap-3"
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <View className="flex-1 gap-2">
            <View className="flex-row items-center gap-2.5 flex-wrap">
              <View className="bg-tier-accent-primary/10 border border-tier-accent-primary/20 rounded-lg px-2.5 py-1">
                <Text className="text-[11px] font-bold tracking-wider text-tier-accent-primary">SESSION #{sessionNumber}</Text>
              </View>
              <Badge text={statusLabel} color={statusColor} />
            </View>
            <Text className="text-sm font-bold text-tier-text-primary" numberOfLines={1}>
              {log.paper_filename}
            </Text>
            <View className="flex-row items-center gap-4 flex-wrap">
              <View className="flex-row items-center gap-1.5">
                <Clock color="#94A3B8" size={12} />
                <Text className="text-[11px] font-semibold text-tier-text-secondary">
                  {new Date(log.created_at).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[11px] font-semibold text-tier-text-secondary">
                  {feedbackCount} feedback{feedbackCount !== 1 ? "s" : ""} · {validatedCount} validated
                </Text>
              </View>
            </View>
          </View>
          <View className="mt-1">
            {expanded ? (
              <ChevronDown color="#94A3B8" size={18} />
            ) : (
              <ChevronRight color="#94A3B8" size={18} />
            )}
          </View>
        </Pressable>

        {/* Expanded content */}
        {expanded && (
          <View className="gap-4 pt-2 border-t border-tier-border-subtle">
            {/* Download links */}
            <View className="flex-row gap-3 flex-wrap">
              <Pressable
                onPress={() => Linking.openURL(getFileDownloadUrl("paper", log.paper_filename, accessToken!))}
                accessibilityLabel="Download draft document"
                accessibilityRole="link"
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text className="text-[11px] font-bold text-tier-accent-blue underline">
                  Download Draft
                </Text>
              </Pressable>
              {log.revised_document_filename && (
                <Pressable
                  onPress={() => Linking.openURL(getFileDownloadUrl("revised", log.revised_document_filename || "", accessToken!))}
                  accessibilityLabel="Download revised draft"
                  accessibilityRole="link"
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text className="text-[11px] font-bold text-tier-accent-violet underline">
                    Download Revised Draft
                  </Text>
                </Pressable>
              )}
              {log.final_document_filename && (
                <Pressable
                  onPress={() => Linking.openURL(getFileDownloadUrl("final", log.final_document_filename || "", accessToken!))}
                  accessibilityLabel="Download final document"
                  accessibilityRole="link"
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text className="text-[11px] font-bold text-tier-accent-success underline">
                    Download Final Document
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Tab switcher */}
            <View className="flex-row gap-2 border-b border-tier-border-subtle pb-2">
              <Pressable
                onPress={() => setActiveTab("feedback")}
                accessibilityLabel={`Show feedback tab, ${feedbackCount} items`}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === "feedback" }}
                className={`flex-1 py-2.5 rounded-lg items-center justify-center border border-transparent ${
                  activeTab === "feedback"
                    ? "bg-tier-accent-primary border-tier-accent-primary/10 shadow-tier-xs"
                    : "bg-transparent"
                }`}
              >
                <Text className={`text-[11px] font-bold ${activeTab === "feedback" ? "text-white" : "text-tier-text-secondary"}`}>
                  Feedback ({feedbackCount})
                </Text>
              </Pressable>
              {Platform.OS === "web" && (
                <Pressable
                  onPress={() => setActiveTab("transcript")}
                  accessibilityLabel="Show transcript tab"
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === "transcript" }}
                  className={`flex-1 py-2.5 rounded-lg items-center justify-center border border-transparent ${
                    activeTab === "transcript"
                      ? "bg-tier-accent-primary border-tier-accent-primary/10 shadow-tier-xs"
                      : "bg-transparent"
                  }`}
                >
                  <Text className={`text-[11px] font-bold ${activeTab === "transcript" ? "text-white" : "text-tier-text-secondary"}`}>
                    Transcript
                  </Text>
                </Pressable>
              )}
              {annotationCount > 0 && (
                <Pressable
                  onPress={() => setActiveTab("annotations")}
                  accessibilityLabel={`Show annotations tab, ${annotationCount} items`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === "annotations" }}
                  className={`flex-1 py-2.5 rounded-lg items-center justify-center border ${
                    activeTab === "annotations"
                      ? "bg-tier-accent-primary/10 border-tier-accent-primary/20"
                      : "bg-transparent border-transparent"
                  }`}
                >
                  <Text className={`text-[11px] font-bold ${activeTab === "annotations" ? "text-tier-accent-primary" : "text-tier-text-secondary"}`}>
                    Annotations ({annotationCount})
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Tab content */}
            {activeTab === "feedback" ? (
              <View>
                {feedbackCount > 0 ? (
                  <View className="bg-tier-surface-sunken p-3 rounded-base border border-tier-border-subtle">
                    <View className="gap-2">
                      {log.feedback_items.map((item) => (
                        <View key={item.id} className="gap-1.5 border-b border-tier-border-subtle pb-2">
                          <View className="flex-row justify-between items-center gap-2.5">
                            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.status === "Validated" ? "#10B981" : item.status === "Fixed" ? "#6366F1" : "#F59E0B" }} />
                            <View className="flex-1">
                              <Text className="text-[13px] font-medium text-tier-text-primary" numberOfLines={2}>
                                {item.content}
                              </Text>
                              <View className="flex-row gap-1.5 mt-1 items-center">
                                <Badge text={item.category} color={item.category === "Major" ? "#F43F5E" : "#6366F1"} />
                                <Badge
                                  text={item.status === "Validated" ? "APPROVED" : item.status === "Fixed" ? "RESOLVED" : "PENDING"}
                                  color={item.status === "Validated" ? "#10B981" : item.status === "Fixed" ? "#6366F1" : "#F59E0B"}
                                />
                              </View>
                            </View>
                          </View>
                          {item.fix_proof_text ? (
                            <View className="ml-4 bg-tier-accent-emerald/10 border border-tier-accent-emerald/20 rounded-base p-2 gap-1">
                              <Text className="text-tier-accent-emerald text-[11px] font-bold tracking-[1.5px]">FIX DESCRIPTION</Text>
                              <Text className="text-tier-text-primary text-[11px] font-normal" style={{ lineHeight: 16 }}>
                                {item.fix_proof_text}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-2.5 bg-tier-accent-emerald/10 border border-tier-accent-emerald/20 p-3.5 rounded-base">
                    <CheckCircle color="#10B981" size={18} />
                    <Text className="text-[12px] font-semibold text-tier-accent-emerald">All drafts approved. No revision notes.</Text>
                  </View>
                )}
              </View>
            ) : activeTab === "transcript" ? (
              Platform.OS === "web" ? (
                <ScrollView
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  className="h-[180px] bg-tier-surface-sunken border border-tier-border-subtle rounded-base p-3.5"
                  style={Platform.OS === "web" ? { outlineStyle: "none" } as any : undefined}
                >
                  <Text className="text-[13px] leading-[22px] font-normal text-tier-text-primary">
                    {log.transcript_text || "Audio transcript for this session is empty or has not finished processing."}
                  </Text>
                </ScrollView>
              ) : null
            ) : (
              <ScrollView
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: 320 }}
              >
                <View className="gap-3">
                  {(log.revision_annotations ?? []).map((ann, idx) => (
                    <View key={ann.id} className="bg-tier-surface-sunken border border-tier-border-subtle rounded-base p-3 gap-2">
                      <View className="flex-row items-center gap-2.5">
                        <View className="flex-1">
                          <Text className="text-[11px] font-bold text-tier-text-primary" numberOfLines={1}>{ann.filename}</Text>
                          <Text className="text-[11px] text-tier-text-secondary mt-0.5">
                            {ann.file_type === "image" ? "Lecturer Corrected Document" : "DOCX Track Changes"}
                          </Text>
                        </View>
                        <Badge text={`Correction #${idx + 1}`} color="#6366F1" />
                      </View>
                      {ann.file_type === "image" && (
                        Platform.OS === "web" ? (
                          <img
                            src={`${API_URL}/storage/annotations/${ann.filename}`}
                            alt={ann.filename}
                            style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, opacity: 0.92 } as any}
                            onError={(e: any) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <Image source={{ uri: `${API_URL}/storage/annotations/${ann.filename}`, headers: { "Cache-Control": "max-age=3600" } }} style={{ width: "100%", height: 160, borderRadius: 8, opacity: 0.92, backgroundColor: "rgba(99,102,241,0.1)" }} resizeMode="cover" />
                        )
                      )}
                      <View className="bg-tier-surface-raised border border-tier-border-subtle rounded-base p-2.5 gap-1">
                        <Text className="text-[11px] font-bold tracking-[1.5px] text-tier-accent-primary">EXTRACTED CONTENT</Text>
                        <ScrollView
                          showsVerticalScrollIndicator
                          nestedScrollEnabled={true}
                          style={{ maxHeight: 100 }}
                        >
                          <Text className="text-[12px] leading-5 font-normal text-tier-text-primary">
                            {ann.extracted_text || "(No text extracted)"}
                          </Text>
                        </ScrollView>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        )}
      </GlassCard>
    </View>
  );
}

// ─── Student Card (Lecturer Sidebar) ──────────────────────────
function StudentCard({
  student,
  sessionCount,
  validatedCount,
  pendingCount,
  isSelected,
  onPress,
}: {
  student: StudentProfile;
  sessionCount: number;
  validatedCount: number;
  pendingCount: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Select student ${student.name}, ${sessionCount} sessions`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <GlassCard
        className={`p-4 gap-3 transition-all ${
          isSelected
            ? "border-tier-accent-primary bg-tier-accent-primary/5 shadow-tier-glow"
            : "border-tier-border-subtle bg-tier-bg-secondary"
        }`}
        style={isSelected ? { shadowColor: "#6366F1", shadowOpacity: 0.1, shadowRadius: 12 } : undefined}
      >
        <View className="flex-row items-center gap-3">
          <View className={`w-[34px] h-[34px] rounded-full items-center justify-center shrink-0 border ${
            isSelected
              ? "bg-tier-accent-primary border-tier-accent-primary"
              : "bg-tier-accent-primary/10 border-tier-accent-primary/20"
          }`}>
            <User color={isSelected ? "#ffffff" : "#94A3B8"} size={16} />
          </View>
          <View className="flex-1">
            <Text className={`text-sm font-bold tracking-tight ${isSelected ? "text-white" : "text-tier-text-primary"}`} numberOfLines={1}>
              {student.name}
            </Text>
            <Text className="text-tier-text-secondary text-[11px] font-semibold mt-0.5">NIM: {student.nim}</Text>
          </View>
        </View>

        <View className="flex-row justify-between bg-tier-surface-sunken rounded-sm p-2.5 border border-tier-border-subtle">
          <View className="items-center gap-0.5">
            <Text className="text-tier-text-primary text-base font-bold tracking-tight">{sessionCount}</Text>
            <Text className="text-tier-text-secondary text-[11px] font-bold uppercase tracking-[0.5px]">Sessions</Text>
          </View>
          <View className="items-center gap-0.5">
            <Text className={`text-base font-bold tracking-tight ${validatedCount > 0 ? "text-tier-accent-success" : "text-tier-text-primary"}`}>{validatedCount}</Text>
            <Text className="text-tier-text-secondary text-[11px] font-bold uppercase tracking-[0.5px]">Approved</Text>
          </View>
          <View className="items-center gap-0.5">
            <Text className={`text-base font-bold tracking-tight ${pendingCount > 0 ? "text-tier-accent-caution" : "text-tier-text-primary"}`}>{pendingCount}</Text>
            <Text className="text-tier-text-secondary text-[11px] font-bold uppercase tracking-[0.5px]">Pending</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

// ─── Main Archive Screen ──────────────────────────────────────
export default function ArchiveScreen() {
  const isMobile = useIsMobile();
  const { api, accessToken, booting, user } = useAuth();
  const [logs, setLogs] = useState<ConsultationLog[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "validated" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [mobileRosterOpen, setMobileRosterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isLecturer = user?.role === "lecturer";

  const loadLogs = useCallback(async () => {
    if (booting || !accessToken) return;
    try {
      const response = await api<{ data: ConsultationLog[] }>("/logs");
      setLogs(response.data);
      if (isLecturer && response.data.length > 0) {
        const firstStudentId = response.data[0]?.student_id;
        if (firstStudentId) setSelectedStudentId(firstStudentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load archive");
    }
  }, [api, booting, accessToken, isLecturer]);

  useEffect(() => {
    if (!mobileRosterOpen) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      setMobileRosterOpen(false);
      return true;
    });
    return () => handler.remove();
  }, [mobileRosterOpen]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  }, [loadLogs]);

  // ── Extract unique students from logs (lecturer only) ──
  const students = useMemo(() => {
    if (!isLecturer) return [];
    const map = new Map<number, StudentProfile>();
    logs.forEach((log) => {
      if (log.student && !map.has(log.student.id)) {
        map.set(log.student.id, log.student);
      }
    });
    
    let studentList = Array.from(map.values());
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      studentList = studentList.filter(
        (s) => s.name?.toLowerCase().includes(query) || s.nim?.toLowerCase().includes(query)
      );
    }
    return studentList;
  }, [logs, isLecturer, searchQuery]);

  // ── Compute per-student stats ──
  const studentStats = useMemo(() => {
    const stats: Record<number, { sessions: number; validated: number; pending: number }> = {};
    students.forEach((s) => {
      const studentLogs = logs.filter((l) => l.student_id === s.id);
      const validated = studentLogs.filter(
        (l) => l.feedback_items && l.feedback_items.length > 0 && l.feedback_items.every((f) => f.status === "Validated")
      ).length;
      const pending = studentLogs.length - validated;
      stats[s.id] = { sessions: studentLogs.length, validated, pending };
    });
    return stats;
  }, [students, logs]);

  // ── Compute counts for the status filter pills ──
  const filterCounts = useMemo(() => {
    let baseLogs = logs;
    if (isLecturer && selectedStudentId !== null) {
      baseLogs = baseLogs.filter((l) => l.student_id === selectedStudentId);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      baseLogs = baseLogs.filter((l) => {
        const paperMatch = l.paper_filename?.toLowerCase().includes(query) ?? false;
        const studentMatch = isLecturer ? (l.student?.name?.toLowerCase().includes(query) ?? false) : false;
        return paperMatch || studentMatch;
      });
    }

    const all = baseLogs.length;
    const validated = baseLogs.filter((l) => !l.feedback_items || l.feedback_items.length === 0 || l.feedback_items.every((item) => item.status === "Validated")).length;
    const pending = all - validated;

    return { all, validated, pending };
  }, [logs, isLecturer, selectedStudentId, searchQuery]);

  // ── Filter logs by student (lecturer) and status ──
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Lecturer: filter by selected student
    if (isLecturer && selectedStudentId !== null) {
      result = result.filter((l) => l.student_id === selectedStudentId);
    }

    // Search query filter (matches paper_filename, and student name for lecturers)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((l) => {
        const paperMatch = l.paper_filename?.toLowerCase().includes(query) ?? false;
        const studentMatch = isLecturer ? (l.student?.name?.toLowerCase().includes(query) ?? false) : false;
        return paperMatch || studentMatch;
      });
    }

    // Status filter
    result = result.filter((log) => {
      const isAllValidated = !log.feedback_items || log.feedback_items.length === 0 || log.feedback_items.every((item) => item.status === "Validated");
      if (filter === "validated") return isAllValidated;
      if (filter === "pending") return !isAllValidated;
      return true;
    });

    // Sort by date descending
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [logs, isLecturer, selectedStudentId, filter, searchQuery]);

  // ── Selected student info (for header) ──
  const selectedStudent = useMemo(() => {
    if (!isLecturer || selectedStudentId === null) return null;
    return students.find((s) => s.id === selectedStudentId) ?? null;
  }, [isLecturer, selectedStudentId, students]);

  return (
    <RequireAuth>
      <Page
        showFloatingShapes={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
        scrollable={true}
        contentContainerStyle={{ paddingHorizontal: isMobile ? 12 : 24, paddingVertical: isMobile ? 16 : 32 }}
      >
        <NavBar />

        <Heading
          title={isLecturer ? "Student Consultation Archive" : "My Consultation Archive"}
          subtitle={
            isLecturer
              ? "Browse consultation history organized by individual student. Select a student to view their guidance timeline."
              : "Review your guidance transcript documents, revision notes, and thesis draft history."
          }
        />

        {/* Global Search Input */}
        <GlassCard className="p-3.5 mb-2 border-tier-border-subtle">
          <View className="flex-row items-center gap-3 bg-tier-surface-sunken rounded-xl px-3.5 py-2.5 border border-tier-border-subtle focus-within:border-tier-accent-primary">
            <Search color="#94A3B8" size={18} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={isLecturer ? "Search by student name or draft filename..." : "Search by draft filename..."}
              placeholderTextColor="#64748B"
              className="flex-1 text-sm font-medium text-tier-text-primary p-0 h-[22px]"
              style={Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery("")}>
                <Text className="text-xs font-bold text-tier-accent-rose">Clear</Text>
              </Pressable>
            ) : null}
          </View>
        </GlassCard>

        {error ? (
          <GlassCard className="flex-row items-center gap-3 bg-tier-accent-danger/10 border-tier-accent-danger/20 p-4 mb-2">
            <AlertCircle color="#F43F5E" size={20} />
            <Text className="text-sm font-semibold text-tier-accent-danger-bright">{error}</Text>
          </GlassCard>
        ) : null}

        {isLecturer ? (
          /* ══════════════════════════════════════════════════════════
             LECTURER VIEW: Student Sidebar + Grouped Timeline
             ══════════════════════════════════════════════════════════ */
          <View className={isMobile ? "flex-col flex-1 min-h-0 gap-4" : "flex-row gap-5 items-start"}>
            {/* Left Panel: Student Roster */}
            {!isMobile ? (
              <GlassCard className="w-[320px] min-w-[280px] p-6 shrink-0" style={{ height: 700, flexShrink: 0 }}>
                <View className="flex-row items-center gap-2.5 border-b border-tier-border-subtle pb-4 mb-5">
                  <User color="#6366F1" size={18} />
                  <Text className="text-tier-text-primary text-base font-black tracking-tight">Student Roster</Text>
                </View>

                <ScrollView
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  className="flex-1"
                  contentContainerStyle={{ gap: 10 }}
                >
                  {students.length === 0 ? (
                    <View className="py-10 items-center justify-center gap-3">
                      <User color="#94A3B8" size={28} />
                      <Text className="text-tier-text-tertiary text-[13px] font-semibold text-center">No students found.</Text>
                    </View>
                  ) : (
                    students.map((student) => {
                      const stats = studentStats[student.id] || { sessions: 0, validated: 0, pending: 0 };
                      return (
                        <StudentCard
                          key={student.id}
                          student={student}
                          sessionCount={stats.sessions}
                          validatedCount={stats.validated}
                          pendingCount={stats.pending}
                          isSelected={selectedStudentId === student.id}
                          onPress={() => {
                            setSelectedStudentId(student.id);
                            setFilter("all");
                          }}
                        />
                      );
                    })
                  )}
                </ScrollView>
              </GlassCard>
            ) : (
              <GlassCard className="p-4" style={{ flexShrink: 0 }}>
                <Pressable
                  onPress={() => setMobileRosterOpen(!mobileRosterOpen)}
                  accessibilityLabel={mobileRosterOpen ? "Close student roster" : "Open student roster"}
                  accessibilityRole="button"
                  className="flex-row items-center justify-between"
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <View className="flex-row items-center gap-2.5">
                    <User color="#6366F1" size={18} />
                    <Text className="text-tier-text-primary text-base font-black tracking-tight">Student Roster</Text>
                    {selectedStudent && (
                      <Text className="text-tier-text-secondary text-xs font-semibold" numberOfLines={1}>
                        — {selectedStudent.name}
                      </Text>
                    )}
                  </View>
                  {mobileRosterOpen ? (
                    <ChevronDown color="#94A3B8" size={18} />
                  ) : (
                    <ChevronRight color="#94A3B8" size={18} />
                  )}
                </Pressable>

                {mobileRosterOpen && (
                  <ScrollView
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    className="mt-4 max-h-[400px]"
                    contentContainerStyle={{ gap: 10 }}
                  >
                    {students.length === 0 ? (
                      <View className="py-10 items-center justify-center gap-3">
                        <User color="#94A3B8" size={28} />
                        <Text className="text-tier-text-tertiary text-[13px] font-semibold text-center">No students found.</Text>
                      </View>
                    ) : (
                      students.map((student) => {
                        const stats = studentStats[student.id] || { sessions: 0, validated: 0, pending: 0 };
                        return (
                          <StudentCard
                            key={student.id}
                            student={student}
                            sessionCount={stats.sessions}
                            validatedCount={stats.validated}
                            pendingCount={stats.pending}
                            isSelected={selectedStudentId === student.id}
                            onPress={() => {
                              setSelectedStudentId(student.id);
                              setFilter("all");
                              setMobileRosterOpen(false);
                            }}
                          />
                        );
                      })
                    )}
                  </ScrollView>
                )}
              </GlassCard>
            )}

            {/* Right Panel: Student Timeline */}
            <View className="flex-1 gap-4 min-w-0">
              {/* Student Header */}
              {selectedStudent && (
                <GlassCard className="p-5">
                  <View className={`gap-3.5 ${isMobile ? "flex-col items-stretch" : "flex-row items-center"}`}>
                    <View className="flex-row items-center gap-3.5">
                      <View className="w-[42px] h-[42px] rounded-full bg-tier-accent-primary/10 border border-tier-accent-primary/20 items-center justify-center">
                        <User color="#6366F1" size={22} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-tier-text-primary text-lg font-black tracking-tight">{selectedStudent.name}</Text>
                        <Text className="text-tier-text-secondary text-xs font-semibold mt-0.5">
                          NIM: {selectedStudent.nim} · {selectedStudent.prodi}
                        </Text>
                      </View>
                    </View>
                    {selectedStudent.thesis_title && (
                      <View className={`${isMobile ? "w-full" : "flex-1 mr-2.5"} bg-tier-surface-sunken p-3 rounded-xl border border-tier-border-subtle`}>
                        <Text className="text-tier-text-secondary text-[11px] font-extrabold tracking-widest uppercase mb-0.5">THESIS TITLE</Text>
                        <Text className="text-tier-text-primary text-xs font-semibold" numberOfLines={2}>{selectedStudent.thesis_title}</Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              )}

              {/* Filter pills */}
              <View className="flex-row gap-3 flex-wrap">
                {(["all", "validated", "pending"] as const).map((f) => {
                  const count = f === "all" ? filterCounts.all : f === "validated" ? filterCounts.validated : filterCounts.pending;
                  const label = f === "all" ? "All Sessions" : f === "validated" ? "Approved" : "Revision Required";
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setFilter(f)}
                      accessibilityLabel={`Filter by ${label}, ${count} results`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: filter === f }}
                      className={`py-3 px-4 rounded-full border transition-all ${
                        filter === f
                          ? "bg-tier-accent-primary border-tier-accent-primary"
                          : "bg-tier-surface-sunken border-tier-border-subtle"
                      }`}
                      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}
                    >
                      <Text className={`text-[12px] font-bold ${filter === f ? "text-white" : "text-tier-text-secondary"}`}>
                        {label} ({count})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Timeline */}
              <GlassCard className={isMobile ? "p-4" : "p-7"}>
                <View className="flex-row items-center gap-2.5 border-b border-tier-border-subtle pb-4 mb-7">
                  <Archive color="#6366F1" size={20} />
                  <Text className="text-xl font-black tracking-tight text-tier-text-primary">Consultation Timeline</Text>
                </View>

                <MotionDiv {...motionPresets.fadeIn} className="gap-7 relative">
                  {filteredLogs.length > 0 && (
                    <View className="absolute left-[11px] top-3 bottom-6 w-0.5 bg-tier-accent-primary/20 z-[1]" />
                  )}

                  {filteredLogs.map((log, idx) => (
                    <MotionDiv key={log.id} {...motionPresets.fadeUp(idx)}>
                      <TimelineItem log={log} sessionNumber={filteredLogs.length - idx} />
                    </MotionDiv>
                  ))}

                  {!filteredLogs.length && (
                    <View className="py-[60px] items-center justify-center gap-3.5 w-full">
                      <Archive color="#94A3B8" size={32} />
                      <Text className="text-sm font-semibold text-tier-text-tertiary text-center">
                        {selectedStudentId
                          ? "No consultation sessions found for this student with the selected filter."
                          : "Select a student from the roster to view their consultation history."}
                      </Text>
                    </View>
                  )}
                </MotionDiv>
              </GlassCard>
            </View>
          </View>
        ) : (
          /* ══════════════════════════════════════════════════════════
             STUDENT VIEW: Personal Timeline
             ══════════════════════════════════════════════════════════ */
          <View className="gap-4">
            {/* Filter pills */}
            <View className="flex-row gap-3 flex-wrap">
              {(["all", "validated", "pending"] as const).map((f) => {
                const count = f === "all" ? filterCounts.all : f === "validated" ? filterCounts.validated : filterCounts.pending;
                const label = f === "all" ? "All Sessions" : f === "validated" ? "Approved" : "Revision Required";
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    accessibilityLabel={`Filter by ${label}, ${count} results`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: filter === f }}
                    className={`py-3 px-4 rounded-full border transition-all ${
                      filter === f
                        ? "bg-tier-accent-primary border-tier-accent-primary"
                        : "bg-tier-surface-sunken border-tier-border-subtle"
                    }`}
                    style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}
                  >
                    <Text className={`text-[13px] font-bold ${filter === f ? "text-white" : "text-tier-text-secondary"}`}>
                      {label} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Timeline */}
            <GlassCard className={isMobile ? "p-4" : "p-7"}>
              <View className="flex-row items-center gap-2.5 border-b border-tier-border-subtle pb-4 mb-7">
                <Archive color="#6366F1" size={20} />
                <Text className="text-xl font-black tracking-tight text-tier-text-primary">My Consultation History</Text>
              </View>

              <MotionDiv {...motionPresets.fadeIn} className="gap-7 relative">
                {filteredLogs.length > 0 && (
                  <View className="absolute left-[11px] top-3 bottom-6 w-0.5 bg-tier-accent-primary/20 z-[1]" />
                )}

                {filteredLogs.map((log, idx) => (
                  <MotionDiv key={log.id} {...motionPresets.fadeUp(idx)}>
                    <TimelineItem log={log} sessionNumber={filteredLogs.length - idx} />
                  </MotionDiv>
                ))}

                {!filteredLogs.length && (
                  <View className="py-[60px] items-center justify-center gap-3.5 w-full">
                    <Archive color="#94A3B8" size={32} />
                    <Text className="text-sm font-semibold text-tier-text-tertiary text-center">No consultation sessions found.</Text>
                  </View>
                )}
              </MotionDiv>
            </GlassCard>
          </View>
        )}
      </Page>
    </RequireAuth>
  );
}
