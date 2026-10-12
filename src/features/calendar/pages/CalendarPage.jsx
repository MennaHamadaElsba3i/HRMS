import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTag,
  FiArrowRight,
  FiRefreshCw,
  FiX,
  FiBriefcase,
  FiFlag,
  FiAward,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getCalendarEvents } from "../../../api/calendarApi";

// Event type meta styling and localization
const EVENT_TYPES = {
  leave: {
    key: "leave",
    en: "Leave",
    ar: "إجازة",
    color: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
    dot: "bg-[#10b981]",
    icon: FiBriefcase,
  },
  task_deadline: {
    key: "task_deadline",
    en: "Task Deadline",
    ar: "موعد تسليم مهمة",
    color: "bg-[#fffbeb] text-[#d97706] border-[#fde68a]",
    dot: "bg-[#f59e0b]",
    icon: FiAlertCircle,
  },
  holiday: {
    key: "holiday",
    en: "Official Holiday",
    ar: "عطلة رسمية",
    color: "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]",
    dot: "bg-[#8b5cf6]",
    icon: FiFlag,
  },
  company_event: {
    key: "company_event",
    en: "Company Event",
    ar: "فعالية الشركة",
    color: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]",
    dot: "bg-[#3b82f6]",
    icon: FiAward,
  },
};

