import { Platform, View } from "react-native";
import { cn } from "@/src/lib/utils";

const surfaceStyles = Platform.select({
  web: {
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow:
      "inset 0 1px 1px 0 rgba(255,255,255,0.05), 0 10px 40px -10px rgba(0,0,0,0.5)",
  } as any,
  default: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
  },
});

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

export function GlassCard({ children, className, style }: GlassCardProps) {
  return (
    <View
      className={cn(
        "rounded-base border border-tier-border-subtle bg-tier-bg-secondary p-6",
        className
      )}
      style={[surfaceStyles, style]}
    >
      {children}
    </View>
  );
}
