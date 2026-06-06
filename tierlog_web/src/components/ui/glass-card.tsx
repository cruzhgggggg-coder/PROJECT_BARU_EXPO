import { View, Platform } from "react-native";
import { cn } from "@/src/lib/utils";

const webGlassStyles = Platform.select({
  web: {
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow:
      "inset 0 1px 1px 0 rgba(255,255,255,0.08), 0 10px 15px -3px rgba(0,0,0,0.3)",
  } as any,
  default: undefined,
});

export function GlassCard({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: any;
}) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6",
        className
      )}
      style={[webGlassStyles, style]}
    >
      {children}
    </View>
  );
}
