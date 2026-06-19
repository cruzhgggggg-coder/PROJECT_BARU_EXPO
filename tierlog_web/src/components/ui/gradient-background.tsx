import { View } from "react-native";
import { cn } from "@/src/lib/utils";

export function GradientBackground({
  className,
}: {
  className?: string;
}) {
  return (
    <View
      pointerEvents="none"
      className={cn(
        "absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl",
        className
      )}
    />
  );
}
