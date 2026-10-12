import {
  LuTrendingUp,
  LuGauge,
  LuTarget,
  LuBookOpen,
  LuClipboardCheck,
  LuShieldAlert,
  LuUsers,
} from "react-icons/lu";

// Backend role names (same values as ROLE_ROUTES / useAuth().role)
const ALL_ROLES = ["Employee", "Manager", "HR", "Owner"];
const MANAGEMENT_ROLES = ["Manager", "HR", "Owner"];

/**
 * Source of truth for who can use which AI feature.
 * Mirrors the API docs:
 *  - "For All Roles"            -> ALL_ROLES
 *  - "Manager / HR / Owner only" -> MANAGEMENT_ROLES
 * UI gating only. The backend enforces the real permissions (403).
 */
export const AI_FEATURES = [
  { key: "careerCoach", labelKey: "ai.features.careerCoach", icon: LuTrendingUp, roles: ALL_ROLES },
  { key: "performanceInsight", labelKey: "ai.features.performanceInsight", icon: LuGauge, roles: ALL_ROLES },
  { key: "skillGap", labelKey: "ai.features.skillGap", icon: LuTarget, roles: ALL_ROLES },
  { key: "policyAssistant", labelKey: "ai.features.policyAssistant", icon: LuBookOpen, roles: ALL_ROLES },
  { key: "evaluationDraft", labelKey: "ai.features.evaluationDraft", icon: LuClipboardCheck, roles: MANAGEMENT_ROLES },
  { key: "attentionSignal", labelKey: "ai.features.attentionSignal", icon: LuShieldAlert, roles: MANAGEMENT_ROLES },
  { key: "teamInsight", labelKey: "ai.features.teamInsight", icon: LuUsers, roles: MANAGEMENT_ROLES },
];

export const getAiFeaturesForRole = (role) =>
  AI_FEATURES.filter((feature) => feature.roles.includes(role));