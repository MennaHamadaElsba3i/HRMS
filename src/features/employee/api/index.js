import axiosInstance from "../../../utils/axiosInstance";

/* =========================================================
   GOALS
========================================================= */

/**
 * GET /api/goals
 * List Own Goals (Employee)
 */
export const getGoals = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/goals", {
    params,
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * GET /api/goals/{id}
 * View Own Goal Details (Employee)
 */
export const getGoalDetails = async (id, lang = "en") => {
  const response = await axiosInstance.get(`/goals/${id}`, {
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * PATCH /api/goals/{id}/complete
 * Mark Own Goal as Completed (Employee)
 */
export const markGoalCompleted = async (id, lang = "en") => {
  const response = await axiosInstance.patch(`/goals/${id}/complete`, null, {
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/* =========================================================
   EMPLOYEES
========================================================= */

/**
 * GET /api/employees/{id}
 * Get Employee By ID
 */
export const getEmployeeById = async (id, lang = "en") => {
  if (!id) {
    throw new Error("Employee ID is required");
  }

  const response = await axiosInstance.get(`/employees/${id}`, {
    params: {
      lang,
    },
  });

  return response.data.data;
};

/* =========================================================
   FINANCIALS
========================================================= */

/**
 * GET /api/financial/advances
 * List salary advance requests (All Roles)
 */
export const getAdvances = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/financial/advances", {
    params,
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * POST /api/financial/advances
 * Request a salary advance (All Roles)
 */
export const createAdvance = async (data, lang = "en") => {
  const response = await axiosInstance.post("/financial/advances", data, {
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * GET /api/financial/deductions
 * List deductions and penalties (All Roles)
 */
export const getDeductions = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/financial/deductions", {
    params,
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * POST /api/financial/deductions
 * Record a deduction or penalty (Owner / HR)
 */
export const createDeduction = async (data, lang = "en") => {
  const response = await axiosInstance.post("/financial/deductions", data, {
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * GET /api/financial/bonuses
 * List bonuses and incentives (All Roles)
 */
export const getBonuses = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/financial/bonuses", {
    params,
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * POST /api/financial/bonuses
 * Issue a bonus or incentive (Owner / HR)
 */
export const createBonus = async (data, lang = "en") => {
  const response = await axiosInstance.post("/financial/bonuses", data, {
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * GET /api/financial/my-salaries
 * Retrieve authenticated employee salary history (Employee)
 */
export const getMySalaries = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/financial/my-salaries", {
    params,
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * GET /api/financial/payroll/{payroll}/payslip
 * Download employee payslip PDF
 *
 * @param {number|string} payrollId
 * @param {string} lang
 */
export const downloadFinancialPayslip = async (payrollId, lang = "en") => {
  if (!payrollId) {
    throw new Error("Payroll ID is required");
  }

  const response = await axiosInstance.get(
    `/financial/payroll/${payrollId}/payslip`,
    {
      responseType: "blob",
      headers: {
        Accept: "application/pdf",
        "Accept-Language": lang,
      },
    },
  );

  return response;
};

/* =========================================================
   LEAVE REQUESTS
========================================================= */

/**
 * GET /api/leaves/leave-types
 * Get available employee leave types
 */
export const getEmployeeLeaveTypes = async (lang = "en") => {
  const response = await axiosInstance.get("/leaves/leave-types", {
    params: {
      lang,
    },
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * GET /api/leaves/leave-balances
 * Get employee leave balances
 */
export const getEmployeeLeaveBalances = async (year, lang = "en") => {
  const response = await axiosInstance.get("/leaves/leave-balances", {
    params: {
      lang,
      year,
    },
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * GET /api/leaves/leave-requests
 * Get employee leave requests
 */
export const getEmployeeLeaveRequests = async (year, lang = "en") => {
  const response = await axiosInstance.get("/leaves/leave-requests", {
    params: {
      lang,
      year,
    },
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * POST /api/leaves/leave-requests
 * Create employee leave request
 */
export const createEmployeeLeaveRequest = async (requestData, lang = "en") => {
  const response = await axiosInstance.post(
    "/leaves/leave-requests",
    requestData,
    {
      params: {
        lang,
      },
      headers: {
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};

/**
 * POST /api/leaves/leave-requests/{id}/attachments
 * Upload leave request attachment
 */
export const uploadEmployeeLeaveAttachment = async (
  requestId,
  file,
  lang = "en",
) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axiosInstance.post(
    `/leaves/leave-requests/${requestId}/attachments`,
    formData,
    {
      params: {
        lang,
      },
      headers: {
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};
