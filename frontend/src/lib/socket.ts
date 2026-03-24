import { Namespaces, SocketMap } from "@/types/constants";
import { io } from "socket.io-client";

// Prevent multiple sockets during Next.js HMR/dev:
const g = globalThis as unknown as { __SOCKETS__?: SocketMap };
g.__SOCKETS__ ||= {};
const sockets = g.__SOCKETS__!;

export function createSocket(namespace: Namespaces = "/messages") {
  console.log("[create socket]");
  if (typeof window === "undefined") return undefined;

  if (sockets[namespace]) {
    console.log("[create socket] returning existing socket");
    return sockets[namespace];
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

  console.log("[socket] baseUrl", baseUrl, "namespace", namespace);
  const socket = io(`${baseUrl}${namespace}`, {
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
  });

  socket.on("connect", () => {
    console.log(`[socket ${namespace}] connected`, socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[socket ${namespace}] disconnected:`, reason);
  });

  socket.on("connect_error", (error) => {
    console.warn(`[socket ${namespace}] error:`, error.message);
  });

  sockets[namespace] = socket;
  return socket;
}

export function getSocket(namespace: Namespaces = "/messages") {
  return createSocket(namespace);
}
