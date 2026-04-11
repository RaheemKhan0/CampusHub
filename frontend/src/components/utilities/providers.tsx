"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  notification$,
  startNotificationStream,
  stopNotificationStream,
} from "@/lib/notification-stream";
import type { NotificationEvent } from "@/lib/notification-stream";
import type { components } from "@/types/openapi";
import { queryKeys } from "@/lib/query-keys";
import { markNotificationRead } from "@/lib/notifications/actions";

type NotificationView = components["schemas"]["NotificationViewDto"];

const MAX_TRACKED_CLIENT_NOTIFICATIONS = 200;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNotificationDto = (value: unknown): value is NotificationView =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.userId === "string";

const getNotificationKey = (event: NotificationEvent): string | undefined => {
  const data = event.data;
  if (isNotificationDto(data)) {
    return `notification:${data.id}`;
  }

  if (isRecord(data) && typeof data.messageId === "string") {
    const mentionSuffix =
      typeof data.mentionedUserId === "string"
        ? `:${data.mentionedUserId}`
        : "";
    return `${event.type}:${data.messageId}${mentionSuffix}`;
  }

  return undefined;
};

const formatNotificationToast = (event: NotificationEvent) => {
  const data = event.data;

  if (isNotificationDto(data)) {
    const channelName =
      isRecord(data.data) && typeof data.data.channelName === "string"
        ? data.data.channelName
        : undefined;
    const subtitle = channelName
      ? data.serverName
        ? `#${channelName} · ${data.serverName}`
        : `#${channelName}`
      : data.serverName;
    return {
      title: data.title ?? data.serverName ?? "New notification",
      subtitle,
      body: data.body,
      serverId: data.serverId,
      channelId: data.channelId,
    };
  }

  if (isRecord(data)) {
    const serverName =
      typeof data.serverName === "string" ? data.serverName : undefined;
    const channelId =
      typeof data.channelId === "string" ? data.channelId : undefined;
    const content = typeof data.content === "string" ? data.content : undefined;

    return {
      title: serverName ?? "New message",
      subtitle: channelId ? `#${channelId}` : undefined,
      body: content,
      serverId: typeof data.serverId === "string" ? data.serverId : undefined,
      channelId,
    };
  }

  return {
    title: "New notification",
    subtitle: undefined,
    body: undefined,
    serverId: undefined,
    channelId: undefined,
  };
};

type HttpErrorLike = { status?: number };

const isHttpError = (value: unknown): value is HttpErrorLike =>
  typeof value === "object" && value !== null && "status" in value;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, err: unknown) => {
        if (failureCount >= 2) return false;
        const status = isHttpError(err) ? (err.status ?? 0) : 0;
        return status >= 500;
      }, // retry only server errors
    },
    mutations: {
      networkMode: "online",
      retry: 0,
    },
  },
});
const Providers = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const seenNotificationsRef = useRef<{ set: Set<string>; queue: string[] }>({
    set: new Set(),
    queue: [],
  });

  const rememberNotificationKey = (key: string) => {
    const { set, queue } = seenNotificationsRef.current;
    set.add(key);
    queue.push(key);
    if (queue.length > MAX_TRACKED_CLIENT_NOTIFICATIONS) {
      const oldest = queue.shift();
      if (oldest) set.delete(oldest);
    }
  };

  const hasNotificationKey = (key: string) =>
    seenNotificationsRef.current.set.has(key);

  const removeNotificationFromCache = (notificationId: string) => {
    queryClient.setQueryData(
      queryKeys.notifications.unread,
      (current?: NotificationView[]) =>
        current?.filter((notification) => notification.id !== notificationId) ??
        current,
    );
  };

  const navigateToNotification = (notification: NotificationView) => {
    if (notification.id) {
      void markNotificationRead(notification.id);
      removeNotificationFromCache(notification.id);
    }
    if (notification.serverId && notification.channelId) {
      router.push(
        `/dashboard/server/${notification.serverId}/channel/${notification.channelId}`,
      );
    } else if (notification.serverId) {
      router.push(`/dashboard/server/${notification.serverId}`);
    }
  };

  useEffect(() => {
    const subscription = notification$.subscribe((event) => {
      const key = getNotificationKey(event);
      if (key) {
        if (hasNotificationKey(key)) {
          console.debug("notification already displayed", key);
          return;
        }
        rememberNotificationKey(key);
      }

      const {
        title,
        subtitle,
        body,
        serverId: payloadServerId,
        channelId: payloadChannelId,
      } = formatNotificationToast(event);
      const notificationDto = isNotificationDto(event.data)
        ? event.data
        : undefined;

      // Skip toast + cache insert for notifications the server already marked
      // as read (audit trail for users watching the channel in real time).
      const isAlreadyRead = notificationDto?.status === "read";

      if (!isAlreadyRead) {
        toast(title, {
          description: [subtitle, body].filter(Boolean).join(" • ") || undefined,
          id: key,
          action:
            notificationDto && (payloadServerId || payloadChannelId)
              ? {
                  label: "View",
                  onClick: () => {
                    if (notificationDto) {
                      navigateToNotification(notificationDto);
                    }
                  },
                }
              : undefined,
          onClick: () => {
            if (notificationDto) {
              navigateToNotification(notificationDto);
            }
          },
        });
      }

      if (notificationDto && !isAlreadyRead) {
        queryClient.setQueryData(
          queryKeys.notifications.unread,
          (current?: NotificationView[]) => {
            const existing = current ?? [];
            const alreadyExists = existing.some(
              (notification) => notification.id === notificationDto.id,
            );
            if (alreadyExists) {
              return existing;
            }
            const next = [notificationDto, ...existing];
            return next.slice(0, 50);
          },
        );
      } else if (!notificationDto) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.unread,
        });
      }
    });

    startNotificationStream();

    return () => {
      subscription.unsubscribe();
      stopNotificationStream();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-right"
        position="bottom"
      />
    </QueryClientProvider>
  );
};

export default Providers;
