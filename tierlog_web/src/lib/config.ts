import { Platform } from "react-native";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8080";

export const WS_URL = API_URL.replace(/^http/, "ws");

/**
 * Returns the appropriate file download URL.
 * On web, opens the URL directly. On native, uses the API_URL.
 */
export function getFileUrl(path: string): string {
  return `${API_URL}${path}`;
}
