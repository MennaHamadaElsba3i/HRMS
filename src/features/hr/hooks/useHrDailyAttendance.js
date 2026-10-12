import { useQuery } from "@tanstack/react-query";
import { getHrDailyAttendance } from "../api";

export const useHrDailyAttendance = ({
  date,
  departmentId,
  managerId,
  status,
  search,
  perPage = 15,
  page = 1,
}) => {
  return useQuery({
    queryKey: [
      "hr",
      "attendance",
      "daily",
      {
        date,
        departmentId,
        managerId,
        status,
        search,
        perPage,
        page,
      },
    ],

    queryFn: () =>
      getHrDailyAttendance({
        date,
        departmentId,
        managerId,
        status,
        search,
        perPage,
        page,
      }),

    retry: false,

    staleTime: 30 * 1000,

    placeholderData: (previousData) => previousData,
  });
};