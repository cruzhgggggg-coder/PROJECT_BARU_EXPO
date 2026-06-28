import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown, Play, Mic, MessageSquare, Camera, RefreshCw, Shield, Star, Menu, X } from "lucide-react-native";

import { useAuth } from "@/src/providers/AuthProvider";
import { useResponsive } from "@/src/lib/responsive";
import { MotionDiv } from "@/src/lib/motion";
import { animations } from "@/src/lib/animations";
import { FloatingOrbs } from "@/src/components/ui/FloatingOrbs";
import { ScrollReveal } from "@/src/components/ui/ScrollReveal";
import { GlassCard } from "@/src/components/ui/glass-card";
import { ElegantButton } from "@/src/components/ui/elegant-button";
import { ResponsiveContainer } from "@/src/components/layout/ResponsiveContainer";
import { GlowingSlideText } from "@/src/components/ui/GlowingSlideText";

export default function WelcomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (user) {
    return <Redirect href="/dashboard" />;
  }

  const testimonials = [
    {
      quote: "TierLog reduced my thesis revision time from 2 weeks to just 3 days. The AI transcription matches my advisor's feedback perfectly.",
      author: "Budi Santoso",
      role: "Computer Science Student",
      stars: 5,
    },
    {
      quote: "As a lecturer, keeping track of 15+ students was a nightmare. TierLog's consultation workspace lets me see all history and revisions instantly.",
      author: "Dr. Eng. Ahmad Yani",
      role: "Thesis Advisor",
      stars: 5,
    },
    {
      quote: "The OCR vision feature is a lifesaver. I just take a photo of my advisor's written notes, and TierLog automatically generates a structured action plan.",
      author: "Siti Rahma",
      role: "Information Systems Student",
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: "How does the AI transcription work?",
      a: "TierLog uses advanced Groq Whisper models to convert your consultation audio recordings into highly accurate text transcripts in seconds.",
    },
    {
      q: "Is my research data secure?",
      a: "Absolutely. All uploads, drafts, transcripts, and conversations are fully encrypted. Only you and your assigned advisor can access them.",
    },
    {
      q: "Can lecturers monitor AI conversations?",
      a: "No. The AI Oracle chat is your private assistant. However, it only generates recommendations based on direct feedback provided by your lecturer, ensuring you stay aligned.",
    },
    {
      q: "What file formats are supported?",
      a: "You can upload DOCX files for your thesis drafts, and JPG, PNG, or PDF formats for annotations and whiteboard diagrams.",
    },
  ];

  return (
    <View className="flex-1 bg-tier-bg relative">
      {/* Background decorations */}
      <FloatingOrbs />

      {/* FIXED NAVBAR */}
      <View
        className="fixed top-0 left-0 right-0 z-50 border-b border-tier-border-subtle bg-tier-bg/80 backdrop-blur-md"
        style={{ paddingTop: Platform.OS !== "web" ? insets.top : 0 }}
      >
        <ResponsiveContainer className="h-16 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 items-center justify-center">
              <Text className="text-white font-black text-xs">T</Text>
            </View>
            <Text className="text-tier-text-primary font-black text-lg tracking-tight">
              TierLog
            </Text>
          </View>

          {isDesktop && (
            <View className="flex-row items-center gap-8">
              <Pressable><Text className="text-tier-text-secondary hover:text-tier-text-primary font-medium text-sm">Features</Text></Pressable>
              <Pressable><Text className="text-tier-text-secondary hover:text-tier-text-primary font-medium text-sm">How it Works</Text></Pressable>
              <Pressable><Text className="text-tier-text-secondary hover:text-tier-text-primary font-medium text-sm">Testimonials</Text></Pressable>
              <Pressable><Text className="text-tier-text-secondary hover:text-tier-text-primary font-medium text-sm">FAQ</Text></Pressable>
            </View>
          )}

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.push("/login")}
              className="px-4 py-2 rounded-full hover:bg-white/5 border border-transparent"
            >
              <Text className="text-tier-text-primary font-bold text-sm">Sign In</Text>
            </Pressable>
            {!isMobile && (
              <Pressable
                onPress={() => router.push("/register")}
                className="bg-tier-accent-indigo px-5 py-2.5 rounded-full shadow-glow"
              >
                <Text className="text-white font-bold text-sm">Get Started</Text>
              </Pressable>
            )}
            {isMobile && (
              <Pressable onPress={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                {mobileMenuOpen ? <X size={20} color="#F8FAFC" /> : <Menu size={20} color="#F8FAFC" />}
              </Pressable>
            )}
          </View>
        </ResponsiveContainer>
      </View>

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <View className="absolute top-16 left-0 right-0 z-40 bg-tier-bg-secondary border-b border-tier-border-subtle p-6 gap-4">
          <Pressable onPress={() => setMobileMenuOpen(false)} className="py-2"><Text className="text-tier-text-primary font-semibold text-base">Features</Text></Pressable>
          <Pressable onPress={() => setMobileMenuOpen(false)} className="py-2"><Text className="text-tier-text-primary font-semibold text-base">How it Works</Text></Pressable>
          <Pressable onPress={() => setMobileMenuOpen(false)} className="py-2"><Text className="text-tier-text-primary font-semibold text-base">Testimonials</Text></Pressable>
          <Pressable onPress={() => setMobileMenuOpen(false)} className="py-2"><Text className="text-tier-text-primary font-semibold text-base">FAQ</Text></Pressable>
          <View className="h-[1px] bg-tier-border-subtle my-2" />
          <Pressable
            onPress={() => {
              setMobileMenuOpen(false);
              router.push("/register");
            }}
            className="bg-tier-accent-indigo py-3 rounded-xl items-center"
          >
            <Text className="text-white font-bold">Get Started Free</Text>
          </Pressable>
        </View>
      )}

      {/* MAIN SCROLL CONTENT */}
      <ScrollView
        className="flex-1 mt-16"
        contentContainerStyle={{
          paddingBottom: 80,
        }}
      >
        {/* HERO SECTION */}
        <ResponsiveContainer className="py-20 md:py-32 items-center text-center">
          <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="items-center w-full">
            {/* Badge */}
            <View className="flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-tier-accent-indigo/10 border border-tier-accent-indigo/20 mb-6">
              <View className="w-1.5 h-1.5 rounded-full bg-tier-accent-indigo animate-pulse" />
              <Text className="text-tier-accent-indigo text-xs font-bold uppercase tracking-wider">
                AI-Powered Academic Platform
              </Text>
            </View>

            {/* Glowing Animated Headline */}
            <GlowingSlideText
              fixedPrefix="Elevate Your"
              slidingWords={["Academic Vision", "Thesis Milestones", "Research Potential", "Consultation Flow"]}
              subtitle="Crafting Exceptional Consultations"
              className="my-2"
            />

            {/* Description */}
            <Text className="text-tier-text-secondary text-base md:text-lg max-w-2xl mt-6 text-center leading-relaxed">
              AI-powered thesis supervision that bridges lecturer feedback with student execution.
              Track revisions, collaborate on annotations, and verify milestones in real-time.
            </Text>




          </MotionDiv>
        </ResponsiveContainer>

        {/* STATS BAR */}
        <ScrollReveal>
          <ResponsiveContainer className="py-10 border-t border-b border-tier-border-subtle bg-tier-bg-secondary/40">
            <View className="flex-row flex-wrap justify-between items-center gap-6">
              {[
                { label: "Students Assisted", val: "1,000+" },
                { label: "Lecturers Signed", val: "50+" },
                { label: "Revision Accuracy", val: "95%" },
                { label: "Feedback Loop Duration", val: "3x Faster" },
              ].map((stat, i) => (
                <View key={i} className="flex-1 min-w-[150px] items-center text-center">
                  <Text className="text-tier-text-primary text-3xl font-black">{stat.val}</Text>
                  <Text className="text-tier-text-secondary text-xs font-medium mt-1 uppercase tracking-wide">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </ResponsiveContainer>
        </ScrollReveal>

        {/* FEATURES BENTO GRID */}
        <ScrollReveal delay={0.1}>
          <ResponsiveContainer className="py-20 md:py-32">
            <View className="items-center text-center mb-12">
              <Text className="text-xs font-bold uppercase tracking-widest text-tier-accent-indigo">
                Powerful Features
              </Text>
              <Text className="text-3xl md:text-5xl font-black text-tier-text-primary mt-2">
                Power Up Your Thesis
              </Text>
              <Text className="text-tier-text-secondary text-sm md:text-base max-w-lg mt-3">
                Five AI-driven supervisor tools designed to take you from initial consultation to successful defense.
              </Text>
            </View>

            {/* Asymmetric Grid */}
            <View className="flex-col md:flex-row gap-6">
              {/* Left Column - Large Card + Small Card */}
              <View className="flex-1 flex-col gap-6">
                {/* Audio Card */}
                <GlassCard className="p-8 justify-between min-h-[300px]">
                  <View className="w-12 h-12 rounded-xl bg-tier-accent-indigo/10 items-center justify-center border border-tier-accent-indigo/20 mb-6">
                    <Mic size={24} color="#6366F1" />
                  </View>
                  <View>
                    <Text className="text-tier-text-primary text-xl font-bold">Audio Transcription</Text>
                    <Text className="text-tier-text-secondary text-sm mt-2 leading-relaxed">
                      Powered by Groq Whisper. Automatically records your supervisor session, transcribes the verbal feedback, and details key recommendations.
                    </Text>
                  </View>
                </GlassCard>

                {/* Real-time Sync Card */}
                <GlassCard className="p-8 flex-row items-center gap-6">
                  <View className="w-12 h-12 rounded-xl bg-tier-accent-emerald/10 items-center justify-center border border-tier-accent-emerald/20">
                    <RefreshCw size={24} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-tier-text-primary text-lg font-bold">Real-Time Sync</Text>
                    <Text className="text-tier-text-secondary text-xs mt-1 leading-relaxed">
                      Instant update push notifications and Live Room sync between student and lecturer dashboards.
                    </Text>
                  </View>
                </GlassCard>
              </View>

              {/* Right Column - Small Card + Large Card */}
              <View className="flex-1 flex-col gap-6">
                {/* AI Oracle Card */}
                <GlassCard className="p-8 flex-row items-center gap-6">
                  <View className="w-12 h-12 rounded-xl bg-tier-accent-cyan/10 items-center justify-center border border-tier-accent-cyan/20">
                    <MessageSquare size={24} color="#06B6D4" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-tier-text-primary text-lg font-bold">AI Oracle</Text>
                    <Text className="text-tier-text-secondary text-xs mt-1 leading-relaxed">
                      Chat privately with an AI companion tailored exactly to explain your lecturer's comments.
                    </Text>
                  </View>
                </GlassCard>

                {/* Guarded AI Card */}
                <GlassCard className="p-8 justify-between min-h-[300px]">
                  <View className="w-12 h-12 rounded-xl bg-tier-accent-violet/10 items-center justify-center border border-tier-accent-violet/20 mb-6">
                    <Shield size={24} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="text-tier-text-primary text-xl font-bold">Guarded AI Scope</Text>
                    <Text className="text-tier-text-secondary text-sm mt-2 leading-relaxed">
                      Academic integrity guardrails prevent the AI from writing your thesis for you. It only suggests revisions and answers methodological questions.
                    </Text>
                  </View>
                </GlassCard>
              </View>

              {/* Extra Single Column Widget: OCR Vision */}
              <View className="w-full md:w-[30%] flex-col gap-6">
                <GlassCard className="p-8 justify-between flex-1 min-h-[250px]">
                  <View className="w-12 h-12 rounded-xl bg-tier-accent-rose/10 items-center justify-center border border-tier-accent-rose/20 mb-6">
                    <Camera size={24} color="#F43F5E" />
                  </View>
                  <View>
                    <Text className="text-tier-text-primary text-lg font-bold">OCR Annotations</Text>
                    <Text className="text-tier-text-secondary text-xs mt-2 leading-relaxed">
                      Upload sketches, whiteboard ideas or physical paper feedback. OCR extract tasks and appends them to your backlog instantly.
                    </Text>
                  </View>
                </GlassCard>
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollReveal>

        {/* HOW IT WORKS */}
        <ScrollReveal delay={0.2}>
          <ResponsiveContainer className="py-20 md:py-32 bg-tier-bg-secondary/20 border-t border-b border-tier-border-subtle">
            <View className="items-center text-center mb-16">
              <Text className="text-xs font-bold uppercase tracking-widest text-tier-accent-indigo">
                Execution
              </Text>
              <Text className="text-3xl md:text-5xl font-black text-tier-text-primary mt-2">
                From Upload to Excellence
              </Text>
            </View>

            <View className="flex-col md:flex-row justify-between gap-10">
              {[
                { num: "01", title: "Upload Draft", desc: "Submit your thesis text draft along with whiteboard photos or consultation audio clips." },
                { num: "02", title: "Transcribe", desc: "Whisper models auto-transcribe consultation recordings, highlighting exact feedback tasks." },
                { num: "03", title: "Revise", desc: "Interact with the AI Oracle to get instant, actionable instructions to fulfill feedback." },
                { num: "04", title: "Validate", desc: "Submit structured revisions. Lecturers review and check off requirements cleanly." },
              ].map((step, idx) => (
                <View key={idx} className="flex-1 gap-3">
                  <Text className="text-5xl font-black text-tier-accent-indigo/20">{step.num}</Text>
                  <Text className="text-tier-text-primary text-lg font-bold mt-1">{step.title}</Text>
                  <Text className="text-tier-text-secondary text-sm leading-relaxed mt-1">{step.desc}</Text>
                </View>
              ))}
            </View>
          </ResponsiveContainer>
        </ScrollReveal>

        {/* TESTIMONIALS CAROUSEL */}
        <ScrollReveal delay={0.3}>
          <ResponsiveContainer className="py-20 md:py-32 items-center">
            <Text className="text-xs font-bold uppercase tracking-widest text-tier-accent-indigo">
              Success Stories
            </Text>
            <Text className="text-3xl md:text-5xl font-black text-tier-text-primary mt-2 mb-12 text-center">
              Conversations that Become Research
            </Text>

            <View className="w-full max-w-2xl">
              <GlassCard className="p-8 md:p-12 relative min-h-[220px] justify-between">
                <View className="flex-row gap-1 mb-4">
                  {Array.from({ length: testimonials[activeTestimonial].stars }).map((_, i) => (
                    <Star key={i} size={16} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </View>
                <Text className="text-tier-text-primary text-base md:text-lg italic font-medium leading-relaxed">
                  "{testimonials[activeTestimonial].quote}"
                </Text>
                <View className="flex-row justify-between items-center mt-6">
                  <View>
                    <Text className="text-tier-text-primary font-bold text-sm">
                      {testimonials[activeTestimonial].author}
                    </Text>
                    <Text className="text-tier-text-secondary text-xs font-medium">
                      {testimonials[activeTestimonial].role}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() =>
                        setActiveTestimonial((prev) =>
                          prev === 0 ? testimonials.length - 1 : prev - 1
                        )
                      }
                      className="w-10 h-10 rounded-full border border-tier-border-subtle hover:bg-white/5 items-center justify-center"
                    >
                      <Text className="text-tier-text-primary text-lg font-bold">←</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setActiveTestimonial((prev) =>
                          prev === testimonials.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="w-10 h-10 rounded-full border border-tier-border-subtle hover:bg-white/5 items-center justify-center"
                    >
                      <Text className="text-tier-text-primary text-lg font-bold">→</Text>
                    </Pressable>
                  </View>
                </View>
              </GlassCard>

              {/* Dots */}
              <View className="flex-row justify-center gap-2 mt-6">
                {testimonials.map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setActiveTestimonial(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeTestimonial === i ? "w-6 bg-tier-accent-indigo" : "w-2 bg-tier-border-medium"
                    }`}
                  />
                ))}
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollReveal>

        {/* CTA SECTION */}
        <ScrollReveal delay={0.4}>
          <ResponsiveContainer className="py-20 md:py-28">
            <GlassCard className="p-8 md:p-16 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-tier-accent-indigo/20 overflow-hidden relative items-center text-center">
              <View className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
              <Text className="text-3xl md:text-5xl font-black text-tier-text-primary tracking-tight max-w-xl text-center">
                Ready to Transform Your Thesis Journey?
              </Text>
              <Text className="text-tier-text-secondary text-sm md:text-base max-w-md mt-4 text-center">
                Start logging your consultation notes, syncing with your advisor, and executing feedback cleanly.
              </Text>
              <View className="flex-row gap-4 mt-8 w-full max-w-xs md:max-w-sm justify-center">
                <View className="flex-1">
                  <ElegantButton
                    title="Get Started Free"
                    tone="primary"
                    size="lg"
                    onPress={() => router.push("/register")}
                  />
                </View>
              </View>
            </GlassCard>
          </ResponsiveContainer>
        </ScrollReveal>

        {/* FAQ SECTION */}
        <ScrollReveal delay={0.5}>
          <ResponsiveContainer className="py-20 md:py-32 items-center">
            <View className="items-center text-center mb-16">
              <Text className="text-xs font-bold uppercase tracking-widest text-tier-accent-indigo">
                FAQ
              </Text>
              <Text className="text-3xl md:text-5xl font-black text-tier-text-primary mt-2">
                Frequently Asked Questions
              </Text>
            </View>

            <View className="w-full max-w-3xl gap-4">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <GlassCard key={idx} className="p-6 transition-all duration-300 overflow-hidden">
                    <Pressable
                      onPress={() => setActiveFaq(isOpen ? null : idx)}
                      className="flex-row justify-between items-center"
                    >
                      <Text className="text-tier-text-primary text-base font-bold flex-1 pr-4">
                        {faq.q}
                      </Text>
                      <ChevronDown
                        size={18}
                        color="#F8FAFC"
                        style={{
                          transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                        }}
                      />
                    </Pressable>
                    {isOpen && (
                      <View className="mt-4 pt-4 border-t border-tier-border-subtle">
                        <Text className="text-tier-text-secondary text-sm leading-relaxed">
                          {faq.a}
                        </Text>
                      </View>
                    )}
                  </GlassCard>
                );
              })}
            </View>
          </ResponsiveContainer>
        </ScrollReveal>

        {/* FOOTER */}
        <ResponsiveContainer className="py-12 border-t border-tier-border-subtle mt-10">
          <View className="flex-col md:flex-row justify-between items-center gap-6">
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-5 rounded bg-gradient-to-r from-indigo-500 to-violet-500 items-center justify-center">
                <Text className="text-white font-black text-[10px]">T</Text>
              </View>
              <Text className="text-tier-text-primary font-bold text-sm">TierLog</Text>
            </View>
            <Text className="text-tier-text-tertiary text-xs">
              &copy; 2026 TierLog. All rights reserved.
            </Text>
            <View className="flex-row gap-6">
              <Pressable><Text className="text-tier-text-tertiary hover:text-tier-text-primary text-xs font-semibold">Privacy Policy</Text></Pressable>
              <Pressable><Text className="text-tier-text-tertiary hover:text-tier-text-primary text-xs font-semibold">Terms of Service</Text></Pressable>
              <Pressable><Text className="text-tier-text-tertiary hover:text-tier-text-primary text-xs font-semibold">Contact Support</Text></Pressable>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}
