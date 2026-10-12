import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiCalendar,
  FiUploadCloud,
  FiClock,
  FiMoreHorizontal,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiUser,
  FiUserPlus,
  FiFlag,
  FiEdit3,
  FiRefreshCw,
  FiActivity,
  FiFileText,
  FiPaperclip,
  FiExternalLink,
} from "react-icons/fi";
import {
  submitTask,
  attachSubmissionFile,
  resubmitSubmission,
  getSubmissionDetails,
} from "../../../services/submissionsApi";

// =========================
// API CONFIG
// =========================
const getApiRoot = () => {
  const raw = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ""
  ).replace(/\/+$/, "");

  if (!raw) return "/api";
  return raw.endsWith("/api") ? raw : `${raw}/api`;
};

const API_ROOT = getApiRoot();

const ENDPOINT_TASKS = "/tasks";
// GET  /tasks                  → الليستة
// POST /tasks                  → إنشاء
// GET  /tasks/{id}             → تفاصيل
// PUT  /tasks/{id}             → تعديل
// POST /tasks/{id}/assign      → إسناد
// PATCH /tasks/{id}/progress   → تحديث التقدم
// PATCH /tasks/{id}/status     → تغيير الحالة
// GET  /tasks/{id}/activities  → سجل النشاطات (حسب التوثيق)

const buildUrl = (path) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return API_ROOT.endsWith("/api") && cleanPath.startsWith("/api")
    ? `${API_ROOT.replace(/\/api$/, "")}${cleanPath}`
    : `${API_ROOT}${cleanPath}`;
};

const getFileUrl = (filePath) => {
  if (!filePath) return "#";
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("blob:")
  ) {
    return filePath;
  }
  const root = API_ROOT.replace(/\/api\/?$/, "");
  return `${root}/storage/${filePath.replace(/^\/+/, "")}`;
};

// =========================
// Statuses
// =========================
const STATUSES = ["Pending", "In Progress", "Completed", "Closed"];
const normalizeTaskStatus = (status) => {
  const original = String(status || "Pending").trim();
  const normalized = original
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  return STATUSES.find((value) => value.toLowerCase() === normalized) || original;
};

const STATUS_BADGES = {
  Pending: "bg-[#fffaf0] text-[#d97706]",
  "In Progress": "bg-[#eff6ff] text-[#2563eb]",
  Completed: "bg-[#f0fdf4] text-[#16a34a]",
  Closed: "bg-[#f1f5f9] text-[#64748b]",
};

// =========================
// Activity styles — ألوان حسب نوع الـ action
// =========================
const getActivityStyles = (action) => {
  const a = (action || "").toLowerCase();

  if (a.includes("created")) {
    return {
      dotColor: "bg-[#2f855a]",
      badge: "bg-[#f0fdf4] text-[#16a34a]",
      icon: <FiPlus className="h-3 w-3" />,
    };
  }

  if (a.includes("assigned")) {
    return {
      dotColor: "bg-[#2563eb]",
      badge: "bg-[#eff6ff] text-[#2563eb]",
      icon: <FiUserPlus className="h-3 w-3" />,
    };
  }

  if (a.includes("status")) {
    return {
      dotColor: "bg-[#7c3aed]",
      badge: "bg-[#f5f3ff] text-[#7c3aed]",
      icon: <FiRefreshCw className="h-3 w-3" />,
    };
  }

  if (a.includes("progress")) {
    return {
      dotColor: "bg-[#0d9488]",
      badge: "bg-[#f0fdfa] text-[#0d9488]",
      icon: <FiActivity className="h-3 w-3" />,
    };
  }

  if (a.includes("updated") || a.includes("edit")) {
    return {
      dotColor: "bg-[#d97706]",
      badge: "bg-[#fffaf0] text-[#d97706]",
      icon: <FiEdit3 className="h-3 w-3" />,
    };
  }

  return {
    dotColor: "bg-[#64748b]",
    badge: "bg-[#f1f5f9] text-[#64748b]",
    icon: <FiActivity className="h-3 w-3" />,
  };
};

// =========================
// Helpers
// =========================
const mapApiStatus = (status) => {
  switch (status) {
    case "Completed":
    case "Closed":
      return "completed";
    case "Pending":
    case "In Progress":
    default:
      return "in-progress";
  }
};

const getPriorityStyles = (priority) => {
  const p = (priority || "").toLowerCase();

  if (p === "urgent" || p === "high") {
    return {
      stripeColor: "bg-[#e05252]",
      priorityBadge: "bg-[#fff5f5] text-[#e05252]",
    };
  }

  if (p === "medium") {
    return {
      stripeColor: "bg-[#d97706]",
      priorityBadge: "bg-[#fffaf0] text-[#d97706]",
    };
  }

  return {
    stripeColor: "bg-[#38b2ac]",
    priorityBadge: "bg-[#f0fdfa] text-[#0d9488]",
  };
};

const formatDeadline = (iso, isRtl) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const dateStr = d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return isRtl ? dateStr : `Due ${dateStr}`;
};

