import { router, usePathname } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import {
  LayoutDashboard,
  MessageSquare,
  Archive,
  User,
  Lock,
  Cpu,
  LogOut,
} from "lucide-react-native";

import { useAuth } from "@/src/providers/AuthProvider";
import { MotionDiv } from "@/src/lib/motion";
import { slideDown } from "@/src/lib/animations";

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/consultations", label: "Consultation", Icon: MessageSquare },
  { href: "/archive", label: "Archive", Icon: Archive },
  { href: "/settings/profile", label: "Profile", Icon: User },
  { href: "/settings/security", label: "Security", Icon: Lock },
  { href: "/settings/ai-gateway", label: "AI Gateway", Icon: Cpu },
] as const;

const lecturerLinks = [
  { href: "/lecturer-dashboard", label: "Students", Icon: User },
  { href: "/archive", label: "Archive", Icon: Archive },
  { href: "/settings/profile", label: "Profile", Icon: User },
  { href: "/settings/security", label: "Security", Icon: Lock },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const links = user?.role === "lecturer" ? lecturerLinks : studentLinks;

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={slideDown}
    >
      <View className="flex-row items-center justify-between px-5 py-3 bg-[#030303]/80 border-b border-white/[0.08] rounded-2xl mb-2 gap-4 flex-wrap"
        style={Platform.OS === "web" ? { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" } as any : undefined}
      >
        <View className="gap-1">
          <Text className="text-[#F8FAFC] text-lg font-black tracking-tight">
            TierLog
          </Text>
          <View className="flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
            <Text className="text-[#94A3B8] text-xs font-semibold">
              {user?.name} · {user?.role === "lecturer" ? "Advisor" : "Student"}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-1.5 flex-wrap items-center">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const isHovered = hoveredLink === link.href;
            const Icon = link.Icon;

            return (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href)}
                onHoverIn={Platform.OS === "web" ? () => setHoveredLink(link.href) : undefined}
                onHoverOut={Platform.OS === "web" ? () => setHoveredLink(null) : undefined}
                className={[
                  "flex-row items-center gap-[7px] px-3.5 py-[9px] rounded-[10px] border",
                  isActive
                    ? "bg-[#6366F1] border-[#6366F1]/20"
                    : isHovered && Platform.OS === "web"
                    ? "bg-[#6366F1]/[0.08] border-[#6366F1]/[0.15]"
                    : "bg-transparent border-transparent",
                ].join(" ")}
                style={Platform.OS === "web" ? { transition: "all 0.2s ease", transform: [{ scale: isHovered ? 1.01 : 1 }] } as any : undefined}
              >
                <Icon
                  color={isActive ? "#ffffff" : isHovered ? "#6366F1" : "#94A3B8"}
                  size={15}
                />
                <Text
                  className={[
                    "text-[13px] font-bold tracking-[-0.1px]",
                    isActive
                      ? "text-white"
                      : isHovered && Platform.OS === "web"
                      ? "text-[#6366F1]"
                      : "text-[#94A3B8]",
                  ].join(" ")}
                >
                  {link.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => void logout()}
            onHoverIn={Platform.OS === "web" ? () => setHoveredLink("logout") : undefined}
            onHoverOut={Platform.OS === "web" ? () => setHoveredLink(null) : undefined}
            className={[
              "flex-row items-center gap-[7px] px-3.5 py-[9px] rounded-[10px] border",
              hoveredLink === "logout" && Platform.OS === "web"
                ? "bg-[#EF4444] border-[#EF4444]/20"
                : "bg-transparent border-transparent",
            ].join(" ")}
            style={Platform.OS === "web" ? { transition: "all 0.2s ease" } as any : undefined}
          >
            <LogOut
              color={hoveredLink === "logout" ? "#ffffff" : "#EF4444"}
              size={15}
            />
            <Text
              className={[
                "text-[13px] font-bold tracking-[-0.1px]",
                hoveredLink === "logout" ? "text-white" : "text-[#EF4444]",
              ].join(" ")}
            >
              Sign Out
            </Text>
          </Pressable>
        </View>
      </View>
    </MotionDiv>
  );
}
