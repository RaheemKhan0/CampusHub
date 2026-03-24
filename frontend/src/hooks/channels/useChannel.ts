import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { components } from "@/types/openapi";
import { qk } from "@/lib/tanstack/queryKeys";
import { api } from "@/lib/client";

type ChannelView = components["schemas"]["ChannelViewDto"];
type QueryKey = ReturnType<typeof qk.channel>;

type UseChannelOptions = Omit<
  UseQueryOptions<ChannelView, Error, ChannelView, QueryKey>,
  "queryKey" | "queryFn"
>;

export const useChannel = (
  serverId: string,
  channelId: string,
  options?: UseChannelOptions,
) => {
  return useQuery<ChannelView, Error, ChannelView, QueryKey>({
    queryKey: qk.channel(serverId, channelId),
    queryFn: async () => {
      if (!serverId || !channelId) {
        throw new Error("channelId is required");
      }
      const { data, error } = await api.GET(
        `/servers/{serverId}/channels/{channelId}`,
        {
          params: {
            path: { channelId, serverId },
          },
        },
      );
      if (error) throw error;
      if (!data) throw new Error("Missing channel");

      return data;
    },
    ...options,
  });
};
