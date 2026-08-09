import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../auth/AuthContext";
import { WS_URL } from "../config";
import {
  listNotifications,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
  clearAllNotifications as apiClearAll,
  AppNotification,
} from "../api/notifications";

type NotificationContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await listNotifications({ limit: 30 });
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch {
      // silent — notification list isn't critical path
    }
  }, [user]);

  const connectWebSocket = useCallback(async () => {
    if (!user) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const token = await SecureStore.getItemAsync("authToken");
    if (!token) return;

    const wsUrl = `${WS_URL}/ws/notifications/${user.id}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      pingInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        else if (pingInterval.current) clearInterval(pingInterval.current);
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "pong") return;
        setNotifications((prev) => [data, ...prev]);
        setUnreadCount((prev) => prev + 1);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (pingInterval.current) clearInterval(pingInterval.current);
      reconnectTimer.current = setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = () => ws.close();
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
      connectWebSocket();
    }
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pingInterval.current) clearInterval(pingInterval.current);
    };
  }, [user]);

  async function markRead(id: string) {
    try {
      await apiMarkRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      await apiMarkAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

  async function clearAll() {
    try {
      await apiClearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}