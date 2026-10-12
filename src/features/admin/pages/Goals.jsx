import { useMemo, useState, useEffect } from "react";

import {
  FiPlus,
  FiX,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiEdit2,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
} from "react-icons/fi";

import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { useGoals, useCreateGoal, useUpdateGoal } from "../hooks/useGoals";

import axiosInstance from "../../../utils/axiosInstance";

// =====================================================
// DEPARTMENTS
// =====================================================

const DEPARTMENTS = [
  { id: 1, name: "Engineering", nameAr: "الهندسة" },
  { id: 2, name: "People & Culture", nameAr: "الأفراد والثقافة" },
  { id: 3, name: "Sales", nameAr: "المبيعات" },
  { id: 4, name: "Logistics", nameAr: "اللوجستيات" },
];

// =====================================================
// HELPERS
// =====================================================

const normalizeStatus = (status) => {
  return String(status || "").toLowerCase();
};

const getGoalEmployeeId = (goal) => {
  return goal?.user?.id || goal?.employee?.id || goal?.employee_id || "";
};

const getGoalEmployeeName = (goal) => {
  return goal?.user?.name || goal?.employee?.name || goal?.employee_name || "-";
};

// =====================================================
// NORMALIZE EMPLOYEE
// =====================================================

const normalizeEmployee = (employee, t) => {
  const id = employee?.id || employee?.user?.id || employee?.employee_id || "";

  const firstName = employee?.first_name || "";
  const lastName = employee?.last_name || "";

  const generatedName = `${firstName} ${lastName}`.trim();

  const name =
    employee?.name ||
    employee?.full_name ||
    employee?.employee_name ||
    employee?.user?.name ||
    generatedName ||
    t("hrGoals.form.employeeFallback", {
      id,
      defaultValue: "Employee #{{id}}",
    });

  return {
    id,
    name,
  };
};

// =====================================================
// ERROR HELPER
// =====================================================

