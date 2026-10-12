import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getEmployees,
  createEmployee,
  updateEmployeeHRFields,
  changeEmployeeAccountStatus,
  getEmployeeById,
} from "../api";

// =====================================================
// GET EMPLOYEES
// =====================================================
export const useEmployees = (params = {}, lang = "en") => {
  return useQuery({
    queryKey: ["employees", params, lang],

    queryFn: () =>
      getEmployees({
        ...params,
        lang,
      }),

    placeholderData: (previousData) => previousData,

    staleTime: 30 * 1000,

    retry: 2,
  });
};

// =====================================================
// CREATE EMPLOYEE
// =====================================================
export const useCreateEmployee = (lang = "en") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeData) => createEmployee(employeeData, lang),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["employees"],
        refetchType: "active",
      });
    },
  });
};

// =====================================================
// UPDATE EMPLOYEE HR FIELDS
// PATCH /employees/{id}/hr-fields
// =====================================================
export const useUpdateEmployeeHrFields = (lang = "en") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hrData, employeeData }) =>
      updateEmployeeHRFields(id, hrData || employeeData, lang),

    onSuccess: (data, variables) => {
      // Invalidate employees list to refetch with updated data
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
      // Invalidate specific employee query if it exists
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: ["employee", variables.id],
        });
      }
    },
  });
};

// Alias for uppercase naming
export const useUpdateEmployeeHRFields = useUpdateEmployeeHrFields;

// =====================================================
// CHANGE EMPLOYEE ACCOUNT STATUS
// PATCH /employees/{id}/change-account-status
// =====================================================
export const useChangeEmployeeAccountStatus = (lang = "en") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => changeEmployeeAccountStatus(id, lang),

    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
      queryClient.invalidateQueries({
        queryKey: ["employee", id],
      });
    },
  });
};

// =====================================================
// GET EMPLOYEE BY ID
// GET /employees/{id}
// =====================================================
export const useEmployee = (id, lang = "en") => {
  return useQuery({
    queryKey: ["employee", id, lang],
    queryFn: () => getEmployeeById(id, lang),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
};
