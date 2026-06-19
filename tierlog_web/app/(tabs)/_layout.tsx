import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { LayoutDashboard, MessageSquare, Archive, Settings } from "lucide-react-native";

/**
 * Bottom tab navigator for Android.
 * On web, this layout is bypassed — the NavBar component handles navigation.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // On web, we skip the tabs layout entirely
  if (Platform.OS === "web") {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0F172A",
          borderTopColor: "rgba(255,255,255,0.08)",
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="consultations"
        options={{
          title: "Consult",
          tabBarIcon: ({ color, size }) => (
            <MessageSquare color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: "Archive",
          tabBarIcon: ({ color, size }) => (
            <Archive color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
