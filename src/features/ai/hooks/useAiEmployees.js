import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { getEmployees } from "../../admin/api";
import { getManagerEmployees } from "../../../api/managerApi";

// Tolerant extraction: the list may be under employees / data / data.employees...
export const extractEmployees = (res) => {
  const candidates = [
    res?.employees,
    res?.data?.employees,
    res?.data?.data,
    res?.data,
    res?.employees?.data,
    res,
  ];
  return candidates.find(Array.isArray) ?? [];
};

const normalizeEmployee = (e) => ({
  code: e?.employee_code ?? e?.code ?? "",
  name: e?.name ?? e?.full_name ?? "",
  department:
    typeof e?.department === "string"
      ? e.department
      : (e?.department?.name ?? ""),
});

/**
 * Employee  -> disabled (no request)
 * Manager   -> their team only
 * HR/Owner  -> company employees
 * The backend still enforces the real scope.
 */
export const useAiEmployees = (lang = "en") => {
  const { role } = useAuth();
  const isManager = role === "Manager";
  const isCompanyWide = role === "HR" || role === "Owner";

  const query = useQuery({
    queryKey: ["ai-employees", role, lang],
    enabled: isManager || isCompanyWide,
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      isManager
        ? getManagerEmployees({ per_page: 100 })
        : getEmployees({ per_page: 100, lang }),
  });

  const employees = useMemo(
    () =>
      extractEmployees(query.data)
        .map(normalizeEmployee)
        .filter((e) => e.code),
    [query.data],
  );

  return {
    employees,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};