import { useQuery } from "@tanstack/react-query";
import { getDepartments } from "../api";

export const useDepartments = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: () => getDepartments(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export default useDepartments;
