import React, { useEffect, useMemo, useState } from "react";
import { Text, View, ScrollView, Pressable, Platform } from "react-native";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/src/lib/animations";
import { Archive, AlertCircle, CheckCircle, Clock, User, ChevronDown, ChevronRight } from "lucide-react";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Heading, Page, Badge } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import type { ConsultationLog, StudentProfile } from "@/src/types";
import { API_URL } from "@/src/lib/config";

// ─── Timeline Item (Session Card) ─────────────────────────────
function TimelineItem({ log, sessionNumber }: { log: ConsultationLog; sessionNumber: number }) {
  const [activeTab, setActiveTab] = useState<"feedback" | "transcript" | "annotations">("feedback");
  const [expanded, setExpanded] = useState(false);
  const isAllValidated = !log.feedback_items || log.feedback_items.length === 0 || log.feedback_items.every((item) => item.status === "Validated");
  const statusLabel = isAllValidated ? "APPROVED" : "REVISION REQUIRED";
  const statusColor = isAllValidated ? "#0F766E" : "#D97706";
  const annotationCount = log.revision_annotations?.length ?? 0;
  const feedbackCount = log.feedback_items?.length ?? 0;
  const validatedCount = log.feedback_items?.filter((f) => f.status === "Validated").length ?? 0;

  return (
    <View className="relative pl-9">
      {/* Timeline dot */}
      <View
        className="absolute left-1.5 top-6 w-3 h-3 rounded-full z-[2]"
        style={{ backgroundColor: statusColor, shadowColor: statusColor, elevation: 4, boxShadow: Platform.OS === "web" ? "0 0 8px currentColor" : undefined } as any}
      />

      <GlassCard className="p-[22px] gap-4">
        {/* Header: session info + expand toggle */}
        <Pressable
          onPress={() => setExpanded(!expanded)}
          className="flex-row justify-between items-start gap-3"
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <View className="flex-1 gap-2">
            <View className="flex-row items-center gap-2.5 flex-wrap">
              <View className="bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)] rounded-lg px-2.5 py-1">
                <Text className="text-[10px] font-black tracking-wider text-[#6366F1]">SESSION #{sessionNumber}</Text>
              </View>
              <Badge text={statusLabel} color={statusColor} />
            </View>
            <Text className="text-sm font-bold text-[#F8FAFC]" numberOfLines={1}>
              {log.paper_filename}
            </Text>
            <View className="flex-row items-center gap-4 flex-wrap">
              <View className="flex-row items-center gap-1.5">
                <Clock color="#94A3B8" size={12} />
                <Text className="text-[11px] font-semibold text-[#94A3B8]">
                  {new Date(log.created_at).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[11px] font-semibold text-[#94A3B8]">
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
          <View className="gap-4 pt-2 border-t border-white/[0.06]">
            {/* Download links */}
            <View className="flex-row gap-3 flex-wrap">
              <Pressable
                onPress={() => Platform.OS === "web" && window.open(`${API_URL}/storage/paper/${encodeURIComponent(log.paper_filename)}`)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text className="text-[11px] font-bold text-[#3B82F6] underline">
                  Download Draft
                </Text>
              </Pressable>
              {log.revised_document_filename && (
                <Pressable
                  onPress={() => Platform.OS === "web" && window.open(`${API_URL}/storage/revised/${encodeURIComponent(log.revised_document_filename)}`)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text className="text-[11px] font-bold text-[#7C3AED] underline">
                    Download Revised Draft
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Tab switcher */}
            <View className="flex-row gap-2 border-b border-white/[0.08] pb-2">
              <Pressable
                onPress={() => setActiveTab("feedback")}
                className={`flex-1 py-2 rounded-lg items-center justify-center border border-transparent ${
                  activeTab === "feedback"
                    ? "bg-[#6366F1] border-[rgba(99,102,241,0.1)] shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
                    : "bg-transparent"
                }`}
              >
                <Text className={`text-[11px] font-bold ${activeTab === "feedback" ? "text-white" : "text-[#94A3B8]"}`}>
                  Feedback ({feedbackCount})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("transcript")}
                className={`flex-1 py-2 rounded-lg items-center justify-center border border-transparent ${
                  activeTab === "transcript"
                    ? "bg-[#6366F1] border-[rgba(99,102,241,0.1)] shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
                    : "bg-transparent"
                }`}
              >
                <Text className={`text-[11px] font-bold ${activeTab === "transcript" ? "text-white" : "text-[#94A3B8]"}`}>
                  Transcript
                </Text>
              </Pressable>
              {annotationCount > 0 && (
                <Pressable
                  onPress={() => setActiveTab("annotations")}
                  className={`flex-1 py-2 rounded-lg items-center justify-center border ${
                    activeTab === "annotations"
                      ? "bg-[rgba(99,102,241,0.08)] border-[rgba(99,102,241,0.25)]"
                      : "bg-transparent border-transparent"
                  }`}
                >
                  <Text className={`text-[11px] font-bold ${activeTab === "annotations" ? "text-[#6366F1]" : "text-[#94A3B8]"}`}>
                    Annotations ({annotationCount})
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Tab content */}
            {activeTab === "feedback" ? (
              <View>
                {feedbackCount > 0 ? (
                  <View className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                    <View className="gap-2">
                      {log.feedback_items.map((item) => (
                        <View key={item.id} className="gap-1.5 border-b border-white/[0.04] pb-2">
                          <View className="flex-row justify-between items-center gap-2.5">
                            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.status === "Validated" ? "#0F766E" : item.status === "Fixed" ? "#3B82F6" : "#D97706" }} />
                            <View className="flex-1">
                              <Text className="text-[13px] font-medium text-[#CBD5E1]" numberOfLines={2}>
                                {item.content}
                              </Text>
                              <View className="flex-row gap-1.5 mt-1 items-center">
                                <Badge text={item.category} color={item.category === "Major" ? "#DC2626" : "#3B82F6"} />
                                <Badge
                                  text={item.status === "Validated" ? "APPROVED" : item.status === "Fixed" ? "RESOLVED" : "PENDING"}
                                  color={item.status === "Validated" ? "#0F766E" : item.status === "Fixed" ? "#3B82F6" : "#D97706"}
                                />
                              </View>
                            </View>
                          </View>
                          {item.fix_proof_text ? (
                            <View className="ml-4 bg-emerald-500/[0.04] border border-emerald-500/[0.12] rounded-lg p-2 gap-1">
                              <Text className="text-emerald-500 text-[8px] font-black tracking-[1.5px]">FIX DESCRIPTION</Text>
                              <Text className="text-[#CBD5E1] text-[11px] font-medium" style={{ lineHeight: 16 }}>
                                {item.fix_proof_text}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-2.5 bg-[rgba(20,184,166,0.05)] border border-[rgba(20,184,166,0.15)] p-3.5 rounded-xl">
                    <CheckCircle color="#0F766E" size={18} />
                    <Text className="text-[12px] font-semibold text-[#14B8A6]">All drafts approved. No revision notes.</Text>
                  </View>
                )}
              </View>
            ) : activeTab === "transcript" ? (
              <ScrollView
                showsVerticalScrollIndicator={true}
                className="h-[180px] bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 ultra-thin-scroll"
                style={{ outlineStyle: "none" } as any}
              >
                <Text className="text-[13px] leading-[22px] font-medium text-[#CBD5E1]">
                  {log.transcript_text || "Audio transcript for this session is empty or has not finished processing."}
                </Text>
              </ScrollView>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={true}
                className="max-h-[320px] ultra-thin-scroll"
              >
                <View className="gap-3">
                  {(log.revision_annotations ?? []).map((ann, idx) => (
                    <View key={ann.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 gap-2">
                      <View className="flex-row items-center gap-2.5">
                        <View className="flex-1">
                          <Text className="text-[11px] font-bold text-[#F8FAFC]" numberOfLines={1}>{ann.filename}</Text>
                          <Text className="text-[10px] text-[#64748B] mt-0.5">
                            {ann.file_type === "image" ? "Lecturer Corrected Document" : "DOCX Track Changes"}
                          </Text>
                        </View>
                        <Badge text={`Correction #${idx + 1}`} color="#6366F1" />
                      </View>
                      {ann.file_type === "image" && Platform.OS === "web" && (
                        <img
                          src={`${API_URL}/storage/annotations/${ann.filename}`}
                          alt={ann.filename}
                          style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, opacity: 0.92 } as any}
                          onError={(e: any) => { e.target.style.display = "none"; }}
                        />
                      )}
                      <View className="bg-white/[0.02] border border-white/[0.04] rounded-[10px] p-2.5 gap-1">
                        <Text className="text-[9px] font-black tracking-[1.5px] text-[#6366F1]">EXTRACTED CONTENT</Text>
                        <ScrollView showsVerticalScrollIndicator className="max-h-[100px] ultra-thin-scroll">
                          <Text className="text-[12px] leading-5 font-normal text-[#CBD5E1]">
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
      className={`rounded-2xl border p-4 gap-3 transition-all ${
        isSelected
          ? "bg-indigo-500/[0.08] border-indigo-500/[0.25]"
          : "bg-white/[0.02] border-white/[0.06]"
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
          <User color={isSelected ? "#ffffff" : "#94A3B8"} size={16} />
        </View>
        <View className="flex-1">
          <Text className={`text-sm font-extrabold tracking-tight ${isSelected ? "text-white" : "text-slate-50"}`} numberOfLines={1}>
            {student.name}
          </Text>
          <Text className="text-slate-400 text-[11px] font-semibold mt-0.5">NIM: {student.nim}</Text>
        </View>
      </View>

      <View className="flex-row justify-between bg-white/[0.02] rounded-[10px] p-2.5 border border-white/[0.04]">
        <View className="items-center gap-0.5">
          <Text className="text-slate-50 text-base font-black tracking-tight">{sessionCount}</Text>
          <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.5px]">Sessions</Text>
        </View>
        <View className="items-center gap-0.5">
          <Text className={`text-base font-black tracking-tight ${validatedCount > 0 ? "text-emerald-500" : "text-slate-50"}`}>{validatedCount}</Text>
          <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.5px]">Approved</Text>
        </View>
        <View className="items-center gap-0.5">
          <Text className={`text-base font-black tracking-tight ${pendingCount > 0 ? "text-amber-500" : "text-slate-50"}`}>{pendingCount}</Text>
          <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.5px]">Pending</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Archive Screen ──────────────────────────────────────
export default function ArchiveScreen() {
  const { api, accessToken, booting, user } = useAuth();
  const [logs, setLogs] = useState<ConsultationLog[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "validated" | "pending">("all");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const isLecturer = user?.role === "lecturer";

  useEffect(() => {
    if (booting || !accessToken) return;

    api<{ data: ConsultationLog[] }>("/logs")
      .then((response) => {
        setLogs(response.data);
        // Auto-select first student for lecturers
        if (isLecturer && response.data.length > 0) {
          const firstStudentId = response.data[0]?.student_id;
          if (firstStudentId) setSelectedStudentId(firstStudentId);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load archive"));
  }, [api, booting, accessToken, isLecturer]);

  // ── Extract unique students from logs (lecturer only) ──
  const students = useMemo(() => {
    if (!isLecturer) return [];
    const map = new Map<number, StudentProfile>();
    logs.forEach((log) => {
      if (log.student && !map.has(log.student.id)) {
        map.set(log.student.id, log.student);
      }
    });
    return Array.from(map.values());
  }, [logs, isLecturer]);

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

  // ── Filter logs by student (lecturer) and status ──
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Lecturer: filter by selected student
    if (isLecturer && selectedStudentId !== null) {
      result = result.filter((l) => l.student_id === selectedStudentId);
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
  }, [logs, isLecturer, selectedStudentId, filter]);

  // ── Selected student info (for header) ──
  const selectedStudent = useMemo(() => {
    if (!isLecturer || selectedStudentId === null) return null;
    return students.find((s) => s.id === selectedStudentId) ?? null;
  }, [isLecturer, selectedStudentId, students]);

  return (
    <RequireAuth>
      <Page>
        <NavBar />

        <Heading
          title={isLecturer ? "Student Consultation Archive" : "My Consultation Archive"}
          subtitle={
            isLecturer
              ? "Browse consultation history organized by individual student. Select a student to view their guidance timeline."
              : "Review your guidance transcript documents, revision notes, and thesis draft history."
          }
        />

        {error ? (
          <GlassCard className="flex-row items-center gap-3 bg-[rgba(239,68,68,0.06)] border-[rgba(239,68,68,0.15)] p-4 mb-2">
            <AlertCircle color="#DC2626" size={20} />
            <Text className="text-sm font-semibold text-[#DC2626]">{error}</Text>
          </GlassCard>
        ) : null}

        {isLecturer ? (
          /* ══════════════════════════════════════════════════════════
             LECTURER VIEW: Student Sidebar + Grouped Timeline
             ══════════════════════════════════════════════════════════ */
          <View className="flex-row gap-5 items-start">
            {/* Left Panel: Student Roster */}
            <GlassCard className="w-[320px] min-w-[280px] p-6 shrink-0 h-[700px]">
              <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-5">
                <User color="#4F46E5" size={18} />
                <Text className="text-slate-50 text-base font-black tracking-tight">Student Roster</Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={true}
                className="flex-1"
                {...({ className: "ultra-thin-scroll" } as any)}
                contentContainerStyle={{ gap: 10 }}
              >
                {students.length === 0 ? (
                  <View className="py-10 items-center justify-center gap-3">
                    <User color="#64748B" size={28} />
                    <Text className="text-slate-500 text-[13px] font-semibold text-center">No students with consultation sessions.</Text>
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

            {/* Right Panel: Student Timeline */}
            <View className="flex-1 gap-4 min-w-0">
              {/* Student Header */}
              {selectedStudent && (
                <GlassCard className="p-5">
                  <View className="flex-row items-center gap-3.5">
                    <View className="w-[42px] h-[42px] rounded-full bg-indigo-500/[0.06] border border-indigo-500/[0.15] items-center justify-center">
                      <User color="#6366F1" size={22} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-50 text-lg font-black tracking-tight">{selectedStudent.name}</Text>
                      <Text className="text-slate-400 text-xs font-semibold mt-0.5">
                        NIM: {selectedStudent.nim} · {selectedStudent.prodi}
                      </Text>
                    </View>
                    {selectedStudent.thesis_title && (
                      <View className="flex-1 mr-2.5 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                        <Text className="text-slate-400 text-[9px] font-extrabold tracking-widest uppercase mb-0.5">THESIS TITLE</Text>
                        <Text className="text-slate-300 text-xs font-semibold" numberOfLines={2}>{selectedStudent.thesis_title}</Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              )}

              {/* Filter pills */}
              <View className="flex-row gap-3 flex-wrap">
                {(["all", "validated", "pending"] as const).map((f) => {
                  const count = f === "all"
                    ? filteredLogs.length
                    : f === "validated"
                    ? filteredLogs.filter((l) => !l.feedback_items || l.feedback_items.length === 0 || l.feedback_items.every((item) => item.status === "Validated")).length
                    : filteredLogs.filter((l) => l.feedback_items?.some((item) => item.status !== "Validated")).length;
                  const label = f === "all" ? "All Sessions" : f === "validated" ? "Approved" : "Revision Required";
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setFilter(f)}
                      className={`py-2 px-4 rounded-full border transition-all ${
                        filter === f
                          ? "bg-[#6366F1] border-[#6366F1]"
                          : "bg-white/[0.02] border-white/[0.06]"
                      }`}
                      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}
                    >
                      <Text className={`text-[12px] font-bold ${filter === f ? "text-white" : "text-[#94A3B8]"}`}>
                        {label} ({count})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Timeline */}
              <GlassCard className="p-7">
                <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-7">
                  <Archive color="#4F46E5" size={20} />
                  <Text className="text-xl font-black tracking-tight text-[#F8FAFC]">Consultation Timeline</Text>
                </View>

                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="gap-7 relative">
                  {filteredLogs.length > 0 && (
                    <View className="absolute left-[11px] top-3 bottom-6 w-0.5 bg-[rgba(99,102,241,0.12)] z-[1]" />
                  )}

                  {filteredLogs.map((log, idx) => (
                    <motion.div key={log.id} variants={staggerItem}>
                      <TimelineItem log={log} sessionNumber={filteredLogs.length - idx} />
                    </motion.div>
                  ))}

                  {!filteredLogs.length && (
                    <View className="py-[60px] items-center justify-center gap-3.5 w-full">
                      <Archive color="#94A3B8" size={32} />
                      <Text className="text-sm font-semibold text-[#64748B] text-center">
                        {selectedStudentId
                          ? "No consultation sessions found for this student with the selected filter."
                          : "Select a student from the roster to view their consultation history."}
                      </Text>
                    </View>
                  )}
                </motion.div>
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
                const count = f === "all"
                  ? logs.length
                  : f === "validated"
                  ? logs.filter((l) => !l.feedback_items || l.feedback_items.length === 0 || l.feedback_items.every((item) => item.status === "Validated")).length
                  : logs.filter((l) => l.feedback_items?.some((item) => item.status !== "Validated")).length;
                const label = f === "all" ? "All Sessions" : f === "validated" ? "Approved" : "Revision Required";
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    className={`py-2.5 px-[18px] rounded-full border ${
                      filter === f
                        ? "bg-[#6366F1] border-[#6366F1]"
                        : "bg-white/[0.02] border-white/[0.06]"
                    }`}
                    style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}
                  >
                    <Text className={`text-[13px] font-bold ${filter === f ? "text-white" : "text-[#94A3B8]"}`}>
                      {label} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Timeline */}
            <GlassCard className="p-7">
              <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-7">
                <Archive color="#4F46E5" size={20} />
                <Text className="text-xl font-black tracking-tight text-[#F8FAFC]">My Consultation History</Text>
              </View>

              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="gap-7 relative">
                {filteredLogs.length > 0 && (
                  <View className="absolute left-[11px] top-3 bottom-6 w-0.5 bg-[rgba(99,102,241,0.12)] z-[1]" />
                )}

                {filteredLogs.map((log, idx) => (
                  <motion.div key={log.id} variants={staggerItem}>
                    <TimelineItem log={log} sessionNumber={filteredLogs.length - idx} />
                  </motion.div>
                ))}

                {!filteredLogs.length && (
                  <View className="py-[60px] items-center justify-center gap-3.5 w-full">
                    <Archive color="#94A3B8" size={32} />
                    <Text className="text-sm font-semibold text-[#64748B] text-center">No consultation sessions found.</Text>
                  </View>
                )}
              </motion.div>
            </GlassCard>
          </View>
        )}
      </Page>
    </RequireAuth>
  );
}
