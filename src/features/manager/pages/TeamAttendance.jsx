import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiRefreshCw,
  FiUsers,
  FiClock,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiMapPin,
} from "react-icons/fi";
import CheckInOutWidget from "../../../components/CheckInOutWidget";
import {
  useManagerAttendanceToday,
  useManagerEmployeeAttendance,
} from "../hooks/useManagerData";

/* ─── Animation presets ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

/* ─── Status badge helper ─── */
const statusConfig = {
  Present: { cls: "bg-[#ecfdf5] text-[#059669]", dot: "bg-[#059669]" },
  Late: { cls: "bg-[#fefce8] text-[#d97706]", dot: "bg-[#d97706]" },
  Absent: { cls: "bg-[#fef2f2] text-[#dc2626]", dot: "bg-[#dc2626]" },
};
const getStatusCfg = (status) =>
  statusConfig[status] ?? { cls: "bg-[#f1f5f9] text-[#475569]", dot: "bg-[#94a3b8]" };

/* ─── Bar chart helpers ─── */
const BAR_H = 60;
const getBarMax = (days) =>
  Math.max(...days.map((d) => d.present + d.late + d.absent), 1);

/* ─── Avatar initials ─── */
const initials = (name) =>
  (name || "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/* ─── Employee Detail Drawer ─── */
const EmployeeDetailDrawer = ({ employeeId, date, onClose, isArabic }) => {
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    error,
  } = useManagerEmployeeAttendance(employeeId, date ? { date } : {});

  const user = data?.user ?? {};
  const att = data?.attendance ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden"
        dir={isArabic ? "rtl" : "ltr"}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
          <p className="text-sm font-bold text-[#1e293b]">
            {t("managerAttendance.detail.title", "Attendance Detail")}
          </p>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#f1f5f9] transition"
          >
            <FiXCircle className="h-4 w-4 text-[#94a3b8]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <FiRefreshCw className="h-6 w-6 animate-spin text-[#627d98]" />
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 rounded-xl bg-[#fef2f2] px-4 py-3">
              <FiAlertCircle className="h-4 w-4 text-[#dc2626]" />
              <p className="text-sm text-[#dc2626]">
                {error?.response?.data?.message || error?.message || "Failed to load"}
              </p>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {/* Employee info */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e2e8f0] text-sm font-bold text-[#486581]">
                  {initials(user.name)}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#1e293b]">{user.name || "—"}</p>
                  <p className="text-xs text-[#64748b]">{user.job_title || "—"}</p>
                  <p className="text-xs text-[#94a3b8]">{user.email || ""}</p>
                </div>
              </div>

              {/* Attendance record */}
              {att ? (
                <div className="rounded-2xl border border-[#e2e8f0] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                      {t("managerAttendance.detail.record", "Record")}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusCfg(att.status).cls}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${getStatusCfg(att.status).dot}`} />
                      {att.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide">
                        {t("managerAttendance.detail.date", "Date")}
                      </p>
                      <p className="font-medium text-[#1e293b]">{att.date || "—"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide">
                        {t("managerAttendance.detail.worked", "Worked")}
                      </p>
                      <p className="font-medium text-[#1e293b]">{att.worked_hours_formatted || "0.0h"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide">
                        {t("managerAttendance.detail.checkIn", "Check-in")}
                      </p>
                      <p className="font-medium text-[#1e293b]">{att.check_in || "—"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide">
                        {t("managerAttendance.detail.checkOut", "Check-out")}
                      </p>
                      <p className="font-medium text-[#1e293b]">{att.check_out || "—"}</p>
                    </div>
                  </div>

                  {att.check_in_location && (
                    <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                      <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#3b82f6]" />
                      <span>
                        {att.check_in_location.latitude?.toFixed(4)},{" "}
                        {att.check_in_location.longitude?.toFixed(4)}
                      </span>
                    </div>
                  )}

                  {att.is_exception && att.exception_reason && (
                    <div className="rounded-xl bg-[#fff7ed] px-3 py-2 text-xs text-[#c2410c]">
                      <span className="font-semibold">{t("managerAttendance.exception", "Exception")}: </span>
                      {att.exception_reason}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-[#f8fafc] px-4 py-6 text-center text-sm text-[#94a3b8]">
                  {t("managerAttendance.detail.noRecord", "No attendance record found for this date.")}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Main Component ─── */
const TeamAttendance = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");

  // ── Filters & Pagination ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDate, setDate] = useState("");

  // ── Detail Drawer ──
  const [detailId, setDetailId] = useState(null);

  // ── React Query ──
  const {
    data,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useManagerAttendanceToday({
    ...(search ? { search } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
    page,
    per_page: 15,
  });

  // ── Derived data ──
  const summary = data?.summary ?? {};
  const weekChart = data?.weekly_chart ?? [];
  const teamMeta = data?.team ?? {};
  const members = teamMeta.data ?? [];
  const meta = teamMeta.meta ?? {};
  const lastPage = meta.last_page ?? 1;
  const barMax = getBarMax(weekChart);

  const summaryCards = [
    { id: "present", label: t("managerAttendance.present", "Present"), value: summary.present ?? 0, color: "text-[#059669]", bg: "bg-[#ecfdf5]", icon: FiCheckCircle },
    { id: "late", label: t("managerAttendance.late", "Late"), value: summary.late ?? 0, color: "text-[#d97706]", bg: "bg-[#fefce8]", icon: FiClock },
    { id: "absent", label: t("managerAttendance.absent", "Absent"), value: summary.absent ?? 0, color: "text-[#dc2626]", bg: "bg-[#fef2f2]", icon: FiXCircle },
    { id: "total", label: t("managerAttendance.totalTeam", "Total Team"), value: summary.total_team ?? 0, color: "text-[#486581]", bg: "bg-[#eff6ff]", icon: FiUsers },
  ];

  return (
    <motion.div
      dir={isArabic ? "rtl" : "ltr"}
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="w-full space-y-6 pb-12 font-sans"
    >
      {/* ── HEADER ── */}
      <motion.div variants={fadeUp} transition={{ duration: 0.2, ease: "easeOut" }}>
        <p className="text-[11px] font-bold tracking-wider text-[#6b879f] uppercase">
          {t("managerAttendance.breadcrumb", "Manager Portal / Team Attendance")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-lg md:text-[21px] font-bold text-[#1e293b] tracking-tight">
            {t("managerAttendance.title", "Team Attendance")}
          </h1>
          {data?.selected_date && (
            <span className="flex items-center gap-1 rounded-full bg-[#eef5f1] px-3 py-1 text-[11px] font-semibold text-[#2f6f4d]">
              <FiCalendar className="h-3 w-3" />
              {data.selected_date}
            </span>
          )}
        </div>
        <p className="text-sm text-[#829ab1] mt-1 font-normal">
          {t("managerAttendance.subtitle", "Keep your team aligned, supported, and moving forward.")}
        </p>

        {/* Personal check-in widget */}
        <div className="mt-4">
          <CheckInOutWidget compact />
        </div>
      </motion.div>

      {/* ── LOADING ── */}
      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <FiRefreshCw className="h-7 w-7 animate-spin text-[#627d98]" />
        </div>
      )}

      {/* ── ERROR ── */}
      {!loading && isError && (
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4"
        >
          <p className="text-sm text-[#b91c1c]">
            {error?.response?.data?.message || error?.message || t("managerAttendance.loadError", "Failed to load attendance data.")}
          </p>
          <button
            onClick={() => refetch()}
            className="shrink-0 text-sm font-semibold text-[#dc2626] hover:underline"
          >
            {t("common.retry", "Retry")}
          </button>
        </motion.div>
      )}

      {/* ── DATA ── */}
      {!loading && !isError && (
        <>
          {/* ══ SUMMARY CARDS ══ */}
          <motion.div
            variants={stagger}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.id}
                  variants={fadeUp}
                  whileHover={{ y: -3, transition: { duration: 0.18 } }}
                  className="flex flex-col justify-between rounded-2xl border border-[#e2e8f0]/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                      {card.label}
                    </p>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.bg} ${card.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className={`mt-2 text-3xl font-bold tracking-tight ${card.color}`}>
                    {card.value}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ══ WEEKLY CHART ══ */}
          {weekChart.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
            >
              <p className="text-sm font-bold text-[#1e293b] mb-4">
                {t("managerAttendance.weeklyOverview", "Weekly Overview")}
              </p>
              <div className="flex items-end gap-2 overflow-x-auto pb-1">
                {weekChart.map((day) => {
                  const total = day.present + day.late + day.absent;
                  const presH = total ? (day.present / barMax) * BAR_H : 0;
                  const lateH = total ? (day.late / barMax) * BAR_H : 0;
                  const absH = total ? (day.absent / barMax) * BAR_H : 0;
                  const isToday = day.date === data?.selected_date;
                  return (
                    <div key={day.date} className="flex flex-1 min-w-[48px] flex-col items-center gap-1">
                      {/* Stacked bar */}
                      <div
                        className="flex flex-col-reverse items-stretch justify-end gap-px rounded-t-md overflow-hidden w-full"
                        style={{ height: BAR_H }}
                      >
                        {presH > 0 && (
                          <div
                            className="w-full rounded-sm bg-[#34d399] transition-all duration-700"
                            style={{ height: presH }}
                          />
                        )}
                        {lateH > 0 && (
                          <div
                            className="w-full rounded-sm bg-[#fbbf24] transition-all duration-700"
                            style={{ height: lateH }}
                          />
                        )}
                        {absH > 0 && (
                          <div
                            className="w-full rounded-sm bg-[#f87171] transition-all duration-700"
                            style={{ height: absH }}
                          />
                        )}
                        {total === 0 && (
                          <div className="w-full rounded-sm bg-[#e2e8f0]" style={{ height: 4 }} />
                        )}
                      </div>
                      {/* Day label */}
                      <p className={`text-[10px] font-semibold ${isToday ? "text-[#2f6f4d]" : "text-[#94a3b8]"}`}>
                        {day.day}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-4">
                {[
                  { label: t("managerAttendance.present", "Present"), color: "bg-[#34d399]" },
                  { label: t("managerAttendance.late", "Late"), color: "bg-[#fbbf24]" },
                  { label: t("managerAttendance.absent", "Absent"), color: "bg-[#f87171]" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-sm ${l.color}`} />
                    <span className="text-[11px] text-[#64748b]">{l.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ FILTERS ══ */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center gap-3"
          >
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                placeholder={t("managerAttendance.search", "Search employee…")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 ps-9 pe-4 text-sm text-[#1e293b] placeholder-[#94a3b8] outline-none focus:border-[#5b8c6a] focus:ring-2 focus:ring-[#5b8c6a]/20 transition"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <FiFilter className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="rounded-xl border border-[#e2e8f0] bg-white py-2.5 ps-9 pe-4 text-sm text-[#1e293b] outline-none focus:border-[#5b8c6a] focus:ring-2 focus:ring-[#5b8c6a]/20 transition appearance-none cursor-pointer"
              >
                <option value="">{t("managerAttendance.allStatuses", "All Statuses")}</option>
                <option value="Present">{t("managerAttendance.present", "Present")}</option>
                <option value="Late">{t("managerAttendance.late", "Late")}</option>
                <option value="Absent">{t("managerAttendance.absent", "Absent")}</option>
              </select>
            </div>

            {/* Date picker */}
            <div className="relative">
              <FiCalendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setDate(e.target.value); setPage(1); }}
                className="rounded-xl border border-[#e2e8f0] bg-white py-2.5 ps-9 pe-4 text-sm text-[#1e293b] outline-none focus:border-[#5b8c6a] focus:ring-2 focus:ring-[#5b8c6a]/20 transition cursor-pointer"
              />
            </div>

            {/* Avg Hours badge */}
            {summary.avg_hours && (
              <div className="flex items-center gap-1.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-2.5">
                <FiClock className="h-4 w-4 text-[#059669]" />
                <span className="text-sm font-semibold text-[#059669]">{summary.avg_hours}</span>
                <span className="text-xs text-[#6ee7b7]">{t("managerAttendance.avgHours", "avg")}</span>
              </div>
            )}
          </motion.div>

          {/* ══ TEAM TABLE ══ */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden"
          >
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#94a3b8]">
                <FiUsers className="h-10 w-10 opacity-40" />
                <p className="text-sm">{t("managerAttendance.noMembers", "No team members found.")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#f1f5f9] text-[11px] font-bold tracking-wider text-[#94a3b8]">
                      <th className="py-4 px-5">{t("managerAttendance.table.member", "MEMBER")}</th>
                      <th className="py-4 px-5">{t("managerAttendance.table.checkIn", "CHECK-IN")}</th>
                      <th className="py-4 px-5">{t("managerAttendance.table.checkOut", "CHECK-OUT")}</th>
                      <th className="py-4 px-5">{t("managerAttendance.table.worked", "WORKED")}</th>
                      <th className="py-4 px-5">{t("managerAttendance.table.status", "STATUS")}</th>
                      <th className="py-4 px-5 text-end rtl:text-start">
                        <span className="sr-only">{t("common.details", "Details")}</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#f1f5f9]">
                    {members.map((member) => {
                      const cfg = getStatusCfg(member.status);
                      return (
                        <tr
                          key={member.user_id ?? member.attendance_id}
                          className="hover:bg-[#f8fafc]/60 transition group"
                        >
                          {/* Member */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              {member.avatar_url ? (
                                <img
                                  src={member.avatar_url}
                                  alt={member.name}
                                  className="h-8 w-8 rounded-full object-cover shrink-0"
                                  onError={(e) => { e.target.style.display = "none"; }}
                                />
                              ) : (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e2e8f0] text-xs font-bold text-[#486581]">
                                  {initials(member.name)}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-[#1e293b]">{member.name}</p>
                                <p className="text-xs text-[#94a3b8]">{member.job_title}</p>
                              </div>
                            </div>
                          </td>

                          {/* Check-in */}
                          <td className="py-4 px-5 text-sm text-[#475569]">
                            {member.check_in || <span className="text-[#cbd5e1]">—</span>}
                          </td>

                          {/* Check-out */}
                          <td className="py-4 px-5 text-sm text-[#475569]">
                            {member.check_out || <span className="text-[#cbd5e1]">—</span>}
                          </td>

                          {/* Worked */}
                          <td className="py-4 px-5 text-sm font-medium text-[#1e293b]">
                            {member.worked_hours_formatted || <span className="text-[#cbd5e1]">—</span>}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.cls}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                              {member.status || "—"}
                            </span>
                          </td>

                          {/* Details button */}
                          <td className="py-4 px-5 text-end rtl:text-start">
                            <button
                              onClick={() => setDetailId(member.user_id)}
                              className="text-xs font-semibold text-[#486581] opacity-0 group-hover:opacity-100 hover:text-[#2f6f4d] transition"
                            >
                              {t("managerAttendance.viewDetails", "View")}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── PAGINATION ── */}
            {lastPage > 1 && (
              <div className="flex items-center justify-between border-t border-[#f1f5f9] px-5 py-3">
                <p className="text-xs text-[#94a3b8]">
                  {t("common.page", "Page")} {meta.current_page ?? page} / {lastPage}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {isArabic ? <FiChevronRight className="h-4 w-4" /> : <FiChevronLeft className="h-4 w-4" />}
                  </button>
                  <button
                    disabled={page >= lastPage}
                    onClick={() => setPage((p) => p + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {isArabic ? <FiChevronLeft className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* ── DETAIL DRAWER ── */}
      <AnimatePresence>
        {detailId !== null && (
          <EmployeeDetailDrawer
            employeeId={detailId}
            date={selectedDate || data?.selected_date || ""}
            isArabic={isArabic}
            onClose={() => setDetailId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeamAttendance;