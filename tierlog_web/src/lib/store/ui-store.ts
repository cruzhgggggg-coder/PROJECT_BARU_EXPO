/**
 * TierLog UI store — central place for UI preferences.
 *
 * Zustand-backed. Persisted to AsyncStorage so preferences survive restarts.
 * This is the "Flexibility & customization" layer from the Apple design docs:
 * font scaling (accessibility for senior lecturers) and sidebar collapse state.
 *
 * Note on theme: deliberately locked to "dark" (Phase 1 keeps the existing
 * dark theme — see DESIGN_SYSTEM.md). The field exists so a future light mode
 * can be wired in without touching call sites.
 *
 * Reference: TIERLOG_IMPLEMENTATION_GUIDE.md §2
 */
import { Platform } from "react-native";
import { create } from "zustand";

// Lazy-load AsyncStorage (web falls back to a no-op shim below).
type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

let AsyncStorageShim: AsyncStorageLike;
if (Platform.OS === "web") {
  // Minimal localStorage-backed shim; guarded so SSR / non-browser is safe.
  AsyncStorageShim = {
    getItem: async (key) => {
      try {
        return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        if (typeof window !== "undefined") window.localStorage.setItem(key, value);
      } catch {
        /* storage full / blocked — ignore */
      }
    },
  };
} else {
  // Native: require the real module (already a dependency in package.json).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorageShim = require("@react-native-async-storage/async-storage").default;
}

const STORAGE_KEY = "tierlog.ui.v1";

export type FontSize = "normal" | "large";

export interface UIState {
  /** 16px vs 20px base — accessibility for senior lecturers. */
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;

  /** Desktop sidebar collapsed to icon-only. */
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  /** Theme lock. "dark" for Phase 1; future light mode hooks here. */
  theme: "dark";

  /** Re-hydrate preferences from storage on app boot. */
  hydrate: () => Promise<void>;
}

export const useUIStore = create<UIState>((set, get) => ({
  fontSize: "normal",
  isSidebarCollapsed: false,
  theme: "dark",

  setFontSize: (size) => {
    set({ fontSize: size });
    void persist(get());
  },

  toggleSidebarCollapse: () => {
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }));
    void persist(get());
  },

  setSidebarCollapsed: (collapsed) => {
    set({ isSidebarCollapsed: collapsed });
    void persist(get());
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorageShim.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<UIState>;
      // Only accept known fields; ignore anything unexpected.
      set({
        ...(parsed.fontSize === "normal" || parsed.fontSize === "large"
          ? { fontSize: parsed.fontSize }
          : null),
        ...(typeof parsed.isSidebarCollapsed === "boolean"
          ? { isSidebarCollapsed: parsed.isSidebarCollapsed }
          : null),
      });
    } catch (err) {
      // Corrupt storage shouldn't crash the app — just warn.
      console.warn("[ui-store] failed to hydrate:", err);
    }
  },
}));

async function persist(state: UIState) {
  try {
    const payload = JSON.stringify({
      fontSize: state.fontSize,
      isSidebarCollapsed: state.isSidebarCollapsed,
    });
    await AsyncStorageShim.setItem(STORAGE_KEY, payload);
  } catch (err) {
    console.warn("[ui-store] failed to persist:", err);
  }
}

/**
 * Convenience selector: map current fontSize to a Tailwind text-size class.
 * Use at the root layout to scale body text globally.
 */
export function fontSizeClass(size: FontSize): string {
  return size === "large" ? "text-lg" : "text-base";
}
