import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/client";
import { qk } from "@/lib/tanstack/queryKeys";
import type { components } from "@/types/openapi";

type ChannelView = components["schemas"]["ChannelViewDto"];
type ChannelListResponse = components["schemas"]["ChannelListResponseDto"];
type ChannelFilters = { type?: ChannelView["type"] };
type QueryKey = ReturnType<typeof qk.channels> | readonly ["channels", null];

type ChannelListNormalized = Omit<
  ChannelListResponse,
  "publicChannels" | "privateChannels"
> & {
  publicChannels: ChannelView[];
  privateChannels: ChannelView[];
};

type UseChannelsOptions = Omit<
  UseQueryOptions<ChannelListNormalized, Error, ChannelListNormalized, QueryKey>,
  "queryKey" | "queryFn"
>;

const toChannelArray = (value: unknown): ChannelView[] => {
  if (!Array.isArray(value)) return [];

  return (value as ChannelView[]).filter(
    (entry): entry is ChannelView =>
      entry !== null && typeof entry === "object",
  );
};

export const useChannels = (
  serverId?: string,
  filters?: ChannelFilters,
  options?: UseChannelsOptions,
) => {
  const { enabled, ...rest } = options ?? {};
  const queryKey: QueryKey = serverId
    ? qk.channels(serverId, filters)
    : ["channels", null];

  return useQuery<ChannelListNormalized, Error, ChannelListNormalized, QueryKey>({
    queryKey,
    enabled: Boolean(serverId) && (enabled ?? true),
    queryFn: async () => {
      if (!serverId) {
        throw new Error("serverId is required to fetch channels");
      }

      const { data, error } = await api.GET("/servers/{serverId}/channels", {
        params: { path: { serverId } },
      });

      if (error) throw error;
      if (!data) throw new Error("Missing channel list response");

      const publicChannels = toChannelArray(data.publicChannels);
      const privateChannels = toChannelArray(data.privateChannels);
      const channelCount = publicChannels.length + privateChannels.length;

      return {
        ...data,
        publicChannels,
        privateChannels,
        total:
          typeof data.total === "number" ? data.total : channelCount,
        page: data.page ?? 1,
        pageSize:
          typeof data.pageSize === "number" ? data.pageSize : channelCount,
      } as ChannelListNormalized;
    },
    ...rest,
  });
};
