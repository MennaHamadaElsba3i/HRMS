import axiosInstance from "../utils/axiosInstance";

/**
 * GET /api/holidays
 * Allowed for Owner, HR, Manager, Employee
 * Response structure:
 * {
 *   success: true,
 *   message: "Holidays retrieved successfully.",
 *   data: [
 *     {
 *       id: number,
 *       name: string,
 *       start_date: string,
 *       end_date: string,
 *       description: string,
 *       is_active: boolean,
 *       created_at: string,
 *       updated_at: string
 *     }
 *   ]
 * }
 */
export const getHolidays = async (params = {}) => {
  const response = await axiosInstance.get("/holidays", {
    params,
  });

  return response.data;
};

/**
 * POST /api/holidays
 * Allowed for HR, Owner
 * Body: { name, start_date, end_date, description?, is_active? }
 * Response: { success: true, message: "Holiday created successfully.", data: { ... } }
 */
export const createHoliday = async (holidayData) => {
  const response = await axiosInstance.post("/holidays", holidayData);
  return response.data;
};

/**
 * PUT /api/holidays/{holiday}
 * Allowed for HR, Owner
 * Body: { name, start_date, end_date, description?, is_active? }
 * Response: { success: true, message: "Holiday updated successfully.", data: { ... } }
 */
export const updateHoliday = async ({ id, ...holidayData }) => {
  const response = await axiosInstance.put(`/holidays/${id}`, holidayData);
  return response.data;
};

/**
 * DELETE /api/holidays/{holiday}
 * Allowed for HR, Owner
 * Response: { success: true, message: "Holiday deleted successfully.", data: null }
 */
export const deleteHoliday = async (id) => {
  const response = await axiosInstance.delete(`/holidays/${id}`);
  return response.data;
};
