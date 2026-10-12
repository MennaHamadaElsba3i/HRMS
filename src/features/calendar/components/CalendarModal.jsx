import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiRefreshCw,
  FiArrowRight,
  FiBriefcase,
  FiAlertCircle,
  FiFlag,
  FiAward,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { getCalendarEvents } from "../../../api/calendarApi";

const EVENT_META = {
  leave: {
    en: "Leave",
    ar: "إجازة",
    color: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
    dot: "bg-[#10b981]",
    icon: FiBriefcase,
  },
  task_deadline: {
    en: "Deadline",
    ar: "موعد تسليم",
    color: "bg-[#fffbeb] text-[#d97706] border-[#fde68a]",
    dot: "bg-[#f59e0b]",
    icon: FiAlertCircle,
  },
  holiday: {
    en: "Holiday",
    ar: "عطلة",
    color: "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]",
    dot: "bg-[#8b5cf6]",
    icon: FiFlag,
  },
  company_event: {
    en: "Event",
    ar: "فعالية",
    color: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]",
    dot: "bg-[#3b82f6]",
    icon: FiAward,
  },
};

export default function CalendarModal({ isOpen, onClose, role = "employee" }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language?.startsWith("ar");

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calculate start & end date for the grid
  const range = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const start = new Date(year, month, 1 - dayOfWeek);

    const end = new Date(start);
    end.setDate(start.getDate() + 41);

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    return { from: fmt(start), to: fmt(end) };
  }, [currentDate]);

  // Fetch events
  const loadEvents = useCallback(async () => {
    if (!isOpen) return;
    try {
      setLoading(true);
      const lang = isRtl ? "ar" : "en";
      const res = await getCalendarEvents({
        from: range.from,
        to: range.to,
        lang,
      });

      if (res && res.success && Array.isArray(res.data)) {
        setEvents(res.data);
      } else if (Array.isArray(res?.data)) {
        setEvents(res.data);
      } else if (Array.isArray(res)) {
        setEvents(res);
      } else {
        setEvents([]);
      }
    } catch (e) {
      console.error("Error loading calendar modal events:", e);
    } finally {
      setLoading(false);
    }
  }, [isOpen, range, isRtl]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Days array
  const gridCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
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

      const dayEvents = events.filter((ev) => ev.date === dateStr);

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
  }, [currentDate, events]);

  const monthLabel = useMemo(() => {
    return currentDate.toLocaleString(isRtl ? "ar-EG" : "en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate, isRtl]);

  const weekHeaders = isRtl
    ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-[#e2e8f0] space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7eef5] text-[#243b53]">
                <FiCalendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#102a43]">
                  {isRtl ? "تقويم الأعمال والمواعيد" : "Work Calendar"}
                </h3>
                <p className="text-xs text-[#829ab1] mt-0.5">
                  {isRtl
                    ? "استعراض الإجازات ومواعيد المهام والعطلات"
                    : "Schedule of leaves, deadlines, and company events"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadEvents}
                disabled={loading}
                className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f8fafc] transition cursor-pointer"
                title={isRtl ? "تحديث" : "Refresh"}
              >
                <FiRefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-[#3f7d5a]" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                  )
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] transition cursor-pointer"
            >
              {isRtl ? (
                <FiChevronRight className="w-4 h-4" />
              ) : (
                <FiChevronLeft className="w-4 h-4" />
              )}
            </button>

            <div className="text-center">
              <h4 className="text-sm font-bold text-[#102a43]">{monthLabel}</h4>
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1
                  )
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] transition cursor-pointer"
            >
              {isRtl ? (
                <FiChevronLeft className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#94a3b8] py-2 border-b border-[#f1f5f9]">
            {weekHeaders.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {gridCells.map((cell) => {
              const isSelected = selectedDay?.dateStr === cell.dateStr;
              const hasEvents = cell.events.length > 0;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDay(cell)}
                  className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between transition cursor-pointer relative ${
                    !cell.isCurrentMonth
                      ? "text-[#cbd5e1] hover:bg-slate-50"
                      : "text-[#1e293b] hover:bg-[#f8fafc]"
                  } ${
                    cell.isToday
                      ? "bg-[#ecfdf5] font-bold text-[#059669] border border-[#a7f3d0]"
                      : ""
                  } ${
                    isSelected
                      ? "ring-2 ring-[#243b53] bg-blue-50/40"
                      : ""
                  }`}
                >
                  <span className="text-[11px]">{cell.dayNumber}</span>

                  {hasEvents && (
                    <div className="flex items-center gap-0.5 justify-center">
                      {cell.events.slice(0, 3).map((ev, i) => {
                        const meta = EVENT_META[ev.type] || EVENT_META.leave;
                        return (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                            title={`${isRtl ? meta.ar : meta.en} #${ev.reference}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Day Info */}
          {selectedDay && (
            <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-[#1e293b]">
                <span>
                  {selectedDay.date.toLocaleDateString(
                    isRtl ? "ar-EG" : "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    }
                  )}
                </span>
                <span className="text-[#64748b] text-[11px]">
                  {selectedDay.events.length}{" "}
                  {isRtl ? "أحداث" : "events"}
                </span>
              </div>

              {selectedDay.events.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedDay.events.map((ev, idx) => {
                    const meta = EVENT_META[ev.type] || EVENT_META.leave;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border flex items-center justify-between text-xs font-semibold ${meta.color}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                          <span>{isRtl ? meta.ar : meta.en}</span>
                        </div>
                        <span className="font-mono text-[11px]">
                          #{ev.reference}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#94a3b8] text-[11px]">
                  {isRtl ? "لا توجد أحداث في هذا التاريخ." : "No events on this date."}
                </p>
              )}
            </div>
          )}

          {/* Footer Legend & Full Calendar Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#f1f5f9] pt-4">
            <div className="flex items-center gap-3 text-[11px] text-[#64748b] flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                <span>{isRtl ? "إجازة" : "Leave"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                <span>{isRtl ? "تسليم مهمة" : "Deadline"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                <span>{isRtl ? "عطلة" : "Holiday"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                <span>{isRtl ? "فعالية" : "Event"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  const target =
                    role === "admin"
                      ? "/admin/calendar"
                      : role === "hr"
                      ? "/hr/calendar"
                      : role === "manager"
                      ? "/manager/calendar"
                      : "/employee/calendar";
                  navigate(target);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f6f4d] hover:underline cursor-pointer"
              >
                <span>{isRtl ? "عرض التقويم بالكامل" : "Full Calendar"}</span>
                <FiArrowRight
                  className={`w-3.5 h-3.5 ${isRtl ? "rotate-180" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[#102a43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1c364f] transition cursor-pointer"
              >
                {t("employee.home.close", "Close")}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
