import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "../api/holidaysApi";

/**
 * Hook to fetch all company holidays
 * GET /api/holidays
 * Accessible by Owner, HR, Manager, Employee
 */
export const useHolidays = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["holidays", params],
    queryFn: async () => {
      const response = await getHolidays(params);
      const list = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      return list;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    ...options,
  });
};

/**
 * Hook to create a new holiday
 * POST /api/holidays
 * Accessible by HR, Owner
 */
export const useCreateHoliday = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHoliday,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      if (options.onSuccess) {
        options.onSuccess(...args);
      }
    },
    onError: (...args) => {
      if (options.onError) {
        options.onError(...args);
      }
    },
    ...options,
  });
};

/**
 * Hook to update an existing holiday
 * PUT /api/holidays/{id}
 * Accessible by HR, Owner
 */
export const useUpdateHoliday = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHoliday,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      if (options.onSuccess) {
        options.onSuccess(...args);
      }
    },
    onError: (...args) => {
      if (options.onError) {
        options.onError(...args);
      }
    },
    ...options,
  });
};

/**
 * Hook to delete a holiday
 * DELETE /api/holidays/{id}
 * Accessible by HR, Owner
 */
export const useDeleteHoliday = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      if (options.onSuccess) {
        options.onSuccess(...args);
      }
    },
    onError: (...args) => {
      if (options.onError) {
        options.onError(...args);
      }
    },
    ...options,
  });
};

export default useHolidays;
