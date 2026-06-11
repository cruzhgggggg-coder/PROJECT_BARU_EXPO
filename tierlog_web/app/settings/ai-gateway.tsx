import React, { useState, useEffect } from "react";
import { Text, View, Platform, Pressable, TextInput } from "react-native";
import { Cpu, CheckCircle, AlertCircle, Clock, Key, Radio, Settings, Zap } from "lucide-react";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Button, Field, Heading, Page, Badge } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
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
    { label: "Llama 3.2 Vision 11B", value: "nvidia:meta/llama-3.2-vision-11b-instruct", desc: "Meta's vision model \u2014 supports image OCR + text analysis in one model." },
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
    color: "#059669",
    description: "Google's multimodal AI models for reasoning and research.",
  },
  anthropic: {
    name: "Anthropic",
    placeholder: "sk-ant-...",
    color: "#D97706",
    description: "Claude models for academic writing and complex analysis.",
  },
  nvidia: {
    name: "NVIDIA NIM",
    placeholder: "nvapi-...",
    color: "#7C3AED",
    description: "Vision-Language models for image OCR and document analysis.",
  },
  groq: {
    name: "Groq",
    placeholder: "gsk_...",
    color: "#EC4899",
    description: "Whisper STT for audio transcription (speech-to-text).",
    required: true,
  },
};

const PROVIDER_ORDER = ["openai", "gemini", "anthropic", "nvidia", "groq"];

