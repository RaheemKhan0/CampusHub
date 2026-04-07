"use client";

import { Bell, Loader2, RefreshCw } from "lucide-react";
import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUnreadNotifications } from "@/hooks/notifications/useUnreadNotifications";
import type { components } from "@/types/openapi";
import { markNotificationRead } from "@/lib/notifications/actions";
import { queryKeys } from "@/lib/query-keys";

type NotificationView = components["schemas"]["NotificationViewDto"];

export function NotificationBell() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    data: notifications,
    isLoading,
    isFetching,
    refetch,
  } = useUnreadNotifications();

  const unreadCount = notifications?.length ?? 0;

  const handleNotificationSelect = useCallback(
    (notification: NotificationView) => {
      if (notification.id) {
        void markNotificationRead(notification.id);
        queryClient.setQueryData(
          queryKeys.notifications.unread,
          (current?: NotificationView[]) =>
            current?.filter((item) => item.id !== notification.id) ?? current,
        );
      }
      if (notification.serverId && notification.channelId) {
        router.push(
          `/dashboard/server/${notification.serverId}/channel/${notification.channelId}`,
        );
      }
    },
    [queryClient, router],
  );

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-3 p-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="space-y-1">
              <div className="h-3 w-32 rounded-md bg-muted" />
              <div className="h-2.5 w-full rounded-md bg-muted/70" />
            </div>
          ))}
        </div>
      );
    }

    if (!notifications || notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
          <Bell className="h-8 w-8 text-muted-foreground/70" />
          <p>All caught up!</p>
        </div>
      );
    }

    return (
      <div className="max-h-64 overflow-y-auto">
        <ul>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onNavigate={() => handleNotificationSelect(notification)}
            />
          ))}
        </ul>
      </div>
    );
  }, [handleNotificationSelect, isLoading, notifications]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[0.6rem] font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        {content}
      </PopoverContent>
    </Popover>
  );
}

type NotificationItemProps = {
  notification: NotificationView;
  onNavigate?: () => void;
};

function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
  const isNavigable = Boolean(notification.serverId && notification.channelId);
  const handleClick = () => {
    if (isNavigable) {
      onNavigate?.();
    }
  };

  return (
    <li
      className={cn(
        "border-b border-border/40 px-3 py-3 text-sm last:border-b-0",
        isNavigable && "cursor-pointer hover:bg-muted/50",
      )}
      onClick={handleClick}
    >
      <p className="font-semibold text-foreground">
        {notification.serverName ?? notification.title}
      </p>
      {notification.channelId ? (
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          #{notification.channelId}
        </p>
      ) : null}
      {notification.body ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {notification.body}
        </p>
      ) : null}
      <p className="mt-1 text-[0.65rem] text-muted-foreground">
        {formatTimestamp(notification.createdAt)}
      </p>
    </li>
  );
}

function formatTimestamp(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
