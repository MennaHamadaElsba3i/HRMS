import axiosInstance from "../utils/axiosInstance";

/**
 * GET /api/employee/performance
 * Employee performance dashboard
 * Accessible by: Employee
 *
 * @param {Object} [params]
 * @param {number}  [params.period_id]
 * @param {string}  [params.start_date]  YYYY-MM-DD
 * @param {string}  [params.end_date]    YYYY-MM-DD
 */
export const getEmployeePerformance = async (params = {}) => {
  const response = await axiosInstance.get("/employee/performance", { params });
  return response.data;
};

/**
 * GET /api/manager/team-performance
 * Manager team performance dashboard
 * Accessible by: Manager
 *
 * @param {Object} [params]
 * @param {number}  [params.period_id]
 * @param {string}  [params.start_date]
 * @param {string}  [params.end_date]
 * @param {number}  [params.per_page]   default 10
 * @param {number}  [params.page]
 */
export const getTeamPerformance = async (params = {}) => {
  const response = await axiosInstance.get("/manager/team-performance", { params });
  return response.data;
};

/**
 * GET /api/hr/company-performance
 * HR/Owner company-wide performance dashboard
 * Accessible by: HR, Owner
 *
 * @param {Object} [params]
 * @param {number}  [params.period_id]
 * @param {string}  [params.start_date]
 * @param {string}  [params.end_date]
 * @param {number}  [params.per_page]   default 10
 * @param {number}  [params.page]
 */
export const getCompanyPerformance = async (params = {}) => {
  const response = await axiosInstance.get("/hr/company-performance", { params });
  return response.data;
};

export default {
  getEmployeePerformance,
  getTeamPerformance,
  getCompanyPerformance,
};
