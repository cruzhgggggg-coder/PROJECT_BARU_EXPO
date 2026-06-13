import { useEffect, useRef, useCallback } from "react";
import { AppState, Platform } from "react-native";
import { API_URL } from "@/src/lib/config";

type MessageHandler = (event: { event: string; data: any }) => void;

interface UseWebSocketOptions {
  accessToken: string | null;
  rooms: string[];
  onMessage: MessageHandler;
  enabled?: boolean;
}

export function useWebSocket({ accessToken, rooms, onMessage, enabled = true }: UseWebSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const roomsRef = useRef(rooms);
  const mountedRef = useRef(true);

  onMessageRef.current = onMessage;
  roomsRef.current = rooms;

  const connect = useCallback(() => {
    if (!accessToken || !enabled || !mountedRef.current) return;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const wsUrl = `${API_URL.replace("http", "ws")}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      attemptRef.current = 0;
      socket.send(JSON.stringify({ action: "auth", token: accessToken }));
      roomsRef.current.forEach((room) => {
        socket.send(JSON.stringify({ action: "subscribe", room }));
      });
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMessageRef.current(payload);
      } catch (e) {
        console.warn("[WS] parse error:", e);
      }
    };

    socket.onerror = (e) => console.log("[WS] error (connection issue):", e);

    socket.onclose = () => {
      if (!mountedRef.current) return;
      const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30000);
      attemptRef.current++;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    };
  }, [accessToken, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && mountedRef.current) {
        connect();
      }
    });
    return () => sub.remove();
  }, [connect]);

  return socketRef;
}
