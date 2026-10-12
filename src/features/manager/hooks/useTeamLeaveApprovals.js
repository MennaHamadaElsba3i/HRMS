import { useQuery } from "@tanstack/react-query";
import { getManagerPendingLeaveRequests } from "../api";

export const useManagerPendingLeaveRequests = (lang = "en") =>
  useQuery({
    queryKey: ["leaveRequests", "managerPending", lang],
    queryFn: async () => {
      const response = await getManagerPendingLeaveRequests(lang);
      const requests = [
        response?.data?.data,
        response?.data?.leave_requests,
        response?.data,
        response?.leave_requests,
        response,
      ].find(Array.isArray);

      if (!requests) {
        throw new Error(
          "The manager leave requests response from the server is invalid.",
        );
      }

      return requests;
    },
  });
