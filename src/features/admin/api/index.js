import axiosInstance from "../../../utils/axiosInstance";

// =====================================================
// PERMISSIONS
// =====================================================

// Retrieve all permissions (Owner & HR)
export const getPermissions = async (lang) => {
  const response = await axiosInstance.get("/permissions", {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

// =====================================================
// EMPLOYEES
// =====================================================

// List all employees (Owner & HR)
export const getEmployees = async (params = {}) => {
  const response = await axiosInstance.get("/employees", {
    params,
  });
  return response.data;
};

// Fetch every page for views that do not provide pagination controls.
export const getAllEmployees = async (params = {}) => {
  const employees = [];
  let page = 1;

  while (true) {
    const response = await getEmployees({
      ...params,
      page,
      per_page: params.per_page || 100,
    });
    const currentPage = [
      response?.data?.employees,
      response?.employees,
      response?.data?.data?.employees,
      response?.data?.data,
      response?.data,
      response,
    ].find(Array.isArray);

    if (!currentPage) {
      throw new Error("The employees response from the server is invalid.");
    }

    employees.push(...currentPage);

    const pagination = [
      response?.data?.meta,
      response?.data?.data?.meta,
      response?.data,
      response?.data?.data,
      response?.meta,
      response,
    ].find(
      (candidate) =>
        candidate?.last_page != null || candidate?.lastPage != null,
    );

    const lastPage = Number(pagination?.last_page ?? pagination?.lastPage);
    if (!Number.isFinite(lastPage) || lastPage <= page) break;

    page += 1;
  }

  return employees;
};

// Create a new employee (Owner & HR)
export const createEmployee = async (employeeData, lang) => {
  const response = await axiosInstance.post("/employees", employeeData, {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

// =====================================================
// DEPARTMENTS
// =====================================================

// Get all departments
export const getDepartments = async (params = {}) => {
  const response = await axiosInstance.get("/departments", {
    params,
  });
  return response.data;
};

// =====================================================
// GOALS
// =====================================================

// List goals (supports page, per_page, status, employee_id, department_id)
// List company goals overview (HR)
export const getGoals = async (params = {}, lang) => {
  const response = await axiosInstance.get("/hr/goals", {
    params: lang ? { ...params, lang } : params,
  });
  return response.data;
};

// Create a new goal
export const createGoal = async (goalData, lang) => {
  const response = await axiosInstance.post("/goals", goalData, {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

// Update an existing goal
export const updateGoal = async (id, goalData, lang) => {
  const response = await axiosInstance.put(`/goals/${id}`, goalData, {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

// =====================================================
// OWNER DASHBOARD
// GET /owner/dashboard
// Header: App-Language (ar | en)
// Permission: owner.dashboard.view
// =====================================================
export const getOwnerDashboard = async (lang = "en") => {
  const response = await axiosInstance.get("/owner/dashboard", {
    headers: {
      Accept: "application/json",
      "App-Language": lang,
      "Accept-Language": lang,
    },
  });
  return response.data;
};
// GET PENDING LEAVE REQUESTS
// Owner access is served by the general leave request history endpoint.
// =====================================================
export const getOwnerPendingLeaveRequests = async (lang = "en") => {
  const response = await axiosInstance.get("/leaves/leave-requests", {
    params: { lang, status: "Pending" },
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

// =====================================================
// LANDING PAGE (Owner)
// =====================================================
const langConfig = (lang = "en") => ({
  headers: { "Accept-Language": lang, "App-Language": lang },
});

export const getLandingSections = async (lang = "en") => {
  const res = await axiosInstance.get("/owner/landing-page/sections", langConfig(lang));
  return res.data;
};

export const updateLandingSection = async (key, content, lang = "en") => {
  const res = await axiosInstance.put(
    `/owner/landing-page/sections/${key}`,
    { content },
    langConfig(lang),
  );
  return res.data;
};

export const getLandingFeatures = async (lang = "en") => {
  const res = await axiosInstance.get("/owner/landing-page/features", langConfig(lang));
  return res.data;
};

export const createLandingFeature = async (payload, lang = "en") => {
  const res = await axiosInstance.post("/owner/landing-page/features", payload, langConfig(lang));
  return res.data;
};

export const updateLandingFeature = async (id, payload, lang = "en") => {
  const res = await axiosInstance.put(
    `/owner/landing-page/features/${id}`,
    payload,
    langConfig(lang),
  );
  return res.data;
};

export const deleteLandingFeature = async (id, lang = "en") => {
  const res = await axiosInstance.delete(`/owner/landing-page/features/${id}`, langConfig(lang));
  return res.data;
};

export const getLandingRoles = async (lang = "en") => {
  const res = await axiosInstance.get("/owner/landing-page/roles", langConfig(lang));
  return res.data;
};

export const createLandingRole = async (payload, lang = "en") => {
  const res = await axiosInstance.post("/owner/landing-page/roles", payload, langConfig(lang));
  return res.data;
};

export const updateLandingRole = async (id, payload, lang = "en") => {
  const res = await axiosInstance.put(`/owner/landing-page/roles/${id}`, payload, langConfig(lang));
  return res.data;
};

export const deleteLandingRole = async (id, lang = "en") => {
  const res = await axiosInstance.delete(`/owner/landing-page/roles/${id}`, langConfig(lang));
  return res.data;
};
export const getLandingPlans = async (lang = "en") => {
  const res = await axiosInstance.get("/owner/landing-page/plans", langConfig(lang));
  return res.data;
};

export const createLandingPlan = async (payload, lang = "en") => {
  const res = await axiosInstance.post("/owner/landing-page/plans", payload, langConfig(lang));
  return res.data;
};

export const updateLandingPlan = async (id, payload, lang = "en") => {
  const res = await axiosInstance.put(`/owner/landing-page/plans/${id}`, payload, langConfig(lang));
  return res.data;
};

export const deleteLandingPlan = async (id, lang = "en") => {
  const res = await axiosInstance.delete(`/owner/landing-page/plans/${id}`, langConfig(lang));
  return res.data;
};