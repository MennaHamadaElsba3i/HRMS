import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  listEvaluationPeriods,
  storeEvaluationPeriod,
  toggleEvaluationPeriodStatus,
  listEvaluationCategories,
  storeEvaluationCategory,
  getHrEvaluations,
  getManagerEvaluations,
  getEmployeeEvaluations,
  storeEvaluationDraft,
  updateEvaluationDraft,
  completeEvaluation,
} from "../api/evaluationsApi";

// ==========================================
// 1. PERIODS HOOKS
// ==========================================

export const useEvaluationPeriods = (params = {}) => {
  return useQuery({
    queryKey: ["evaluation-periods", params],
    queryFn: () => listEvaluationPeriods(params),
    select: (res) => res?.data?.periods || res?.data || [],
  });
};

export const useCreateEvaluationPeriod = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: storeEvaluationPeriod,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] });
      toast.success(
        res?.message ||
          t(
            "evaluations.periodCreatedSuccess",
            "Evaluation period created successfully."
          )
      );
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          t(
            "evaluations.periodCreatedError",
            "Failed to create evaluation period."
          )
      );
    },
  });
};

export const useToggleEvaluationPeriodStatus = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: toggleEvaluationPeriodStatus,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] });
      toast.success(
        res?.message ||
          t(
            "evaluations.periodStatusChanged",
            "Evaluation period status updated."
          )
      );
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          t(
            "evaluations.periodStatusError",
            "Failed to update evaluation period status."
          )
      );
    },
  });
};

// ==========================================
// 2. CATEGORIES HOOKS
// ==========================================

export const useEvaluationCategories = (params = {}) => {
  return useQuery({
    queryKey: ["evaluation-categories", params],
    queryFn: () => listEvaluationCategories(params),
    select: (res) => res?.data?.categories || res?.data || [],
  });
};

export const useCreateEvaluationCategory = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: storeEvaluationCategory,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-categories"] });
      toast.success(
        res?.message ||
          t(
            "evaluations.categoryCreatedSuccess",
            "Evaluation category created successfully."
          )
      );
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          t(
            "evaluations.categoryCreatedError",
            "Failed to create evaluation category."
          )
      );
    },
  });
};

// ==========================================
// 3. ROLE-BASED EVALUATION LISTS
// ==========================================

export const useHrEvaluations = (params = {}) => {
  return useQuery({
    queryKey: ["evaluations", "hr", params],
    queryFn: () => getHrEvaluations(params),
    select: (res) => res?.data?.evaluations || res?.data || [],
  });
};

export const useManagerEvaluations = (params = {}) => {
  return useQuery({
    queryKey: ["evaluations", "manager", params],
    queryFn: () => getManagerEvaluations(params),
    select: (res) => res?.data?.evaluations || res?.data || [],
  });
};

export const useEmployeeEvaluations = (params = {}) => {
  return useQuery({
    queryKey: ["evaluations", "employee", params],
    queryFn: () => getEmployeeEvaluations(params),
    select: (res) => res?.data?.evaluations || res?.data || [],
  });
};

// ==========================================
// 4. EVALUATION DRAFTS & COMPLETION
// ==========================================

export const useCreateEvaluationDraft = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: storeEvaluationDraft,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success(
        res?.message ||
          t(
            "evaluations.draftSavedSuccess",
            "Evaluation draft saved successfully."
          )
      );
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          t(
            "evaluations.draftSavedError",
            "Failed to save evaluation draft."
          )
      );
    },
  });
};

export const useUpdateEvaluationDraft = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }) => updateEvaluationDraft(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success(
        res?.message ||
          t(
            "evaluations.draftUpdatedSuccess",
            "Evaluation updated successfully."
          )
      );
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          t(
            "evaluations.draftUpdatedError",
            "Failed to update evaluation."
          )
      );
    },
  });
};

export const useCompleteEvaluation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: completeEvaluation,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success(
        res?.message ||
          t(
            "evaluations.completedSuccess",
            "Evaluation completed and locked successfully."
          )
      );
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          t(
            "evaluations.completedError",
            "Failed to complete evaluation."
          )
      );
    },
  });
};
