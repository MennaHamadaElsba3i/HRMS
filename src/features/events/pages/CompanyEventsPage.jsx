import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FiCalendar,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiClock,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiList,
  FiGrid,
  FiChevronLeft,
  FiChevronRight,
  FiAward,
  FiMapPin,
  FiInfo,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import {
  useCompanyEvents,
  useCreateCompanyEvent,
  useUpdateCompanyEvent,
  useDeleteCompanyEvent,
} from "../../../hooks/useCompanyEvents";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function CompanyEventsPage({ customRole }) {
  const { t, i18n } = useTranslation();
  const { currentUser, role: authRole } = useAuth();
  const isRtl = i18n.language?.startsWith("ar");

  // Determine current role & management permissions
  const role = (
    customRole ||
    authRole ||
    currentUser?.role ||
    "employee"
  ).toLowerCase();

  const isManagement = role === "owner" || role === "admin" || role === "hr";

  // Data fetching
  const {
    data: eventsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCompanyEvents();

  const events = useMemo(() => {
    return Array.isArray(eventsData) ? eventsData : [];
  }, [eventsData]);

  // Mutations
  const createMutation = useCreateCompanyEvent({
    onSuccess: () => {
      toast.success(
        isRtl ? "تمت إضافة الفعالية بنجاح" : "Company event created successfully."
      );
      closeModal();
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        err.message ||
        (isRtl ? "فشل إنشاء الفعالية" : "Failed to create company event");
      toast.error(msg);
    },
  });

  const updateMutation = useUpdateCompanyEvent({
    onSuccess: () => {
      toast.success(
        isRtl ? "تم تحديث الفعالية بنجاح" : "Company event updated successfully."
      );
      closeModal();
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        err.message ||
        (isRtl ? "فشل تحديث الفعالية" : "Failed to update company event");
      toast.error(msg);
    },
  });

  const deleteMutation = useDeleteCompanyEvent({
    onSuccess: () => {
      toast.success(
        isRtl ? "تم حذف الفعالية بنجاح" : "Company event deleted successfully."
      );
      setDeleteConfirmId(null);
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        err.message ||
        (isRtl ? "فشل حذف الفعالية" : "Failed to delete company event");
      toast.error(msg);
    },
  });

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"
  const [timeFilter, setTimeFilter] = useState("all"); // "all" | "upcoming" | "past"
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list" | "calendar"

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [detailsModalEvent, setDetailsModalEvent] = useState(null);

  // Form State
  const emptyForm = {
    name: "",
    start_date: "",
    end_date: "",
    description: "",
    is_active: true,
  };
  const [formData, setFormData] = useState(emptyForm);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData(emptyForm);
    setIsFormModalOpen(true);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    setFormData({
      name: ev.name || "",
      start_date: ev.start_date || "",
      end_date: ev.end_date || "",
      description: ev.description || "",
      is_active: ev.is_active !== false,
    });
    setIsFormModalOpen(true);
  };

  const closeModal = () => {
    setIsFormModalOpen(false);
    setEditingEvent(null);
    setFormData(emptyForm);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
      toast.error(
        isRtl
          ? "يرجى تعبئة الحقول المطلوبة (الاسم وتواريخ البداية والنهاية)"
          : "Please fill in all required fields."
      );
      return;
    }

    if (formData.start_date > formData.end_date) {
      toast.error(
        isRtl
          ? "تاريخ النهاية يجب أن يكون مساوياً أو بعد تاريخ البداية"
          : "End date must be greater than or equal to start date."
      );
      return;
    }

    if (editingEvent) {
      updateMutation.mutate({
        id: editingEvent.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Helper date calculations
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const getEventTimeStatus = (ev) => {
    if (!ev.start_date) return "unknown";
    if (ev.end_date < todayStr) return "past";
    if (ev.start_date > todayStr) return "upcoming";
    return "ongoing"; // current
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let total = events.length;
    let active = 0;
    let upcoming = 0;
    let ongoing = 0;
    let past = 0;

    events.forEach((ev) => {
      if (ev.is_active) active++;
      const timeStat = getEventTimeStatus(ev);
      if (timeStat === "upcoming") upcoming++;
      else if (timeStat === "ongoing") ongoing++;
      else if (timeStat === "past") past++;
    });

    return { total, active, upcoming, ongoing, past };
  }, [events, todayStr]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        (ev.name && ev.name.toLowerCase().includes(search)) ||
        (ev.description && ev.description.toLowerCase().includes(search)) ||
        (ev.creator?.name && ev.creator.name.toLowerCase().includes(search));

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && ev.is_active) ||
        (statusFilter === "inactive" && !ev.is_active);

      // Time filter
      const timeStat = getEventTimeStatus(ev);
      const matchesTime =
        timeFilter === "all" ||
        (timeFilter === "upcoming" && (timeStat === "upcoming" || timeStat === "ongoing")) ||
        (timeFilter === "past" && timeStat === "past");

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [events, searchTerm, statusFilter, timeFilter, todayStr]);

  // Calendar view days
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = Sunday
    const startGrid = new Date(year, month, 1 - dayOfWeek);

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

      // Check if any event overlaps with this date
      const dayEvents = events.filter((ev) => {
        if (!ev.start_date) return false;
        const end = ev.end_date || ev.start_date;
        return ev.start_date <= dateStr && end >= dateStr;
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
  }, [calendarMonth, events, todayStr]);

  // Breadcrumb Title
  const portalName = useMemo(() => {
    if (role === "owner" || role === "admin")
      return isRtl ? "لوحة الإدارة / فعاليات الشركة" : "Admin Portal / Company Events";
    if (role === "hr")
      return isRtl ? "الموارد البشرية / فعاليات الشركة" : "HR Portal / Company Events";
    if (role === "manager")
      return isRtl ? "لوحة المدير / فعاليات الشركة" : "Manager Portal / Company Events";
    return isRtl ? "بوابة الموظف / فعاليات الشركة" : "Employee Portal / Company Events";
  }, [role, isRtl]);

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6"
      dir={isRtl ? "rtl" : "ltr"}
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
            <FiAward className="h-6 w-6 text-blue-600 shrink-0" />
            <span>{isRtl ? "فعاليات وأنشطة الشركة" : "Company Events & Activities"}</span>
          </h1>
          <p className="mt-1 text-xs md:text-sm text-[#64748b]">
            {isRtl
              ? "استعراض وتنظيم جميع اللقاءات السنوية، والورش، والفعاليات الرسمية للشركة."
              : "Discover and organize annual meetings, workshops, and official company events."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            title={isRtl ? "تحديث" : "Refresh"}
          >
            <FiRefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRtl ? "تحديث" : "Refresh"}</span>
          </button>

          {isManagement && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1c364f] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#24425f] cursor-pointer"
            >
              <FiPlus className="h-4 w-4" />
              <span>{isRtl ? "إضافة فعالية جديدة" : "Schedule Event"}</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* ── 2. KPI STATS CARDS ─────────────────── */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {/* Total Events */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiAward className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isRtl ? "إجمالي الفعاليات" : "Total Events"}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.active} {isRtl ? "مفعلة" : "active"}
            </p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FiCalendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isRtl ? "الفعاليات القادمة" : "Upcoming"}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.upcoming}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {stats.ongoing > 0
                ? `${stats.ongoing} ${isRtl ? "جارية الآن" : "happening now"}`
                : isRtl
                ? "مجدولة قريباً"
                : "Scheduled"}
            </p>
          </div>
        </div>

        {/* Ongoing / Today */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FiClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isRtl ? "الفعاليات الجارية" : "In Progress"}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.ongoing}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isRtl ? "تحدث اليوم" : "Today"}
            </p>
          </div>
        </div>

        {/* Past Events */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <FiCheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isRtl ? "الفعاليات المكتملة" : "Completed"}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.past}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isRtl ? "منتهية" : "Past events"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── 3. TOOLBAR & FILTERS ────────────────── */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <FiSearch
              className={`absolute top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 ${
                isRtl ? "right-3.5" : "left-3.5"
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isRtl
                  ? "البحث في الفعاليات بالاسم أو الوصف..."
                  : "Search events by title or description..."
              }
              className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#1c364f] focus:outline-none transition ${
                isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
              }`}
            />
          </div>

          {/* Filters & View Switches */}
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:border-[#1c364f]"
            >
              <option value="all">{isRtl ? "جميع الحالات" : "All Statuses"}</option>
              <option value="active">{isRtl ? "المفعلة فقط" : "Active Only"}</option>
              <option value="inactive">{isRtl ? "المعطلة" : "Inactive"}</option>
            </select>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:border-[#1c364f]"
            >
              <option value="all">{isRtl ? "جميع المواعيد" : "All Dates"}</option>
              <option value="upcoming">{isRtl ? "القادمة والجارية" : "Upcoming & Current"}</option>
              <option value="past">{isRtl ? "المنتهية" : "Past Events"}</option>
            </select>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Grid View"
              >
                <FiGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="List View"
              >
                <FiList className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Calendar View"
              >
                <FiCalendar className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4. CONTENT VIEWS ────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center text-xs text-red-600">
          <FiAlertCircle className="mx-auto h-8 w-8 mb-2 text-red-500" />
          <p className="font-semibold text-sm">
            {error?.response?.data?.message || error?.message || "Failed to load events"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
          >
            {isRtl ? "إعادة المحاولة" : "Try Again"}
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FiAward className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">
            {isRtl ? "لم يتم العثور على أي فعاليات" : "No company events found"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isRtl
              ? "لا توجد فعاليات مطابقة لشروط البحث أو الفلترة المحددة."
              : "No events match your current filter or search criteria."}
          </p>
          {isManagement && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1c364f] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#24425f] transition cursor-pointer"
            >
              <FiPlus className="h-4 w-4" />
              <span>{isRtl ? "إضافة أول فعالية" : "Create First Event"}</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── GRID VIEW ───────────────────────── */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((ev) => {
                const timeStatus = getEventTimeStatus(ev);
                const isOngoing = timeStatus === "ongoing";
                const isUpcoming = timeStatus === "upcoming";

                return (
                  <motion.div
                    key={ev.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-blue-200 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isOngoing
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : isUpcoming
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOngoing
                                ? "bg-amber-500 animate-pulse"
                                : isUpcoming
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          <span>
                            {isOngoing
                              ? isRtl
                                ? "جارية الآن"
                                : "Happening Now"
                              : isUpcoming
                              ? isRtl
                                ? "قادمة"
                                : "Upcoming"
                              : isRtl
                              ? "منتهية"
                              : "Past"}
                          </span>
                        </span>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            ev.is_active
                              ? "bg-blue-50 text-blue-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {ev.is_active
                            ? isRtl
                              ? "مفعلة"
                              : "Active"
                            : isRtl
                            ? "معطلة"
                            : "Inactive"}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h3
                        onClick={() => setDetailsModalEvent(ev)}
                        className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition cursor-pointer line-clamp-1"
                      >
                        {ev.name}
                      </h3>

                      {/* Date Range */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                        <FiCalendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>
                          {formatDateDisplay(ev.start_date)}
                          {ev.end_date && ev.end_date !== ev.start_date && (
                            <> → {formatDateDisplay(ev.end_date)}</>
                          )}
                        </span>
                      </div>

                      {/* Description */}
                      {ev.description && (
                        <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1 truncate max-w-[150px]">
                        <FiUser className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {ev.creator?.name || (isRtl ? "الإدارة" : "Admin")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailsModalEvent(ev)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                          title={isRtl ? "تفاصيل" : "Details"}
                        >
                          <FiInfo className="w-3.5 h-3.5" />
                        </button>

                        {isManagement && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(ev)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title={isRtl ? "تعديل" : "Edit"}
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(ev.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title={isRtl ? "حذف" : "Delete"}
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── LIST VIEW ───────────────────────── */}
          {viewMode === "list" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">{isRtl ? "الفعالية" : "Event Title"}</th>
                      <th className="py-3 px-4">{isRtl ? "تاريخ البداية" : "Start Date"}</th>
                      <th className="py-3 px-4">{isRtl ? "تاريخ النهاية" : "End Date"}</th>
                      <th className="py-3 px-4">{isRtl ? "الحالة" : "Status"}</th>
                      <th className="py-3 px-4">{isRtl ? "المنشئ" : "Created By"}</th>
                      <th className="py-3 px-4 text-center">{isRtl ? "الإجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredEvents.map((ev) => (
                      <tr
                        key={ev.id}
                        className="hover:bg-slate-50/80 transition group"
                      >
                        <td className="py-3 px-4 font-mono text-slate-400">
                          #{ev.id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <button
                            type="button"
                            onClick={() => setDetailsModalEvent(ev)}
                            className="text-left rtl:text-right hover:text-blue-600 transition cursor-pointer font-bold"
                          >
                            {ev.name}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {formatDateDisplay(ev.start_date)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {formatDateDisplay(ev.end_date)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              ev.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ev.is_active ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {ev.is_active ? (isRtl ? "مفعلة" : "Active") : (isRtl ? "معطلة" : "Inactive")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {ev.creator?.name || "—"}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailsModalEvent(ev)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                              title={isRtl ? "تفاصيل" : "Details"}
                            >
                              <FiInfo className="w-3.5 h-3.5" />
                            </button>
                            {isManagement && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(ev)}
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                  title={isRtl ? "تعديل" : "Edit"}
                                >
                                  <FiEdit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(ev.id)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title={isRtl ? "حذف" : "Delete"}
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CALENDAR VIEW ───────────────────── */}
          {viewMode === "calendar" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              {/* Calendar Navigator */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FiAward className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-slate-900">
                    {calendarMonth.toLocaleDateString(
                      isRtl ? "ar-EG" : "en-US",
                      { month: "long", year: "numeric" }
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {isRtl ? <FiChevronRight /> : <FiChevronLeft />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date())}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {isRtl ? "اليوم" : "Today"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {isRtl ? <FiChevronLeft /> : <FiChevronRight />}
                  </button>
                </div>
              </div>

              {/* Day of week headers */}
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-xs font-bold text-slate-500 py-2.5">
                {(isRtl
                  ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
                  : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                ).map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 rtl:divide-x-reverse min-h-[500px]">
                {calendarDays.map((cell) => (
                  <div
                    key={cell.dateStr}
                    className={`min-h-[85px] p-1.5 flex flex-col justify-between transition ${
                      !cell.isCurrentMonth
                        ? "bg-slate-50/40 text-slate-300"
                        : "bg-white text-slate-800"
                    } ${cell.isToday ? "bg-blue-50/20" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                          cell.isToday
                            ? "bg-blue-600 text-white"
                            : cell.isCurrentMonth
                            ? "text-slate-800"
                            : "text-slate-300"
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                    </div>

                    <div className="space-y-1 mt-1 overflow-hidden">
                      {cell.events.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setDetailsModalEvent(ev)}
                          className="truncate text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer hover:bg-blue-100 transition"
                          title={ev.name}
                        >
                          {ev.name}
                        </div>
                      ))}
                      {cell.events.length > 2 && (
                        <span className="text-[9px] text-slate-400 font-semibold px-1">
                          +{cell.events.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── CREATE / EDIT MODAL ────────────────── */}
      <AnimatePresence>
        {isFormModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FiAward className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    {editingEvent
                      ? isRtl
                        ? "تعديل فعالية الشركة"
                        : "Edit Company Event"
                      : isRtl
                      ? "جدولة فعالية جديدة"
                      : "Schedule New Company Event"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                {/* Event Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? "اسم الفعالية *" : "Event Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={
                      isRtl
                        ? "مثال: الاجتماع السنوي للشركة"
                        : "e.g. Company Annual Meeting"
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-[#1c364f] focus:outline-none"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? "تاريخ البداية *" : "Start Date *"}
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-[#1c364f] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? "تاريخ النهاية *" : "End Date *"}
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-[#1c364f] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? "وصف الفعالية" : "Event Description"}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={
                      isRtl
                        ? "تفاصيل جدول الأعمال، المكان، أو الأهداف..."
                        : "Agenda, venue details, or objectives..."
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-[#1c364f] focus:outline-none"
                  />
                </div>

                {/* Is Active Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_active_checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                  />
                  <label
                    htmlFor="is_active_checkbox"
                    className="font-semibold text-slate-700 cursor-pointer select-none"
                  >
                    {isRtl ? "فعالية نشطة (Active)" : "Active Event"}
                  </label>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-[#1c364f] font-bold text-white hover:bg-[#24425f] transition disabled:opacity-50 cursor-pointer"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? isRtl
                        ? "جاري الحفظ..."
                        : "Saving..."
                      : editingEvent
                      ? isRtl
                        ? "تحديث الفعالية"
                        : "Save Changes"
                      : isRtl
                      ? "إنشاء الفعالية"
                      : "Create Event"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION MODAL ──────────── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirmId(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <FiTrash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isRtl ? "تأكيد حذف الفعالية" : "Delete Company Event"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isRtl
                    ? "هل أنت متأكد من رغبتك في حذف هذه الفعالية؟ لا يمكن التراجع عن هذا الإجراء."
                    : "Are you sure you want to delete this company event? This action cannot be undone."}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deleteConfirmId)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {deleteMutation.isPending
                    ? isRtl
                      ? "جاري الحذف..."
                      : "Deleting..."
                    : isRtl
                    ? "نعم، حذف"
                    : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DETAILS MODAL ──────────────────────── */}
      <AnimatePresence>
        {detailsModalEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailsModalEvent(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FiAward className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-mono font-bold text-slate-400">
                    #{detailsModalEvent.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsModalEvent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {detailsModalEvent.name}
                </h3>

                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      detailsModalEvent.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        detailsModalEvent.is_active ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <span>
                      {detailsModalEvent.is_active
                        ? isRtl
                          ? "مفعلة"
                          : "Active"
                        : isRtl
                        ? "معطلة"
                        : "Inactive"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isRtl ? "الفترة:" : "Period:"}</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateDisplay(detailsModalEvent.start_date)} →{" "}
                    {formatDateDisplay(detailsModalEvent.end_date)}
                  </span>
                </div>

                {detailsModalEvent.creator?.name && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isRtl ? "المنشئ:" : "Created By:"}</span>
                    <span className="font-semibold text-slate-800">
                      {detailsModalEvent.creator.name}
                    </span>
                  </div>
                )}
              </div>

              {detailsModalEvent.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? "الوصف والتفاصيل:" : "Description:"}
                  </h4>
                  <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {detailsModalEvent.description}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsModalEvent(null)}
                  className="px-4 py-2 bg-[#1c364f] text-white rounded-xl text-xs font-bold hover:bg-[#24425f] transition cursor-pointer"
                >
                  {isRtl ? "إغلاق" : "Close"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
