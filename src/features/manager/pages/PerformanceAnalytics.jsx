import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiTrendingUp,
  FiUsers,
  FiAward,
  FiAlertTriangle,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import { useTeamPerformance } from "../../../hooks/usePerformance";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};


// تنسيق الأرقام — 85.5 تفضل 85.5، و 92 تفضل 92
const fmt = (value) => {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return "0";
  return n.toFixed(1).replace(/\.0$/, "");
};

// =========================
// TREND CHART BUILDER — من performance_trend
// =========================
const CHART_WIDTH = 500;
const CHART_HEIGHT = 145;
const CHART_PAD_Y = 22;

const buildTrendChart = (trend) => {
  if (!trend || trend.length === 0) return null;

  const stepX = trend.length > 1 ? CHART_WIDTH / (trend.length - 1) : 0;

  const points = trend.map((item, index) => ({
    x: index * stepX,
    y:
      CHART_HEIGHT -
      CHART_PAD_Y -
      ((Number(item.overall_score) || 0) / 100) * (CHART_HEIGHT - CHART_PAD_Y * 2),
    label: item.month,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

  return { points, linePath, areaPath };
};

// الأحرف الأولى للأفاتار
const getInitials = (name) =>
  String(name ?? "")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

// لون البادج حسب status_label
const getStatusStyle = (label) => {
  const v = String(label ?? "").toLowerCase();
  if (v.includes("high")) return "bg-[#ecfdf5] text-[#15803d]";
  if (v.includes("attention") || v.includes("low") || v.includes("يحتاج إلى متابعة"))
    return "bg-[#fef2f2] text-[#dc2626]";
  return "bg-[#eff6ff] text-[#3b82f6]";
};

const PerformanceAnalytics = () => {
  const { t, i18n } = useTranslation();
  const translateMemberStatus = (label) => {
    const value = String(label ?? "").toLowerCase();
    if (value.includes("high performer")) return t("managerPerformanceAnalytics.status.highPerformer", label);
    if (value.includes("attention") || value.includes("low") || value.includes("يحتاج إلى متابعة")) return t("managerPerformanceAnalytics.status.needsAttention", label);
    if (value.includes("on track")) return t("managerPerformanceAnalytics.status.onTrack", label);
    return label;
  };
  const translateJobTitle = (title) => {
    const value = String(title ?? "").trim().toLowerCase();
    const keys = { "flutter developer": "flutterDeveloper", "front": "frontendDeveloper", "sw": "softwareDeveloper", "front-end developer": "frontendDeveloper", "frontend developer": "frontendDeveloper", "software developer": "softwareDeveloper", "software engineer": "softwareEngineer" };
    const key = keys[value];
    return key ? t("managerPerformanceAnalytics.jobTitles." + key, title) : title;
  };
  const translateMonth = (month) => {
    const date = new Date(String(month ?? "") + " 1, 2026");
    return Number.isNaN(date.getTime()) ? month : date.toLocaleDateString(i18n.language?.startsWith("ar") ? "ar-EG" : "en-US", { month: "long" });
  };

  const translatePeriod = (period) => {
    const date = new Date(String(period ?? "") + " 1");
    return Number.isNaN(date.getTime()) ? period : date.toLocaleDateString(i18n.language?.startsWith("ar") ? "ar-EG" : "en-US", { month: "long", year: "numeric" });
  };

  // =========================
  // STATES
  // =========================
  const [page, setPage] = useState(1);

  // =========================
  // DATA — GET /api/manager/team-performance
  // =========================
  const { data, isLoading: loading, isError, error, refetch } = useTeamPerformance({ page, per_page: 10 });


  // =====================================================
  // DERIVED DATA — الربط بالحقول بتاعتك بالظبط:
  //   team_summary  → الكروت الأربعة
  //   at_a_glance   → كارت At a glance
  //   team_members  → كارت Team Performance Index
  //   performance_trend → شارت Trend
  // =====================================================
  const summary = data?.team_summary ?? {};        // ← team_summary
  const glance = data?.at_a_glance ?? {};          // ← at_a_glance
  const trendChart = buildTrendChart(data?.performance_trend); // ← performance_trend
  const membersMeta = data?.team_members ?? {};    // ← team_members
  const members = membersMeta.data ?? [];

  // =====================================================
  // 1️⃣ الكروت الأربعة — من team_summary
  //    overall_score=84.3 | total_members=8
  //    high_performers_count=5 | needs_attention_count=1
  // =====================================================
  const kpiCards = [
    {
      id: "overall",
      label: t("managerPerformanceAnalytics.overallScore", "Overall Score"),
      value: summary.overall_score != null ? `${fmt(summary.overall_score)}%` : "—",
      icon: FiTrendingUp,
      iconBg: "bg-[#ecfdf5] text-[#10b981]",
      note: translatePeriod(data?.period_name) ?? "",
    },
    {
      id: "members",
      label: t("managerPerformanceAnalytics.teamMembers", "Team Members"),
      value: summary.total_members ?? "—",
      icon: FiUsers,
      iconBg: "bg-[#eff6ff] text-[#3b82f6]",
      note: t("managerPerformanceAnalytics.directReports", "Direct reports"),
    },
    {
      id: "high",
      label: t("managerPerformanceAnalytics.highPerformers", "High Performers"),
      value: summary.high_performers_count ?? "—",
      icon: FiAward,
      iconBg: "bg-[#f5f3ff] text-[#8b5cf6]",
      note: t("managerPerformanceAnalytics.topRatings", "Top ratings"),
    },
    {
      id: "attention",
      label: t("managerPerformanceAnalytics.needsAttention", "Needs Attention"),
      value: summary.needs_attention_count ?? "—",
      icon: FiAlertTriangle,
      iconBg: "bg-[#fff7ed] text-[#f97316]",
      note: t("managerPerformanceAnalytics.requiresSupport", "Requires support"),
    },
  ];

  // =====================================================
  // 2️⃣ كارت At a glance — من at_a_glance
  //    tasks_rate=85.5 | quality_rate=92 | attendance_rate=96.4
  // =====================================================
  const glanceBars = [
    {
      id: "tasks",
      label: t("managerPerformanceAnalytics.tasksRate", "Tasks completion"),
      value: Number(glance.tasks_rate ?? 0),
      color: "bg-[#5b8c6a]",
    },
    {
      id: "quality",
      label: t("managerPerformanceAnalytics.qualityRate", "Quality of work"),
      value: Number(glance.quality_rate ?? 0),
      color: "bg-[#70a5c3]",
    },
    {
      id: "attendance",
      label: t("managerPerformanceAnalytics.attendanceRate", "Attendance rate"),
      value: Number(glance.attendance_rate ?? 0),
      color: "bg-[#d3a054]",
    },
  ];

  // Pagination — من team_members (current_page / last_page)
  const currentPage = membersMeta.current_page ?? 1;
  const lastPage = membersMeta.last_page ?? 1;
  const hasPagination = lastPage > 1;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="w-full space-y-6 pb-12 font-sans"
    >
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <motion.div variants={fadeUp} transition={{ duration: 0.2, ease: "easeOut" }}>
        <p className="text-[11px] font-bold tracking-wider text-[#6b879f] uppercase">
          {t("portal.managerPortal", "MANAGER PORTAL")} /{" "}
          {t("portal.performanceAnalytics", "PERFORMANCE ANALYTICS")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-lg md:text-[21px] font-bold text-[#1e293b] tracking-tight">
            {t("managerPerformanceAnalytics.title", "Performance Analytics")}
          </h1>

          {data?.period_name && (
            <span className="rounded-full bg-[#eef5f1] px-3 py-1 text-[11px] font-semibold text-[#2f6f4d]">
              {translatePeriod(data.period_name)}
            </span>
          )}
        </div>
        <p className="text-sm text-[#829ab1] mt-1 font-normal">
          {t(
            "managerPerformanceAnalytics.subtitle",
            "Keep your team aligned, supported, and moving forward.",
          )}
        </p>
      </motion.div>

      {/* ERROR */}
      {error && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-5">
          <p className="text-sm font-semibold text-[#dc2626]">{t("managerPerformanceAnalytics.loadError", "Unable to load team performance.")}</p>
        </motion.div>
      )}

      {/* =====================================================
          1️⃣ KPI CARDS — من team_summary
      ====================================================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
              className="flex flex-col justify-between rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  {card.label}
                </p>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>

              <div className="mt-2">
                <p className="text-[27px] font-bold tracking-tight text-[#0f172a]">
                  {card.value}
                </p>
                {card.note && (
                  <p className="mt-1 text-xs font-normal text-[#64748b]">{card.note}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* LOADING */}
      {loading && !data && (
        <div className="flex h-40 items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#e2e8f0] border-t-[#334e68] rounded-full animate-spin" />
        </div>
      )}

      {/* =====================================================
          CARDS GRID
      ====================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* =====================================================
            العمود الشمال — Trend + At a glance
        ====================================================== */}
        <div className="space-y-6">
          {/* ---------- شارت PERFORMANCE TREND ---------- */}
          <motion.section
            variants={fadeUp}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <h2 className="text-base font-bold text-[#102a43]">
              {t("managerPerformanceAnalytics.performanceTrend", "Performance trend")}
            </h2>
            <p className="mt-1 text-[11px] text-[#94a3b8]">
              {t(
                "managerPerformanceAnalytics.trendSubtitle",
                "Team overall score across the period months.",
              )}
            </p>

            {trendChart ? (
              <div className="mt-6" dir="ltr">
                <svg
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  className="h-[145px] w-full"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="0"
                    y1={CHART_PAD_Y}
                    x2={CHART_WIDTH}
                    y2={CHART_PAD_Y}
                    stroke="#edf2f4"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <line
                    x1="0"
                    y1={CHART_HEIGHT / 2}
                    x2={CHART_WIDTH}
                    y2={CHART_HEIGHT / 2}
                    stroke="#edf2f4"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <line
                    x1="0"
                    y1={CHART_HEIGHT - CHART_PAD_Y}
                    x2={CHART_WIDTH}
                    y2={CHART_HEIGHT - CHART_PAD_Y}
                    stroke="#edf2f4"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />

                  <path d={trendChart.areaPath} fill="#eef5f1" />

                  <path
                    d={trendChart.linePath}
                    fill="none"
                    stroke="#334e68"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {trendChart.points.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      fill="white"
                      stroke="#334e68"
                      strokeWidth="2"
                    />
                  ))}
                </svg>

                <div className="mt-1 flex justify-between px-1 text-[10px] text-[#64748b]">
                  {trendChart.points.map((point, index) => (
                    <span key={index}>{translateMonth(point.label)}</span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-[#94a3b8]">
                {t("managerPerformanceAnalytics.noTrendData", "No trend data available")}
              </p>
            )}
          </motion.section>

          {/* ---------- 2️⃣ كارت AT A GLANCE — من at_a_glance ---------- */}
          <motion.section
            variants={fadeUp}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
            className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <h2 className="text-base font-bold text-[#102a43]">
              {t("managerPerformanceAnalytics.atAGlance", "At a glance")}
            </h2>
            <p className="mt-1 text-[11px] text-[#94a3b8]">
              {t(
                "managerPerformanceAnalytics.performanceBreakdown",
                "Performance breakdown",
              )}
            </p>

            <div className="mt-5 space-y-4">
              {glanceBars.map((bar, index) => (
                <div key={bar.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="font-medium text-[#334155]">{bar.label}</span>
                    <span className="font-bold text-[#102a43]">{fmt(bar.value)}%</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${bar.value}%` }}
                      transition={{
                        duration: 0.6,
                        ease: "easeOut",
                        delay: 0.15 + index * 0.05,
                      }}
                      className={`h-full rounded-full ${bar.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* =====================================================
            3️⃣ اليمين: TEAM PERFORMANCE INDEX — من team_members.data
            Sarah Connor | Software Engineer | 89.2 | High Performer
            tasks_rate=90 | attendance_rate=95 | quality_rate=88
        ====================================================== */}
        <motion.section
          variants={fadeUp}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
          className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        >
          <h2 className="text-base font-bold text-[#102a43] mb-4">
            {t("managerPerformanceAnalytics.teamPerformanceIndex", "Team Performance Index")}
          </h2>

          {members.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#94a3b8]">
              {t("managerPerformanceAnalytics.noMembers", "No team members found")}
            </p>
          ) : (
            <div className="space-y-4">
              {members.map((member) => {
                const statusStyle = getStatusStyle(member.status_label);

                const memberBars = [
                  {
                    label: t("managerPerformanceAnalytics.memberTasks", "Tasks"),
                    value: Number(member.tasks_rate ?? 0),
                    color: "bg-[#5b8c6a]",
                  },
                  {
                    label: t("managerPerformanceAnalytics.memberQuality", "Quality"),
                    value: Number(member.quality_rate ?? 0),
                    color: "bg-[#70a5c3]",
                  },
                  {
                    label: t("managerPerformanceAnalytics.memberAttendance", "Attendance"),
                    value: Number(member.attendance_rate ?? 0),
                    color: "bg-[#d3a054]",
                  },
                ];

                return (
                  <div
                    key={member.user_id ?? member.employee_id}
                    className="rounded-xl border border-[#f1f5f9] bg-[#fafbfc]/60 p-4 transition-colors hover:bg-[#f8fafc]"
                  >
                    {/* صف 1: أفاتار + اسم + وظيفة + بادج + سكور */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e0e7ff] text-xs font-bold text-[#4338ca]">
                        {getInitials(member.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1e293b]">
                          {member.name}
                        </p>
                        {member.job_title && (
                          <p className="truncate text-[11px] text-[#94a3b8]">
                            {translateJobTitle(member.job_title)}
                          </p>
                        )}
                      </div>

                      {member.status_label && (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle}`}
                        >
                          {translateMemberStatus(member.status_label)}
                        </span>
                      )}

                      <div className="shrink-0 text-right rtl:text-left">
                        <p className="text-sm font-bold text-[#102a43]">
                          {fmt(member.overall_score)}%
                        </p>
                      </div>
                    </div>

                    {/* صف 2: البارات الصغيرة — من بيانات الموظف */}
                    <div className="mt-3 space-y-2">
                      {memberBars.map((bar) => (
                        <div key={bar.label} className="flex items-center gap-2.5">
                          <span className="w-16 shrink-0 text-[10px] font-medium text-[#64748b]">
                            {bar.label}
                          </span>

                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef2f6]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${bar.value}%` }}
                              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                              className={`h-full rounded-full ${bar.color}`}
                            />
                          </div>

                          <span className="w-9 shrink-0 text-right text-[10px] font-bold text-[#334155] rtl:text-left">
                            {fmt(bar.value)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINATION — من team_members */}
          {hasPagination && !loading && (
            <div className="mt-4 flex items-center justify-between border-t border-[#f1f5f9] pt-4">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#334155] transition hover:bg-[#f8fafc] disabled:opacity-40"
              >
                {t("common.prev", "Prev")}
              </button>
              <span className="text-xs text-[#94a3b8]">
                {currentPage} / {lastPage}
              </span>
              <button
                type="button"
                disabled={currentPage >= lastPage}
                onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}
                className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#334155] transition hover:bg-[#f8fafc] disabled:opacity-40"
              >
                {t("common.next", "Next")}
              </button>
            </div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
};

export default PerformanceAnalytics;