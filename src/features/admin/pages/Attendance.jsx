import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiCalendar,
  FiShield,
  FiMapPin,
  FiSmartphone,
  FiActivity,
  FiDownload,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiMoreHorizontal,
  FiUsers,
  FiArrowUpRight,
  FiX,
  FiSave,
  FiBarChart2,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useHrDailyAttendance } from "../../hr/hooks/useHrDailyAttendance";
import { useHrAttendanceExceptions } from "../../hr/hooks/useHrAttendanceExceptions";
import { useHrMonthlySummary } from "../../hr/hooks/useHrMonthlySummary";
import { useHrExportAttendance } from "../../hr/hooks/useHrExportAttendance";
import { useUpdateAttendanceException } from "../../hr/hooks/useUpdateAttendanceException";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "NA";

const statusStyles = {
  present: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  late: {
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
  },
  absent: {
    badge: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
  },
  "on shift": {
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
  },
};

const getStatusStyle = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  return (
    statusStyles[normalized] || {
      badge: "bg-slate-50 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
    }
  );
};

const modeConfig = {
  gps: { label: "GPS", icon: FiMapPin },
  mobile: { label: "Mobile", icon: FiSmartphone },
  manual: { label: "Manual", icon: FiActivity },
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sub-components
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1c364f]" />
      <p className="mt-3 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
        <FiAlertTriangle className="h-5 w-5 text-red-600" />
      </div>
      <p className="mt-3 text-sm font-semibold text-red-600">
        Failed to load data.
      </p>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
        {message || "Something went wrong. Please try again."}
      </p>
    </div>
  );
}

