import axiosInstance from "../../../utils/axiosInstance";

// =====================================================
// GET EMPLOYEES
// Supports Arabic / English
// =====================================================
export const getEmployees = async (params = {}) => {
  const { lang, ...filters } = params;

  const response = await axiosInstance.get("/employees", {
    params: filters,
    headers: lang ? { "Accept-Language": lang } : undefined,
  });

  return response.data;
};

// =====================================================
// CREATE EMPLOYEE
// Supports Arabic / English
// =====================================================
export const createEmployee = async (employeeData, lang = "en") => {
  const response = await axiosInstance.post("/employees", employeeData, {
    params: { lang },
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

// =====================================================
// GET PERMISSIONS
// Supports Arabic / English
// =====================================================
export const getPermissions = async (lang = "en") => {
  const response = await axiosInstance.get("/permissions", {
    params: { lang },
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

// =====================================================
// UPDATE EMPLOYEE HR FIELDS
// PATCH /employees/{id}/hr-fields
// =====================================================
export const updateEmployeeHRFields = async (id, employeeData, lang = "en") => {
  const response = await axiosInstance.patch(
    `/employees/${id}/hr-fields`,
    employeeData,
    {
      headers: {
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};

// =====================================================
// CHANGE EMPLOYEE ACCOUNT STATUS
// PATCH /employees/{id}/change-account-status
// =====================================================
export const changeEmployeeAccountStatus = async (id, lang = "en") => {
  const response = await axiosInstance.patch(
    `/employees/${id}/change-account-status`,
    undefined,
    {
      headers: {
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};

// =====================================================
// GET EMPLOYEE BY ID
// GET /employees/{id}
// =====================================================
export const getEmployeeById = async (id, lang = "en") => {
  if (!id) {
    throw new Error("Employee ID is required");
  }

  const response = await axiosInstance.get(`/employees/${id}`, {
    params: { lang },
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data?.data || response.data;
};

// =====================================================
// HR GOALS
// =====================================================

// GET HR COMPANY GOALS
// GET /hr/goals
//
// Supported params:
// status
// department_id
// employee_id
// page
// per_page
export const getHrGoals = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/hr/goals", {
    params: {
      ...params,
      lang,
    },
    headers: {
      Accept: "application/json",
      "Accept-Language": lang,
    },
  });

  return response.data;
};

// =====================================================
// CREATE GOAL
// POST /goals
// Owner / HR / Manager
// =====================================================
export const createGoal = async (goalData, lang = "en") => {
  const response = await axiosInstance.post("/goals", goalData, {
    params: {
      lang,
    },
    headers: {
      Accept: "application/json",
      "Accept-Language": lang,
    },
  });

  return response.data;
};

// =====================================================
// UPDATE GOAL
// PUT /goals/{id}
// Owner / HR / Manager
// =====================================================
export const updateGoal = async (id, goalData, lang = "en") => {
  if (!id) {
    throw new Error("Goal ID is required");
  }

  const response = await axiosInstance.put(`/goals/${id}`, goalData, {
    params: {
      lang,
    },
    headers: {
      Accept: "application/json",
      "Accept-Language": lang,
    },
  });

  return response.data;
};

// =====================================================
// ALIASES
// ALIASES FOR COMPATIBILITY
// =====================================================
export const updateEmployeeHrFields = updateEmployeeHRFields;

// =====================================================
// HR FINANCIALS
// =====================================================

/**
 * GET /api/financial/advances
 * List salary advance requests (HR / Owner / All Roles)
 */
export const getFinancialAdvances = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/financial/advances", {
    params,
    headers: {
      Accept: "application/json",
      "Accept-Language": lang,
    },
  });

  return response.data;
};

// 3. BONUSES
export const getFinancialBonuses = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/financial/bonuses", {
    params,
    headers: {
      Accept: "application/json",
      "Accept-Language": lang,
    },
  });
  return response.data;
};

export const createFinancialBonus = async (bonusData, lang = "en") => {
  const response = await axiosInstance.post("/financial/bonuses", bonusData, {
    params: { lang },
    headers: {
      Accept: "application/json",
      "Accept-Language": lang,
    },
  });
  return response.data;
};

// =====================================================
// DEPARTMENTS
// =====================================================

// GET DEPARTMENTS
// Supports Arabic / English
export const getDepartments = async (lang = "en", params = {}) => {
  const response = await axiosInstance.get("/departments", {
    params,
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

// CREATE DEPARTMENT
export const createDepartment = async (departmentData, lang = "en") => {
  const response = await axiosInstance.post("/departments", departmentData, {
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

// UPDATE DEPARTMENT
// PATCH /departments/{id} (Owner / HR only)
export const updateDepartment = async (id, departmentData, lang = "en") => {
  const response = await axiosInstance.patch(
    `/departments/${id}`,
    departmentData,
    {
      headers: {
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};

// TOGGLE DEPARTMENT STATUS
// PATCH /departments/{id}/change-status (Owner / HR only)
export const changeDepartmentStatus = async (id, lang = "en") => {
  const response = await axiosInstance.patch(
    `/departments/${id}/change-status`,
    undefined,
    {
      headers: {
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};

// GET DEPARTMENT MANAGERS
export const getDepartmentManagers = async (lang = "en") => {
  const response = await axiosInstance.get("/departments/managers-dropdown", {
    params: { lang },
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

// =====================================================
// FINANCIAL ADVANCES STATUS
// =====================================================

/**
 * PUT /api/financial/advances/{advance}/status
 * Update salary advance request status (HR / Owner)
 *
 * @param {number|string} advanceId
 * @param {string} status 'approved' | 'rejected'
 * @param {string} lang
 */
export const updateAdvanceStatus = async (advanceId, status, lang = "en") => {
  if (!advanceId) {
    throw new Error("Advance ID is required");
  }

  const response = await axiosInstance.put(
    `/financial/advances/${advanceId}/status`,
    { status },
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};

// =====================================================
// LEAVE REQUESTS
// =====================================================

// GET HR PENDING LEAVE REQUESTS
export const getHrPendingLeaveRequests = async (lang = "en") => {
  const response = await axiosInstance.get(
    "/leaves/leave-requests/hr/pending",
    {
      params: { lang },
      headers: {
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};

// APPROVE LEAVE REQUEST
export const approveLeaveRequest = async (id, lang = "en") => {
  const response = await axiosInstance.patch(
    `/leaves/leave-requests/${id}/approve`,
    undefined,
    {
      params: { lang },
      headers: {
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};

// REJECT LEAVE REQUEST
export const rejectLeaveRequest = async (id, rejectionReason, lang = "en") => {
  const response = await axiosInstance.patch(
    `/leaves/leave-requests/${id}/reject`,
    {
      rejection_reason: rejectionReason,
    },
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
// FINANCIAL DEDUCTIONS
// =====================================================

/**
 * GET /api/financial/deductions
 * List deductions and penalties (HR / Owner / All Roles)
 */
export const getFinancialDeductions = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/financial/deductions", {
    params,
    headers: {
      Accept: "application/json",
      "Accept-Language": lang,
    },
  });

  return response.data;
};

export const createFinancialDeduction = async (data, lang = "en") => {
  const response = await axiosInstance.post("/financial/deductions", data, {
    headers: {
      Accept: "application/json",
      "Accept-Language": lang,
    },
  });
  return response.data;
};

// =====================================================
// FINANCIAL BONUSES
// =====================================================

// =====================================================
// FINANCIAL PAYROLL
// =====================================================

/**
 * GET /api/financial/payroll
 * Calculates or retrieves company payroll for a given month
 * Owner / HR
 *
 * @param {Object} params - { month_year, page, per_page }
 * @param {string} lang - 'ar' | 'en'
 */
export const getFinancialPayroll = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/financial/payroll", {
    params,
    headers: {
      Accept: "application/json",
      "Accept-Language": lang,
    },
  });

  return response.data;
};

/**
 * POST /api/financial/payroll/finalize
 * Finalize and close monthly payroll (Owner / HR)
 *
 * @param {Object} data - { month_year }
 * @param {string} lang - 'ar' | 'en'
 */
export const finalizeFinancialPayroll = async (data = {}, lang = "en") => {
  const response = await axiosInstance.post(
    "/financial/payroll/finalize",
    data,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": lang,
      },
    },
  );

  return response.data;
};

/**
 * GET /api/financial/payroll/{payroll}/payslip
 * Download employee payslip PDF (Owner / HR)
 *
 * @param {number|string} payrollId
 * @param {string} lang - 'ar' | 'en'
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

// =====================================================
// ATTENDANCE
// =====================================================

// GET HR DAILY ATTENDANCE
// GET /hr/attendance/daily
// HR / Owner only
export const getHrDailyAttendance = async ({
  date,
  departmentId,
  managerId,
  status,
  search,
  perPage = 15,
  page = 1,
}) => {
  const response = await axiosInstance.get("/hr/attendance/daily", {
    params: {
      date,
      department_id: departmentId,
      manager_id: managerId,
      status,
      search,
      per_page: perPage,
      page,
    },
  });

  return response.data;
};

// GET HR ATTENDANCE EXCEPTIONS
// GET /hr/attendance/exceptions
// HR / Owner only
export const getHrAttendanceExceptions = async ({
  date,
  departmentId,
  perPage = 15,
  page = 1,
}) => {
  const response = await axiosInstance.get("/hr/attendance/exceptions", {
    params: {
      date,
      department_id: departmentId,
      per_page: perPage,
      page,
    },
  });

  return response.data;
};

// GET HR MONTHLY ATTENDANCE SUMMARY
// GET /hr/attendance/monthly-summary
// HR / Owner only
export const getHrMonthlySummary = async ({
  month,
  year,
  departmentId,
  search,
  perPage = 15,
  page = 1,
}) => {
  const response = await axiosInstance.get("/hr/attendance/monthly-summary", {
    params: {
      month,
      year,
      department_id: departmentId || undefined,
      search: search || undefined,
      per_page: perPage,
      page,
    },
  });

  return response.data;
};

// EXPORT HR MONTHLY ATTENDANCE SUMMARY (Excel)
// GET /hr/attendance/export
// HR / Owner only
// Returns a binary Excel file — triggers download
export const exportHrMonthlySummary = async ({
  month,
  year,
  departmentId,
  search,
  perPage,
}) => {
  const response = await axiosInstance.get("/hr/attendance/export", {
    params: {
      month,
      year,
      department_id: departmentId || undefined,
      search: search || undefined,
      per_page: perPage || undefined,
    },
    responseType: "blob",
  });

  // Build a filename from Content-Disposition or a default
  const disposition = response.headers?.["content-disposition"] || "";

  let filename = `attendance-${year}-${String(month).padStart(2, "0")}.xlsx`;

  const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]+)\1/);

  if (match?.[2]) {
    filename = match[2].trim();
  }

  // Trigger browser download
  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  return { success: true, filename };
};

// UPDATE ATTENDANCE EXCEPTION STATUS
// PATCH /hr/attendance/exceptions/{attendanceId}
// HR / Owner only
// Body: { status: "approved" | "rejected", admin_note?: string }
export const updateAttendanceExceptionStatus = async ({
  attendanceId,
  status,
  adminNote,
}) => {
  const response = await axiosInstance.patch(
    `/hr/attendance/exceptions/${attendanceId}`,
    {
      status,
      ...(adminNote ? { admin_note: adminNote } : {}),
    },
  );

  return response.data;
};

// =====================================================
// HR DASHBOARD
// GET /hr/dashboard
// Header: App-Language (ar | en)
// =====================================================
export const getHrDashboard = async (params = {}, lang = "en") => {
  const response = await axiosInstance.get("/hr/dashboard", {
    params,
    headers: {
      Accept: "application/json",
      "App-Language": lang,
      "Accept-Language": lang,
    },
  });

  return response.data;
};
// HOLIDAYS
// =====================================================

// GET /holidays
export const getHolidays = async (params = {}) => {
  const response = await axiosInstance.get("/holidays", {
    params,
  });

  return response.data;
};

// POST /holidays
// Allowed for HR, Owner
export const createHoliday = async (holidayData) => {
  const response = await axiosInstance.post("/holidays", holidayData);
  return response.data;
};
