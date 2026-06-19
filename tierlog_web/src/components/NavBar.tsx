import { router, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { BackHandler, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  Briefcase,
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
  { href: "/workspace", label: "Workspace", Icon: Briefcase },
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
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
      <View
        className="flex-row items-center justify-between px-5 py-3 bg-tier-bg-deep/80 border-b border-tier-divider-light rounded-base mb-2 gap-4 flex-wrap"
        style={[
          Platform.OS === "web"
            ? ({ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 99999 } as any)
            : { zIndex: 99999 },
          { paddingTop: 12 + insets.top },
        ]}
      >
        {/* Brand */}
        <View className="gap-1">
          <Text className="text-tier-text-primary text-lg font-bold tracking-tight font-display">
            TierLog
          </Text>
          <View className="flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-tier-accent-success shadow-tier-xs" />
            <Text className="text-tier-text-secondary text-xs font-semibold font-sans">
              {user?.name} · {user?.role === "lecturer" ? "Advisor" : "Student"}
            </Text>
          </View>
        </View>

        {/* Desktop links */}
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
                accessibilityLabel={link.label}
                accessibilityRole="link"
                accessibilityState={{ selected: isActive }}
                className={[
                  "flex-row items-center gap-[7px] px-3.5 py-[9px] rounded-sm border min-h-[44px]",
                  isActive
                    ? "bg-tier-accent-primary border-tier-accent-primary-deep/20"
                    : isHovered
                    ? "bg-tier-accent-primary/8 border-tier-accent-primary/15"
                    : "bg-transparent border-transparent",
                ].join(" ")}
                style={
                  Platform.OS === "web"
                    ? ({ transition: "all 0.15s cubic-bezier(0.4,0,0.2,1)", transform: [{ scale: isHovered ? 1.01 : 1 }] } as any)
                    : { transform: [{ scale: isHovered ? 1.01 : 1 }] }
                }
              >
                <Icon
                  color={isActive ? "#ffffff" : isHovered ? "#6366F1" : "#94A3B8"}
                  size={15}
                />
                <Text
                  className={[
                    "text-[13px] font-bold tracking-[-0.1px] font-sans",
                    isActive
                      ? "text-white"
                      : isHovered
                      ? "text-tier-accent-primary"
                      : "text-tier-text-secondary",
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
            accessibilityLabel="Sign out"
            accessibilityRole="menuitem"
            className={[
              "flex-row items-center gap-[7px] px-3.5 py-[9px] rounded-sm border min-h-[44px]",
              hoveredLink === "logout"
                ? "bg-tier-accent-danger-bright border-tier-accent-danger/20"
                : "bg-transparent border-transparent",
            ].join(" ")}
            style={Platform.OS === "web" ? ({ transition: "all 0.15s cubic-bezier(0.4,0,0.2,1)" } as any) : undefined}
          >
            <LogOut
              color={hoveredLink === "logout" ? "#ffffff" : "#DC2626"}
              size={15}
            />
            <Text
              className={[
                "text-[13px] font-bold tracking-[-0.1px] font-sans",
                hoveredLink === "logout" ? "text-white" : "text-tier-accent-danger",
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
            accessibilityLabel={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            accessibilityRole="button"
            accessibilityState={{ expanded: mobileMenuOpen }}
            className="p-3 rounded-sm min-w-[44px] min-h-[44px] items-center justify-center"
          >
            {mobileMenuOpen ? (
              <X color="#F8FAFC" size={22} />
            ) : (
              <Menu color="#F8FAFC" size={22} />
            )}
          </Pressable>

          {mobileMenuOpen && (
            <>
              <Pressable
                onPress={() => setMobileMenuOpen(false)}
                style={{
                  position: (Platform.OS === "web" ? "fixed" : "absolute") as "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 99998,
                } as any}
              />
              <View
                className="absolute top-full right-0 mt-2 bg-tier-surface border border-tier-divider-base rounded-md py-2 min-w-[200px] shadow-tier-md"
                style={{ zIndex: 99999, elevation: 10 }}
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
                    accessibilityLabel={link.label}
                    accessibilityRole="menuitem"
                    className={[
                      "flex-row items-center gap-2.5 px-4 py-3.5 mx-1 rounded-sm min-h-[44px]",
                      isActive ? "bg-tier-accent-primary/20" : "bg-transparent",
                    ].join(" ")}
                  >
                    <Icon
                      color={isActive ? "#6366F1" : "#94A3B8"}
                      size={16}
                    />
                    <Text
                      className={[
                        "text-[13px] font-bold tracking-[-0.1px] font-sans",
                        isActive ? "text-tier-accent-primary" : "text-tier-text-secondary",
                      ].join(" ")}
                    >
                      {link.label}
                    </Text>
                  </Pressable>
                );
              })}

              <View className="h-px bg-tier-divider-light mx-3 my-1" />

              <Pressable
                onPress={() => {
                  setMobileMenuOpen(false);
                  void logout();
                }}
                accessibilityLabel="Sign out"
                accessibilityRole="menuitem"
                className="flex-row items-center gap-2.5 px-4 py-3.5 mx-1 rounded-sm min-h-[44px]"
              >
                <LogOut color="#DC2626" size={16} />
                <Text className="text-[13px] font-bold tracking-[-0.1px] text-tier-accent-danger font-sans">
                  Sign Out
                </Text>
              </Pressable>
              </View>
            </>
          )}
        </View>
        )}
      </View>
    </MotionDiv>
  );
}
