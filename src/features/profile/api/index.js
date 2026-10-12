import axiosInstance from "../../../utils/axiosInstance";

/**
 * GET /api/employees/profile or GET /api/employees/{id}
 * Retrieve authenticated employee profile details.
 *
 * @param {string|number|null} [employeeId=null]
 * @param {string} [lang="en"]
 */
export const getProfile = async (employeeId = null, lang = "en") => {
  const endpoint = employeeId ? `/employees/${employeeId}` : `/employees/profile`;

  const response = await axiosInstance.get(endpoint, {
    params: { lang },
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data?.data || response.data;
};

/**
 * POST /api/employees/profile
 * Update authenticated user's profile with FormData support for avatar images.
 * Allowed for: All roles 📱
 *
 * @param {FormData|Object} data  FormData containing name, phone, address, locale, avatar
 * @param {string} [lang="en"]    Language query parameter ("en" | "ar")
 */
export const updateProfile = async (data, lang = "en") => {
  let body = data;

  if (!(data instanceof FormData)) {
    body = new FormData();
    if (data.name || data.fullName) body.append("name", data.name || data.fullName);
    if (data.phone) body.append("phone", data.phone);
    if (data.address) body.append("address", data.address);
    if (data.locale) body.append("locale", data.locale || lang);
    if (data.avatar) body.append("avatar", data.avatar);
  }

  // Ensure Laravel PATCH method simulation for multipart/form-data
  if (body instanceof FormData && !body.has("_method")) {
    body.append("_method", "PATCH");
  }

  const response = await axiosInstance.post(`/employees/profile`, body, {
    params: { lang },
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

export default {
  getProfile,
  updateProfile,
};
