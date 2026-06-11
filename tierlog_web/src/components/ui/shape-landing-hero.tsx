import React from "react";
import { Platform, Text, View } from "react-native";
import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/src/lib/utils";

function ElegantShape({
  className,
  delay = 0,
  size = 400,
  color = "indigo",
  style,
}: {
  className?: string;
  delay?: number;
  size?: number;
  color?: "indigo" | "sky" | "emerald" | "violet";
  style?: any;
}) {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500/[0.15] to-transparent",
    sky: "from-sky-500/[0.12] to-transparent",
    emerald: "from-emerald-500/[0.12] to-transparent",
    violet: "from-violet-500/[0.14] to-transparent",
  };

  const gradientClass = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
      animate={{ opacity: 1, scale: 1, rotate: 1 }}
      transition={{
        duration: 2,
        delay,
        ease: "easeOut",
      }}
      className={cn("absolute", className)}
      style={{ width: size, height: size, ...style } as any}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "w-full h-full rounded-full bg-gradient-to-r",
          gradientClass
        )}
      />

      {/* Inner glow effect replacing the after: pseudo-element */}
      <View
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "80%",
          height: "80%",
          borderRadius: 9999,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
        } as any}
      />
    </motion.div>
  );
}

function HeroGeometric({
  badge = "Design Collective",
  title1 = "Elevate Your Digital Vision",
  title2 = "Crafting Exceptional Websites",
}: {
  badge?: string;
  title1?: string;
  title2?: string;
}) {
  return (
    <View className="relative w-full min-h-screen overflow-hidden bg-[#030303]">
      {/* Ambient gradient wash overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)",
        } as any}
      />

      {/* Floating geometric shapes */}
      <ElegantShape
        color="indigo"
        size={500}
        delay={0.2}
        className="top-[-10%] left-[-5%] opacity-70"
      />
      <ElegantShape
        color="sky"
        size={350}
        delay={0.4}
        className="top-[20%] right-[-8%] opacity-60"
      />
      <ElegantShape
        color="emerald"
        size={280}
        delay={0.6}
        className="bottom-[10%] left-[15%] opacity-50"
      />
      <ElegantShape
        color="violet"
        size={200}
        delay={0.8}
        className="top-[55%] right-[20%] opacity-40"
      />

      {/* Noise texture overlay for depth */}
      {Platform.OS === "web" && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            zIndex: 1,
          }}
        />
      )}

      {/* Main content */}
      <View
        className="relative z-10 flex flex-col items-center justify-center px-6 py-24"
        style={{ minHeight: "100%" }}
      >
        {/* Badge pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={cn(
            "mb-8 flex flex-row items-center gap-2 rounded-full",
            "border border-white/10 bg-white/[0.04] px-4 py-2",
            "backdrop-blur-sm"
          )}
        >
          <Circle size={8} className="text-indigo-400" fill="currentColor" />
          <Text className="text-sm font-medium text-white/70">{badge}</Text>
        </motion.div>

        {/* Title line 1 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center"
        >
          <Text
            className={cn(
              "text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl",
              "bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text"
            )}
            style={{
              backgroundImage:
                "linear-gradient(to bottom, #ffffff 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.4) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            } as any}
          >
            {title1}
          </Text>
        </motion.div>

        {/* Spacer line */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="my-6 h-px w-24 bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent"
        />

        {/* Title line 2 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center"
        >
          <Text
            className={cn(
              "text-xl font-medium tracking-wide text-white/50 sm:text-2xl md:text-3xl"
            )}
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            } as any}
          >
            {title2}
          </Text>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-8 max-w-lg text-center"
        >
          <Text className="text-base leading-relaxed text-white/40 sm:text-lg">
            We blend cutting-edge technology with timeless design principles to
            create digital experiences that captivate, engage, and convert.
          </Text>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-10 flex flex-row items-center gap-4"
        >
          <View
            className={cn(
              "rounded-xl bg-indigo-600 px-6 py-3",
              "shadow-lg shadow-indigo-500/25"
            )}
          >
            <Text className="text-sm font-semibold text-white">
              Get Started
            </Text>
          </View>
          <View
            className={cn(
              "rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3",
              "backdrop-blur-sm"
            )}
          >
            <Text className="text-sm font-semibold text-white/70">
              Learn More
            </Text>
          </View>
        </motion.div>
      </View>

      {/* Bottom gradient fade into page content */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background:
            "linear-gradient(to top, #030303 0%, transparent 100%)",
        } as any}
      />
    </View>
  );
}

export { HeroGeometric };
