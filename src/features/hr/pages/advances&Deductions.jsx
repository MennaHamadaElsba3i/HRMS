import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiX,
  FiCheck,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiLoader,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";

import {
  useHrAdvances,
  useHrDeductions,
  useUpdateAdvanceStatus,
} from "../hooks/useFinancial";

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: {
      duration: 0.18,
    },
  },
};

export default function AdvancesAndDeductions({ isAdmin = false }) {
  const { i18n } = useTranslation();
  const location = useLocation();

  const currentLang = i18n.language || "en";
  const isArabic = currentLang?.startsWith("ar");
  const lang = isArabic ? "ar" : "en";

  const isSystemAdmin =
    isAdmin ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/owner");

  const [advancesPage, setAdvancesPage] = useState(1);
  const [deductionsPage, setDeductionsPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [details, setDetails] = useState("");
  const [owner, setOwner] = useState("");

  // ================= React Query Hooks =================
  const {
    data: advancesResponse,
    isLoading: advancesLoading,
    isError: advancesError,
    refetch: refetchAdvances,
  } = useHrAdvances({ page: advancesPage, per_page: 10, lang });

  const {
    data: deductionsResponse,
    isLoading: deductionsLoading,
    isError: deductionsError,
    refetch: refetchDeductions,
  } = useHrDeductions({ page: deductionsPage, per_page: 10, lang });

  const updateStatusMutation = useUpdateAdvanceStatus();

  const advancesList = advancesResponse?.data?.data || advancesResponse?.data || [];
  const advancesMeta = advancesResponse?.meta || null;
  const advancesTotalPages = advancesMeta?.last_page || 1;

  const deductionsList = deductionsResponse?.data?.data || deductionsResponse?.data || [];
  const deductionsMeta = deductionsResponse?.meta || null;
  const deductionsTotalPages = deductionsMeta?.last_page || 1;

  const content = {
    en: {
      title: "Advances & Deductions",
      subtitle:
        "Control salary advances, penalties, and payroll-linked deductions.",
      recordBtn: "Record Manual Deduction",

      salarySection: "Salary Advance Requests",

      colEmployee: "EMPLOYEE",
      colRequestedAmount: "REQUESTED AMOUNT",
      colRepayment: "REPAYMENT",
      colMonthlyDeduction: "MONTHLY DEDUCTION",
      colReason: "REASON",
      colStatus: "STATUS",
      colAction: "ACTION",

      approve: "Approve",
      reject: "Reject",
      approving: "Updating...",
      statusApproved: "Approved",
      statusRejected: "Rejected",
      statusPending: "Pending",

      noAdvances: "No salary advance requests found.",
      noDeductions: "No disciplinary or delay deductions found.",
      months: "Months",

      disciplinarySection: "Disciplinary & Delay Deductions",
      colPenaltyReason: "PENALTY REASON",
      colAmount: "AMOUNT",
      colDate: "DATE",

      statusQueued: "Queued for Month-End Deduction",

      modalTitle: "Create workflow record",
      detailsLabel: "Details",
      detailsPlaceholder: "Details",
      ownerLabel: "Owner",
      ownerPlaceholder: "Owner",
      cancelBtn: "Cancel",
      saveBtn: "Save changes",
      successTitle: "Saved successfully",
      doneBtn: "Done",
      successUpdate: "Salary advance status updated successfully.",
      errorUpdate: "Failed to update salary advance status.",
    },

    ar: {
      title: "السلف والاستقطاعات",
      subtitle:
        "التحكم في سلف الرواتب، الجزاءات، والاستقطاعات المرتبطة بالرواتب.",
      recordBtn: "تسجيل استقطاع يدوي",

      salarySection: "طلبات سلف الرواتب",

      colEmployee: "الموظف",
      colRequestedAmount: "المبلغ المطلوب",
      colRepayment: "فترة السداد",
      colMonthlyDeduction: "الاستقطاع الشهري",
      colReason: "السبب",
      colStatus: "الحالة",
      colAction: "الإجراء",

      approve: "موافقة",
      reject: "رفض",
      approving: "جارٍ التحديث...",
      statusApproved: "مُعتمد",
      statusRejected: "مرفوض",
      statusPending: "قيد الانتظار",

      noAdvances: "لا توجد طلبات سلف رواتب.",
      noDeductions: "لا توجد خصومات أو جزاءات مسجلة.",
      months: "أشهر",

      disciplinarySection: "جزاءات التأخير والخصومات",
      colPenaltyReason: "سبب الجزاء",
      colAmount: "المبلغ",
      colDate: "التاريخ",

      statusQueued: "مدرج للاستقطاع نهاية الشهر",

      modalTitle: "إنشاء سجل عمل جديد",
      detailsLabel: "التفاصيل",
      detailsPlaceholder: "التفاصيل",
      ownerLabel: "المسؤول",
      ownerPlaceholder: "المسؤول",
      cancelBtn: "إلغاء",
      saveBtn: "حفظ التغييرات",
      successTitle: "تم الحفظ بنجاح",
      doneBtn: "تم",
      successUpdate: "تم تحديث حالة طلب السلفة بنجاح.",
      errorUpdate: "فشل تحديث حالة طلب السلفة.",
    },
  };

  const t = isArabic ? content.ar : content.en;

  const handleStatusChange = async (advanceId, newStatus) => {
    setUpdatingId(advanceId);
    try {
      await updateStatusMutation.mutateAsync({
        advanceId,
        status: newStatus,
        lang,
      });
      toast.success(t.successUpdate);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        t.errorUpdate;
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatCurrency = (val) => {
    if (val == null) return "—";
    return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-semibold text-[#166534]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
          {t.statusApproved}
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fecaca] bg-[#fef2f2] px-2.5 py-0.5 text-xs font-semibold text-[#991b1b]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
          {t.statusRejected}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fde68a] bg-[#fffbeb] px-2.5 py-0.5 text-xs font-semibold text-[#92400e]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
        {t.statusPending}
      </span>
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsSuccess(false);
    setDetails("");
    setOwner("");
  };

  return (
    <motion.div
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full space-y-6 pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* ================= HEADER ================= */}
      <motion.div
        variants={pageVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#6b879f] uppercase">
            {isSystemAdmin
              ? isArabic
                ? "إدارة النظام · المالية"
                : "Admin Management · Financial"
              : isArabic
                ? "الموارد البشرية · المالية"
                : "HR Management · Financial"}
          </p>

          <h1 className="mt-1 text-lg font-bold tracking-tight text-[#1e293b] md:text-[21px]">
            {t.title}
          </h1>

          <p className="mt-1 text-sm font-normal text-[#64748b]">
            {t.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setIsSuccess(false);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#243B53] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1c2f42]"
        >
          <FiPlus size={16} />
          {t.recordBtn}
        </button>
      </motion.div>

      {/* ================= SALARY ADVANCES ================= */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
              <FiDollarSign size={17} />
            </div>

            <h2 className="text-base font-bold text-[#1e293b]">
              {t.salarySection}
            </h2>
          </div>

          {advancesLoading && (
            <FiLoader className="h-4 w-4 animate-spin text-[#6366f1]" />
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {advancesLoading && advancesList.length === 0 ? (
            <div className="flex items-center justify-center p-12 text-[#64748b]">
              <FiLoader className="h-6 w-6 animate-spin mr-2" />
              <span className="text-xs font-medium">{i18n.t("common.loading")}</span>
            </div>
          ) : advancesList.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#94a3b8]">
              {t.noAdvances}
            </div>
          ) : (
            <table
              className={`w-full min-w-[900px] border-collapse ${
                isArabic ? "text-right" : "text-left"
              }`}
            >
              <thead>
                <tr className="border-b border-[#f1f5f9]">
                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colEmployee}
                  </th>

                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colRequestedAmount}
                  </th>

                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colRepayment}
                  </th>

                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colMonthlyDeduction}
                  </th>

                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colReason}
                  </th>

                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colStatus}
                  </th>

                  <th
                    className={`p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase ${
                      isArabic ? "text-left" : "text-right"
                    }`}
                  >
                    {t.colAction}
                  </th>
                </tr>
              </thead>

              <tbody className="text-sm">
                {advancesList.map((item) => {
                  const isUpdating = updatingId === item.id;
                  const isPending = !item.status || item.status.toLowerCase() === "pending";

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-[#f1f5f9] transition hover:bg-[#f8fafc]"
                    >
                      <td className="p-5">
                        <span className="font-bold text-[#1e293b]">
                          {item.employee_name || "—"}
                        </span>
                      </td>

                      <td className="p-5 font-bold text-[#102a43]">
                        {formatCurrency(item.requested_amount)}
                      </td>

                      <td className="p-5 text-[#64748b]">
                        {item.repayment_months ? `${item.repayment_months} ${t.months}` : "—"}
                      </td>

                      <td className="p-5 font-semibold text-[#475569]">
                        {formatCurrency(item.monthly_deduction)}
                      </td>

                      <td className="p-5 text-xs text-[#64748b] max-w-[200px] truncate">
                        {item.reason || "—"}
                      </td>

                      <td className="p-5">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className={`p-5 ${isArabic ? "text-left" : "text-right"}`}>
                        {isPending ? (
                          <div className={`inline-flex items-center gap-2 ${isArabic ? "justify-start" : "justify-end"}`}>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(item.id, "approved")}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#166534] transition hover:bg-[#dcfce7] disabled:opacity-50"
                            >
                              <FiCheck className="h-3.5 w-3.5" />
                              <span>{t.approve}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(item.id, "rejected")}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-xs font-semibold text-[#991b1b] transition hover:bg-[#fee2e2] disabled:opacity-50"
                            >
                              <FiX className="h-3.5 w-3.5" />
                              <span>{t.reject}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-[#94a3b8]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Advances Pagination */}
        {advancesTotalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#f1f5f9] px-6 py-3">
            <span className="text-xs text-[#94a3b8]">
              Page {advancesPage} of {advancesTotalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={advancesPage <= 1}
                onClick={() => setAdvancesPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-[#e2e8f0] p-1.5 text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40"
              >
                {isArabic ? <FiChevronRight /> : <FiChevronLeft />}
              </button>
              <button
                type="button"
                disabled={advancesPage >= advancesTotalPages}
                onClick={() => setAdvancesPage((p) => Math.min(advancesTotalPages, p + 1))}
                className="rounded-lg border border-[#e2e8f0] p-1.5 text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40"
              >
                {isArabic ? <FiChevronLeft /> : <FiChevronRight />}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ================= DISCIPLINARY DEDUCTIONS ================= */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff7ed] text-[#f97316]">
              <FiAlertCircle size={17} />
            </div>

            <h2 className="text-base font-bold text-[#1e293b]">
              {t.disciplinarySection}
            </h2>
          </div>

          {deductionsLoading && (
            <FiLoader className="h-4 w-4 animate-spin text-[#f97316]" />
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {deductionsLoading && deductionsList.length === 0 ? (
            <div className="flex items-center justify-center p-12 text-[#64748b]">
              <FiLoader className="h-6 w-6 animate-spin mr-2" />
              <span className="text-xs font-medium">{i18n.t("common.loading")}</span>
            </div>
          ) : deductionsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#94a3b8]">
              {t.noDeductions}
            </div>
          ) : (
            <table
              className={`w-full min-w-[800px] border-collapse ${
                isArabic ? "text-right" : "text-left"
              }`}
            >
              <thead>
                <tr className="border-b border-[#f1f5f9]">
                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colEmployee}
                  </th>

                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colPenaltyReason}
                  </th>

                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colAmount}
                  </th>

                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colDate}
                  </th>

                  <th
                    className={`p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase ${
                      isArabic ? "text-left" : "text-right"
                    }`}
                  >
                    {t.colStatus}
                  </th>
                </tr>
              </thead>

              <tbody className="text-sm">
                {deductionsList.map((deduction) => (
                  <tr
                    key={deduction.id}
                    className="border-b border-[#f1f5f9] transition hover:bg-[#f8fafc]"
                  >
                    <td className="p-5">
                      <span className="font-bold text-[#1e293b]">
                        {deduction.employee_name || "—"}
                      </span>
                    </td>

                    <td className="p-5 text-xs text-[#64748b]">
                      {deduction.reason || "—"}
                    </td>

                    <td className="p-5 font-bold text-[#dc2626]">
                      -{formatCurrency(deduction.amount)}
                    </td>

                    <td className="p-5 text-xs text-[#64748b]">
                      {formatDate(deduction.date || deduction.created_at)}
                    </td>

                    <td className={`p-5 ${isArabic ? "text-left" : "text-right"}`}>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fed7aa] bg-[#fff7ed] px-3 py-1 text-xs font-semibold text-[#c2410c]">
                        <FiClock size={12} />
                        {deduction.status || t.statusQueued}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Deductions Pagination */}
        {deductionsTotalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#f1f5f9] px-6 py-3">
            <span className="text-xs text-[#94a3b8]">
              Page {deductionsPage} of {deductionsTotalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={deductionsPage <= 1}
                onClick={() => setDeductionsPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-[#e2e8f0] p-1.5 text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40"
              >
                {isArabic ? <FiChevronRight /> : <FiChevronLeft />}
              </button>
              <button
                type="button"
                disabled={deductionsPage >= deductionsTotalPages}
                onClick={() => setDeductionsPage((p) => Math.min(deductionsTotalPages, p + 1))}
                className="rounded-lg border border-[#e2e8f0] p-1.5 text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40"
              >
                {isArabic ? <FiChevronLeft /> : <FiChevronRight />}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ================= MODAL ================= */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-xl"
            >
              {!isSuccess ? (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-5">
                    <div>
                      <h3 className="text-base font-bold text-[#1e293b]">
                        {t.modalTitle}
                      </h3>

                      <p className="mt-1 text-xs text-[#64748b] sm:text-sm">
                        {t.recordBtn}
                      </p>
                    </div>

                    <button
                      onClick={handleCloseModal}
                      className="rounded-lg p-2 text-[#94a3b8] transition hover:bg-[#f8fafc] hover:text-[#475569]"
                    >
                      <FiX size={18} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleSave} className="space-y-5 p-6">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* Details */}
                      <div>
                        <label className="mb-2 block text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
                          {t.detailsLabel}
                        </label>

                        <input
                          type="text"
                          value={details}
                          onChange={(e) => setDetails(e.target.value)}
                          placeholder={t.detailsPlaceholder}
                          className="
                            w-full
                            rounded-lg
                            border border-[#e2e8f0]
                            bg-white
                            px-3
                            py-2.5
                            text-xs
                            text-[#475569]
                            outline-none
                            transition
                            placeholder:text-[#94a3b8]
                            focus:border-[#94a3b8]
                            focus:ring-2
                            focus:ring-[#f1f5f9]
                          "
                        />
                      </div>

                      {/* Owner */}
                      <div>
                        <label className="mb-2 block text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
                          {t.ownerLabel}
                        </label>

                        <input
                          type="text"
                          value={owner}
                          onChange={(e) => setOwner(e.target.value)}
                          placeholder={t.ownerPlaceholder}
                          className="
                            w-full
                            rounded-lg
                            border border-[#e2e8f0]
                            bg-white
                            px-3
                            py-2.5
                            text-xs
                            text-[#475569]
                            outline-none
                            transition
                            placeholder:text-[#94a3b8]
                            focus:border-[#94a3b8]
                            focus:ring-2
                            focus:ring-[#f1f5f9]
                          "
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-[#f1f5f9] pt-4">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="
                          rounded-lg
                          border border-[#e2e8f0]
                          bg-white
                          px-4
                          py-2.5
                          text-xs
                          font-semibold
                          text-[#475569]
                          transition
                          hover:bg-[#f8fafc]
                        "
                      >
                        {t.cancelBtn}
                      </button>

                      <button
                        type="submit"
                        className="
                          rounded-lg
                          bg-[#243B53]
                          px-4
                          py-2.5
                          text-xs
                          font-semibold
                          text-white
                          transition
                          hover:bg-[#1c2f42]
                        "
                      >
                        {t.saveBtn}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* ================= SUCCESS ================= */
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#10b981]">
                    <FiCheck size={26} strokeWidth={2.5} />
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#1e293b]">
                    {t.successTitle}
                  </h3>

                  <button
                    onClick={handleCloseModal}
                    className="
                      mt-6
                      w-full
                      max-w-[180px]
                      rounded-lg
                      bg-[#243B53]
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-[#1c2f42]
                    "
                  >
                    {t.doneBtn}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
