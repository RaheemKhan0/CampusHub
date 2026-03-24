import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/client";
import { qk } from "@/lib/tanstack/queryKeys";
import type { components } from "@/types/openapi";

type ServerView = components["schemas"]["ServerViewDto"];
type QueryKey = ReturnType<typeof qk.server> | readonly ["server", null];

type UseServerOptions = Omit<
  UseQueryOptions<ServerView, Error, ServerView, QueryKey>,
  "queryKey" | "queryFn"
>;

export const useServer = (serverId?: string, options?: UseServerOptions) => {
  const { enabled, ...rest } = options ?? {};
  const queryKey: QueryKey = serverId ? qk.server(serverId) : ["server", null];

  return useQuery<ServerView, Error, ServerView, QueryKey>({
    queryKey,
    enabled: Boolean(serverId) && (enabled ?? true),
    queryFn: async () => {
      if (!serverId) {
        throw new Error("serverId is required to fetch a server");
      }

      const { data, error } = await api.GET("/servers/{serverId}", {
        params: { path: { serverId } },
      });

      if (error) throw error;
      if (!data) throw new Error("Server not found");

      return data;
    },
    ...rest,
  });
};
