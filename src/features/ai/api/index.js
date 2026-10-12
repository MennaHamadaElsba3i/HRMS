import axiosInstance from "../../../utils/axiosInstance";

// AI generation can take longer than the global 15s axios timeout
const AI_TIMEOUT_MS = 60000;

// Project convention: lang as query param + Accept-Language header
// (App-Language is added by the axios interceptor)
const aiRequestConfig = (lang = "en") => ({
  params: { lang },
  timeout: AI_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
    "Accept-Language": lang,
  },
});

const aiPost = async (path, body, lang) => {
  const response = await axiosInstance.post(path, body, aiRequestConfig(lang));
  return response.data;
};

// All roles
// Body: { employee_id, period? }
export const generateCareerCoach = (body, lang) =>
  aiPost("/ai/career-coach", body, lang);

// Body: { employee_id, period }
export const generatePerformanceInsight = (body, lang) =>
  aiPost("/ai/performance-insight", body, lang);

// Body: { employee_id, period?, target_role?, target_skills?: string[] }
export const generateSkillGap = (body, lang) =>
  aiPost("/ai/skill-gap", body, lang);

// Body: { employee_id, question (min 3), session_id? }
export const askPolicyAssistant = (body, lang) =>
  aiPost("/ai/policy-assistant", body, lang);

// Manager / HR / Owner only (the backend enforces this with 403)
// Body: { employee_id, period, evaluation_scores: object, manager_notes? }
export const generateEvaluationDraft = (body, lang) =>
  aiPost("/ai/evaluation-draft", body, lang);

// Body: { employee_id, target_period }
export const generateAttentionSignal = (body, lang) =>
  aiPost("/ai/attention-signal", body, lang);

// Body: { department, period }
export const generateTeamInsight = (body, lang) =>
  aiPost("/ai/team-insight", body, lang);