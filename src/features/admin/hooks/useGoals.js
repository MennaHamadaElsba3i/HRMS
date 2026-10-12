import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getGoals, createGoal, updateGoal } from "../api";

// =====================================================
// GET GOALS
// =====================================================

export const useGoals = (params = {}, lang = "en") => {
  return useQuery({
    queryKey: ["goals", params, lang],

    queryFn: () => getGoals(params, lang),

    placeholderData: (previousData) => previousData,

    staleTime: 30 * 1000,

    retry: 2,
  });
};

// =====================================================
// CREATE GOAL
// =====================================================

export const useCreateGoal = (lang = "en") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalData) => createGoal(goalData, lang),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["goals"],
      });

      // لو HR page بتستخدم hr-goals
      // نخليها تتحدث هي كمان
      queryClient.invalidateQueries({
        queryKey: ["hr-goals"],
      });
    },
  });
};

// =====================================================
// UPDATE GOAL
// =====================================================

export const useUpdateGoal = (lang = "en") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, goalData }) => updateGoal(id, goalData, lang),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["goals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["hr-goals"],
      });
    },
  });
};