const getErrorMessage = (error, fallback) => {
  const responseData = error?.response?.data;

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.error) {
    return responseData.error;
  }

  if (responseData?.errors) {
    const messages = Object.values(responseData.errors).flat().filter(Boolean);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

// =====================================================
// COMPONENT
// =====================================================

const Goals = () => {
  const { t, i18n } = useTranslation();

  const isArabic = i18n.language?.toLowerCase().startsWith("ar");

  const lang = isArabic ? "ar" : "en";

  // =====================================================
  // FILTERS
  // =====================================================

  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  // =====================================================
  // EMPLOYEES
  // =====================================================

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // =====================================================
  // MODAL
  // =====================================================

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [form, setForm] = useState({
    employee_id: "",
    title: "",
    description: "",
    target_date: "",
    status: "active",
  });

  // =====================================================
  // QUERY PARAMS
  // =====================================================

  const goalParams = useMemo(() => {
    const params = {
      page: currentPage,
      per_page: 15,
    };

    if (statusFilter) {
      params.status = statusFilter;
    }

    if (employeeFilter) {
      params.employee_id = Number(employeeFilter);
    }

    if (departmentFilter) {
      params.department_id = Number(departmentFilter);
    }

    return params;
  }, [currentPage, statusFilter, employeeFilter, departmentFilter]);

  // =====================================================
  // GET GOALS
  // =====================================================

  const {
    data: goalsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGoals(goalParams, lang);

  // =====================================================
  // MUTATIONS
  // =====================================================

  const createGoalMutation = useCreateGoal(lang);
  const updateGoalMutation = useUpdateGoal(lang);

  const submitting =
    createGoalMutation.isPending || updateGoalMutation.isPending;

  // =====================================================
  // NORMALIZE GOALS RESPONSE
  // =====================================================

  const goalsData = goalsResponse?.data;

  const goals = useMemo(() => {
    if (Array.isArray(goalsData?.goals)) return goalsData.goals;
    if (Array.isArray(goalsData?.data?.goals)) return goalsData.data.goals;
    if (Array.isArray(goalsData?.data)) return goalsData.data;
    if (Array.isArray(goalsData)) return goalsData;
    if (Array.isArray(goalsResponse?.goals)) return goalsResponse.goals;
    if (Array.isArray(goalsResponse)) return goalsResponse;
    return [];
  }, [goalsResponse, goalsData]);

  const meta = goalsData?.meta || goalsResponse?.meta || {};

  const lastPage = Number(meta?.last_page || 1);

  const totalGoals = Number(meta?.total ?? goals.length ?? 0);

  // =====================================================
  // LOAD ALL EMPLOYEES
  // =====================================================

  const loadEmployees = async () => {
    try {
      setEmployeesLoading(true);

      let allEmployees = [];
      let currentEmployeePage = 1;
      let lastEmployeePage = 1;

      do {
        const response = await axiosInstance.get("/employees", {
          params: {
            page: currentEmployeePage,
            per_page: 100,
          },

          headers: {
            Accept: "application/json",
            "Accept-Language": lang,
          },
        });

        const responseData = response?.data?.data;

        const employeesPage = Array.isArray(responseData?.employees)
          ? responseData.employees
          : Array.isArray(responseData)
          ? responseData
          : Array.isArray(response?.data?.employees)
          ? response.data.employees
          : [];

        allEmployees = [...allEmployees, ...employeesPage];

        lastEmployeePage = Number(responseData?.last_page || response?.data?.last_page || 1);

        currentEmployeePage += 1;
      } while (currentEmployeePage <= lastEmployeePage);

      const normalizedEmployees = allEmployees
        .map((employee) => normalizeEmployee(employee, t))
        .filter((employee) => employee.id);

      setEmployees(normalizedEmployees);
    } catch (err) {
      console.error("Failed to load employees:", err);

      toast.error(
        getErrorMessage(
          err,
          t("hrGoals.errors.employees", "Failed to load employees."),
        ),
      );
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [lang]);

  // =====================================================
  // OPEN CREATE
  // =====================================================

  const openCreateModal = async () => {
    setEditingGoal(null);

    setForm({
      employee_id: "",
      title: "",
      description: "",
      target_date: "",
      status: "active",
    });

    setIsModalOpen(true);

    if (employees.length === 0) {
      await loadEmployees();
    }
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditModal = async (goal) => {
    const status = normalizeStatus(goal?.status);

    if (status === "completed" || status === "cancelled") {
      toast.error(
        t(
          "hrGoals.errors.completedCancelled",
          "Completed or cancelled goals cannot be modified.",
        ),
      );

      return;
    }

    if (employees.length === 0) {
      await loadEmployees();
    }

    setEditingGoal(goal);

    setForm({
      employee_id: String(getGoalEmployeeId(goal) || ""),
      title: goal?.title || "",
      description: goal?.description || "",
      target_date: goal?.target_date || "",
      status: status || "active",
    });

    setIsModalOpen(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (submitting) return;

    setIsModalOpen(false);
    setEditingGoal(null);

    setForm({
      employee_id: "",
      title: "",
      description: "",
      target_date: "",
      status: "active",
    });
  };

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    if (!form.employee_id) {
      toast.error(
        t("hrGoals.validation.employee", "Please select an employee."),
      );

      return false;
    }

    if (!form.title.trim()) {
      toast.error(t("hrGoals.validation.title", "Goal title is required."));

      return false;
    }

    if (!form.target_date) {
      toast.error(t("hrGoals.validation.date", "Target date is required."));

      return false;
    }

    return true;
  };

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = {
      employee_id: Number(form.employee_id),
      title: form.title.trim(),
      description: form.description.trim(),
      target_date: form.target_date,
    };

    try {
      // =================================================
      // UPDATE
      // =================================================

      if (editingGoal) {
        await updateGoalMutation.mutateAsync({
          id: editingGoal.id,

          goalData: {
            ...payload,
            status: form.status || "active",
          },
        });

        toast.success(
          t("hrGoals.success.updated", "Goal updated successfully."),
        );
      }

      // =================================================
      // CREATE
      // =================================================
      else {
        await createGoalMutation.mutateAsync(payload);

        toast.success(
          t("hrGoals.success.created", "Goal created successfully."),
        );

        setCurrentPage(1);
      }

      closeModal();

      await refetch();
    } catch (err) {
      console.error("Goal mutation error:", err);

      toast.error(
        getErrorMessage(
          err,
          t(
            "hrGoals.errors.generic",
            "Something went wrong. Please try again.",
          ),
        ),
      );
    }
  };

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = () => {
    setStatusFilter("");
    setEmployeeFilter("");
    setDepartmentFilter("");
    setCurrentPage(1);
  };

  // =====================================================
  // STATS
  // =====================================================

  const stats = useMemo(() => {
    const completed = goals.filter(
      (goal) => normalizeStatus(goal.status) === "completed",
    ).length;

    const active = goals.filter(
      (goal) => normalizeStatus(goal.status) === "active",
    ).length;

    const cancelled = goals.filter(
      (goal) => normalizeStatus(goal.status) === "cancelled",
    ).length;

    const employeesCount = new Set(
      goals.map((goal) => getGoalEmployeeId(goal)).filter(Boolean),
    ).size;

    return {
      completed,
      active,
      cancelled,
      employeesCount,
    };
  }, [goals]);

  const completionPercentage =
    goals.length > 0 ? Math.round((stats.completed / goals.length) * 100) : 0;

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "completed") {
      return {
        wrapper: "bg-[#ecfdf5] text-[#15803d]",
        dot: "bg-[#10b981]",
        label: t("hrGoals.status.completed", "Completed"),
      };
    }

    if (normalized === "cancelled") {
      return {
        wrapper: "bg-[#fef2f2] text-[#dc2626]",
        dot: "bg-[#ef4444]",
        label: t("hrGoals.status.cancelled", "Cancelled"),
      };
    }

    return {
      wrapper: "bg-[#eff6ff] text-[#2563eb]",
      dot: "bg-[#3b82f6]",
      label: t("hrGoals.status.active", "Active"),
    };
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <motion.div
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full min-w-0 space-y-6 overflow-x-hidden"
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        ease: "easeOut",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
        }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b879f]">
            {t("hrGoals.eyebrow", "GOALS & DEVELOPMENT")}
          </p>

          <h1 className="mt-1 text-lg font-bold tracking-tight text-[#1e293b] md:text-[21px]">
            {t("hrGoals.title", "Employee Goals")}
          </h1>

          <p className="mt-1 text-sm text-[#64748b]">
            {t(
              "hrGoals.subtitle",
              "Manage and track employee goals across the company.",
            )}
          </p>
        </div>

        <motion.button
          type="button"
          onClick={openCreateModal}
          whileHover={{
            y: -2,
            scale: 1.02,
          }}
          whileTap={{
            scale: 0.97,
          }}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#243B53] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c2f42]"
        >
          <FiPlus className="h-4 w-4" />

          {t("hrGoals.createGoal", "Create Goal")}
        </motion.button>
      </motion.div>

      {/* =================================================
          OVERVIEW
      ================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          delay: 0.08,
        }}
        className="rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-6"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#10b981]" />

              <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
                {t("hrGoals.companyOverview", "COMPANY OVERVIEW")}
              </span>
            </div>

            <h2 className="text-base font-bold text-[#1e293b] sm:text-lg">
              {t("hrGoals.goalsProgress", "Goals Progress")}
            </h2>

            <p className="mt-1 text-xs text-[#64748b] sm:text-sm">
              {t(
                "hrGoals.goalsProgressSubtitle",
                "Track employee goal completion across the company.",
              )}
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
            <FiTrendingUp className="h-[18px] w-[18px]" />
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">
              {t("hrGoals.completion", "Completion")}
            </span>

            <span className="text-sm font-bold text-[#1e293b]">
              {completionPercentage}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${completionPercentage}%`,
              }}
              transition={{
                duration: 0.9,
                ease: "easeOut",
              }}
              className="h-full rounded-full bg-[#10b981]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<FiCheckCircle />}
            label={t("hrGoals.completed", "Completed")}
            value={stats.completed}
            iconClass="text-[#10b981]"
          />

          <StatCard
            icon={<FiClock />}
            label={t("hrGoals.active", "Active")}
            value={stats.active}
            iconClass="text-[#3b82f6]"
          />

          <StatCard
            icon={<FiX />}
            label={t("hrGoals.cancelled", "Cancelled")}
            value={stats.cancelled}
            iconClass="text-[#dc2626]"
          />

          <StatCard
            icon={<FiUsers />}
            label={t("hrGoals.employees", "Employees")}
            value={stats.employeesCount}
            iconClass="text-[#8b5cf6]"
          />
        </div>
      </motion.div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1e293b]">
              {t("hrGoals.filters.title", "Filters")}
            </h2>

            <p className="mt-1 text-xs text-[#64748b]">
              {t(
                "hrGoals.filters.subtitle",
                "Filter company goals by status, department or employee.",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-[#64748b] hover:text-[#243B53]"
          >
            {t("hrGoals.filters.reset", "Reset")}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
          >
            <option value="">
              {t("hrGoals.filters.allStatuses", "All Statuses")}
            </option>

            <option value="active">
              {t("hrGoals.status.active", "Active")}
            </option>

            <option value="completed">
              {t("hrGoals.status.completed", "Completed")}
            </option>

            <option value="cancelled">
              {t("hrGoals.status.cancelled", "Cancelled")}
            </option>
          </select>

          {/* DEPARTMENT */}

          <select
            value={departmentFilter}
            onChange={(event) => {
              setDepartmentFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
          >
            <option value="">
              {t("hrGoals.filters.allDepartments", "All Departments")}
            </option>

            {DEPARTMENTS.map((department) => (
              <option key={department.id} value={department.id}>
                {isArabic ? department.nameAr : department.name}
              </option>
            ))}
          </select>

          {/* EMPLOYEE */}

          <select
            value={employeeFilter}
            onChange={(event) => {
              setEmployeeFilter(event.target.value);
              setCurrentPage(1);
            }}
            disabled={employeesLoading}
            className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#334155] outline-none focus:border-[#94a3b8] disabled:bg-[#f8fafc]"
          >
            <option value="">
              {employeesLoading
                ? t("hrGoals.filters.loadingEmployees", "Loading employees...")
                : t("hrGoals.filters.allEmployees", "All Employees")}
            </option>

            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =================================================
          GOALS TABLE
      ================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          delay: 0.16,
        }}
        className="w-full overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      >
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-[#1e293b] sm:text-lg">
              {t("hrGoals.companyGoals", "Company Goals")}
            </h2>

            <p className="mt-1 text-xs text-[#64748b]">
              {totalGoals} {t("hrGoals.goalsFound", "goals found")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6] disabled:opacity-50"
          >
            <FiRefreshCw
              className={`h-[17px] w-[17px] ${
                isFetching ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        {/* LOADING */}

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#243B53]" />

              <p className="text-sm text-[#64748b]">
                {t("hrGoals.loading", "Loading goals...")}
              </p>
            </div>
          </div>
        ) : isError ? (
          /* ERROR */

          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
              <FiX />
            </div>

            <p className="text-sm font-semibold text-[#334155]">
              {getErrorMessage(
                error,
                t("hrGoals.errors.load", "Failed to load goals."),
              )}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-[#243B53] px-4 py-2 text-xs font-semibold text-white"
            >
              {t("hrGoals.retry", "Try Again")}
            </button>
          </div>
        ) : goals.length === 0 ? (
          /* EMPTY */

          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <FiTrendingUp className="h-8 w-8 text-[#94a3b8]" />

            <p className="mt-3 text-sm font-semibold text-[#334155]">
              {t("hrGoals.empty.title", "No goals found")}
            </p>

            <p className="mt-1 text-xs text-[#64748b]">
              {t(
                "hrGoals.empty.subtitle",
                "There are no goals matching the current filters.",
              )}
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                DESKTOP
            ================================================= */}

            <div className="hidden w-full overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc]">
                    <TableHead
                      label={t("hrGoals.table.employee", "Employee")}
                      rtl={isArabic}
                    />

                    <TableHead
                      label={t("hrGoals.table.goal", "Goal")}
                      rtl={isArabic}
                    />

                    <TableHead
                      label={t("hrGoals.table.targetDate", "Target Date")}
                      center
                    />

                    <TableHead
                      label={t("hrGoals.table.status", "Status")}
                      center
                    />

                    <TableHead
                      label={t("hrGoals.table.created", "Created")}
                      center
                    />

                    <TableHead
                      label={t("hrGoals.table.actions", "Actions")}
                      center
                    />
                  </tr>
                </thead>

                <tbody>
                  {goals.map((goal) => {
                    const statusStyle = getStatusStyle(goal.status);

                    const normalized = normalizeStatus(goal.status);

                    const canEdit =
                      normalized !== "completed" && normalized !== "cancelled";

                    return (
                      <tr
                        key={goal.id}
                        className="border-t border-[#f1f5f9] hover:bg-[#fafbfc]"
                      >
                        {/* EMPLOYEE */}

                        <td
                          className={`px-5 py-5 ${
                            isArabic ? "text-right" : "text-left"
                          }`}
                        >
                          <p className="text-sm font-bold text-[#1e293b]">
                            {getGoalEmployeeName(goal)}
                          </p>

                          <p className="mt-1 text-[11px] text-[#94a3b8]">
                            ID: {getGoalEmployeeId(goal) || "-"}
                          </p>
                        </td>

                        {/* GOAL */}

                        <td
                          className={`max-w-[280px] px-4 py-5 ${
                            isArabic ? "text-right" : "text-left"
                          }`}
                        >
                          <p className="truncate text-sm font-semibold text-[#334155]">
                            {goal.title || "-"}
                          </p>

                          {goal.description && (
                            <p className="mt-1 truncate text-xs text-[#64748b]">
                              {goal.description}
                            </p>
                          )}
                        </td>

                        {/* TARGET DATE */}

                        <td className="px-4 py-5 text-center text-xs font-semibold text-[#475569]">
                          {goal.target_date || "-"}
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${statusStyle.wrapper}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                            />

                            {statusStyle.label}
                          </span>
                        </td>

                        {/* CREATED */}

                        <td className="px-4 py-5 text-center text-xs text-[#64748b]">
                          {goal.created_at || "-"}
                        </td>

                        {/* ACTION */}

                        <td className="px-4 py-5 text-center">
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => openEditModal(goal)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* =================================================
                MOBILE
            ================================================= */}

            <div className="divide-y divide-[#f1f5f9] lg:hidden">
              {goals.map((goal) => {
                const statusStyle = getStatusStyle(goal.status);

                const normalized = normalizeStatus(goal.status);

                const canEdit =
                  normalized !== "completed" && normalized !== "cancelled";

                return (
                  <div key={goal.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#1e293b]">
                          {goal.title || "-"}
                        </p>

                        <p className="mt-1 text-xs text-[#64748b]">
                          {getGoalEmployeeName(goal)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${statusStyle.wrapper}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                        />

                        {statusStyle.label}
                      </span>
                    </div>

                    {goal.description && (
                      <p className="mt-3 text-xs leading-5 text-[#64748b]">
                        {goal.description}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-[#f8fafc] p-3">
                        <p className="text-[10px] font-bold uppercase text-[#94a3b8]">
                          {t("hrGoals.table.targetDate", "Target Date")}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#334155]">
                          {goal.target_date || "-"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#f8fafc] p-3">
                        <p className="text-[10px] font-bold uppercase text-[#94a3b8]">
                          {t("hrGoals.table.created", "Created")}
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-[#334155]">
                          {goal.created_at || "-"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => openEditModal(goal)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-xs font-semibold text-[#475569] disabled:opacity-40"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />

                      {canEdit
                        ? t("hrGoals.edit", "Edit Goal")
                        : t("hrGoals.notEditable", "Not Editable")}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            <div className="flex items-center justify-between border-t border-[#f1f5f9] px-5 py-4 sm:px-6">
              <p className="text-xs text-[#64748b]">
                {t("hrGoals.pagination.page", "Page")} <b>{currentPage}</b>{" "}
                {t("hrGoals.pagination.of", "of")} <b>{lastPage}</b>
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isFetching}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] disabled:opacity-40"
                >
                  {isArabic ? <FiChevronRight /> : <FiChevronLeft />}
                </button>

                <button
                  type="button"
                  disabled={currentPage >= lastPage || isFetching}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(lastPage, page + 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] disabled:opacity-40"
                >
                  {isArabic ? <FiChevronLeft /> : <FiChevronRight />}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* =================================================
          MODAL
      ================================================= */}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* BACKDROP */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={closeModal}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[2px]"
            />

            {/* MODAL */}

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 10,
              }}
              className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
            >
              {/* MODAL HEADER */}

              <div className="flex items-start justify-between border-b border-[#f1f5f9] px-6 py-5">
                <div>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
                    {editingGoal ? <FiEdit2 /> : <FiPlus />}
                  </div>

                  <h2 className="text-base font-bold text-[#1e293b]">
                    {editingGoal
                      ? t("hrGoals.editGoal", "Edit Goal")
                      : t("hrGoals.createGoal", "Create Goal")}
                  </h2>

                  <p className="mt-1 text-xs text-[#64748b]">
                    {editingGoal
                      ? t(
                          "hrGoals.editSubtitle",
                          "Update the goal details below.",
                        )
                      : t(
                          "hrGoals.createSubtitle",
                          "Create a goal and assign it to an employee.",
                        )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] disabled:opacity-40"
                >
                  <FiX />
                </button>
              </div>

              {/* FORM */}

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-5">
                  {/* EMPLOYEE */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                      {t("hrGoals.form.employee", "Employee")}{" "}
                      <span className="text-[#dc2626]">*</span>
                    </label>

                    <select
                      name="employee_id"
                      value={form.employee_id}
                      onChange={handleInputChange}
                      disabled={submitting || employeesLoading}
                      required
                      className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none disabled:bg-[#f8fafc]"
                    >
                      <option value="">
                        {employeesLoading
                          ? t(
                              "hrGoals.form.loadingEmployees",
                              "Loading employees...",
                            )
                          : t("hrGoals.form.selectEmployee", "Select employee")}
                      </option>

                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TITLE */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                      {t("hrGoals.form.title", "Goal Title")}{" "}
                      <span className="text-[#dc2626]">*</span>
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleInputChange}
                      disabled={submitting}
                      required
                      placeholder={t(
                        "hrGoals.form.titlePlaceholder",
                        "e.g. Complete React course",
                      )}
                      className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none disabled:bg-[#f8fafc]"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                      {t("hrGoals.form.description", "Description")}
                    </label>

                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleInputChange}
                      disabled={submitting}
                      rows={4}
                      placeholder={t(
                        "hrGoals.form.descriptionPlaceholder",
                        "Describe what the employee needs to achieve...",
                      )}
                      className="w-full resize-none rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none disabled:bg-[#f8fafc]"
                    />
                  </div>

                  {/* TARGET DATE */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                      {t("hrGoals.form.targetDate", "Target Date")}{" "}
                      <span className="text-[#dc2626]">*</span>
                    </label>

                    <input
                      type="date"
                      name="target_date"
                      value={form.target_date}
                      onChange={handleInputChange}
                      disabled={submitting}
                      required
                      className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none disabled:bg-[#f8fafc]"
                    />
                  </div>

                  {/* STATUS */}

                  {editingGoal && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                        {t("hrGoals.form.status", "Status")}
                      </label>

                      <select
                        name="status"
                        value={form.status}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none"
                      >
                        <option value="active">
                          {t("hrGoals.status.active", "Active")}
                        </option>

                        <option value="completed">
                          {t("hrGoals.status.completed", "Completed")}
                        </option>

                        <option value="cancelled">
                          {t("hrGoals.status.cancelled", "Cancelled")}
                        </option>
                      </select>
                    </div>
                  )}
                </div>

                {/* BUTTONS */}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="flex-1 rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-xs font-semibold text-[#64748b] disabled:opacity-50"
                  >
                    {t("hrGoals.cancel", "Cancel")}
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#243B53] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {submitting && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    )}

                    {editingGoal
                      ? t("hrGoals.updateGoal", "Update Goal")
                      : t("hrGoals.createGoal", "Create Goal")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({ icon, label, value, iconClass }) => {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
      <div className={`mb-2 flex items-center gap-2 ${iconClass}`}>
        <span className="h-4 w-4">{icon}</span>

        <span className="text-xs font-semibold text-[#475569]">{label}</span>
      </div>

      <p className="text-xl font-bold tracking-tight text-[#0f172a]">{value}</p>
    </div>
  );
};

// =====================================================
// TABLE HEAD
// =====================================================

const TableHead = ({ label, rtl = false, center = false }) => {
  return (
    <th
      className={`px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] sm:text-[11px] ${
        center ? "text-center" : rtl ? "text-right" : "text-left"
      }`}
    >
      {label}
    </th>
  );
};

export default Goals;
