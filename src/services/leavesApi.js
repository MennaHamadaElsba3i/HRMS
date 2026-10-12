import axiosInstance from "../utils/axiosInstance";

/**
 * Leaves API Service
 * Covers all Leave endpoints per Swagger Documentation:
 *
 * Leave Types:
 *  1. POST  /api/leaves/leave-types              - Create leave type (Owner, HR, Manager, Employee)
 *  2. GET   /api/leaves/leave-types              - Get all leave types (Owner, HR, Manager, Employee)
 *  3. PUT   /api/leaves/leave-types/{id}         - Update leave type (Owner, HR, Manager, Employee)
 *  4. PATCH /api/leaves/leave-types/{id}/activate   - Activate leave type (Owner, HR)
 *  5. PATCH /api/leaves/leave-types/{id}/deactivate - Deactivate leave type (Owner, HR)
 *
 * Leave Balances:
 *  6. GET   /api/leaves/leave-balances           - Get my leave balances (All)
 *
 * Leave Requests:
 *  7. POST  /api/leaves/leave-requests                     - Create leave request (All)
 *  8. GET   /api/leaves/leave-requests                     - Get leave request history (All)
 *  9. GET   /api/leaves/leave-requests/{id}                - Get leave request details
 * 10. GET   /api/leaves/leave-requests/manager/pending     - Manager pending requests
 * 11. GET   /api/leaves/leave-requests/hr/pending          - HR pending requests
 * 12. PATCH /api/leaves/leave-requests/{id}/approve        - Approve request (Owner, HR, Manager)
 * 13. PATCH /api/leaves/leave-requests/{id}/reject         - Reject request (Owner, HR)
 * 14. POST  /api/leaves/leave-requests/{id}/attachments    - Upload attachment
 */

// ─────────────────────────────────────────────
// LEAVE TYPES
// ─────────────────────────────────────────────

/**
 * 1. Get all leave types
 * GET /api/leaves/leave-types
 * @param {Object} [options] - { lang?: 'en'|'ar' }
 */
