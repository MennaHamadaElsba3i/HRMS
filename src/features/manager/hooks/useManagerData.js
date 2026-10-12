import { useQuery } from "@tanstack/react-query";
import {
  getManagerEmployees,
  getManagerAttendanceToday,
  getManagerEmployeeAttendance,
} from "../../../api/managerApi";

/**
 * Hook: GET /api/manager/employees
 * Paginated list of employees managed by the authenticated manager.
 *
 * @param {Object} params  { search, status, department_id, employment_type, role, per_page, page }
 */
export const useManagerEmployees = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["manager-employees", params],
    queryFn: async () => {
      const res = await getManagerEmployees(params);
      // API returns { success, data: { links, meta, employees: [...] } }
      return res?.data ?? res;
    },
    staleTime: 1000 * 60 * 3,
    ...options,
  });
};

/**
 * Hook: GET /api/manager/attendance/today
 * Team attendance summary, weekly chart, and paginated team list.
 *
 * @param {Object} params  { date, status, search, per_page, page }
 */
export const useManagerAttendanceToday = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["manager-attendance-today", params],
    queryFn: async () => {
      const res = await getManagerAttendanceToday(params);
      // API returns { success, data: { selected_date, summary, weekly_chart, team } }
      return res?.data ?? res;
    },
    staleTime: 1000 * 60 * 2, // refresh every 2 min
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * Hook: GET /api/manager/attendance/{employeeId}
 * Attendance details for a specific employee.
 *
 * @param {number} employeeId
 * @param {Object} params      { date }
 */
export const useManagerEmployeeAttendance = (employeeId, params = {}, options = {}) => {
  return useQuery({
    queryKey: ["manager-employee-attendance", employeeId, params],
    queryFn: async () => {
      const res = await getManagerEmployeeAttendance(employeeId, params);
      // API returns { success, data: { user, attendance } }
      return res?.data ?? res;
    },
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export default useManagerEmployees;
