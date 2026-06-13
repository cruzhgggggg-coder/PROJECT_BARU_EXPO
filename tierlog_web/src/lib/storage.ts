import { Platform } from "react-native";

type AuthSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  user: unknown;
};

const AUTH_KEY = "tierlog.auth";

// ─── Storage Strategy ───────────────────────────────────────
// Web:       sessionStorage (F-1: reduced XSS persistence window)
// Native:    expo-secure-store (encrypted, production)
//            Falls back to @react-native-async-storage/async-storage (Expo Go / dev)
// ─────────────────────────────────────────────────────────────

let SecureStore: any = null;
let AsyncStorage: any = null;
let storageBackend: "secure" | "async" | null = null;

async function getStorageBackend(): Promise<"secure" | "async" | null> {
  if (Platform.OS === "web") return null;
  if (storageBackend) return storageBackend;

  // Try expo-secure-store first (production builds)
  try {
    SecureStore = require("expo-secure-store");
    // Quick test: check if SecureStore actually works on this device
    await SecureStore.getItemAsync("__test__");
    storageBackend = "secure";
  } catch {
    // SecureStore not available (Expo Go) - fall back to AsyncStorage
    try {
      AsyncStorage = require("@react-native-async-storage/async-storage").default;
      storageBackend = "async";
    } catch {
      storageBackend = null;
    }
  }

  return storageBackend;
}

export async function loadAuthSnapshot(): Promise<AuthSnapshot | null> {
  if (Platform.OS === "web") {
    if (typeof sessionStorage === "undefined") return null;
    // F-1: Check sessionStorage first, then fall back to localStorage for migration
    const raw = sessionStorage.getItem(AUTH_KEY) ?? (typeof localStorage !== "undefined" ? localStorage.getItem(AUTH_KEY) : null);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSnapshot;
    } catch {
      return null;
    }
  }

  const backend = await getStorageBackend();

  try {
    let raw: string | null = null;

    if (backend === "secure" && SecureStore) {
      raw = await SecureStore.getItemAsync(AUTH_KEY);
    } else if (backend === "async" && AsyncStorage) {
      raw = await AsyncStorage.getItem(AUTH_KEY);
    }

    if (!raw) return null;
    return JSON.parse(raw) as AuthSnapshot;
  } catch {
    return null;
  }
}

export async function saveAuthSnapshot(snapshot: AuthSnapshot) {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") return;
    // F-1: Use sessionStorage instead of localStorage for web to reduce XSS persistence window.
    // Tokens are cleared when the browser tab/session closes.
    // TODO: For maximum security, store refresh_token in httpOnly cookie set by the server.
    // Only store the access_token in sessionStorage (short-lived, 2h).
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(snapshot));
    return;
  }

  const backend = await getStorageBackend();

  try {
    const data = JSON.stringify(snapshot);

    if (backend === "secure" && SecureStore) {
      await SecureStore.setItemAsync(AUTH_KEY, data);
    } else if (backend === "async" && AsyncStorage) {
      await AsyncStorage.setItem(AUTH_KEY, data);
    }
  } catch (err) {
    console.warn("Failed to save auth snapshot:", err);
  }
}

export async function clearAuthSnapshot() {
  if (Platform.OS === "web") {
    // F-1: Clear from both storage types
    try { sessionStorage.removeItem(AUTH_KEY); } catch {}
    try { localStorage.removeItem(AUTH_KEY); } catch {}
    return;
  }

  const backend = await getStorageBackend();

  try {
    if (backend === "secure" && SecureStore) {
      await SecureStore.deleteItemAsync(AUTH_KEY);
    } else if (backend === "async" && AsyncStorage) {
      await AsyncStorage.removeItem(AUTH_KEY);
    }
  } catch (err) {
    console.warn("Failed to clear auth snapshot:", err);
  }
}
