import apiClient from "./client";

export type AppNotification = {
  id: string;
  is_read: boolean;
  [key: string]: any;
};

export async function listNotifications(opts?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<AppNotification[]> {
  const res = await apiClient.get("/notifications", {
    params: {
      unread_only: opts?.unreadOnly ?? false,
      limit: opts?.limit ?? 30,
    },
  });
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get("/notifications/unread-count");
  return typeof res.data === "number" ? res.data : parseInt(res.data, 10) || 0;
}

export async function markRead(notificationId: string): Promise<void> {
  await apiClient.put(`/notifications/${notificationId}/read`);
}

export async function markAllRead(): Promise<void> {
  await apiClient.put("/notifications/read-all");
}

export async function clearAllNotifications(): Promise<void> {
  await apiClient.delete("/notifications/clear");
}