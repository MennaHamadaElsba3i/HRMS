import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAward,
  FiCalendar,
  FiUser,
  FiCheckCircle,
  FiLock,
  FiFileText,
  FiTarget,
  FiTrendingUp,
  FiEye,
  FiRefreshCw,
} from "react-icons/fi";
import { useEmployeeEvaluations } from "../hooks/useEvaluations";
import EvaluationDetailsModal from "../components/EvaluationDetailsModal";
import {
  getEvaluationEmployeeUsername,
  getEvaluationEvaluatorName,
  getEvaluationEvaluatorUsername,
} from "../utils/evaluationNames";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function EmployeeEvaluationsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const { data: evaluations = [], isLoading, isError, refetch, isFetching } =
    useEmployeeEvaluations();

  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Stats
  const stats = useMemo(() => {
    if (evaluations.length === 0) {
      return { latestScore: null, avgScore: 0, total: 0 };
    }
    const latest = evaluations[0]?.overall_score;
    const sum = evaluations.reduce(
      (acc, curr) => acc + (Number(curr.overall_score) || 0),
      0
    );
    return {
      latestScore: latest != null ? Number(latest).toFixed(1) : "—",
      avgScore: Math.round((sum / evaluations.length) * 10) / 10,
      total: evaluations.length,
    };
  }, [evaluations]);

  const handleOpenDetails = (evalItem) => {
    setSelectedEvaluation(evalItem);
    setIsDetailsOpen(true);
  };

  const getScoreColor = (score) => {
    const num = Number(score) || 0;
    if (num >= 90) return "text-[#059669] bg-[#ecfdf5] border-[#a7f3d0]";
    if (num >= 75) return "text-[#2563eb] bg-[#eff6ff] border-[#bfdbfe]";
    if (num >= 60) return "text-[#d97706] bg-[#fefce8] border-[#fde68a]";
    return "text-[#dc2626] bg-[#fef2f2] border-[#fecaca]";
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 pb-12 font-sans"
    >
      {/* 1. Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <span className="text-[11px] font-bold tracking-wider text-[#2563eb] uppercase mb-1 block">
            {t("evaluations.myPerformanceTag", "MY PERFORMANCE REVIEWS")}
          </span>
          <h1 className="text-2xl md:text-[28px] font-bold text-[#102a43] tracking-tight">
            {t("evaluations.employeeTitle", "My Performance Evaluations")}
          </h1>
          <p className="text-sm text-[#829ab1] mt-1">
            {t(
              "evaluations.employeeSubtitle",
              "Track your appraisal history, review supervisor feedback, and monitor your career milestones."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-4 py-2.5 text-xs font-semibold text-[#102a43] hover:bg-[#f8fafc] transition shadow-sm self-start sm:self-auto"
        >
          <FiRefreshCw
            className={`w-4 h-4 text-[#64748b] ${
              isFetching ? "animate-spin text-[#2563eb]" : ""
            }`}
          />
          <span>{t("evaluations.refresh", "Refresh")}</span>
        </button>
      </motion.div>

      {/* 2. Top Metric Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Latest Score */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
              {t("evaluations.latestScore", "Latest Score")}
            </span>
            <div className="text-2xl font-black text-[#102a43] mt-1 flex items-baseline gap-1">
              {stats.latestScore}
              {stats.latestScore !== "—" && (
                <span className="text-xs text-[#829ab1] font-normal">/ 100</span>
              )}
            </div>
            <span className="text-[11px] text-[#059669] font-semibold mt-0.5 block">
              {t("evaluations.mostRecentCycle", "Most recent review cycle")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
            <FiAward className="w-6 h-6" />
          </div>
        </div>

        {/* Historical Avg */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
              {t("evaluations.careerAverage", "Career Average")}
            </span>
            <div className="text-2xl font-black text-[#102a43] mt-1 flex items-baseline gap-1">
              {stats.avgScore}
              <span className="text-xs text-[#829ab1] font-normal">/ 100</span>
            </div>
            <span className="text-[11px] text-[#64748b] mt-0.5 block">
              {t("evaluations.acrossAllReviews", "Across all completed evaluations")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
            <FiTrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Reviews */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
              {t("evaluations.completedReviews", "Completed Reviews")}
            </span>
            <div className="text-2xl font-black text-[#102a43] mt-1">
              {stats.total}
            </div>
            <span className="text-[11px] text-[#64748b] mt-0.5 block">
              {t("evaluations.lockedAndArchived", "Official locked records")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#fefce8] text-[#d97706] flex items-center justify-center">
            <FiLock className="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      {/* 3. Evaluation Cards / History */}
      <motion.div variants={itemVariants} className="space-y-4">
        {isError ? (
          <div className="p-8 text-center text-sm text-[#dc2626] bg-[#fef2f2] rounded-2xl border border-red-100">
            <p>
              {t(
                "evaluations.errorLoadingEmployee",
                "Could not load your evaluation history. Please try again."
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
          <div className="p-12 text-center text-xs text-[#64748b] bg-white rounded-2xl border border-[#e2e8f0]">
            <FiRefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-[#486581]" />
            <span>{t("evaluations.loadingHistory", "Loading your evaluations...")}</span>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
            <div className="w-14 h-14 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center mx-auto mb-3">
              <FiAward className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-[#102a43]">
              {t("evaluations.noEmployeeEvaluations", "No evaluations published yet")}
            </h3>
            <p className="text-xs text-[#829ab1] mt-1 max-w-sm mx-auto">
              {t(
                "evaluations.noEmployeeEvaluationsDesc",
                "Once your manager or HR conducts and completes your performance evaluation, it will appear here."
              )}
            </p>
          </div>
        ) : (
          evaluations.map((item) => {
            const scoreVal = Number(item.overall_score) || 0;
            const evaluatorName = getEvaluationEvaluatorName(item) || "Manager";
            const evaluatorUsername = getEvaluationEvaluatorUsername(item);
            const employeeUsername = getEvaluationEmployeeUsername(item);

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition space-y-5"
              >
                {/* Top Row: Period & Evaluator & Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center font-black text-base shrink-0">
                      <FiAward className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#102a43]">
                          {item.period_name || t("evaluations.standardCycle", "Evaluation Cycle")}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ecfdf5] text-[#059669]">
                          <FiLock className="w-3 h-3" />
                          <span>{t("evaluations.statusCompleted", "Completed")}</span>
                        </span>
                      </div>
                      <p className="text-xs text-[#829ab1] mt-0.5">
                        {t("evaluations.evaluatedBy", "Evaluated by")}{" "}
                        <span className="font-semibold text-[#102a43]">
                          {evaluatorName}
                        </span>{" "}
                        {evaluatorUsername &&
                          evaluatorUsername.toLowerCase() !== evaluatorName.toLowerCase() &&
                          `(@${evaluatorUsername})`}
                        {" · "}
                        {item.created_at}
                      </p>
                      {employeeUsername && (
                        <p className="text-[11px] text-[#829ab1] mt-0.5">
                          @{employeeUsername}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div
                      className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${getScoreColor(
                        scoreVal
                      )}`}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {t("evaluations.score", "Score")}:
                      </span>
                      <span className="text-lg font-black">{scoreVal.toFixed(1)}%</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDetails(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] text-xs font-semibold text-[#102a43] border border-[#d9e2ec] transition shadow-sm"
                    >
                      <FiEye className="w-3.5 h-3.5 text-[#64748b]" />
                      <span>{t("evaluations.viewFullBreakdown", "Details")}</span>
                    </button>
                  </div>
                </div>

                {/* Categories Grid */}
                {Array.isArray(item.scores) && item.scores.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1] mb-2.5">
                      {t("evaluations.competencyBreakdown", "Competencies & Scores")}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {item.scores.map((scoreItem, idx) => {
                        const max = Number(scoreItem.max_score) || 10;
                        const val = Number(scoreItem.score) || 0;
                        const pct = Math.min(100, Math.round((val / max) * 100));

                        return (
                          <div
                            key={scoreItem.id || idx}
                            className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl"
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-[#102a43] truncate">
                                {scoreItem.category_name || `Category #${scoreItem.category_id}`}
                              </span>
                              <span className="font-black text-[#102a43]">
                                {val} / {max}
                              </span>
                            </div>
                            <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden mb-1.5">
                              <div
                                className="h-full bg-[#2563eb] rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#64748b]">
                              <span>{t("evaluations.weight", "Weight")}: {scoreItem.weight}x</span>
                              <span className="font-semibold text-[#059669]">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Feedback Quote */}
                {item.feedback && (
                  <div className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-xs text-[#334155] relative italic">
                    <span className="text-xl font-serif text-[#cbd5e1] absolute top-1.5 start-2">
                      “
                    </span>
                    <p className="ps-3.5 leading-relaxed">{item.feedback}</p>
                  </div>
                )}

                {/* Evidence / Goals Linked */}
                {Array.isArray(item.evidence) && item.evidence.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-[#64748b] flex items-center gap-1">
                      <FiTarget className="w-3.5 h-3.5 text-[#d97706]" />
                      <span>{t("evaluations.evidenceTagged", "Evidence Goals:")}</span>
                    </span>
                    {item.evidence.map((ev, idx) => (
                      <span
                        key={ev.id || idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#d9e2ec] text-[11px] font-medium text-[#102a43]"
                      >
                        <FiCheckCircle className="w-3 h-3 text-[#059669]" />
                        <span>{ev.goal_title || `Goal #${ev.goal_id}`}</span>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Details Modal */}
      <EvaluationDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        evaluation={selectedEvaluation}
        canManage={false}
      />
    </motion.div>
  );
}
