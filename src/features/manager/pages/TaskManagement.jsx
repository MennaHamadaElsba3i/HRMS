import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiPlus,
  FiMoreHorizontal,
  FiX,
  FiCalendar,
  FiUser,
  FiUserPlus,
  FiEdit3,
  FiActivity,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiFlag,
  FiEye,
} from "react-icons/fi";
import {
  getTasks,
  createTask,
  updateTask,
  assignTask,
  getTaskDetails,
  getTaskActivities,
  updateTaskStatus,
  updateTaskProgress,
} from "../../../services/tasksApi";
import axiosInstance from "../../../utils/axiosInstance";

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

const tableStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const PRIORITY_STYLES = {
  urgent: "bg-[#fef2f2] text-[#ef4444] border border-[#fecaca]",
  high: "bg-[#fefce8] text-[#eab308] border border-[#fef08a]",
  medium: "bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]",
  normal: "bg-[#eff6ff] text-[#3b82f6] border border-[#bfdbfe]",
  low: "bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]",
};

const STATUS_BADGES = {
  Pending: "bg-[#fffaf0] text-[#d97706] border border-[#fde68a]",
  "In Progress": "bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]",
  "Under Review": "bg-[#fef3c7] text-[#b45309] border border-[#fde68a]",
  "under-review": "bg-[#fef3c7] text-[#b45309] border border-[#fde68a]",
  "Changes Requested": "bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5]",
  Completed: "bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]",
  Closed: "bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]",
};