function EmptyState({ label = "No records found", hint }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
        <FiUsers className="h-5 w-5 text-slate-500" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{label}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function PaginationBar({ meta, onPrev, onNext }) {
  if (!meta) return null;
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">{meta.from ?? 0}</span>{" "}
        to{" "}
        <span className="font-semibold text-slate-700">{meta.to ?? 0}</span> of{" "}
        <span className="font-semibold text-slate-700">{meta.total ?? 0}</span>{" "}
        records
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={meta.current_page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-slate-600">
          {meta.current_page} / {meta.last_page}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={meta.current_page >= meta.last_page}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const TABS = [
  { id: "daily", label: "Daily Attendance" },
  { id: "exceptions", label: "Exceptions" },
  { id: "monthly", label: "Monthly Summary" },
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main Component
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AdminAttendance() {
  const { t } = useTranslation();

  // ── Active tab ─────────────────────────────
  const [activeTab, setActiveTab] = useState("daily");

  // ── Shared daily/exceptions filters ────────
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dailyPage, setDailyPage] = useState(1);
  const [exceptionsPage, setExceptionsPage] = useState(1);
  const perPage = 15;

  // ── Monthly filters ────────────────────────
  const [monthlyMonth, setMonthlyMonth] = useState(
    () => new Date().getMonth() + 1,
  );
  const [monthlyYear, setMonthlyYear] = useState(
    () => new Date().getFullYear(),
  );
  const [monthlySearch, setMonthlySearch] = useState("");
  const [monthlyDepartment, setMonthlyDepartment] = useState("");
  const [monthlyPage, setMonthlyPage] = useState(1);

  // ── Manual adjustment modal ────────────────
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    checkIn: "",
    checkOut: "",
    reason: "",
  });

  // ── Exception review modal ─────────────────
  const [reviewException, setReviewException] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: "approved",
    adminNote: "",
  });

  // ─────────────────────────────────────────────
  // API CALLS
  // ─────────────────────────────────────────────

  // 1. Daily attendance
  const {
    data: dailyResponse,
    isLoading: dailyLoading,
    isError: dailyError,
    error: dailyErrorObj,
  } = useHrDailyAttendance({
    date: selectedDate,
    departmentId: selectedDepartment || undefined,
    managerId: selectedManager || undefined,
    status: selectedStatus || undefined,
    search: searchTerm || undefined,
    perPage,
    page: dailyPage,
    enabled: activeTab === "daily",
  });

  // 2. Exceptions
  const {
    data: exceptionsResponse,
    isLoading: exceptionsLoading,
    isError: exceptionsError,
    error: exceptionsErrorObj,
  } = useHrAttendanceExceptions({
    date: selectedDate,
    departmentId: selectedDepartment || undefined,
    perPage,
    page: exceptionsPage,
    enabled: activeTab === "exceptions",
  });

  // 3. Monthly summary
  const {
    data: monthlyResponse,
    isLoading: monthlyLoading,
    isError: monthlyError,
    error: monthlyErrorObj,
  } = useHrMonthlySummary({
    month: monthlyMonth,
    year: monthlyYear,
    departmentId: monthlyDepartment || undefined,
    search: monthlySearch || undefined,
    perPage,
    page: monthlyPage,
    enabled: activeTab === "monthly",
  });

  // 4. Export
  const { mutate: exportAttendance, isPending: exportLoading } =
    useHrExportAttendance();

  // 5. Update exception status (PATCH /hr/attendance/exceptions/{id})
  const { mutate: updateException, isPending: updateExceptionLoading } =
    useUpdateAttendanceException();

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // DERIVED DATA
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const summary = dailyResponse?.data?.summary || {
    total_employees: 0,
    present: 0,
    late: 0,
    absent: 0,
  };

  const employees = dailyResponse?.data?.employees?.data || [];
  const dailyMeta = dailyResponse?.data?.employees?.meta || {
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
    total: 0,
    per_page: perPage,
  };

  const exceptions = exceptionsResponse?.data?.exceptions || [];
  const exceptionsMeta = exceptionsResponse?.data?.meta || null;

  const monthlySummary = monthlyResponse?.data?.summary || [];
  const monthlyMeta = monthlyResponse?.data?.meta || null;

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // HANDLERS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleOpenAdjustment = (employee) => {
    setSelectedEmployee(employee);
    setAdjustmentForm({
      checkIn:
        employee.check_in && employee.check_in !== "â€”"
          ? employee.check_in
          : "",
      checkOut:
        employee.check_out && employee.check_out !== "â€”"
          ? employee.check_out
          : "",
      reason: "",
    });
    setAdjustmentOpen(true);
  };

  const handleCloseAdjustment = () => {
    setAdjustmentOpen(false);
    setSelectedEmployee(null);
    setAdjustmentForm({ checkIn: "", checkOut: "", reason: "" });
  };

  const handleSaveAdjustment = (event) => {
    event.preventDefault();
    handleCloseAdjustment();
  };

  const handleOpenReview = (exception) => {
    setReviewException(exception);
    setReviewForm({
      status: exception.exception?.status || "approved",
      adminNote: exception.exception?.admin_note || "",
    });
  };

  const handleCloseReview = () => {
    setReviewException(null);
    setReviewForm({ status: "approved", adminNote: "" });
  };

  const handleSubmitReview = (event) => {
    event.preventDefault();
    if (!reviewException) return;
    const attendanceId = reviewException.attendance_id || reviewException.id;
    updateException(
      {
        attendanceId,
        status: reviewForm.status,
        adminNote: reviewForm.adminNote,
      },
      {
        onSuccess: () => {
          toast.success("Exception status updated successfully.");
          handleCloseReview();
        },
        onError: (error) => {
          toast.error(
            error?.response?.data?.message ||
            "Failed to update exception status.",
          );
        },
      },
    );
  };

  const handleQuickReview = (exception, status) => {
    const attendanceId = exception.attendance_id || exception.id;
    if (!attendanceId) return;
    updateException(
      {
        attendanceId,
        status,
        adminNote: exception.exception?.admin_note || "",
      },
      {
        onSuccess: () => {
          toast.success(`Exception ${status === "approved" ? "approved" : "rejected"} successfully.`);
        },
        onError: (error) => {
          toast.error(
            error?.response?.data?.message ||
            "Failed to update exception status.",
          );
        },
      },
    );
  };

  const handleExport = () => {
    exportAttendance(
      {
        month: monthlyMonth,
        year: monthlyYear,
        departmentId: monthlyDepartment || undefined,
        search: monthlySearch || undefined,
      },
      {
        onSuccess: ({ filename }) => {
          toast.success(`Downloaded: ${filename}`);
        },
        onError: (error) => {
          toast.error(
            error?.response?.data?.message ||
            "Failed to export. Please try again.",
          );
        },
      },
    );
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // RENDER
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="min-h-screen bg-slate-50">
      {/* â”€â”€ PAGE HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1c364f]">
              Attendance Management
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Monitor employee attendance in real time across all branches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={activeTab !== "monthly" || exportLoading}
            title={
              activeTab !== "monthly"
                ? "Switch to Monthly Summary to export"
                : "Export monthly attendance to Excel"
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {exportLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#1c364f]" />
            ) : (
              <FiDownload className="h-4 w-4" />
            )}
            {exportLoading ? "Exporting..." : "Export Excel"}
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1c364f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#24425f]"
          >
            <FiActivity className="h-4 w-4" />
            Live Monitor
          </button>
        </div>
      </div>

      {/* â”€â”€ SHARED FILTERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab !== "monthly" && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-[#1c364f]">
              Attendance Filters
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Search and filter attendance records by date
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDailyPage(1);
                }}
                placeholder="Search employee or ID..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
              />
            </div>
            <div className="relative">
              <FiCalendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDailyPage(1);
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
              />
            </div>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setDailyPage(1);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-xs text-slate-700 outline-none transition focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
              >
                <option value="">{t("attendance.allStatuses", "All statuses")}</option>
                <option value="Present">{t("attendance.present", "Present")}</option>
                <option value="Late">{t("attendance.late", "Late")}</option>
                <option value="Absent">{t("attendance.absent", "Absent")}</option>
                <option value="On Shift">{t("attendance.onShift", "On Shift")}</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setDailyPage(1);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-xs text-slate-700 outline-none transition focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
              >
                <option value="">All departments</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={selectedManager}
                onChange={(e) => {
                  setSelectedManager(e.target.value);
                  setDailyPage(1);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-xs text-slate-700 outline-none transition focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
              >
                <option value="">All managers</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </section>
      )}

      {/* â”€â”€ MONTHLY FILTERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "monthly" && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-[#1c364f]">
              Monthly Summary Filters
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Filter by month and year to view the attendance summary report
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <select
                value={monthlyMonth}
                onChange={(e) => {
                  setMonthlyMonth(Number(e.target.value));
                  setMonthlyPage(1);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-xs text-slate-700 outline-none transition focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
              >
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December",
                ].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={monthlyYear}
                onChange={(e) => {
                  setMonthlyYear(Number(e.target.value));
                  setMonthlyPage(1);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-xs text-slate-700 outline-none transition focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
              >
                {Array.from({ length: 7 }, (_, i) => 2020 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={monthlySearch}
                onChange={(e) => {
                  setMonthlySearch(e.target.value);
                  setMonthlyPage(1);
                }}
                placeholder="Search employee..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
              />
            </div>
            <div className="relative">
              <select
                value={monthlyDepartment}
                onChange={(e) => {
                  setMonthlyDepartment(e.target.value);
                  setMonthlyPage(1);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-xs text-slate-700 outline-none transition focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
              >
                <option value="">All departments</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </section>
      )}

      {/* â”€â”€ SUMMARY CARDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "daily" && (
        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Present Today", value: summary.present, hint: "Across all branches", icon: FiCheckCircle, bg: "bg-emerald-50", color: "text-emerald-600" },
            { label: "Late Arrivals", value: summary.late, hint: "15-minute grace period", icon: FiClock, bg: "bg-amber-50", color: "text-amber-600" },
            { label: "Unexcused Absences", value: summary.absent, hint: "Requires follow-up", icon: FiAlertTriangle, bg: "bg-red-50", color: "text-red-600" },
            { label: "Approved Leave", value: 0, hint: "Today", icon: FiCalendar, bg: "bg-blue-50", color: "text-blue-600" },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{card.label}</p>
                    <p className="mt-2 text-3xl font-bold text-[#1c364f]">{card.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>
      )}

      {/* â”€â”€ POLICY BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "daily" && (
        <section className="mb-6 rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <FiShield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1c364f]">Attendance Policy</h3>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
                  15-minute grace period is active. Late check-ins are automatically flagged for payroll review.
                </p>
              </div>
            </div>
            <button type="button" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#1c364f] transition hover:underline">
              View policy
              <FiArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* â”€â”€ TABS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${activeTab === tab.id
              ? "bg-[#1c364f] text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
          >
            {tab.label}
            {tab.id === "exceptions" && (exceptionsMeta?.total ?? 0) > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {exceptionsMeta.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* â•â•â• TAB: DAILY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === "daily" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1c364f]">Shift &amp; punctuality log</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {dailyMeta.total ?? 0}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Real-time employee attendance records for {selectedDate}.
              </p>
            </div>
            <button type="button" className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:self-auto">
              More <FiMoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {dailyLoading ? (
            <LoadingSpinner label="Loading attendance records..." />
          ) : dailyError ? (
            <ErrorState message={dailyErrorObj?.message} />
          ) : employees.length === 0 ? (
            <EmptyState label="No attendance records found" hint="Try changing the date or filters." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      {["Employee", "Branch", "Shift", "Check-in", "Check-out", "Duration", "Delay", "Mode", "Status", "Action"].map((col) => (
                        <th key={col} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 first:px-5">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((row) => {
                      const rowStatus = getStatusStyle(row.status);
                      const mode =
                        row.attendance_id !== null && row.attendance_id !== undefined
                          ? modeConfig.gps
                          : null;
                      const ModeIcon = mode?.icon;
                      return (
                        <tr key={row.user_id} className="transition hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1c364f]/10 text-[10px] font-bold text-[#1c364f]">
                                {getInitials(row.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-[#1c364f]">{row.name || "â€”"}</p>
                                <p className="mt-0.5 text-[10px] text-slate-400">{row.employee_code || "â€”"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-slate-600">{row.department || "N/A"}</td>
                          <td className="px-4 py-4 text-xs font-medium text-slate-600">{row.job_title || "â€”"}</td>
                          <td className="px-4 py-4 text-xs font-semibold text-slate-700">{row.check_in || "â€”"}</td>
                          <td className="px-4 py-4 text-xs font-semibold text-slate-700">{row.check_out || "â€”"}</td>
                          <td className="px-4 py-4 text-xs font-medium text-slate-600">{row.worked_hours || "â€”"}</td>
                          <td className="px-4 py-4 text-xs font-medium text-slate-500">â€”</td>
                          <td className="px-4 py-4">
                            {mode && ModeIcon ? (
                              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                <ModeIcon className="h-3.5 w-3.5 text-slate-400" />
                                {mode.label}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">â€”</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${rowStatus.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${rowStatus.dot}`} />
                              {row.status || "â€”"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustment(row)}
                              className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-[#1c364f] transition hover:border-[#1c364f]/20 hover:bg-slate-50"
                            >
                              Manual Adjustment
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                meta={dailyMeta}
                onPrev={() => setDailyPage((p) => Math.max(1, p - 1))}
                onNext={() => setDailyPage((p) => Math.min(dailyMeta.last_page, p + 1))}
              />
            </>
          )}
        </section>
      )}

      {/* â•â•â• TAB: EXCEPTIONS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === "exceptions" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1c364f]">Attendance Exceptions</h2>
                {(exceptionsMeta?.total ?? 0) > 0 && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                    {exceptionsMeta.total}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">Records requiring review for {selectedDate}.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
              <FiAlertTriangle className="h-3.5 w-3.5" />
              Exception Monitor
            </div>
          </div>

          {exceptionsLoading ? (
            <LoadingSpinner label="Loading attendance exceptions..." />
          ) : exceptionsError ? (
            <ErrorState message={exceptionsErrorObj?.message} />
          ) : exceptions.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
                <FiCheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">No attendance exceptions</p>
              <p className="mt-1 text-xs text-slate-500">There are no exception records for the selected date.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {exceptions.map((exception) => {
                  const exStatus = getStatusStyle(exception.status);
                  return (
                    <div
                      key={`${exception.attendance_id}-${exception.user?.id}`}
                      className="px-5 py-5 transition hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1c364f]/10 text-xs font-bold text-[#1c364f]">
                            {getInitials(exception.user?.name)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-[#1c364f]">
                              {exception.user?.name || "Unknown employee"}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">{exception.user?.employee_code || "â€”"}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                {exception.user?.job_title || "â€”"}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                {exception.user?.department || "â€”"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 xl:min-w-[600px]">
                          {[
                            { label: "Date", value: exception.date },
                            { label: "Check-in", value: exception.check_in },
                            { label: "Check-out", value: exception.check_out },
                          ].map((item) => (
                            <div key={item.label}>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-700">{item.value || "â€”"}</p>
                            </div>
                          ))}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</p>
                            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${exStatus.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${exStatus.dot}`} />
                              {exception.status || "Exception"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Reason & Review Section */}
                      <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-red-400">Exception Reason</p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-red-700">
                              {exception.exception_reason || exception.exception?.reason || "No reason provided."}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500">
                            <FiMapPin className="h-3.5 w-3.5" />
                            {exception.company_name || "—"}
                          </div>
                        </div>

                        {/* Admin note if already reviewed */}
                        {exception.exception?.admin_note && (
                          <div className="mt-3 rounded-lg border border-red-100 bg-white px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Admin Note</p>
                            <p className="mt-0.5 text-xs text-slate-600">{exception.exception.admin_note}</p>
                          </div>
                        )}

                        {/* Approve / Reject buttons */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {exception.exception?.status === "approved" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Approved
                            </span>
                          ) : exception.exception?.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Pending Review
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenReview(exception)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-[#1c364f] transition hover:bg-slate-50 shadow-sm"
                          >
                            {exception.exception?.status ? "Update Review" : "Review Exception"}
                          </button>

                          <button
                            type="button"
                            disabled={updateExceptionLoading}
                            onClick={() => handleQuickReview(exception, "approved")}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={updateExceptionLoading}
                            onClick={() => handleQuickReview(exception, "rejected")}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-rose-700 disabled:opacity-50 shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {exceptionsMeta && (
                <PaginationBar
                  meta={exceptionsMeta}
                  onPrev={() => setExceptionsPage((p) => Math.max(1, p - 1))}
                  onNext={() =>
                    setExceptionsPage((p) =>
                      Math.min(exceptionsMeta?.last_page ?? 1, p + 1),
                    )
                  }
                />
              )}
            </>
          )}
        </section>
      )}

      {/* â•â•â• TAB: MONTHLY SUMMARY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === "monthly" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1c364f]">Monthly Attendance Summary</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {monthlyMeta?.total ?? 0}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Attendance breakdown per employee for{" "}
                {new Date(monthlyYear, monthlyMonth - 1).toLocaleString("default", { month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
              <FiBarChart2 className="h-3.5 w-3.5" />
              Monthly Report
            </div>
          </div>

          {monthlyLoading ? (
            <LoadingSpinner label="Loading monthly summary..." />
          ) : monthlyError ? (
            <ErrorState message={monthlyErrorObj?.message} />
          ) : monthlySummary.length === 0 ? (
            <EmptyState label="No monthly data found" hint="Try selecting a different month or year." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      {["Employee", "Job Title", "Department", "Present Days", "Late Days", "Late Minutes", "Absent Days", "Worked Hours"].map((col) => (
                        <th key={col} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 first:px-5">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlySummary.map((row) => (
                      <tr key={row.user_id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1c364f]/10 text-[10px] font-bold text-[#1c364f]">
                              {getInitials(row.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-[#1c364f]">{row.name || "â€”"}</p>
                              <p className="mt-0.5 text-[10px] text-slate-400">{row.employee_code || "â€”"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-600">{row.job_title || "â€”"}</td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-600">{row.department || "N/A"}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                            {row.summary?.present_days ?? 0}d
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                            {row.summary?.late_days ?? 0}d
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-600">
                          {row.summary?.late_minutes_total ?? 0} min
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                            {row.summary?.absent_days ?? 0}d
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-600">
                          {row.summary?.total_worked_hours || "0.0h"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                meta={monthlyMeta}
                onPrev={() => setMonthlyPage((p) => Math.max(1, p - 1))}
                onNext={() => setMonthlyPage((p) => Math.min(monthlyMeta?.last_page ?? 1, p + 1))}
              />
            </>
          )}
        </section>
      )}

      {/* â”€â”€ TIMESTAMP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
        <FiClock className="h-3 w-3" />
        Updated just now
      </div>

      {/* â•â•â• MANUAL ADJUSTMENT MODAL â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <AnimatePresence>
        {adjustmentOpen && selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseAdjustment}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[90vh] w-full max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-bold text-[#1c364f]">Manual Adjustment</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedEmployee.name} Â· {selectedEmployee.employee_code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseAdjustment}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSaveAdjustment} className="space-y-5 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">Check-in</label>
                    <input
                      type="text"
                      value={adjustmentForm.checkIn}
                      onChange={(e) => setAdjustmentForm((f) => ({ ...f, checkIn: e.target.value }))}
                      placeholder="e.g. 09:00 AM"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">Check-out</label>
                    <input
                      type="text"
                      value={adjustmentForm.checkOut}
                      onChange={(e) => setAdjustmentForm((f) => ({ ...f, checkOut: e.target.value }))}
                      placeholder="e.g. 05:00 PM"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">Reason</label>
                  <textarea
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm((f) => ({ ...f, reason: e.target.value }))}
                    rows={4}
                    placeholder="Enter the reason for this manual adjustment..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
                  />
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-[11px] leading-5 text-amber-700">
                      Manual attendance adjustments should be used only when the attendance record needs correction.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseAdjustment}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1c364f] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#24425f]"
                  >
                    <FiSave className="h-3.5 w-3.5" />
                    Save Adjustment
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          EXCEPTION REVIEW MODAL
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <AnimatePresence>
        {reviewException && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseReview}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[90vh] w-full max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-bold text-[#1c364f]">Review Exception</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {reviewException.user?.name} Â· {reviewException.user?.employee_code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-5 p-5">
                <div className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-400">Exception Reason</p>
                  <p className="mt-1 text-xs leading-5 text-red-700">
                    {reviewException.exception_reason || reviewException.exception?.reason || "No reason provided."}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">Decision</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewForm((f) => ({ ...f, status: "approved" }))}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${reviewForm.status === "approved"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewForm((f) => ({ ...f, status: "rejected" }))}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${reviewForm.status === "rejected"
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Reject
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Admin Note <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    value={reviewForm.adminNote}
                    onChange={(e) => setReviewForm((f) => ({ ...f, adminNote: e.target.value }))}
                    rows={3}
                    placeholder="Add a note explaining your decision..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseReview}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateExceptionLoading}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition ${reviewForm.status === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {updateExceptionLoading ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <FiSave className="h-3.5 w-3.5" />
                    )}
                    {updateExceptionLoading
                      ? "Saving..."
                      : reviewForm.status === "approved"
                        ? "Confirm Approval"
                        : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

