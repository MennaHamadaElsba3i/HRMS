import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiX,
  FiUser,
  FiCalendar,
  FiAward,
  FiFileText,
  FiTarget,
  FiCheck,
  FiLock,
  FiLoader,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import {
  useEvaluationPeriods,
  useEvaluationCategories,
  useCreateEvaluationDraft,
  useUpdateEvaluationDraft,
  useCompleteEvaluation,
} from "../hooks/useEvaluations";
import axiosInstance from "../../../utils/axiosInstance";
import { getEmployeeName, getEmployeeUsername } from "../utils/evaluationNames";

export default function EvaluationModal({
  isOpen,
  onClose,
  evaluation = null,
  role = "hr",
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  // هل الـ evaluation مكتملة ومقفولة؟
  const isCompleted =
    String(evaluation?.status || "").toLowerCase() === "completed";

  const { data: periods = [] } = useEvaluationPeriods();
  const { data: categories = [] } = useEvaluationCategories();

  const createDraftMutation = useCreateEvaluationDraft();
  const updateDraftMutation = useUpdateEvaluationDraft();
  const completeMutation = useCompleteEvaluation();

  // Employee list
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Form State
  const [userId, setUserId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [scores, setScores] = useState({}); // { [categoryId]: scoreNumber }
  const [evidenceList, setEvidenceList] = useState([]); // [ { goal_title: "", description: "" } ]

  // Fetch employees
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const endpoint =
          role === "manager" ? "/manager/employees" : "/employees";
        const res = await axiosInstance.get(endpoint);
        const list =
          res?.data?.data?.employees ||
          res?.data?.employees ||
          res?.data?.data ||
          res?.data ||
          [];
        if (isMounted) {
          setEmployees(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Failed to load employees for evaluation modal:", err);
      } finally {
        if (isMounted) setLoadingEmployees(false);
      }
    };

    fetchEmployees();
    return () => {
      isMounted = false;
    };
  }, [isOpen, role]);

  // Populate form if editing
  useEffect(() => {
    if (evaluation) {
      setUserId(String(evaluation.user_id || ""));
      setPeriodId(String(evaluation.period_id || ""));
      setFeedback(evaluation.feedback || "");

      const initialScores = {};
      if (Array.isArray(evaluation.scores)) {
        evaluation.scores.forEach((s) => {
          initialScores[s.category_id] = s.score;
        });
      }
      setScores(initialScores);

      if (Array.isArray(evaluation.evidence) && evaluation.evidence.length > 0) {
        setEvidenceList(
          evaluation.evidence.map((ev) => ({
            goal_id: ev.goal_id,
            goal_title: ev.goal_title || "",
            description: ev.description || "",
          }))
        );
      } else {
        setEvidenceList([]);
      }
    } else {
      setUserId("");
      setPeriodId(periods[0]?.id ? String(periods[0].id) : "");
      setFeedback("");

      // Set default scores based on available categories
      const initialScores = {};
      categories.forEach((cat) => {
        initialScores[cat.id] = Math.round((Number(cat.max_score) || 10) * 0.8);
      });
      setScores(initialScores);
      setEvidenceList([]);
    }
  }, [evaluation, periods, categories, isOpen]);

  // Calculate dynamic overall score
  const calculatedOverallScore = useMemo(() => {
    if (categories.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalMaxWeightedScore = 0;

    categories.forEach((cat) => {
      const weight = Number(cat.weight) || 1;
      const maxScore = Number(cat.max_score) || 10;
      const userScore =
        scores[cat.id] != null ? Number(scores[cat.id]) : maxScore * 0.8;

      totalWeightedScore += userScore * weight;
      totalMaxWeightedScore += maxScore * weight;
    });

    if (totalMaxWeightedScore === 0) return 0;
    return Math.round((totalWeightedScore / totalMaxWeightedScore) * 1000) / 10;
  }, [categories, scores]);

  if (!isOpen) return null;

  const handleScoreChange = (categoryId, val) => {
    setScores((prev) => ({
      ...prev,
      [categoryId]: Number(val),
    }));
  };

  const handleAddEvidence = () => {
    setEvidenceList((prev) => [
      ...prev,
      { goal_title: "", description: "" },
    ]);
  };

  const handleRemoveEvidence = (index) => {
    setEvidenceList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleEvidenceChange = (index, field, val) => {
    setEvidenceList((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: val } : item
      )
    );
  };

  const buildPayload = () => {
    const scoresArray = categories.map((cat) => ({
      category_id: cat.id,
      score: scores[cat.id] != null ? Number(scores[cat.id]) : 0,
    }));

    const validEvidence = evidenceList
      .filter((ev) => ev.goal_title && ev.goal_title.trim() !== "")
      .map((ev, idx) => ({
        goal_id: ev.goal_id || idx + 1,
        goal_title: ev.goal_title.trim(),
        description: ev.description ? ev.description.trim() : null,
      }));

    return {
      user_id: Number(userId),
      period_id: Number(periodId),
      overall_score: calculatedOverallScore,
      feedback: feedback.trim(),
      scores: scoresArray,
      evidence: validEvidence,
    };
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!userId || !periodId) return;

    const payload = buildPayload();
    if (evaluation?.id) {
      await updateDraftMutation.mutateAsync({ id: evaluation.id, data: payload });
    } else {
      await createDraftMutation.mutateAsync(payload);
    }
    onClose();
  };

  const handleSaveAndComplete = async (e) => {
    e.preventDefault();
    if (!userId || !periodId) return;

    const payload = buildPayload();
    let targetId = evaluation?.id;

    if (targetId) {
      await updateDraftMutation.mutateAsync({ id: targetId, data: payload });
    } else {
      const res = await createDraftMutation.mutateAsync(payload);
      targetId = res?.data?.id || res?.id;
    }

    if (targetId) {
      await completeMutation.mutateAsync(targetId);
    }
    onClose();
  };

  const isSaving =
    createDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    completeMutation.isPending;

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
              <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                <FiAward className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#102a43]">
                  {evaluation
                    ? t("evaluations.editEvaluationTitle", "Edit Performance Evaluation")
                    : t("evaluations.newEvaluationTitle", "Conduct Employee Performance Evaluation")}
                </h3>
                <p className="text-xs text-[#829ab1]">
                  {t(
                    "evaluations.modalSubtitle",
                    "Score categories, document achievements, and provide constructive feedback."
                  )}
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

          {/* Completed Banner */}
          {isCompleted && (
            <div className="mx-6 mt-4 flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <FiLock className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs font-semibold text-amber-700">
                {t(
                  "evaluations.completedReadOnly",
                  "This evaluation is completed and locked. You can view details but cannot modify it."
                )}
              </p>
            </div>
          )}

          {/* Form Content */}
          <form className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Top Row: Employee & Period & Calculated Score */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#f8fafc] p-4 rounded-2xl border border-[#e2e8f0]">
              {/* Employee Selection */}
              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1.5">
                  {t("evaluations.selectEmployee", "Employee")} *
                </label>
                <div className="relative">
                  <select
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={isCompleted}
                    className="w-full h-10 px-3 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] font-medium focus:outline-none focus:border-[#486581] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled hidden>
                      {loadingEmployees
                        ? t("evaluations.loadingEmployees", "Loading employees...")
                        : t("evaluations.chooseEmployee", "Select employee")}
                    </option>
                    {employees.map((emp) => {
                      const id = emp.id || emp.user_id || emp.userId;
                      const name = getEmployeeName(emp) || `Employee #${id}`;
                      const username = getEmployeeUsername(emp);
                      const title = emp.job_title || emp.position || emp.department?.name || "";
                      return (
                        <option key={id} value={id}>
                          {name}
                          {username && username.toLowerCase() !== name.toLowerCase()
                            ? ` (@${username})`
                            : ""}
                          {title ? ` (${title})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Period Selection */}
              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1.5">
                  {t("evaluations.selectPeriod", "Evaluation Period")} *
                </label>
                <select
                  required
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] font-medium focus:outline-none focus:border-[#486581]"
                >
                  <option value="" disabled hidden>
                    {t("evaluations.choosePeriod", "Select period")}
                  </option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Overall Score */}
              <div className="flex flex-col justify-center items-center sm:items-end bg-white p-3 rounded-xl border border-[#e2e8f0]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#829ab1]">
                  {t("evaluations.calculatedOverall", "Calculated Score")}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-[#102a43]">
                    {calculatedOverallScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#64748b] font-semibold">/ 100</span>
                </div>
              </div>
            </div>

            {/* Category Scoring */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#102a43] flex items-center gap-2">
                  <FiAward className="w-4 h-4 text-[#2563eb]" />
                  <span>
                    {t("evaluations.scoringCriteria", "Criteria & Category Scoring")}
                  </span>
                </h4>
                <span className="text-[11px] text-[#829ab1]">
                  {categories.length}{" "}
                  {t("evaluations.categoriesConfigured", "categories configured")}
                </span>
              </div>

              {categories.length === 0 ? (
                <div className="p-4 bg-[#f8fafc] rounded-xl border border-dashed border-[#cbd5e1] text-xs text-[#64748b] text-center">
                  {t(
                    "evaluations.noCategoriesWarning",
                    "No evaluation categories found. Please create categories first."
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {categories.map((cat) => {
                    const max = Number(cat.max_score) || 10;
                    const currentScore =
                      scores[cat.id] != null
                        ? Number(scores[cat.id])
                        : Math.round(max * 0.8);

                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 bg-white border border-[#e2e8f0] rounded-2xl hover:border-[#cbd5e1] transition space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-xs font-bold text-[#102a43]">
                              {cat.name}
                            </h5>
                            <span className="text-[10px] text-[#829ab1]">
                              {t("evaluations.weight", "Weight")}: {cat.weight}x
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max={max}
                              step="0.5"
                              value={currentScore}
                              onChange={(e) =>
                                handleScoreChange(cat.id, e.target.value)
                              }
                              className="w-16 h-8 text-center bg-[#f8fafc] border border-[#d9e2ec] rounded-lg text-xs font-bold text-[#102a43] focus:outline-none focus:border-[#2563eb]"
                            />
                            <span className="text-[11px] text-[#94a3b8] font-semibold">
                              / {max}
                            </span>
                          </div>
                        </div>

                        {/* Range slider for quick setting */}
                        <input
                          type="range"
                          min="0"
                          max={max}
                          step="0.5"
                          value={currentScore}
                          onChange={(e) =>
                            handleScoreChange(cat.id, e.target.value)
                          }
                          className="w-full accent-[#2563eb] cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Evaluator Feedback */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#102a43] block mb-1.5 flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-[#059669]" />
                <span>{t("evaluations.feedbackLabel", "Evaluator Feedback & Recommendations")} *</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder={t(
                  "evaluations.feedbackPlaceholder",
                  "Provide detailed feedback on the employee's strengths, accomplishments, and areas for improvement..."
                )}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-3.5 bg-white border border-[#d9e2ec] rounded-2xl text-xs text-[#102a43] placeholder-[#94a3b8] focus:outline-none focus:border-[#486581] resize-none"
              />
            </div>

            {/* Evidence & Linked Goals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#102a43] flex items-center gap-2">
                  <FiTarget className="w-4 h-4 text-[#d97706]" />
                  <span>
                    {t(
                      "evaluations.evidenceSectionTitle",
                      "Evidence & Linked Accomplishments (Optional)"
                    )}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleAddEvidence}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563eb] hover:underline"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>{t("evaluations.addGoalEvidence", "Add Evidence Goal")}</span>
                </button>
              </div>

              {evidenceList.length === 0 ? (
                <p className="text-[11px] text-[#829ab1] bg-[#f8fafc] p-3 rounded-xl border border-dashed border-[#cbd5e1]">
                  {t(
                    "evaluations.noEvidenceAdded",
                    "No specific goals linked as evidence. Click above to attach milestone achievements."
                  )}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {evidenceList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-start gap-2"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder={t(
                            "evaluations.goalTitlePlaceholder",
                            "Goal / Milestone Title (e.g. Delivered Core Feature)"
                          )}
                          value={item.goal_title}
                          onChange={(e) =>
                            handleEvidenceChange(idx, "goal_title", e.target.value)
                          }
                          className="w-full h-8 px-2.5 bg-white border border-[#d9e2ec] rounded-lg text-xs text-[#102a43] focus:outline-none focus:border-[#486581]"
                        />
                        <input
                          type="text"
                          placeholder={t(
                            "evaluations.evidenceDescPlaceholder",
                            "Evidence description or metric achieved"
                          )}
                          value={item.description}
                          onChange={(e) =>
                            handleEvidenceChange(idx, "description", e.target.value)
                          }
                          className="w-full h-8 px-2.5 bg-white border border-[#d9e2ec] rounded-lg text-xs text-[#102a43] focus:outline-none focus:border-[#486581]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(idx)}
                        className="p-1.5 text-[#94a3b8] hover:text-[#dc2626] transition"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#64748b] hover:bg-[#e2e8f0] rounded-xl transition"
            >
              {isCompleted
                ? t("evaluations.close", "Close")
                : t("evaluations.cancel", "Cancel")}
            </button>

            {/* أزرار الحفظ — مخفية للـ Completed */}
            {!isCompleted && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving || !userId || !periodId}
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#cbd5e1] text-[#102a43] hover:bg-[#f8fafc] text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isSaving && <FiLoader className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t("evaluations.saveDraft", "Save as Draft")}</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving || !userId || !periodId}
                  onClick={handleSaveAndComplete}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#102a43] hover:bg-[#1a3857] text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <FiLoader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FiLock className="w-3.5 h-3.5" />
                  )}
                  <span>{t("evaluations.saveAndComplete", "Complete & Lock")}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
