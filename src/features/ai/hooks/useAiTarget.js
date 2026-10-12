import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";

/**
 * Employee  -> always their own employee_code (no picker).
 * Others    -> the employee code they enter (the backend enforces scope).
 */
export const useAiTarget = (initialId = "") => {
  const { currentUser, role } = useAuth();
  const [selectedId, setSelectedId] = useState(initialId);

  const isSelf = role === "Employee";
  const ownCode = currentUser?.employee_code ?? "";

  return {
    isSelf,
    ownCode,
    selectedId,
    setSelectedId,
    employeeId: isSelf ? ownCode : selectedId.trim(),
  };
};