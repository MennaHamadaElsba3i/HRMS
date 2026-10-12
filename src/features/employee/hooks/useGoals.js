import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getGoals, getGoalDetails, markGoalCompleted } from "../api";

// =====================================================
// GET EMPLOYEE GOALS
// =====================================================

export const useGoals = ({
  status = "",
  page = 1,
  per_page = 15,
  lang = "en",
} = {}) => {
  return useQuery({
    queryKey: ["employee-goals", status, page, per_page, lang],

    queryFn: () =>
      getGoals(
        {
          page,
          per_page,
          ...(status !== "all" && status ? { status } : {}),
        },
        lang,
      ),
  });
};

// =====================================================
// GET GOAL DETAILS
// =====================================================

export const useGoalDetails = (goalId, lang = "en") => {
  return useQuery({
    queryKey: ["employee-goal", goalId, lang],

    queryFn: () => getGoalDetails(goalId, lang),

    enabled: !!goalId,
  });
};

// =====================================================
// MARK GOAL AS COMPLETED
// =====================================================

export const useMarkGoalCompleted = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, lang = "en" }) => markGoalCompleted(goalId, lang),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["employee-goals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["employee-goal", variables.goalId],
      });
    },
  });
};
