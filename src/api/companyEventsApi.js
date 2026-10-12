import axiosInstance from "../utils/axiosInstance";

/**
 * GET /api/company-events
 * Get all company events
 * Allowed for Owner, HR, Manager, Employee
 *
 * Parameters:
 * @param {Object} [params]
 * @param {string} [params.lang] - Language ("en" | "ar")
 *
 * Successful response:
 * {
 *   "success": true,
 *   "message": "Company events retrieved successfully.",
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "Company Annual Meeting",
 *       "start_date": "2026-10-15",
 *       "end_date": "2026-10-15",
 *       "description": "Annual company meeting",
 *       "is_active": true,
 *       "created_by": 1,
 *       "created_at": "2026-09-26T08:00:00.000000Z",
 *       "updated_at": "2026-09-26T08:00:00.000000Z",
 *       "creator": { "id": 1, "name": "Admin User" }
 *     }
 *   ]
 * }
 */
export const getCompanyEvents = async (params = {}) => {
  const response = await axiosInstance.get("/company-events", {
    params,
  });
  return response.data;
};

/**
 * POST /api/company-events
 * Create a new company event
 * Allowed for HR, Owner
 *
 * @param {Object} eventData
 * @param {string} eventData.name - Event title
 * @param {string} eventData.start_date - YYYY-MM-DD
 * @param {string} eventData.end_date - YYYY-MM-DD
 * @param {string} [eventData.description] - Event details
 * @param {boolean} [eventData.is_active] - Active status
 * @param {Object} [params] - e.g. { lang: "ar" }
 */
export const createCompanyEvent = async (eventData, params = {}) => {
  const response = await axiosInstance.post("/company-events", eventData, {
    params,
  });
  return response.data;
};

/**
 * PUT /api/company-events/{companyEvent}
 * Update a company event
 * Allowed for HR, Owner
 *
 * @param {Object} payload
 * @param {number|string} payload.id - Event ID
 * @param {string} [payload.name]
 * @param {string} [payload.start_date]
 * @param {string} [payload.end_date]
 * @param {string} [payload.description]
 * @param {boolean} [payload.is_active]
 * @param {Object} [params]
 */
export const updateCompanyEvent = async ({ id, ...eventData }, params = {}) => {
  const response = await axiosInstance.put(`/company-events/${id}`, eventData, {
    params,
  });
  return response.data;
};

/**
 * DELETE /api/company-events/{companyEvent}
 * Delete a company event
 * Allowed for HR, Owner
 *
 * @param {number|string} id - Event ID
 * @param {Object} [params]
 */
export const deleteCompanyEvent = async (id, params = {}) => {
  const response = await axiosInstance.delete(`/company-events/${id}`, {
    params,
  });
  return response.data;
};

export default {
  getCompanyEvents,
  createCompanyEvent,
  updateCompanyEvent,
  deleteCompanyEvent,
};
