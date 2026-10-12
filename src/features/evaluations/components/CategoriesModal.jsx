import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiX,
  FiPlus,
  FiAward,
  FiLoader,
} from "react-icons/fi";
import {
  useEvaluationCategories,
  useCreateEvaluationCategory,
} from "../hooks/useEvaluations";

export default function CategoriesModal({ isOpen, onClose }) {
  const { t } = useTranslation();

  const { data: categories = [], isLoading } = useEvaluationCategories();
  const createMutation = useCreateEvaluationCategory();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    max_score: 10,
    weight: 1.0,
  });

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    await createMutation.mutateAsync({
      name: formData.name.trim(),
      max_score: Number(formData.max_score) || 10,
      weight: Number(formData.weight) || 1.0,
    });
    setFormData({
      name: "",
      max_score: 10,
      weight: 1.0,
    });
    setIsAdding(false);
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
              <div className="w-10 h-10 rounded-xl bg-[#fdf2f8] text-[#db2777] flex items-center justify-center">
                <FiAward className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#102a43]">
                  {t("evaluations.categoriesTitle", "Evaluation Categories")}
                </h3>
                <p className="text-xs text-[#829ab1]">
                  {t(
                    "evaluations.categoriesSubtitle",
                    "Configure criteria, maximum scores, and weights used during performance reviews."
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
                {t("evaluations.totalCategories", "Total Categories")}:{" "}
                {categories.length}
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
                    : t("evaluations.addCategory", "New Category")}
                </span>
              </button>
            </div>

            {/* Add New Category Form */}
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
                    {t(
                      "evaluations.createCategoryTitle",
                      "Create Evaluation Category"
                    )}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                        {t("evaluations.categoryName", "Category Name")} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Technical Skills, Communication, Leadership"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full h-9 px-3 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] focus:outline-none focus:border-[#486581]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                        {t("evaluations.maxScore", "Max Score")} *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        required
                        value={formData.max_score}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_score: e.target.value,
                          })
                        }
                        className="w-full h-9 px-3 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] focus:outline-none focus:border-[#486581]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                        {t("evaluations.weight", "Weight (Multiplier)")} *
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        required
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData({ ...formData, weight: e.target.value })
                        }
                        className="w-full h-9 px-3 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] focus:outline-none focus:border-[#486581]"
                      />
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
                      <span>{t("evaluations.save", "Save Category")}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List */}
            {isLoading ? (
              <div className="py-8 text-center text-xs text-[#64748b]">
                <FiLoader className="w-6 h-6 animate-spin mx-auto mb-2 text-[#486581]" />
                {t(
                  "evaluations.loadingCategories",
                  "Loading evaluation categories..."
                )}
              </div>
            ) : categories.length === 0 ? (
              <div className="py-8 text-center bg-[#f8fafc] rounded-2xl border border-dashed border-[#cbd5e1] text-xs text-[#64748b]">
                {t(
                  "evaluations.noCategories",
                  "No evaluation categories found. Click above to create one."
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 bg-white border border-[#e2e8f0] rounded-2xl hover:shadow-sm transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs font-bold text-[#102a43]">
                          {cat.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#486581]">
                          ID #{cat.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748b]">
                        {t("evaluations.maxScore", "Max Score")}:{" "}
                        <span className="font-semibold text-[#102a43]">
                          {cat.max_score} pts
                        </span>
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                      <span className="text-[#829ab1] text-[11px]">
                        {t("evaluations.weightMultiplier", "Weight multiplier")}:
                      </span>
                      <span className="font-bold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded-lg text-xs">
                        {cat.weight}x
                      </span>
                    </div>
                  </div>
                ))}
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
