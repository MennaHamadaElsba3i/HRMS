import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAward,
  FiPlus,
  FiCalendar,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiEye,
  FiEdit3,
  FiTrendingUp,
  FiUsers,
  FiLayers,
  FiRefreshCw,
} from "react-icons/fi";
import {
  useHrEvaluations,
  useManagerEvaluations,
  useEvaluationPeriods,
} from "../hooks/useEvaluations";
import EvaluationModal from "../components/EvaluationModal";
import EvaluationDetailsModal from "../components/EvaluationDetailsModal";
import PeriodsModal from "../components/PeriodsModal";
import CategoriesModal from "../components/CategoriesModal";
import {
  getEvaluationEmployeeName,
  getEvaluationEmployeeUsername,
  getEvaluationEvaluatorName,
  getEvaluationEvaluatorUsername,
} from "../utils/evaluationNames";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function EvaluationsManagementPage({ role = "hr" }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  // Data queries
  const hrQuery = useHrEvaluations();
  const managerQuery = useManagerEvaluations();
  const periodsQuery = useEvaluationPeriods();

  const query = role === "manager" ? managerQuery : hrQuery;
  const { data: evaluations = [], isLoading, isError, refetch, isFetching } = query;
  const periods = periodsQuery.data || [];

  // Modals state
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPeriodsModalOpen, setIsPeriodsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Filtered evaluations
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const queryStr = searchQuery.toLowerCase();
        const empName = getEvaluationEmployeeName(item).toLowerCase();
        const username = getEvaluationEmployeeUsername(item).toLowerCase();
        const title = (item.job_title || "").toLowerCase();
        const dept = (item.department || "").toLowerCase();
        const evaluator = getEvaluationEvaluatorName(item).toLowerCase();
        const evaluatorUsername = getEvaluationEvaluatorUsername(item).toLowerCase();
        if (
          !empName.includes(queryStr) &&
          !username.includes(queryStr) &&
          !title.includes(queryStr) &&
          !dept.includes(queryStr) &&
          !evaluator.includes(queryStr) &&
          !evaluatorUsername.includes(queryStr)
        ) {
          return false;
        }
      }

      // Period
      if (selectedPeriod !== "all" && String(item.period_id) !== String(selectedPeriod)) {
        return false;
      }

      // Status
      if (selectedStatus !== "all") {
        const status = String(item.status || "").toLowerCase();
        if (status !== selectedStatus.toLowerCase()) return false;
      }

      return true;
    });
  }, [evaluations, searchQuery, selectedPeriod, selectedStatus]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = evaluations.length;
    if (total === 0) {
      return { total: 0, completedCount: 0, avgScore: 0, completedRate: 0 };
    }

    const completed = evaluations.filter(
      (e) => String(e.status || "").toLowerCase() === "completed"
    );
    const scoreSum = evaluations.reduce(
      (acc, curr) => acc + (Number(curr.overall_score) || 0),
      0
    );

    return {
      total,
      completedCount: completed.length,
      avgScore: Math.round((scoreSum / total) * 10) / 10,
      completedRate: Math.round((completed.length / total) * 100),
    };
  }, [evaluations]);

  const handleOpenCreate = () => {
    setSelectedEvaluation(null);
    setIsEvalModalOpen(true);
  };

  const handleOpenEdit = (evalItem) => {
    setSelectedEvaluation(evalItem);
    setIsEvalModalOpen(true);
  };

  const handleOpenDetails = (evalItem) => {
    setSelectedEvaluation(evalItem);
    setIsDetailsModalOpen(true);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 pb-12 font-sans"
    >
      {/* 1. Header & Quick Actions */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <span className="text-[11px] font-bold tracking-wider text-[#2563eb] uppercase mb-1 block">
            {role === "manager"
              ? t("evaluations.teamReviewsTag", "TEAM PERFORMANCE")
              : t("evaluations.growthTag", "GROWTH & GOVERNANCE")}
          </span>
          <h1 className="text-2xl md:text-[28px] font-bold text-[#102a43] tracking-tight">
            {role === "manager"
              ? t("evaluations.managerTitle", "Team Evaluations")
              : t("evaluations.title", "Evaluations & Performance Reviews")}
          </h1>
          <p className="text-sm text-[#829ab1] mt-1">
            {role === "manager"
              ? t(
                  "evaluations.managerSubtitle",
                  "Evaluate your team members, score competencies, and guide performance milestones."
                )
              : t(
                  "evaluations.subtitle",
                  "Oversee employee appraisals, configure evaluation periods, and align organizational goals."
                )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsPeriodsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#102a43] hover:bg-[#f8fafc] transition shadow-sm"
          >
            <FiCalendar className="w-4 h-4 text-[#64748b]" />
            <span>{t("evaluations.periodsBtn", "Review Periods")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCategoriesModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#102a43] hover:bg-[#f8fafc] transition shadow-sm"
          >
            <FiLayers className="w-4 h-4 text-[#64748b]" />
            <span>{t("evaluations.categoriesBtn", "Categories & Weights")}</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#102a43] hover:bg-[#1a3857] text-white px-4 py-2.5 text-xs font-semibold transition shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            <span>{t("evaluations.newEvaluationBtn", "New Evaluation")}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. KPI Summary Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Total */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
              {t("evaluations.totalEvaluations", "Total Reviews")}
            </span>
            <div className="text-2xl font-black text-[#102a43] mt-1">
              {stats.total}
            </div>
            <span className="text-[11px] text-[#64748b] mt-0.5 block">
              {stats.completedCount} {t("evaluations.completed", "completed")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
            <FiUsers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Average Score */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
              {t("evaluations.avgScore", "Average Score")}
            </span>
            <div className="text-2xl font-black text-[#102a43] mt-1 flex items-baseline gap-1">
              {stats.avgScore}
              <span className="text-xs text-[#829ab1] font-normal">/ 100</span>
            </div>
            <span className="text-[11px] text-[#059669] font-semibold mt-0.5 block">
              {stats.avgScore >= 80 ? "Above Target" : "Standard Range"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
            <FiAward className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Completion Rate */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
              {t("evaluations.completionRate", "Completion Rate")}
            </span>
            <div className="text-2xl font-black text-[#102a43] mt-1">
              {stats.completedRate}%
            </div>
            <span className="text-[11px] text-[#64748b] mt-0.5 block">
              {stats.total - stats.completedCount} {t("evaluations.draftsPending", "drafts pending")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#fefce8] text-[#d97706] flex items-center justify-center">
            <FiTrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Active Periods */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
              {t("evaluations.activePeriods", "Active Periods")}
            </span>
            <div className="text-2xl font-black text-[#102a43] mt-1">
              {periods.filter((p) => String(p.status).toLowerCase() === "active").length}
            </div>
            <span className="text-[11px] text-[#64748b] mt-0.5 block">
              {periods.length} {t("evaluations.totalConfigured", "total cycles")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#fdf2f8] text-[#db2777] flex items-center justify-center">
            <FiCalendar className="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      {/* 3. Search & Filter Bar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      >
        <div className="relative flex-1">
          <FiSearch
            className={`absolute top-1/2 -translate-y-1/2 text-[#94a3b8] w-4 h-4 ${
              isRtl ? "right-3.5" : "left-3.5"
            }`}
          />
          <input
            type="text"
            placeholder={t(
              "evaluations.searchPlaceholder",
              "Search by employee, job title, department, evaluator..."
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full h-10 bg-[#f8fafc] border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] focus:outline-none focus:border-[#486581] ${
              isRtl ? "pr-10 pl-3.5" : "pl-10 pr-3.5"
            }`}
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period Filter */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="h-10 px-3 bg-[#f8fafc] border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] font-medium focus:outline-none focus:border-[#486581]"
          >
            <option value="all">
              {t("evaluations.allPeriods", "All Periods")}
            </option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 px-3 bg-[#f8fafc] border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] font-medium focus:outline-none focus:border-[#486581]"
          >
            <option value="all">{t("evaluations.allStatus", "All Status")}</option>
            <option value="completed">
              {t("evaluations.statusCompleted", "Completed")}
            </option>
            <option value="draft">
              {t("evaluations.statusDraft", "Draft")}
            </option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title={t("evaluations.refresh", "Refresh")}
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#d9e2ec] bg-[#f8fafc] text-[#64748b] hover:text-[#102a43] hover:bg-white transition"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin text-[#2563eb]" : ""}`}
            />
          </button>
        </div>
      </motion.div>

      {/* 4. Evaluations Table / List */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden"
      >
        {isError ? (
          <div className="p-8 text-center text-sm text-[#dc2626] bg-[#fef2f2]">
            <p>
              {t(
                "evaluations.errorLoading",
                "Failed to load evaluations list. Please try again."
              )}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-1.5 bg-[#dc2626] text-white text-xs font-semibold rounded-xl"
            >
              {t("evaluations.retry", "Retry")}
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-12 text-center text-xs text-[#64748b]">
            <FiRefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-[#486581]" />
            <span>{t("evaluations.loadingReviews", "Loading evaluations...")}</span>
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center mx-auto mb-3">
              <FiAward className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-[#102a43]">
              {t("evaluations.noEvaluationsFound", "No evaluations found")}
            </h3>
            <p className="text-xs text-[#829ab1] mt-1 max-w-sm mx-auto">
              {evaluations.length === 0
                ? t(
                    "evaluations.emptyPrompt",
                    "Begin by conducting the first performance evaluation for your team members."
                  )
                : t(
                    "evaluations.noFilterMatch",
                    "No evaluations match your current search and filter criteria."
                  )}
            </p>
            {evaluations.length === 0 && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-[#102a43] text-white text-xs font-semibold rounded-xl hover:bg-[#1a3857] transition shadow-sm"
              >
                {t("evaluations.startFirstReview", "Start First Evaluation")}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0] font-semibold">
                <tr>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px]">
                    {t("evaluations.colEmployee", "Employee")}
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px]">
                    {t("evaluations.colPeriod", "Period")}
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px]">
                    {t("evaluations.colEvaluator", "Evaluator")}
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px]">
                    {t("evaluations.colScore", "Overall Score")}
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px]">
                    {t("evaluations.colStatus", "Status")}
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-right">
                    {t("evaluations.colActions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredEvaluations.map((item) => {
                  const isCompleted =
                    String(item.status || "").toLowerCase() === "completed";
                  const scoreVal =
                    item.overall_score != null ? Number(item.overall_score) : null;
                  const employeeName =
                    getEvaluationEmployeeName(item) || `Employee #${item.user_id}`;
                  const employeeUsername = getEvaluationEmployeeUsername(item);
                  const evaluatorName = getEvaluationEvaluatorName(item);
                  const evaluatorUsername = getEvaluationEvaluatorUsername(item);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#fbfcfd] transition group cursor-pointer"
                      onClick={() => handleOpenDetails(item)}
                    >
                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center font-bold text-xs shrink-0">
                            {employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[#102a43] block truncate">
                              {employeeName}
                            </span>
                            <span className="text-[11px] text-[#829ab1] block truncate">
                              {employeeUsername &&
                              employeeUsername.toLowerCase() !== employeeName.toLowerCase()
                                ? `@${employeeUsername} · `
                                : ""}
                              {item.job_title || "—"} · {item.department || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Period */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#102a43] block truncate">
                          {item.period_name || `Period #${item.period_id}`}
                        </span>
                        <span className="text-[11px] text-[#94a3b8]">
                          {item.created_at || "—"}
                        </span>
                      </td>

                      {/* Evaluator */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-[#334155]">
                          {evaluatorName || "—"}
                        </span>
                        {evaluatorUsername &&
                          evaluatorUsername.toLowerCase() !== evaluatorName.toLowerCase() && (
                            <span className="text-[11px] text-[#829ab1] block truncate">
                              @{evaluatorUsername}
                            </span>
                          )}
                      </td>

                      {/* Overall Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black ${
                              scoreVal >= 90
                                ? "bg-[#ecfdf5] text-[#059669]"
                                : scoreVal >= 75
                                ? "bg-[#eff6ff] text-[#2563eb]"
                                : scoreVal >= 60
                                ? "bg-[#fefce8] text-[#d97706]"
                                : "bg-[#fef2f2] text-[#dc2626]"
                            }`}
                          >
                            {scoreVal != null ? scoreVal.toFixed(1) : "—"}%
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? "bg-[#ecfdf5] text-[#059669]"
                              : "bg-[#fefce8] text-[#d97706]"
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <FiLock className="w-3 h-3" />
                              <span>
                                {t("evaluations.statusCompleted", "Completed")}
                              </span>
                            </>
                          ) : (
                            <>
                              <FiClock className="w-3 h-3" />
                              <span>{t("evaluations.statusDraft", "Draft")}</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details — دايماً */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(item)}
                            title={t("evaluations.viewDetails", "View Details")}
                            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#102a43] hover:bg-[#f1f5f9] transition"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>

                          {/* Edit — بس للـ Draft */}
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              title={t("evaluations.editDraft", "Edit Draft")}
                              className="p-1.5 rounded-lg text-[#2563eb] hover:bg-[#eff6ff] transition"
                            >
                              <FiEdit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Complete & Lock — بس للـ Draft */}
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEvaluation(item);
                                setIsDetailsModalOpen(true);
                              }}
                              title={t("evaluations.completeAndLock", "Complete & Lock")}
                              className="p-1.5 rounded-lg text-[#059669] hover:bg-[#ecfdf5] transition"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <EvaluationModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        evaluation={selectedEvaluation}
        role={role}
      />

      <EvaluationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        evaluation={selectedEvaluation}
        onEdit={handleOpenEdit}
        canManage={true}
      />

      <PeriodsModal
        isOpen={isPeriodsModalOpen}
        onClose={() => setIsPeriodsModalOpen(false)}
      />

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
    </motion.div>
  );
}
