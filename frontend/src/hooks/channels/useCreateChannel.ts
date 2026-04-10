import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client";
import { qk } from "@/lib/tanstack/queryKeys";
import type { components } from "@/types/openapi";

type CreateChannelDto = components["schemas"]["CreateChannelDto"];

export const useCreateChannel = (serverId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateChannelDto) => {
      const { data, error } = await api.POST("/servers/{serverId}/channels", {
        params: { path: { serverId } },
        body: dto,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.channels(serverId) });
    },
  });
};
