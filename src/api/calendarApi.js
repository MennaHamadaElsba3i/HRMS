import axiosInstance from "../utils/axiosInstance";

/**
 * GET /api/calendar
 * Get calendar events
 * Allowed for Owner, HR, Manager, Employee
 *
 * Parameters:
 * @param {Object} params
 * @param {string} params.from - Start date (YYYY-MM-DD), e.g. "2026-09-01"
 * @param {string} params.to   - End date (YYYY-MM-DD), e.g. "2026-09-30" (must be >= from)
 * @param {string} [params.lang] - Language ("en" | "ar")
 *
 * Successful response format:
 * {
 *   "success": true,
 *   "message": "Calendar events retrieved successfully.",
 *   "data": [
 *     { "date": "2026-09-05", "type": "leave", "reference": 1 },
 *     { "date": "2026-09-10", "type": "task_deadline", "reference": 15 },
 *     { "date": "2026-09-15", "type": "holiday", "reference": 2 },
 *     { "date": "2026-09-20", "type": "company_event", "reference": 3 }
 *   ]
 * }
 */
export const getCalendarEvents = async ({ from, to, lang } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (lang) params.lang = lang;

  const response = await axiosInstance.get("/calendar", {
    params,
  });

  return response.data;
};

export default {
  getCalendarEvents,
};
