import { paths } from "@/types/openapi";

type ServerListQuery = paths["/servers"]["get"]["parameters"]["query"];

type InfiniteServerFilters = Omit<ServerListQuery, "page">;

export const qk = {
  // ---------- Auth / session ----------
  me: () => ["me"] as const,

  // ---------- Servers ----------
  servers: (params?: ServerListQuery) => ["servers", params ?? {}] as const,
  serversInfinite: (params?: InfiniteServerFilters) =>
    ["servers", "infinite", params ?? {}] as const,
  server: (serverId: string) => ["server", serverId] as const,

  // Members of a server (for sidebar, permissions, etc.)
  serverMembers: (serverId: string) => ["server", serverId, "members"] as const,
  serverRoles: (serverId: string) => ["server", serverId, "roles"] as const,
  serverInvites: (serverId: string) => ["server", serverId, "invites"] as const,

  // ---------- Channels (scoped to a server) ----------
  channels: (serverId: string, filter?: { type?: "text" | "qa" }) =>
    ["server", serverId, "channels", filter ?? {}] as const,
  channel: (serverId: string, channelId: string) =>
    ["server", serverId, "channel", channelId] as const,

  // Channel-specific extras
  channelMembers: (serverId: string, channelId: string) =>
    ["server", serverId, "channel", channelId, "members"] as const,

  // ---------- Messages (cursor/infinite) ----------
  // keep params bundled for pagination + search
  messages: (
    serverId: string,
    channelId: string,
    params: { cursor?: string | null; limit?: number; q?: string },
  ) => ["server", serverId, "channel", channelId, "messages", params] as const,
  messagesInfinite: (
    serverId: string,
    channelId: string,
    pageSize?: number,
  ) =>
    [
      "server",
      serverId,
      "channel",
      channelId,
      "messages",
      "infinite",
      pageSize ?? null,
    ] as const,

  // Single message (for optimistic create/update/delete)
  message: (serverId: string, channelId: string, messageId: string) =>
    ["server", serverId, "channel", channelId, "message", messageId] as const,

  // ---------- Degrees ----------
  degrees: () => ["degrees"] as const,
} as const;
