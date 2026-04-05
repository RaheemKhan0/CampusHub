import { Subject } from "rxjs";

import type { components } from "@/types/openapi";

type NotificationViewDto = components["schemas"]["NotificationViewDto"];

export type MessageNotificationPayload = {
  messageId: string;
  channelId: string;
  serverId: string;
  authorId: string;
  authorName?: string;
};

export type MentionNotificationPayload = MessageNotificationPayload & {
  mentionedUserId: string;
};

export type NotificationEvent =
  | {
      type: "message.create";
      data: MessageNotificationPayload | NotificationViewDto;
    }
  | {
      type: "message.mention";
      data: MentionNotificationPayload | NotificationViewDto;
    }
  | { type: "channel.invite"; data: NotificationViewDto }
  | { type: "membership.status"; data: NotificationViewDto }
  | { type: "generic"; data: NotificationViewDto };

const notificationSubject = new Subject<NotificationEvent>();

export const notification$ = notificationSubject.asObservable();

let eventSource: EventSource | null = null;
let reconnectTimer: number | null = null;

function buildStreamUrl() {
  if (typeof window === "undefined") return null;

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.length > 0
      ? process.env.NEXT_PUBLIC_API_URL
      : window.location.origin;
  const url = new URL("/notifications/stream", baseUrl);

  return url.toString();
}

function handleServerEvent<T extends NotificationEvent["type"]>(
  type: T,
): (event: MessageEvent) => void {
  return (event) => {
    try {
      const data = JSON.parse(event.data);
      console.debug(`[notifications] event ${type}`, data);
      notificationSubject.next({ type, data } as NotificationEvent);
    } catch (error) {
      console.warn("[notifications] failed to parse SSE payload", error);
    }
  };
}

function attachListeners(source: EventSource) {
  source.addEventListener(
    "message.create",
    handleServerEvent("message.create"),
  );
  source.addEventListener(
    "message.mention",
    handleServerEvent("message.mention"),
  );
  source.addEventListener(
    "channel.invite",
    handleServerEvent("channel.invite"),
  );
  source.addEventListener(
    "membership.status",
    handleServerEvent("membership.status"),
  );
  source.addEventListener("generic", handleServerEvent("generic"));
}

function scheduleReconnect() {
  if (reconnectTimer !== null) return;

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    startNotificationStream();
  }, 3000);
}

export function startNotificationStream() {
  if (typeof window === "undefined") return;
  if (eventSource) return;

  const streamUrl = buildStreamUrl();
  if (!streamUrl) return;

  const source = new EventSource(streamUrl, { withCredentials: true });
  attachListeners(source);

  source.onopen = () => {
    console.info("[notifications] SSE connected");
  };

  source.onerror = (error) => {
    console.warn("[notifications] SSE error", error);
    source.close();
    eventSource = null;
    scheduleReconnect();
  };

  eventSource = source;
}

export function stopNotificationStream() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

export function emitLocalNotification(event: NotificationEvent) {
  notificationSubject.next(event);
}
