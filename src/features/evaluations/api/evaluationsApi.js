import axiosInstance from "../../../utils/axiosInstance";

// ==========================================
// 1. EVALUATION PERIODS
// ==========================================

/**
 * GET /api/evaluation-periods
 * List all evaluation periods (HR / Owner / Manager)
 */
export const listEvaluationPeriods = async (params = {}) => {
  const response = await axiosInstance.get("/evaluation-periods", { params });
  return response.data;
};

/**
 * POST /api/evaluation-periods
 * Create a new evaluation period (HR / Owner / Manager)
 */
export const storeEvaluationPeriod = async (data) => {
  const response = await axiosInstance.post("/evaluation-periods", data);
  return response.data;
};

/**
 * PATCH /api/evaluation-periods/{id}/toggle-status
 * Toggle evaluation period active/inactive/closed status
 */
export const toggleEvaluationPeriodStatus = async (id) => {
  const response = await axiosInstance.patch(
    `/evaluation-periods/${id}/toggle-status`
  );
  return response.data;
};

// ==========================================
// 2. EVALUATION CATEGORIES
// ==========================================

/**
 * GET /api/evaluation-categories
 * List evaluation categories with max_score & weight
 */
export const listEvaluationCategories = async (params = {}) => {
  const response = await axiosInstance.get("/evaluation-categories", {
    params,
  });
  return response.data;
};

/**
 * POST /api/evaluation-categories
 * Create a new evaluation category
 */
export const storeEvaluationCategory = async (data) => {
  const response = await axiosInstance.post("/evaluation-categories", data);
  return response.data;
};

// ==========================================
// 3. EVALUATIONS BY ROLE
// ==========================================

/**
 * GET /api/evaluations/hr
 * Company Evaluations Overview (HR / Owner)
 */
export const getHrEvaluations = async (params = {}) => {
  const response = await axiosInstance.get("/evaluations/hr", { params });
  return response.data;
};

/**
 * GET /api/evaluations/manager
 * Team Evaluations (Manager)
 */
export const getManagerEvaluations = async (params = {}) => {
  const response = await axiosInstance.get("/evaluations/manager", { params });
  return response.data;
};

/**
 * GET /api/evaluations/employee
 * Employee Evaluation History
 */
export const getEmployeeEvaluations = async (params = {}) => {
  const response = await axiosInstance.get("/evaluations/employee", {
    params,
  });
  return response.data;
};

// ==========================================
// 4. EVALUATION DRAFTS & ACTIONS
// ==========================================

/**
 * POST /api/evaluations
 * Create Evaluation Draft (HR / Owner / Manager)
 */
export const storeEvaluationDraft = async (data) => {
  const response = await axiosInstance.post("/evaluations", data);
  return response.data;
};

/**
 * PUT /api/evaluations/{id}
 * Update Evaluation Draft (HR / Owner / Manager)
 */
export const updateEvaluationDraft = async (id, data) => {
  const response = await axiosInstance.put(`/evaluations/${id}`, data);
  return response.data;
};

/**
 * PATCH /api/evaluations/{id}/complete
 * Complete & Lock Evaluation (HR / Owner / Manager)
 */
export const completeEvaluation = async (id) => {
  const response = await axiosInstance.patch(`/evaluations/${id}/complete`);
  return response.data;
};