const formatDateTime = (iso, isRtl) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString(isRtl ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDeadlineForInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDeadlineForApi = (datetimeLocal) => {
  if (!datetimeLocal) return "";
  return `${datetimeLocal.replace("T", " ")}:00`;
};

const SUBMISSION_STORAGE_KEY = "wisework_task_submissions_cache";

const getSavedSubmissions = () => {
  try {
    const raw = localStorage.getItem(SUBMISSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveSubmissionForTask = (taskId, submissionData) => {
  if (!taskId) return;
  try {
    const all = getSavedSubmissions();
    all[taskId] = {
      ...(all[taskId] || {}),
      ...submissionData,
      task_id: taskId,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("Could not save submission to storage:", e);
  }
};

const getTaskSubmissions = (apiTask) => {
  if (!apiTask) return [];

  if (Array.isArray(apiTask.submissions) && apiTask.submissions.length > 0) {
    return apiTask.submissions;
  }
  if (Array.isArray(apiTask.task_submissions) && apiTask.task_submissions.length > 0) {
    return apiTask.task_submissions;
  }
  if (apiTask.active_submission) return [apiTask.active_submission];
  if (apiTask.activeSubmission) return [apiTask.activeSubmission];
  if (apiTask.latest_submission) return [apiTask.latest_submission];
  if (apiTask.latestSubmission) return [apiTask.latestSubmission];
  if (apiTask.current_submission) return [apiTask.current_submission];
  if (apiTask.submission) return [apiTask.submission];

  const taskId = apiTask.id || apiTask.apiId;
  if (taskId) {
    const cached = getSavedSubmissions()[taskId];
    if (cached) return [cached];
  }

  return [];
};

const getLatestTaskSubmission = (apiTask) => {
  const submissions = getTaskSubmissions(apiTask);
  if (!submissions.length) return null;

  return [...submissions].sort((a, b) => {
    const aTime = new Date(a?.submitted_at || a?.created_at || 0).getTime();
    const bTime = new Date(b?.submitted_at || b?.created_at || 0).getTime();
    return bTime - aTime;
  })[0];
};

const mapApiTask = (apiTask, isRtl) => {
  const styles = getPriorityStyles(apiTask.priority);
  const progress = Number(apiTask.progress) || 0;
  const submission = getLatestTaskSubmission(apiTask);
  const submissionStatus =
    submission?.status ||
    apiTask.submission_status ||
    apiTask.submissionStatus ||
    null;

  let computedStatus = mapApiStatus(apiTask.status);
  if (submissionStatus === "Pending Review") {
    computedStatus = "under-review";
  } else if (submissionStatus === "Approved") {
    computedStatus = "completed";
  }

  return {
    id: `task-${apiTask.id}`,
    apiId: apiTask.id,
    defaultTitle: apiTask.title || "Untitled task",
    description: apiTask.description || "",
    priority: (apiTask.priority || "low").toLowerCase(),
    priorityLabel: apiTask.priority || "Low",
    statusLabel: normalizeTaskStatus(apiTask.status),
    rawDeadline: apiTask.deadline || "",
    defaultDueDate: formatDeadline(apiTask.deadline, isRtl),
    status: computedStatus,
    submissionStatus,
    submission,
    progress,
    progressColor: progress >= 100 ? "bg-[#3182ce]" : "bg-[#2f855a]",
    stripeColor: styles.stripeColor,
    priorityBadge: styles.priorityBadge,
  };
};

const FILTERS = [
  { id: "all", labelKey: "tasks.filters.all", defaultLabel: "All" },
  {
    id: "in-progress",
    labelKey: "tasks.filters.inProgress",
    defaultLabel: "In Progress",
  },
  {
    id: "under-review",
    labelKey: "tasks.filters.underReview",
    defaultLabel: "Under Review",
  },
  {
    id: "completed",
    labelKey: "tasks.filters.completed",
    defaultLabel: "Completed",
  },
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const Tasks = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith("ar");

  // =========================
  // Data State
  // =========================
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [activeFilter, setActiveFilter] = useState("all");

  // =========================
  // Submit Progress Modal
  // =========================
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskUpdate, setShowTaskUpdate] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [progressVal, setProgressVal] = useState(70);
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const [progressError, setProgressError] = useState(null);
  const [checkingSubmissionTaskId, setCheckingSubmissionTaskId] =
    useState(null);

  // =========================
  // Create Task Modal
  // =========================
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    deadline: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // =========================
  // Edit Task Modal
  // =========================
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    deadline: "",
  });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState(null);

  // =========================
  // Assign User Modal
  // =========================
  const [showAssign, setShowAssign] = useState(false);
  const [assigningTask, setAssigningTask] = useState(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);

  // =========================
  // Status Change Modal
  // =========================
  const [showStatus, setShowStatus] = useState(false);
  const [statusTask, setStatusTask] = useState(null);
  const [newStatus, setNewStatus] = useState("Pending");
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // =========================
  // Task Details Modal + Activity Log
  // =========================
  const [showDetails, setShowDetails] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const [detailsTab, setDetailsTab] = useState("details"); // "details" | "activity"
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);

  // =========================
  // Toast
  // =========================
  const [toast, setToast] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const showToast = (title, message) => {
    setToast({ visible: true, title, message });

    window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // =====================================================
  // FETCH LIST — GET /api/tasks
  // =====================================================
  const fetchTasks = useCallback(
    async (signal) => {
      setLoading(true);
      setApiError(null);

      try {
        const token = localStorage.getItem("token");
        const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

        const response = await fetch(
          `${buildUrl(ENDPOINT_TASKS)}?lang=${lang}&per_page=100`,
          {
            signal,
            headers: {
              Accept: "application/json",
              "Accept-Language": lang,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        const json = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthenticated — please login again.");
          }
          if (response.status === 422) {
            const firstKey =
              json?.errors && typeof json.errors === "object"
                ? Object.keys(json.errors)[0]
                : null;
            throw new Error(
              json?.errors?.[firstKey]?.[0] ||
                json?.message ||
                "Validation error.",
            );
          }
          throw new Error(
            json?.message || `Failed to load tasks (${response.status})`,
          );
        }

        let list = [];
        if (Array.isArray(json?.data?.data)) list = json.data.data;
        else if (Array.isArray(json?.data)) list = json.data;
        else if (Array.isArray(json)) list = json;

        setTasks((previousTasks) => {
          const cachedSubmissions = getSavedSubmissions();
          return list.map((item) => {
            const mapped = mapApiTask(item, isRtl);
            const previous = previousTasks.find(
              (task) => task.apiId === mapped.apiId,
            );

            const effectiveSub =
              mapped.submission ||
              cachedSubmissions[mapped.apiId] ||
              previous?.submission;

            if (effectiveSub) {
              const subStatus =
                effectiveSub.status ||
                mapped.submissionStatus ||
                "Pending Review";
              return {
                ...mapped,
                submission: effectiveSub,
                submissionStatus: subStatus,
                status:
                  subStatus === "Pending Review"
                    ? "under-review"
                    : subStatus === "Approved"
                    ? "completed"
                    : mapped.status,
              };
            }

            return mapped;
          });
        });
      } catch (e) {
        if (e.name === "AbortError") return;
        setApiError(e.message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );

  useEffect(() => {
    const controller = new AbortController();
    // Fetching is the effect's external synchronization; it updates loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks(controller.signal);
    return () => controller.abort();
  }, [fetchTasks]);

  // =====================================================
  // ACTIVITIES — GET /tasks/{id}/activities (حسب التوثيق)
  // =====================================================
  const fetchActivities = useCallback(
    async (taskId) => {
      setActivitiesLoading(true);
      setActivitiesError(null);
      setActivities([]);

      try {
        const token = localStorage.getItem("token");
        const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

        const response = await fetch(
          `${buildUrl(`${ENDPOINT_TASKS}/${taskId}/activities`)}?lang=${lang}`,
          {
            headers: {
              Accept: "application/json",
              "Accept-Language": lang,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        const json = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthenticated — please login again.");
          }
          if (response.status === 403) {
            throw new Error(
              json?.message || "You are not authorized to view this task.",
            );
          }
          if (response.status === 404) {
            throw new Error(json?.message || "Task not found.");
          }
          if (response.status === 500) {
            throw new Error(json?.message || "Something went wrong.");
          }
          throw new Error(json?.message || `Failed (${response.status})`);
        }

        // data مصفوفة من النشاطات
        const list = Array.isArray(json?.data) ? json.data : [];

        setActivities(list);
      } catch (e) {
        setActivitiesError(e.message);
      } finally {
        setActivitiesLoading(false);
      }
    },
    [i18n.language],
  );

  // =====================================================
  // TASK DETAILS — GET /tasks/{id}  (+ Activities بالتوازي)
  // =====================================================
  const openTaskDetails = async (task) => {
    setShowDetails(true);
    setDetailsTab("details");
    setDetailsTask(null);
    setDetailsError(null);
    setDetailsLoading(true);

    // نجرب سجل النشاطات في الخلفية — فشله مش بيوقف التفاصيل
    setActivities([]);
    setActivitiesError(null);
    setActivitiesLoading(true);
    fetchActivities(task.apiId);

    try {
      const token = localStorage.getItem("token");
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

      const response = await fetch(
        `${buildUrl(`${ENDPOINT_TASKS}/${task.apiId}`)}?lang=${lang}`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Language": lang,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthenticated — please login again.");
        }
        if (response.status === 403) {
          throw new Error(
            json?.message || "You are not authorized to view this task.",
          );
        }
        if (response.status === 404) {
          throw new Error(json?.message || "Task not found.");
        }
        if (response.status === 500) {
          throw new Error(json?.message || "Something went wrong.");
        }
        throw new Error(json?.message || `Failed (${response.status})`);
      }

      const apiTask = json?.data;

      if (!apiTask) {
        throw new Error("Unexpected response from server.");
      }

      const submissions = getTaskSubmissions(apiTask);
      const mappedTask = mapApiTask(apiTask, isRtl);
      const cachedSub = getSavedSubmissions()[mappedTask.apiId];
      const effectiveSubmissions =
        submissions.length > 0
          ? submissions
          : cachedSub
          ? [cachedSub]
          : [];

      setDetailsTask({
        ...mappedTask,
        createdBy: apiTask.created_by,
        createdAt: formatDateTime(apiTask.created_at, isRtl),
        updatedAt: formatDateTime(apiTask.updated_at, isRtl),
        submissions: effectiveSubmissions,
      });

      // Keep the card in sync with the latest submission state
      setTasks((previous) =>
        previous.map((item) =>
          item.apiId === mappedTask.apiId
            ? {
                ...item,
                ...mappedTask,
                submission:
                  mappedTask.submission || cachedSub || item.submission,
                submissionStatus:
                  mappedTask.submissionStatus ||
                  cachedSub?.status ||
                  item.submissionStatus,
                status:
                  (mappedTask.submissionStatus || cachedSub?.status) ===
                  "Pending Review"
                    ? "under-review"
                    : (mappedTask.submissionStatus || cachedSub?.status) ===
                      "Approved"
                    ? "completed"
                    : mappedTask.status,
              }
            : item,
        ),
      );

      // If submission has an id, fetch full details in background to load reviewer comments & attachments
      const latestSubId = effectiveSubmissions[0]?.id;
      if (latestSubId) {
        getSubmissionDetails(latestSubId, { lang })
          .then((detailRes) => {
            if (detailRes?.data) {
              const fullSub = detailRes.data;
              saveSubmissionForTask(mappedTask.apiId, fullSub);
              setDetailsTask((prev) => {
                if (!prev || prev.apiId !== mappedTask.apiId) return prev;
                return {
                  ...prev,
                  submission: fullSub,
                  submissionStatus: fullSub.status || prev.submissionStatus,
                  status:
                    fullSub.status === "Pending Review"
                      ? "under-review"
                      : fullSub.status === "Approved"
                      ? "completed"
                      : prev.status,
                  submissions: prev.submissions?.map((s) =>
                    s.id === fullSub.id ? { ...s, ...fullSub } : s,
                  ),
                };
              });
            }
          })
          .catch((err) => {
            console.warn("Could not fetch full submission details:", err);
          });
      }
    } catch (e) {
      setDetailsError(e.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeTaskDetails = () => {
    setShowDetails(false);
    setDetailsTask(null);
    setDetailsError(null);
    setDetailsTab("details");
    setActivities([]);
    setActivitiesError(null);
  };

  // Status counts
  const stats = useMemo(() => {
    return {
      all: tasks.length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      "under-review": tasks.filter((t) => t.status === "under-review").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === "all") return tasks;
    return tasks.filter((t) => t.status === activeFilter);
  }, [tasks, activeFilter]);

  // =====================================================
  // SUBMISSIONS & PROGRESS
  // POST /api/tasks/{task}/submissions
  // POST /api/tasks/submissions/{submission}/resubmit
  // POST /api/tasks/submissions/{submission}/attachments
  // =====================================================
  const [resubmissionTarget, setResubmissionTarget] = useState(null);
  const [attachingFile, setAttachingFile] = useState(false);

  const handleOpenTaskUpdate = (task, submission = null) => {
    if (!task) return;
    setSelectedTask(task);
    setResubmissionTarget(submission);
    setProgressVal(task.progress || 0);
    setUploadedFile(null);
    setNotes(submission?.note || "");
    setProgressError(null);
    setShowTaskUpdate(true);
  };

  const handleOpenSubmissionFlow = async (task) => {
    if (!task || checkingSubmissionTaskId) return;

    const cachedSub = getSavedSubmissions()[task.apiId] || task.submission;
    const knownStatus = task.submissionStatus || cachedSub?.status || null;
    const knownSubmission = cachedSub || task.submission || null;

    if (knownStatus === "Pending Review") {
      showToast(
        isRtl ? "التسليم قيد المراجعة" : "Submission is already under review",
        isRtl
          ? "لا يمكن إرسال تسليم آخر قبل انتهاء مراجعة التسليم الحالي."
          : "You cannot submit another deliverable while the current one is pending review.",
      );
      return;
    }

    if (knownStatus === "Changes Requested" && knownSubmission?.id) {
      handleOpenTaskUpdate(task, knownSubmission);
      return;
    }

    if (knownStatus === "Approved") {
      showToast(
        isRtl ? "تم اعتماد التسليم" : "Submission already approved",
        isRtl
          ? "تم اعتماد تسليم هذه المهمة بالفعل."
          : "This task already has an approved submission.",
      );
      return;
    }

    setCheckingSubmissionTaskId(task.apiId);
    setProgressError(null);

    try {
      const token = localStorage.getItem("token");
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

      // If we have an existing submission ID, query server for latest review status
      if (knownSubmission?.id) {
        try {
          const detailRes = await getSubmissionDetails(knownSubmission.id, { lang });
          if (detailRes?.data) {
            const serverSub = detailRes.data;
            saveSubmissionForTask(task.apiId, serverSub);

            if (serverSub.status === "Pending Review") {
              setTasks((prev) =>
                prev.map((t) =>
                  t.apiId === task.apiId
                    ? {
                        ...t,
                        submission: serverSub,
                        submissionStatus: "Pending Review",
                        status: "under-review",
                      }
                    : t
                )
              );
              showToast(
                isRtl ? "التسليم قيد المراجعة" : "Submission is already under review",
                isRtl
                  ? "لا يمكن إرسال تسليم آخر قبل انتهاء مراجعة التسليم الحالي."
                  : "You cannot submit another deliverable while the current one is pending review.",
              );
              return;
            }

            if (serverSub.status === "Changes Requested") {
              handleOpenTaskUpdate(task, serverSub);
              return;
            }

            if (serverSub.status === "Approved") {
              setTasks((prev) =>
                prev.map((t) =>
                  t.apiId === task.apiId
                    ? {
                        ...t,
                        submission: serverSub,
                        submissionStatus: "Approved",
                        status: "completed",
                      }
                    : t
                )
              );
              showToast(
                isRtl ? "تم اعتماد التسليم" : "Submission already approved",
                isRtl
                  ? "تم اعتماد تسليم هذه المهمة بالفعل."
                  : "This task already has an approved submission.",
              );
              return;
            }
          }
        } catch (detailErr) {
          console.warn("Could not check submission details:", detailErr);
        }
      }

      const response = await fetch(
        `${buildUrl(`${ENDPOINT_TASKS}/${task.apiId}`)}?lang=${lang}`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Language": lang,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          json?.message || `Failed to check submission (${response.status})`,
        );
      }

      const apiTask = json?.data;
      if (!apiTask) {
        throw new Error("Unexpected response from server.");
      }

      const latestSubmission = getLatestTaskSubmission(apiTask);
      const freshTask = mapApiTask(apiTask, isRtl);

      setTasks((previous) =>
        previous.map((item) =>
          item.apiId === freshTask.apiId ? { ...item, ...freshTask } : item,
        ),
      );

      if (latestSubmission?.status === "Pending Review") {
        saveSubmissionForTask(task.apiId, latestSubmission);
        showToast(
          isRtl ? "التسليم قيد المراجعة" : "Submission is already under review",
          isRtl
            ? "لا يمكن إرسال تسليم آخر قبل انتهاء مراجعة التسليم الحالي."
            : "You cannot submit another deliverable while the current one is pending review.",
        );
        return;
      }

      if (latestSubmission?.status === "Changes Requested") {
        saveSubmissionForTask(task.apiId, latestSubmission);
        handleOpenTaskUpdate(freshTask, latestSubmission);
        return;
      }

      if (latestSubmission?.status === "Approved") {
        saveSubmissionForTask(task.apiId, latestSubmission);
        showToast(
          isRtl ? "تم اعتماد التسليم" : "Submission already approved",
          isRtl
            ? "تم اعتماد تسليم هذه المهمة بالفعل."
            : "This task already has an approved submission.",
        );
        return;
      }

      handleOpenTaskUpdate(freshTask);
    } catch (e) {
      console.error("Could not verify task submission:", e);
      showToast(
        isRtl
          ? "تعذر التحقق من حالة التسليم"
          : "Could not verify submission status",
        e.message || (isRtl ? "حاول مرة أخرى." : "Please try again."),
      );
    } finally {
      setCheckingSubmissionTaskId(null);
    }
  };

  const handleCloseTaskUpdate = () => {
    if (submittingProgress) return;
    setShowTaskUpdate(false);
    setSelectedTask(null);
    setResubmissionTarget(null);
    setUploadedFile(null);
    setNotes("");
    setProgressError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleSubmitForReview = async () => {
    if (!selectedTask || submittingProgress) return;

    if (!notes.trim()) {
      setProgressError(
        isRtl
          ? "يرجى كتابة ملاحظات حول التسليم (مطلوبة)."
          : "Please write notes about your deliverable (required).",
      );
      return;
    }

    setSubmittingProgress(true);
    setProgressError(null);

    try {
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
      const isResubmit = Boolean(resubmissionTarget?.id);

      if (
        isResubmit &&
        resubmissionTarget?.status &&
        resubmissionTarget.status !== "Changes Requested"
      ) {
        throw new Error(
          isRtl
            ? "لا يمكن إعادة إرسال هذا التسليم إلا بعد طلب تعديلات."
            : "This submission can only be resubmitted after changes are requested.",
        );
      }

      if (
        !isResubmit &&
        ["Pending Review", "Approved"].includes(selectedTask.submissionStatus)
      ) {
        throw new Error(
          selectedTask.submissionStatus === "Pending Review"
            ? isRtl
              ? "التسليم الحالي قيد المراجعة بالفعل."
              : "This task already has a submission pending review."
            : isRtl
              ? "تم اعتماد التسليم الحالي بالفعل."
              : "This task already has an approved submission.",
        );
      }

      let submissionResponse;

      if (isResubmit) {
        // 8. Resubmit after changes requested: POST /api/tasks/submissions/{submission}/resubmit
        submissionResponse = await resubmitSubmission(
          resubmissionTarget.id,
          {
            note: notes.trim(),
            files: uploadedFile ? [uploadedFile] : [],
          },
          { lang },
        );
      } else {
        // 1. Submit a task: POST /api/tasks/{task}/submissions
        submissionResponse = await submitTask(
          selectedTask.apiId,
          {
            note: notes.trim(),
            files: uploadedFile ? [uploadedFile] : [],
          },
          { lang },
        );
      }

      const createdSubmission = submissionResponse?.data;
      const subRecord = createdSubmission || {
        task_id: selectedTask.apiId,
        status: "Pending Review",
        note: notes.trim(),
        submitted_at: new Date().toISOString(),
      };

      // Persist to local cache so page reloads remember the deliverable
      saveSubmissionForTask(selectedTask.apiId, subRecord);

      // Keep the local card state synchronized
      setTasks((previous) =>
        previous.map((item) =>
          item.apiId === selectedTask.apiId
            ? {
                ...item,
                submission: subRecord,
                submissionStatus: subRecord.status || "Pending Review",
                status:
                  (subRecord.status || "Pending Review") === "Pending Review"
                    ? "under-review"
                    : item.status,
              }
            : item,
        ),
      );

      // Also sync progress if desired
      try {
        const token = localStorage.getItem("token");
        await fetch(
          `${buildUrl(`${ENDPOINT_TASKS}/${selectedTask.apiId}/progress`)}?lang=${lang}`,
          {
            method: "PATCH",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Accept-Language": lang,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              progress: progressVal,
            }),
          },
        );
      } catch (syncErr) {
        console.warn("Could not sync progress:", syncErr);
      }

      // Refresh task details if currently open
      if (detailsTask && detailsTask.apiId === selectedTask.apiId) {
        setDetailsTask((prev) => ({
          ...prev,
          submission: subRecord,
          submissionStatus: subRecord.status || "Pending Review",
          status:
            (subRecord.status || "Pending Review") === "Pending Review"
              ? "under-review"
              : prev.status,
          submissions: [subRecord, ...(prev.submissions || [])],
        }));
      }

      setShowTaskUpdate(false);
      setSelectedTask(null);
      setResubmissionTarget(null);
      setUploadedFile(null);
      setNotes("");

      showToast(
        isResubmit
          ? isRtl
            ? "تمت إعادة تسليم المهمة بنجاح"
            : "Submission resubmitted successfully"
          : isRtl
            ? "تم تسليم المهمة بنجاح للمراجعة"
            : "Deliverable submitted successfully for review",
        `"${selectedTask.defaultTitle}" ${
          isRtl ? "بانتظار مراجعة المسؤول" : "is now pending review"
        }.`,
      );
    } catch (e) {
      console.error("Submission failed:", e);

      const errMsg =
        e.response?.data?.message ||
        e.response?.data?.errors?.note?.[0] ||
        e.message ||
        (isRtl ? "فشل تسليم المهمة" : "Failed to submit deliverable");

      if (
        typeof errMsg === "string" &&
        errMsg.toLowerCase().includes("already have an active submission")
      ) {
        // Backend protection: An active deliverable is already pending review.
        // Update local state and cache so the card immediately reflects 'under-review'.
        const activeSub = {
          task_id: selectedTask.apiId,
          status: "Pending Review",
          note: notes.trim() || (isRtl ? "تسليم قيد المراجعة" : "Active deliverable under review"),
          submitted_at: new Date().toISOString(),
        };

        saveSubmissionForTask(selectedTask.apiId, activeSub);

        setTasks((previous) =>
          previous.map((item) =>
            item.apiId === selectedTask.apiId
              ? {
                  ...item,
                  submission: activeSub,
                  submissionStatus: "Pending Review",
                  status: "under-review",
                }
              : item,
          ),
        );

        if (detailsTask && detailsTask.apiId === selectedTask.apiId) {
          setDetailsTask((prev) => ({
            ...prev,
            submission: activeSub,
            submissionStatus: "Pending Review",
            status: "under-review",
            submissions: [activeSub, ...(prev.submissions || [])],
          }));
        }

        setShowTaskUpdate(false);
        setSelectedTask(null);
        setResubmissionTarget(null);
        setUploadedFile(null);
        setNotes("");

        showToast(
          isRtl ? "التسليم قيد المراجعة بالفعل" : "Submission Already Under Review",
          isRtl
            ? "يوجد تسليم نشط لهذه المهمة بالفعل وبانتظار مراجعة المسؤول."
            : "This task already has an active submission currently pending review.",
        );
        return;
      }

      setProgressError(errMsg);
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleAttachExtraFile = async (submissionId, file) => {
    if (!submissionId || !file || attachingFile) return;
    setAttachingFile(true);
    try {
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
      const res = await attachSubmissionFile(submissionId, file, { lang });
      const newAttachment = res?.data;

      if (detailsTask) {
        setDetailsTask((prev) => ({
          ...prev,
          submissions: (prev.submissions || []).map((sub) =>
            sub.id === submissionId
              ? {
                  ...sub,
                  attachments: [...(sub.attachments || []), newAttachment],
                }
              : sub,
          ),
        }));
      }

      showToast(
        isRtl ? "تم إرفاق الملف بنجاح" : "File attached successfully",
        file.name,
      );
    } catch (err) {
      console.error("Failed to attach file:", err);
      showToast(
        isRtl ? "فشل إرفاق الملف" : "Failed to attach file",
        err.response?.data?.message || err.message,
      );
    } finally {
      setAttachingFile(false);
    }
  };

  // =====================================================
  // CHANGE STATUS — PATCH /tasks/{id}/status
  // =====================================================
  const openStatusModal = (task) => {
    setStatusTask(task);
    setNewStatus(task.statusLabel || "Pending");
    setStatusError(null);
    setShowStatus(true);
  };

  const closeStatusModal = () => {
    if (changingStatus) return;
    setShowStatus(false);
    setStatusTask(null);
    setStatusError(null);
  };

  const handleStatusChangeSubmit = async (event) => {
    event.preventDefault();

    if (!statusTask || changingStatus) return;

    if (newStatus === statusTask.statusLabel) {
      closeStatusModal();
      return;
    }

    setChangingStatus(true);
    setStatusError(null);

    try {
      const token = localStorage.getItem("token");
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

      const response = await fetch(
        `${buildUrl(`${ENDPOINT_TASKS}/${statusTask.apiId}/status`)}?lang=${lang}`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Accept-Language": lang,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const json = await response.json().catch(() => null);
      const apiMessage =
        json?.message ||
        json?.errors?.status?.[0] ||
        json?.errors?.[Object.keys(json?.errors || {})[0]]?.[0];

      if (response.ok) {
        const updated = json?.data;
        const confirmedStatus = normalizeTaskStatus(
          updated?.status || newStatus,
        );

        setTasks((prev) =>
          prev.map((task) =>
            String(task.apiId) === String(statusTask.apiId)
              ? {
                  ...task,
                  statusLabel: confirmedStatus,
                  status: mapApiStatus(confirmedStatus),
                }
              : task,
          ),
        );
        setDetailsTask((prev) =>
          prev && String(prev.apiId) === String(statusTask.apiId)
            ? {
                ...prev,
                statusLabel: confirmedStatus,
                status: mapApiStatus(confirmedStatus),
              }
            : prev,
        );

        setShowStatus(false);
        setStatusTask(null);

        showToast(
          t("tasks.statusUpdated", "Task status updated"),
          t("tasks.statusUpdatedMessage", {
            title: updated?.title || statusTask.defaultTitle,
            status: getApiStatusLabel(newStatus),
            defaultValue: "{{title}} is now {{status}}.",
          }),
        );
        return;
      }

      if (response.status === 422) {
        setStatusError(apiMessage || t("tasks.errors.invalidStatus"));
        return;
      }

      if (response.status === 403) {
        setStatusError(apiMessage || t("tasks.errors.forbidden"));
        return;
      }

      if (response.status === 404) {
        setStatusError(apiMessage || t("tasks.errors.notFound"));
        return;
      }

      if (response.status === 401) {
        setStatusError(apiMessage || t("tasks.errors.unauthenticated"));
        return;
      }

      if (response.status === 500) {
        setStatusError(apiMessage || t("tasks.errors.updateStatus"));
        return;
      }

      setStatusError(
        apiMessage ||
          t("tasks.errors.updateStatusCode", {
            status: response.status,
            defaultValue: "Could not update task status ({{status}}).",
          }),
      );
    } catch (error) {
      console.error("Failed to update task status:", error);
      setStatusError(
        error.message ||
          t(
            "tasks.errors.network",
            "Could not connect to update task status.",
          ),
      );
    } finally {
      setChangingStatus(false);
    }
  };

  // =====================================================
  // CREATE TASK — POST /tasks
  // =====================================================
  const openCreateModal = () => {
    setCreateForm({
      title: "",
      description: "",
      priority: "Medium",
      deadline: "",
    });
    setCreateError(null);
    setShowCreateTask(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setShowCreateTask(false);
    setCreateError(null);
  };

  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTaskSubmit = async (event) => {
    event.preventDefault();

    if (!createForm.title.trim() || creating) return;

    setCreating(true);
    setCreateError(null);

    try {
      const token = localStorage.getItem("token");
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

      const response = await fetch(`${buildUrl(ENDPOINT_TASKS)}?lang=${lang}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Accept-Language": lang,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          priority: createForm.priority,
          deadline: formatDeadlineForApi(createForm.deadline),
        }),
      });

      const json = await response.json().catch(() => null);

      if (response.status === 201) {
        const created = json?.data;

        if (created && created.id) {
          setTasks((prev) => [mapApiTask(created, isRtl), ...prev]);
        } else {
          await fetchTasks(new AbortController().signal);
        }

        setShowCreateTask(false);

        showToast(
          json?.message || "Task created successfully",
          `"${created?.title || createForm.title}" was added to tasks.`,
        );
        return;
      }

      if (response.status === 422) {
        let firstError = null;
        if (json?.errors && typeof json.errors === "object") {
          const firstKey = Object.keys(json.errors)[0];
          firstError = json.errors[firstKey]?.[0] ?? null;
        }
        setCreateError(firstError || json?.message || "Validation error.");
        return;
      }

      if (response.status === 401) {
        setCreateError("Unauthenticated — please login again.");
        return;
      }

      setCreateError(
        json?.message || `Failed to create task (${response.status})`,
      );
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  // =====================================================
  // EDIT TASK — PUT /tasks/{id}
  // =====================================================
  const openEditModal = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.defaultTitle || "",
      description: task.description || "",
      priority:
        task.priorityLabel && PRIORITIES.includes(task.priorityLabel)
          ? task.priorityLabel
          : "Medium",
      deadline: formatDeadlineForInput(task.rawDeadline),
    });
    setEditError(null);
    setShowEditTask(true);
  };

  const closeEditModal = () => {
    if (editing) return;
    setShowEditTask(false);
    setEditingTask(null);
    setEditError(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditTaskSubmit = async (event) => {
    event.preventDefault();

    if (!editingTask || !editForm.title.trim() || editing) return;

    setEditing(true);
    setEditError(null);

    try {
      const token = localStorage.getItem("token");
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

      const response = await fetch(
        `${buildUrl(`${ENDPOINT_TASKS}/${editingTask.apiId}`)}?lang=${lang}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Accept-Language": lang,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            title: editForm.title.trim(),
            description: editForm.description.trim(),
            priority: editForm.priority,
            deadline: formatDeadlineForApi(editForm.deadline),
          }),
        },
      );

      const json = await response.json().catch(() => null);

      if (response.ok) {
        const updated = json?.data;

        if (updated && updated.id) {
          setTasks((prev) =>
            prev.map((t) =>
              t.apiId === updated.id ? mapApiTask(updated, isRtl) : t,
            ),
          );
        } else {
          await fetchTasks(new AbortController().signal);
        }

        setShowEditTask(false);
        setEditingTask(null);

        showToast(
          json?.message || "Task updated successfully",
          `"${updated?.title || editForm.title}" was updated.`,
        );
        return;
      }

      if (response.status === 422) {
        let firstError = null;
        if (json?.errors && typeof json.errors === "object") {
          const firstKey = Object.keys(json.errors)[0];
          firstError = json.errors[firstKey]?.[0] ?? null;
        }
        setEditError(firstError || json?.message || "Validation error.");
        return;
      }

      if (response.status === 401) {
        setEditError("Unauthenticated — please login again.");
        return;
      }

      if (response.status === 404) {
        setEditError(json?.message || "Task not found.");
        return;
      }

      if (response.status === 500) {
        setEditError(json?.message || "Something went wrong.");
        return;
      }

      setEditError(
        json?.message || `Failed to update task (${response.status})`,
      );
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditing(false);
    }
  };

  // =====================================================
  // ASSIGN TASK — POST /tasks/{id}/assign
  // =====================================================
  const openAssignModal = (task) => {
    setAssigningTask(task);
    setAssignUserId("");
    setAssignError(null);
    setShowAssign(true);
  };

  const closeAssignModal = () => {
    if (assigning) return;
    setShowAssign(false);
    setAssigningTask(null);
    setAssignUserId("");
    setAssignError(null);
  };

  const handleAssignSubmit = async (event) => {
    event.preventDefault();

    if (!assigningTask || !assignUserId || assigning) return;

    setAssigning(true);
    setAssignError(null);

    try {
      const token = localStorage.getItem("token");
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

      const response = await fetch(
        `${buildUrl(`${ENDPOINT_TASKS}/${assigningTask.apiId}/assign`)}?lang=${lang}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Accept-Language": lang,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            user_id: Number(assignUserId),
          }),
        },
      );

      const json = await response.json().catch(() => null);

      if (response.status === 201) {
        setShowAssign(false);
        setAssigningTask(null);

        showToast(
          json?.message || "Task assigned successfully",
          `"${assigningTask.defaultTitle}" assigned to user #${assignUserId}.`,
        );
        return;
      }

      if (response.status === 422) {
        let firstError = null;
        if (json?.errors && typeof json.errors === "object") {
          const firstKey = Object.keys(json.errors)[0];
          firstError = json.errors[firstKey]?.[0] ?? null;
        }
        setAssignError(firstError || json?.message || "Validation error.");
        return;
      }

      if (response.status === 404) {
        setAssignError(json?.message || "Task or user not found.");
        return;
      }

      if (response.status === 401) {
        setAssignError("Unauthenticated — please login again.");
        return;
      }

      if (response.status === 500) {
        setAssignError(json?.message || "Something went wrong.");
        return;
      }

      setAssignError(
        json?.message || `Failed to assign task (${response.status})`,
      );
    } catch (e) {
      setAssignError(e.message);
    } finally {
      setAssigning(false);
    }
  };

  // =========================
  // Labels
  // =========================
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return t("tasks.priority.high", "High priority");
      case "medium":
        return t("tasks.priority.medium", "Medium priority");
      case "low":
      default:
        return t("tasks.priority.low", "Low priority");
    }
  };

  const getApiStatusLabel = (status) => {
    const normalizedStatus = normalizeTaskStatus(status);
    const statusKey = {
      Pending: "pending",
      "In Progress": "inProgress",
      Completed: "completed",
      Closed: "closed",
    }[normalizedStatus];
    return t(`tasks.status.${statusKey}`, normalizedStatus);
  };

  const getSubmissionStatusLabel = (status) => {
    const statusKey = {
      "pending review": "pendingReview",
      "changes requested": "changesRequested",
      approved: "approved",
      rejected: "rejected",
    }[String(status || "").toLowerCase()];
    return statusKey
      ? t(`tasks.submissionStatus.${statusKey}`)
      : status || t("tasks.submissionStatus.pendingReview");
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "in-progress":
        return t("tasks.status.inProgress", "In Progress");
      case "under-review":
        return t("tasks.status.underReview", "Under Review");
      case "completed":
        return t("tasks.status.completed", "Completed");
      default:
        return status;
    }
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="w-full space-y-6 pb-16 font-sans text-[#102a43]"
    >
      {/* 1. Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#2f855a] uppercase mb-1">
            {t("tasks.workManagement", "WORK MANAGEMENT")}
          </p>
          <h1 className="text-2xl md:text-[28px] font-bold text-[#102a43] tracking-tight">
            {t("tasks.myTasks", "My tasks")}
          </h1>
          <p className="text-sm text-[#829ab1] mt-1 font-normal">
            {t(
              "tasks.subtitle",
              "Stay on top of your priorities and deliverables.",
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#1c364f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#254360]"
        >
          <FiPlus className="h-4 w-4" />
          {t("tasks.newTask", "New task")}
        </button>
      </motion.div>

      {/* API ERROR */}
      {apiError && (
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4 flex justify-between items-center gap-3 flex-wrap">
          <p className="text-sm font-semibold text-[#dc2626] m-0">{apiError}</p>

          <button
            type="button"
            onClick={() => fetchTasks(new AbortController().signal)}
            className="h-9 px-4 bg-white border border-[#fecaca] rounded-lg text-[#dc2626] text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#fef2f2]"
          >
            {t("tasks.retry", "Retry")}
          </button>
        </div>
      )}

      {/* 2. Filter Pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex items-center gap-2.5 overflow-x-auto pb-1"
      >
        {FILTERS.map((f) => {
          const count = stats[f.id] || 0;
          const isActive = activeFilter === f.id;

          return (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                isActive
                  ? "bg-[#1c364f] text-white"
                  : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <span>{t(f.labelKey, f.defaultLabel)}</span>
              <span
                className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#f1f5f9] text-[#64748b]"
                }`}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* 3. Task Cards */}
      <AnimatePresence mode="popLayout">
        {loading ? (
          <motion.div layout className="space-y-4">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="relative rounded-2xl border border-[#e2e8f0] bg-white p-6 pl-10 pr-6 rtl:pr-10 rtl:pl-6"
              >
                <div className="absolute left-5 rtl:left-auto rtl:right-5 top-6 bottom-6 w-[3.5px] rounded-full bg-[#f1f5f9]" />
                <div className="h-5 w-24 rounded-full bg-[#f1f5f9] animate-pulse" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-[#f1f5f9] animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-[#f1f5f9] animate-pulse" />
                </div>
                <div className="mt-6 flex items-end justify-between gap-6">
                  <div className="w-full md:max-w-md space-y-1.5">
                    <div className="h-3 w-1/2 rounded bg-[#f1f5f9] animate-pulse" />
                    <div className="h-1.5 w-full rounded-full bg-[#f1f5f9] animate-pulse" />
                  </div>
                  <div className="h-8 w-36 rounded-xl bg-[#f1f5f9] animate-pulse" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : !apiError && filteredTasks.length > 0 ? (
          <motion.div layout className="space-y-4">
            {filteredTasks.map((task, index) => {
              return (
                <motion.article
                  layout
                  key={task.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.98,
                    transition: { duration: 0.2 },
                  }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -1, transition: { duration: 0.15 } }}
                  className="relative flex flex-col justify-between rounded-2xl border border-[#e2e8f0] bg-white p-6 pl-10 pr-6 rtl:pr-10 rtl:pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:shadow-md transition-shadow"
                >
                  <div
                    className={`absolute left-5 rtl:left-auto rtl:right-5 top-6 bottom-6 w-[3.5px] rounded-full ${task.stripeColor}`}
                  />

                  <div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => openStatusModal(task)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80 hover:scale-[1.03] ${
                          STATUS_BADGES[task.statusLabel] ||
                          "bg-[#f1f5f9] text-[#64748b]"
                        }`}
                        title={t("tasks.changeStatus", "Change status")}
                      >
                        <FiRefreshCw className="h-3 w-3" />
                        {getApiStatusLabel(task.statusLabel)}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openTaskDetails(task)}
                          className="text-[#94a3b8] hover:text-[#1c364f] p-1.5 rounded-lg hover:bg-[#f1f5f9] transition"
                          aria-label={t("tasks.viewDetails", "View task details")}
                          title={t("tasks.viewDetails", "View details")}
                        >
                          <FiEye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openAssignModal(task)}
                          className="text-[#94a3b8] hover:text-[#2f855a] p-1.5 rounded-lg hover:bg-[#f1f5f9] transition"
                          aria-label={t("tasks.assignUser", "Assign task to user")}
                          title={t("tasks.assignUser", "Assign to user")}
                        >
                          <FiUserPlus className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                          className="text-[#94a3b8] hover:text-[#1c364f] p-1.5 rounded-lg hover:bg-[#f1f5f9] transition"
                          aria-label={t("tasks.editTask", "Edit task")}
                          title={t("tasks.editTask", "Edit task")}
                        >
                          <FiEdit3 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          className="text-[#94a3b8] hover:text-[#1e293b] p-1 transition"
                          aria-label={t("tasks.moreOptions", "More options")}
                        >
                          <FiMoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3
                        onClick={() => openTaskDetails(task)}
                        className="text-base font-bold text-[#102a43] tracking-tight cursor-pointer hover:text-[#1c364f] hover:underline decoration-[#cbd5e1] underline-offset-4 transition"
                      >
                        {task.defaultTitle}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#829ab1] mt-1.5">
                        <FiCalendar className="h-3.5 w-3.5" />
                        <span>{task.defaultDueDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="w-full md:max-w-md space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#829ab1]">
                          {getStatusLabel(task.status)}
                        </span>
                        <span className="font-bold text-[#102a43]">
                          {task.progress}%
                        </span>
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.15 + index * 0.05,
                          }}
                          className={`h-full rounded-full ${task.progressColor}`}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 self-end md:self-auto">
                      {task.status === "in-progress" ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          disabled={checkingSubmissionTaskId === task.apiId}
                          onClick={() => handleOpenSubmissionFlow(task)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-4 py-2 text-xs font-semibold text-[#102a43] hover:bg-[#f8fafc] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <FiUploadCloud className="h-4 w-4 text-[#64748b]" />
                          <span>
                            {checkingSubmissionTaskId === task.apiId
                              ? isRtl
                                ? "جارٍ التحقق..."
                                : "Checking..."
                              : task.submissionStatus === "Changes Requested"
                                ? isRtl
                                  ? "إعادة التسليم"
                                  : "Resubmit deliverable"
                                : t(
                                    "tasks.submitDeliverable",
                                    "Submit deliverable",
                                  )}
                          </span>
                        </motion.button>
                      ) : task.status === "under-review" ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            openTaskDetails(task);
                            setDetailsTab("submissions");
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#fffaf0] border border-[#feebc8] px-4 py-2 text-xs font-semibold text-[#c05621] hover:bg-[#feebc8]/60 transition shadow-sm cursor-pointer"
                          title={isRtl ? "عرض تفاصيل التسليم" : "View deliverable details"}
                        >
                          <FiClock className="h-3.5 w-3.5" />
                          <span>
                            {t("tasks.awaitingReview", "Awaiting review")}
                          </span>
                        </motion.button>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] px-4 py-2 text-xs font-medium text-[#16a34a]">
                          <FiCheckCircle className="h-3.5 w-3.5" />
                          <span>
                            {t("tasks.completedBadge", "Completed")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e2e8f0] bg-white p-12 text-center"
          >
            <FiCheckCircle className="h-8 w-8 text-[#94a3b8] mb-2" />
            <p className="text-sm font-semibold text-[#102a43]">
              {t("tasks.noTasks", "No tasks found")}
            </p>
            <p className="text-xs text-[#829ab1] mt-1">
              {t(
                "tasks.allCaughtUp",
                "All tasks in this category are caught up.",
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. TASK DETAILS MODAL + ACTIVITY TABS */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeTaskDetails}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full max-w-[560px] rounded-2xl bg-white p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {t("tasks.taskDetails", "TASK DETAILS")}
                  </p>
                  {detailsTask && (
                    <h2 className="text-lg font-bold text-[#102a43] mt-0.5">
                      {detailsTask.defaultTitle}
                    </h2>
                  )}
                </div>
                <button
                  type="button"
                  onClick={closeTaskDetails}
                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs: Details | Submissions | Activity */}
              <div className="flex gap-1 rounded-xl bg-[#f1f5f9] p-1 mb-5">
                <button
                  type="button"
                  onClick={() => setDetailsTab("details")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                    detailsTab === "details"
                      ? "bg-white text-[#102a43] shadow-sm"
                      : "text-[#64748b] hover:text-[#102a43]"
                  }`}
                >
                  <FiFileText className="h-3.5 w-3.5" />
                  {t("tasks.tabs.details", "Details")}
                </button>

                <button
                  type="button"
                  onClick={() => setDetailsTab("submissions")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                    detailsTab === "submissions"
                      ? "bg-white text-[#102a43] shadow-sm"
                      : "text-[#64748b] hover:text-[#102a43]"
                  }`}
                >
                  <FiUploadCloud className="h-3.5 w-3.5" />
                  {isRtl ? "التسليمات" : "Submissions"}
                  {detailsTask?.submissions?.length > 0 && (
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#e2e8f0] px-1 text-[10px] text-[#64748b]">
                      {detailsTask.submissions.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDetailsTab("activity")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                    detailsTab === "activity"
                      ? "bg-white text-[#102a43] shadow-sm"
                      : "text-[#64748b] hover:text-[#102a43]"
                  }`}
                >
                  <FiActivity className="h-3.5 w-3.5" />
                  {t("tasks.tabs.activity", "Activity")}
                  {!activitiesLoading && activities.length > 0 && (
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#e2e8f0] px-1 text-[10px] text-[#64748b]">
                      {activities.length}
                    </span>
                  )}
                </button>
              </div>

              {/* ======== TAB: DETAILS ======== */}
              {detailsTab === "details" && (
                <>
                  {detailsLoading && (
                    <div className="space-y-3 py-4">
                      <div className="h-4 w-3/4 rounded bg-[#f1f5f9] animate-pulse" />
                      <div className="h-4 w-full rounded bg-[#f1f5f9] animate-pulse" />
                      <div className="h-4 w-1/2 rounded bg-[#f1f5f9] animate-pulse" />
                      <div className="h-20 w-full rounded-xl bg-[#f1f5f9] animate-pulse" />
                    </div>
                  )}

                  {detailsError && (
                    <div className="flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4 mb-2">
                      <FiAlertCircle className="text-[#dc2626] shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-[#dc2626] m-0">
                        {detailsError}
                      </p>
                    </div>
                  )}

                  {detailsTask && !detailsLoading && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${detailsTask.priorityBadge}`}
                        >
                          <FiFlag className="h-3 w-3 me-1.5" />
                          {getPriorityLabel(detailsTask.priority)}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            closeTaskDetails();
                            openStatusModal(detailsTask);
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80 ${
                            STATUS_BADGES[detailsTask.statusLabel] ||
                            "bg-[#f1f5f9] text-[#64748b]"
                          }`}
                          title={t("tasks.changeStatus", "Change status")}
                        >
                          <FiRefreshCw className="h-3 w-3" />
                          {getApiStatusLabel(detailsTask.statusLabel)}
                        </button>
                      </div>

                      <div className="rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                          {t("tasks.form.description", "Description")}
                        </p>
                        <p className="text-sm text-[#486581] leading-relaxed m-0">
                          {detailsTask.description ||
                            t(
                              "tasks.noDescription",
                              "No description provided.",
                            )}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#64748b]">
                            {t("tasks.form.progress", "Progress")}
                          </span>
                          <span className="font-bold text-[#102a43]">
                            {detailsTask.progress}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${detailsTask.progress}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`h-full rounded-full ${detailsTask.progressColor}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#e2e8f0] p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] mb-1">
                            <FiCalendar className="h-3 w-3" />
                            {t("tasks.form.deadline", "Deadline")}
                          </div>
                          <p className="text-xs font-bold text-[#102a43] m-0">
                            {detailsTask.defaultDueDate || "—"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#e2e8f0] p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] mb-1">
                            <FiUser className="h-3 w-3" />
                            {t("tasks.detailsCreatedBy", "Created by")}
                          </div>
                          <p className="text-xs font-bold text-[#102a43] m-0">
                            {t("tasks.userNumber", {
                              id: detailsTask.createdBy || "—",
                              defaultValue: "User #{{id}}",
                            })}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#e2e8f0] p-3.5">
                          <p className="text-[11px] font-semibold text-[#94a3b8] mb-1">
                            {t("tasks.detailsCreatedAt", "Created at")}
                          </p>
                          <p className="text-xs font-bold text-[#102a43] m-0">
                            {detailsTask.createdAt}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#e2e8f0] p-3.5">
                          <p className="text-[11px] font-semibold text-[#94a3b8] mb-1">
                            {t("tasks.detailsUpdatedAt", "Last updated")}
                          </p>
                          <p className="text-xs font-bold text-[#102a43] m-0">
                            {detailsTask.updatedAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            closeTaskDetails();
                            openAssignModal(detailsTask);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#c6e7d0] bg-[#f0faf3] py-3 px-4 text-xs font-semibold text-[#2f855a] hover:bg-[#e6f5eb] transition"
                        >
                          <FiUserPlus className="h-4 w-4" />
                          <span>{t("tasks.assignUser", "Assign")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            closeTaskDetails();
                            openEditModal(detailsTask);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#d9e2ec] bg-white py-3 px-4 text-xs font-semibold text-[#102a43] hover:bg-[#f8fafc] transition shadow-sm"
                        >
                          <FiEdit3 className="h-4 w-4" />
                          <span>{t("tasks.editTask", "Edit")}</span>
                        </button>

                        {detailsTask.status === "in-progress" && (
                          <button
                            type="button"
                            onClick={() => {
                              closeTaskDetails();
                              handleOpenSubmissionFlow(detailsTask);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1c364f] py-3 px-4 text-xs font-semibold text-white hover:bg-[#254360] transition shadow-sm"
                          >
                            <FiUploadCloud className="h-4 w-4" />
                            <span>
                              {t("tasks.submitDeliverable", "Submit")}
                            </span>
                          </button>
                        )}

                        {detailsTask.status === "under-review" && (
                          <button
                            type="button"
                            onClick={() => setDetailsTab("submissions")}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-300 py-3 px-4 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 transition shadow-sm"
                          >
                            <FiClock className="h-4 w-4" />
                            <span>
                              {t("tasks.underReviewView", "Deliverable Under Review")}
                            </span>
                          </button>
                        )}

                        {detailsTask.status === "completed" && (
                          <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-300 py-3 px-4 text-xs font-semibold text-emerald-700">
                            <FiCheckCircle className="h-4 w-4" />
                            <span>
                              {t("tasks.completedStatus", "Completed")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ======== TAB: SUBMISSIONS & DELIVERABLES ======== */}
              {detailsTab === "submissions" && (
                <div className="space-y-4">
                  {detailsTask?.submissions &&
                  detailsTask.submissions.length > 0 ? (
                    detailsTask.submissions.map((sub, sIdx) => {
                      const isChangesReq = sub.status === "Changes Requested";
                      const isApproved = sub.status === "Approved";
                      const isRejected = sub.status === "Rejected";

                      return (
                        <div
                          key={sub.id || sIdx}
                          className="rounded-2xl border border-[#e2e8f0] bg-white p-4 space-y-3.5 shadow-sm"
                        >
                          {/* Submission Header */}
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isApproved
                                  ? "bg-[#f0fdf4] text-[#15803d]"
                                  : isChangesReq
                                    ? "bg-[#fff7ed] text-[#c2410c]"
                                    : isRejected
                                      ? "bg-[#fef2f2] text-[#b91c1c]"
                                      : "bg-[#fef3c7] text-[#b45309]"
                              }`}
                            >
                              {getSubmissionStatusLabel(sub.status)}
                            </span>
                            <span className="text-[11px] text-[#94a3b8]">
                              {formatDateTime(
                                sub.submitted_at || sub.created_at,
                                isRtl,
                              )}
                            </span>
                          </div>

                          {/* Submitter Note */}
                          {sub.note && (
                            <div className="rounded-xl bg-[#f8fafc] p-3 text-xs text-[#334155]">
                              <p className="font-semibold text-[#102a43] mb-1">
                                {isRtl
                                  ? "ملاحظات التسليم:"
                                  : "Deliverable Note:"}
                              </p>
                              <p className="leading-relaxed">{sub.note}</p>
                            </div>
                          )}

                          {/* Reviewer Feedback / Changes Requested Alert */}
                          {isChangesReq && (
                            <div className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] p-3 text-xs text-[#9a3412] space-y-2">
                              <div className="flex items-center gap-1.5 font-bold">
                                <FiAlertCircle className="w-4 h-4 text-[#ea580c]" />
                                <span>
                                  {isRtl
                                    ? "مطلوب تعديلات من المسؤول:"
                                    : "Changes Requested by Reviewer:"}
                                </span>
                              </div>
                              <p className="leading-relaxed">
                                {sub.reviews?.[sub.reviews.length - 1]
                                  ?.feedback ||
                                  sub.feedback ||
                                  (isRtl
                                    ? "يرجى مراجعة التعديلات وإعادة الإرسال."
                                    : "Please revise your work and resubmit.")}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  closeTaskDetails();
                                  handleOpenTaskUpdate(detailsTask, sub);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ea580c] text-white text-xs font-bold hover:bg-[#c2410c] transition shadow-sm"
                              >
                                <FiRefreshCw className="w-3.5 h-3.5" />
                                <span>
                                  {isRtl
                                    ? "إعادة التسليم بعد التعديل"
                                    : "Resubmit Deliverable"}
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Attachments Section */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                                {isRtl ? "الملفات المرفقة" : "Attachments"}
                              </p>

                              {/* Upload additional attachment button */}
                              <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-[#2563eb] hover:underline">
                                <FiPaperclip className="w-3 h-3" />
                                <span>
                                  {attachingFile
                                    ? isRtl
                                      ? "جارٍ الرفع..."
                                      : "Uploading..."
                                    : isRtl
                                      ? "إرفاق ملف إضافي"
                                      : "Attach File"}
                                </span>
                                <input
                                  type="file"
                                  disabled={attachingFile}
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                      handleAttachExtraFile(sub.id, file);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            </div>

                            {sub.attachments && sub.attachments.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {sub.attachments.map((file) => (
                                  <a
                                    key={file.id || file.file_name}
                                    href={getFileUrl(file.file_path)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={file.file_name}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#334155] transition border border-[#e2e8f0]"
                                  >
                                    <FiFileText className="w-3.5 h-3.5 text-[#2563eb]" />
                                    <span className="truncate max-w-[180px]">
                                      {file.file_name}
                                    </span>
                                    <FiExternalLink className="w-3 h-3 text-[#94a3b8]" />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[#94a3b8] italic">
                                {isRtl
                                  ? "لا توجد ملفات مرفقة"
                                  : "No files attached"}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <FiUploadCloud className="h-9 w-9 text-[#94a3b8] mb-2" />
                      <p className="text-sm font-semibold text-[#102a43] m-0">
                        {isRtl
                          ? "لا توجد تسليمات لهذه المهمة بعد"
                          : "No submissions for this task yet"}
                      </p>
                      <p className="text-xs text-[#829ab1] mt-1 max-w-xs">
                        {isRtl
                          ? "عند إكمال المهمة أو جزء منها، يمكنك إرسال تسليم ليراجعه المشرف."
                          : "When you complete work on this task, submit your deliverable for review."}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          closeTaskDetails();
                          handleOpenSubmissionFlow(detailsTask);
                        }}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c364f] text-white text-xs font-semibold hover:bg-[#254360] transition shadow-sm"
                      >
                        <FiUploadCloud className="w-4 h-4" />
                        <span>
                          {t("tasks.submitDeliverable", "Submit Deliverable")}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ======== TAB: ACTIVITY (GET /tasks/{id}/activities) ======== */}
              {detailsTab === "activity" && (
                <div>
                  {/* Loading */}
                  {activitiesLoading && (
                    <div className="space-y-4 py-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f1f5f9] animate-pulse shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3.5 w-2/3 rounded bg-[#f1f5f9] animate-pulse" />
                            <div className="h-3 w-1/3 rounded bg-[#f1f5f9] animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error */}
                  {activitiesError && !activitiesLoading && (
                    <div className="flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4">
                      <FiAlertCircle className="text-[#dc2626] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#dc2626] m-0">
                          {activitiesError}
                        </p>
                        {detailsTask && (
                          <button
                            type="button"
                            onClick={() => fetchActivities(detailsTask.apiId)}
                            className="mt-2 h-8 px-3 bg-white border border-[#fecaca] rounded-lg text-[#dc2626] text-[12px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#fef2f2]"
                          >
                            {t("tasks.retry", "Retry")}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Empty */}
                  {!activitiesLoading &&
                    !activitiesError &&
                    activities.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <FiActivity className="h-8 w-8 text-[#94a3b8] mb-2" />
                        <p className="text-sm font-semibold text-[#102a43] m-0">
                          {t("tasks.noActivity", "No activity yet")}
                        </p>
                        <p className="text-xs text-[#829ab1] mt-1">
                          {t(
                            "tasks.noActivityDescription",
                            "Actions on this task will appear here.",
                          )}
                        </p>
                      </div>
                    )}

                  {/* Timeline */}
                  {!activitiesLoading &&
                    !activitiesError &&
                    activities.length > 0 && (
                      <div className="relative ps-2">
                        {activities.map((activity, index) => {
                          const styles = getActivityStyles(activity.action);
                          const isLast = index === activities.length - 1;

                          return (
                            <div
                              key={activity.id}
                              className="relative flex gap-4 pb-6 last:pb-0"
                            >
                              {/* الخط الواصل */}
                              {!isLast && (
                                <div className="absolute start-[19px] top-10 bottom-0 w-px bg-[#e2e8f0]" />
                              )}

                              {/* الدايرة */}
                              <div
                                className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm ${styles.dotColor} text-white`}
                              >
                                {styles.icon}
                              </div>

                              {/* المحتوى */}
                              <div className="flex-1 min-w-0 pt-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${styles.badge}`}
                                  >
                                    {activity.action}
                                  </span>

                                  <span className="inline-flex items-center gap-1 text-[11px] text-[#94a3b8]">
                                    <FiUser className="h-3 w-3" />
                                    {t("tasks.userNumber", {
                                      id: activity.user_id,
                                      defaultValue: "User #{{id}}",
                                    })}
                                  </span>
                                </div>

                                <p className="text-sm text-[#486581] font-medium m-0 leading-snug">
                                  {activity.description}
                                </p>

                                {/* old → new لو موجودين */}
                                {(activity.old_value !== null ||
                                  activity.new_value !== null) && (
                                  <div className="mt-1.5 inline-flex items-center gap-2 rounded-lg bg-[#f8fafc] border border-[#f1f5f9] px-2.5 py-1 text-[11px] text-[#64748b]">
                                    <span className="line-through decoration-[#cbd5e1]">
                                      {activity.old_value ?? "—"}
                                    </span>
                                    <span className="text-[#94a3b8]">→</span>
                                    <span className="font-bold text-[#102a43]">
                                      {activity.new_value ?? "—"}
                                    </span>
                                  </div>
                                )}

                                <p className="text-[11px] text-[#94a3b8] mt-1.5 m-0">
                                  {formatDateTime(activity.created_at, isRtl)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. STATUS CHANGE MODAL */}
      <AnimatePresence>
        {showStatus && statusTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeStatusModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full max-w-[420px] rounded-2xl bg-white p-7 shadow-2xl"
            >
              <div className="flex items-start justify-between pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {t("tasks.changeStatus", "CHANGE STATUS")}
                  </p>
                  <h2 className="text-base font-bold text-[#102a43] mt-0.5">
                    {statusTask.defaultTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeStatusModal}
                  disabled={changingStatus}
                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition disabled:opacity-50"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-[#829ab1]">
                  {t("tasks.currentStatus", "Current status")}:
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                    STATUS_BADGES[statusTask.statusLabel] ||
                    "bg-[#f1f5f9] text-[#64748b]"
                  }`}
                >
                  {getApiStatusLabel(statusTask.statusLabel)}
                </span>
              </div>

              {statusError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3">
                  <FiAlertCircle className="text-[#dc2626] shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-[#dc2626] m-0">
                    {statusError}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {STATUSES.map((status) => {
                  const isSelected = newStatus === status;
                  const isCurrent = statusTask.statusLabel === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={isCurrent || changingStatus}
                      onClick={() => setNewStatus(status)}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                        isCurrent
                          ? "border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8] cursor-default"
                          : isSelected
                            ? "border-[#1c364f] bg-[#1c364f] text-white shadow-sm"
                            : "border-[#e2e8f0] bg-white text-[#486581] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                      }`}
                    >
                      {isCurrent
                        ? `${getApiStatusLabel(status)} (${t(
                            "tasks.current",
                            "current",
                          )})`
                        : getApiStatusLabel(status)}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeStatusModal}
                  disabled={changingStatus}
                  className="h-10 px-[18px] rounded-xl border border-[#d9e2ec] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition disabled:opacity-60"
                >
                  {t("tasks.form.cancel", "Cancel")}
                </button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleStatusChangeSubmit}
                  disabled={
                    changingStatus || newStatus === statusTask.statusLabel
                  }
                  className="h-10 px-[22px] rounded-xl bg-[#1c364f] text-xs font-semibold text-white hover:bg-[#254360] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {changingStatus
                    ? t("tasks.form.updating", "Updating...")
                    : t("tasks.form.updateStatus", "Update Status")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. ASSIGN USER MODAL */}
      <AnimatePresence>
        {showAssign && assigningTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAssignModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full max-w-[440px] rounded-2xl bg-white p-7 shadow-2xl"
            >
              <div className="flex items-start justify-between pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {t("tasks.assignUser", "ASSIGN TASK")}
                  </p>
                  <h2 className="text-lg font-bold text-[#102a43] mt-0.5">
                    {assigningTask.defaultTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#f0faf3] border border-[#c6e7d0] p-4 mb-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f3eb] text-[#3f7d5a]">
                  <FiUserPlus className="h-4 w-4" />
                </div>
                <p className="text-xs text-[#486581] leading-relaxed m-0">
                  Enter the <strong>User ID</strong> to assign this task to
                  them. The employee will see this task in their dashboard.
                </p>
              </div>

              {assignError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3">
                  <FiAlertCircle className="text-[#dc2626] shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-[#dc2626] m-0">
                    {assignError}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleAssignSubmit}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="assign-user-id"
                    className="text-xs font-semibold text-[#64748b]"
                  >
                    {t("tasks.form.userId", "User ID")}{" "}
                    <span className="text-[#e05252]">*</span>
                  </label>
                  <input
                    id="assign-user-id"
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    required
                    className="h-[42px] w-full rounded-xl border border-[#d9e2ec] px-3.5 text-xs text-[#102a43] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                  />
                </div>

                <div className="flex justify-end gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    disabled={assigning}
                    className="h-10 px-[18px] rounded-xl border border-[#d9e2ec] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition disabled:opacity-60"
                  >
                    {t("tasks.form.cancel", "Cancel")}
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={assigning}
                    className="h-10 px-[22px] rounded-xl bg-[#2f855a] text-xs font-semibold text-white hover:bg-[#27714c] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    <FiUserPlus className="h-4 w-4" />
                    <span>
                      {assigning
                        ? t("tasks.form.assigning", "Assigning...")
                        : t("tasks.form.assignBtn", "Assign Task")}
                    </span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. EDIT TASK MODAL */}
      <AnimatePresence>
        {showEditTask && editingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEditModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full max-w-[520px] rounded-2xl bg-white p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {t("tasks.editTask", "EDIT TASK")}
                  </p>
                  <h2 className="text-lg font-bold text-[#102a43] mt-0.5">
                    {editingTask.defaultTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {editError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3">
                  <FiAlertCircle className="text-[#dc2626] shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-[#dc2626] m-0">
                    {editError}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleEditTaskSubmit}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="edit-task-title"
                    className="text-xs font-semibold text-[#64748b]"
                  >
                    {t("tasks.form.title", "Title")}{" "}
                    <span className="text-[#e05252]">*</span>
                  </label>
                  <input
                    id="edit-task-title"
                    name="title"
                    type="text"
                    value={editForm.title}
                    onChange={handleEditInputChange}
                    required
                    className="h-[42px] w-full rounded-xl border border-[#d9e2ec] px-3.5 text-xs text-[#102a43] focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="edit-task-description"
                    className="text-xs font-semibold text-[#64748b]"
                  >
                    {t("tasks.form.description", "Description")}
                  </label>
                  <textarea
                    id="edit-task-description"
                    name="description"
                    rows={3}
                    value={editForm.description}
                    onChange={handleEditInputChange}
                    className="w-full resize-none rounded-xl border border-[#d9e2ec] px-3.5 py-2.5 text-xs text-[#102a43] focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="edit-task-priority"
                      className="text-xs font-semibold text-[#64748b]"
                    >
                      {t("tasks.form.priority", "Priority")}{" "}
                      <span className="text-[#e05252]">*</span>
                    </label>
                    <select
                      id="edit-task-priority"
                      name="priority"
                      value={editForm.priority}
                      onChange={handleEditInputChange}
                      className="h-[42px] w-full rounded-xl border border-[#d9e2ec] px-3 text-xs text-[#102a43] bg-white focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="edit-task-deadline"
                      className="text-xs font-semibold text-[#64748b]"
                    >
                      {t("tasks.form.deadline", "Deadline")}{" "}
                      <span className="text-[#e05252]">*</span>
                    </label>
                    <input
                      id="edit-task-deadline"
                      name="deadline"
                      type="datetime-local"
                      value={editForm.deadline}
                      onChange={handleEditInputChange}
                      required
                      className="h-[42px] w-full rounded-xl border border-[#d9e2ec] px-3 text-xs text-[#102a43] bg-white focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={editing}
                    className="h-10 px-[18px] rounded-xl border border-[#d9e2ec] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition disabled:opacity-60"
                  >
                    {t("tasks.form.cancel", "Cancel")}
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={editing}
                    className="h-10 px-[22px] rounded-xl bg-[#1c364f] text-xs font-semibold text-white hover:bg-[#254360] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {editing
                      ? t("tasks.form.saving", "Saving...")
                      : t("tasks.form.saveChanges", "Save Changes")}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. CREATE TASK MODAL */}
      <AnimatePresence>
        {showCreateTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCreateModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full max-w-[520px] rounded-2xl bg-white p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {t("tasks.workManagement", "WORK MANAGEMENT")}
                  </p>
                  <h2 className="text-lg font-bold text-[#102a43] mt-0.5">
                    {t("tasks.createTask", "Create Task")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {createError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3">
                  <FiAlertCircle className="text-[#dc2626] shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-[#dc2626] m-0">
                    {createError}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleCreateTaskSubmit}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="task-title"
                    className="text-xs font-semibold text-[#64748b]"
                  >
                    {t("tasks.form.title", "Title")}{" "}
                    <span className="text-[#e05252]">*</span>
                  </label>
                  <input
                    id="task-title"
                    name="title"
                    type="text"
                    placeholder={t(
                      "tasks.form.titlePlaceholder",
                      "e.g. Complete API Documentation",
                    )}
                    value={createForm.title}
                    onChange={handleCreateInputChange}
                    required
                    className="h-[42px] w-full rounded-xl border border-[#d9e2ec] px-3.5 text-xs text-[#102a43] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="task-description"
                    className="text-xs font-semibold text-[#64748b]"
                  >
                    {t("tasks.form.description", "Description")}
                  </label>
                  <textarea
                    id="task-description"
                    name="description"
                    rows={3}
                    placeholder={t(
                      "tasks.form.descriptionPlaceholder",
                      "Describe the task...",
                    )}
                    value={createForm.description}
                    onChange={handleCreateInputChange}
                    className="w-full resize-none rounded-xl border border-[#d9e2ec] px-3.5 py-2.5 text-xs text-[#102a43] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="task-priority"
                      className="text-xs font-semibold text-[#64748b]"
                    >
                      {t("tasks.form.priority", "Priority")}{" "}
                      <span className="text-[#e05252]">*</span>
                    </label>
                    <select
                      id="task-priority"
                      name="priority"
                      value={createForm.priority}
                      onChange={handleCreateInputChange}
                      className="h-[42px] w-full rounded-xl border border-[#d9e2ec] px-3 text-xs text-[#102a43] bg-white focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="task-deadline"
                      className="text-xs font-semibold text-[#64748b]"
                    >
                      {t("tasks.form.deadline", "Deadline")}{" "}
                      <span className="text-[#e05252]">*</span>
                    </label>
                    <input
                      id="task-deadline"
                      name="deadline"
                      type="datetime-local"
                      value={createForm.deadline}
                      onChange={handleCreateInputChange}
                      required
                      className="h-[42px] w-full rounded-xl border border-[#d9e2ec] px-3 text-xs text-[#102a43] bg-white focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={creating}
                    className="h-10 px-[18px] rounded-xl border border-[#d9e2ec] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition disabled:opacity-60"
                  >
                    {t("tasks.form.cancel", "Cancel")}
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={creating}
                    className="h-10 px-[22px] rounded-xl bg-[#1c364f] text-xs font-semibold text-white hover:bg-[#254360] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    <FiPlus className="h-4 w-4" />
                    <span>
                      {creating
                        ? t("tasks.form.creating", "Creating...")
                        : t("tasks.form.createTaskBtn", "Create Task")}
                    </span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. Submit Progress Modal */}
      <AnimatePresence>
        {showTaskUpdate && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseTaskUpdate}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full max-w-[500px] rounded-2xl bg-white p-7 shadow-2xl"
            >
              <div className="flex items-start justify-between pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {resubmissionTarget
                      ? isRtl
                        ? "إعادة تسليم المهمة"
                        : "RESUBMISSION"
                      : t("tasks.taskUpdate", "TASK UPDATE")}
                  </p>
                  <h2 className="text-lg font-bold text-[#102a43] mt-0.5">
                    {resubmissionTarget
                      ? isRtl
                        ? "إعادة تسليم العمل بعد التعديل"
                        : "Resubmit Deliverable"
                      : t("tasks.submitDeliverable", "Submit deliverable")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCloseTaskUpdate}
                  disabled={submittingProgress}
                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition disabled:opacity-50"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-xl bg-[#f8fafc] px-4 py-3 border border-[#f1f5f9] mb-4">
                <p className="text-xs font-semibold text-[#102a43]">
                  {selectedTask.defaultTitle}
                </p>
                {resubmissionTarget && (
                  <p className="text-[11px] text-[#c2410c] mt-1 font-medium">
                    {isRtl
                      ? "تقوم الآن بإعادة التسليم استجابة لطلب التعديلات من المشرف."
                      : "You are resubmitting this deliverable following the change request."}
                  </p>
                )}
              </div>

              {progressError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3">
                  <FiAlertCircle className="text-[#dc2626] shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-[#dc2626] m-0">
                    {progressError}
                  </p>
                </div>
              )}

              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#64748b]">
                    {t("tasks.form.progress", "Progress")}
                  </span>
                  <span className="font-bold text-[#102a43]">
                    {progressVal}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressVal}
                  onChange={(e) => setProgressVal(Number(e.target.value))}
                  style={{
                    background: isRtl
                      ? `linear-gradient(to left, #2f855a 0%, #2f855a ${progressVal}%, #e2e8f0 ${progressVal}%, #e2e8f0 100%)`
                      : `linear-gradient(to right, #2f855a 0%, #2f855a ${progressVal}%, #e2e8f0 ${progressVal}%, #e2e8f0 100%)`,
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#2f855a] focus:outline-none 
                    [&::-webkit-slider-thumb]:h-3.5 
                    [&::-webkit-slider-thumb]:w-3.5 
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-[#2f855a] 
                    [&::-webkit-slider-thumb]:shadow-sm
                    [&::-moz-range-thumb]:h-3.5 
                    [&::-moz-range-thumb]:w-3.5 
                    [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:border-0 
                    [&::-moz-range-thumb]:bg-[#2f855a]"
                />
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                  {t("tasks.form.notes", "Notes")}{" "}
                  <span className="text-[#dc2626]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    resubmissionTarget
                      ? isRtl
                        ? "وضح ما قمت بتعديله في هذا التسليم الجديد..."
                        : "Describe the changes made in this resubmission..."
                      : t(
                          "tasks.form.notesPlaceholder",
                          "Add notes about this deliverable...",
                        )
                  }
                  required
                  className="w-full resize-none rounded-xl border border-[#d9e2ec] px-3.5 py-2.5 text-xs text-[#102a43] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                />
              </div>

              <div className="mb-6">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e2e8f0] bg-[#fafcfd] py-6 px-4 hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition text-center">
                  <input
                    type="file"
                    accept=".pdf,.docx,.png,.zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
                    <FiUploadCloud className="h-5 w-5" />
                  </div>
                  {uploadedFile ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#102a43] truncate max-w-xs">
                        {uploadedFile.name}
                      </p>
                      <p className="text-[10px] text-[#94a3b8]">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#102a43]">
                        {t("tasks.form.uploadFile", "Tap to upload a file")}
                      </p>
                      <p className="text-[10px] text-[#94a3b8]">
                        {t(
                          "tasks.form.uploadHint",
                          "PDF, DOCX, PNG up to 10MB",
                        )}
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <motion.button
                whileHover={{ scale: submittingProgress ? 1 : 1.01 }}
                whileTap={{ scale: submittingProgress ? 1 : 0.98 }}
                type="button"
                onClick={handleSubmitForReview}
                disabled={submittingProgress}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1c364f] py-3 px-4 text-xs font-semibold text-white hover:bg-[#254360] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>
                  {submittingProgress
                    ? isRtl
                      ? "جارٍ الإرسال..."
                      : "Submitting..."
                    : resubmissionTarget
                      ? isRtl
                        ? "إعادة التسليم"
                        : "Resubmit Deliverable"
                      : t("tasks.form.submitForReview", "Submit for review")}
                </span>
                {!submittingProgress && (
                  <span className="text-sm">{isRtl ? "←" : "→"}</span>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10. TOAST */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed top-5 ${
              isRtl ? "left-5" : "right-5"
            } z-[100] flex items-center gap-3 rounded-xl border border-[#d9e2ec] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(16,42,67,0.12)]`}
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-[#e8f3eb] text-[#3f7d5a]">
              <FiCheckCircle className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#102a43]">
                {toast.title}
              </p>
              <p className="mt-0.5 text-xs text-[#829ab1]">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
