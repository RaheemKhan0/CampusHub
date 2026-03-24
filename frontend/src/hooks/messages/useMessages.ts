 "use client";

  import {
    useInfiniteQuery,
    type UseInfiniteQueryOptions,
    type InfiniteData,
  } from "@tanstack/react-query";

  import { api } from "@/lib/client";
  import { qk } from "@/lib/tanstack/queryKeys";
  import type { components } from "@/types/openapi";

  const FALLBACK_ID = "__missing__";

  type MessageView = components["schemas"]["MessageViewDto"];
  type MessageListResponseRaw = components["schemas"]["MessageListResponseDto"];
  type MessageListResponse = Omit<MessageListResponseRaw, "items"> & {
    items: MessageView[];
  };
export type MessagesInfiniteData = InfiniteData<MessageListResponse, number>;

  type UseMessagesOptions = Omit<
    UseInfiniteQueryOptions<
      MessageListResponse,
      Error,
      MessagesInfiniteData,
      ReturnType<typeof qk.messagesInfinite>
    >,
    "queryKey" | "initialPageParam" | "queryFn" | "getNextPageParam"
  >;

  type UseMessagesParams = {
    pageSize?: number;
  };

  const normalizeMessages = (value: unknown): MessageView[] => {
    if (!Array.isArray(value)) return [];
    return (value as MessageView[]).filter(
      (entry): entry is MessageView =>
        Boolean(entry) && typeof entry === "object",
    );
  };

  export const useMessages = (
    serverId?: string,
    channelId?: string,
    params?: UseMessagesParams,
    options?: UseMessagesOptions,
  ) => {
    const pageSize = params?.pageSize ?? 50;
    const queryKey = qk.messagesInfinite(
      serverId ?? FALLBACK_ID,
      channelId ?? FALLBACK_ID,
      pageSize,
    );
    const { enabled, ...rest } = options ?? {};

    return useInfiniteQuery<
      MessageListResponse,
      Error,
      MessagesInfiniteData,
      ReturnType<typeof qk.messagesInfinite>
    >({
      queryKey,
      initialPageParam: 1,
      enabled: Boolean(serverId && channelId) && (enabled ?? true),
      queryFn: async ({ pageParam }) => {
        if (!serverId || !channelId) {
          throw new Error("serverId and channelId are required to fetch messages");
        }

        const { data, error } = await api.GET(
          "/servers/{serverId}/channels/{channelId}/messages",
          {
            params: {
              path: { serverId, channelId },
              query: { page: String(pageParam), pageSize: String(pageSize) },
            },
          },
        );

        if (error) throw error;
        if (!data) throw new Error("Missing messages response");

        return {
          ...data,
          items: normalizeMessages(data.items),
        } satisfies MessageListResponse;
      },
      getNextPageParam: (lastPage) => {
        const fetched = lastPage.page * lastPage.pageSize;
        return fetched < lastPage.total ? lastPage.page + 1 : undefined;
      },
      ...rest,
    });
  };
