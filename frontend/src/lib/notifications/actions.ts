import { api } from "@/lib/client";

export async function markNotificationRead(notificationId?: string) {
  if (!notificationId) return;

  try {
    await api.PATCH("/notifications/{notificationId}/read", {
      params: { path: { notificationId } },
    });
  } catch (error) {
    console.warn("Failed to mark notification as read", error);
  }
}
