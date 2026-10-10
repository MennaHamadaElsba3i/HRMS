import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { readAiCache, writeAiCache } from "../utils/aiCache";
import {
  generateCareerCoach,
  generatePerformanceInsight,
  generateSkillGap,
  askPolicyAssistant,
  generateEvaluationDraft,
  generateAttentionSignal,
  generateTeamInsight,
} from "../api";

// "Generate" actions (POST) -> useMutation. Nothing runs until the user clicks.
// With persist=true the last successful result (and the request that produced
// it) is kept in sessionStorage and restored after a refresh.
const useAiMutation = (featureKey, fn, persist, lang) => {
  const { currentUser } = useAuth();
  const userId = persist ? (currentUser?.userId ?? currentUser?.id) : null;

  const [saved, setSaved] = useState(() =>
    readAiCache(userId, featureKey, lang),
  );

  // Language or user changed -> load the matching saved entry (or none)
  useEffect(() => {
    setSaved(readAiCache(userId, featureKey, lang));
  }, [userId, featureKey, lang]);

  const mutation = useMutation({
    mutationFn: (body) => fn(body, lang),
    onSuccess: (response, body) => {
      if (!persist) return;
      const entry = { response, request: body };
      writeAiCache(userId, featureKey, lang, entry);
      setSaved(entry);
    },
  });

  const showSaved = persist && mutation.isIdle && Boolean(saved);

  return {
    ...mutation,
    data: showSaved ? saved.response : mutation.data,
    isIdle: showSaved ? false : mutation.isIdle,
    isSuccess: showSaved ? true : mutation.isSuccess,
    lastRequest: persist ? (saved?.request ?? null) : null,
    isRestored: showSaved,
  };
};

// Persisted
export const useCareerCoach = (lang = "en") =>
  useAiMutation("careerCoach", generateCareerCoach, true, lang);
export const useSkillGap = (lang = "en") =>
  useAiMutation("skillGap", generateSkillGap, true, lang);

// Not persisted yet
export const usePerformanceInsight = (lang = "en") =>
  useAiMutation("performanceInsight", generatePerformanceInsight, false, lang);
export const usePolicyAssistant = (lang = "en") =>
  useAiMutation("policyAssistant", askPolicyAssistant, false, lang);
export const useEvaluationDraft = (lang = "en") =>
  useAiMutation("evaluationDraft", generateEvaluationDraft, false, lang);
export const useAttentionSignal = (lang = "en") =>
  useAiMutation("attentionSignal", generateAttentionSignal, false, lang);
export const useTeamInsight = (lang = "en") =>
  useAiMutation("teamInsight", generateTeamInsight, false, lang);