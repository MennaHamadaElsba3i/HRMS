import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiDollarSign,
  FiTrendingDown,
  FiAward,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
  FiX,
  FiPlus,
  FiCalendar,
  FiUser,
  FiClock,
  FiDownload,
} from "react-icons/fi";
import toast from "react-hot-toast";

import {
  useAdvances,
  useCreateAdvance,
  useDeductions,
  useBonuses,
  useMySalaries,
} from "../hooks/useFinancial";
import { downloadFinancialPayslip } from "../api";

import { useAuth } from "../../../context/AuthContext";

// =====================================================
// Tab Configuration
// =====================================================

const TABS = [
  {
    id: "salaries",
    labelKey: "employeeFinancial.tabs.salaries",
    defaultLabel: "My Salaries",
    icon: FiFileText,
  },
  {
    id: "advances",
    labelKey: "employeeFinancial.tabs.advances",
    defaultLabel: "Advances",
    icon: FiDollarSign,
  },
  {
    id: "deductions",
    labelKey: "employeeFinancial.tabs.deductions",
    defaultLabel: "Deductions",
    icon: FiTrendingDown,
  },
  {
    id: "bonuses",
    labelKey: "employeeFinancial.tabs.bonuses",
    defaultLabel: "Bonuses",
    icon: FiAward,
  },
];

// =====================================================
// Financial Page
// =====================================================

