import React, { useState, useEffect } from "react";
import { Text, View, Platform, Pressable, TextInput } from "react-native";
import { Cpu, CheckCircle, AlertCircle, Clock } from "lucide-react";

import { GlassCard } from "@/src/components/ui/glass-card";
import { NavBar } from "@/src/components/NavBar";
import { RequireAuth } from "@/src/components/RequireAuth";
import { Button, Field, Heading, Page, Badge } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import type { User } from "@/src/types";

const PROVIDER_MODELS: Record<string, { label: string; value: string; desc: string }[]> = {
  gemini: [
    { label: "Gemini 2.5 Flash", value: "gemini:gemini-2.5-flash", desc: "Recommended. Balanced speed and reasoning accuracy." },
    { label: "Gemini 2.5 Pro", value: "gemini:gemini-2.5-pro", desc: "Advanced model for deep academic reasoning and research." },
    { label: "Gemini 2.0 Flash", value: "gemini:gemini-2.0-flash", desc: "Ultra-low latency, ideal for interactive assistant dialog." },
    { label: "Gemini 1.5 Pro", value: "gemini:gemini-1.5-pro", desc: "Large context window, ideal for long manuscript audits." },
  ],
  openai: [
    { label: "GPT-4o", value: "openai:gpt-4o", desc: "High-performance model, highly accurate on structural instructions." },
    { label: "GPT-4o Mini", value: "openai:gpt-4o-mini", desc: "Cost-effective, fast, and reliable model for general tasks." },
    { label: "GPT-4 Turbo", value: "openai:gpt-4-turbo", desc: "Legacy model with stable performance across standard tasks." },
  ],
  anthropic: [
    { label: "Claude 3.5 Sonnet", value: "anthropic:claude-3-5-sonnet-20241022", desc: "State-of-the-Art. Superior capability for high-end academic writing." },
    { label: "Claude 3.5 Haiku", value: "anthropic:claude-3-5-haiku-20241022", desc: "Ultra-high speed with outstanding contextual comprehension." },
    { label: "Claude 3 Opus", value: "anthropic:claude-3-opus-20240229", desc: "Excellent for complex theoretical analysis and logic mapping." },
  ],
  nvidia: [
    { label: "Llama 3.1 70B Instruct", value: "nvidia:meta/llama-3.1-70b-instruct", desc: "Meta's flagship open-weights model hosted on NVIDIA infrastructure." },
    { label: "Nemotron 70B Instruct", value: "nvidia:nvidia/llama-3.1-nemotron-70b-instruct", desc: "NVIDIA-optimized model for highly natural conversational flows." },
    { label: "Mixtral 8x22B Instruct", value: "nvidia:mistralai/mixtral-8x22b-instruct-v0.1", desc: "High-performance Mixture of Experts (MoE) model." },
  ],
};

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

  const [activeTab, setActiveTab] = useState<string>("gemini");
  const [customModelInput, setCustomModelInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [dynamicNvidiaModels, setDynamicNvidiaModels] = useState<{ label: string; value: string; desc: string }[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (preferredModel && preferredModel.includes(":")) {
      const provider = preferredModel.split(":")[0];
      if (PROVIDER_MODELS[provider]) {
        setActiveTab(provider);
      } else {
        setShowCustomInput(true);
        setCustomModelInput(preferredModel);
      }
    }
  }, [user?.preferred_model]);

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
            label: label,
            value: `nvidia:${m}`,
            desc: `Dynamic model: ${m}`
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

    const updates: Partial<User> = {};
    if (provider === "openai") {
      setOpenaiKey(pastedValue);
      updates.openai_key = pastedValue;
    } else if (provider === "gemini") {
      setGeminiKey(pastedValue);
      updates.gemini_key = pastedValue;
    } else if (provider === "anthropic") {
      setAnthropicKey(pastedValue);
      updates.anthropic_key = pastedValue;
    } else if (provider === "nvidia") {
      setNvidiaKey(pastedValue);
      updates.nvidia_key = pastedValue;
    }

    setActiveTab(provider);
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

  const renderProviderStatus = (keyVal: string, providerName: string) => {
    const isPasted = activeAutoSaveProvider === providerName;
    if (isPasted) {
      return <Badge text="SYNCING..." color="#0891B2" />;
    }
    const hasKey = keyVal && keyVal.length > 8;
    return hasKey ? (
      <Badge text="CONNECTED" color="#059669" />
    ) : (
      <Badge text="DISCONNECTED" color="#64748B" />
    );
  };

  const hasKey = (provider: string) => {
    if (provider === "gemini") return geminiKey && geminiKey.length > 8;
    if (provider === "openai") return openaiKey && openaiKey.length > 8;
    if (provider === "anthropic") return anthropicKey && anthropicKey.length > 8;
    if (provider === "nvidia") return nvidiaKey && nvidiaKey.length > 8;
    return false;
  };

  return (
    <RequireAuth>
      <Page>
        <NavBar />

        <Heading
          title="AI Gateway Settings"
          subtitle="Configure your preferred model, API credentials, and license options."
        />

        <View className="gap-6 mt-3 w-full">
          <GlassCard className="p-8">
            <View className="flex-row items-center gap-2.5 border-b border-white/[0.08] pb-4 mb-6">
              <Cpu color="#7C3AED" size={20} />
              <Text className="text-lg font-black tracking-tight text-[#F8FAFC]">Provider API Keys & Preferences</Text>
            </View>

            <View className="gap-2.5">
              <View className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-[18px] gap-3">
                <Text className="text-[10px] font-black tracking-[1.5px] text-[#6366F1] mt-3 mb-2 border-b border-white/[0.06] pb-1.5">PREFERRED MODEL</Text>

                <View className="flex-row items-center gap-2 bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.25)] rounded-[10px] py-2.5 px-3.5">
                  <Clock color="#4F46E5" size={16} />
                  <Text className="text-[11px] font-black tracking-wider text-[#94A3B8]">ACTIVE: </Text>
                  <Text className="text-[13px] font-black tracking-wider text-[#F8FAFC]">{preferredModel.toUpperCase()}</Text>
                </View>

                <View className="flex-row border-b border-white/[0.08] gap-4 overflow-auto">
                  {Object.keys(PROVIDER_MODELS).map((provider) => {
                    const active = activeTab === provider;
                    const connected = hasKey(provider);
                    return (
                      <Pressable
                        key={provider}
                        onPress={() => {
                          setActiveTab(provider);
                          setShowCustomInput(false);
                          if (provider === "nvidia" && nvidiaKey && nvidiaKey.length > 8 && dynamicNvidiaModels.length === 0) {
                            void loadDynamicNvidiaModels(nvidiaKey);
                          }
                        }}
                        className={`py-2.5 px-1.5 relative flex-row items-center gap-2 ${
                          active ? "" : "opacity-50"
                        }`}
                      >
                        <Text className={`text-xs font-extrabold tracking-wider ${
                          active ? "text-[#F8FAFC]" : "text-[#64748B]"
                        } ${connected && !active ? "text-[#059669]" : ""}`}>
                          {provider.toUpperCase()}
                        </Text>
                        <View className={`absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full ${
                          connected ? "bg-[#059669]" : "bg-transparent"
                        }`} />
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() => setShowCustomInput(true)}
                    className={`py-2.5 px-1.5 ${showCustomInput ? "" : "opacity-50"}`}
                  >
                    <Text className={`text-xs font-extrabold tracking-wider ${showCustomInput ? "text-[#F8FAFC]" : "text-[#64748B]"}`}>CUSTOM</Text>
                  </Pressable>
                </View>

                {!showCustomInput ? (
                  <View className="flex-row gap-3.5 flex-wrap mt-2">
                    {activeTab === "nvidia" && fetchingModels ? (
                      <View className="py-6 items-center w-full">
                        <Text className="text-[13px] font-bold text-[#7C3AED]">
                          Fetching dynamic model list from NVIDIA NIM...
                        </Text>
                      </View>
                    ) : activeTab === "nvidia" && fetchError ? (
                      <View className="py-3 w-full gap-2">
                        <Text className="text-[13px] font-semibold text-[#DC2626]">
                          {fetchError}
                        </Text>
                        <Pressable
                          onPress={() => void loadDynamicNvidiaModels(nvidiaKey)}
                          className="self-start bg-[rgba(241,245,249,0.8)] px-3 py-1.5 rounded-lg border border-[rgba(0,0,0,0.08)]"
                        >
                          <Text className="text-[11px] font-bold text-[#334155]">                          Try Again</Text>
                        </Pressable>
                      </View>
                    ) : (
                      (activeTab === "nvidia" && dynamicNvidiaModels.length > 0
                        ? dynamicNvidiaModels
                        : PROVIDER_MODELS[activeTab]
                      )?.map((model) => {
                        const isSelected = preferredModel === model.value;
                        const connected = hasKey(activeTab);

                        return (
                          <Pressable
                            key={model.value}
                            disabled={!connected}
                            onPress={() => selectModel(model.value)}
                            style={({ pressed }) => ({
                              transform: [{ scale: pressed ? 0.98 : 1 }]
                            })}
                            className={`flex-1 min-w-[260px] max-w-[48%] rounded-xl border p-4 gap-1.5 ${
                              isSelected
                                ? "bg-[rgba(99,102,241,0.08)] border-[#6366F1]"
                                : !connected
                                ? "opacity-[0.45] bg-white/[0.01] border-white/[0.04]"
                                : "bg-white/[0.02] border-white/[0.06]"
                            }`}
                          >
                            <View className="flex-row justify-between items-center">
                              <Text className={`text-sm font-extrabold ${isSelected ? "text-white" : "text-[#F8FAFC]"}`}>
                                {model.label}
                              </Text>
                              {isSelected ? (
                                <CheckCircle color="#059669" size={16} />
                              ) : !connected ? (
                                <Badge text="KEY REQUIRED" color="#DC2626" />
                              ) : null}
                            </View>
                            <Text className="text-[11px] leading-4 font-medium text-[#94A3B8]">{model.desc}</Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                ) : (
                  <View className="p-3 gap-2">
                    <Text className="text-[11px] font-semibold text-[#64748B]">Enter the complete model identifier string (format: provider:model_name)</Text>
                    <View className="flex-row gap-2.5 items-center">
                      <TextInput
                        value={customModelInput}
                        onChangeText={setCustomModelInput}
                        placeholder="e.g. openai:gpt-4o"
                        placeholderTextColor="#94A3B8"
                        onSubmitEditing={handleCustomModelSubmit}
                        className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-[10px] text-[#F8FAFC] px-3 py-2.5 text-[13px] font-medium"
                        style={{ outlineStyle: "none" } as any}
                      />
                      <Pressable onPress={handleCustomModelSubmit} className="bg-[#4F46E5] px-4 py-[11px] rounded-[10px]">
                        <Text className="text-white font-extrabold text-[13px]">Apply</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>

              <Text className="text-[10px] font-black tracking-[1.5px] text-[#6366F1] mt-3 mb-2 border-b border-white/[0.06] pb-1.5">PROVIDER API CREDENTIALS</Text>

              <View className="flex-row gap-5 flex-wrap">
                <View className="flex-1 min-w-[280px] gap-3">
                  <View className="flex-row justify-between items-center mb-[-4px] mt-1">
                    <Text className="text-[11px] font-extrabold tracking-wider text-[#94A3B8]">OPENAI API</Text>
                    {renderProviderStatus(openaiKey, "openai")}
                  </View>
                  <Field
                    label="OpenAI API Key"
                    placeholder="sk-proj-..."
                    value={openaiKey}
                    onChangeText={setOpenaiKey}
                    secureTextEntry
                    {...({
                      onPaste: (e: any) => {
                        const val = e.clipboardData?.getData("Text") || "";
                        if (val) handlePaste("openai", val);
                      }
                    } as any)}
                  />

                  <View className="flex-row justify-between items-center mb-[-4px] mt-1">
                    <Text className="text-[11px] font-extrabold tracking-wider text-[#94A3B8]">GEMINI API</Text>
                    {renderProviderStatus(geminiKey, "gemini")}
                  </View>
                  <Field
                    label="Gemini API Key"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChangeText={setGeminiKey}
                    secureTextEntry
                    {...({
                      onPaste: (e: any) => {
                        const val = e.clipboardData?.getData("Text") || "";
                        if (val) handlePaste("gemini", val);
                      }
                    } as any)}
                  />
                </View>

                <View className="flex-1 min-w-[280px] gap-3">
                  <View className="flex-row justify-between items-center mb-[-4px] mt-1">
                    <Text className="text-[11px] font-extrabold tracking-wider text-[#94A3B8]">ANTHROPIC API</Text>
                    {renderProviderStatus(anthropicKey, "anthropic")}
                  </View>
                  <Field
                    label="Anthropic API Key"
                    placeholder="sk-ant-..."
                    value={anthropicKey}
                    onChangeText={setAnthropicKey}
                    secureTextEntry
                    {...({
                      onPaste: (e: any) => {
                        const val = e.clipboardData?.getData("Text") || "";
                        if (val) handlePaste("anthropic", val);
                      }
                    } as any)}
                  />

                  <View className="flex-row justify-between items-center mb-[-4px] mt-1">
                    <Text className="text-[11px] font-extrabold tracking-wider text-[#94A3B8]">NVIDIA NIM API</Text>
                    {renderProviderStatus(nvidiaKey, "nvidia")}
                  </View>
                  <Field
                    label="NVIDIA NIM API Key"
                    placeholder="nvapi-..."
                    value={nvidiaKey}
                    onChangeText={setNvidiaKey}
                    secureTextEntry
                    {...({
                      onPaste: (e: any) => {
                        const val = e.clipboardData?.getData("Text") || "";
                        if (val) handlePaste("nvidia", val);
                      }
                    } as any)}
                  />
                </View>
              </View>

              <Text className="text-[10px] font-black tracking-[1.5px] text-[#6366F1] mt-3 mb-2 border-b border-white/[0.06] pb-1.5">AUDIO TRANSCRIPTION</Text>

              <View className="flex-row gap-5 flex-wrap">
                <View className="flex-1 min-w-[280px] gap-3">
                  <View className="flex-row justify-between items-center mb-[-4px] mt-1">
                    <Text className="text-[11px] font-extrabold tracking-wider text-[#94A3B8]">GROQ API (WHISPER STT)</Text>
                    {renderProviderStatus(groqKey, "groq")}
                  </View>
                  <Field
                    label="Groq API Key"
                    placeholder="gsk_..."
                    value={groqKey}
                    onChangeText={setGroqKey}
                    secureTextEntry
                    {...({
                      onPaste: (e: any) => {
                        const val = e.clipboardData?.getData("Text") || "";
                        if (val) {
                          setGroqKey(val);
                          setActiveAutoSaveProvider("groq");
                          void save({ groq_key: val });
                        }
                      }
                    } as any)}
                  />
                </View>
              </View>

              {message ? (
                <View className={`flex-row items-center gap-2.5 rounded-xl border p-3.5 mb-3 ${
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
                title={isSaving ? "Syncing..." : "Save AI Settings"}
                onPress={() => void save()}
                disabled={isSaving}
              />
            </View>
          </GlassCard>
        </View>
      </Page>
    </RequireAuth>
  );
}
