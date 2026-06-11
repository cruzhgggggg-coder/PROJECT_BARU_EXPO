import React, { useEffect, useState } from "react";
import { Text, View, ScrollView, Pressable, Platform } from "react-native";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/src/lib/animations";
import { Archive, AlertCircle, CheckCircle, Clock } from "lucide-react";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Heading, Page, Badge } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import type { ConsultationLog } from "@/src/types";
import { API_URL } from "@/src/lib/config";

function TimelineItem({ log }: { log: ConsultationLog }) {
  const [activeTab, setActiveTab] = useState<"feedback" | "transcript" | "annotations">("feedback");
  const isAllValidated = !log.feedback_items || log.feedback_items.length === 0 || log.feedback_items.every((item) => item.status === "Validated");
  const statusLabel = isAllValidated ? "APPROVED" : "REVISION REQUIRED";
  const statusColor = isAllValidated ? "#0F766E" : "#D97706";
  const annotationCount = log.revision_annotations?.length ?? 0;

  return (
    <View className="relative pl-9">
      <View
        className="absolute left-1.5 top-6 w-3 h-3 rounded-full z-[2]"
        style={{ backgroundColor: statusColor, shadowColor: statusColor, elevation: 4, boxShadow: Platform.OS === "web" ? "0 0 8px currentColor" : undefined } as any}
      />

      <GlassCard className="p-[22px] gap-4">
        <View className="flex-row justify-between items-start flex-wrap gap-3 pb-3 border-b border-white/[0.08]">
          <View className="flex-row items-center gap-2.5 flex-wrap">
            <Text className="text-base font-extrabold tracking-tight text-[#F8FAFC]" numberOfLines={1}>
              {log.paper_filename}
            </Text>
            <Badge text={statusLabel} color={statusColor} />
          </View>
          <View className="flex-row items-center gap-3 flex-wrap mt-1">
            <Text className="text-xs font-semibold text-[#94A3B8] mt-0.5">
              {new Date(log.created_at).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Text>
            <Pressable
              onPress={() => Platform.OS === "web" && window.open(`${API_URL}/storage/paper/${log.paper_filename}`)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text className="text-[11px] font-bold text-[#3B82F6] underline">
                Download Draft Document
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-row gap-2 border-b border-white/[0.08] pb-2 mb-2">
          <Pressable
            onPress={() => setActiveTab("feedback")}
            className={`flex-1 py-2.5 rounded-lg items-center justify-center border border-transparent ${
              activeTab === "feedback"
                ? "bg-[#6366F1] border-[rgba(99,102,241,0.1)] shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
                : "bg-transparent"
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === "feedback" ? "text-white" : "text-[#94A3B8]"}`}>
              Revision Items ({log.feedback_items ? log.feedback_items.length : 0})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("transcript")}
            className={`flex-1 py-2.5 rounded-lg items-center justify-center border border-transparent ${
              activeTab === "transcript"
                ? "bg-[#6366F1] border-[rgba(99,102,241,0.1)] shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
                : "bg-transparent"
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === "transcript" ? "text-white" : "text-[#94A3B8]"}`}>
              Audio Transcript
            </Text>
          </Pressable>
          {annotationCount > 0 && (
            <Pressable
              onPress={() => setActiveTab("annotations")}
              className={`flex-1 py-2.5 rounded-lg items-center justify-center border ${
                activeTab === "annotations"
                  ? "bg-[rgba(99,102,241,0.08)] border-[rgba(99,102,241,0.25)]"
                  : "bg-transparent border-transparent"
              }`}
            >
              <Text className={`text-xs font-bold ${activeTab === "annotations" ? "text-[#6366F1]" : "text-[#94A3B8]"}`}>
                Lecturer Correction Notes ({annotationCount})
              </Text>
            </Pressable>
          )}
        </View>

        {activeTab === "feedback" ? (
          <View className="mt-1">
            {log.feedback_items && log.feedback_items.length > 0 ? (
              <View className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                <View className="gap-2">
                  {log.feedback_items.map((item) => (
                    <View key={item.id} className="flex-row justify-between items-center gap-2.5 border-b border-white/[0.04] pb-1.5">
                      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.status === "Validated" ? "#0F766E" : item.status === "Fixed" ? "#3B82F6" : "#D97706" }} />
                      <View className="flex-1">
                        <Text className="text-[13px] font-medium text-[#CBD5E1] flex-1">
                          {item.content}
                        </Text>
                        <View className="flex-row gap-1.5 mt-1 items-center">
                          <Badge
                            text={item.category}
                            color={item.category === "Major" ? "#DC2626" : "#3B82F6"}
                          />
                          <Badge
                            text={item.status === "Validated" ? "APPROVED" : item.status === "Fixed" ? "RESOLVED BY STUDENT" : "PENDING"}
                            color={item.status === "Validated" ? "#0F766E" : item.status === "Fixed" ? "#3B82F6" : "#D97706"}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View className="flex-row items-center gap-2.5 bg-[rgba(20,184,166,0.05)] border border-[rgba(20,184,166,0.15)] p-3.5 rounded-xl">
                <CheckCircle color="#0F766E" size={20} />
                <Text className="text-[13px] font-semibold text-[#14B8A6]">All drafts approved. No revision notes for this session.</Text>
              </View>
            )}
          </View>
        ) : activeTab === "transcript" ? (
          <View className="mt-1">
            <View className="gap-2">
              <ScrollView
                showsVerticalScrollIndicator={true}
                className="h-[180px] bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 ultra-thin-scroll"
                style={{ outlineStyle: "none" } as any}
              >
                <Text className="text-[13.5px] leading-[22px] font-medium text-[#CBD5E1]">
                  {log.transcript_text ? log.transcript_text : "Audio transcript for this consultation session is empty or has not finished processing."}
                </Text>
              </ScrollView>
            </View>
          </View>
        ) : (
          <View className="mt-1">
            <ScrollView
              showsVerticalScrollIndicator={true}
              className="max-h-[320px] ultra-thin-scroll"
            >
              <View className="gap-3">
                {(log.revision_annotations ?? []).map((ann, idx) => (
                  <GlassCard key={ann.id} className="p-3 rounded-xl border border-white/[0.06] gap-2">
                    <View className="flex-row items-center gap-2.5">
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-[#F8FAFC]" numberOfLines={1}>
                          {ann.filename}
                        </Text>
                        <Text className="text-[10px] text-[#64748B] mt-0.5">
                          {ann.file_type === "image" ? "Lecturer Corrected Document" : "DOCX Track Changes"}
                        </Text>
                      </View>
                      <View className="bg-[rgba(99,102,241,0.06)] px-[7px] py-[3px] rounded-md border border-[rgba(99,102,241,0.1)]">
                        <Text className="text-[10px] font-bold text-[#6366F1]">Correction #{idx + 1}</Text>
                      </View>
                    </View>
                    {ann.file_type === "image" && Platform.OS === "web" && (
                      <img
                        src={`${API_URL}/storage/annotations/${ann.filename}`}
                        alt={ann.filename}
                        style={{
                          width: "100%",
                          maxHeight: 180,
                          objectFit: "cover",
                          borderRadius: 8,
                          marginBottom: 8,
                          opacity: 0.92,
                        } as any}
                        onError={(e: any) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <View className="bg-white/[0.02] border border-white/[0.06] rounded-[10px] p-2.5 gap-1.5">
                      <Text className="text-[9px] font-black tracking-[1.5px] text-[#6366F1]">CORRECTED CONTENT</Text>
                      <ScrollView
                        showsVerticalScrollIndicator
                        className="max-h-[120px] ultra-thin-scroll"
                      >
                        <Text className="text-[12.5px] leading-5 font-normal text-[#CBD5E1]">
                          {ann.extracted_text || "(No extracted text notes)"}
                        </Text>
                      </ScrollView>
                    </View>
                  </GlassCard>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </GlassCard>
    </View>
  );
}

export default function ArchiveScreen() {
  const { api, accessToken, booting } = useAuth();
  const [logs, setLogs] = useState<ConsultationLog[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "validated" | "pending">("all");

  useEffect(() => {
    if (booting || !accessToken) return;

    api<{ data: ConsultationLog[] }>("/logs")
      .then((response) => setLogs(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load archive"));
  }, [api, booting, accessToken]);

  const filteredLogs = logs.filter((log) => {
    const isAllValidated = !log.feedback_items || log.feedback_items.length === 0 || log.feedback_items.every((item) => item.status === "Validated");
    if (filter === "validated") return isAllValidated;
    if (filter === "pending") return !isAllValidated;
    return true;
  });

  return (
    <RequireAuth>
      <Page>
        <NavBar />

        <Heading
          title="Consultation Session Archive"
          subtitle="Review guidance transcript documents, file correction notes, and the history of thesis draft developments."
        />

        {error ? (
          <GlassCard className="flex-row items-center gap-3 bg-[rgba(239,68,68,0.06)] border-[rgba(239,68,68,0.15)] p-4 mb-2">
            <AlertCircle color="#DC2626" size={20} />
            <Text className="text-sm font-semibold text-[#DC2626]">{error}</Text>
          </GlassCard>
        ) : null}

        <View className="flex-row gap-3 flex-wrap w-full mb-2">
          <Pressable
            onPress={() => setFilter("all")}
            className={`py-2.5 px-[18px] rounded-full border ${
              filter === "all"
                ? "bg-[#6366F1] border-[#6366F1]"
                : "bg-white/[0.02] border-white/[0.06]"
            }`}
          >
            <Text className={`text-[13px] font-bold ${filter === "all" ? "text-white" : "text-[#94A3B8]"}`}>
              All Sessions ({logs.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("validated")}
            className={`py-2.5 px-[18px] rounded-full border ${
              filter === "validated"
                ? "bg-[#6366F1] border-[#6366F1]"
                : "bg-white/[0.02] border-white/[0.06]"
            }`}
          >
            <Text className={`text-[13px] font-bold ${filter === "validated" ? "text-white" : "text-[#94A3B8]"}`}>
              Approved ({logs.filter(l => !l.feedback_items || l.feedback_items.every(item => item.status === "Validated")).length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("pending")}
            className={`py-2.5 px-[18px] rounded-full border ${
              filter === "pending"
                ? "bg-[#6366F1] border-[#6366F1]"
                : "bg-white/[0.02] border-white/[0.06]"
            }`}
          >
            <Text className={`text-[13px] font-bold ${filter === "pending" ? "text-white" : "text-[#94A3B8]"}`}>
              Revision Required ({logs.filter(l => l.feedback_items?.some(item => item.status !== "Validated")).length})
            </Text>
          </Pressable>
        </View>

        <GlassCard className="p-7">
          <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-7">
            <Archive color="#4F46E5" size={20} />
            <Text className="text-xl font-black tracking-tight text-[#F8FAFC]">Consultation History</Text>
          </View>

          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="gap-7 relative">
            {filteredLogs.length > 0 && (
              <View className="absolute left-[11px] top-3 bottom-6 w-0.5 bg-[rgba(99,102,241,0.12)] z-[1]" />
            )}

            {filteredLogs.map((log) => (
              <motion.div key={log.id} variants={staggerItem}>
                <TimelineItem log={log} />
              </motion.div>
            ))}

            {!filteredLogs.length && (
              <View className="py-[60px] items-center justify-center gap-3.5 w-full">
                <Archive color="#94A3B8" size={32} />
                <Text className="text-sm font-semibold text-[#64748B] text-center">No recorded guidance history has been registered yet.</Text>
              </View>
            )}
          </motion.div>
        </GlassCard>
      </Page>
    </RequireAuth>
  );
}
