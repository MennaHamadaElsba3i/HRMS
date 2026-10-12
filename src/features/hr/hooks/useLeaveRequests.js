import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveLeaveRequest,
  getHrPendingLeaveRequests,
  rejectLeaveRequest,
} from "../api";

export const useHrPendingLeaveRequests = (lang = "en", enabled = true) =>
  useQuery({
    queryKey: ["leaveRequests", "hrPending", lang],
    queryFn: async () => {
      const response = await getHrPendingLeaveRequests(lang);
      const requests = [
        response?.data?.data,
        response?.data?.leave_requests,
        response?.data,
        response?.leave_requests,
        response,
      ].find(Array.isArray);

      if (!requests) {
        throw new Error(
          "The leave requests response from the server is invalid.",
        );
      }

      return requests;
    },
    enabled,
  });

export const useApproveLeaveRequest = (lang = "en") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => approveLeaveRequest(id, lang),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] }),
  });
};

export const useRejectLeaveRequest = (lang = "en") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rejectionReason }) =>
      rejectLeaveRequest(id, rejectionReason, lang),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] }),
  });
};
