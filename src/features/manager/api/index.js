import axiosInstance from "../../../utils/axiosInstance";

// =====================================================
// GET TEAM GOALS
// GET /api/manager/team-goals
// Manager only
// =====================================================

export const getTeamGoals = async ({
  status = "",
  employee_id = "",
  page = 1,
  per_page = 15,
} = {}) => {
  const params = {
    page,
    per_page,
  };

  if (status) {
    params.status = status;
  }

  if (employee_id) {
    params.employee_id = employee_id;
  }

  const response = await axiosInstance.get("/manager/team-goals", {
    params,
  });

  return response.data;
};

// =====================================================
// GET MANAGER EMPLOYEES
// GET /api/manager/employees
// Manager only
// =====================================================

export const getManagerEmployees = async ({
  search = "",
  status = "",
  department_id = "",
  employment_type = "",
  role = "",
  page = 1,
  per_page = 15,
} = {}) => {
  const params = {
    page,
    per_page,
  };

  if (search) {
    params.search = search;
  }

  if (status) {
    params.status = status;
  }

  if (department_id) {
    params.department_id = department_id;
  }

  if (employment_type) {
    params.employment_type = employment_type;
  }

  if (role) {
    params.role = role;
  }

  const response = await axiosInstance.get("/manager/employees", {
    params,
  });

  return response.data;
};

// =====================================================
// GET MANAGER PENDING LEAVE REQUESTS
// GET /api/leaves/leave-requests/manager/pending
// =====================================================
export const getManagerPendingLeaveRequests = async (lang = "en") => {
  const response = await axiosInstance.get(
    "/leaves/leave-requests/manager/pending",
    {
      params: { lang },
      headers: {
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};

// =====================================================
// CREATE GOAL
// POST /api/goals
// Owner / HR / Manager
// =====================================================

export const createGoal = async (data) => {
  const response = await axiosInstance.post("/goals", data);

  return response.data;
};

// =====================================================
// UPDATE GOAL
// PUT /api/goals/{id}
// Owner / HR / Manager
// =====================================================

export const updateGoal = async (id, data) => {
  const response = await axiosInstance.put(`/goals/${id}`, data);

  return response.data;
};

// =====================================================
// GET MANAGER DASHBOARD
// GET /api/manager/dashboard
// Manager only (permission: manager.dashboard.view)
// Language is sent via the App-Language header (ar | en)
// =====================================================
export const getManagerDashboard = async (lang) => {
  const response = await axiosInstance.get("/manager/dashboard", {
    headers: lang ? { "App-Language": lang } : undefined,
  });

  return response.data;
};

// =====================================================
// GET MANAGER TEAM ATTENDANCE TODAY
// GET /api/manager/attendance/today
// Manager only
// =====================================================
export const getManagerTeamAttendanceToday = async ({
  date = "",
  status = "",
  search = "",
  per_page = 15,
  page = 1,
  lang = "en",
} = {}) => {
  const params = {
    per_page,
    page,
    ...(date ? { date } : {}),
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
    ...(lang ? { lang } : {}),
  };

  const response = await axiosInstance.get("/manager/attendance/today", {
    params,
    headers: lang ? { "Accept-Language": lang } : undefined,
  });

  return response.data;
};

// =====================================================
// GET MANAGER EMPLOYEE ATTENDANCE DETAIL
// GET /api/manager/attendance/{employeeId}
// Manager only
// =====================================================
export const getManagerEmployeeAttendanceDetail = async (
  employeeId,
  { date = "", lang = "en" } = {}
) => {
  const params = {
    ...(date ? { date } : {}),
    ...(lang ? { lang } : {}),
  };

  const response = await axiosInstance.get(
    `/manager/attendance/${employeeId}`,
    {
      params,
      headers: lang ? { "Accept-Language": lang } : undefined,
    }
  );

  return response.data;
};

// =====================================================
// TASK SUBMISSIONS API (Manager / HR / Owner / Employee)
// =====================================================
export * from "../../../services/submissionsApi";

// =====================================================
// TASKS API (Manager / HR / Owner / Employee)
// =====================================================
export * from "../../../services/tasksApi";


