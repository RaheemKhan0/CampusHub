import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/tanstack/queryKeys";

export const useMyServerRole = (serverId?: string) => {
  return useQuery({
    queryKey: qk.serverRoles(serverId ?? ""),
    enabled: Boolean(serverId),
    queryFn: async () => {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${base}/servers/${serverId}/me`, {
        credentials: "include",
      });
      if (!res.ok) return { roles: [] as string[] };
      const data = (await res.json()) as { roles: string[] };
      return data;
    },
  });
};
