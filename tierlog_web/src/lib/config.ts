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

/**
 * Returns an authenticated download URL that uses query parameter for auth.
 * This is needed because Linking.openURL() opens a new tab/window that
 * cannot set Authorization headers.
 *
 * @param section - Storage subfolder: "paper", "audio", "revised", "final", "transcript", "annotations"
 * @param filename - The filename to download
 * @param token - JWT access token for authentication
 */
export function getFileDownloadUrl(section: string, filename: string, token: string): string {
  return `${API_URL}/download?section=${section}&file=${encodeURIComponent(filename)}&token=${token}`;
}
