import { useQuery } from "@tanstack/react-query";
import { getAllEmployees } from "../api";

export const useEmployees = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => getAllEmployees(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

export default useEmployees;