const CalendarPage = ({ customRole }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isRtl = i18n.language?.startsWith("ar");

  // Determine current portal role
  const effectiveRole = useMemo(() => {
    if (customRole) return customRole.toLowerCase();
    if (location.pathname.startsWith("/admin")) return "admin";
    if (location.pathname.startsWith("/hr")) return "hr";
    if (location.pathname.startsWith("/manager")) return "manager";
    return "employee";
  }, [customRole, location.pathname]);

  // Current viewed month date object
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Calculate start and end date range for the current month view (including padding)
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Start of the calendar grid (could be previous month's days)
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const startDate = new Date(year, month, 1 - dayOfWeek);

    // End of the calendar grid (42 days total)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 41);

    const formatYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    return {
      from: formatYMD(startDate),
      to: formatYMD(endDate),
    };
  }, [currentDate]);

  // Fetch calendar events
  const fetchEvents = useCallback(
    async (isManual = false) => {
      try {
        if (isManual) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const lang = isRtl ? "ar" : "en";
        const response = await getCalendarEvents({
          from: dateRange.from,
          to: dateRange.to,
          lang,
        });

        if (response && response.success && Array.isArray(response.data)) {
          setEvents(response.data);
        } else if (Array.isArray(response?.data)) {
          setEvents(response.data);
        } else if (Array.isArray(response)) {
          setEvents(response);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error("Failed to fetch calendar events:", err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          (isRtl
            ? "تعذر تحميل أحداث التقويم"
            : "Failed to load calendar events");
        setError(msg);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [dateRange, isRtl]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().slice(0, 10));
  };

  // Build 42 grid cells
  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay(); // 0 = Sunday
    const startGrid = new Date(year, month, 1 - startingDay);

    const todayStr = new Date().toISOString().slice(0, 10);
    const cells = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(startGrid);
      d.setDate(startGrid.getDate() + i);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;

      const isCurrentMonth = d.getMonth() === month;
      const isToday = dateStr === todayStr;

      // Find events matching this date
      const dayEvents = events.filter((ev) => {
        const matchesDate = ev.date === dateStr;
        const matchesFilter =
          activeFilter === "all" || ev.type === activeFilter;
        return matchesDate && matchesFilter;
      });

      cells.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth,
        isToday,
        events: dayEvents,
      });
    }

    return cells;
  }, [currentDate, events, activeFilter]);

  // Event counts for current month
  const stats = useMemo(() => {
    const counts = {
      total: 0,
      leave: 0,
      task_deadline: 0,
      holiday: 0,
      company_event: 0,
    };
    events.forEach((ev) => {
      counts.total++;
      if (counts[ev.type] !== undefined) {
        counts[ev.type]++;
      }
    });
    return counts;
  }, [events]);

  // Selected day's events
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    const cell = calendarCells.find((c) => c.dateStr === selectedDate);
    return cell || null;
  }, [selectedDate, calendarCells]);

  // Formatted Month Header
  const monthTitle = useMemo(() => {
    return currentDate.toLocaleString(isRtl ? "ar-EG" : "en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate, isRtl]);

  // Day names header
  const weekDayNames = useMemo(() => {
    if (isRtl) {
      return ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    }
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  }, [isRtl]);

  // Navigation target for reference
  const handleReferenceClick = (eventItem) => {
    if (!eventItem) return;
    const prefix = effectiveRole === "admin" ? "/admin" : `/${effectiveRole}`;

    if (eventItem.type === "leave") {
      if (effectiveRole === "employee") {
        navigate("/employee/leaves");
      } else if (effectiveRole === "manager") {
        navigate("/manager/leave-approvals");
      } else {
        navigate(`${prefix}/leave-requests`);
      }
    } else if (eventItem.type === "task_deadline") {
      if (effectiveRole === "employee") {
        navigate("/employee/tasks");
      } else {
        navigate(`${prefix}/tasks`);
      }
    } else if (eventItem.type === "holiday") {
      navigate(`${prefix}/holidays`);
    } else if (eventItem.type === "company_event") {
      navigate(`${prefix}/events`);
    } else {
      toast.success(
        `${isRtl ? "مرجع الفعالية" : "Event reference"}: #${eventItem.reference}`
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full space-y-6"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* =========================
          Breadcrumb
      ========================= */}
      <div className="flex items-center gap-2 text-xs font-medium text-[#64748b]">
        <span>
          {effectiveRole === "admin"
            ? t("portal.adminPortal", "Admin Portal")
            : effectiveRole === "hr"
            ? t("portal.hrPortal", "HR Portal")
            : effectiveRole === "manager"
            ? t("portal.managerPortal", "Manager Portal")
            : t("portal.employeePortal", "Employee Portal")}
        </span>
        <FiChevronRight
          className={`w-3.5 h-3.5 text-[#94a3b8] ${isRtl ? "rotate-180" : ""}`}
        />
        <span className="text-[#334e68] font-semibold">
          {isRtl ? "تقويم الأعمال" : "Work Calendar"}
        </span>
      </div>

      {/* =========================
          Header & Navigation
      ========================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold text-[#1e293b] tracking-tight flex items-center gap-2.5">
            <FiCalendar className="w-7 h-7 text-[#243b53]" />
            <span>{isRtl ? "تقويم الشركة والمواعيد" : "Work & Events Calendar"}</span>
          </h1>
          <p className="text-sm text-[#64748b] mt-1 font-normal">
            {isRtl
              ? "استعراض موحد للإجازات، مواعيد تسليم المهام، العطلات الرسمية، وفعاليات الشركة."
              : "Unified schedule for leaves, task deadlines, company holidays, and corporate events."}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <motion.button
            type="button"
            onClick={() => fetchEvents(true)}
            disabled={loading || isRefreshing}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs sm:text-sm font-semibold text-[#1e293b] hover:bg-[#f8fafc] hover:border-[#cbd5e1] shadow-2xs transition disabled:opacity-50 cursor-pointer"
            title={isRtl ? "تحديث" : "Refresh"}
          >
            <FiRefreshCw
              className={`w-4 h-4 text-[#475569] ${
                isRefreshing ? "animate-spin text-[#3f7d5a]" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {isRtl ? "تحديث" : "Refresh"}
            </span>
          </motion.button>

          <button
            type="button"
            onClick={goToToday}
            className="px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs sm:text-sm font-semibold text-[#1e293b] hover:bg-[#f8fafc] transition shadow-2xs cursor-pointer"
          >
            {isRtl ? "اليوم" : "Today"}
          </button>

          <div className="inline-flex items-center bg-white border border-[#e2e8f0] rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition cursor-pointer"
              aria-label="Previous Month"
            >
              {isRtl ? (
                <FiChevronRight className="w-5 h-5" />
              ) : (
                <FiChevronLeft className="w-5 h-5" />
              )}
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-[#1e293b] min-w-[130px] text-center">
              {monthTitle}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition cursor-pointer"
              aria-label="Next Month"
            >
              {isRtl ? (
                <FiChevronLeft className="w-5 h-5" />
              ) : (
                <FiChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================
          Summary Cards / Filters
      ========================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* All */}
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`p-3.5 rounded-2xl border text-left rtl:text-right transition cursor-pointer ${
            activeFilter === "all"
              ? "bg-[#243b53] text-white border-[#243b53] shadow-sm"
              : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1] text-[#1e293b]"
          }`}
        >
          <div className="text-[11px] font-bold opacity-80 uppercase tracking-wider">
            {isRtl ? "جميع الأحداث" : "All Events"}
          </div>
          <div className="text-xl font-bold mt-1">{stats.total}</div>
        </button>

        {/* Leaves */}
        <button
          type="button"
          onClick={() => setActiveFilter("leave")}
          className={`p-3.5 rounded-2xl border text-left rtl:text-right transition cursor-pointer ${
            activeFilter === "leave"
              ? "bg-[#059669] text-white border-[#059669] shadow-sm"
              : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1] text-[#1e293b]"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-80 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>{isRtl ? "الإجازات" : "Leaves"}</span>
          </div>
          <div className="text-xl font-bold mt-1 text-[#059669] group-hover:text-inherit">
            <span className={activeFilter === "leave" ? "text-white" : ""}>
              {stats.leave}
            </span>
          </div>
        </button>

        {/* Task Deadlines */}
        <button
          type="button"
          onClick={() => setActiveFilter("task_deadline")}
          className={`p-3.5 rounded-2xl border text-left rtl:text-right transition cursor-pointer ${
            activeFilter === "task_deadline"
              ? "bg-[#d97706] text-white border-[#d97706] shadow-sm"
              : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1] text-[#1e293b]"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-80 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span>{isRtl ? "مواعيد التسليم" : "Deadlines"}</span>
          </div>
          <div className="text-xl font-bold mt-1 text-[#d97706]">
            <span className={activeFilter === "task_deadline" ? "text-white" : ""}>
              {stats.task_deadline}
            </span>
          </div>
        </button>

        {/* Holidays */}
        <button
          type="button"
          onClick={() => setActiveFilter("holiday")}
          className={`p-3.5 rounded-2xl border text-left rtl:text-right transition cursor-pointer ${
            activeFilter === "holiday"
              ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-sm"
              : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1] text-[#1e293b]"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-80 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
            <span>{isRtl ? "العطلات" : "Holidays"}</span>
          </div>
          <div className="text-xl font-bold mt-1 text-[#7c3aed]">
            <span className={activeFilter === "holiday" ? "text-white" : ""}>
              {stats.holiday}
            </span>
          </div>
        </button>

        {/* Company Events */}
        <button
          type="button"
          onClick={() => setActiveFilter("company_event")}
          className={`col-span-2 sm:col-span-1 p-3.5 rounded-2xl border text-left rtl:text-right transition cursor-pointer ${
            activeFilter === "company_event"
              ? "bg-[#2563eb] text-white border-[#2563eb] shadow-sm"
              : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1] text-[#1e293b]"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-80 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span>{isRtl ? "الفعاليات" : "Events"}</span>
          </div>
          <div className="text-xl font-bold mt-1 text-[#2563eb]">
            <span className={activeFilter === "company_event" ? "text-white" : ""}>
              {stats.company_event}
            </span>
          </div>
        </button>
      </div>

      {/* =========================
          Main Calendar Grid
      ========================= */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Week Day Header */}
        <div className="grid grid-cols-7 border-b border-[#f1f5f9] bg-[#f8fafc] text-center text-xs font-bold text-[#64748b] py-3 uppercase tracking-wider">
          {weekDayNames.map((name) => (
            <div key={name}>{name}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#f1f5f9] rtl:divide-x-reverse min-h-[560px]">
          {calendarCells.map((cell) => {
            const isSelected = selectedDate === cell.dateStr;

            return (
              <div
                key={cell.dateStr}
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`min-h-[96px] p-2 flex flex-col justify-between transition cursor-pointer relative group ${
                  !cell.isCurrentMonth
                    ? "bg-[#fcfdfd]/60 text-[#cbd5e1]"
                    : "bg-white text-[#1e293b] hover:bg-[#f8fafc]/80"
                } ${
                  isSelected
                    ? "ring-2 ring-[#243b53] ring-inset bg-blue-50/20 z-10"
                    : ""
                }`}
              >
                {/* Cell Header: Day Number + Today Indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold w-6 h-6 rounded-full ${
                      cell.isToday
                        ? "bg-[#243b53] text-white shadow-2xs"
                        : cell.isCurrentMonth
                        ? "text-[#1e293b]"
                        : "text-[#94a3b8]"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.events.length > 0 && (
                    <span className="text-[10px] font-semibold text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.5 rounded-full">
                      {cell.events.length}
                    </span>
                  )}
                </div>

                {/* Event Pills */}
                <div className="space-y-1 mt-1.5 overflow-hidden">
                  {cell.events.slice(0, 3).map((ev, idx) => {
                    const meta = EVENT_TYPES[ev.type] || EVENT_TYPES.leave;
                    return (
                      <div
                        key={`${ev.date}-${ev.type}-${ev.reference}-${idx}`}
                        className={`truncate text-[10px] font-semibold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${meta.color}`}
                        title={`${isRtl ? meta.ar : meta.en} (#${ev.reference})`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
                        <span className="truncate">
                          {isRtl ? meta.ar : meta.en} #{ev.reference}
                        </span>
                      </div>
                    );
                  })}

                  {cell.events.length > 3 && (
                    <div className="text-[9px] font-bold text-[#64748b] px-1">
                      +{cell.events.length - 3} {isRtl ? "المزيد" : "more"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================
          Selected Date Drawer / Event Details
      ========================= */}
      <AnimatePresence>
        {selectedDayData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white rounded-2xl p-6 border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center font-bold text-sm">
                  {selectedDayData.dayNumber}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1e293b]">
                    {selectedDayData.date.toLocaleDateString(
                      isRtl ? "ar-EG" : "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </h3>
                  <p className="text-xs text-[#64748b]">
                    {selectedDayData.events.length}{" "}
                    {isRtl ? "أحداث مسجلة في هذا اليوم" : "scheduled events"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="p-1.5 text-[#94a3b8] hover:text-[#1e293b] rounded-lg hover:bg-[#f1f5f9] transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {selectedDayData.events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {selectedDayData.events.map((ev, idx) => {
                  const meta = EVENT_TYPES[ev.type] || EVENT_TYPES.leave;
                  const Icon = meta.icon;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${meta.color}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-bold">
                            {isRtl ? meta.ar : meta.en}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold bg-white/70 px-2 py-0.5 rounded-full border">
                          #{ev.reference}
                        </span>
                      </div>

                      <div className="text-xs text-[#475569] flex items-center justify-between pt-1">
                        <span>{ev.date}</span>
                        <button
                          type="button"
                          onClick={() => handleReferenceClick(ev)}
                          className="inline-flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                        >
                          <span>{isRtl ? "عرض السجل" : "View Record"}</span>
                          <FiArrowRight
                            className={`w-3.5 h-3.5 ${isRtl ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#94a3b8]">
                {isRtl
                  ? "لا توجد أحداث مجدولة لهذا اليوم."
                  : "No scheduled events for this day."}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CalendarPage;
