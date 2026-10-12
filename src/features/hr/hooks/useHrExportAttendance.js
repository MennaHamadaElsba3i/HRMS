import { useMutation } from "@tanstack/react-query";
import { exportHrMonthlySummary } from "../api";

/**
 * useMutation hook that calls GET /hr/attendance/export
 * and auto-triggers a browser download of the Excel file.
 *
 * Usage:
 *   const { mutate: exportAttendance, isPending } = useHrExportAttendance();
 *   exportAttendance({ month: 9, year: 2026 });
 */
export const useHrExportAttendance = () => {
  return useMutation({
    mutationFn: exportHrMonthlySummary,
  });
};
