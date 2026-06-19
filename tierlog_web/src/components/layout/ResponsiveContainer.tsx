// src/components/layout/ResponsiveContainer.tsx
import React from "react";
import { View } from "react-native";
import { useResponsive } from "@/src/lib/responsive";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  style?: any;
}

export function ResponsiveContainer({
  children,
  className = "",
  maxWidth = "xl",
  style,
}: ResponsiveContainerProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const maxWidthMap = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
  };
  
  return (
    <View
      className={`
        w-full mx-auto
        ${isMobile ? "px-5" : ""}
        ${isTablet ? "px-8" : ""}
        ${isDesktop ? "px-12" : ""}
        ${isDesktop ? maxWidthMap[maxWidth] : ""}
        ${className}
      `}
      style={style}
    >
      {children}
    </View>
  );
}