const FILTERS = [
  { id: "all", labelEn: "All", labelAr: "الكل" },
  { id: "Pending", labelEn: "Pending", labelAr: "معلقة" },
  { id: "In Progress", labelEn: "In Progress", labelAr: "قيد التنفيذ" },
  { id: "Completed", labelEn: "Completed", labelAr: "مكتملة" },
  { id: "Closed", labelEn: "Closed", labelAr: "مغلقة" },
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Pending", "In Progress", "Completed", "Closed"];

const getTaskStatusTranslationKey = (status) => {
  const keys = {
    pending: "statusPending",
    "in progress": "statusInProgress",
    completed: "statusCompleted",
    closed: "statusClosed",
    "under review": "statusUnderReview",
    "changes requested": "statusChangesRequested",
  };
  return keys[String(status || "").trim().toLowerCase()];
};

const getTaskPriorityTranslationKey = (priority) => {
  const keys = {
    low: "priorityLow",
    medium: "priorityMedium",
    high: "priorityHigh",
    urgent: "priorityUrgent",
    normal: "priorityNormal",
  };
  return keys[String(priority || "").trim().toLowerCase()];
};

const getEmployeeRoleNames = (employee) => {
  const roleValues = [
    employee.role,
    employee.role_name,
    employee.role_label,
    employee.user_role,
    ...(Array.isArray(employee.roles) ? employee.roles : []),
  ];
  return roleValues
    .flatMap((role) => {
      if (typeof role === "string") return [role];
      if (role && typeof role === "object") {
        return [role.name, role.role_name, role.label].filter(Boolean);
      }
      return [];
    })
    .map((role) => role.trim().toLowerCase());
};

const getInitials = (name) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const formatDeadline = (iso, isRtl) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (iso, isRtl) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(isRtl ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDeadlineToInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDeadlineToApi = (datetimeLocal) => {
  if (!datetimeLocal) return "";
  return `${datetimeLocal.replace("T", " ")}:00`;
};

const MENU_WIDTH_CLASS = "w-60";

const TaskManagement = ({ role: propRole }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isRtl = i18n.language?.startsWith("ar");
  const getTaskStatusLabel = (status) => {
    const key = getTaskStatusTranslationKey(status);
    return key ? t(`managerTasks.${key}`, status) : status;
  };
  const getTaskPriorityLabel = (priority) => {
    const key = getTaskPriorityTranslationKey(priority);
    return key ? t(`managerTasks.${key}`, priority) : priority;
  };
  const getTaskTitleLabel = (title) => {
    if (!isRtl || !title) return title;
    const titleTranslations = [
      [
        /Implement Employee Attendance API/gi,
        "managerTasks.taskEmployeeAttendanceApiName",
      ],
      [/Implement Leave Management/gi, "managerTasks.taskLeaveManagementName"],
      [/Implement OAuth2 Flow/gi, "managerTasks.taskOauth2FlowName"],
      [/Refactor billing hooks/gi, "managerTasks.taskBillingHooksName"],
      [/QA mobile release/gi, "managerTasks.taskQaMobileReleaseName"],
      [/Update API documentation/gi, "managerTasks.taskUpdateApiDocsName"],
    ];
    const translatedTitle = titleTranslations.reduce(
      (translatedTitle, [pattern, key]) =>
        translatedTitle.replace(pattern, t(key)),
      title,
    );
    return translatedTitle.replace(/\bahmed\b/gi, "أحمد");
  };
  const getAssignmentErrorMessage = (error) => {
    const message = error.response?.data?.message || error.message || "";
    if (/selected user must have the employee role/i.test(message)) {
      return t(
        "managerTasks.employeeRoleRequired",
        "Please select a user with the Employee role.",
      );
    }
    return message || t("managerTasks.assignmentFailed", "Assignment failed.");
  };

  // Determine current portal role
  const portalRole = useMemo(() => {
    if (propRole) return propRole;
    if (location.pathname.startsWith("/admin")) return "Owner";
    if (location.pathname.startsWith("/hr")) return "HR";
    return "Manager";
  }, [propRole, location.pathname]);

  // Data States
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState(
    () => location.state?.assigneeFilter ?? null
  );

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [total, setTotal] = useState(0);

  // Reassign Floating Menu
  const [reassignMenu, setReassignMenu] = useState(null);
  const menuRef = useRef(null);

  // Create Task Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "High",
    deadline: "",
    assignToUserId: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Edit Task Modal
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    deadline: "",
  });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState(null);

  // Status Change Modal
  const [statusTask, setStatusTask] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Activity History Modal
  const [activityTask, setActivityTask] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Fetch Team Members (Dropdown & Reassign)
  const fetchEmployees = useCallback(async () => {
    try {
      const extractEmployees = (res) => {
        const d = res?.data;
        if (!d) return [];
        if (Array.isArray(d?.data?.employees)) return d.data.employees;
        if (Array.isArray(d?.employees)) return d.employees;
        if (Array.isArray(d?.data?.data)) return d.data.data;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d)) return d;
        return [];
      };

      let emps = [];
      const isHrOrOwner = portalRole === "HR" || portalRole === "Owner";

      if (isHrOrOwner) {
        // HR & Owner: GET /api/employees is the official route
        try {
          const res = await axiosInstance.get("/employees", {
            params: { per_page: 100, role: "Employee" },
          });
          emps = extractEmployees(res);
        } catch (err) {
          console.warn(
            "Could not load /employees, attempting /manager/employees fallback:",
            err
          );
        }

        if (emps.length === 0) {
          try {
            const fallbackRes = await axiosInstance.get("/manager/employees", {
              params: { per_page: 100 },
            });
            emps = extractEmployees(fallbackRes);
          } catch (e) {
            // ignore
          }
        }
      } else {
        // Manager: GET /api/manager/employees is the official route
        try {
          const res = await axiosInstance.get("/manager/employees", {
            params: { per_page: 100 },
          });
          emps = extractEmployees(res);
        } catch (err) {
          console.warn(
            "Could not load /manager/employees, attempting /employees fallback:",
            err
          );
        }

        if (emps.length === 0) {
          try {
            const fallbackRes = await axiosInstance.get("/employees", {
              params: { per_page: 100 },
            });
            emps = extractEmployees(fallbackRes);
          } catch (e) {
            // ignore
          }
        }
      }

      const employeeUsers = Array.isArray(emps)
        ? emps.filter((employee) =>
            getEmployeeRoleNames(employee).includes("employee"),
          )
        : [];

      setTeamMembers(
        employeeUsers.map((e) => ({
            id: e.id,
            name:
              e.name ||
              `${e.first_name || ""} ${e.last_name || ""}`.trim() ||
              `User #${e.id}`,
            email: e.email,
            role: e.role_label || e.role,
            job_title: e.job_title,
            employee_code: e.employee_code,
          })),
      );
    } catch (e) {
      console.warn("Could not load employees list:", e);
    }
  }, [portalRole]);

  // Fetch Tasks List
  const fetchTasksList = useCallback(
    async (currentPage = 1, showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
        const params = {
          page: currentPage,
          per_page: perPage,
          lang,
        };

        if (activeFilter !== "all") {
          params.status = activeFilter;
        }

        const res = await getTasks(params);
        const dataPayload = res?.data;

        const list = Array.isArray(dataPayload)
          ? dataPayload
          : Array.isArray(dataPayload?.data)
          ? dataPayload.data
          : [];

        setTasks(list);
        if (dataPayload?.total !== undefined) {
          setTotal(dataPayload.total);
          setPage(dataPayload.current_page || currentPage);
          setPerPage(dataPayload.per_page || perPage);
        } else {
          setTotal(list.length);
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            t("managerTasks.fetchError", "Failed to load tasks list.")
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter, perPage, i18n.language, t]
  );

  useEffect(() => {
    fetchTasksList(page);
  }, [fetchTasksList, page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (location.state?.assigneeFilter) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state?.assigneeFilter, navigate]);

  // Click outside to close reassign menu
  useEffect(() => {
    if (!reassignMenu) return undefined;
    const close = () => setReassignMenu(null);
    const onMouseDown = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (e.target.closest?.("[data-reassign-trigger]")) return;
      close();
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [reassignMenu]);

  // Toast Helper
  const showToast = (message, isError = false) => {
    toast.custom(
      (toastItem) => (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={
            toastItem.visible
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 12, scale: 0.96 }
          }
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${
            isError ? "bg-[#b91c1c]" : "bg-[#102a43]"
          }`}
        >
          {isError ? (
            <FiAlertCircle className="w-4 h-4 text-[#fca5a5]" />
          ) : (
            <FiCheckCircle className="w-4 h-4 text-[#86efac]" />
          )}
          <span>{message}</span>
        </motion.div>
      ),
      { position: isRtl ? "bottom-left" : "bottom-right" }
    );
  };

  // CREATE TASK
  const handleOpenCreateModal = () => {
    setCreateForm({
      title: "",
      description: "",
      priority: "High",
      deadline: "",
      assignToUserId: "",
    });
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (creating) return;
    setIsCreateOpen(false);
    setCreateError(null);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || creating) return;

    if (!createForm.deadline) {
      setCreateError(isRtl ? "تاريخ الموعد النهائي مطلوب" : "Deadline is required.");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        priority: createForm.priority,
        deadline: formatDeadlineToApi(createForm.deadline),
      };

      const res = await createTask(payload, { lang });
      const newTask = res?.data;

      // Assign to employee if chosen
      if (newTask?.id && createForm.assignToUserId) {
        try {
          await assignTask(
            newTask.id,
            { user_id: Number(createForm.assignToUserId) },
            { lang }
          );
        } catch (assignErr) {
          handleCloseCreateModal();
          showToast(
            t("managerTasks.createAssignError", {
              message: getAssignmentErrorMessage(assignErr),
              defaultValue:
                "Task created, but assigning it failed: {{message}}",
            }),
            true,
          );
          fetchTasksList(page);
          return;
        }
      }

      handleCloseCreateModal();
      showToast(
        isRtl ? "تم إنشاء المهمة بنجاح" : "Task created successfully"
      );
      fetchTasksList(page);
    } catch (err) {
      console.error("Create task failed:", err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.title?.[0] ||
        err.response?.data?.errors?.deadline?.[0] ||
        err.message ||
        (isRtl ? "فشل إنشاء المهمة" : "Failed to create task");
      setCreateError(errMsg);
    } finally {
      setCreating(false);
    }
  };

  // REASSIGN TASK (POST /api/tasks/{task}/assign)
  const openReassignMenu = (e, task) => {
    if (reassignMenu?.taskId === task.id) {
      setReassignMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const isRtlLang = i18n.dir() === "rtl";
    const menuHeight = 220;
    const opensDown = rect.bottom + 6 + menuHeight <= window.innerHeight;
    const top = opensDown ? rect.bottom + 6 : Math.max(8, rect.top - 6 - menuHeight);

    setReassignMenu({
      taskId: task.id,
      taskTitle: task.title,
      currentAssigneeId: task.assignee?.id || task.user_id,
      top,
      ...(isRtlLang
        ? { left: Math.max(8, rect.left) }
        : { right: Math.max(8, window.innerWidth - rect.right) }),
    });
  };

  const handleReassign = async (taskId, member) => {
    setReassignMenu(null);
    try {
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
      await assignTask(taskId, { user_id: member.id }, { lang });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, assignee: member, user_id: member.id }
            : t
        )
      );

      showToast(
        isRtl
          ? `تم إسناد المهمة إلى ${member.name}`
          : `Task assigned to ${member.name}`
      );
    } catch (err) {
      console.error("Reassign failed:", err);
      showToast(
        getAssignmentErrorMessage(err) ||
          (isRtl ? "فشل إعادة إسناد المهمة" : "Failed to reassign task"),
        true
      );
    }
  };

  // EDIT TASK (PUT /api/tasks/{task})
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "Medium",
      deadline: formatDeadlineToInput(task.deadline),
    });
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    if (editing) return;
    setEditingTask(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask || !editForm.title.trim() || editing) return;

    setEditing(true);
    setEditError(null);

    try {
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        priority: editForm.priority,
        deadline: formatDeadlineToApi(editForm.deadline),
      };

      const res = await updateTask(editingTask.id, payload, { lang });
      const updated = res?.data;

      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...updated } : t))
      );

      handleCloseEditModal();
      showToast(
        isRtl ? "تم تعديل المهمة بنجاح" : "Task updated successfully"
      );
    } catch (err) {
      console.error("Edit failed:", err);
      setEditError(
        err.response?.data?.message ||
          (isRtl ? "فشل تعديل المهمة" : "Failed to update task")
      );
    } finally {
      setEditing(false);
    }
  };

  // UPDATE STATUS (PATCH /api/tasks/{task}/status)
  const handleOpenStatusModal = (task) => {
    setStatusTask(task);
    setSelectedStatus(task.status || "Pending");
  };

  const handleCloseStatusModal = () => {
    if (updatingStatus) return;
    setStatusTask(null);
  };

  const handleStatusSubmit = async () => {
    if (!statusTask || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
      await updateTaskStatus(statusTask.id, { status: selectedStatus }, { lang });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === statusTask.id ? { ...t, status: selectedStatus } : t
        )
      );

      handleCloseStatusModal();
      showToast(
        isRtl ? "تم تحديث حالة المهمة" : "Task status updated"
      );
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          (isRtl ? "فشل تغيير الحالة" : "Failed to change status"),
        true
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // VIEW ACTIVITIES (GET /api/tasks/{task}/activities)
  const handleOpenActivities = async (task) => {
    setActivityTask(task);
    setActivities([]);
    setLoadingActivities(true);

    try {
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
      const res = await getTaskActivities(task.id, { lang });
      const list = Array.isArray(res?.data) ? res.data : [];
      setActivities(list);
    } catch (err) {
      console.warn("Could not load activities:", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Filtered Tasks for search
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const title = (task.title || "").toLowerCase();
      const desc = (task.description || "").toLowerCase();
      const assignee = (
        task.assignee?.name ||
        task.user?.name ||
        ""
      ).toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      if (query && !title.includes(query) && !desc.includes(query) && !assignee.includes(query)) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery]);

  // Breadcrumb
  const breadcrumbText = useMemo(() => {
    if (portalRole === "Owner") {
      return isRtl ? "بوابة المالك / إدارة المهام" : "OWNER PORTAL / TASK MANAGEMENT";
    }
    if (portalRole === "HR") {
      return isRtl ? "بوابة الموارد البشرية / إدارة المهام" : "HR PORTAL / TASK MANAGEMENT";
    }
    return isRtl ? "بوابة المدير / إدارة المهام" : "MANAGER PORTAL / TASK MANAGEMENT";
  }, [portalRole, isRtl]);

  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div className="w-full space-y-6 pb-12 font-sans" dir={isRtl ? "rtl" : "ltr"}>
      {/* 1. Breadcrumb + Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#6b879f] uppercase">
            {breadcrumbText}
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-[#1e293b] tracking-tight mt-1">
            {t("managerTasks.title", "Task Management")}
          </h1>
          <p className="text-sm text-[#829ab1] mt-1 font-normal">
            {t(
              "managerTasks.subtitle",
              "Keep your team aligned, supported, and moving forward."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => fetchTasksList(page, true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-3.5 py-2 text-xs font-semibold text-[#102a43] hover:bg-[#f8fafc] transition shadow-sm disabled:opacity-50"
            title="Refresh tasks"
          >
            <FiRefreshCw
              className={`w-3.5 h-3.5 text-[#64748b] ${
                refreshing ? "animate-spin text-[#2563eb]" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {refreshing
                ? t("common.refreshing", "Refreshing...")
                : t("common.refresh", "Refresh")}
            </span>
          </motion.button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-xl bg-[#102a43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1f3a56] transition shrink-0 shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            <span>{t("managerTasks.assignNewTask", "Create & Assign Task")}</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e2e8f0] shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <FiSearch className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("managerTasks.searchPlaceholder", "Search tasks or team members...")}
            className="w-full h-10 ps-9 pe-3 text-xs text-[#102a43] placeholder:text-[#94a3b8] rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition bg-[#f8fafc]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {FILTERS.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setActiveFilter(f.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? "bg-[#102a43] text-white shadow-sm"
                    : "text-[#627d98] hover:bg-[#f1f5f9] hover:text-[#102a43]"
                }`}
              >
                {isRtl ? f.labelAr : f.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Error Banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#dc2626]">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchTasksList(page)}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-[#dc2626] text-white hover:bg-[#b91c1c] transition"
          >
            {t("common.retry", "Retry")}
          </button>
        </div>
      )}

      {/* 4. Tasks Table Card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="bg-[#f8fafc]/80 border-b border-[#f1f5f9] text-[11px] font-bold tracking-wider text-[#94a3b8]">
                <th className="py-4 px-6">{t("managerTasks.colTaskName", "TASK NAME")}</th>
                <th className="py-4 px-6">{t("managerTasks.colAssignee", "ASSIGNEE")}</th>
                <th className="py-4 px-6">{t("managerTasks.colDueDate", "DUE DATE")}</th>
                <th className="py-4 px-6">{t("managerTasks.colPriority", "PRIORITY")}</th>
                <th className="py-4 px-6">{t("managerTasks.colStatus", isRtl ? "الحالة" : "STATUS")}</th>
                <th className="py-4 px-6">{t("managerTasks.colProgress", "PROGRESS")}</th>
                <th className="py-4 px-6 w-24 text-center">{isRtl ? "إجراءات" : "ACTIONS"}</th>
              </tr>
            </thead>

            {loading ? (
              <tbody className="divide-y divide-[#f1f5f9]">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-5 px-6">
                      <div className="h-4 w-40 bg-[#f1f5f9] rounded" />
                    </td>
                    <td className="py-5 px-6">
                      <div className="h-4 w-28 bg-[#f1f5f9] rounded" />
                    </td>
                    <td className="py-5 px-6">
                      <div className="h-4 w-20 bg-[#f1f5f9] rounded" />
                    </td>
                    <td className="py-5 px-6">
                      <div className="h-5 w-16 bg-[#f1f5f9] rounded-full" />
                    </td>
                    <td className="py-5 px-6">
                      <div className="h-5 w-20 bg-[#f1f5f9] rounded-full" />
                    </td>
                    <td className="py-5 px-6">
                      <div className="h-2 w-24 bg-[#f1f5f9] rounded" />
                    </td>
                    <td className="py-5 px-6">
                      <div className="h-6 w-12 bg-[#f1f5f9] rounded mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : filteredTasks.length > 0 ? (
              <motion.tbody
                key={activeFilter + searchQuery}
                initial="hidden"
                animate="visible"
                variants={tableStagger}
                className="divide-y divide-[#f1f5f9]"
              >
                {filteredTasks.map((task) => {
                  const assigneeName =
                    task.assignee?.name ||
                    task.user?.name ||
                    (task.user_id ? `User #${task.user_id}` : (isRtl ? "غير مسند" : "Unassigned"));

                  const priorityLower = (task.priority || "normal").toLowerCase();
                  const priorityClass =
                    PRIORITY_STYLES[priorityLower] || PRIORITY_STYLES.normal;
                  const statusClass =
                    STATUS_BADGES[task.status] || STATUS_BADGES.Pending;

                  const dueDateStr = formatDeadline(task.deadline, isRtl);
                  const progressVal = Number(task.progress) || 0;

                  return (
                    <motion.tr
                      key={task.id}
                      variants={rowVariants}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="hover:bg-[#f8fafc]/50 transition"
                    >
                      {/* Task Name & Description */}
                      <td className="py-4 px-6 max-w-xs">
                        <p className="text-sm font-bold text-[#1e293b] truncate">
                          {getTaskTitleLabel(task.title)}
                        </p>
                        {task.description && (
                          <p className="text-xs text-[#64748b] truncate mt-0.5 max-w-sm">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-full bg-[#e0e7ff] text-[10px] font-bold text-[#4338ca]">
                            {getInitials(assigneeName)}
                          </div>
                          <span className="text-xs font-semibold text-[#334155]">
                            {assigneeName}
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-6 text-xs text-[#64748b] font-medium">
                        <div className="inline-flex items-center gap-1.5">
                          <FiCalendar className="w-3.5 h-3.5 text-[#94a3b8]" />
                          <span>{dueDateStr}</span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityClass}`}
                        >
                          {getTaskPriorityLabel(task.priority || "Normal")}
                        </span>
                      </td>

                      {/* Status (Clickable to change) */}
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(task)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold hover:opacity-80 transition cursor-pointer ${statusClass}`}
                          title={isRtl ? "اضغط لتغيير الحالة" : "Click to change status"}
                        >
                          <span>{getTaskStatusLabel(task.status || "Pending")}</span>
                          <FiRefreshCw className="w-3 h-3 opacity-60" />
                        </button>
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-24 bg-[#f1f5f9] h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#10b981]"
                              style={{ width: `${progressVal}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#475569] w-8">
                            {progressVal}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Reassign Button */}
                          <button
                            type="button"
                            data-reassign-trigger
                            onClick={(e) => openReassignMenu(e, task)}
                            className="p-1.5 text-[#64748b] hover:text-[#102a43] hover:bg-[#f1f5f9] rounded-lg transition"
                            title={isRtl ? "إعادة إسناد المهمة" : "Reassign Task"}
                          >
                            <FiUserPlus className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1.5 text-[#64748b] hover:text-[#102a43] hover:bg-[#f1f5f9] rounded-lg transition"
                            title={isRtl ? "تعديل المهمة" : "Edit Task"}
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>

                          {/* Activity History Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenActivities(task)}
                            className="p-1.5 text-[#64748b] hover:text-[#102a43] hover:bg-[#f1f5f9] rounded-lg transition"
                            title={isRtl ? "سجل النشاطات" : "Activity Log"}
                          >
                            <FiActivity className="w-4 h-4" />
                          </button>

                          {/* View Submissions Shortcut */}
                          <button
                            type="button"
                            onClick={() => {
                              const targetPath =
                                portalRole === "Owner"
                                  ? "/admin/submissions"
                                  : portalRole === "HR"
                                  ? "/hr/submissions"
                                  : "/manager/submissions";
                              navigate(targetPath, {
                                state: { searchQuery: task.title },
                              });
                            }}
                            className="p-1.5 text-[#64748b] hover:text-[#102a43] hover:bg-[#f1f5f9] rounded-lg transition"
                            title={isRtl ? "عرض تسليمات المهمة" : "View Task Submissions"}
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FiCheckCircle className="w-8 h-8 text-[#94a3b8] mb-2" />
                      <p className="text-sm font-bold text-[#102a43]">
                        {isRtl ? "لا توجد مهام" : "No tasks found"}
                      </p>
                      <p className="text-xs text-[#829ab1] mt-1">
                        {isRtl
                          ? "لم يتم العثور على مهام مطابقة لمعايير البحث."
                          : "No tasks matched your current filter criteria."}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {total > perPage && (
          <div className="flex items-center justify-between p-4 border-t border-[#f1f5f9] bg-[#fafafa]">
            <span className="text-xs text-[#64748b]">
              {isRtl
                ? `عرض صفحة ${page} من ${totalPages} (إجمالي ${total} مهمة)`
                : `Page ${page} of ${totalPages} (Total ${total} tasks)`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#d9e2ec] bg-white text-[#102a43] hover:bg-[#f8fafc] disabled:opacity-40 transition"
              >
                {isRtl ? "السابق" : "Previous"}
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#d9e2ec] bg-white text-[#102a43] hover:bg-[#f8fafc] disabled:opacity-40 transition"
              >
                {isRtl ? "التالي" : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Reassign Menu Portal (POST /api/tasks/{task}/assign) */}
      {createPortal(
        <AnimatePresence>
          {reassignMenu && (
            <motion.div
              key={reassignMenu.taskId}
              ref={menuRef}
              role="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: reassignMenu.top,
                left: reassignMenu.left,
                right: reassignMenu.right,
              }}
              className={`z-[60] ${MENU_WIDTH_CLASS} rounded-2xl border border-[#e2e8f0] bg-white py-2 shadow-2xl max-h-60 overflow-y-auto`}
            >
              <p className="px-3.5 pb-2 pt-1 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase border-b border-[#f1f5f9]">
                {isRtl ? "إسناد المهمة إلى:" : "Assign Task To:"}
              </p>
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleReassign(reassignMenu.taskId, member)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left rtl:text-right transition hover:bg-[#f1f5f9] ${
                      member.id === reassignMenu.currentAssigneeId
                        ? "bg-[#f8fafc] font-bold text-[#102a43]"
                        : "text-[#334155]"
                    }`}
                  >
                    <div className="flex size-6 items-center justify-center rounded-full bg-[#e0e7ff] text-[10px] font-bold text-[#4338ca] shrink-0">
                      {getInitials(member.name)}
                    </div>
                    <div className="truncate flex-1">
                      <p className="truncate font-semibold">{member.name}</p>
                      {member.role && (
                        <p className="text-[10px] text-[#94a3b8] truncate">{member.role}</p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="p-3 text-xs text-[#94a3b8] text-center">
                  {isRtl ? "لا يوجد موظفون" : "No employees found"}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* CREATE TASK MODAL (POST /api/tasks + POST /api/tasks/{task}/assign) */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {isRtl ? "إنشاء مهمة جديدة" : "NEW TASK"}
                  </p>
                  <h3 className="text-lg font-bold text-[#102a43] mt-0.5">
                    {t("managerTasks.assignNewTask", "Create & Assign Task")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={creating}
                  className="text-[#94a3b8] hover:text-[#102a43] transition p-1 rounded-lg"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] text-xs font-semibold text-[#dc2626]">
                  <FiAlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                    {isRtl ? "عنوان المهمة *" : "Task Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder={isRtl ? "مثال: إكمال توثيق الـ API" : "e.g. Complete API Documentation"}
                    className="w-full h-10 rounded-xl border border-[#d9e2ec] px-3.5 text-xs text-[#102a43] focus:outline-none focus:ring-2 focus:ring-[#102a43]/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                    {isRtl ? "الوصف" : "Description"}
                  </label>
                  <textarea
                    rows={3}
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder={isRtl ? "اكتب تفاصيل المهمة والمتطلبات..." : "Write task details and requirements..."}
                    className="w-full rounded-xl border border-[#d9e2ec] px-3.5 py-2.5 text-xs text-[#102a43] focus:outline-none focus:ring-2 focus:ring-[#102a43]/20 resize-none"
                  />
                </div>

                {/* Priority & Deadline Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                      {isRtl ? "الأولوية *" : "Priority *"}
                    </label>
                    <select
                      value={createForm.priority}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, priority: e.target.value }))
                      }
                      className="w-full h-10 rounded-xl border border-[#d9e2ec] px-3 text-xs text-[#102a43] bg-white focus:outline-none focus:ring-2 focus:ring-[#102a43]/20"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {getTaskPriorityLabel(p)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                      {isRtl ? "الموعد النهائي *" : "Deadline *"}
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={createForm.deadline}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, deadline: e.target.value }))
                      }
                      className="w-full h-10 rounded-xl border border-[#d9e2ec] px-3 text-xs text-[#102a43] bg-white focus:outline-none focus:ring-2 focus:ring-[#102a43]/20"
                    />
                  </div>
                </div>

                {/* Assign to Employee */}
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                    {isRtl ? "إسناد إلى عضو بالفريق" : "Assign to Employee"}
                  </label>
                  <select
                    value={createForm.assignToUserId}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        assignToUserId: e.target.value,
                      }))
                    }
                    className="w-full h-10 rounded-xl border border-[#d9e2ec] px-3 text-xs text-[#102a43] bg-white focus:outline-none focus:ring-2 focus:ring-[#102a43]/20"
                  >
                    <option value="">{isRtl ? "-- بدون إسناد حالياً --" : "-- Leave Unassigned --"}</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.email ? `(${member.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    disabled={creating}
                    className="flex-1 py-2.5 rounded-xl border border-[#d9e2ec] text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={creating}
                    className="flex-1 rounded-xl bg-[#102a43] py-2.5 text-xs font-semibold text-white hover:bg-[#1f3a56] transition shadow-sm disabled:opacity-50"
                  >
                    {creating
                      ? isRtl
                        ? "جارٍ الإنشاء..."
                        : "Creating..."
                      : isRtl
                      ? "إنشاء المهمة"
                      : "Create Task"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT TASK MODAL (PUT /api/tasks/{task}) */}
      <AnimatePresence>
        {editingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {isRtl ? "تعديل المهمة" : "EDIT TASK"}
                  </p>
                  <h3 className="text-lg font-bold text-[#102a43] mt-0.5 truncate max-w-sm">
                    {editingTask.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={editing}
                  className="text-[#94a3b8] hover:text-[#102a43] transition p-1 rounded-lg"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {editError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] text-xs font-semibold text-[#dc2626]">
                  <FiAlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                    {isRtl ? "عنوان المهمة *" : "Task Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full h-10 rounded-xl border border-[#d9e2ec] px-3.5 text-xs text-[#102a43] focus:outline-none focus:ring-2 focus:ring-[#102a43]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                    {isRtl ? "الوصف" : "Description"}
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, description: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#d9e2ec] px-3.5 py-2.5 text-xs text-[#102a43] focus:outline-none focus:ring-2 focus:ring-[#102a43]/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                      {isRtl ? "الأولوية *" : "Priority *"}
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, priority: e.target.value }))
                      }
                      className="w-full h-10 rounded-xl border border-[#d9e2ec] px-3 text-xs text-[#102a43] bg-white focus:outline-none focus:ring-2 focus:ring-[#102a43]/20"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {getTaskPriorityLabel(p)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                      {isRtl ? "الموعد النهائي *" : "Deadline *"}
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editForm.deadline}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, deadline: e.target.value }))
                      }
                      className="w-full h-10 rounded-xl border border-[#d9e2ec] px-3 text-xs text-[#102a43] bg-white focus:outline-none focus:ring-2 focus:ring-[#102a43]/20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    disabled={editing}
                    className="flex-1 py-2.5 rounded-xl border border-[#d9e2ec] text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={editing}
                    className="flex-1 rounded-xl bg-[#102a43] py-2.5 text-xs font-semibold text-white hover:bg-[#1f3a56] transition shadow-sm disabled:opacity-50"
                  >
                    {editing
                      ? isRtl
                        ? "جارٍ الحفظ..."
                        : "Saving..."
                      : isRtl
                      ? "حفظ التعديلات"
                      : "Save Changes"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATUS CHANGE MODAL (PATCH /api/tasks/{task}/status) */}
      <AnimatePresence>
        {statusTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#102a43]">
                  {isRtl ? "تغيير حالة المهمة" : "Update Task Status"}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseStatusModal}
                  disabled={updatingStatus}
                  className="text-[#94a3b8] hover:text-[#102a43] p-1 rounded-lg"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#64748b] mb-4 truncate">
                {statusTask.title}
              </p>

              <div className="space-y-2 mb-5">
                {STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatus(st)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition ${
                      selectedStatus === st
                        ? "border-[#102a43] bg-[#f8fafc] text-[#102a43]"
                        : "border-[#e2e8f0] text-[#64748b] hover:bg-[#fafafa]"
                    }`}
                  >
                    <span>{getTaskStatusLabel(st)}</span>
                    {selectedStatus === st && (
                      <FiCheckCircle className="w-4 h-4 text-[#102a43]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseStatusModal}
                  disabled={updatingStatus}
                  className="flex-1 py-2.5 rounded-xl border border-[#d9e2ec] text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleStatusSubmit}
                  disabled={updatingStatus}
                  className="flex-1 rounded-xl bg-[#102a43] py-2.5 text-xs font-semibold text-white hover:bg-[#1f3a56] transition shadow-sm disabled:opacity-50"
                >
                  {updatingStatus
                    ? isRtl
                      ? "جارٍ التحديث..."
                      : "Updating..."
                    : isRtl
                    ? "تحديث الحالة"
                    : "Update"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVITY HISTORY MODAL (GET /api/tasks/{task}/activities) */}
      <AnimatePresence>
        {activityTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#f1f5f9] pb-3">
                <div className="flex items-center gap-2">
                  <FiActivity className="w-5 h-5 text-[#2563eb]" />
                  <h3 className="text-base font-bold text-[#102a43]">
                    {isRtl ? "سجل نشاطات المهمة" : "Task Activity History"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActivityTask(null)}
                  className="text-[#94a3b8] hover:text-[#102a43] p-1 rounded-lg"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs font-semibold text-[#102a43] mb-4">
                {activityTask.title}
              </p>

              {loadingActivities ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-[#f8fafc] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-xl border border-[#f1f5f9] bg-[#fafafa] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                        <span className="font-bold text-[#102a43] uppercase">
                          {act.action}
                        </span>
                        <span>{formatDateTime(act.created_at, isRtl)}</span>
                      </div>
                      <p className="text-[#334155]">{act.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#94a3b8]">
                  {isRtl ? "لا توجد نشاطات مسجلة لهذه المهمة حتى الآن." : "No activities recorded for this task yet."}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskManagement;