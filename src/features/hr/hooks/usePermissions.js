import { useQuery } from "@tanstack/react-query";

import { getPermissions } from "../api";

export const usePermissions = (lang = "en") => {
  return useQuery({
    queryKey: ["permissions", lang],

    queryFn: () => getPermissions(lang),

    staleTime: 5 * 60 * 1000,

    retry: 2,
  });
};
