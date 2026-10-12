import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAdvances,
  createAdvance,
  getDeductions,
  getBonuses,
  getMySalaries,
} from "../api";

// =====================================================
// GET SALARY ADVANCES
// =====================================================

export const useAdvances = ({ page = 1, per_page = 10, lang = "en" } = {}) => {
  return useQuery({
    queryKey: ["employee-advances", page, per_page, lang],

    queryFn: () =>
      getAdvances(
        {
          page,
          per_page,
        },
        lang,
      ),
  });
};

// =====================================================
// CREATE SALARY ADVANCE REQUEST
// =====================================================

export const useCreateAdvance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, lang = "en" }) => createAdvance(data, lang),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-advances"],
      });
    },
  });
};

// =====================================================
// GET DEDUCTIONS & PENALTIES
// =====================================================

export const useDeductions = ({
  page = 1,
  per_page = 10,
  lang = "en",
} = {}) => {
  return useQuery({
    queryKey: ["employee-deductions", page, per_page, lang],

    queryFn: () =>
      getDeductions(
        {
          page,
          per_page,
        },
        lang,
      ),
  });
};

// =====================================================
// GET BONUSES & INCENTIVES
// =====================================================

export const useBonuses = ({ page = 1, per_page = 10, lang = "en" } = {}) => {
  return useQuery({
    queryKey: ["employee-bonuses", page, per_page, lang],

    queryFn: () =>
      getBonuses(
        {
          page,
          per_page,
        },
        lang,
      ),
  });
};

// =====================================================
// GET MY SALARY HISTORY
// =====================================================

export const useMySalaries = ({
  page = 1,
  per_page = 10,
  lang = "en",
} = {}) => {
  return useQuery({
    queryKey: ["employee-my-salaries", page, per_page, lang],

    queryFn: () =>
      getMySalaries(
        {
          page,
          per_page,
        },
        lang,
      ),
  });
};
