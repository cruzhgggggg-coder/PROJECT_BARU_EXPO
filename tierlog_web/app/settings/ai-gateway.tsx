import React, { useState, useEffect, useRef } from "react";
import { KeyboardAvoidingView, Platform as RNPlatform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Cpu, CheckCircle, AlertCircle, Clock, Key, Radio, Settings, Zap, ChevronDown, ChevronRight } from "lucide-react-native";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Button, Field, Heading, Page, Badge } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { useIsMobile } from "@/src/hooks";
import type { User } from "@/src/types";

const PROVIDER_MODELS: Record<string, { label: string; value: string; desc: string }[]> = {
  openai: [
    { label: "GPT-4o", value: "openai:gpt-4o", desc: "High-performance model, highly accurate on structural instructions." },
    { label: "GPT-4o Mini", value: "openai:gpt-4o-mini", desc: "Cost-effective, fast, and reliable model for general tasks." },
    { label: "GPT-4 Turbo", value: "openai:gpt-4-turbo", desc: "Legacy model with stable performance across standard tasks." },
  ],
  gemini: [
    { label: "Gemini 2.5 Flash", value: "gemini:gemini-2.5-flash", desc: "Recommended. Balanced speed and reasoning accuracy." },
    { label: "Gemini 2.5 Pro", value: "gemini:gemini-2.5-pro", desc: "Advanced model for deep academic reasoning and research." },
    { label: "Gemini 2.0 Flash", value: "gemini:gemini-2.0-flash", desc: "Ultra-low latency, ideal for interactive assistant dialog." },
    { label: "Gemini 1.5 Pro", value: "gemini:gemini-1.5-pro", desc: "Large context window, ideal for long manuscript audits." },
  ],
  anthropic: [
    { label: "Claude 3.5 Sonnet", value: "anthropic:claude-3-5-sonnet-20241022", desc: "State-of-the-Art. Superior capability for high-end academic writing." },
    { label: "Claude 3.5 Haiku", value: "anthropic:claude-3-5-haiku-20241022", desc: "Ultra-high speed with outstanding contextual comprehension." },
    { label: "Claude 3 Opus", value: "anthropic:claude-3-opus-20240229", desc: "Excellent for complex theoretical analysis and logic mapping." },
  ],
  nvidia: [
    { label: "Llama 3.2 Vision 11B", value: "nvidia:meta/llama-3.2-vision-11b-instruct", desc: "Meta's vision model — supports image OCR + text analysis in one model." },
    { label: "NVIDIA VILA", value: "nvidia:nvidia/vila", desc: "NVIDIA's Vision-Language model for image understanding & document OCR." },
    { label: "NVIDIA NEVA 22B", value: "nvidia:nvidia/neva-22b", desc: "NVIDIA's vision-focused model optimized for academic document analysis." },
  ],
};

const PROVIDER_INFO: Record<string, {
  name: string;
  placeholder: string;
  color: string;
  description: string;
  required?: boolean;
}> = {
  openai: {
    name: "OpenAI",
    placeholder: "sk-proj-...",
    color: "#6366F1",
    description: "GPT models for text generation, code, and analysis.",
  },
  gemini: {
    name: "Gemini",
    placeholder: "AIzaSy...",
    color: "#10B981",
    description: "Google's multimodal AI models for reasoning and research.",
  },
  anthropic: {
    name: "Anthropic",
    placeholder: "sk-ant-...",
    color: "#F59E0B",
    description: "Claude models for academic writing and complex analysis.",
  },
  nvidia: {
    name: "NVIDIA NIM",
    placeholder: "nvapi-...",
    color: "#8B5CF6",
    description: "Vision-Language models for image OCR and document analysis.",
  },
  groq: {
    name: "Groq",
    placeholder: "gsk_...",
    color: "#F43F5E",
    description: "Whisper STT for audio transcription (speech-to-text).",
    required: true,
  },
};

const PROVIDER_ORDER = ["openai", "gemini", "anthropic", "nvidia", "groq"];

