import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiX,
  FiUser,
  FiCalendar,
  FiAward,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiTarget,
  FiActivity,
  FiLock,
  FiEdit3,
  FiLoader,
} from "react-icons/fi";
import { useCompleteEvaluation } from "../hooks/useEvaluations";
import {
  getEvaluationEmployeeName,
  getEvaluationEmployeeUsername,
  getEvaluationEvaluatorName,
  getEvaluationEvaluatorUsername,
} from "../utils/evaluationNames";

export default function EvaluationDetailsModal({
  isOpen,
  onClose,
  evaluation,
  onEdit,
  canManage = true,
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const completeMutation = useCompleteEvaluation();
  const employeeName = getEvaluationEmployeeName(evaluation);
  const employeeUsername = getEvaluationEmployeeUsername(evaluation);
  const evaluatorName = getEvaluationEvaluatorName(evaluation);
  const evaluatorUsername = getEvaluationEvaluatorUsername(evaluation);

  if (!isOpen || !evaluation) return null;

  const isCompleted =
    String(evaluation.status || "").toLowerCase() === "completed";

  const handleComplete = async () => {
    if (!evaluation.id) return;
    await completeMutation.mutateAsync(evaluation.id);
    onClose();
  };

  const getScoreColor = (score) => {
    const num = Number(score) || 0;
    if (num >= 90) return "text-[#059669] bg-[#ecfdf5] border-[#a7f3d0]";
    if (num >= 75) return "text-[#2563eb] bg-[#eff6ff] border-[#bfdbfe]";
    if (num >= 60) return "text-[#d97706] bg-[#fefce8] border-[#fde68a]";
    return "text-[#dc2626] bg-[#fef2f2] border-[#fecaca]";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f5f9] bg-gradient-to-r from-[#f8fafc] to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center font-bold text-lg">
                {employeeName ? employeeName.charAt(0).toUpperCase() : "E"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#102a43]">
                    {employeeName || t("evaluations.unassigned", "Employee")}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isCompleted
                        ? "bg-[#ecfdf5] text-[#059669]"
                        : "bg-[#fefce8] text-[#d97706]"
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <FiLock className="w-3 h-3" />
                        <span>{t("evaluations.statusCompleted", "Completed & Locked")}</span>
                      </>
                    ) : (
                      <>
                        <FiClock className="w-3 h-3" />
                        <span>{t("evaluations.statusDraft", "Draft")}</span>
                      </>
                    )}
                  </span>
                </div>
                {employeeUsername &&
                  employeeUsername.toLowerCase() !== employeeName.toLowerCase() && (
                    <p className="mt-0.5 text-[11px] text-[#829ab1]">
                      @{employeeUsername}
                    </p>
                  )}
                <p className="text-xs text-[#829ab1] mt-0.5">
                  {evaluation.job_title || "—"} · {evaluation.department || "—"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#94a3b8] hover:text-[#102a43] hover:bg-[#f1f5f9] transition"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Overall Score */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between ${getScoreColor(
                  evaluation.overall_score
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    {t("evaluations.overallScore", "Overall Score")}
                  </span>
                  <FiAward className="w-4 h-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black">
                    {evaluation.overall_score != null
                      ? Number(evaluation.overall_score).toFixed(1)
                      : "—"}
                  </span>
                  <span className="text-xs font-semibold opacity-70">/ 100</span>
                </div>
              </div>

              {/* Review Period */}
              <div className="p-4 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#64748b]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {t("evaluations.period", "Review Period")}
                  </span>
                  <FiCalendar className="w-4 h-4 text-[#94a3b8]" />
                </div>
                <div className="mt-2">
                  <span className="text-sm font-bold text-[#102a43] block truncate">
                    {evaluation.period_name || t("evaluations.standardCycle", "Evaluation Cycle")}
                  </span>
                  <span className="text-[11px] text-[#829ab1]">
                    ID #{evaluation.period_id || "—"}
                  </span>
                </div>
              </div>

              {/* Evaluator */}
              <div className="p-4 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#64748b]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {t("evaluations.evaluator", "Evaluator")}
                  </span>
                  <FiUser className="w-4 h-4 text-[#94a3b8]" />
                </div>
                <div className="mt-2">
                  <span className="text-sm font-bold text-[#102a43] block truncate">
                    {evaluatorName || "—"}
                  </span>
                  {evaluatorUsername &&
                    evaluatorUsername.toLowerCase() !== evaluatorName.toLowerCase() && (
                      <span className="text-[11px] text-[#829ab1] block truncate">
                        @{evaluatorUsername}
                      </span>
                    )}
                  <span className="text-[11px] text-[#829ab1]">
                    {evaluation.created_at || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Scores Breakdown */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#102a43] mb-3 flex items-center gap-2">
                <FiAward className="w-4 h-4 text-[#2563eb]" />
                <span>
                  {t("evaluations.categoryScores", "Category Scores Breakdown")}
                </span>
              </h4>

              {Array.isArray(evaluation.scores) && evaluation.scores.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {evaluation.scores.map((scoreItem, idx) => {
                    const max = Number(scoreItem.max_score) || 10;
                    const val = Number(scoreItem.score) || 0;
                    const percentage = Math.min(100, Math.round((val / max) * 100));

                    return (
                      <div
                        key={scoreItem.id || idx}
                        className="p-3.5 bg-white border border-[#e2e8f0] rounded-xl hover:border-[#cbd5e1] transition"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-[#102a43]">
                            {scoreItem.category_name ||
                              `${t("evaluations.category", "Category")} #${
                                scoreItem.category_id
                              }`}
                          </span>
                          <span className="text-xs font-extrabold text-[#102a43]">
                            {val}{" "}
                            <span className="text-[10px] text-[#94a3b8] font-normal">
                              / {max}
                            </span>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-[#2563eb] rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                          <span>
                            {t("evaluations.weight", "Weight")}:{" "}
                            <span className="font-semibold">{scoreItem.weight}x</span>
                          </span>
                          <span className="font-semibold text-[#059669]">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#829ab1] bg-[#f8fafc] p-4 rounded-xl border border-dashed border-[#cbd5e1]">
                  {t("evaluations.noScores", "No individual category scores recorded.")}
                </p>
              )}
            </div>

            {/* Evaluator Feedback */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#102a43] mb-3 flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-[#059669]" />
                <span>{t("evaluations.feedbackTitle", "Evaluator Feedback & Notes")}</span>
              </h4>

              <div className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-xs text-[#334155] leading-relaxed relative italic">
                <span className="text-2xl font-serif text-[#cbd5e1] absolute top-2 start-2">
                  “
                </span>
                <p className="ps-4">
                  {evaluation.feedback ||
                    t("evaluations.noFeedback", "No feedback comments provided.")}
                </p>
              </div>
            </div>

            {/* Evidence & Goals */}
            {Array.isArray(evaluation.evidence) && evaluation.evidence.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#102a43] mb-3 flex items-center gap-2">
                  <FiTarget className="w-4 h-4 text-[#d97706]" />
                  <span>
                    {t("evaluations.evidenceTitle", "Performance Evidence & Linked Goals")}
                  </span>
                </h4>

                <div className="space-y-2">
                  {evaluation.evidence.map((ev, idx) => (
                    <div
                      key={ev.id || idx}
                      className="p-3 bg-white border border-[#e2e8f0] rounded-xl flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#fefce8] text-[#d97706] flex items-center justify-center shrink-0 mt-0.5">
                        <FiTarget className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-[#102a43]">
                          {ev.goal_title || `Goal #${ev.goal_id}`}
                        </h5>
                        {ev.description && (
                          <p className="text-[11px] text-[#64748b] mt-0.5">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Logs Timeline */}
            {Array.isArray(evaluation.audit_logs) && evaluation.audit_logs.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#102a43] mb-3 flex items-center gap-2">
                  <FiActivity className="w-4 h-4 text-[#64748b]" />
                  <span>{t("evaluations.auditLogsTitle", "Audit History")}</span>
                </h4>

                <div className="border border-[#e2e8f0] rounded-2xl divide-y divide-[#f1f5f9] overflow-hidden bg-white">
                  {evaluation.audit_logs.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className="p-3 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                        <span className="font-semibold text-[#102a43] capitalize">
                          {log.action}
                        </span>
                        <span className="text-[#829ab1]">
                          {t("evaluations.by", "by")} {log.performed_by}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#94a3b8]">
                        {log.created_at}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#64748b] hover:bg-[#e2e8f0] rounded-xl transition"
            >
              {t("evaluations.close", "Close")}
            </button>

            {canManage && !isCompleted && (
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEdit(evaluation);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#cbd5e1] text-[#102a43] hover:bg-[#f8fafc] text-xs font-semibold rounded-xl transition shadow-sm"
                  >
                    <FiEdit3 className="w-3.5 h-3.5" />
                    <span>{t("evaluations.editDraft", "Edit Draft")}</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={completeMutation.isPending}
                  onClick={handleComplete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {completeMutation.isPending ? (
                    <FiLoader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FiLock className="w-3.5 h-3.5" />
                  )}
                  <span>{t("evaluations.completeAndLock", "Complete & Lock")}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
