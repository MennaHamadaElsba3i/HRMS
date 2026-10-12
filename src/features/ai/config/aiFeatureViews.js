import { lazy } from "react";

// feature key -> lazy view component.
// The views are only downloaded when a role that is allowed to see the
// feature opens it (the registry filters the tabs by role first).
export const AI_FEATURE_VIEWS = {
  careerCoach: lazy(() => import("../components/features/CareerCoachView")),
  performanceInsight: lazy(
    () => import("../components/features/PerformanceInsightView"),
  ),
  skillGap: lazy(() => import("../components/features/SkillGapView")),
  policyAssistant: lazy(
    () => import("../components/features/PolicyAssistantView"),
  ),
  evaluationDraft: lazy(
    () => import("../components/features/EvaluationDraftView"),
  ),
  attentionSignal: lazy(
    () => import("../components/features/AttentionSignalView"),
  ),
  teamInsight: lazy(() => import("../components/features/TeamInsightView")),
};