const partitionModels = (modelsList: { label: string; value: string; desc: string }[]) => {
  if (modelsList.length <= 5) {
    return { primary: modelsList, secondary: [] as typeof modelsList };
  }
  const isVisionOrMain = (m: { label: string; value: string }) => {
    const v = m.value.toLowerCase();
    const l = m.label.toLowerCase();
    return (
      v.includes("vision") || v.includes("vila") || v.includes("neva") ||
      v.includes("gpt-4o") || v.includes("flash") || v.includes("sonnet") ||
      v.includes("pro") || l.includes("vision") || l.includes("vila") ||
      l.includes("neva")
    );
  };
  const visionModels = modelsList.filter(isVisionOrMain);
  const nonVisionModels = modelsList.filter((m) => !isVisionOrMain(m));
  const combined = [...visionModels, ...nonVisionModels];
  return {
    primary: combined.slice(0, 5),
    secondary: combined.slice(5),
  };
};

export default function AIGatewayScreen() {
  const isMobile = useIsMobile();
  const { api, user, setUser } = useAuth();
  const [openaiKey, setOpenaiKey] = useState(user?.openai_key ?? "");
  const [geminiKey, setGeminiKey] = useState(user?.gemini_key ?? "");
  const [anthropicKey, setAnthropicKey] = useState(user?.anthropic_key ?? "");
  const [nvidiaKey, setNvidiaKey] = useState(user?.nvidia_key ?? "");
  const [groqKey, setGroqKey] = useState(user?.groq_key ?? "");
  const [preferredModel, setPreferredModel] = useState(user?.preferred_model ?? "gemini:gemini-2.5-flash");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [activeAutoSaveProvider, setActiveAutoSaveProvider] = useState<string | null>(null);

  const [customModelInput, setCustomModelInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [dynamicNvidiaModels, setDynamicNvidiaModels] = useState<{ label: string; value: string; desc: string }[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
  const [otherModelsSearch, setOtherModelsSearch] = useState("");
  const [otherModelsPage, setOtherModelsPage] = useState(1);

  const toggleProvider = (provider: string) => {
    setExpandedProviders((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  useEffect(() => {
    setOtherModelsPage(1);
  }, [otherModelsSearch, nvidiaKey]);

  useEffect(() => {
    if (user) {
      setOpenaiKey(user.openai_key ?? "");
      setGeminiKey(user.gemini_key ?? "");
      setAnthropicKey(user.anthropic_key ?? "");
      setNvidiaKey(user.nvidia_key ?? "");
      setGroqKey(user.groq_key ?? "");

      const prefModel = user.preferred_model ?? "gemini:gemini-2.5-flash";
      setPreferredModel(prefModel);

      const parts = prefModel.split(":");
      const provider = parts[0];
      const models = PROVIDER_MODELS[provider] || [];
      const isPredefined = models.some((m) => m.value === prefModel);

      if (prefModel !== "default" && !isPredefined) {
        setShowCustomInput(true);
        setCustomModelInput(prefModel);
      }
    }
  }, [user]);

  const getKeyForProvider = (provider: string) => {
    if (provider === "openai") return openaiKey;
    if (provider === "gemini") return geminiKey;
    if (provider === "anthropic") return anthropicKey;
    if (provider === "nvidia") return nvidiaKey;
    if (provider === "groq") return groqKey;
    return "";
  };

  const getKeySetter = (provider: string) => {
    if (provider === "openai") return setOpenaiKey;
    if (provider === "gemini") return setGeminiKey;
    if (provider === "anthropic") return setAnthropicKey;
    if (provider === "nvidia") return setNvidiaKey;
    if (provider === "groq") return setGroqKey;
    return () => {};
  };

  const loadDynamicNvidiaModels = async (key: string) => {
    if (!key || key.length < 8) {
      setDynamicNvidiaModels([]);
      return;
    }
    setFetchingModels(true);
    setFetchError("");
    try {
      const res = await api<{ models: string[] }>(`/api/ai/models?provider=nvidia&api_key=${encodeURIComponent(key)}`, {
        method: "GET",
      });
      if (res && res.models && res.models.length > 0) {
        const mapped = res.models.map((m) => {
          let label = m;
          if (m.includes("/")) {
            const parts = m.split("/");
            label = parts[parts.length - 1];
          }
          label = label
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
            .trim();
          return {
            label,
            value: `nvidia:${m}`,
            desc: `Dynamic model: ${m}`,
          };
        });
        mapped.sort((a, b) => a.label.localeCompare(b.label));
        setDynamicNvidiaModels(mapped);
      } else {
        setDynamicNvidiaModels([]);
      }
    } catch (err) {
      console.warn("Failed to fetch dynamic NVIDIA models:", err);
      setFetchError("Failed to fetch dynamic model list from NVIDIA NIM.");
      setDynamicNvidiaModels([]);
    } finally {
      setFetchingModels(false);
    }
  };

  useEffect(() => {
    if (nvidiaKey && nvidiaKey.length > 8) {
      void loadDynamicNvidiaModels(nvidiaKey);
    } else {
      setDynamicNvidiaModels([]);
    }
  }, [nvidiaKey]);

  const save = async (customKeys?: Partial<User>) => {
    setIsSaving(true);
    try {
      const payload = {
        openai_key: customKeys?.openai_key !== undefined ? customKeys.openai_key : openaiKey,
        gemini_key: customKeys?.gemini_key !== undefined ? customKeys.gemini_key : geminiKey,
        anthropic_key: customKeys?.anthropic_key !== undefined ? customKeys.anthropic_key : anthropicKey,
        nvidia_key: customKeys?.nvidia_key !== undefined ? customKeys.nvidia_key : nvidiaKey,
        groq_key: customKeys?.groq_key !== undefined ? customKeys.groq_key : groqKey,
        preferred_model: customKeys?.preferred_model !== undefined ? customKeys.preferred_model : preferredModel,
      };

      const response = await api<{ user: User; message: string }>("/settings/ai-gateway", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setUser(response.user);
      setMessage(response.message);
      setIsSuccess(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update AI gateway settings.");
      setIsSuccess(false);
    } finally {
      setIsSaving(false);
      setActiveAutoSaveProvider(null);
    }
  };

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePaste = (provider: string, pastedValue: string) => {
    setActiveAutoSaveProvider(provider);
    const setter = getKeySetter(provider);
    setter(pastedValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const key = `${provider}_key` as keyof User;
      const updates: Partial<User> = { [key]: pastedValue };
      void save(updates);
    }, 500);
  };

  const selectModel = (modelValue: string) => {
    setPreferredModel(modelValue);
    void save({ preferred_model: modelValue });
  };

  const renderProviderStatus = (provider: string) => {
    const keyVal = getKeyForProvider(provider);
    const isPasted = activeAutoSaveProvider === provider;
    if (isPasted) {
      return <Badge text="SYNCING..." color="#06B6D4" />;
    }
    const hasValidKey = keyVal && keyVal.length > 8;
    return hasValidKey ? (
      <Badge text="CONNECTED" color="#10B981" />
    ) : (
      <Badge text="DISCONNECTED" color="#64748B" />
    );
  };

  const hasKey = (provider: string) => {
    const keyVal = getKeyForProvider(provider);
    return keyVal && keyVal.length > 8;
  };

  const hasAnyLlmKey = hasKey("openai") || hasKey("gemini") || hasKey("anthropic") || hasKey("nvidia");

  const getActiveModelLabel = () => {
    if (!hasAnyLlmKey) {
      return "No Model Selected";
    }
    if (showCustomInput) {
      return customModelInput || "No model set";
    }
    if (preferredModel === "default") {
      return "No Model Selected";
    }
    const parts = preferredModel.split(":");
    if (parts.length >= 2) {
      const providerKey = parts[0];
      const modelName = parts.slice(1).join(":");
      const models = PROVIDER_MODELS[providerKey];
      if (models) {
        const found = models.find((m) => m.value === preferredModel);
        if (found) return found.label;
      }
      return modelName;
    }
    return preferredModel;
  };

  const getActiveModelProvider = () => {
    if (!hasAnyLlmKey) return "NO KEY";
    if (showCustomInput) return "custom";
    if (preferredModel === "default") return "NONE";
    const parts = preferredModel.split(":");
    return parts[0] || "";
  };

  const getModelsForProvider = (provider: string) => {
    if (provider === "nvidia" && dynamicNvidiaModels.length > 0) {
      return dynamicNvidiaModels;
    }
    return PROVIDER_MODELS[provider] || [];
  };

  const content = (
    <RequireAuth>
      <Page contentContainerStyle={{ paddingHorizontal: isMobile ? 12 : 24, paddingVertical: isMobile ? 16 : 32 }}>
        <NavBar />

        <Heading
          title="AI Gateway Settings"
          subtitle="Configure your API credentials, select models per provider, and manage your AI pipeline."
        />

        <View className="gap-6 mt-3 w-full">

          <GlassCard className={isMobile ? "p-4" : "p-8"}>
            <View className="flex-row items-center gap-2.5 border-b border-tier-border-subtle pb-4 mb-5">
              <Zap color="#6366F1" size={20} />
              <Text className="text-lg font-black tracking-tight text-tier-text-primary font-display">Preferred Model</Text>
            </View>

            <View className="bg-tier-accent-primary/10 border border-tier-accent-primary/20 rounded-xl py-3.5 px-4 gap-2.5">
              <View className="flex-row items-center gap-2">
                <Clock color="#6366F1" size={16} />
                <Text className="text-[11px] font-extrabold tracking-[1.5px] text-tier-text-secondary">ACTIVE MODEL</Text>
              </View>
              <View className="flex-row items-center gap-2.5 flex-wrap">
                <Text className="text-[15px] font-black tracking-tight text-tier-text-primary flex-shrink min-w-0">
                  {getActiveModelLabel()}
                </Text>
                <Badge 
                  text={getActiveModelProvider().toUpperCase()} 
                  color={getActiveModelProvider() === "NO KEY" ? "#F43F5E" : "#6366F1"} 
                />
              </View>
              <Text className="text-[11px] font-medium text-tier-text-secondary">
                {!hasAnyLlmKey ? "Please configure at least one API Key below" : preferredModel}
              </Text>
            </View>
          </GlassCard>

          <View className="gap-4">
            <Text className="text-[10px] font-black tracking-[1.5px] text-tier-accent-primary mb-1 uppercase">PROVIDER CONFIGURATION</Text>

            {PROVIDER_ORDER.map((providerKey) => {
              const info = PROVIDER_INFO[providerKey];
              const keyVal = getKeyForProvider(providerKey);
              const connected = hasKey(providerKey);
              const isProvider = providerKey !== "groq";
              const models = isProvider && connected ? getModelsForProvider(providerKey) : [];
              const { primary, secondary } = partitionModels(models);

              const filteredSecondary = secondary.filter((m) => {
                const query = otherModelsSearch.toLowerCase();
                return m.label.toLowerCase().includes(query) || m.value.toLowerCase().includes(query);
              });

              const ITEMS_PER_PAGE = 6;
              const totalPages = Math.ceil(filteredSecondary.length / ITEMS_PER_PAGE) || 1;
              const activePage = Math.min(otherModelsPage, totalPages);
              const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
              const paginatedModels = filteredSecondary.slice(startIndex, startIndex + ITEMS_PER_PAGE);

              return (
                <GlassCard key={providerKey} className={isMobile ? "p-4" : "p-6"}>
                  <View className="border-b border-tier-border-subtle pb-4 mb-4">
                    <Pressable
                      onPress={isMobile ? () => toggleProvider(providerKey) : undefined}
                      disabled={!isMobile}
                    >
                      <View className="flex-row items-center justify-between gap-3 w-full">
                        <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                          <View
                            className="h-8 w-8 rounded-lg items-center justify-center shrink-0"
                            style={{ backgroundColor: `${info.color}18` }}
                          >
                            <Text className="text-sm font-black" style={{ color: info.color }}>
                              {info.name.charAt(0)}
                            </Text>
                          </View>
                          <View className="flex-1 min-w-0">
                            <View className="flex-row items-center gap-2 flex-wrap">
                              <Text className="text-[14px] font-black tracking-tight text-tier-text-primary">
                                {info.name}
                              </Text>
                              {info.required && (
                                <View className="flex-row items-center gap-1 bg-tier-accent-rose/10 border border-tier-accent-rose/25 rounded-md px-2 py-0.5">
                                  <Text className="text-[9px] font-black tracking-[1.2px] text-tier-accent-rose">REQUIRED</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-[11px] font-medium text-tier-text-secondary" numberOfLines={2}>{info.description}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2 shrink-0">
                          {renderProviderStatus(providerKey)}
                          {isMobile && (
                            expandedProviders[providerKey] ? (
                              <ChevronDown color="#94A3B8" size={16} />
                            ) : (
                              <ChevronRight color="#94A3B8" size={16} />
                            )
                          )}
                        </View>
                      </View>
                    </Pressable>
                  </View>

                  {!isMobile || expandedProviders[providerKey] ? (
                    <>
                      <View className="mb-4">
                        <View className="flex-row items-center gap-1.5 mb-2">
                          <Key color="#94A3B8" size={12} />
                          <Text className="text-[10px] font-black tracking-[1.5px] text-tier-text-secondary">API KEY</Text>
                        </View>
                        <Field
                          label=""
                          placeholder={info.placeholder}
                          value={keyVal}
                          onChangeText={getKeySetter(providerKey)}
                          secureTextEntry
                          {...({
                            onPaste: (e: any) => {
                              const val = e.clipboardData?.getData("Text") || "";
                              if (val) handlePaste(providerKey, val);
                            }
                          } as any)}
                        />
                      </View>

                      {isProvider && primary.length > 0 && (
                        <View>
                          <View className="flex-row items-center gap-1.5 mb-3">
                            <Radio color="#94A3B8" size={12} />
                            <Text className="text-[10px] font-black tracking-[1.5px] text-tier-text-secondary">MODEL SELECTION</Text>
                          </View>

                          {providerKey === "nvidia" && fetchingModels ? (
                            <View className="py-5 items-center">
                              <Text className="text-[13px] font-bold text-tier-accent-violet">
                                Fetching dynamic model list from NVIDIA NIM...
                              </Text>
                            </View>
                          ) : providerKey === "nvidia" && fetchError ? (
                            <View className="py-3 gap-2">
                              <Text className="text-[13px] font-semibold text-tier-accent-rose">{fetchError}</Text>
                              <Pressable
                                onPress={() => void loadDynamicNvidiaModels(nvidiaKey)}
                                className="self-start bg-tier-surface border border-tier-border-subtle px-3 py-2 rounded-lg"
                              >
                                <Text className="text-[11px] font-bold text-tier-text-primary">Try Again</Text>
                              </Pressable>
                            </View>
                          ) : (
                            <View className="gap-2">
                              {primary.map((model) => {
                                const isSelected = preferredModel === model.value;

                                return (
                                  <Pressable
                                    key={model.value}
                                    disabled={!connected}
                                    onPress={() => selectModel(model.value)}
                                    style={({ pressed }) => ({
                                      transform: [{ scale: pressed ? 0.98 : 1 }],
                                    })}
                                    className={`flex-row items-start gap-3 rounded-xl border p-3.5 ${
                                      isSelected
                                        ? "bg-tier-accent-primary/10 border-tier-accent-primary"
                                        : !connected
                                        ? "opacity-[0.45] bg-tier-bg border-tier-border-subtle"
                                        : "bg-tier-surface-sunken border-tier-border-subtle"
                                    }`}
                                  >
                                    <View className={`mt-0.5 h-4 w-4 rounded-full border-2 items-center justify-center ${
                                      isSelected
                                        ? "border-tier-accent-primary bg-tier-accent-primary"
                                        : "border-tier-border-medium"
                                    }`}>
                                      {isSelected && <View className="h-1.5 w-1.5 rounded-full bg-white" />}
                                    </View>
                                    <View className="flex-1 gap-1">
                                      <View className="flex-row items-center gap-2">
                                        <Text className={`text-[13px] font-extrabold ${isSelected ? "text-tier-text-primary" : "text-tier-text-secondary"}`}>
                                          {model.label}
                                        </Text>
                                        {isSelected && (
                                          <CheckCircle color="#10B981" size={14} />
                                        )}
                                      </View>
                                      <Text className="text-[11px] leading-4 font-medium text-tier-text-secondary">
                                        {model.desc}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              })}
                            </View>
                          )}

                          {secondary.length > 0 && (
                            <View className="mt-4 gap-2">
                              <View className="flex-row items-center justify-between flex-wrap gap-2 border-b border-tier-border-subtle pb-2 mb-2">
                                <Text className="text-[10px] font-black tracking-[1.5px] text-tier-text-secondary uppercase">
                                  OTHER MODELS
                                </Text>
                                <View className="bg-tier-surface-sunken border border-tier-border-subtle rounded-sm px-2.5 py-1 w-full sm:w-[200px]">
                                  <TextInput
                                    value={otherModelsSearch}
                                    onChangeText={setOtherModelsSearch}
                                    placeholder="Search models..."
                                    placeholderTextColor="#64748B"
                                    className="text-[11px] font-semibold text-tier-text-primary p-0"
                                    style={RNPlatform.OS === "web" ? ({ outlineWidth: 0 } as any) : undefined}
                                  />
                                </View>
                              </View>

                              {paginatedModels.length === 0 ? (
                                <View className="py-4 items-center">
                                  <Text className="text-[12px] font-semibold text-tier-text-secondary">
                                    No models found matching "{otherModelsSearch}"
                                  </Text>
                                </View>
                              ) : (
                                <>
                                  <View className="flex-row flex-wrap gap-2.5 mt-1">
                                    {paginatedModels.map((model) => {
                                      const isSelected = preferredModel === model.value;
                                      return (
                                        <Pressable
                                          key={model.value}
                                          onPress={() => selectModel(model.value)}
                                          className={`rounded-base border p-3.5 ${
                                            isMobile ? "w-full" : "w-[48%] min-w-[240px]"
                                          } ${
                                            isSelected
                                              ? "bg-tier-accent-primary/10 border-tier-accent-primary"
                                              : "bg-tier-surface-sunken border-tier-border-subtle"
                                          }`}
                                          style={({ pressed }) => ({
                                            transform: [{ scale: pressed ? 0.98 : 1 }],
                                          })}
                                        >
                                          <View className="flex-row items-center gap-2 mb-1.5">
                                            <View className={`h-3 w-3 rounded-full border items-center justify-center ${
                                              isSelected
                                                ? "border-tier-accent-primary bg-tier-accent-primary"
                                                : "border-tier-border-strong"
                                            }`}>
                                              {isSelected && <View className="h-1 w-1 rounded-full bg-white" />}
                                            </View>
                                            <Text 
                                              className={`text-[12px] font-bold flex-1 ${
                                                isSelected ? "text-tier-text-primary" : "text-tier-text-secondary"
                                              }`} 
                                              numberOfLines={1}
                                            >
                                              {model.label}
                                            </Text>
                                            {isSelected && (
                                              <CheckCircle color="#10B981" size={12} />
                                            )}
                                          </View>
                                          <Text className="text-[10px] leading-4 font-medium text-tier-text-secondary" numberOfLines={2}>
                                            {model.desc}
                                          </Text>
                                        </Pressable>
                                      );
                                    })}
                                  </View>

                                  {totalPages > 1 && (
                                    <View className="flex-row items-center justify-center gap-1.5 mt-3 flex-wrap">
                                      <Pressable
                                        disabled={activePage === 1}
                                        onPress={() => setOtherModelsPage(activePage - 1)}
                                        className={`px-2.5 py-1 rounded-lg border ${
                                          activePage === 1
                                            ? "opacity-30 border-tier-border-subtle bg-tier-bg"
                                            : "border-tier-border-medium bg-tier-surface-sunken active:bg-tier-surface"
                                        }`}
                                      >
                                        <Text className="text-[10px] font-bold text-tier-text-secondary">Prev</Text>
                                      </Pressable>

                                      {Array.from({ length: totalPages }).map((_, idx) => {
                                        const pageNum = idx + 1;
                                        const isPageActive = pageNum === activePage;
                                        if (
                                          totalPages > 6 &&
                                          pageNum !== 1 &&
                                          pageNum !== totalPages &&
                                          Math.abs(pageNum - activePage) > 1
                                        ) {
                                          if (pageNum === 2 && activePage > 3) {
                                            return <Text key="dots-start" className="text-tier-text-tertiary text-[10px]">...</Text>;
                                          }
                                          if (pageNum === totalPages - 1 && activePage < totalPages - 2) {
                                            return <Text key="dots-end" className="text-tier-text-tertiary text-[10px]">...</Text>;
                                          }
                                          return null;
                                        }
                                        return (
                                          <Pressable
                                            key={pageNum}
                                            onPress={() => setOtherModelsPage(pageNum)}
                                            className={`h-6 w-6 items-center justify-center rounded-lg border ${
                                              isPageActive
                                                ? "bg-tier-accent-primary border-tier-accent-primary"
                                                : "border-tier-border-subtle bg-tier-surface-sunken"
                                            }`}
                                          >
                                            <Text className={`text-[10px] font-bold ${
                                              isPageActive ? "text-white" : "text-tier-text-secondary"
                                            }`}>
                                              {pageNum}
                                            </Text>
                                          </Pressable>
                                        );
                                      })}

                                      <Pressable
                                        disabled={activePage === totalPages}
                                        onPress={() => setOtherModelsPage(activePage + 1)}
                                        className={`px-2.5 py-1 rounded-lg border ${
                                          activePage === totalPages
                                            ? "opacity-30 border-tier-border-subtle bg-tier-bg"
                                            : "border-tier-border-medium bg-tier-surface-sunken active:bg-tier-surface"
                                        }`}
                                      >
                                        <Text className="text-[10px] font-bold text-tier-text-secondary">Next</Text>
                                      </Pressable>
                                    </View>
                                  )}
                                </>
                              )}
                            </View>
                          )}
                        </View>
                      )}

                      {!isProvider && (
                        <View className="bg-tier-surface-sunken border border-tier-border-subtle rounded-base p-3 mt-1">
                          <Text className="text-[11px] font-semibold text-tier-text-secondary">
                            Groq powers the Whisper STT engine used for audio transcription. This key is required for all voice/note features.
                          </Text>
                        </View>
                      )}

                      {isProvider && models.length === 0 && providerKey !== "nvidia" && (
                        <View className="flex-row items-center gap-1.5 mt-1">
                          <Text className="text-[11px] font-medium text-tier-text-tertiary">
                            {!connected ? "Enter a valid API key to view available models." : "No models available for this provider."}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : null}
                </GlassCard>
              );
            })}
          </View>

          <GlassCard className={isMobile ? "p-4" : "p-6"}>
            <View className="flex-row items-center gap-2.5 border-b border-tier-border-subtle pb-4 mb-5">
              <CheckCircle color="#10B981" size={20} />
              <Text className="text-lg font-bold tracking-tight text-tier-text-primary font-display">Active Configuration</Text>
            </View>
            <View className="gap-3">
              <View className={`${isMobile ? "flex-col items-start gap-2" : "flex-row items-center justify-between"} bg-tier-surface-sunken border border-tier-border-subtle rounded-base px-4 py-3`}>
                <View className="flex-row items-center gap-2.5">
                  <View className={`h-2 w-2 rounded-full ${hasAnyLlmKey ? "bg-tier-accent-emerald" : "bg-tier-accent-rose"}`} />
                  <Text className="text-[12px] font-bold text-tier-text-secondary">LLM Active</Text>
                </View>
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Text className="text-[13px] font-bold text-tier-text-primary">
                    {getActiveModelLabel()}
                  </Text>
                  {!hasAnyLlmKey && (
                    <Badge text="NO KEY" color="#F43F5E" />
                  )}
                </View>
              </View>
              <View className={`${isMobile ? "flex-col items-start gap-2" : "flex-row items-center justify-between"} bg-tier-surface-sunken border border-tier-border-subtle rounded-base px-4 py-3`}>
                <View className="flex-row items-center gap-2.5">
                  <View className={`h-2 w-2 rounded-full ${hasKey("groq") ? "bg-tier-accent-emerald" : "bg-tier-accent-rose"}`} />
                  <Text className="text-[12px] font-bold text-tier-text-secondary">Voice Active</Text>
                </View>
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Text className="text-[13px] font-bold text-tier-text-primary">Groq (Whisper STT)</Text>
                  {hasKey("groq") ? (
                    <Badge text="READY" color="#10B981" />
                  ) : (
                    <Badge text="NO KEY" color="#F43F5E" />
                  )}
                </View>
              </View>
            </View>
          </GlassCard>

          {message ? (
            <View className={`flex-row items-center gap-2.5 rounded-base border p-3.5 ${
              isSuccess
                ? "bg-tier-accent-emerald/10 border-tier-accent-emerald/20"
                : "bg-tier-accent-rose/10 border-tier-accent-rose/20"
            }`}>
              {isSuccess ? (
                <CheckCircle color="#10B981" size={18} />
              ) : (
                <AlertCircle color="#F43F5E" size={18} />
              )}
              <Text className={`text-[13px] font-semibold flex-1 ${isSuccess ? "text-tier-accent-emerald" : "text-tier-accent-danger"}`}>
                {message}
              </Text>
            </View>
          ) : null}

          <Button
            title={isSaving ? "Syncing..." : "Save All Settings"}
            onPress={() => void save()}
            disabled={isSaving}
          />
        </View>
      </Page>
    </RequireAuth>
  );

  if (RNPlatform.OS !== "web") {
    return (
      <KeyboardAvoidingView behavior={RNPlatform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {content}
      </KeyboardAvoidingView>
    );
  }
  return content;
}
