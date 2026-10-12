import axiosInstance from "../utils/axiosInstance";

/**
 * Task Submissions API
 * Covers all 8 endpoints from the Swagger documentation:
 * 1. POST  /api/tasks/{task}/submissions               - Submit a task (Employee, Manager, HR, Owner)
 * 2. POST  /api/tasks/submissions/{submission}/attachments - Attach file to task submission (Employee, Manager, HR, Owner)
 * 3. GET   /api/tasks/submissions/review              - Get submission review queue (Manager, HR, Owner)
 * 4. GET   /api/tasks/submissions/{submission}        - View a task submission (Employee, Manager, HR, Owner)
 * 5. PATCH /api/tasks/submissions/{submission}/approve - Approve submission (Manager, HR, Owner)
 * 6. PATCH /api/tasks/submissions/{submission}/reject  - Reject submission with feedback (Manager, HR, Owner)
 * 7. PATCH /api/tasks/submissions/{submission}/request-changes - Request changes with feedback (Manager, HR, Owner)
 * 8. POST  /api/tasks/submissions/{submission}/resubmit - Resubmit after changes requested (Employee, Manager, HR, Owner)
 */

/**
 * 1. Submit a task
 * POST /api/tasks/{task}/submissions
 * @param {number|string} taskId
 * @param {Object} data { note: string, files?: File[] | FileList | File }
 * @param {Object} [options] { lang?: string }
 */
export const submitTask = async (taskId, { note, files } = {}, { lang } = {}) => {
  const formData = new FormData();
  formData.append("note", note || "");

  if (files) {
    let fileList = [];
    if (Array.isArray(files)) {
      fileList = files.filter(Boolean);
    } else if (typeof FileList !== "undefined" && files instanceof FileList) {
      fileList = Array.from(files);
    } else if (typeof File !== "undefined" && files instanceof File) {
      fileList = [files];
    }

    fileList.forEach((file) => {
      formData.append("files[]", file);
    });

    if (fileList.length === 1) {
      formData.append("file", fileList[0]);
    }
  }

  const response = await axiosInstance.post(`/tasks/${taskId}/submissions`, formData, {
    params: lang ? { lang } : undefined,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/**
 * 2. Attach a file to a submission
 * POST /api/tasks/submissions/{submission}/attachments
 * @param {number|string} submissionId
 * @param {File} file
 * @param {Object} [options] { lang?: string }
 */
export const attachSubmissionFile = async (submissionId, file, { lang } = {}) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post(
    `/tasks/submissions/${submissionId}/attachments`,
    formData,
    {
      params: lang ? { lang } : undefined,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/**
 * 3. Get submission review queue
 * GET /api/tasks/submissions/review
 * @param {Object} [params] { page?: number, per_page?: number, lang?: string }
 */
export const getSubmissionReviewQueue = async ({ page = 1, per_page = 15, lang } = {}) => {
  const response = await axiosInstance.get("/tasks/submissions/review", {
    params: {
      page,
      per_page,
      ...(lang ? { lang } : {}),
    },
  });

  return response.data;
};

/**
 * 4. Get submission details
 * GET /api/tasks/submissions/{submission}
 * @param {number|string} submissionId
 * @param {Object} [options] { lang?: string }
 */
export const getSubmissionDetails = async (submissionId, { lang } = {}) => {
  const response = await axiosInstance.get(`/tasks/submissions/${submissionId}`, {
    params: lang ? { lang } : undefined,
  });

  return response.data;
};

/**
 * 5. Approve a task submission
 * PATCH /api/tasks/submissions/{submission}/approve
 * @param {number|string} submissionId
 * @param {Object} [options] { lang?: string }
 */
export const approveSubmission = async (submissionId, { lang } = {}) => {
  const response = await axiosInstance.patch(
    `/tasks/submissions/${submissionId}/approve`,
    {},
    {
      params: lang ? { lang } : undefined,
    }
  );

  return response.data;
};

/**
 * 6. Reject a task submission
 * PATCH /api/tasks/submissions/{submission}/reject
 * @param {number|string} submissionId
 * @param {Object} data { feedback: string }
 * @param {Object} [options] { lang?: string }
 */
export const rejectSubmission = async (submissionId, { feedback } = {}, { lang } = {}) => {
  const response = await axiosInstance.patch(
    `/tasks/submissions/${submissionId}/reject`,
    { feedback: feedback || "" },
    {
      params: lang ? { lang } : undefined,
    }
  );

  return response.data;
};

/**
 * 7. Request changes to a task submission
 * PATCH /api/tasks/submissions/{submission}/request-changes
 * @param {number|string} submissionId
 * @param {Object} data { feedback: string }
 * @param {Object} [options] { lang?: string }
 */
export const requestSubmissionChanges = async (
  submissionId,
  { feedback } = {},
  { lang } = {}
) => {
  const response = await axiosInstance.patch(
    `/tasks/submissions/${submissionId}/request-changes`,
    { feedback: feedback || "" },
    {
      params: lang ? { lang } : undefined,
    }
  );

  return response.data;
};

/**
 * 8. Resubmit a task after requested changes
 * POST /api/tasks/submissions/{submission}/resubmit
 * @param {number|string} submissionId
 * @param {Object} data { note: string, files?: File[] | FileList | File }
 * @param {Object} [options] { lang?: string }
 */
export const resubmitSubmission = async (
  submissionId,
  { note, files } = {},
  { lang } = {}
) => {
  const response = await axiosInstance.post(
    `/tasks/submissions/${submissionId}/resubmit`,
    { note: note || "" },
    {
      params: lang ? { lang } : undefined,
    }
  );

  // If files are also attached during resubmission, upload them via attachments endpoint
  if (files) {
    let filesArr = [];
    if (Array.isArray(files)) filesArr = files;
    else if (typeof FileList !== "undefined" && files instanceof FileList) {
      filesArr = Array.from(files);
    } else if (typeof File !== "undefined" && files instanceof File) {
      filesArr = [files];
    }

    if (filesArr.length > 0) {
      await Promise.allSettled(
        filesArr.map((f) => attachSubmissionFile(submissionId, f, { lang }))
      );
    }
  }

  return response.data;
};
