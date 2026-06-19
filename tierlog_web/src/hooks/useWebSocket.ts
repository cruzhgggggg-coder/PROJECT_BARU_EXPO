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

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      // Clear handlers to prevent onclose/onerror from firing on deliberate disconnect
      socketRef.current.onopen = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      try {
        socketRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!accessToken || !enabled || !mountedRef.current) {
      disconnect();
      return;
    }

    // If already connected or connecting, do not initiate another connection
    if (socketRef.current) {
      const state = socketRef.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        return;
      }
    }

    disconnect();

    const wsUrl = `${API_URL.replace("http", "ws")}/ws?token=${accessToken}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      if (!mountedRef.current || socketRef.current !== socket) return;
      attemptRef.current = 0;
      roomsRef.current.forEach((room) => {
        socket.send(JSON.stringify({ action: "subscribe", room }));
      });
    };

    socket.onmessage = (event) => {
      if (!mountedRef.current || socketRef.current !== socket) return;
      try {
        const payload = JSON.parse(event.data);
        onMessageRef.current(payload);
      } catch (e) {
        console.warn("[WS] parse error:", e);
      }
    };

    socket.onerror = (e) => {
      if (socketRef.current !== socket) return;
      console.log("[WS] error (connection issue):", e);
    };

    socket.onclose = () => {
      if (!mountedRef.current || socketRef.current !== socket) return;
      socketRef.current = null;
      
      const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30000);
      attemptRef.current++;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    };
  }, [accessToken, enabled, disconnect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

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
