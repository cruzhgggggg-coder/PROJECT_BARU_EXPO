import "../global.css";
import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/src/providers/AuthProvider";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";

// U-6: Root-level ErrorBoundary wraps entire app.
// Consider adding per-route ErrorBoundary wrappers for feature isolation.
// Example: <ErrorBoundary><RequireAuth>...</RequireAuth></ErrorBoundary>
// M-4: TODO - Integrate error logging service (Sentry or LogRocket)
// Install: npx expo install sentry-expo
// Wrap AuthProvider with Sentry initialization for crash reporting
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
