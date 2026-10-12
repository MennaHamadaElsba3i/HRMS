import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCompanyEvents,
  createCompanyEvent,
  updateCompanyEvent,
  deleteCompanyEvent,
} from "../api/companyEventsApi";

/**
 * Hook to fetch all company events
 * GET /api/company-events
 * Accessible by Owner, HR, Manager, Employee
 */
export const useCompanyEvents = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["company-events", params],
    queryFn: async () => {
      const response = await getCompanyEvents(params);
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
 * Hook to create a new company event
 * POST /api/company-events
 * Accessible by HR, Owner
 */
export const useCreateCompanyEvent = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompanyEvent,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["company-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
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
 * Hook to update an existing company event
 * PUT /api/company-events/{id}
 * Accessible by HR, Owner
 */
export const useUpdateCompanyEvent = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCompanyEvent,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["company-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
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
 * Hook to delete a company event
 * DELETE /api/company-events/{id}
 * Accessible by HR, Owner
 */
export const useDeleteCompanyEvent = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompanyEvent,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["company-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
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

export default useCompanyEvents;
