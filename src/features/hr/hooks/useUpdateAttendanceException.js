import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAttendanceExceptionStatus } from "../api";

/**
 * useMutation hook for PATCH /hr/attendance/exceptions/{attendanceId}
 * Invalidates the exceptions query on success so the list refreshes.
 *
 * Usage:
 *   const { mutate: updateException, isPending } = useUpdateAttendanceException();
 *   updateException(
 *     { attendanceId: 5, status: "approved", adminNote: "Ok" },
 *     { onSuccess: () => ..., onError: () => ... }
 *   );
 */
export const useUpdateAttendanceException = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAttendanceExceptionStatus,

    onSuccess: () => {
      // Invalidate exceptions list and daily attendance so they re-fetch
      queryClient.invalidateQueries({
        queryKey: ["hr", "attendance", "exceptions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["hr", "attendance", "daily"],
      });
    },
  });
};
