import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client";
import { qk } from "@/lib/tanstack/queryKeys";

export const useDeleteChannel = (serverId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await api.DELETE(
        "/servers/{serverId}/channels/{channelId}",
        {
          params: { path: { serverId, channelId } },
        },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.channels(serverId) });
    },
  });
};
