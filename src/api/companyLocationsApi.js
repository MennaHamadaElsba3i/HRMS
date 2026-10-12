import axiosInstance from "../utils/axiosInstance";

const BASE = "/locations/company/location";

/**
 * GET /api/locations/company/location/active
 * Get the single active company location.
 * Allowed for: Owner, HR, Manager, Employee 📱
 */
export const getActiveCompanyLocation = async () => {
  const response = await axiosInstance.get(`${BASE}/active`);
  return response.data;
};

/**
 * POST /api/locations/company/location
 * Create a new company location.
 * Allowed for: HR, Owner
 *
 * @param {{ name: string, latitude: number, longitude: number, radius: number, is_active: boolean }} body
 */
export const createCompanyLocation = async (body) => {
  const response = await axiosInstance.post(BASE, body);
  return response.data;
};

/**
 * PUT /api/locations/company/location/{id}
 * Update an existing company location.
 * Allowed for: HR, Owner
 *
 * @param {number} id
 * @param {{ name?: string, latitude?: number, longitude?: number, radius?: number, is_active?: boolean }} body
 */
export const updateCompanyLocation = async (id, body) => {
  const response = await axiosInstance.put(`${BASE}/${id}`, body);
  return response.data;
};

/**
 * PATCH /api/locations/company/location/{id}/deactivate
 * Deactivate a company location.
 * Allowed for: HR, Owner
 *
 * @param {number} id
 */
export const deactivateCompanyLocation = async (id) => {
  const response = await axiosInstance.patch(`${BASE}/${id}/deactivate`);
  return response.data;
};

/**
 * PATCH /api/locations/company/location/{id}/activate
 * Activate a company location.
 * Allowed for: HR, Owner
 *
 * @param {number} id
 */
export const activateCompanyLocation = async (id) => {
  const response = await axiosInstance.patch(`${BASE}/${id}/activate`);
  return response.data;
};

export default {
  getActiveCompanyLocation,
  createCompanyLocation,
  updateCompanyLocation,
  deactivateCompanyLocation,
  activateCompanyLocation,
};
