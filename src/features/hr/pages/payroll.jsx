import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  FiZap,
  FiDownload,
  FiDollarSign,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
  FiCheck,
  FiClock,
} from "react-icons/fi";
import toast from "react-hot-toast";

import { useHrPayroll, useFinalizePayroll } from "../hooks/useFinancial";
import { downloadFinancialPayslip } from "../api";

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

export default function Payroll({ isAdmin = false }) {
  const { i18n } = useTranslation();
  const location = useLocation();

  const currentLang = i18n.language || "en";
  const isArabic = currentLang?.startsWith("ar");

  // Determine if viewing from Admin or HR route
  const isSystemAdmin =
    isAdmin ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/owner");

  // Selected month state in YYYY-MM format (Default to 2026-09 or current month)
  const [selectedMonth, setSelectedMonth] = useState("2026-09");
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);

  // Fetch Payroll via React Query
  const {
    data: payrollResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useHrPayroll({
    month_year: selectedMonth,
    page: currentPage,
    per_page: 10,
    lang: isArabic ? "ar" : "en",
  });

  // Finalize payroll mutation
  const finalizeMutation = useFinalizePayroll();

  // Extract payroll data
  const payrollData = payrollResponse?.data;
  const employeeList = Array.isArray(payrollData?.data) ? payrollData.data : [];
  const isMonthFinalized = Boolean(payrollData?.is_month_finalized);
  const statusMessage =
    payrollData?.status_message ||
    payrollResponse?.message ||
    (isMonthFinalized
      ? isArabic
        ? "تم اعتماد وإقفال مسير الرواتب لهذا الشهر."
        : "Payroll for this month is finalized and locked."
      : isArabic
        ? "مسير الرواتب لهذا الشهر لا يزال مسودة (في انتظار الاعتماد)."
        : "Payroll for this month is still in draft (pending approval).");

  // Pagination info
  const totalEmployees = payrollData?.total ?? employeeList.length;
  const lastPage = payrollData?.last_page ?? 1;
  const fromRecord = payrollData?.from ?? (employeeList.length > 0 ? 1 : 0);
  const toRecord = payrollData?.to ?? employeeList.length;

  // Calculate totals for quick summary
  const totals = useMemo(() => {
    return employeeList.reduce(
      (acc, item) => {
        acc.basic += Number(item.basic_salary || 0);
        acc.bonuses += Number(item.total_bonuses || 0);
        acc.deductions += Number(item.total_deductions || 0);
        acc.loans += Number(item.loan_installment || 0);
        acc.net += Number(item.net_salary || 0);
        return acc;
      },
      { basic: 0, bonuses: 0, deductions: 0, loans: 0, net: 0 },
    );
  }, [employeeList]);

  // Currency Formatter
  const formatCurrency = (val) => {
    if (val == null) return "—";
    return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    const prevYear = date.getFullYear();
    const prevMonth = String(date.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${prevYear}-${prevMonth}`);
    setCurrentPage(1);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month, 1);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${nextYear}-${nextMonth}`);
    setCurrentPage(1);
  };

  // Month Display Name
  const formattedMonthLabel = useMemo(() => {
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth, isArabic]);

  // Handle "Finalize & Run Payroll" - Directly runs the API calculation
  const handleFinalizeAndRunPayroll = () => {
    finalizeMutation.mutate(
      {
        month_year: selectedMonth,
        lang: isArabic ? "ar" : "en",
      },
      {
        onSuccess: (res) => {
          toast.success(
            res?.message ||
              (isArabic
                ? `تم إنهاء واحتساب مسير رواتب ${formattedMonthLabel} بنجاح.`
                : `Payroll for ${formattedMonthLabel} has been finalized successfully.`),
          );
        },
        onError: (err) => {
          const errMsg =
            err.response?.data?.message ||
            (isArabic
              ? "فشل في إنهاء واحتساب مسير الرواتب. يرجى المحاولة مرة أخرى."
              : "Failed to finalize payroll. Please try again.");
          toast.error(errMsg);
        },
      },
    );
  };

  // Handle PDF Payslip Download
  const handleDownloadPayslip = async (item) => {
    if (!item?.id) return;

    try {
      setDownloadingId(item.id);

      const response = await downloadFinancialPayslip(
        item.id,
        isArabic ? "ar" : "en",
      );

      // Extract filename from response headers or fallback
      let filename = `payslip_${(item.employee_name || "employee").replace(/\s+/g, "_")}_${item.month_year || selectedMonth}.pdf`;
      const contentDisposition = response.headers?.["content-disposition"];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=["']?([^"']+)["']?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(
        isArabic
          ? `تم تحميل قسيمة راتب ${item.employee_name} بنجاح.`
          : `Payslip for ${item.employee_name} downloaded successfully.`,
      );
    } catch (err) {
      let errorMsg = isArabic
        ? "فشل في تحميل قسيمة الراتب."
        : "Failed to download payslip.";

      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errorMsg = json.message;
        } catch (_) {}
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      toast.error(errorMsg);
    } finally {
      setDownloadingId(null);
    }
  };

  const content = {
    en: {
      category: isSystemAdmin
        ? "Admin Management · Financial"
        : "HR Management · Financial",
      title: "Company Payroll",
      subtitle:
        "Monthly compensation calculation, advance deductions & payslip execution center.",
      runBtn: "Finalize & Run Payroll",
      runningBtn: "Calculating & Finalizing...",
      finalizedBadge: "Finalized & Closed",
      draftBadge: "Draft / Pending Approval",
      formulaText:
        "Net Salary = Basic Salary + Bonuses - Deductions - Loan Installments",
      totalPayoutLabel: "Total Net Payout",
      currency: "EGP",
      monthFilter: "Target Month",
      tableTitle: "Payroll Register & Payslips",
      colEmployee: "EMPLOYEE",
      colBasicPay: "BASIC PAY",
      colBonuses: "BONUSES (+)",
      colDeductions: "DEDUCTIONS (-)",
      colAdvance: "ADVANCE (-)",
      colNetPayout: "NET PAYOUT",
      colStatus: "STATUS",
      colAction: "ACTION",
      statusFinalized: "Finalized",
      statusDraft: "Draft",
      statusPending: "Pending",
      generatePdf: "Generate PDF",
      downloadingPdf: "Downloading...",
      noData: "No payroll records found for this month.",
      noDataSubtitle:
        "Click 'Finalize & Run Payroll' to calculate payroll or select another month.",
      refresh: "Refresh",
      showing: "Showing",
      of: "of",
      records: "records",
      prev: "Previous",
      next: "Next",
      page: "Page",
      totalEmployees: "Employees Count",
      totalBasic: "Total Basic Pay",
      totalBonuses: "Total Bonuses",
      totalDeductions: "Total Deductions",
      totalLoans: "Total Advances",
    },
    ar: {
      category: isSystemAdmin
        ? "إدارة النظام · المالية"
        : "الموارد البشرية · المالية",
      title: "مسير رواتب الشركة",
      subtitle:
        "مركز احتساب التعويضات الشهرية، استقطاع السلف وتنفيذ قسائم الرواتب.",
      runBtn: "إنهاء وتشغيل الرواتب",
      runningBtn: "جاري الاحتساب والاعتماد...",
      finalizedBadge: "معتمد ومغلق",
      draftBadge: "مسودة / قيد المراجعة",
      formulaText:
        "الراتب الصافي = الراتب الأساسي + المكافآت - الاستقطاعات - أقساط السلف",
      totalPayoutLabel: "إجمالي الصافي المستحق",
      currency: "ج.م",
      monthFilter: "الشهر المستهدف",
      tableTitle: "سجل مسير الرواتب وقسائم القبض",
      colEmployee: "الموظف",
      colBasicPay: "الراتب الأساسي",
      colBonuses: "المكافآت (+)",
      colDeductions: "الاستقطاعات (-)",
      colAdvance: "السلف (-)",
      colNetPayout: "الصافي المستحق",
      colStatus: "الحالة",
      colAction: "الإجراء",
      statusFinalized: "معتمد",
      statusDraft: "مسودة",
      statusPending: "قيد المراجعة",
      generatePdf: "تحميل PDF",
      downloadingPdf: "جاري التحميل...",
      noData: "لا توجد سجلات رواتب مسجلة لهذا الشهر.",
      noDataSubtitle:
        "اضغط على زر 'إنهاء وتشغيل الرواتب' لإجراء الحسبة أو اختر شهراً آخر.",
      refresh: "تحديث",
      showing: "عرض",
      of: "من",
      records: "سجلات",
      prev: "السابق",
      next: "التالي",
      page: "صفحة",
      totalEmployees: "عدد الموظفين",
      totalBasic: "إجمالي الأساسي",
      totalBonuses: "إجمالي المكافآت",
      totalDeductions: "إجمالي الاستقطاعات",
      totalLoans: "إجمالي السلف",
    },
  };

  const t = isArabic ? content.ar : content.en;

  return (
    <motion.div
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full space-y-6"
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
            {t.category}
          </p>

          <h1 className="mt-1 text-lg font-bold tracking-tight text-[#1e293b] md:text-[22px]">
            {t.title}
          </h1>

          <p className="mt-1 text-sm font-normal text-[#64748b]">
            {t.subtitle}
          </p>
        </div>

        {/* Action Controls: Month Picker & Run Payroll Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Navigator */}
          <div className="flex items-center rounded-xl border border-[#e2e8f0] bg-white px-2 py-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              title={isArabic ? "الشهر السابق" : "Previous Month"}
              className="rounded-lg p-1.5 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#1e293b]"
            >
              {isArabic ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <FiCalendar className="text-[#3b82f6]" size={15} />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }
                }}
                className="bg-transparent text-xs font-bold text-[#1e293b] outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextMonth}
              title={isArabic ? "الشهر التالي" : "Next Month"}
              className="rounded-lg p-1.5 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#1e293b]"
            >
              {isArabic ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            title={t.refresh}
            className="flex items-center justify-center rounded-xl border border-[#e2e8f0] bg-white p-2.5 text-[#64748b] shadow-sm transition hover:bg-[#f8fafc] hover:text-[#1e293b] disabled:opacity-50"
          >
            <FiRefreshCw
              size={15}
              className={isFetching ? "animate-spin text-[#3b82f6]" : ""}
            />
          </button>

          {/* Finalize & Run Payroll Button */}
          {/* NOTE: Directly executes POST /api/financial/payroll/finalize without opening any popup/modal */}
          <button
            onClick={handleFinalizeAndRunPayroll}
            disabled={finalizeMutation.isPending}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#243B53] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c2f42] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {finalizeMutation.isPending ? (
              <>
                <FiLoader className="animate-spin" size={16} />
                <span>{t.runningBtn}</span>
              </>
            ) : (
              <>
                <FiZap size={16} className="text-[#38bdf8]" />
                <span>{t.runBtn}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ================= SUMMARY & STATUS CARD ================= */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-md"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Month label */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cbd5e1] bg-[#f8fafc] px-3 py-1 text-xs font-bold text-[#334155]">
                <FiCalendar size={13} className="text-[#64748b]" />
                {formattedMonthLabel}
              </span>

              {/* Finalized Status */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  isMonthFinalized
                    ? "border-[#d1fae5] bg-[#ecfdf5] text-[#059669]"
                    : "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isMonthFinalized ? "bg-[#10b981]" : "bg-[#f97316]"
                  }`}
                />
                {isMonthFinalized ? t.finalizedBadge : t.draftBadge}
              </span>
            </div>

            {/* Status Message from API */}
            {statusMessage && (
              <p className="text-xs font-medium text-[#64748b]">
                {statusMessage}
              </p>
            )}

            {/* Formula */}
            <div className="flex items-start gap-3 pt-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
                <FiDollarSign size={17} />
              </div>

              <div>
                <p className="text-xs font-semibold text-[#1e293b]">
                  {t.formulaText}
                </p>
                <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                  {isArabic
                    ? "يتم خصم أقساط السلف المعتمدة والاستقطاعات وإضافة المكافآت تلقائياً لكل موظف."
                    : "Approved advance installments & queued deductions are automatically deducted and bonuses applied."}
                </p>
              </div>
            </div>
          </div>

          {/* Total Net Payout Display */}
          <div className="flex flex-col rounded-2xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] p-5 border border-[#e2e8f0] md:min-w-[240px]">
            <p className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
              {t.totalPayoutLabel}
            </p>

            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold tracking-tight text-[#0f172a]">
                {formatCurrency(totals.net)}
              </span>
              <span className="text-xs font-bold text-[#64748b]">
                {t.currency}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-[#e2e8f0]/80 pt-2 text-[11px] text-[#64748b]">
              <span>{t.totalEmployees}:</span>
              <span className="font-bold text-[#0f172a]">{totalEmployees}</span>
            </div>
          </div>
        </div>

        {/* Secondary mini metrics */}
        {employeeList.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#f1f5f9] pt-4 sm:grid-cols-4">
            <div className="rounded-xl bg-[#f8fafc] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#94a3b8]">
                {t.totalBasic}
              </span>
              <p className="text-xs font-bold text-[#1e293b]">
                {formatCurrency(totals.basic)} {t.currency}
              </p>
            </div>

            <div className="rounded-xl bg-[#f0fdf4] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#16a34a]">
                {t.totalBonuses}
              </span>
              <p className="text-xs font-bold text-[#15803d]">
                +{formatCurrency(totals.bonuses)} {t.currency}
              </p>
            </div>

            <div className="rounded-xl bg-[#fef2f2] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#dc2626]">
                {t.totalDeductions}
              </span>
              <p className="text-xs font-bold text-[#b91c1c]">
                -{formatCurrency(totals.deductions)} {t.currency}
              </p>
            </div>

            <div className="rounded-xl bg-[#fffbeb] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#d97706]">
                {t.totalLoans}
              </span>
              <p className="text-xs font-bold text-[#b45309]">
                -{formatCurrency(totals.loans)} {t.currency}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ================= PAYROLL TABLE ================= */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      >
        {/* Table Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
              <FiDollarSign size={17} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#1e293b]">
                {t.tableTitle}
              </h2>
              <p className="text-xs text-[#64748b]">
                {isArabic
                  ? `تفاصيل رواتب الموظفين لشهر ${formattedMonthLabel}`
                  : `Employee salary breakdown for ${formattedMonthLabel}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
            <span className="rounded-lg bg-[#f1f5f9] px-2.5 py-1 text-[#334155]">
              {totalEmployees} {t.records}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiLoader className="h-8 w-8 animate-spin text-[#3b82f6]" />
            <p className="mt-3 text-sm font-semibold text-[#64748b]">
              {isArabic ? "جاري تحميل بيانات الرواتب..." : "Loading payroll calculations..."}
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fef2f2] text-[#ef4444]">
              <FiAlertCircle size={24} />
            </div>
            <p className="mt-3 text-sm font-bold text-[#1e293b]">
              {error?.response?.data?.message ||
                (isArabic ? "حدث خطأ أثناء تحميل بيانات مسير الرواتب." : "Error retrieving payroll data.")}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-lg bg-[#f1f5f9] px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-[#e2e8f0]"
            >
              {t.refresh}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && employeeList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8fafc] text-[#94a3b8] border border-[#e2e8f0]">
              <FiDollarSign size={26} />
            </div>
            <h3 className="mt-4 text-sm font-bold text-[#1e293b]">{t.noData}</h3>
            <p className="mt-1 text-xs text-[#64748b] max-w-sm">
              {t.noDataSubtitle}
            </p>
            <button
              onClick={handleFinalizeAndRunPayroll}
              disabled={finalizeMutation.isPending}
              className="mt-4 flex items-center gap-2 rounded-xl bg-[#243B53] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1c2f42]"
            >
              <FiZap size={14} />
              {t.runBtn}
            </button>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && !isError && employeeList.length > 0 && (
          <div className="overflow-x-auto">
            <table
              className={`w-full min-w-[1050px] border-collapse ${
                isArabic ? "text-right" : "text-left"
              }`}
            >
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]/50">
                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colEmployee}
                  </th>
                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colBasicPay}
                  </th>
                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colBonuses}
                  </th>
                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colDeductions}
                  </th>
                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colAdvance}
                  </th>
                  <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                    {t.colNetPayout}
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

              <tbody className="text-sm divide-y divide-[#f1f5f9]">
                {employeeList.map((item) => {
                  const isItemFinalized =
                    item.is_finalized || item.status === "finalized";
                  const isDownloading = downloadingId === item.id;

                  return (
                    <tr
                      key={item.id || item.user_id}
                      className="transition hover:bg-[#f8fafc]"
                    >
                      {/* Employee Info */}
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e2e8f0] text-xs font-bold text-[#334155]">
                            {(item.employee_name || "EM")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#1e293b]">
                              {item.employee_name || "—"}
                            </p>
                            <p className="text-[11px] text-[#94a3b8]">
                              ID: #{item.user_id || item.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Basic Pay */}
                      <td className="p-5 font-medium text-[#475569]">
                        {formatCurrency(item.basic_salary)} {t.currency}
                      </td>

                      {/* Bonuses (+) */}
                      <td className="p-5 font-medium text-[#16a34a]">
                        +{formatCurrency(item.total_bonuses)} {t.currency}
                      </td>

                      {/* Deductions (-) */}
                      <td className="p-5 font-medium text-[#dc2626]">
                        -{formatCurrency(item.total_deductions)} {t.currency}
                      </td>

                      {/* Loan / Advance Installment (-) */}
                      <td className="p-5 font-medium text-[#d97706]">
                        -{formatCurrency(item.loan_installment)} {t.currency}
                      </td>

                      {/* Net Payout */}
                      <td className="p-5">
                        <span className="font-bold text-[#0f172a] text-[15px]">
                          {formatCurrency(item.net_salary)} {t.currency}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                            isItemFinalized
                              ? "border-[#d1fae5] bg-[#ecfdf5] text-[#059669]"
                              : "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isItemFinalized
                                ? "bg-[#10b981]"
                                : "bg-[#f97316]"
                            }`}
                          />
                          {isItemFinalized
                            ? t.statusFinalized
                            : t.statusPending}
                        </span>
                      </td>

                      {/* Action: Generate/Download Payslip PDF */}
                      <td
                        className={`p-5 ${
                          isArabic ? "text-left" : "text-right"
                        }`}
                      >
                        <button
                          onClick={() => handleDownloadPayslip(item)}
                          disabled={isDownloading}
                          title={
                            isItemFinalized
                              ? t.generatePdf
                              : isArabic
                                ? "قسيمة الراتب تصدر بعد الاعتماد"
                                : "Payslip available after finalization"
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] shadow-sm transition hover:bg-[#f8fafc] hover:text-[#1e293b] active:scale-[0.98] disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <>
                              <FiLoader size={13} className="animate-spin text-[#3b82f6]" />
                              <span>{t.downloadingPdf}</span>
                            </>
                          ) : (
                            <>
                              <FiDownload size={13} />
                              <span>{t.generatePdf}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {lastPage > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f1f5f9] px-6 py-4">
                <p className="text-xs text-[#64748b]">
                  {t.showing} <span className="font-semibold text-[#1e293b]">{fromRecord}</span>{" "}
                  - <span className="font-semibold text-[#1e293b]">{toRecord}</span> {t.of}{" "}
                  <span className="font-semibold text-[#1e293b]">{totalEmployees}</span>{" "}
                  {t.records}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage <= 1 || isFetching}
                    className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isArabic ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
                    <span>{t.prev}</span>
                  </button>

                  <span className="px-2 text-xs font-semibold text-[#1e293b]">
                    {t.page} {currentPage} {t.of} {lastPage}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, lastPage))
                    }
                    disabled={currentPage >= lastPage || isFetching}
                    className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{t.next}</span>
                    {isArabic ? <FiChevronLeft size={14} /> : <FiChevronRight size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
