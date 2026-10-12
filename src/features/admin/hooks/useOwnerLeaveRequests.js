import { useQuery } from "@tanstack/react-query";
import { getOwnerPendingLeaveRequests } from "../api";

export const useOwnerPendingLeaveRequests = (lang = "en", enabled = true) =>
  useQuery({
    queryKey: ["leaveRequests", "ownerPending", lang],
    queryFn: async () => {
      const response = await getOwnerPendingLeaveRequests(lang);
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
