import { useQuery } from "@tanstack/react-query";

import type { components } from "@/types/openapi";
import { api } from "@/lib/client";
import { queryKeys } from "@/lib/query-keys";

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
    queryKey: queryKeys.notifications.unread,
    queryFn: fetchUnreadNotifications,
    staleTime: 30_000,
    enabled,
  });
}
