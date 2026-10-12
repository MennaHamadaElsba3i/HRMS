import axiosInstance from "../utils/axiosInstance";

/**
 * GET /api/manager/employees
 * Retrieve employees managed by the authenticated manager.
 * Allowed for: Manager
 *
 * @param {Object} params
 * @param {string}  [params.search]            Search by name/email/ID/job title/phone
 * @param {string}  [params.status]            "active" | "inactive"
 * @param {number}  [params.department_id]
 * @param {string}  [params.employment_type]   "Full-time" | "Part-time" | "Contract"
 * @param {string}  [params.role]
 * @param {number}  [params.per_page]          default 15
 * @param {number}  [params.page]              default 1
 */
export const getManagerEmployees = async (params = {}) => {
  const response = await axiosInstance.get("/manager/employees", { params });
  return response.data;
};

/**
 * GET /api/manager/attendance/today
 * Retrieve today's team attendance summary, weekly chart & team list.
 * Allowed for: Manager
 *
 * @param {Object} params
 * @param {string}  [params.date]      Target date  YYYY-MM-DD
 * @param {string}  [params.status]    "Present" | "Late" | "Absent"
 * @param {string}  [params.search]    Search by employee name
 * @param {number}  [params.per_page]  default 15
 * @param {number}  [params.page]      default 1
 */
export const getManagerAttendanceToday = async (params = {}) => {
  const response = await axiosInstance.get("/manager/attendance/today", { params });
  return response.data;
};

/**
 * GET /api/manager/attendance/{employeeId}
 * Retrieve attendance details for a specific employee under the manager.
 * Allowed for: Manager
 *
 * @param {number} employeeId   ID of the employee
 * @param {Object} params
 * @param {string} [params.date]  Target date YYYY-MM-DD
 */
export const getManagerEmployeeAttendance = async (employeeId, params = {}) => {
  const response = await axiosInstance.get(`/manager/attendance/${employeeId}`, { params });
  return response.data;
};

export default {
  getManagerEmployees,
  getManagerAttendanceToday,
  getManagerEmployeeAttendance,
};
