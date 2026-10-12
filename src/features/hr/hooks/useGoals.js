import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getHrGoals, createGoal, updateGoal } from "../api";

// =====================================================
// GET HR GOALS
// =====================================================
export const useHrGoals = (params = {}, lang = "en") => {
  return useQuery({
    queryKey: ["hr-goals", params, lang],

    queryFn: () => getHrGoals(params, lang),

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
        queryKey: ["hr-goals"],
      });
    },
  });
};
