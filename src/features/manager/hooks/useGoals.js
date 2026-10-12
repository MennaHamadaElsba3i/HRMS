import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getTeamGoals,
  getManagerEmployees,
  createGoal,
  updateGoal,
} from "../api";

// =====================================================
// GET TEAM GOALS
// =====================================================

export const useTeamGoals = ({
  status = "",
  employee_id = "",
  page = 1,
  per_page = 15,
} = {}) => {
  return useQuery({
    queryKey: ["team-goals", status, employee_id, page, per_page],

    queryFn: () =>
      getTeamGoals({
        status,
        employee_id,
        page,
        per_page,
      }),
  });
};

// =====================================================
// GET MANAGER EMPLOYEES
// =====================================================

export const useManagerEmployees = ({
  search = "",
  status = "",
  department_id = "",
  employment_type = "",
  role = "",
  page = 1,
  per_page = 15,
} = {}) => {
  return useQuery({
    queryKey: [
      "manager-employees",
      search,
      status,
      department_id,
      employment_type,
      role,
      page,
      per_page,
    ],

    queryFn: () =>
      getManagerEmployees({
        search,
        status,
        department_id,
        employment_type,
        role,
        page,
        per_page,
      }),
  });
};

// =====================================================
// CREATE GOAL
// =====================================================

export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGoal,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["team-goals"],
      });
    },
  });
};

// =====================================================
// UPDATE GOAL
// =====================================================

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateGoal(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["team-goals"],
      });
    },
  });
};
