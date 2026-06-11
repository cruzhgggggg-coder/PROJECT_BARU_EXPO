import { Text } from "react-native";
import { cn } from "@/src/lib/utils";

export function GradientText({
  children,
  className,
  gradientFrom = "from-white",
  gradientTo = "to-white/80",
}: {
  children: React.ReactNode;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
}) {
  return (
    <Text
      className={cn(
        "bg-clip-text text-transparent",
        `bg-gradient-to-b ${gradientFrom} ${gradientTo}`,
        className
      )}
    >
      {children}
    </Text>
  );
}
