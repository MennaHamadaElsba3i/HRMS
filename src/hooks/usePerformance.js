import { useQuery } from "@tanstack/react-query";
import {
  getEmployeePerformance,
  getTeamPerformance,
  getCompanyPerformance,
} from "../api/performanceApi";

/**
 * Employee: GET /api/employee/performance
 * @param {Object} params  { period_id?, start_date?, end_date? }
 */
export const useEmployeePerformance = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["employee-performance", params],
    queryFn: async () => {
      const res = await getEmployeePerformance(params);
      // API returns { success, data: { ... } }
      return res?.data ?? res;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * Manager: GET /api/manager/team-performance
 * @param {Object} params  { period_id?, start_date?, end_date?, per_page?, page? }
 */
export const useTeamPerformance = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["team-performance", params],
    queryFn: async () => {
      const res = await getTeamPerformance(params);
      return res?.data ?? res;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * HR/Owner: GET /api/hr/company-performance
 * @param {Object} params  { period_id?, start_date?, end_date?, per_page?, page? }
 */
export const useCompanyPerformance = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["company-performance", params],
    queryFn: async () => {
      const res = await getCompanyPerformance(params);
      return res?.data ?? res;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export default useEmployeePerformance;
