import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTarget,
  FiCalendar,
  FiCheckCircle,
  FiMoreHorizontal,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";

import {
  useGoals,
  useGoalDetails,
  useMarkGoalCompleted,
} from "../hooks/useGoals";

const FILTERS = [
  {
    id: "all",
    labelKey: "employeeGoals.filters.all",
    defaultLabel: "All",
  },
  {
    id: "active",
    labelKey: "employeeGoals.filters.active",
    defaultLabel: "Active",
  },
  {
    id: "completed",
    labelKey: "employeeGoals.filters.completed",
    defaultLabel: "Completed",
  },
  {
    id: "cancelled",
    labelKey: "employeeGoals.filters.cancelled",
    defaultLabel: "Cancelled",
  },
];

const Goals = () => {
  const { t, i18n } = useTranslation();

  const isRtl = i18n.language?.startsWith("ar");
  const lang = isRtl ? "ar" : "en";

  // =====================================================
  // Filter & Pagination
  // =====================================================

  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // =====================================================
  // Detail Modal
  // =====================================================

  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // =====================================================
  // Menu
  // =====================================================

  const [openMenuId, setOpenMenuId] = useState(null);

  // =====================================================
  // React Query - Goals
  // =====================================================

  const {
    data: goalsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGoals({
    status: activeFilter,
    page: currentPage,
    per_page: 15,
    lang,
  });

  // =====================================================
  // React Query - Goal Details
  // =====================================================

  const {
    data: goalDetailsResponse,
    isLoading: detailLoading,
    isError: detailError,
  } = useGoalDetails(selectedGoalId, lang);

  // =====================================================
  // React Query - Mark Goal Completed
  // =====================================================

  const markCompletedMutation = useMarkGoalCompleted();

  // =====================================================
  // Response Data & Selected Goal Resolution
  // =====================================================

  const goals = useMemo(() => {
    const data = goalsResponse?.data;
    if (Array.isArray(data?.goals)) return data.goals;
    if (Array.isArray(data)) return data;
    if (Array.isArray(goalsResponse?.goals)) return goalsResponse.goals;
    if (Array.isArray(goalsResponse)) return goalsResponse;
    return [];
  }, [goalsResponse]);

  const meta = goalsResponse?.data?.meta || goalsResponse?.meta || null;

  const goalFromList = useMemo(() => {
    if (!selectedGoalId) return null;
    return goals.find((g) => String(g.id) === String(selectedGoalId)) || null;
  }, [goals, selectedGoalId]);

  const selectedGoal = useMemo(() => {
    if (!selectedGoalId) return null;

    const rawData = goalDetailsResponse?.data;
    const apiGoal =
      rawData?.goal ||
      (rawData && typeof rawData === "object" && !Array.isArray(rawData) && (rawData.title || rawData.id) ? rawData : null) ||
      goalDetailsResponse?.goal ||
      (goalDetailsResponse && typeof goalDetailsResponse === "object" && !Array.isArray(goalDetailsResponse) && (goalDetailsResponse.title || goalDetailsResponse.id) ? goalDetailsResponse : null);

    return apiGoal || goalFromList;
  }, [selectedGoalId, goalDetailsResponse, goalFromList]);

  // =====================================================
  // Error Message
  // =====================================================

  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    t("employeeGoals.errors.fetchFailed", "Failed to retrieve goals.");

  // =====================================================
  // Reset Page When Filter Changes
  // =====================================================

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    setCurrentPage(1);
  };

  // =====================================================
  // View Goal Details
  // =====================================================

  const handleViewDetails = (goalId) => {
    setOpenMenuId(null);
    setSelectedGoalId(goalId);
    setShowDetailModal(true);
  };

  // =====================================================
  // Close Details
  // =====================================================

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedGoalId(null);
  };

  // =====================================================
  // Mark Goal As Completed
  // =====================================================

  const handleMarkCompleted = async (goalId) => {
    setOpenMenuId(null);

    try {
      await markCompletedMutation.mutateAsync({
        goalId,
        lang,
      });

      toast.success(
        t(
          "employeeGoals.completedSuccess",
          "Goal marked as completed successfully.",
        ),
      );
    } catch (err) {
      console.error("Failed to mark goal as completed:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        t(
          "employeeGoals.errors.completeFailed",
          "Failed to mark goal as completed.",
        );

      toast.error(message);
    }
  };

  // =====================================================
  // Status Badge Style
  // =====================================================

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();

    if (s === "completed") {
      return {
        bg: "bg-[#f0fdf4]",
        text: "text-[#166534]",
        border: "border-[#bbf7d0]",
        stripe: "bg-[#22c55e]",
        dot: "bg-[#22c55e]",
      };
    }

    if (s === "cancelled") {
      return {
        bg: "bg-[#fef2f2]",
        text: "text-[#991b1b]",
        border: "border-[#fecaca]",
        stripe: "bg-[#ef4444]",
        dot: "bg-[#ef4444]",
      };
    }

    return {
      bg: "bg-[#eff6ff]",
      text: "text-[#1e40af]",
      border: "border-[#bfdbfe]",
      stripe: "bg-[#3b82f6]",
      dot: "bg-[#3b82f6]",
    };
  };

  // =====================================================
  // Status Label
  // =====================================================

  const getStatusLabel = (status) => {
    const s = status?.toLowerCase();

    if (s === "completed") {
      return t("employeeGoals.status.completed", "Completed");
    }

    if (s === "cancelled") {
      return t("employeeGoals.status.cancelled", "Cancelled");
    }

    if (s === "active") {
      return t("employeeGoals.status.active", "Active");
    }

    return status;
  };

  // =====================================================
  // Stats
  // =====================================================

  const stats = useMemo(() => {
    return {
      all: goals.length,

      active: goals.filter((g) => g.status?.toLowerCase() === "active").length,

      completed: goals.filter((g) => g.status?.toLowerCase() === "completed")
        .length,

      cancelled: goals.filter((g) => g.status?.toLowerCase() === "cancelled")
        .length,
    };
  }, [goals]);

  // =====================================================
  // Format Date
  // =====================================================

  const formatDate = (dateStr) => {
    if (!dateStr) return "";

    try {
      const date = new Date(dateStr);

      return date.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // =====================================================
  // Check Overdue
  // =====================================================

  const isOverdue = (targetDate, status) => {
    if (status?.toLowerCase() !== "active") {
      return false;
    }

    if (!targetDate) {
      return false;
    }

    return new Date(targetDate) < new Date();
  };

  // =====================================================
  // Pagination
  // =====================================================

  const totalPages = meta?.last_page || 1;

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="w-full space-y-6 pb-16 font-sans text-[#102a43]"
    >
      {/* =================================================
          Header
      ================================================= */}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          ease: "easeOut",
        }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#2f855a] uppercase mb-1">
            {t("employeeGoals.eyebrow", "GROWTH & DEVELOPMENT")}
          </p>

          <h1 className="text-2xl md:text-[28px] font-bold text-[#102a43] tracking-tight">
            {t("employeeGoals.title", "My goals")}
          </h1>

          <p className="text-sm text-[#829ab1] mt-1 font-normal">
            {t(
              "employeeGoals.subtitle",
              "Track your professional goals and development milestones.",
            )}
          </p>
        </div>
      </motion.div>

      {/* =================================================
          Filter Pills
      ================================================= */}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: 0.05,
        }}
        className="flex items-center gap-2.5 overflow-x-auto pb-1"
      >
        {FILTERS.map((filter) => {
          const count = stats[filter.id] || 0;
          const isActive = activeFilter === filter.id;

          return (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => handleFilterChange(filter.id)}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                isActive
                  ? "bg-[#1c364f] text-white"
                  : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <span>{t(filter.labelKey, filter.defaultLabel)}</span>

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

      {/* =================================================
          Content
      ================================================= */}

      <AnimatePresence mode="popLayout">
        {/* Loading */}
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-[#e2e8f0] bg-white p-16 text-center"
          >
            <FiLoader className="h-8 w-8 text-[#3b82f6] mb-3 animate-spin" />

            <p className="text-sm font-semibold text-[#102a43]">
              {t("employeeGoals.loading", "Loading goals...")}
            </p>
          </motion.div>
        ) : isError ? (
          /* Error */
          <motion.div
            key="error"
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            className="flex flex-col items-center justify-center rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-12 text-center"
          >
            <FiAlertCircle className="h-8 w-8 text-[#ef4444] mb-2" />

            <p className="text-sm font-semibold text-[#991b1b]">
              {errorMessage}
            </p>

            <motion.button
              whileHover={{
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.98,
              }}
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1c364f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#254360] transition"
            >
              <FiRefreshCw className="h-3.5 w-3.5" />

              <span>{t("employeeGoals.retry", "Try again")}</span>
            </motion.button>
          </motion.div>
        ) : goals.length > 0 ? (
          /* Goals */
          <motion.div layout className="space-y-4">
            {goals.map((goal, index) => {
              const statusStyle = getStatusStyle(goal.status);

              const overdue = isOverdue(goal.target_date, goal.status);

              const isCompleting =
                markCompletedMutation.isPending &&
                markCompletedMutation.variables?.goalId === goal.id;

              return (
                <motion.article
                  layout
                  key={goal.id}
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.98,
                    transition: {
                      duration: 0.2,
                    },
                  }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{
                    y: -1,
                    transition: {
                      duration: 0.15,
                    },
                  }}
                  onClick={() => handleViewDetails(goal.id)}
                  className="relative flex flex-col justify-between rounded-2xl border border-[#e2e8f0] bg-white p-6 pl-10 pr-6 rtl:pr-10 rtl:pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Side Stripe */}

                  <div
                    className={`absolute left-5 rtl:left-auto rtl:right-5 top-6 bottom-6 w-[3.5px] rounded-full ${statusStyle.stripe}`}
                  />

                  <div>
                    {/* Header */}

                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                        />

                        {getStatusLabel(goal.status)}
                      </span>

                      {/* Menu */}

                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="text-[#94a3b8] hover:text-[#1e293b] p-1 transition"
                          aria-label="More options"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === goal.id ? null : goal.id,
                            );
                          }}
                        >
                          <FiMoreHorizontal className="h-5 w-5" />
                        </button>

                        <AnimatePresence>
                          {openMenuId === goal.id && (
                            <motion.div
                              initial={{
                                opacity: 0,
                                scale: 0.95,
                                y: -4,
                              }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                              }}
                              exit={{
                                opacity: 0,
                                scale: 0.95,
                                y: -4,
                              }}
                              transition={{
                                duration: 0.15,
                              }}
                              className={`absolute top-8 z-20 w-44 rounded-xl border border-[#e2e8f0] bg-white py-1.5 shadow-lg ${
                                isRtl ? "left-0" : "right-0"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleViewDetails(goal.id)}
                                className="w-full px-4 py-2 text-xs font-medium text-[#334155] hover:bg-[#f8fafc] transition text-start"
                              >
                                {t("employeeGoals.viewDetails", "View details")}
                              </button>

                              {goal.status?.toLowerCase() === "active" && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkCompleted(goal.id)}
                                  disabled={isCompleting}
                                  className="w-full px-4 py-2 text-xs font-medium text-[#166534] hover:bg-[#f0fdf4] transition text-start disabled:opacity-50"
                                >
                                  {isCompleting
                                    ? t(
                                        "employeeGoals.completing",
                                        "Completing...",
                                      )
                                    : t(
                                        "employeeGoals.markCompleted",
                                        "Mark as completed",
                                      )}
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Title */}

                    <div className="mt-3">
                      <h3 className="text-base font-bold text-[#102a43] tracking-tight">
                        {goal.title}
                      </h3>

                      {goal.description && (
                        <p className="text-xs text-[#627d98] mt-1 line-clamp-2">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom */}

                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Dates */}

                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center gap-1.5 text-xs ${
                          overdue ? "text-[#dc2626]" : "text-[#829ab1]"
                        }`}
                      >
                        <FiCalendar className="h-3.5 w-3.5" />

                        <span>
                          {t("employeeGoals.targetDate", "Target")}:{" "}
                          {formatDate(goal.target_date)}
                        </span>

                        {overdue && (
                          <span className="rounded bg-[#fef2f2] px-1.5 py-0.5 text-[10px] font-semibold text-[#dc2626] border border-[#fecaca]">
                            {t("employeeGoals.overdue", "Overdue")}
                          </span>
                        )}
                      </div>

                      {goal.created_at && (
                        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#94a3b8]">
                          <span>
                            {t("employeeGoals.created", "Created")}:{" "}
                            {formatDate(goal.created_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action */}

                    <div className="shrink-0 self-end sm:self-auto">
                      {goal.status?.toLowerCase() === "active" && (
                        <motion.button
                          whileHover={{
                            scale: 1.02,
                          }}
                          whileTap={{
                            scale: 0.98,
                          }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkCompleted(goal.id);
                          }}
                          disabled={isCompleting}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2 text-xs font-semibold text-[#166534] hover:bg-[#dcfce7] transition shadow-sm disabled:opacity-50"
                        >
                          {isCompleting ? (
                            <FiLoader className="h-4 w-4 animate-spin" />
                          ) : (
                            <FiCheckCircle className="h-4 w-4" />
                          )}

                          <span>
                            {isCompleting
                              ? t("employeeGoals.completing", "Completing...")
                              : t(
                                  "employeeGoals.markCompleted",
                                  "Mark as completed",
                                )}
                          </span>
                        </motion.button>
                      )}

                      {goal.status?.toLowerCase() === "completed" && (
                        <div className="inline-flex items-center gap-2 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] px-4 py-2 text-xs font-medium text-[#166534]">
                          <FiCheckCircle className="h-3.5 w-3.5" />

                          <span>
                            {t("employeeGoals.status.completed", "Completed")}
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
          /* Empty */
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e2e8f0] bg-white p-12 text-center"
          >
            <FiTarget className="h-8 w-8 text-[#94a3b8] mb-2" />

            <p className="text-sm font-semibold text-[#102a43]">
              {t("employeeGoals.noGoals", "No goals found")}
            </p>

            <p className="text-xs text-[#829ab1] mt-1">
              {t(
                "employeeGoals.noGoalsDesc",
                "No goals match the selected filter.",
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================
          Pagination
      ================================================= */}

      {!isLoading && !isError && totalPages > 1 && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.2,
          }}
          className="flex items-center justify-center gap-2 pt-2"
        >
          {/* Previous */}

          <motion.button
            whileTap={{
              scale: 0.95,
            }}
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRtl ? (
              <FiChevronRight className="h-4 w-4" />
            ) : (
              <FiChevronLeft className="h-4 w-4" />
            )}
          </motion.button>

          {/* Page Numbers */}

          {Array.from(
            {
              length: totalPages,
            },
            (_, i) => i + 1,
          )
            .filter((page) => {
              return (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              );
            })
            .reduce((acc, page, i, arr) => {
              if (i > 0 && page - arr[i - 1] > 1) {
                acc.push(
                  <span
                    key={`dots-${page}`}
                    className="px-1 text-xs text-[#94a3b8]"
                  >
                    ...
                  </span>,
                );
              }

              acc.push(
                <motion.button
                  whileTap={{
                    scale: 0.95,
                  }}
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg text-xs font-semibold transition ${
                    currentPage === page
                      ? "bg-[#1c364f] text-white"
                      : "border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                  }`}
                >
                  {page}
                </motion.button>,
              );

              return acc;
            }, [])}

          {/* Next */}

          <motion.button
            whileTap={{
              scale: 0.95,
            }}
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRtl ? (
              <FiChevronLeft className="h-4 w-4" />
            ) : (
              <FiChevronRight className="h-4 w-4" />
            )}
          </motion.button>
        </motion.div>
      )}

      {/* =================================================
          Pagination Info
      ================================================= */}

      {!isLoading && !isError && meta && (
        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="text-center text-[11px] text-[#94a3b8]"
        >
          {t("employeeGoals.showing", "Showing")} {meta.from || 0}–
          {meta.to || 0} {t("employeeGoals.of", "of")} {meta.total || 0}{" "}
          {t("employeeGoals.goalsLabel", "goals")}
        </motion.p>
      )}

      {/* =================================================
          Goal Details Modal
      ================================================= */}

      <AnimatePresence>
        {showDetailModal && (
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
            onClick={handleCloseDetail}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 12,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 12,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[500px] rounded-2xl bg-white p-7 shadow-2xl"
            >
              {selectedGoal ? (
                <>
                  {/* Header */}

                  <div className="flex items-start justify-between pb-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                          {t("employeeGoals.goalDetails", "GOAL DETAILS")}
                        </p>

                        <h2 className="text-lg font-bold text-[#102a43] mt-0.5">
                          {selectedGoal.title}
                        </h2>
                      </div>
                      {detailLoading && (
                        <FiLoader className="h-4 w-4 text-[#3b82f6] animate-spin ml-2" />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCloseDetail}
                      className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Status */}

                  {(() => {
                    const style = getStatusStyle(selectedGoal.status);

                    return (
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${style.bg} ${style.text} ${style.border} mb-5`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                        />

                        {getStatusLabel(selectedGoal.status)}
                      </div>
                    );
                  })()}

                  {/* Description */}

                  {selectedGoal.description && (
                    <div className="mb-5">
                      <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                        {t("employeeGoals.description", "Description")}
                      </label>

                      <div className="rounded-xl bg-[#f8fafc] px-4 py-3 border border-[#f1f5f9]">
                        <p className="text-xs text-[#334155] leading-relaxed">
                          {selectedGoal.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dates */}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-[#64748b] mb-1">
                        {t("employeeGoals.targetDateLabel", "Target date")}
                      </label>

                      <div className="flex items-center gap-1.5">
                        <FiCalendar className="h-3.5 w-3.5 text-[#94a3b8]" />

                        <span className="text-xs font-medium text-[#102a43]">
                          {formatDate(selectedGoal.target_date)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#64748b] mb-1">
                        {t("employeeGoals.createdAt", "Created at")}
                      </label>

                      <span className="text-xs font-medium text-[#102a43]">
                        {formatDate(selectedGoal.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Complete */}

                  {selectedGoal.status?.toLowerCase() === "active" && (
                    <motion.button
                      whileHover={{
                        scale: 1.01,
                      }}
                      whileTap={{
                        scale: 0.98,
                      }}
                      type="button"
                      onClick={() => handleMarkCompleted(selectedGoal.id)}
                      disabled={markCompletedMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1c364f] py-3 px-4 text-xs font-semibold text-white hover:bg-[#254360] transition shadow-sm disabled:opacity-60"
                    >
                      {markCompletedMutation.isPending ? (
                        <FiLoader className="h-4 w-4 animate-spin" />
                      ) : (
                        <FiCheckCircle className="h-4 w-4" />
                      )}

                      <span>
                        {markCompletedMutation.isPending
                          ? t("employeeGoals.completing", "Completing...")
                          : t(
                              "employeeGoals.markCompleted",
                              "Mark as completed",
                            )}
                      </span>
                    </motion.button>
                  )}
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================
          Click Away
      ================================================= */}

      {openMenuId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
};

export default Goals;
