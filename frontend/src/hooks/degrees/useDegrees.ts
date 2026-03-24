import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/client";
import { qk } from "@/lib/tanstack/queryKeys";
import { components } from "@/types/openapi";

type DegreeView = components["schemas"]["DegreeViewDto"];

export const useDegrees = () =>
  useQuery<DegreeView[], Error>({
    queryKey: qk.degrees(),
    queryFn: async () => {
      const { data, error } = await api.GET("/degrees");
      if (error) throw error;
      if (!data) throw new Error("No degrees found");
      return data;
    },
  });
