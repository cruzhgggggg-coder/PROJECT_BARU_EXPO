import React from "react";
import { Platform, Text } from "react-native";
import { cn } from "@/src/lib/utils";

const ease = [0.23, 0.86, 0.39, 0.96] as [number, number, number, number];

export function TextReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  if (Platform.OS === "web") {
    return <TextRevealWeb text={text} className={className} delay={delay} />;
  }
  return <TextRevealNative text={text} className={className} />;
}

function TextRevealWeb({ text, className, delay }: { text: string; className?: string; delay?: number }) {
  const { motion } = require("framer-motion");
  const words = text.split(" ");

  return (
    <span className={cn("inline-flex flex-wrap", className)}>
      {words.map((word: string, wi: number) => (
        <span key={wi} className="inline-flex mr-[0.3em]">
          {word.split("").map((char: string, ci: number) => (
            <motion.span
              key={ci}
              initial={{ opacity: 0, y: 40, rotateX: -80 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                duration: 0.5,
                delay: (delay ?? 0) + wi * 0.06 + ci * 0.02,
                ease,
              }}
              className="inline-block"
              style={{ perspective: 600 } as any}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
}

function TextRevealNative({ text, className }: { text: string; className?: string }) {
  return (
    <Text className={cn(className)}>
      {text}
    </Text>
  );
}