const Financial = () => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();

  const isRtl = i18n.language?.startsWith("ar");
  const lang = isRtl ? "ar" : "en";

  // =====================================================
  // State
  // =====================================================

  const [activeTab, setActiveTab] = useState("salaries");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [downloadingPayslipId, setDownloadingPayslipId] = useState(null);

  // Advance form
  const [advanceForm, setAdvanceForm] = useState({
    requested_amount: "",
    repayment_months: "",
    reason: "",
  });

  // =====================================================
  // React Query Hooks
  // =====================================================

  const {
    data: salariesResponse,
    isLoading: salariesLoading,
    isError: salariesError,
    error: salariesErrorObj,
    refetch: refetchSalaries,
  } = useMySalaries({
    page: activeTab === "salaries" ? currentPage : 1,
    per_page: 10,
    lang,
  });

  const {
    data: advancesResponse,
    isLoading: advancesLoading,
    isError: advancesError,
    error: advancesErrorObj,
    refetch: refetchAdvances,
  } = useAdvances({
    page: activeTab === "advances" ? currentPage : 1,
    per_page: 10,
    lang,
  });

  const {
    data: deductionsResponse,
    isLoading: deductionsLoading,
    isError: deductionsError,
    error: deductionsErrorObj,
    refetch: refetchDeductions,
  } = useDeductions({
    page: activeTab === "deductions" ? currentPage : 1,
    per_page: 10,
    lang,
  });

  const {
    data: bonusesResponse,
    isLoading: bonusesLoading,
    isError: bonusesError,
    error: bonusesErrorObj,
    refetch: refetchBonuses,
  } = useBonuses({
    page: activeTab === "bonuses" ? currentPage : 1,
    per_page: 10,
    lang,
  });

  const createAdvanceMutation = useCreateAdvance();

  // =====================================================
  // Derived Data
  // =====================================================

  const getActiveData = () => {
    switch (activeTab) {
      case "salaries":
        return {
          items: salariesResponse?.data?.data || [],
          meta: salariesResponse?.data || null,
          isLoading: salariesLoading,
          isError: salariesError,
          error: salariesErrorObj,
          refetch: refetchSalaries,
        };
      case "advances":
        return {
          items: advancesResponse?.data?.data || [],
          meta: advancesResponse?.data || null,
          isLoading: advancesLoading,
          isError: advancesError,
          error: advancesErrorObj,
          refetch: refetchAdvances,
        };
      case "deductions":
        return {
          items: deductionsResponse?.data?.data || [],
          meta: deductionsResponse?.data || null,
          isLoading: deductionsLoading,
          isError: deductionsError,
          error: deductionsErrorObj,
          refetch: refetchDeductions,
        };
      case "bonuses":
        return {
          items: bonusesResponse?.data?.data || [],
          meta: bonusesResponse?.data || null,
          isLoading: bonusesLoading,
          isError: bonusesError,
          error: bonusesErrorObj,
          refetch: refetchBonuses,
          stats: bonusesResponse?.data?.stats || null,
        };
      default:
        return {
          items: [],
          meta: null,
          isLoading: false,
          isError: false,
          error: null,
          refetch: () => {},
        };
    }
  };

  const { items, meta, isLoading, isError, error, refetch, stats } =
    getActiveData();

  const totalPages = meta?.last_page || 1;

  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    t("employeeFinancial.errors.fetchFailed", "Failed to retrieve data.");

  // =====================================================
  // Handlers
  // =====================================================

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const handleSubmitAdvance = async (e) => {
    e.preventDefault();

    const { requested_amount, repayment_months, reason } = advanceForm;

    if (!requested_amount || !repayment_months || !reason) {
      toast.error(
        t(
          "employeeFinancial.advance.requiredFields",
          "All fields are required.",
        ),
      );
      return;
    }

    try {
      await createAdvanceMutation.mutateAsync({
        data: {
          user_id: currentUser?.userId || currentUser?.id,
          requested_amount: Number(requested_amount),
          repayment_months: Number(repayment_months),
          reason,
        },
        lang,
      });

      toast.success(
        t(
          "employeeFinancial.advance.success",
          "Advance request submitted successfully.",
        ),
      );
      setShowAdvanceModal(false);
      setAdvanceForm({
        requested_amount: "",
        repayment_months: "",
        reason: "",
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t(
          "employeeFinancial.advance.error",
          "Failed to submit advance request.",
        );
      toast.error(message);
    }
  };

  // =====================================================
  // Helpers
  // =====================================================

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();

    if (s === "approved" || s === "finalized") {
      return {
        bg: "bg-[#f0fdf4]",
        text: "text-[#166534]",
        border: "border-[#bbf7d0]",
        dot: "bg-[#22c55e]",
      };
    }

    if (s === "rejected" || s === "cancelled") {
      return {
        bg: "bg-[#fef2f2]",
        text: "text-[#991b1b]",
        border: "border-[#fecaca]",
        dot: "bg-[#ef4444]",
      };
    }

    if (s === "pending" || s === "queued") {
      return {
        bg: "bg-[#fffbeb]",
        text: "text-[#92400e]",
        border: "border-[#fde68a]",
        dot: "bg-[#f59e0b]",
      };
    }

    return {
      bg: "bg-[#eff6ff]",
      text: "text-[#1e40af]",
      border: "border-[#bfdbfe]",
      dot: "bg-[#3b82f6]",
    };
  };

  const getStatusLabel = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved")
      return t("employeeFinancial.status.approved", "Approved");
    if (s === "rejected")
      return t("employeeFinancial.status.rejected", "Rejected");
    if (s === "pending")
      return t("employeeFinancial.status.pending", "Pending");
    if (s === "finalized")
      return t("employeeFinancial.status.finalized", "Finalized");
    if (s === "queued") return t("employeeFinancial.status.queued", "Queued");
    if (s === "cancelled")
      return t("employeeFinancial.status.cancelled", "Cancelled");
    if (s === "manual") return t("employeeFinancial.status.manual", "Manual");
    return status;
  };

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

  const formatCurrency = (amount) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleDownloadPayslip = async (item) => {
    if (!item?.id) return;
    try {
      setDownloadingPayslipId(item.id);
      const res = await downloadFinancialPayslip(item.id, lang);
      let filename = `payslip_${(item.employee_name || "employee").replace(/\s+/g, "_")}_${item.month_year || "month"}.pdf`;
      const cd = res.headers?.["content-disposition"];
      if (cd) {
        const match = cd.match(/filename=["']?([^"']+)["']?/);
        if (match && match[1]) filename = match[1];
      }
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(
        isRtl
          ? "تم تحميل قسيمة الراتب بنجاح"
          : "Payslip downloaded successfully",
      );
    } catch (err) {
      let errMsg = isRtl
        ? "فشل تحميل قسيمة الراتب"
        : "Failed to download payslip";
      if (err.response?.data?.message) errMsg = err.response.data.message;
      toast.error(errMsg);
    } finally {
      setDownloadingPayslipId(null);
    }
  };

  // =====================================================
  // Summary Cards for Salaries
  // =====================================================

  const salaryStats = useMemo(() => {
    const salaries = salariesResponse?.data?.data || [];
    if (salaries.length === 0) return null;

    const latest = salaries[0];
    return {
      basicSalary: latest?.basic_salary,
      totalBonuses: latest?.total_bonuses,
      totalDeductions: latest?.total_deductions,
      loanInstallment: latest?.loan_installment,
      netSalary: latest?.net_salary,
    };
  }, [salariesResponse]);

  // =====================================================
  // Render Card for Each Tab
  // =====================================================

  const renderSalaryCard = (item, index) => (
    <motion.article
      layout
      key={item.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
      className="relative rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:shadow-md transition-shadow"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white">
            <FiFileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#102a43]">
              {item.month_year || "—"}
            </h3>
            <p className="text-xs text-[#829ab1]">{item.employee_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(item.is_finalized || item.status === "finalized") && (
            <button
              onClick={() => handleDownloadPayslip(item)}
              disabled={downloadingPayslipId === item.id}
              title={isRtl ? "تحميل قسيمة الراتب PDF" : "Download Payslip PDF"}
              className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-1 text-xs font-semibold text-[#475569] shadow-sm transition hover:bg-[#f8fafc] disabled:opacity-50"
            >
              {downloadingPayslipId === item.id ? (
                <FiLoader size={12} className="animate-spin text-[#3b82f6]" />
              ) : (
                <FiDownload size={12} />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}
          {(() => {
            const style = getStatusStyle(item.status);
            return (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                {getStatusLabel(item.status)}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Financial breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#f1f5f9]">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
            {t("employeeFinancial.salary.basic", "Basic")}
          </p>
          <p className="text-sm font-bold text-[#102a43]">
            {formatCurrency(item.basic_salary)}
          </p>
        </div>
        <div className="rounded-xl bg-[#f0fdf4] p-3 border border-[#dcfce7]">
          <p className="text-[10px] font-semibold text-[#16a34a] uppercase tracking-wider mb-1">
            {t("employeeFinancial.salary.bonuses", "Bonuses")}
          </p>
          <p className="text-sm font-bold text-[#166534]">
            +{formatCurrency(item.total_bonuses)}
          </p>
        </div>
        <div className="rounded-xl bg-[#fef2f2] p-3 border border-[#fecaca]">
          <p className="text-[10px] font-semibold text-[#dc2626] uppercase tracking-wider mb-1">
            {t("employeeFinancial.salary.deductions", "Deductions")}
          </p>
          <p className="text-sm font-bold text-[#991b1b]">
            -{formatCurrency(item.total_deductions)}
          </p>
        </div>
        <div className="rounded-xl bg-[#fffbeb] p-3 border border-[#fde68a]">
          <p className="text-[10px] font-semibold text-[#d97706] uppercase tracking-wider mb-1">
            {t("employeeFinancial.salary.loan", "Loan")}
          </p>
          <p className="text-sm font-bold text-[#92400e]">
            -{formatCurrency(item.loan_installment)}
          </p>
        </div>
        <div className="rounded-xl bg-[#1c364f] p-3 col-span-2 sm:col-span-1">
          {" "}
          <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1">
            {t("employeeFinancial.salary.net", "Net")}
          </p>
          <p className="text-sm font-bold text-white">
            {formatCurrency(item.net_salary)}
          </p>
        </div>
      </div>
    </motion.article>
  );

  const renderAdvanceCard = (item, index) => (
    <motion.article
      layout
      key={item.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
      className="relative rounded-2xl border border-[#e2e8f0] bg-white p-6 pl-10 rtl:pr-10 rtl:pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:shadow-md transition-shadow"
    >
      {/* Side stripe */}
      <div
        className={`absolute left-5 rtl:left-auto rtl:right-5 top-6 bottom-6 w-[3.5px] rounded-full ${getStatusStyle(item.status).dot}`}
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <FiUser className="h-4 w-4 text-[#64748b]" />
          <span className="text-sm font-bold text-[#102a43]">
            {item.employee_name}
          </span>
        </div>
        {(() => {
          const style = getStatusStyle(item.status);
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {getStatusLabel(item.status)}
            </span>
          );
        })()}
      </div>

      {/* Reason */}
      {item.reason && (
        <p className="text-xs text-[#627d98] mb-4 line-clamp-2">
          {item.reason}
        </p>
      )}

      {/* Financial info */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#f1f5f9]">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
            {t("employeeFinancial.advance.amount", "Amount")}
          </p>
          <p className="text-sm font-bold text-[#102a43]">
            {formatCurrency(item.requested_amount)}
          </p>
        </div>
        <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#f1f5f9]">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
            {t("employeeFinancial.advance.months", "Months")}
          </p>
          <p className="text-sm font-bold text-[#102a43]">
            {item.repayment_months}
          </p>
        </div>
        <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#f1f5f9]">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
            {t("employeeFinancial.advance.monthly", "Monthly")}
          </p>
          <p className="text-sm font-bold text-[#102a43]">
            {formatCurrency(item.monthly_deduction)}
          </p>
        </div>
      </div>

      {/* Date */}
      <div className="mt-4 flex items-center gap-1.5 text-xs text-[#94a3b8]">
        <FiCalendar className="h-3.5 w-3.5" />
        <span>{formatDate(item.created_at)}</span>
      </div>
    </motion.article>
  );

  const renderDeductionCard = (item, index) => (
    <motion.article
      layout
      key={item.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
      className="relative rounded-2xl border border-[#e2e8f0] bg-white p-6 pl-10 rtl:pr-10 rtl:pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:shadow-md transition-shadow"
    >
      {/* Side stripe — red for deductions */}
      <div className="absolute left-5 rtl:left-auto rtl:right-5 top-6 bottom-6 w-[3.5px] rounded-full bg-[#ef4444]" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <FiUser className="h-4 w-4 text-[#64748b]" />
          <span className="text-sm font-bold text-[#102a43]">
            {item.employee_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {item.type && (
            <span className="inline-flex rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[10px] font-semibold text-[#64748b] border border-[#e2e8f0]">
              {item.type}
            </span>
          )}
          {(() => {
            const style = getStatusStyle(item.status);
            return (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                {getStatusLabel(item.status)}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Reason */}
      {item.reason && (
        <p className="text-xs text-[#627d98] mb-3">{item.reason}</p>
      )}

      {/* Amount & Date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#dc2626]">
            -{formatCurrency(item.amount)}
          </span>
          <span className="text-xs text-[#94a3b8]">
            {t("employeeFinancial.currency", "EGP")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
          <FiCalendar className="h-3.5 w-3.5" />
          <span>{formatDate(item.date || item.created_at)}</span>
        </div>
      </div>
    </motion.article>
  );

  const renderBonusCard = (item, index) => (
    <motion.article
      layout
      key={item.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
      className="relative rounded-2xl border border-[#e2e8f0] bg-white p-6 pl-10 rtl:pr-10 rtl:pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:shadow-md transition-shadow"
    >
      {/* Side stripe — green for bonuses */}
      <div className="absolute left-5 rtl:left-auto rtl:right-5 top-6 bottom-6 w-[3.5px] rounded-full bg-[#22c55e]" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <FiUser className="h-4 w-4 text-[#64748b]" />
          <span className="text-sm font-bold text-[#102a43]">
            {item.employee_name}
          </span>
          {item.role && (
            <span className="inline-flex rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[10px] font-semibold text-[#64748b] border border-[#e2e8f0]">
              {item.role}
            </span>
          )}
        </div>
        {(() => {
          const style = getStatusStyle(item.status);
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {getStatusLabel(item.status)}
            </span>
          );
        })()}
      </div>

      {/* Incentive info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div className="rounded-xl bg-[#f0fdf4] p-3 border border-[#dcfce7]">
          <p className="text-[10px] font-semibold text-[#16a34a] uppercase tracking-wider mb-1">
            {t("employeeFinancial.bonus.amount", "Amount")}
          </p>
          <p className="text-sm font-bold text-[#166534]">
            +{formatCurrency(item.amount)}
          </p>
        </div>
        <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#f1f5f9]">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
            {t("employeeFinancial.bonus.type", "Type")}
          </p>
          <p className="text-xs font-bold text-[#102a43] truncate">
            {item.incentive_type || "—"}
          </p>
        </div>
        <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#f1f5f9]">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
            {t("employeeFinancial.bonus.month", "Month")}
          </p>
          <p className="text-xs font-bold text-[#102a43]">
            {item.target_month || "—"}
          </p>
        </div>
        <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#f1f5f9]">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
            {t("employeeFinancial.bonus.approvedBy", "Approved By")}
          </p>
          <p className="text-xs font-bold text-[#102a43] truncate">
            {item.approved_by || "—"}
          </p>
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
        <FiCalendar className="h-3.5 w-3.5" />
        <span>{formatDate(item.created_at)}</span>
      </div>
    </motion.article>
  );

  const renderCard = (item, index) => {
    switch (activeTab) {
      case "salaries":
        return renderSalaryCard(item, index);
      case "advances":
        return renderAdvanceCard(item, index);
      case "deductions":
        return renderDeductionCard(item, index);
      case "bonuses":
        return renderBonusCard(item, index);
      default:
        return null;
    }
  };

  // =====================================================
  // Empty State Config
  // =====================================================

  const emptyConfig = {
    salaries: {
      icon: FiFileText,
      title: t("employeeFinancial.empty.salaries", "No salary records"),
      desc: t(
        "employeeFinancial.empty.salariesDesc",
        "Your salary history will appear here once payroll is processed.",
      ),
    },
    advances: {
      icon: FiDollarSign,
      title: t("employeeFinancial.empty.advances", "No advance requests"),
      desc: t(
        "employeeFinancial.empty.advancesDesc",
        "You haven't submitted any salary advance requests yet.",
      ),
    },
    deductions: {
      icon: FiTrendingDown,
      title: t("employeeFinancial.empty.deductions", "No deductions"),
      desc: t(
        "employeeFinancial.empty.deductionsDesc",
        "You have no deductions or penalties on record.",
      ),
    },
    bonuses: {
      icon: FiAward,
      title: t("employeeFinancial.empty.bonuses", "No bonuses"),
      desc: t(
        "employeeFinancial.empty.bonusesDesc",
        "No bonuses or incentives have been recorded yet.",
      ),
    },
  };

  // =====================================================
  // Render
  // =====================================================

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
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#6366f1] uppercase mb-1">
            {t("employeeFinancial.eyebrow", "FINANCIAL MANAGEMENT")}
          </p>

          <h1 className="text-2xl md:text-[28px] font-bold text-[#102a43] tracking-tight">
            {t("employeeFinancial.title", "My Financials")}
          </h1>

          <p className="text-sm text-[#829ab1] mt-1 font-normal">
            {t(
              "employeeFinancial.subtitle",
              "Track your salary, advances, deductions, and bonuses.",
            )}
          </p>
        </div>

        {/* Request Advance Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => setShowAdvanceModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1c364f] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#254360] transition shadow-sm self-start"
        >
          <FiPlus className="h-4 w-4" />
          <span>
            {t("employeeFinancial.requestAdvance", "Request Advance")}
          </span>
        </motion.button>
      </motion.div>

      {/* =================================================
          Summary Cards (Salaries tab)
      ================================================= */}

      {activeTab === "salaries" && salaryStats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-3"
        >
          {/* Basic Salary */}
          <div className="rounded-2xl bg-white border border-[#e2e8f0] p-4 shadow-sm col-span-1">
            <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
              {t("employeeFinancial.salary.basic", "Basic Salary")}
            </p>
            <p className="text-xl font-extrabold text-[#102a43]">
              {formatCurrency(salaryStats.basicSalary)}
            </p>
          </div>

          {/* Bonuses */}
          <div className="rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] p-4 shadow-sm col-span-1">
            <p className="text-[11px] font-bold text-[#16a34a] uppercase tracking-wider mb-1">
              {t("employeeFinancial.salary.bonuses", "Bonuses")}
            </p>
            <p className="text-xl font-extrabold text-[#166534]">
              +{formatCurrency(salaryStats.totalBonuses)}
            </p>
          </div>

          {/* Deductions */}
          <div className="rounded-2xl bg-[#fef2f2] border border-[#fecaca] p-4 shadow-sm col-span-1">
            <p className="text-[11px] font-bold text-[#dc2626] uppercase tracking-wider mb-1">
              {t("employeeFinancial.salary.deductions", "Deductions")}
            </p>
            <p className="text-xl font-extrabold text-[#991b1b]">
              -{formatCurrency(salaryStats.totalDeductions)}
            </p>
          </div>

          {/* Loan */}
          <div className="rounded-2xl bg-[#fffbeb] border border-[#fde68a] p-4 shadow-sm col-span-1">
            <p className="text-[11px] font-bold text-[#d97706] uppercase tracking-wider mb-1">
              {t("employeeFinancial.salary.loan", "Loan")}
            </p>
            <p className="text-xl font-extrabold text-[#92400e]">
              -{formatCurrency(salaryStats.loanInstallment)}
            </p>
          </div>

          {/* Net Salary */}
          <div className="rounded-2xl bg-[#1c364f] border border-[#1c364f] p-4 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
              {t("employeeFinancial.salary.net", "Net Salary")}
            </p>
            <p className="text-xl font-extrabold text-white">
              {formatCurrency(salaryStats.netSalary)}
            </p>
          </div>
        </motion.div>
      )}

      {/* =================================================
          Tab Pills
      ================================================= */}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex items-center gap-2.5 overflow-x-auto pb-1"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                isActive
                  ? "bg-[#1c364f] text-white"
                  : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              <span>{t(tab.labelKey, tab.defaultLabel)}</span>
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
            <FiLoader className="h-8 w-8 text-[#6366f1] mb-3 animate-spin" />
            <p className="text-sm font-semibold text-[#102a43]">
              {t("employeeFinancial.loading", "Loading...")}
            </p>
          </motion.div>
        ) : isError ? (
          /* Error */
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-12 text-center"
          >
            <FiAlertCircle className="h-8 w-8 text-[#ef4444] mb-2" />
            <p className="text-sm font-semibold text-[#991b1b]">
              {errorMessage}
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1c364f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#254360] transition"
            >
              <FiRefreshCw className="h-3.5 w-3.5" />
              <span>{t("employeeFinancial.retry", "Try again")}</span>
            </motion.button>
          </motion.div>
        ) : items.length > 0 ? (
          /* Items */
          <motion.div layout className="space-y-4">
            {items.map((item, index) => renderCard(item, index))}
          </motion.div>
        ) : (
          /* Empty */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e2e8f0] bg-white p-12 text-center"
          >
            {(() => {
              const cfg = emptyConfig[activeTab];
              const EmptyIcon = cfg.icon;
              return (
                <>
                  <EmptyIcon className="h-8 w-8 text-[#94a3b8] mb-2" />
                  <p className="text-sm font-semibold text-[#102a43]">
                    {cfg.title}
                  </p>
                  <p className="text-xs text-[#829ab1] mt-1">{cfg.desc}</p>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================
          Pagination
      ================================================= */}

      {!isLoading && !isError && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 pt-2"
        >
          {/* Previous */}
          <motion.button
            whileTap={{ scale: 0.95 }}
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
          {Array.from({ length: totalPages }, (_, i) => i + 1)
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
                  whileTap={{ scale: 0.95 }}
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
            whileTap={{ scale: 0.95 }}
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

      {/* Pagination Info */}
      {!isLoading && !isError && meta && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[11px] text-[#94a3b8]"
        >
          {t("employeeFinancial.showing", "Showing")} {meta.from || 0}–
          {meta.to || 0} {t("employeeFinancial.of", "of")} {meta.total || 0}{" "}
          {t("employeeFinancial.records", "records")}
        </motion.p>
      )}

      {/* =================================================
          Request Advance Modal
      ================================================= */}

      <AnimatePresence>
        {showAdvanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdvanceModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {t("employeeFinancial.advance.newRequest", "NEW REQUEST")}
                  </p>
                  <h2 className="text-lg font-bold text-[#102a43] mt-0.5">
                    {t(
                      "employeeFinancial.advance.title",
                      "Request Salary Advance",
                    )}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitAdvance} className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                    {t(
                      "employeeFinancial.advance.amountLabel",
                      "Requested Amount",
                    )}
                  </label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                    <input
                      type="number"
                      min="1"
                      value={advanceForm.requested_amount}
                      onChange={(e) =>
                        setAdvanceForm((f) => ({
                          ...f,
                          requested_amount: e.target.value,
                        }))
                      }
                      placeholder={t(
                        "employeeFinancial.advance.amountPlaceholder",
                        "e.g. 5000",
                      )}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-4 rtl:pr-10 rtl:pl-4 text-sm text-[#102a43] placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Repayment Months */}
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                    {t(
                      "employeeFinancial.advance.repaymentLabel",
                      "Repayment Months",
                    )}
                  </label>
                  <div className="relative">
                    <FiClock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={advanceForm.repayment_months}
                      onChange={(e) =>
                        setAdvanceForm((f) => ({
                          ...f,
                          repayment_months: e.target.value,
                        }))
                      }
                      placeholder={t(
                        "employeeFinancial.advance.monthsPlaceholder",
                        "e.g. 5",
                      )}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-4 rtl:pr-10 rtl:pl-4 text-sm text-[#102a43] placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] focus:outline-none transition"
                    />
                  </div>

                  {/* Monthly deduction preview */}
                  {advanceForm.requested_amount &&
                    advanceForm.repayment_months && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 text-xs text-[#6366f1] font-medium"
                      >
                        {t(
                          "employeeFinancial.advance.monthlyDeduction",
                          "Monthly deduction",
                        )}
                        :{" "}
                        {formatCurrency(
                          Number(advanceForm.requested_amount) /
                            Number(advanceForm.repayment_months),
                        )}
                      </motion.p>
                    )}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                    {t("employeeFinancial.advance.reasonLabel", "Reason")}
                  </label>
                  <textarea
                    rows={3}
                    value={advanceForm.reason}
                    onChange={(e) =>
                      setAdvanceForm((f) => ({ ...f, reason: e.target.value }))
                    }
                    placeholder={t(
                      "employeeFinancial.advance.reasonPlaceholder",
                      "Describe why you need this advance...",
                    )}
                    className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 px-4 text-sm text-[#102a43] placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] focus:outline-none transition resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={createAdvanceMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1c364f] py-3 px-4 text-xs font-semibold text-white hover:bg-[#254360] transition shadow-sm disabled:opacity-60"
                  >
                    {createAdvanceMutation.isPending ? (
                      <FiLoader className="h-4 w-4 animate-spin" />
                    ) : (
                      <FiPlus className="h-4 w-4" />
                    )}
                    <span>
                      {createAdvanceMutation.isPending
                        ? t(
                            "employeeFinancial.advance.submitting",
                            "Submitting...",
                          )
                        : t(
                            "employeeFinancial.advance.submit",
                            "Submit Request",
                          )}
                    </span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setShowAdvanceModal(false)}
                    className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-3 text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition"
                  >
                    {t("common.cancel", "Cancel")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Financial;
