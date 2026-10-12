import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFinancialAdvances,
  updateAdvanceStatus,
  getFinancialDeductions,
  createFinancialDeduction,
  getFinancialBonuses,
  createFinancialBonus,
  getFinancialPayroll,
  finalizeFinancialPayroll,
} from "../api";

// =====================================================
// GET HR ADVANCES (ALL EMPLOYEES)
// =====================================================
export const useHrAdvances = ({ page = 1, per_page = 10, lang = "en" } = {}) => {
  return useQuery({
    queryKey: ["hr-advances", page, per_page, lang],
    queryFn: () =>
      getFinancialAdvances(
        {
          page,
          per_page,
        },
        lang,
      ),
  });
};

// =====================================================
// UPDATE ADVANCE STATUS (HR / OWNER)
// PUT /api/financial/advances/{advance}/status
// =====================================================
export const useUpdateAdvanceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ advanceId, status, lang = "en" }) =>
      updateAdvanceStatus(advanceId, status, lang),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hr-advances"],
      });
      queryClient.invalidateQueries({
        queryKey: ["employee-advances"],
      });
    },
  });
};

// =====================================================
// GET HR DEDUCTIONS (ALL EMPLOYEES)
// =====================================================
export const useHrDeductions = ({
  page = 1,
  per_page = 10,
  lang = "en",
} = {}) => {
  return useQuery({
    queryKey: ["hr-deductions", page, per_page, lang],
    queryFn: () =>
      getFinancialDeductions(
        {
          page,
          per_page,
        },
        lang,
      ),
  });
};

// =====================================================
// CREATE DEDUCTION (HR / OWNER)
// POST /api/financial/deductions
// =====================================================
export const useCreateDeduction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, lang = "en" }) =>
      createFinancialDeduction(data, lang),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hr-deductions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["employee-deductions"],
      });
    },
  });
};

// =====================================================
// GET HR BONUSES & CREATE BONUS (HR / OWNER)
// GET /api/financial/bonuses & POST /api/financial/bonuses
// =====================================================
export const useHrBonuses = ({ page = 1, per_page = 10, lang = "en" } = {}) => {
  return useQuery({
    queryKey: ["hr-bonuses", page, per_page, lang],
    queryFn: () =>
      getFinancialBonuses(
        {
          page,
          per_page,
        },
        lang,
      ),
  });
};

export const useCreateBonus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, lang = "en" }) =>
      createFinancialBonus(data, lang),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hr-bonuses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["employee-bonuses"],
      });
    },
  });
};

// =====================================================
// GET HR / OWNER PAYROLL
// GET /api/financial/payroll
// =====================================================
export const useHrPayroll = ({
  month_year,
  page = 1,
  per_page = 10,
  lang = "en",
} = {}) => {
  return useQuery({
    queryKey: ["hr-payroll", month_year, page, per_page, lang],
    queryFn: () =>
      getFinancialPayroll(
        {
          month_year,
          page,
          per_page,
        },
        lang,
      ),
  });
};

// =====================================================
// FINALIZE PAYROLL (HR / OWNER)
// POST /api/financial/payroll/finalize
// =====================================================
export const useFinalizePayroll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ month_year, lang = "en" }) =>
      finalizeFinancialPayroll({ month_year }, lang),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hr-payroll"],
      });
      queryClient.invalidateQueries({
        queryKey: ["employee-my-salaries"],
      });
      queryClient.invalidateQueries({
        queryKey: ["hr-advances"],
      });
      queryClient.invalidateQueries({
        queryKey: ["hr-deductions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["hr-bonuses"],
      });
    },
  });
};
