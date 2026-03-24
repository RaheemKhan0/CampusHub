import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/client";
import { qk } from "@/lib/tanstack/queryKeys";
import type { components, paths } from "@/types/openapi";
import { InfiniteData } from "@tanstack/react-query";


type ServerListResponse = components["schemas"]["ServerListResponseDto"];
type ServerListQuery = paths["/servers"]["get"]["parameters"]["query"];
type ListFilters = Omit<ServerListQuery, "page">;
type InfiniteServerData = InfiniteData<ServerListResponse, number>;

type QueryKey = ReturnType<typeof qk.serversInfinite>;

export const useInfiniteServers = (params?: ListFilters) =>
  useInfiniteQuery<
    ServerListResponse,
    Error,
    InfiniteServerData,
    QueryKey,
    number
  >({
    queryKey: qk.serversInfinite(params),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET("/servers", {
        params: { query: { ...params, page: pageParam } },
      });

      if (error) throw error;
      if (!data) throw new Error("Missing server list response");

      return data;
    },
    getNextPageParam: (lastPage) => {
      const totalFetched = lastPage.page * lastPage.pageSize;
      return totalFetched < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
