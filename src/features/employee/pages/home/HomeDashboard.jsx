import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import {
  FiCalendar,
  FiMapPin,
  FiArrowRight,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiCheckSquare,
  FiClock,
  FiUploadCloud,
  FiCpu,
  FiBell,
  FiCheck,
} from "react-icons/fi";

import {
  useTodayAttendance,
  getCurrentLocation,
} from "../../hooks/useTodayAttendance";
import { checkIn, checkOut } from "../../api/attendanceApi";
import CalendarModal from "../../../calendar/components/CalendarModal";
import { getCalendarEvents } from "../../../../api/calendarApi";
import toast from "react-hot-toast";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const parseWorkedTime = (timeString) => {
  if (!timeString) {
    return 0;
  }

  const parts = timeString.split(":").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return 0;
  }

  const [hours, minutes, seconds] = parts;

  return hours * 3600 + minutes * 60 + seconds;
};

const formatTime = (totalSeconds) => {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);

  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");

  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );

  const seconds = String(safeSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

export default function HomeDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const {
    data: attendanceResponse,
    isLoading: attendanceLoading,
    isError: attendanceError,
    refetch: refetchAttendance,
  } = useTodayAttendance();

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [todayEvents, setTodayEvents] = useState([]);
  const [secondsWorked, setSecondsWorked] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const fetchTodayEvents = async () => {
      try {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const todayStr = `${y}-${m}-${d}`;
        const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

        const res = await getCalendarEvents({
          from: todayStr,
          to: todayStr,
          lang,
        });

        if (res && res.success && Array.isArray(res.data)) {
          setTodayEvents(res.data);
        } else if (Array.isArray(res?.data)) {
          setTodayEvents(res.data);
        } else if (Array.isArray(res)) {
          setTodayEvents(res);
        }
      } catch (err) {
        console.error("Error fetching today events:", err);
      }
    };

    fetchTodayEvents();
  }, [i18n.language]);

  const attendance = attendanceResponse?.data || attendanceResponse;
  const widgets = attendance?.widgets;

  const checkInTime = attendance?.check_in || attendance?.check_in_time || null;
  const checkOutTime =
    attendance?.check_out || attendance?.check_out_time || null;

  const hasCheckedIn = Boolean(checkInTime);
  const hasCheckedOut = Boolean(checkOutTime);

  const isOnShift = hasCheckedIn && !hasCheckedOut;
  const isCheckedIn = isOnShift;
  const isShiftFinished = hasCheckedIn && hasCheckedOut;

  const isCheckInDisabled = hasCheckedIn;
  const isCheckOutDisabled = !hasCheckedIn || hasCheckedOut;

  useEffect(() => {
    if (!attendance) {
      return;
    }

    const initialWorkedSeconds = parseWorkedTime(attendance.worked_time);

    setSecondsWorked(initialWorkedSeconds);
  }, [attendance?.worked_time, checkInTime, checkOutTime, attendance?.status]);

  useEffect(() => {
    if (!isOnShift) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsWorked((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOnShift]);

  const handleCheckIn = async () => {
    if (isCheckInDisabled || actionLoading) return;
    try {
      setActionLoading(true);
      setActionError("");

      const location = await getCurrentLocation({ required: true });

      await checkIn({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      await refetchAttendance();
    } catch (error) {
      console.error("Check-in failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to check in.";

      setActionError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (isCheckOutDisabled || actionLoading) return;
    try {
      setActionLoading(true);
      setActionError("");

      const location = await getCurrentLocation({ required: false });

      await checkOut({
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

      await refetchAttendance();
    } catch (error) {
      console.error("Check-out failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to check out.";

      setActionError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttendanceAction = () => {
    if (actionLoading) return;
    if (canCheckOut) {
      return handleCheckOut();
    }
    return handleCheckIn();
  };

  const distanceText =
    attendance?.distance_meters !== null &&
    attendance?.distance_meters !== undefined
      ? `${Number(attendance.distance_meters).toFixed(0)}m from office`
      : "Location unavailable";

  const locationStatus = attendance?.is_inside_radius
    ? t(
        "employee.home.insideRadius",
        `Inside workplace radius · ${distanceText}`,
      )
    : t(
        "employee.home.outsideRadius",
        `Outside workplace radius · ${distanceText}`,
      );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 pb-12 font-sans"
    >
      {/* 1. Welcome Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#5b8c6a] uppercase mb-1">
            {t("employee.home.date", "MONDAY, JUNE 9, 2026")}
          </p>

          <h1 className="text-2xl md:text-[28px] font-bold text-[#102a43] tracking-tight">
            {t("employee.home.welcome", {
              defaultValue: "Good morning, {{name}}",
              name: currentUser?.name || "",
            })}
          </h1>

          <p className="text-sm text-[#829ab1] mt-1 font-normal">
            {t("employee.home.subtitle", "Here's your workday at a glance.")}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => setShowCalendarModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-4 py-2.5 text-xs font-semibold text-[#102a43] hover:bg-[#f8fafc] transition shadow-sm shrink-0 self-start sm:self-auto"
        >
          <FiCalendar className="w-4 h-4 text-[#64748b]" />

          {t("employee.home.viewCalendar", "View calendar")}
        </motion.button>
      </motion.div>

      {/* 2. Check-in / Check-out Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-[#1b344d] p-7 md:p-8 text-white shadow-sm"
      >
        <div className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full border border-white/[0.08]" />

        <div className="pointer-events-none absolute right-16 -top-16 h-[320px] w-[320px] rounded-full border border-white/[0.05]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3.5">
            {attendanceLoading ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                  Loading attendance...
                </div>

                <div>
                  <h2 className="text-2xl md:text-[26px] font-bold text-white tracking-tight">
                    Loading your attendance
                  </h2>

                  <p className="text-xs text-white/70 mt-1">Please wait...</p>
                </div>
              </>
            ) : attendanceError ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                  Attendance unavailable
                </div>

                <div>
                  <h2 className="text-2xl md:text-[26px] font-bold text-white tracking-tight">
                    Unable to load attendance
                  </h2>

                  <p className="text-xs text-white/70 mt-1">
                    Please refresh and try again.
                  </p>
                </div>
              </>
            ) : isCheckedIn ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#163f30] px-3 py-1 text-xs font-medium text-[#4ade80]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75" />

                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]" />
                  </span>

                  <span>
                    {attendance?.status ||
                      t("employee.home.onShift", "On Shift")}
                  </span>

                  <span className="text-white/40">•</span>

                  <span className="text-white/80">
                    {t("employee.home.location", "Workplace")}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl md:text-[26px] font-bold text-white tracking-tight">
                    {t("employee.home.checkedIn", "You're checked in")}
                  </h2>

                  <p className="text-xs text-white/70 mt-1">
                    {t("employee.home.checkedInAt", "Checked in at")}{" "}
                    {checkInTime || "--"}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-white/80">
                  <FiMapPin
                    className={`w-3.5 h-3.5 ${
                      attendance?.is_inside_radius
                        ? "text-[#4ade80]"
                        : "text-red-400"
                    }`}
                  />

                  <span>{locationStatus}</span>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />

                  <span>
                    {attendance?.status ||
                      t("employee.home.offShift", "Off Shift")}
                  </span>

                  <span className="text-white/40">•</span>

                  <span className="text-white/80">
                    {t("employee.home.location", "Workplace")}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl md:text-[26px] font-bold text-white tracking-tight">
                    {checkOutTime
                      ? t("employee.home.checkedOut", "You're checked out")
                      : t(
                          "employee.home.notCheckedIn",
                          "You're not checked in",
                        )}
                  </h2>

                  <p className="text-xs text-white/70 mt-1">
                    {checkOutTime
                      ? `${t(
                          "employee.home.checkedOutAt",
                          "Checked out at",
                        )} ${checkOutTime}`
                      : t(
                          "employee.home.checkInFromWorkplace",
                          "Check in from your designated workplace",
                        )}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-white/80">
                  <FiMapPin className="w-3.5 h-3.5 text-slate-400" />

                  <span>
                    {attendance?.distance_meters !== null &&
                    attendance?.distance_meters !== undefined
                      ? distanceText
                      : t(
                          "employee.home.locationUnavailable",
                          "Location unavailable",
                        )}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            <span className="text-[11px] font-bold tracking-widest text-white/50 uppercase">
              {t("employee.home.workedToday", "WORKED TODAY")}
            </span>

            <div className="font-mono text-3xl md:text-[34px] font-bold tracking-tight text-white">
              {attendanceLoading ? "--:--:--" : formatTime(secondsWorked)}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Check In Button */}
              <motion.button
                whileHover={!isCheckInDisabled ? { scale: 1.02 } : {}}
                whileTap={!isCheckInDisabled ? { scale: 0.98 } : {}}
                type="button"
                onClick={handleCheckIn}
                disabled={isCheckInDisabled || actionLoading}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                  isCheckInDisabled
                    ? "bg-white/15 text-white/50 border border-white/10 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                }`}
              >
                {actionLoading && !hasCheckedIn ? (
                  <span>{t("attendance.loading", "Please wait...")}</span>
                ) : hasCheckedIn ? (
                  <>
                    <FiCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>
                      {t("attendance.checkedIn", "Checked In")}
                      {checkInTime ? ` (${checkInTime})` : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span>{t("employee.home.checkIn", "Check in")}</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </motion.button>

              {/* Check Out Button */}
              <motion.button
                whileHover={!isCheckOutDisabled ? { scale: 1.02 } : {}}
                whileTap={!isCheckOutDisabled ? { scale: 0.98 } : {}}
                type="button"
                onClick={handleCheckOut}
                disabled={isCheckOutDisabled || actionLoading}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                  isCheckOutDisabled
                    ? "bg-white/15 text-white/50 border border-white/10 cursor-not-allowed"
                    : "bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
                }`}
              >
                {actionLoading && isOnShift ? (
                  <span>{t("attendance.loading", "Please wait...")}</span>
                ) : hasCheckedOut ? (
                  <>
                    <FiCheck className="w-3.5 h-3.5 text-slate-300" />
                    <span>
                      {t("attendance.checkedOut", "Checked Out")}
                      {checkOutTime ? ` (${checkOutTime})` : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span>{t("employee.home.checkOut", "Check out")}</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="relative z-10 mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {actionError}
          </div>
        )}
      </motion.div>

      {/* 3. Summary Cards Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eff6ff] text-[#3b82f6]">
              <FiCheckSquare className="w-4 h-4" />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
              {widgets?.pending_tasks?.label ||
                t("employee.home.pendingTasks", "PENDING TASKS")}
            </span>
          </div>

          <h3 className="text-xl font-bold text-[#102a43]">
            {widgets?.pending_tasks?.count != null
              ? t("employee.home.taskCount", "{{count}} tasks", {
                  count: widgets.pending_tasks.count,
                })
              : "—"}
          </h3>

          <p className="text-xs text-[#64748b] mt-1">
            {widgets?.pending_tasks?.subtext ?? "—"}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fefce8] text-[#d97706]">
              <FiClock className="w-4 h-4" />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
              {widgets?.next_deadline?.label ||
                t("employee.home.nextDeadline", "NEXT DEADLINE")}
            </span>
          </div>

          <h3 className="text-xl font-bold text-[#102a43]">
            {widgets?.next_deadline?.date ?? "—"}
          </h3>

          <p className="text-xs text-[#64748b] mt-1">
            {widgets?.next_deadline?.task_title ?? "—"}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ecfdf5] text-[#059669]">
              <FiCalendar className="w-4 h-4" />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
              {widgets?.leave_balance?.label ||
                t("employee.home.leaveBalance", "LEAVE BALANCE")}
            </span>
          </div>

          <h3 className="text-xl font-bold text-[#102a43]">
            {widgets?.leave_balance?.days != null
              ? t("employee.home.dayCount", "{{count}} days", {
                  count: widgets.leave_balance.days,
                })
              : "—"}
          </h3>

          <p className="text-xs text-[#64748b] mt-1">
            {widgets?.leave_balance?.subtext ?? "—"}
          </p>
        </motion.div>
      </motion.div>

      {/* 4. Quick Actions */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-[#102a43]">
            {t("employee.home.quickActions", "Quick actions")}
          </h3>

          <p className="text-xs text-[#829ab1] mt-0.5">
            {t(
              "employee.home.shortcuts",
              "Shortcuts for your most common tasks.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:shadow-sm transition cursor-pointer"
            onClick={() => navigate("/employee/leaves")}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#059669]">
                <FiCalendar className="w-4 h-4" />
              </div>

              <span className="text-xs font-semibold text-[#102a43]">
                {t("employee.home.requestLeave", "Request leave")}
              </span>
            </div>

            <FiArrowRight className="w-4 h-4 text-[#cbd5e1] group-hover:text-[#102a43] transition-transform group-hover:translate-x-0.5" />
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:shadow-sm transition cursor-pointer"
            onClick={() => navigate("/employee/tasks")}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
                <FiUploadCloud className="w-4 h-4" />
              </div>

              <span className="text-xs font-semibold text-[#102a43]">
                {t("employee.home.submitTask", "Submit task")}
              </span>
            </div>

            <FiArrowRight className="w-4 h-4 text-[#cbd5e1] group-hover:text-[#102a43] transition-transform group-hover:translate-x-0.5" />
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCalendarModal(true)}
            className="group flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:shadow-sm transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#059669]">
                <FiCalendar className="w-4 h-4" />
              </div>

              <span className="text-xs font-semibold text-[#102a43]">
                {t("employee.home.viewCalendar", "View calendar")}
              </span>
            </div>

            <FiArrowRight className="w-4 h-4 text-[#cbd5e1] group-hover:text-[#102a43] transition-transform group-hover:translate-x-0.5" />
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:shadow-sm transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#059669]">
                <FiCpu className="w-4 h-4" />
              </div>

              <span className="text-xs font-semibold text-[#102a43]">
                {t("employee.home.aiAssistant", "AI HR Assistant")}
              </span>
            </div>

            <FiArrowRight className="w-4 h-4 text-[#cbd5e1] group-hover:text-[#102a43] transition-transform group-hover:translate-x-0.5" />
          </motion.div>
        </div>
      </motion.div>

      {/* 5. Bottom Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#102a43]">
                {t("employee.home.todaysSchedule", "Today's schedule")}
              </h3>

              <p className="text-xs text-[#829ab1] mt-0.5">
                {t(
                  "employee.home.upcomingEvents",
                  "Your upcoming calendar events.",
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#64748b] hover:text-[#102a43] transition"
            >
              {t("employee.home.viewAll", "View all")}

              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {todayEvents.length > 0 ? (
              todayEvents.map((ev, idx) => {
                const isLeave = ev.type === "leave";
                const isDeadline = ev.type === "task_deadline";
                const isHoliday = ev.type === "holiday";
                const dotColor = isLeave
                  ? "bg-[#10b981]"
                  : isDeadline
                    ? "bg-[#f59e0b]"
                    : isHoliday
                      ? "bg-[#8b5cf6]"
                      : "bg-[#3b82f6]";

                const typeLabel = isLeave
                  ? t("employee.home.calendar.leave", "Leave")
                  : isDeadline
                    ? t("employee.home.calendar.deadline", "Task Deadline")
                    : isHoliday
                      ? t("employee.home.calendar.holiday", "Official Holiday")
                      : t("employee.home.calendar.companyEvent", "Company Event");

                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="font-medium text-[#829ab1] w-20 shrink-0">
                      {ev.date}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-[#102a43]">
                        {typeLabel}
                      </p>
                      <p className="text-[#829ab1]">#{ev.reference}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-medium text-[#829ab1] w-16 shrink-0">
                    10:30 AM
                  </span>
                  <span className="h-2 w-2 rounded-full bg-[#3b82f6] shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#102a43]">
                      {t("employee.home.productSync", "Product sync")}
                    </p>
                    <p className="text-[#829ab1]">
                      {t(
                        "employee.home.meetingRoom",
                        "Meeting room 4B · 45 min",
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-medium text-[#829ab1] w-16 shrink-0">
                    02:00 PM
                  </span>
                  <span className="h-2 w-2 rounded-full bg-[#10b981] shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#102a43]">
                      {t("employee.home.focusTime", "Focus time")}
                    </p>
                    <p className="text-[#829ab1]">
                      {t(
                        "employee.home.operationsReportShort",
                        "Q2 Operations report",
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#102a43]">
                {t("employee.home.recentActivity", "Recent activity")}
              </h3>

              <p className="text-xs text-[#829ab1] mt-0.5">
                {t(
                  "employee.home.latestUpdates",
                  "Latest updates from your workspace.",
                )}
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#64748b] hover:text-[#102a43] transition"
            >
              {t("employee.home.seeAll", "See all")}

              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff6ff] text-[#3b82f6] shrink-0">
                  <FiActivity className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-[#102a43] truncate">
                    {t(
                      "employee.home.vendorChecklist",
                      "Vendor checklist submitted",
                    )}
                  </p>

                  <p className="text-[#829ab1]">
                    {t("employee.home.yesterdayAt432", "Yesterday at 4:32 PM")}
                  </p>
                </div>
              </div>

              <div className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 text-slate-400 shrink-0">
                <FiCheck className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff6ff] text-[#3b82f6] shrink-0">
                  <FiBell className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-[#102a43] truncate">
                    {t("employee.home.leaveUpdated", "Leave balance updated")}
                  </p>

                  <p className="text-[#829ab1]">
                    {t("employee.home.yesterdayAt910", "Yesterday at 9:10 AM")}
                  </p>
                </div>
              </div>

              <div className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 text-slate-400 shrink-0">
                <FiCheck className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6. Live Connected Calendar Modal */}
      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        role="employee"
      />
    </motion.div>
  );
}
