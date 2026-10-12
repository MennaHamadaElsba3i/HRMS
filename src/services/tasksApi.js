import axiosInstance from "../utils/axiosInstance";

/**
 * Tasks API Service
 * Covers all Task endpoints according to Swagger Documentation:
 * 1. GET   /api/tasks                  - Get all tasks (Owner, HR, Manager, Employee)
 * 2. POST  /api/tasks                  - Create a new task (Manager, HR, Owner)
 * 3. GET   /api/tasks/{task}           - Get task details (Owner, HR, Manager, Employee)
 * 4. PUT   /api/tasks/{task}           - Update a task (Manager, HR, Owner)
 * 5. POST  /api/tasks/{task}/assign     - Assign task to employee (Manager, HR, Owner)
 * 6. GET   /api/tasks/{task}/activities- Get task activity history (Owner, HR, Manager, Employee)
 * 7. PATCH /api/tasks/{task}/progress   - Update task progress (Owner, HR, Manager, Employee)
 * 8. PATCH /api/tasks/{task}/status     - Update task status (Owner, HR, Manager, Employee)
 */

/**
 * 1. Get all tasks
 * GET /api/tasks
 * @param {Object} [params]
 * @param {string} [params.status] - Pending, In Progress, Completed, Closed
 * @param {string} [params.priority] - Low, Medium, High, Urgent
 * @param {string} [params.deadline_from] - YYYY-MM-DD
 * @param {string} [params.deadline_to] - YYYY-MM-DD
 * @param {number} [params.per_page] - 1 to 100 (default 15)
 * @param {number} [params.page] - Page number (default 1)
 * @param {string} [params.lang] - en, ar
 */
export const getTasks = async (params = {}) => {
  const query = {};
  if (params.status) query.status = params.status;
  if (params.priority) query.priority = params.priority;
  if (params.deadline_from) query.deadline_from = params.deadline_from;
  if (params.deadline_to) query.deadline_to = params.deadline_to;
  if (params.per_page) query.per_page = params.per_page;
  if (params.page) query.page = params.page;
  if (params.lang) query.lang = params.lang;

  const response = await axiosInstance.get("/tasks", { params: query });
  return response.data;
};

/**
 * 2. Create a new task
 * POST /api/tasks
 * Allowed for Manager, HR, Owner
 * @param {Object} data - { title: string, description?: string, priority: string, deadline: string }
 * @param {Object} [options] - { lang?: string }
 */
export const createTask = async (data, { lang } = {}) => {
  const response = await axiosInstance.post("/tasks", data, {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

/**
 * 3. Get task details
 * GET /api/tasks/{task}
 * Allowed for Owner, HR, Manager, Employee
 * @param {number|string} taskId
 * @param {Object} [options] - { lang?: string }
 */
export const getTaskDetails = async (taskId, { lang } = {}) => {
  const response = await axiosInstance.get(`/tasks/${taskId}`, {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

/**
 * 4. Update a task
 * PUT /api/tasks/{task}
 * Allowed for Manager, HR, Owner
 * @param {number|string} taskId
 * @param {Object} data - { title: string, description?: string, priority: string, deadline: string }
 * @param {Object} [options] - { lang?: string }
 */
export const updateTask = async (taskId, data, { lang } = {}) => {
  const response = await axiosInstance.put(`/tasks/${taskId}`, data, {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

/**
 * 5. Assign a task to an employee
 * POST /api/tasks/{task}/assign
 * Allowed for Manager, HR, Owner
 * @param {number|string} taskId
 * @param {Object} data - { user_id: number }
 * @param {Object} [options] - { lang?: string }
 */
export const assignTask = async (taskId, data, { lang } = {}) => {
  const response = await axiosInstance.post(`/tasks/${taskId}/assign`, data, {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

/**
 * 6. Get task activity history
 * GET /api/tasks/{task}/activities
 * Allowed for Owner, HR, Manager, Employee
 * @param {number|string} taskId
 * @param {Object} [options] - { lang?: string }
 */
export const getTaskActivities = async (taskId, { lang } = {}) => {
  const response = await axiosInstance.get(`/tasks/${taskId}/activities`, {
    params: lang ? { lang } : undefined,
  });
  return response.data;
};

/**
 * 7. Update task progress
 * PATCH /api/tasks/{task}/progress
 * Allowed for Owner, HR, Manager, Employee
 * @param {number|string} taskId
 * @param {Object} data - { progress: number } (0 - 100)
 * @param {Object} [options] - { lang?: string }
 */
export const updateTaskProgress = async (taskId, { progress }, { lang } = {}) => {
  const response = await axiosInstance.patch(
    `/tasks/${taskId}/progress`,
    { progress: Number(progress) },
    {
      params: lang ? { lang } : undefined,
    }
  );
  return response.data;
};

/**
 * 8. Update task status
 * PATCH /api/tasks/{task}/status
 * Allowed for Owner, HR, Manager, Employee
 * @param {number|string} taskId
 * @param {Object} data - { status: "Pending" | "In Progress" | "Completed" | "Closed" }
 * @param {Object} [options] - { lang?: string }
 */
export const updateTaskStatus = async (taskId, { status }, { lang } = {}) => {
  const response = await axiosInstance.patch(
    `/tasks/${taskId}/status`,
    { status },
    {
      params: lang ? { lang } : undefined,
    }
  );
  return response.data;
};
