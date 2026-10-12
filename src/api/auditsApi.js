import axiosInstance from "../utils/axiosInstance";

/**
 * GET /api/audits
 * Get audit logs
 * Allowed for HR, Owner
 *
 * Parameters:
 * @param {Object} [params]
 * @param {string} [params.lang] - Language ("en" | "ar")
 *
 * Successful response format:
 * {
 *   "success": true,
 *   "message": "Audit logs retrieved successfully.",
 *   "data": [
 *     {
 *       "id": 1,
 *       "action": "leave_created",
 *       "entity_type": "App\\Models\\LeaveRequest",
 *       "entity_id": 5,
 *       "user_id": 2,
 *       "old_values": null,
 *       "new_values": { "status": "pending" },
 *       "created_at": "2026-10-03T09:19:18.000000Z"
 *     }
 *   ]
 * }
 */
export const getAuditLogs = async (params = {}) => {
  const response = await axiosInstance.get("/audits", {
    params,
  });

  return response.data;
};

export default {
  getAuditLogs,
};
