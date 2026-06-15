import { View, Platform } from "react-native";
import { cn } from "@/src/lib/utils";

const webGlassStyles = Platform.select({
  web: {
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "inset 0 1px 1px 0 rgba(255,255,255,0.08), 0 10px 15px -3px rgba(0,0,0,0.3)",
  } as any,
  default: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
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
        "rounded-2xl border border-white/15 bg-white/[0.05] p-6",
        className
      )}
      style={[webGlassStyles, style]}
    >
      {children}
    </View>
  );
}
