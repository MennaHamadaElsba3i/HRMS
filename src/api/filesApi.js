import axiosInstance from "../utils/axiosInstance";

/**
 * GET /api/files/{file}/download
 * Download a specific file securely via permissions or policy.
 * Allowed for: All authorized roles 📱
 *
 * @param {number|string} fileId  ID of the file record
 */
export const downloadFile = async (fileId) => {
  const response = await axiosInstance.get(`/files/${fileId}/download`, {
    responseType: "blob",
  });
  return response.data;
};

/**
 * DELETE /api/files/{file}
 * Delete a specific file from storage and database.
 * Allowed for: All authorized roles 📱
 *
 * @param {number|string} fileId  ID of the file record
 */
export const deleteFile = async (fileId) => {
  const response = await axiosInstance.delete(`/files/${fileId}`);
  return response.data;
};

export default {
  downloadFile,
  deleteFile,
};
