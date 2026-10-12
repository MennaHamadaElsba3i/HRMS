import { useMutation, useQueryClient } from "@tanstack/react-query";
import { downloadFile, deleteFile } from "../api/filesApi";

/**
 * Hook for downloading a file securely by ID.
 * Automatically handles blob download triggering in the browser.
 */
export const useDownloadFile = (options = {}) => {
  return useMutation({
    mutationFn: async ({ fileId, filename = "downloaded-file" }) => {
      const blob = await downloadFile(fileId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return blob;
    },
    ...options,
  });
};

/**
 * Hook for deleting a file by ID.
 */
export const useDeleteFile = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId) => deleteFile(fileId),
    onSuccess: (data, fileId) => {
      queryClient.invalidateQueries();
      options.onSuccess?.(data, fileId);
    },
    onError: options.onError,
    ...options,
  });
};

export default {
  useDownloadFile,
  useDeleteFile,
};
