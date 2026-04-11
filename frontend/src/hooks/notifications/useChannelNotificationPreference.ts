import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { components } from "@/types/openapi";
import { api } from "@/lib/client";
import { queryKeys } from "@/lib/query-keys";

type NotificationPreferenceView =
  components["schemas"]["NotificationPreferenceViewDto"];

export type NotificationLevel = NotificationPreferenceView["level"];

async function fetchChannelPreference(
  channelId: string,
): Promise<NotificationPreferenceView> {
  const { data, error } = await api.GET(
    "/notifications/preferences/channels/{channelId}",
    {
      params: { path: { channelId } },
      cache: "no-store",
    },
  );

  if (error) {
    throw error;
  }

  return (
    (data as NotificationPreferenceView | undefined) ?? {
      channelId,
      level: "all",
    }
  );
}

export function useChannelNotificationPreference(channelId?: string) {
  return useQuery({
    queryKey: channelId
      ? queryKeys.notifications.channelPreference(channelId)
      : ["notifications", "preferences", "channel", "__disabled__"],
    queryFn: () => fetchChannelPreference(channelId as string),
    enabled: Boolean(channelId),
    staleTime: 60_000,
  });
}

export function useUpdateChannelNotificationPreference(channelId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (level: NotificationLevel) => {
      if (!channelId) {
        throw new Error("channelId is required");
      }
      const { data, error } = await api.PUT(
        "/notifications/preferences/channels/{channelId}",
        {
          params: { path: { channelId } },
          body: { level },
        },
      );
      if (error) {
        throw error;
      }
      return data as NotificationPreferenceView;
    },
    onMutate: async (level) => {
      if (!channelId) return;
      const key = queryKeys.notifications.channelPreference(channelId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous =
        queryClient.getQueryData<NotificationPreferenceView>(key);
      queryClient.setQueryData<NotificationPreferenceView>(key, {
        channelId,
        level,
      });
      return { previous };
    },
    onError: (_err, _level, context) => {
      if (!channelId) return;
      const key = queryKeys.notifications.channelPreference(channelId);
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSuccess: (data) => {
      if (!channelId) return;
      const key = queryKeys.notifications.channelPreference(channelId);
      queryClient.setQueryData(key, data);
    },
  });
}
