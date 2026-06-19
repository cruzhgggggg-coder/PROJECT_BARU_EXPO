import { View, Text } from "react-native";
import { cn } from "@/src/lib/utils";

export function AnimatedBadge({
  label,
  dotColor = "bg-rose-500/80",
  className,
}: {
  label: string;
  dotColor?: string;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "inline-flex flex-row items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1",
        className
      )}
    >
      <View className={cn("h-2 w-2 rounded-full", dotColor)} />
      <Text className="text-sm tracking-wide text-white/60">{label}</Text>
    </View>
  );
}
