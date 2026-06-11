import { Redirect } from "expo-router";
import React from "react";

import { useAuth } from "@/src/providers/AuthProvider";
import { LoadingScreen } from "@/src/components/ui/loading-screen";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { booting, user } = useAuth();

  if (booting) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
}
