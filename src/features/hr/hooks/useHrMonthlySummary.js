import { useQuery } from "@tanstack/react-query";
import { getHrMonthlySummary } from "../api";

export const useHrMonthlySummary = ({
  month,
  year,
  departmentId,
  search,
  perPage = 15,
  page = 1,
  enabled = true,
}) => {
  return useQuery({
    queryKey: [
      "hr",
      "attendance",
      "monthly-summary",
      { month, year, departmentId, search, perPage, page },
    ],

    queryFn: () =>
      getHrMonthlySummary({
        month,
        year,
        departmentId,
        search,
        perPage,
        page,
      }),

    enabled: enabled && !!month && !!year,

    retry: false,

    staleTime: 60 * 1000,

    placeholderData: (previousData) => previousData,
  });
};
