import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmployeeLeaveRequest,
  getEmployeeLeaveBalances,
  getEmployeeLeaveRequests,
  getEmployeeLeaveTypes,
  uploadEmployeeLeaveAttachment,
} from "../api";

const getResponseItems = (response, resourceName) => {
  if (!Array.isArray(response?.data)) {
    throw new Error(`The ${resourceName} response from the server is invalid.`);
  }

  return response.data;
};

export const useEmployeeLeaveTypes = (lang = "en") =>
  useQuery({
    queryKey: ["leaveTypes", lang],
    queryFn: async () =>
      getResponseItems(await getEmployeeLeaveTypes(lang), "leave types"),
  });

export const useEmployeeLeaveBalances = (year, lang = "en") =>
  useQuery({
    queryKey: ["leaveBalances", "employee", year, lang],
    queryFn: async () =>
      getResponseItems(
        await getEmployeeLeaveBalances(year, lang),
        "leave balances",
      ),
  });

export const useEmployeeLeaveRequests = (year, lang = "en") =>
  useQuery({
    queryKey: ["leaveRequests", "employeeHistory", year, lang],
    queryFn: async () =>
      getResponseItems(
        await getEmployeeLeaveRequests(year, lang),
        "leave request history",
      ),
  });

export const useCreateEmployeeLeaveRequest = (lang = "en") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestData) => createEmployeeLeaveRequest(requestData, lang),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaveRequests"] }),
        queryClient.invalidateQueries({ queryKey: ["leaveBalances"] }),
      ]),
  });
};

export const useUploadEmployeeLeaveAttachment = (lang = "en") =>
  useMutation({
    mutationFn: ({ requestId, file }) =>
      uploadEmployeeLeaveAttachment(requestId, file, lang),
  });
