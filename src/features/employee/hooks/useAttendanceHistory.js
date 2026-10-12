import { useQuery } from "@tanstack/react-query";
import { getAttendanceHistory } from "../api/attendanceApi";

export const useAttendanceHistory = ({
  month,
  year,
  perPage = 15,
}) => {
  return useQuery({
    queryKey: [
      "attendance",
      "history",
      month,
      year,
      perPage,
    ],

    queryFn: () =>
      getAttendanceHistory({
        month,
        year,
        perPage,
      }),

    retry: false,

    staleTime: 30 * 1000,
  });
};