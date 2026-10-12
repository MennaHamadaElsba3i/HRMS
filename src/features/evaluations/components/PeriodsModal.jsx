import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiX,
  FiPlus,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiToggleLeft,
  FiToggleRight,
  FiLoader,
} from "react-icons/fi";
import {
  useEvaluationPeriods,
  useCreateEvaluationPeriod,
  useToggleEvaluationPeriodStatus,
} from "../hooks/useEvaluations";

export default function PeriodsModal({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const { data: periods = [], isLoading } = useEvaluationPeriods();
  const createMutation = useCreateEvaluationPeriod();
  const toggleMutation = useToggleEvaluationPeriodStatus();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    status: "active",
  });

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.start_date || !formData.end_date) return;

    await createMutation.mutateAsync(formData);
    setFormData({
      name: "",
      start_date: "",
      end_date: "",
      status: "active",
    });
    setIsAdding(false);
  };

  const handleToggle = (id) => {
    toggleMutation.mutate(id);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f5f9] bg-gradient-to-r from-[#f8fafc] to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                <FiCalendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#102a43]">
                  {t("evaluations.periodsTitle", "Evaluation Periods")}
                </h3>
                <p className="text-xs text-[#829ab1]">
                  {t(
                    "evaluations.periodsSubtitle",
                    "Manage company evaluation review cycles and timeline status."
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

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Top Action */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b]">
                {t("evaluations.totalPeriods", "Total Periods")}: {periods.length}
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(!isAdding)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#102a43] hover:bg-[#1a3857] text-white text-xs font-medium rounded-xl transition shadow-sm"
              >
                <FiPlus className="w-4 h-4" />
                <span>
                  {isAdding
                    ? t("evaluations.cancel", "Cancel")
                    : t("evaluations.addPeriod", "New Period")}
                </span>
              </button>
            </div>

            {/* Add New Period Form */}
            <AnimatePresence>
              {isAdding && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreate}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 space-y-3"
                >
                  <h4 className="text-xs font-bold text-[#102a43] uppercase tracking-wider">
                    {t("evaluations.createPeriodTitle", "Create Evaluation Period")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                        {t("evaluations.periodName", "Period Name")} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Q1 2026 Evaluation"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full h-9 px-3 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] focus:outline-none focus:border-[#486581]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                        {t("evaluations.startDate", "Start Date")} *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({ ...formData, start_date: e.target.value })
                        }
                        className="w-full h-9 px-3 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] focus:outline-none focus:border-[#486581]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                        {t("evaluations.endDate", "End Date")} *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, end_date: e.target.value })
                        }
                        className="w-full h-9 px-3 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] focus:outline-none focus:border-[#486581]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                        {t("evaluations.status", "Initial Status")}
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full h-9 px-3 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] focus:outline-none focus:border-[#486581]"
                      >
                        <option value="active">
                          {t("evaluations.statusActive", "Active")}
                        </option>
                        <option value="inactive">
                          {t("evaluations.statusInactive", "Inactive")}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-1.5 text-xs text-[#64748b] hover:bg-[#e2e8f0] rounded-xl transition"
                    >
                      {t("evaluations.cancel", "Cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="px-4 py-1.5 bg-[#102a43] text-white text-xs font-semibold rounded-xl hover:bg-[#1a3857] transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {createMutation.isPending && (
                        <FiLoader className="w-3.5 h-3.5 animate-spin" />
                      )}
                      <span>{t("evaluations.save", "Save Period")}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List */}
            {isLoading ? (
              <div className="py-8 text-center text-xs text-[#64748b]">
                <FiLoader className="w-6 h-6 animate-spin mx-auto mb-2 text-[#486581]" />
                {t("evaluations.loadingPeriods", "Loading evaluation periods...")}
              </div>
            ) : periods.length === 0 ? (
              <div className="py-8 text-center bg-[#f8fafc] rounded-2xl border border-dashed border-[#cbd5e1] text-xs text-[#64748b]">
                {t("evaluations.noPeriods", "No evaluation periods found. Click above to create one.")}
              </div>
            ) : (
              <div className="space-y-2.5">
                {periods.map((period) => {
                  const isActive =
                    String(period.status || "").toLowerCase() === "active";

                  return (
                    <div
                      key={period.id}
                      className="flex items-center justify-between p-3.5 bg-white border border-[#e2e8f0] rounded-xl hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? "bg-[#ecfdf5] text-[#059669]"
                              : "bg-[#f1f5f9] text-[#64748b]"
                          }`}
                        >
                          {isActive ? (
                            <FiCheckCircle className="w-5 h-5" />
                          ) : (
                            <FiClock className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#102a43] truncate">
                            {period.name}
                          </h4>
                          <p className="text-[11px] text-[#64748b]">
                            {period.start_date} → {period.end_date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? "bg-[#ecfdf5] text-[#059669]"
                              : "bg-[#f1f5f9] text-[#64748b]"
                          }`}
                        >
                          {isActive
                            ? t("evaluations.statusActive", "Active")
                            : t("evaluations.statusInactive", "Inactive")}
                        </span>

                        <button
                          type="button"
                          disabled={toggleMutation.isPending}
                          onClick={() => handleToggle(period.id)}
                          title={t("evaluations.toggleStatus", "Toggle Status")}
                          className="text-[#64748b] hover:text-[#102a43] transition p-1"
                        >
                          {isActive ? (
                            <FiToggleRight className="w-6 h-6 text-[#059669]" />
                          ) : (
                            <FiToggleLeft className="w-6 h-6 text-[#94a3b8]" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#102a43] text-white text-xs font-semibold rounded-xl hover:bg-[#1a3857] transition"
            >
              {t("evaluations.close", "Close")}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
