import { router, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { BackHandler, Platform, Pressable, Text, View } from "react-native";
import {
  LayoutDashboard,
  MessageSquare,
  Archive,
  User,
  Lock,
  Cpu,
  LogOut,
  Menu,
  X,
} from "lucide-react-native";

import { useAuth } from "@/src/providers/AuthProvider";
import { MotionDiv } from "@/src/lib/motion";
import { slideDown } from "@/src/lib/animations";
import { useIsMobile } from "@/src/hooks";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = user?.role === "lecturer" ? lecturerLinks : studentLinks;
  const isMobile = useIsMobile(1024);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      setMobileMenuOpen(false);
      return true;
    });
    return () => handler.remove();
  }, [mobileMenuOpen]);

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={slideDown}
      style={{ zIndex: 99999 }}
    >
      <View className="flex-row items-center justify-between px-5 py-3 bg-[#030303]/80 border-b border-white/[0.08] rounded-2xl mb-2 gap-4 flex-wrap"
        style={Platform.OS === "web" ? { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 99999 } as any : { zIndex: 99999 }}
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

        {!isMobile ? (
        <View className="flex-row gap-1.5 flex-wrap items-center">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const isHovered = hoveredLink === link.href;
            const Icon = link.Icon;

            return (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href)}
                onHoverIn={() => setHoveredLink(link.href)}
                onHoverOut={() => setHoveredLink(null)}
                className={[
                  "flex-row items-center gap-[7px] px-3.5 py-[9px] rounded-[10px] border",
                  isActive
                    ? "bg-[#6366F1] border-[#6366F1]/20"
                    : isHovered
                    ? "bg-[#6366F1]/[0.08] border-[#6366F1]/[0.15]"
                    : "bg-transparent border-transparent",
                ].join(" ")}
                style={{ transition: "all 0.2s ease", transform: [{ scale: isHovered ? 1.01 : 1 }] } as any}
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
                      : isHovered
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
            onHoverIn={() => setHoveredLink("logout")}
            onHoverOut={() => setHoveredLink(null)}
            className={[
              "flex-row items-center gap-[7px] px-3.5 py-[9px] rounded-[10px] border",
              hoveredLink === "logout"
                ? "bg-[#EF4444] border-[#EF4444]/20"
                : "bg-transparent border-transparent",
            ].join(" ")}
            style={{ transition: "all 0.2s ease" } as any}
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
        ) : (
        <View style={{ zIndex: 99999 }}>
          <Pressable
            onPress={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-[10px]"
          >
            {mobileMenuOpen ? (
              <X color="#F8FAFC" size={22} />
            ) : (
              <Menu color="#F8FAFC" size={22} />
            )}
          </Pressable>

          {mobileMenuOpen && (
            <View
              className="absolute top-full right-0 mt-2 bg-[#030303] border border-white/[0.08] rounded-xl py-2 min-w-[200px] z-[99999]"
              style={{ zIndex: 99999, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10 }}
            >
              {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.Icon;

                return (
                  <Pressable
                    key={link.href}
                    onPress={() => {
                      setMobileMenuOpen(false);
                      router.push(link.href);
                    }}
                    className={[
                      "flex-row items-center gap-2.5 px-4 py-3 mx-1 rounded-lg",
                      isActive ? "bg-[#6366F1]/20" : "bg-transparent",
                    ].join(" ")}
                  >
                    <Icon
                      color={isActive ? "#6366F1" : "#94A3B8"}
                      size={16}
                    />
                    <Text
                      className={[
                        "text-[13px] font-bold tracking-[-0.1px]",
                        isActive ? "text-white" : "text-[#94A3B8]",
                      ].join(" ")}
                    >
                      {link.label}
                    </Text>
                  </Pressable>
                );
              })}

              <View className="h-px bg-white/[0.08] mx-3 my-1" />

              <Pressable
                onPress={() => {
                  setMobileMenuOpen(false);
                  void logout();
                }}
                className="flex-row items-center gap-2.5 px-4 py-3 mx-1 rounded-lg"
              >
                <LogOut color="#EF4444" size={16} />
                <Text className="text-[13px] font-bold tracking-[-0.1px] text-[#EF4444]">
                  Sign Out
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        )}
      </View>
    </MotionDiv>
  );
}
