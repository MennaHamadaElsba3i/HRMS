import axiosInstance from "../utils/axiosInstance";

/**
 * DELETE /api/employees/{id}
 * Allowed for Owner, HR, Manager (not Employee)
 * Errors: 401 Unauthenticated | 403 cannot delete own account
 *         404 Employee not found | 500 Failed to delete employee
 */
export const deleteEmployee = async (id, lang = "en") => {
  const response = await axiosInstance.delete(`/employees/${id}`, {
    headers: { "Accept-Language": lang },
  });
  return response.data;
};