export const getLeaveTypes = async ({ lang } = {}) => {
  const response = await axiosInstance.get("/leaves/leave-types", {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

/**
 * 2. Create a new leave type
 * POST /api/leaves/leave-types
 * @param {Object} data - { name: string, days_allowed: number, requires_balance?: boolean }
 * @param {Object} [options] - { lang?: string }
 */
export const createLeaveType = async (data, { lang } = {}) => {
  const response = await axiosInstance.post("/leaves/leave-types", data, {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

/**
 * 3. Update a leave type
 * PUT /api/leaves/leave-types/{leaveType}
 * @param {number|string} leaveTypeId
 * @param {Object} data - { name: string, days_allowed: number, requires_balance?: boolean }
 * @param {Object} [options] - { lang?: string }
 */
export const updateLeaveType = async (leaveTypeId, data, { lang } = {}) => {
  const response = await axiosInstance.put(
    `/leaves/leave-types/${leaveTypeId}`,
    data,
    { params: lang ? { lang } : undefined }
  );
  return response.data;
};

/**
 * 4. Activate a leave type
 * PATCH /api/leaves/leave-types/{leaveType}/activate
 * Allowed: Owner, HR
 * @param {number|string} leaveTypeId
 * @param {Object} [options] - { lang?: string }
 */
export const activateLeaveType = async (leaveTypeId, { lang } = {}) => {
  const response = await axiosInstance.patch(
    `/leaves/leave-types/${leaveTypeId}/activate`,
    undefined,
    { params: lang ? { lang } : undefined }
  );
  return response.data;
};

/**
 * 5. Deactivate a leave type
 * PATCH /api/leaves/leave-types/{leaveType}/deactivate
 * Allowed: Owner, HR
 * @param {number|string} leaveTypeId
 * @param {Object} [options] - { lang?: string }
 */
export const deactivateLeaveType = async (leaveTypeId, { lang } = {}) => {
  const response = await axiosInstance.patch(
    `/leaves/leave-types/${leaveTypeId}/deactivate`,
    undefined,
    { params: lang ? { lang } : undefined }
  );
  return response.data;
};

// ─────────────────────────────────────────────
// LEAVE BALANCES
// ─────────────────────────────────────────────

/**
 * 6. Get my leave balances
 * GET /api/leaves/leave-balances
 * Allowed: Owner, HR, Manager, Employee
 * @param {Object} [options] - { year?: number, lang?: string }
 */
export const getLeaveBalances = async ({ year, lang } = {}) => {
  const params = {};
  if (year) params.year = year;
  if (lang) params.lang = lang;
  const response = await axiosInstance.get("/leaves/leave-balances", {
    params: Object.keys(params).length ? params : undefined,
  });
  return response.data;
};

// ─────────────────────────────────────────────
// LEAVE REQUESTS
// ─────────────────────────────────────────────

/**
 * 7. Create a new leave request
 * POST /api/leaves/leave-requests
 * Allowed: Owner, HR, Manager, Employee
 * @param {Object} data - { leave_type_id, start_date, end_date, reason }
 * @param {Object} [options] - { lang?: string }
 */
export const createLeaveRequest = async (data, { lang } = {}) => {
  const response = await axiosInstance.post("/leaves/leave-requests", data, {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

/**
 * 8. Get leave request history (own)
 * GET /api/leaves/leave-requests
 * Allowed: Owner, HR, Manager, Employee
 * @param {Object} [options] - { year?: number, lang?: string }
 */
export const getLeaveRequestHistory = async ({ year, lang } = {}) => {
  const params = {};
  if (year) params.year = year;
  if (lang) params.lang = lang;
  const response = await axiosInstance.get("/leaves/leave-requests", {
    params: Object.keys(params).length ? params : undefined,
  });
  return response.data;
};

/**
 * 9. Get leave request details
 * GET /api/leaves/leave-requests/{leaveRequest}
 * @param {number|string} leaveRequestId
 * @param {Object} [options] - { lang?: string }
 */
export const getLeaveRequestDetails = async (leaveRequestId, { lang } = {}) => {
  const response = await axiosInstance.get(
    `/leaves/leave-requests/${leaveRequestId}`,
    { params: lang ? { lang } : undefined }
  );
  return response.data;
};

/**
 * 10. Get manager pending leave requests
 * GET /api/leaves/leave-requests/manager/pending
 * @param {Object} [options] - { lang?: string }
 */
export const getManagerPendingLeaveRequests = async ({ lang } = {}) => {
  const response = await axiosInstance.get(
    "/leaves/leave-requests/manager/pending",
    { params: lang ? { lang } : undefined }
  );
  return response.data;
};

/**
 * 11. Get HR pending leave requests
 * GET /api/leaves/leave-requests/hr/pending
 * @param {Object} [options] - { lang?: string }
 */
export const getHrPendingLeaveRequestsAll = async ({ lang } = {}) => {
  const response = await axiosInstance.get(
    "/leaves/leave-requests/hr/pending",
    { params: lang ? { lang } : undefined }
  );
  return response.data;
};

/**
 * 12. Approve a leave request
 * PATCH /api/leaves/leave-requests/{leaveRequest}/approve
 * Allowed: Owner, HR, Manager
 * @param {number|string} leaveRequestId
 * @param {Object} [options] - { lang?: string }
 */
export const approveLeaveRequest = async (leaveRequestId, { lang } = {}) => {
  const response = await axiosInstance.patch(
    `/leaves/leave-requests/${leaveRequestId}/approve`,
    undefined,
    { params: lang ? { lang } : undefined }
  );
  return response.data;
};

/**
 * 13. Reject a leave request
 * PATCH /api/leaves/leave-requests/{leaveRequest}/reject
 * Allowed: Owner, HR
 * @param {number|string} leaveRequestId
 * @param {Object} data - { rejection_reason: string }
 * @param {Object} [options] - { lang?: string }
 */
export const rejectLeaveRequest = async (
  leaveRequestId,
  { rejection_reason },
  { lang } = {}
) => {
  const response = await axiosInstance.patch(
    `/leaves/leave-requests/${leaveRequestId}/reject`,
    { rejection_reason },
    { params: lang ? { lang } : undefined }
  );
  return response.data;
};

/**
 * 14. Upload leave request attachment
 * POST /api/leaves/leave-requests/{leaveRequest}/attachments
 * @param {number|string} leaveRequestId
 * @param {File} file
 * @param {Object} [options] - { lang?: string }
 */
export const uploadLeaveRequestAttachment = async (
  leaveRequestId,
  file,
  { lang } = {}
) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post(
    `/leaves/leave-requests/${leaveRequestId}/attachments`,
    formData,
    { params: lang ? { lang } : undefined }
  );
  return response.data;
};
