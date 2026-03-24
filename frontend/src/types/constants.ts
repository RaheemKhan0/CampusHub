import { Socket } from "socket.io-client";

export type Namespaces = "/messages" | "/";

export type SocketMap = Partial<Record<Namespaces, Socket>>;

export const SOCKET_EVENTS = {
  CHANNEL_JOIN: "channel:join",
  CHANNEL_LEAVE: "channel:leave",
  CHANNEL_JOINED: "channel:joined",
  CHANNEL_LEFT: "channel:left",
  MESSAGE_CREATE: "message:create",
  MESSAGE_CREATED: "message:created",
} as const;

export type SocketEventKey = keyof typeof SOCKET_EVENTS;
export type SocketEventValue = (typeof SOCKET_EVENTS)[SocketEventKey];
