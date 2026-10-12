import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLandingSections,
  updateLandingSection,
  getLandingFeatures,
  createLandingFeature,
  updateLandingFeature,
  deleteLandingFeature,
  getLandingRoles,
  createLandingRole,
  updateLandingRole,
  deleteLandingRole,
    getLandingPlans,
  createLandingPlan,
  updateLandingPlan,
  deleteLandingPlan,
} from "../api";

export const useLandingSections = (lang = "en") =>
  useQuery({
    queryKey: ["landing-sections", lang],
    queryFn: () => getLandingSections(lang),
  });

export const useLandingFeatures = (lang = "en") =>
  useQuery({
    queryKey: ["landing-features", lang],
    queryFn: () => getLandingFeatures(lang),
  });

export const useUpdateLandingSection = (lang = "en") => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, content }) => updateLandingSection(key, content, lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-sections"] }),
  });
};

export const useCreateLandingFeature = (lang = "en") => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createLandingFeature(payload, lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-features"] }),
  });
};

export const useUpdateLandingFeature = (lang = "en") => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateLandingFeature(id, payload, lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-features"] }),
  });
};

export const useDeleteLandingFeature = (lang = "en") => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteLandingFeature(id, lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-features"] }),
  });
};

export const useLandingRoles = (lang = "en") =>
  useQuery({
    queryKey: ["landing-roles", lang],
    queryFn: () => getLandingRoles(lang),
  });

export const useCreateLandingRole = (lang = "en") => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createLandingRole(payload, lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-roles"] }),
  });
};

export const useUpdateLandingRole = (lang = "en") => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateLandingRole(id, payload, lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-roles"] }),
  });
};

export const useDeleteLandingRole = (lang = "en") => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteLandingRole(id, lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-roles"] }),
  });
};

export const useLandingPlans = (lang = "en") =>
  useQuery({
    queryKey: ["landing-plans", lang],
    queryFn: () => getLandingPlans(lang),
  });

export const useCreateLandingPlan = (lang = "en") => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createLandingPlan(payload, lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-plans"] }),
  });
};

export const useUpdateLandingPlan = (lang = "en") => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateLandingPlan(id, payload, lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-plans"] }),
  });
};

export const useDeleteLandingPlan = (lang = "en") => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteLandingPlan(id, lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-plans"] }),
  });
};