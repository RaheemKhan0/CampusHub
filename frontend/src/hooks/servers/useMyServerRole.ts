import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client";
import { qk } from "@/lib/tanstack/queryKeys";

export const useMyServerRole = (serverId?: string) => {
  return useQuery({
    queryKey: qk.serverRoles(serverId ?? ""),
    enabled: Boolean(serverId),
    queryFn: async () => {
      const { data, error } = await api.GET("/servers/{serverId}/me", {
        params: { path: { serverId: serverId! } },
      });
      if (error) throw error;
      return (data ?? { roles: [] }) as { roles: string[] };
    },
  });
};