export default function AIGatewayScreen() {
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
      const res = await api<{ models: string[] }>("/api/ai/models", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ provider: "nvidia", api_key: key }),
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
      console.error("Failed to fetch dynamic NVIDIA models:", err);
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

  const handlePaste = (provider: string, pastedValue: string) => {
    setActiveAutoSaveProvider(provider);
    const setter = getKeySetter(provider);
    setter(pastedValue);
    const key = `${provider}_key` as keyof User;
    const updates: Partial<User> = { [key]: pastedValue };
    void save(updates);
  };

  const selectModel = (modelValue: string) => {
    setPreferredModel(modelValue);
    void save({ preferred_model: modelValue });
  };

  const handleCustomModelSubmit = () => {
    if (customModelInput.trim()) {
      setPreferredModel(customModelInput);
      void save({ preferred_model: customModelInput });
    }
  };

  const renderProviderStatus = (provider: string) => {
    const keyVal = getKeyForProvider(provider);
    const isPasted = activeAutoSaveProvider === provider;
    if (isPasted) {
      return <Badge text="SYNCING..." color="#0891B2" />;
    }
    const hasValidKey = keyVal && keyVal.length > 8;
    return hasValidKey ? (
      <Badge text="CONNECTED" color="#059669" />
    ) : (
      <Badge text="DISCONNECTED" color="#64748B" />
    );
  };

  const hasKey = (provider: string) => {
    const keyVal = getKeyForProvider(provider);
    return keyVal && keyVal.length > 8;
  };

  const getActiveModelLabel = () => {
    if (showCustomInput) {
      return customModelInput || "No model set";
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
    if (showCustomInput) return "custom";
    const parts = preferredModel.split(":");
    return parts[0] || "";
  };

  const getModelsForProvider = (provider: string) => {
    if (provider === "nvidia" && dynamicNvidiaModels.length > 0) {
      return dynamicNvidiaModels;
    }
    return PROVIDER_MODELS[provider] || [];
  };

  return (
    <RequireAuth>
      <Page>
        <NavBar />

        <Heading
          title="AI Gateway Settings"
          subtitle="Configure your API credentials, select models per provider, and manage your AI pipeline."
        />

        <View className="gap-6 mt-3 w-full">

          <GlassCard className="p-8">
            <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-5">
              <Zap color="#6366F1" size={20} />
              <Text className="text-lg font-black tracking-tight text-[#F8FAFC]">Preferred Model</Text>
            </View>

            <View className="bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.25)] rounded-xl py-3 px-4 gap-2.5">
              <View className="flex-row items-center gap-2">
                <Clock color="#4F46E5" size={16} />
                <Text className="text-[11px] font-extrabold tracking-[1.5px] text-[#94A3B8]">ACTIVE MODEL</Text>
              </View>
              <View className="flex-row items-center gap-2.5">
                <Text className="text-[15px] font-black tracking-tight text-[#F8FAFC]">
                  {getActiveModelLabel()}
                </Text>
                <Badge text={getActiveModelProvider().toUpperCase()} color="#6366F1" />
              </View>
              <Text className="text-[11px] font-medium text-[#94A3B8]">
                {preferredModel}
              </Text>
            </View>
          </GlassCard>

          <View className="gap-4">
            <Text className="text-[10px] font-black tracking-[1.5px] text-[#6366F1] mb-1">PROVIDER CONFIGURATION</Text>

            {PROVIDER_ORDER.map((providerKey) => {
              const info = PROVIDER_INFO[providerKey];
              const keyVal = getKeyForProvider(providerKey);
              const connected = hasKey(providerKey);
              const isProvider = providerKey !== "groq";
              const models = isProvider ? getModelsForProvider(providerKey) : [];

              return (
                <GlassCard key={providerKey} className="p-6">
                  <View className="border-b border-white/[0.06] pb-4 mb-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2.5">
                        <View
                          className="h-8 w-8 rounded-lg items-center justify-center"
                          style={{ backgroundColor: `${info.color}18` }}
                        >
                          <Text className="text-sm font-black" style={{ color: info.color }}>
                            {info.name.charAt(0)}
                          </Text>
                        </View>
                        <View>
                          <View className="flex-row items-center gap-2">
                            <Text className="text-[14px] font-black tracking-tight text-[#F8FAFC]">
                              {info.name}
                            </Text>
                            {info.required && (
                              <View className="flex-row items-center gap-1 bg-[rgba(236,72,153,0.12)] border border-[rgba(236,72,153,0.25)] rounded-md px-2 py-0.5">
                                <Text className="text-[9px] font-black tracking-[1.2px] text-[#EC4899]">REQUIRED</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-[11px] font-medium text-[#94A3B8]">{info.description}</Text>
                        </View>
                      </View>
                      {renderProviderStatus(providerKey)}
                    </View>
                  </View>

                  <View className="mb-4">
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <Key color="#94A3B8" size={12} />
                      <Text className="text-[10px] font-black tracking-[1.5px] text-[#94A3B8]">API KEY</Text>
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

                  {isProvider && models.length > 0 && (
                    <View>
                      <View className="flex-row items-center gap-1.5 mb-3">
                        <Radio color="#94A3B8" size={12} />
                        <Text className="text-[10px] font-black tracking-[1.5px] text-[#94A3B8]">MODEL SELECTION</Text>
                      </View>

                      {providerKey === "nvidia" && fetchingModels ? (
                        <View className="py-5 items-center">
                          <Text className="text-[13px] font-bold text-[#7C3AED]">
                            Fetching dynamic model list from NVIDIA NIM...
                          </Text>
                        </View>
                      ) : providerKey === "nvidia" && fetchError ? (
                        <View className="py-3 gap-2">
                          <Text className="text-[13px] font-semibold text-[#DC2626]">{fetchError}</Text>
                          <Pressable
                            onPress={() => void loadDynamicNvidiaModels(nvidiaKey)}
                            className="self-start bg-white/[0.06] px-3 py-1.5 rounded-lg border border-white/[0.08]"
                          >
                            <Text className="text-[11px] font-bold text-[#F8FAFC]">Try Again</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View className="gap-2">
                          {models.map((model) => {
                            const isSelected = preferredModel === model.value;

                            return (
                              <Pressable
                                key={model.value}
                                disabled={!connected}
                                onPress={() => selectModel(model.value)}
                                style={({ pressed }) => ({
                                  transform: [{ scale: pressed ? 0.98 : 1 }],
                                })}
                                className={`flex-row items-start gap-3 rounded-xl border p-3.5 gap-2.5 ${
                                  isSelected
                                    ? "bg-[rgba(99,102,241,0.08)] border-[#6366F1]"
                                    : !connected
                                    ? "opacity-[0.45] bg-white/[0.01] border-white/[0.04]"
                                    : "bg-white/[0.02] border-white/[0.06]"
                                }`}
                              >
                                <View className={`mt-0.5 h-4 w-4 rounded-full border-2 items-center justify-center ${
                                  isSelected
                                    ? "border-[#6366F1] bg-[#6366F1]"
                                    : "border-white/[0.15]"
                                }`}>
                                  {isSelected && <View className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </View>
                                <View className="flex-1 gap-1">
                                  <View className="flex-row items-center gap-2">
                                    <Text className={`text-[13px] font-extrabold ${isSelected ? "text-[#F8FAFC]" : "text-[#CBD5E1]"}`}>
                                      {model.label}
                                    </Text>
                                    {isSelected && (
                                      <CheckCircle color="#059669" size={14} />
                                    )}
                                  </View>
                                  <Text className="text-[11px] leading-4 font-medium text-[#94A3B8]">
                                    {model.desc}
                                  </Text>
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}

                      {providerKey === "nvidia" && (
                        <View className="mt-3 border-t border-white/[0.06] pt-3">
                          <View className="flex-row items-center gap-1.5 mb-2">
                            <Settings color="#94A3B8" size={12} />
                            <Text className="text-[10px] font-black tracking-[1.5px] text-[#94A3B8]">CUSTOM MODEL</Text>
                          </View>
                          {showCustomInput && getActiveModelProvider() === "nvidia" ? (
                            <View className="gap-2">
                              <Text className="text-[11px] font-semibold text-[#64748B]">
                                Enter the complete model identifier string (format: provider:model_name)
                              </Text>
                              <View className="flex-row gap-2.5 items-center">
                                <TextInput
                                  value={customModelInput}
                                  onChangeText={setCustomModelInput}
                                  placeholder="e.g. nvidia:meta/llama-3.1-8b-instruct"
                                  placeholderTextColor="#94A3B8"
                                  onSubmitEditing={handleCustomModelSubmit}
                                  className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[#F8FAFC] px-3 py-2.5 text-[13px] font-medium"
                                  style={{ outlineStyle: "none" } as any}
                                />
                                <Pressable onPress={handleCustomModelSubmit} className="bg-[#4F46E5] px-4 py-2.5 rounded-xl">
                                  <Text className="text-white font-extrabold text-[13px]">Apply</Text>
                                </Pressable>
                              </View>
                            </View>
                          ) : (
                            <Pressable
                              onPress={() => setShowCustomInput(true)}
                              className="self-start bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-lg"
                            >
                              <Text className="text-[11px] font-bold text-[#94A3B8]">+ Custom NVIDIA Model</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {!isProvider && (
                    <View className="bg-[rgba(236,72,153,0.05)] border border-[rgba(236,72,153,0.12)] rounded-lg p-3 mt-1">
                      <Text className="text-[11px] font-semibold text-[#94A3B8]">
                        Groq powers the Whisper STT engine used for audio transcription. This key is required for all voice/note features.
                      </Text>
                    </View>
                  )}

                  {isProvider && models.length === 0 && providerKey !== "nvidia" && (
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <Text className="text-[11px] font-medium text-[#64748B]">
                        {!connected ? "Enter a valid API key to view available models." : "No models available for this provider."}
                      </Text>
                    </View>
                  )}
                </GlassCard>
              );
            })}
          </View>

          {showCustomInput && getActiveModelProvider() !== "nvidia" && (
            <GlassCard className="p-6">
              <View className="flex-row items-center gap-2.5 mb-4">
                <Settings color="#6366F1" size={18} />
                <Text className="text-[14px] font-black tracking-tight text-[#F8FAFC]">Custom Model</Text>
              </View>
              <Text className="text-[11px] font-semibold text-[#64748B] mb-2">
                Enter the complete model identifier string (format: provider:model_name)
              </Text>
              <View className="flex-row gap-2.5 items-center">
                <TextInput
                  value={customModelInput}
                  onChangeText={setCustomModelInput}
                  placeholder="e.g. openai:gpt-4o"
                  placeholderTextColor="#94A3B8"
                  onSubmitEditing={handleCustomModelSubmit}
                  className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[#F8FAFC] px-3 py-2.5 text-[13px] font-medium"
                  style={{ outlineStyle: "none" } as any}
                />
                <Pressable onPress={handleCustomModelSubmit} className="bg-[#4F46E5] px-4 py-2.5 rounded-xl">
                  <Text className="text-white font-extrabold text-[13px]">Apply</Text>
                </Pressable>
              </View>
            </GlassCard>
          )}

          <GlassCard className="p-6">
            <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-5">
              <CheckCircle color="#059669" size={20} />
              <Text className="text-lg font-black tracking-tight text-[#F8FAFC]">Active Configuration</Text>
            </View>
            <View className="gap-3">
              <View className="flex-row items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                <View className="flex-row items-center gap-2.5">
                  <View className="h-2 w-2 rounded-full bg-[#059669]" />
                  <Text className="text-[12px] font-bold text-[#94A3B8]">LLM Active</Text>
                </View>
                <Text className="text-[13px] font-black text-[#F8FAFC]">
                  {getActiveModelLabel()}
                </Text>
              </View>
              <View className="flex-row items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                <View className="flex-row items-center gap-2.5">
                  <View className={`h-2 w-2 rounded-full ${hasKey("groq") ? "bg-[#059669]" : "bg-[#DC2626]"}`} />
                  <Text className="text-[12px] font-bold text-[#94A3B8]">Voice Active</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[13px] font-black text-[#F8FAFC]">Groq (Whisper STT)</Text>
                  {hasKey("groq") ? (
                    <Badge text="READY" color="#059669" />
                  ) : (
                    <Badge text="NO KEY" color="#DC2626" />
                  )}
                </View>
              </View>
            </View>
          </GlassCard>

          {message ? (
            <View className={`flex-row items-center gap-2.5 rounded-xl border p-3.5 ${
              isSuccess
                ? "bg-[rgba(5,150,105,0.06)] border-[rgba(5,150,105,0.2)]"
                : "bg-[rgba(220,38,38,0.06)] border-[rgba(220,38,38,0.2)]"
            }`}>
              {isSuccess ? (
                <CheckCircle color="#059669" size={18} />
              ) : (
                <AlertCircle color="#DC2626" size={18} />
              )}
              <Text className={`text-[13px] font-semibold flex-1 ${isSuccess ? "text-[#059669]" : "text-[#DC2626]"}`}>
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
}
