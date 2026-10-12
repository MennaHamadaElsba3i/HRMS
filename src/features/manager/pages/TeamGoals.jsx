import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiUser,
  FiFileText,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
  FiPlus,
  FiEdit2,
  FiX,
  FiCheck,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import {
  useTeamGoals,
  useManagerEmployees,
  useCreateGoal,
  useUpdateGoal,
} from "../hooks/useGoals";

// =====================================================
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

// =====================================================
// STATUS CONFIG
// =====================================================

const statusConfig = {
  Active: {
    key: "active",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },

  Completed: {
    key: "completed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },

  Cancelled: {
    key: "cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

// =====================================================
// HELPERS
// =====================================================

const getStatusConfig = (status) => {
  return (
    statusConfig[status] || {
      key: "unknown",
      className: "bg-gray-50 text-gray-600 border-gray-200",
    }
  );
};

const formatDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// PAGE HEADER
// =====================================================

const PageHeader = ({ onCreate, isCreating }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-1 text-sm text-[#829AB1]">
          {t("manager.goals.breadcrumb")}
        </div>

        <h1 className="text-2xl font-semibold text-[#243B53]">
          {t("manager.goals.title")}
        </h1>

        <p className="mt-1 text-sm text-[#627D98]">
          {t("manager.goals.description")}
        </p>
      </div>

      <button
        type="button"
        onClick={onCreate}
        disabled={isCreating}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#243B53] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#334E68] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FiPlus size={17} />

        {isCreating
          ? t("manager.goals.creating")
          : t("manager.goals.createGoal")}
      </button>
    </div>
  );
};

// =====================================================
// GOAL MODAL
// =====================================================

const GoalModal = ({
  open,
  onClose,
  mode,
  goal,
  employees,
  isEmployeesLoading,
  onSubmit,
  isSubmitting,
}) => {
  const { t } = useTranslation();

  const isEdit = mode === "edit";

  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState("active");

  // ===================================================
  // INITIALIZE MODAL VALUES
  // ===================================================

  useEffect(() => {
    if (!open) return;

    if (isEdit && goal) {
      setEmployeeId(goal.user?.id ? String(goal.user.id) : "");
      setTitle(goal.title || "");
      setDescription(goal.description || "");
      setTargetDate(goal.target_date || "");
      setStatus(goal.status ? goal.status.toLowerCase() : "active");
    } else {
      setEmployeeId("");
      setTitle("");
      setDescription("");
      setTargetDate("");
      setStatus("active");
    }
  }, [open, isEdit, goal]);

  if (!open) return null;

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!employeeId) {
      toast.error(t("manager.goals.selectEmployeeError"));
      return;
    }

    if (!title.trim()) {
      toast.error(t("manager.goals.titleRequired"));
      return;
    }

    if (!targetDate) {
      toast.error(t("manager.goals.dateRequired"));
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      target_date: targetDate,
      employee_id: Number(employeeId),
    };

    if (isEdit) {
      payload.status = status;
    }

    await onSubmit(payload);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#102A43]/45 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 20,
            scale: 0.98,
          }}
          transition={{
            duration: 0.22,
          }}
          className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-2xl"
        >
          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-[#E6EDF3] px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-[#243B53]">
                {isEdit
                  ? t("manager.goals.editGoal")
                  : t("manager.goals.createNewGoal")}
              </h2>

              <p className="mt-1 text-sm text-[#829AB1]">
                {isEdit
                  ? t("manager.goals.updateGoalDetails")
                  : t("manager.goals.assignGoal")}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#627D98] transition hover:bg-[#F0F4F8] hover:text-[#243B53] disabled:opacity-50"
            >
              <FiX size={19} />
            </button>
          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="max-h-[75vh] overflow-y-auto px-6 py-6"
          >
            <div className="grid grid-cols-1 gap-5">
              {/* EMPLOYEE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#243B53]">
                  {t("manager.goals.employee")}
                </label>

                <div className="relative">
                  <FiUser
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#829AB1]"
                  />

                  <select
                    value={employeeId}
                    onChange={(event) => setEmployeeId(event.target.value)}
                    disabled={isEmployeesLoading || isSubmitting}
                    className="w-full appearance-none rounded-xl border border-[#D9E2EC] bg-white px-10 py-3 text-sm text-[#243B53] outline-none transition focus:border-[#486581] focus:ring-2 focus:ring-[#486581]/10 disabled:cursor-not-allowed disabled:bg-[#F0F4F8]"
                    required
                  >
                    <option value="">
                      {isEmployeesLoading
                        ? t("manager.goals.loadingEmployees")
                        : t("manager.goals.selectEmployee")}
                    </option>

                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TITLE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#243B53]">
                  {t("manager.goals.goalTitle")}
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={isSubmitting}
                  placeholder={t("manager.goals.enterGoalTitle")}
                  className="w-full rounded-xl border border-[#D9E2EC] bg-white px-4 py-3 text-sm text-[#243B53] outline-none transition placeholder:text-[#9FB3C8] focus:border-[#486581] focus:ring-2 focus:ring-[#486581]/10 disabled:bg-[#F0F4F8]"
                  required
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#243B53]">
                  {t("manager.goals.descriptionLabel")}
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  placeholder={t("manager.goals.enterGoalDescription")}
                  className="w-full resize-none rounded-xl border border-[#D9E2EC] bg-white px-4 py-3 text-sm text-[#243B53] outline-none transition placeholder:text-[#9FB3C8] focus:border-[#486581] focus:ring-2 focus:ring-[#486581]/10 disabled:bg-[#F0F4F8]"
                />
              </div>

              {/* TARGET DATE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#243B53]">
                  {t("manager.goals.targetDate")}
                </label>

                <div className="relative">
                  <FiCalendar
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#829AB1]"
                  />

                  <input
                    type="date"
                    value={targetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-[#D9E2EC] bg-white px-10 py-3 text-sm text-[#243B53] outline-none transition focus:border-[#486581] focus:ring-2 focus:ring-[#486581]/10 disabled:bg-[#F0F4F8]"
                    required
                  />
                </div>
              </div>

              {/* STATUS - EDIT ONLY */}

              {isEdit && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#243B53]">
                    {t("manager.goals.status")}
                  </label>

                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-[#D9E2EC] bg-white px-4 py-3 text-sm text-[#243B53] outline-none transition focus:border-[#486581] focus:ring-2 focus:ring-[#486581]/10 disabled:bg-[#F0F4F8]"
                  >
                    <option value="active">
                      {t("manager.goals.statuses.active")}
                    </option>

                    <option value="completed">
                      {t("manager.goals.statuses.completed")}
                    </option>

                    <option value="cancelled">
                      {t("manager.goals.statuses.cancelled")}
                    </option>
                  </select>
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-[#D9E2EC] px-5 py-3 text-sm font-semibold text-[#486581] transition hover:bg-[#F0F4F8] disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isEmployeesLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#243B53] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#334E68] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <FiLoader size={16} className="animate-spin" />
                ) : (
                  <FiCheck size={16} />
                )}

                {isEdit
                  ? isSubmitting
                    ? t("manager.goals.saving")
                    : t("manager.goals.saveChanges")
                  : isSubmitting
                    ? t("manager.goals.creating")
                    : t("manager.goals.createGoal")}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// =====================================================
// MAIN PAGE
// =====================================================

const TeamGoals = () => {
  const { t } = useTranslation();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedGoal, setSelectedGoal] = useState(null);

  // ===================================================
  // TEAM GOALS
  // ===================================================

  const { data, isLoading, isError, error, refetch, isFetching } = useTeamGoals(
    {
      page: 1,
      per_page: 15,
    },
  );

  // ===================================================
  // MANAGER EMPLOYEES
  // ===================================================

  const { data: employeesData, isLoading: isEmployeesLoading } =
    useManagerEmployees({
      status: "active",
      page: 1,
      per_page: 15,
    });

  // ===================================================
  // MUTATIONS
  // ===================================================

  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();

  // ===================================================
  // DATA
  // ===================================================

  const goals = data?.data?.goals || [];
  const employees = employeesData?.data?.employees || [];

  // ===================================================
  // MODAL
  // ===================================================

  const openCreateModal = () => {
    setSelectedGoal(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEditModal = (goal) => {
    if (goal.status === "Completed" || goal.status === "Cancelled") {
      toast.error(t("manager.goals.cannotModify"));
      return;
    }

    setSelectedGoal(goal);
    setModalMode("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    setModalOpen(false);
    setSelectedGoal(null);
  };

  // ===================================================
  // CREATE
  // ===================================================

  const handleCreate = async (payload) => {
    try {
      await createMutation.mutateAsync(payload);

      toast.success(t("manager.goals.createSuccess"));

      setModalOpen(false);
      setSelectedGoal(null);
    } catch (mutationError) {
      toast.error(
        mutationError?.response?.data?.message ||
          t("manager.goals.createError"),
      );
    }
  };

  // ===================================================
  // UPDATE
  // ===================================================

  const handleUpdate = async (payload) => {
    if (!selectedGoal?.id) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedGoal.id,
        data: payload,
      });

      toast.success(t("manager.goals.updateSuccess"));

      setModalOpen(false);
      setSelectedGoal(null);
    } catch (mutationError) {
      toast.error(
        mutationError?.response?.data?.message ||
          t("manager.goals.updateError"),
      );
    }
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (payload) => {
    if (modalMode === "edit") {
      await handleUpdate(payload);
    } else {
      await handleCreate(payload);
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (isLoading) {
    return (
      <div className="min-h-full">
        <PageHeader onCreate={openCreateModal} isCreating={false} />

        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-[#D9E2EC] bg-white">
          <div className="flex flex-col items-center gap-3 text-[#627D98]">
            <FiLoader size={28} className="animate-spin" />

            <span className="text-sm">{t("manager.goals.loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (isError) {
    return (
      <div className="min-h-full">
        <PageHeader onCreate={openCreateModal} isCreating={false} />

        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/40 px-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <FiAlertCircle size={23} />
          </div>

          <h3 className="text-base font-semibold text-[#243B53]">
            {t("manager.goals.loadError")}
          </h3>

          <p className="mt-2 max-w-md text-sm text-[#627D98]">
            {error?.response?.data?.message ||
              t("manager.goals.loadErrorDescription")}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#243B53] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#334E68]"
          >
            <FiRefreshCw size={16} />

            {t("manager.goals.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="min-h-full">
      <PageHeader
        onCreate={openCreateModal}
        isCreating={createMutation.isPending}
      />

      {/* REFRESH INDICATOR */}

      {isFetching && !isLoading && (
        <div className="mb-4 flex items-center gap-2 text-xs text-[#829AB1]">
          <FiLoader size={13} className="animate-spin" />

          {t("manager.goals.updating")}
        </div>
      )}

      {/* EMPTY */}

      {goals.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9E2EC] bg-white px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0F4F8] text-[#627D98]">
            <FiFileText size={25} />
          </div>

          <h3 className="text-base font-semibold text-[#243B53]">
            {t("manager.goals.noGoals")}
          </h3>

          <p className="mt-2 max-w-md text-sm text-[#829AB1]">
            {t("manager.goals.createGoalDescription")}
          </p>

          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#243B53] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#334E68]"
          >
            <FiPlus size={16} />

            {t("manager.goals.createGoal")}
          </button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          {goals.map((goal) => {
            const status = getStatusConfig(goal.status);

            const canEdit =
              goal.status !== "Completed" && goal.status !== "Cancelled";

            return (
              <motion.div
                key={goal.id}
                variants={itemVariants}
                className="group rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* CARD TOP */}

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        {t(`manager.goals.statuses.${status.key}`, {
                          defaultValue:
                            goal.status || t("manager.goals.unknownStatus"),
                        })}
                      </span>

                      <span className="text-xs text-[#9FB3C8]">#{goal.id}</span>
                    </div>

                    <h3 className="truncate text-base font-semibold text-[#243B53]">
                      {goal.title}
                    </h3>
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => openEditModal(goal)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D9E2EC] text-[#627D98] opacity-100 transition hover:border-[#9FB3C8] hover:bg-[#F0F4F8] hover:text-[#243B53]"
                      title={t("manager.goals.editGoalTitle")}
                    >
                      <FiEdit2 size={16} />
                    </button>
                  )}
                </div>

                {/* EMPLOYEE */}

                <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E6EDF3] text-[#486581]">
                    <FiUser size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-[#829AB1]">
                      {t("manager.goals.assignedTo")}
                    </p>

                    <p className="truncate text-sm font-semibold text-[#243B53]">
                      {goal.user?.name || t("manager.goals.unknownEmployee")}
                    </p>
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#829AB1]">
                    <FiFileText size={14} />

                    {t("manager.goals.descriptionLabel")}
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-[#486581]">
                    {goal.description || t("manager.goals.noDescription")}
                  </p>
                </div>

                {/* META */}

                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-[#E6EDF3] pt-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <FiCalendar size={15} className="text-[#829AB1]" />

                    <div>
                      <p className="text-[11px] text-[#9FB3C8]">
                        {t("manager.goals.targetDate")}
                      </p>

                      <p className="text-sm font-medium text-[#486581]">
                        {formatDate(goal.target_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FiCalendar size={15} className="text-[#829AB1]" />

                    <div>
                      <p className="text-[11px] text-[#9FB3C8]">
                        {t("manager.goals.created")}
                      </p>

                      <p className="text-sm font-medium text-[#486581]">
                        {formatDate(goal.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* CREATE / EDIT MODAL */}

      <GoalModal
        open={modalOpen}
        onClose={closeModal}
        mode={modalMode}
        goal={selectedGoal}
        employees={employees}
        isEmployeesLoading={isEmployeesLoading}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default TeamGoals;
