import { useQuery } from "@tanstack/react-query";
import { getHrAttendanceExceptions } from "../api";

export const useHrAttendanceExceptions = ({
  date,
  departmentId,
  perPage = 15,
  page = 1,
}) => {
  return useQuery({
    queryKey: [
      "hr",
      "attendance",
      "exceptions",
      {
        date,
        departmentId,
        perPage,
        page,
      },
    ],

    queryFn: () =>
      getHrAttendanceExceptions({
        date,
        departmentId,
        perPage,
        page,
      }),

    retry: false,

    staleTime: 30 * 1000,

    placeholderData: (previousData) => previousData,
  });
};