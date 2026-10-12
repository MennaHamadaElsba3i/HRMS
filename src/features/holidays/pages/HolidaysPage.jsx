import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiSearch,
  FiFilter,
  FiPlus,
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiInfo,
  FiTag,
  FiSun,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { MdEventAvailable, MdDateRange, MdCelebration } from "react-icons/md";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
} from "../../../hooks/useHolidays";

// ─────────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.15 },
  },
};

// ─────────────────────────────────────────────
// Date Helpers
// ─────────────────────────────────────────────
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (dateStr, lang = "en") => {
  const d = parseDate(dateStr);
  if (!d) return dateStr || "—";
  return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const calculateDays = (startDateStr, endDateStr) => {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  if (!start) return 1;
  if (!end) return 1;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

const isDateInHoliday = (targetDate, holiday) => {
  if (!holiday?.start_date) return false;
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  const start = parseDate(holiday.start_date);
  if (!start) return false;
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();

  const end = holiday.end_date ? parseDate(holiday.end_date) : start;
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

  return target >= startTime && target <= endTime;
};

// ─────────────────────────────────────────────
// Unified Holidays Component
// ─────────────────────────────────────────────
export default function HolidaysPage({ customRole }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { user } = useAuth();

  const currentRole = (customRole || user?.role || "Employee").toLowerCase();
  const isManagement = currentRole === "owner" || currentRole === "admin" || currentRole === "hr";
  const translateHolidayName = (name) => {
    const normalized = name?.trim().toLowerCase();
    const key = normalized === "6 oct" ? "sixOctober" : normalized === "[test] year-end break" ? "yearEndBreak" : null;
    return key ? t("holidays.items." + key, name) : name;
  };
  const translateHolidayDescription = (description) =>
    description?.trim().toLowerCase() === "test year-end company closure."
      ? t("holidays.items.yearEndDescription", description)
      : description;

  // Data fetching from GET /api/holidays
  const {
    data: holidaysData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useHolidays();

  const holidays = useMemo(() => {
    return Array.isArray(holidaysData) ? holidaysData : [];
  }, [holidaysData]);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid" | "calendar"
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedHolidayModal, setSelectedHolidayModal] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null); // holiday object being edited
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // id of holiday pending delete

  const emptyForm = { name: "", start_date: "", end_date: "", description: "", is_active: true };

  // Form State (shared for Create & Edit)
  const [formData, setFormData] = useState(emptyForm);

  const openCreateModal = () => {
    setEditingHoliday(null);
    setFormData(emptyForm);
    setIsScheduleModalOpen(true);
  };

  const openEditModal = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name || "",
      start_date: holiday.start_date || "",
      end_date: holiday.end_date || "",
      description: holiday.description || "",
      is_active: holiday.is_active !== false,
    });
    setIsScheduleModalOpen(true);
  };

  const closeFormModal = () => {
    setIsScheduleModalOpen(false);
    setEditingHoliday(null);
    setFormData(emptyForm);
  };

  const { mutate: doCreateHoliday, isPending: isCreating } = useCreateHoliday({
    onSuccess: (res) => {
      toast.success(res?.message || t("holidays.messages.created", "Holiday created successfully."));
      closeFormModal();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || t("holidays.messages.createFailed", "Failed to create holiday."));
    },
  });

  const { mutate: doUpdateHoliday, isPending: isUpdating } = useUpdateHoliday({
    onSuccess: (res) => {
      toast.success(res?.message || t("holidays.messages.updated", "Holiday updated successfully."));
      closeFormModal();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || t("holidays.messages.updateFailed", "Failed to update holiday."));
    },
  });

  const { mutate: doDeleteHoliday, isPending: isDeleting } = useDeleteHoliday({
    onSuccess: (res) => {
      toast.success(res?.message || t("holidays.messages.deleted", "Holiday deleted successfully."));
      setDeleteConfirmId(null);
      setSelectedHolidayModal(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || t("holidays.messages.deleteFailed", "Failed to delete holiday."));
      setDeleteConfirmId(null);
    },
  });

  const validateForm = () => {
    if (!formData.name.trim()) { toast.error(t("holidays.messages.nameRequired", "Holiday name is required.")); return false; }
    if (!formData.start_date) { toast.error(t("holidays.messages.startRequired", "Start date is required.")); return false; }
    if (!formData.end_date) { toast.error(t("holidays.messages.endRequired", "End date is required.")); return false; }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error(t("holidays.messages.invalidDateRange", "End date cannot be earlier than start date.")); return false;
    }
    return true;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = {
      name: formData.name.trim(),
      start_date: formData.start_date,
      end_date: formData.end_date,
      description: formData.description.trim() || undefined,
      is_active: formData.is_active,
    };
    if (editingHoliday) {
      doUpdateHoliday({ id: editingHoliday.id, ...payload });
    } else {
      doCreateHoliday(payload);
    }
  };

  // Filtered list
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      // Search
      const matchesSearch =
        !searchTerm.trim() ||
        h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Year filter
      let matchesYear = true;
      if (selectedYear !== "all") {
        const startYear = parseDate(h.start_date)?.getFullYear();
        matchesYear = startYear === Number(selectedYear);
      }

      // Status filter
      let matchesStatus = true;
      if (selectedStatus === "active") {
        matchesStatus = h.is_active !== false;
      } else if (selectedStatus === "inactive") {
        matchesStatus = h.is_active === false;
      } else if (selectedStatus === "upcoming") {
        const start = parseDate(h.start_date);
        matchesStatus = start && start >= new Date();
      }

      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [holidays, searchTerm, selectedYear, selectedStatus]);

  // KPI Calculations
  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const total = holidays.length;
    const activeCount = holidays.filter((h) => h.is_active !== false).length;

    let totalDaysOff = 0;
    let longestHoliday = null;
    let maxDays = 0;
    let nextHoliday = null;
    let minDaysUntilNext = Infinity;

    holidays.forEach((h) => {
      const days = calculateDays(h.start_date, h.end_date);
      totalDaysOff += days;

      if (days > maxDays) {
        maxDays = days;
        longestHoliday = h;
      }

      const start = parseDate(h.start_date);
      if (start && start >= now) {
        const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil < minDaysUntilNext) {
          minDaysUntilNext = daysUntil;
          nextHoliday = { ...h, daysUntil };
        }
      }
    });

    return {
      total,
      activeCount,
      totalDaysOff,
      maxDays,
      longestHoliday,
      nextHoliday,
    };
  }, [holidays]);

  // Available Years
  const availableYears = useMemo(() => {
    const set = new Set();
    holidays.forEach((h) => {
      const y = parseDate(h.start_date)?.getFullYear();
      if (y) set.add(y);
    });
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [holidays]);

  // Calendar Days generator
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayIndex = firstDay.getDay(); // 0 = Sunday
    const totalDaysInMonth = lastDay.getDate();

    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const holidayMatch = holidays.find((h) => isDateInHoliday(d, h));
      days.push({
        day: i,
        isCurrentMonth: true,
        date: d,
        holiday: holidayMatch || null,
        isToday:
          d.getDate() === new Date().getDate() &&
          d.getMonth() === new Date().getMonth() &&
          d.getFullYear() === new Date().getFullYear(),
      });
    }

    // Next month padding to fill full 6 weeks grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return days;
  }, [calendarMonth, holidays]);

  // Breadcrumb Title based on role
  const portalName = useMemo(() => {
    if (currentRole === "owner" || currentRole === "admin") return t("holidays.breadcrumb.admin", "Admin Portal / Holidays & Seasons");
    if (currentRole === "hr") return t("holidays.breadcrumb.hr", "HR / Holidays & Seasons");
    if (currentRole === "manager") return t("holidays.breadcrumb.manager", "Manager Portal / Official Holidays");
    return t("holidays.breadcrumb.employee", "Employee Portal / Official Holidays");
  }, [currentRole, t]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 pb-12 font-sans"
    >
      {/* ── 1. HEADER ──────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b879f]">
            {portalName}
          </p>
          <h1 className="mt-1 text-xl md:text-2xl font-bold text-[#1e293b] tracking-tight flex items-center gap-2.5">
            <MdCelebration className="h-6 w-6 text-amber-500 shrink-0" />
            {t("holidays.title", "Company Holidays & Seasons")}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-[#64748b]">
            {t(
              "holidays.subtitle",
              "Official company holidays, seasonal peak events, and scheduled closures.",
            )}
          </p>
        </div>

        {isManagement && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              title={t("holidays.refreshTitle", "Refresh holidays")}
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t("common.refresh", "Refresh")}</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1c364f] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#24425f]"
            >
              <FiPlus className="h-4 w-4" />
              <span>{t("holidays.scheduleHoliday", "Schedule Holiday")}</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* ── 2. KPI CARDS GRID ───────────────────── */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Holidays */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MdEventAvailable className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("holidays.stats.total", "Total Holidays")}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.activeCount} {t("holidays.stats.active", "active this year")}
            </p>
          </div>
        </div>

        {/* Next Upcoming */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <FiSun className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              {t("holidays.stats.nextUpcoming", "Next Holiday")}
            </p>
            <p className="text-base font-bold text-slate-900 truncate mt-0.5">
              {stats.nextHoliday ? translateHolidayName(stats.nextHoliday.name) : "—"}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              {stats.nextHoliday
                ? stats.nextHoliday.daysUntil === 0
                  ? t("holidays.today", "Today!")
                  : t("holidays.inDays", { count: stats.nextHoliday.daysUntil, defaultValue: `In ${stats.nextHoliday.daysUntil} days` })
                : t("holidays.noUpcoming", "No upcoming holidays")}
            </p>
          </div>
        </div>

        {/* Total Days Off */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <MdDateRange className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("holidays.stats.daysOff", "Total Days Off")}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.totalDaysOff} <span className="text-xs font-medium text-slate-400">{t("holidays.days", "days")}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t("holidays.officialCompanyLeave", "Official company leave")}</p>
          </div>
        </div>

        {/* Longest Holiday */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <FiTag className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("holidays.stats.longest", "Longest Break")}
            </p>
            <p className="text-base font-bold text-slate-900 truncate mt-0.5">
              {stats.longestHoliday ? translateHolidayName(stats.longestHoliday.name) : "—"}
            </p>
            <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
              {stats.maxDays > 0 ? t("holidays.consecutiveDays", { count: stats.maxDays, defaultValue: `${stats.maxDays} consecutive days` }) : "—"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── 3. PEAK ALERT BANNER ────────────────── */}
      {stats.nextHoliday && (
        <motion.div
          variants={itemVariants}
          className="flex items-start gap-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-xs">
            <FiAlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-950">
              {t("holidays.peakAlert.title", "Upcoming Holiday Notice")}: {translateHolidayName(stats.nextHoliday.name)}
            </p>
            <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
              {t("holidays.peakAlert.dates", "Scheduled from")}{" "}
              <span className="font-semibold">{formatDate(stats.nextHoliday.start_date, i18n.language)}</span>{" "}
              {t("holidays.peakAlert.to", "to")}{" "}
              <span className="font-semibold">
                {formatDate(stats.nextHoliday.end_date || stats.nextHoliday.start_date, i18n.language)}
              </span>
              . {t("holidays.peakAlert.hint", "Please plan shift coverages and project deadlines accordingly.")}
            </p>
          </div>
        </motion.div>
      )}

      {/* ── 4. SEARCH & FILTER TOOLBAR ──────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("holidays.searchPlaceholder", "Search holidays by name or description...")}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs text-slate-700 outline-none transition focus:border-[#1c364f] focus:bg-white focus:ring-2 focus:ring-[#1c364f]/10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
              {t("holidays.year", "Year")}:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#1c364f]"
            >
              <option value="all">{t("holidays.allYears", "All Years")}</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#1c364f]"
          >
            <option value="all">{t("holidays.allStatus", "All Status")}</option>
            <option value="upcoming">{t("holidays.upcomingOnly", "Upcoming Only")}</option>
            <option value="active">{t("holidays.activeOnly", "Active Official")}</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 self-end lg:self-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewMode === "list"
                ? "bg-white text-[#1c364f] shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FiList className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("holidays.views.list", "List")}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewMode === "grid"
                ? "bg-white text-[#1c364f] shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FiGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("holidays.views.grid", "Cards")}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewMode === "calendar"
                ? "bg-white text-[#1c364f] shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FiCalendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("holidays.views.calendar", "Calendar")}</span>
          </button>
        </div>
      </motion.div>

      {/* ── 5. CONTENT SECTION ──────────────────── */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-[#1c364f] border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-500">
            {t("holidays.loading", "Loading company holidays from server...")}
          </p>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
            <FiAlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-red-900">
            {t("holidays.errorTitle", "Unable to Load Holidays")}
          </h3>
          <p className="mt-1 text-xs text-red-700">
            {error?.response?.data?.message || error?.message || "Failed to fetch holidays from /api/holidays."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 shadow-sm"
          >
            <FiRefreshCw className="h-3.5 w-3.5" />
            {t("common.retry", "Try Again")}
          </button>
        </div>
      ) : filteredHolidays.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FiCalendar className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800">
            {t("holidays.noHolidays", "No holidays match your criteria")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchTerm || selectedYear !== "all" || selectedStatus !== "all"
              ? "Try adjusting your search terms or filters."
              : "No company holidays have been scheduled yet."}
          </p>
          {(searchTerm || selectedYear !== "all" || selectedStatus !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedYear("all");
                setSelectedStatus("all");
              }}
              className="mt-4 text-xs font-bold text-[#1c364f] underline underline-offset-2 hover:text-[#24425f]"
            >
              {t("common.resetFilters", "Reset Filters")}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── LIST VIEW (Table) ──────────────── */}
          {viewMode === "list" && (
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-start text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-5 text-start">{t("holidays.table.holidayName", "Holiday Name")}</th>
                      <th className="py-3.5 px-4 text-start">{t("holidays.table.dateRange", "Date Range")}</th>
                      <th className="py-3.5 px-4 text-start">{t("holidays.table.totalDays", "Total Days")}</th>
                      <th className="py-3.5 px-4 text-start">{t("holidays.table.description", "Description")}</th>
                      <th className="py-3.5 px-4 text-start">{t("holidays.table.status", "Status")}</th>
                      <th className="py-3.5 px-5 text-end">{t("common.action", "Details")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHolidays.map((holiday) => {
                      const daysCount = calculateDays(holiday.start_date, holiday.end_date);
                      const isUpcoming = parseDate(holiday.start_date) && parseDate(holiday.start_date) >= new Date();

                      return (
                        <tr
                          key={holiday.id || holiday.name}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold text-xs">
                                <MdCelebration className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate text-sm">
                                  {translateHolidayName(holiday.name)}
                                </p>
                                {isUpcoming && (
                                  <span className="inline-block text-[10px] font-semibold text-emerald-600">
                                    {t("holidays.upcoming", "Upcoming")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <FiCalendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>
                                {formatDate(holiday.start_date, i18n.language)}
                                {holiday.end_date && holiday.end_date !== holiday.start_date && (
                                  <> – {formatDate(holiday.end_date, i18n.language)}</>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                              <FiClock className="h-3 w-3" />
                              {daysCount} {daysCount === 1 ? "day" : "days"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-500 max-w-[260px] truncate">
                            {translateHolidayDescription(holiday.description) || "—"}
                          </td>
                          <td className="py-4 px-4">
                            {holiday.is_active !== false ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {t("holidays.status.active", "Official Leave")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                {t("holidays.status.inactive", "Inactive")}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-end">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedHolidayModal(holiday)}
                                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                              >
                                <FiInfo className="h-3.5 w-3.5" />
                                View
                              </button>
                              {isManagement && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(holiday)}
                                    className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-xs"
                                  >
                                    <FiEdit2 className="h-3.5 w-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(holiday.id)}
                                    className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition shadow-xs"
                                  >
                                    <FiTrash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── GRID / CARDS VIEW ──────────────── */}
          {viewMode === "grid" && (
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredHolidays.map((holiday) => {
                const daysCount = calculateDays(holiday.start_date, holiday.end_date);
                const isUpcoming = parseDate(holiday.start_date) && parseDate(holiday.start_date) >= new Date();

                return (
                  <div
                    key={holiday.id || holiday.name}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-slate-300"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                          <MdCelebration className="h-5 w-5" />
                        </div>
                        {holiday.is_active !== false ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {t("holidays.official", "Official")}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            {t("holidays.status.inactive", "Inactive")}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-base font-bold text-slate-900 tracking-tight">
                        {translateHolidayName(holiday.name)}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {translateHolidayDescription(holiday.description) || t("holidays.officialScheduledHoliday", "Official scheduled company holiday.")}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between">
                      <div className="text-xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("holidays.table.dateRange", "Date Range")}</p>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {formatDate(holiday.start_date, i18n.language)}
                          {holiday.end_date && holiday.end_date !== holiday.start_date && (
                            <> - {formatDate(holiday.end_date, i18n.language)}</>
                          )}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 shrink-0">
                        <FiClock className="h-3 w-3" />
                        {daysCount}d
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ── CALENDAR VIEW ─────────────────── */}
          {viewMode === "calendar" && (
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
            >
              {/* Month Switcher Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FiCalendar className="h-5 w-5 text-blue-600" />
                    {calendarMonth.toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t("holidays.calendarSubtitle", "Official holiday calendar coverage")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date())}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Day of week header */}
              <div className="grid grid-cols-7 gap-1 text-center py-3 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 pt-2">
                {calendarDays.map((cell, idx) => {
                  const hasHoliday = Boolean(cell.holiday);

                  return (
                    <div
                      key={idx}
                      onClick={() => cell.holiday && setSelectedHolidayModal(cell.holiday)}
                      className={`min-h-[80px] sm:min-h-[96px] p-2 rounded-xl border transition flex flex-col justify-between ${
                        !cell.isCurrentMonth
                          ? "bg-slate-50/40 text-slate-300 border-transparent"
                          : hasHoliday
                            ? "bg-amber-50/70 border-amber-200 text-amber-900 cursor-pointer hover:bg-amber-100/80 shadow-xs"
                            : cell.isToday
                              ? "bg-blue-50/40 border-blue-200 text-blue-900"
                              : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            cell.isToday
                              ? "flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]"
                              : ""
                          }`}
                        >
                          {cell.day}
                        </span>
                        {hasHoliday && (
                          <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                      </div>

                      {hasHoliday && (
                        <div className="mt-1">
                          <p className="text-[10px] font-bold text-amber-900 truncate leading-tight">
                            {translateHolidayName(cell.holiday.name)}
                          </p>
                          <span className="inline-block mt-0.5 rounded bg-amber-200/70 px-1 py-0.2 text-[9px] font-semibold text-amber-800">
                            Holiday
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ── 6. DETAIL MODAL ─────────────────────── */}
      <AnimatePresence>
        {selectedHolidayModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHolidayModal(null)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <MdCelebration className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedHolidayModal.name}
                    </h3>
                    <p className="text-xs text-slate-500">{t("holidays.officialCompanyHoliday", "Official Company Holiday")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHolidayModal(null)}
                  className="rounded-lg text-slate-400 hover:text-slate-600 p-1"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-3.5 text-xs text-slate-700">
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Date Range
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatDate(selectedHolidayModal.start_date, i18n.language)}
                    {selectedHolidayModal.end_date &&
                      selectedHolidayModal.end_date !== selectedHolidayModal.start_date && (
                        <> – {formatDate(selectedHolidayModal.end_date, i18n.language)}</>
                      )}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Duration
                  </span>
                  <span className="font-bold text-blue-700">
                    {calculateDays(selectedHolidayModal.start_date, selectedHolidayModal.end_date)} Days Off
                  </span>
                </div>

                {selectedHolidayModal.description && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Description
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedHolidayModal.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between gap-2">
                {isManagement && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedHolidayModal)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(selectedHolidayModal.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedHolidayModal(null)}
                  className="rounded-xl bg-[#1c364f] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#24425f]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 7. CREATE / EDIT MODAL (HR / OWNER / ADMIN) ──── */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeFormModal}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1c364f]">
                    {editingHoliday ? t("holidays.modal.editTitle", "Edit Holiday") : t("holidays.scheduleHoliday", "Schedule Company Holiday")}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingHoliday
                      ? t("holidays.modal.editSubtitle", "Update the details for this official holiday.")
                      : t("holidays.modal.createSubtitle", "Plan official coverage and company closure dates.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="rounded-lg text-slate-400 hover:text-slate-600 p-1"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="mt-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {t("holidays.modal.holidayName", "Holiday Name")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder={t("holidays.modal.namePlaceholder", "e.g. Eid Al-Adha")}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {t("holidays.modal.startDate", "Start Date")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {t("holidays.modal.endDate", "End Date")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t("holidays.modal.descriptionOptional", "Description (Optional)")}</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                      placeholder={t("holidays.modal.descriptionPlaceholder", "Provide details about the official holiday...")}
                      className="w-full resize-none rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-[#1c364f] focus:ring-2 focus:ring-[#1c364f]/10"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 accent-[#1c364f]"
                    />
                    <label htmlFor="is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Mark as active official leave
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="rounded-xl bg-[#1c364f] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#24425f] disabled:opacity-60"
                  >
                    {isCreating || isUpdating ? t("common.saving", "Saving...") : editingHoliday ? t("holidays.modal.update", "Update Holiday") : t("holidays.modal.save", "Save Holiday")}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 8. DELETE CONFIRMATION MODAL ──── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-x-4 top-1/2 z-[60] mx-auto max-w-sm -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <FiTrash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t("holidays.modal.deleteTitle", "Delete Holiday")}</h3>
                  <p className="text-xs text-slate-500">{t("holidays.modal.deleteWarning", "This action cannot be undone.")}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 bg-red-50 rounded-xl p-3 border border-red-100">
                {t("holidays.modal.deleteConfirm", "Are you sure you want to delete this holiday? It will be permanently removed.")}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => doDeleteHoliday(deleteConfirmId)}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {isDeleting ? t("common.deleting", "Deleting...") : t("holidays.modal.confirmDelete", "Yes, Delete")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
