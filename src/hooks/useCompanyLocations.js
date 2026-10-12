import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveCompanyLocation,
  createCompanyLocation,
  updateCompanyLocation,
  deactivateCompanyLocation,
  activateCompanyLocation,
} from "../api/companyLocationsApi";

const QUERY_KEY = ["company-location-active"];

/**
 * GET /api/locations/company/location/active
 * Returns the single active company location (or null if 404/500 when no location exists yet).
 */
export const useActiveCompanyLocation = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await getActiveCompanyLocation();
        return res?.data ?? null;
      } catch (err) {
        // 404 or 500 (backend error when no company location record exists) → treat as null (empty state)
        const status = err?.response?.status;
        if (status === 404 || status === 500) return null;
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: (failCount, err) => {
      const status = err?.response?.status;
      if (status === 404 || status === 500) return false;
      return failCount < 2;
    },
    ...options,
  });
};


/**
 * POST /api/locations/company/location
 * Create a new company location.
 */
export const useCreateCompanyLocation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => createCompanyLocation(body),
    onSuccess: (data) => {
      // Update cache with the newly created location
      queryClient.setQueryData(QUERY_KEY, data?.data ?? null);
      options.onSuccess?.(data);
    },
    onError: options.onError,
    ...options,
  });
};

/**
 * PUT /api/locations/company/location/{id}
 * Update an existing company location.
 */
export const useUpdateCompanyLocation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => updateCompanyLocation(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data?.data ?? null);
      options.onSuccess?.(data);
    },
    onError: options.onError,
    ...options,
  });
};

/**
 * PATCH /api/locations/company/location/{id}/deactivate
 * Deactivate a company location.
 */
export const useDeactivateCompanyLocation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deactivateCompanyLocation(id),
    onMutate: async (id) => {
      // Optimistic update — mark as inactive immediately
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, (old) =>
        old ? { ...old, is_active: false } : old
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previous !== undefined) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
      options.onError?.(_err);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data?.data ?? null);
      options.onSuccess?.(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

/**
 * PATCH /api/locations/company/location/{id}/activate
 * Activate a company location.
 */
export const useActivateCompanyLocation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => activateCompanyLocation(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, (old) =>
        old ? { ...old, is_active: true } : old
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
      options.onError?.(_err);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data?.data ?? null);
      options.onSuccess?.(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export default useActiveCompanyLocation;
