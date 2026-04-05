import { useQuery } from "@tanstack/react-query";

import type { components } from "@/types/openapi";
import { api } from "@/lib/client";

type NotificationView = components["schemas"]["NotificationViewDto"];

async function fetchUnreadNotifications(): Promise<NotificationView[]> {
  const { data, error } = await api.GET("/notifications/unread");
  if (error) {
    throw error;
  }
  return (data as NotificationView[]) ?? [];
}

export function useUnreadNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: fetchUnreadNotifications,
    staleTime: 30_000,
    enabled,
  });
}
