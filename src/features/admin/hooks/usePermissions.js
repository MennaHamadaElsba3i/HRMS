import { useQuery } from "@tanstack/react-query";
import { getPermissions } from "../api";

export const usePermissions = (lang, options = {}) => {
  return useQuery({
    queryKey: ["permissions", lang],
    queryFn: () => getPermissions(lang),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export default usePermissions;
