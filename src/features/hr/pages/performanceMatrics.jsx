import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiTrendingUp,
  FiUsers,
  FiRefreshCw,
} from "react-icons/fi";

import { LuSparkles } from "react-icons/lu";
import { useCompanyPerformance } from "../../../hooks/usePerformance";

// تنسيق الأرقام — مفيش كسور عشرية طويلة
const fmt = (value) => {
  if (value == null) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toFixed(1).replace(/\.0$/, "");
};

// =========================
// TREND CHART BUILDER
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

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// =====================================================
// PERFORMANCE METRICS
// =====================================================

const PerformanceMetrics = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const isArabic = i18n.language?.startsWith("ar");

  // =====================================================
  // STATE
  // =====================================================
  const [progressStarted, setProgressStarted] = useState(false);
  const [page, setPage] = useState(1);

  // =====================================================
  // PROGRESS ANIMATION
  // =====================================================
  useEffect(() => {
    const timer = setTimeout(() => setProgressStarted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // =====================================================
  // DATA — GET /api/hr/company-performance
  // =====================================================
  const {
    data,
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useCompanyPerformance({ page, per_page: 10 });

  const error = queryError?.response?.data?.message || queryError?.message || null;

  // =====================================================
  // DERIVED DATA
  // =====================================================
  const summary = data?.company_summary ?? {};

  // ✅ at_a_glance → كارت Performance breakdown
  //    tasks_rate: 0 | quality_rate: 0 | attendance_rate: 25
  const glance = data?.at_a_glance ?? {};

  // ✅ departments_performance → كارت Departments performance
  //    ⚠️ الباك اند بيبعت الأقسام جوه "data" مش "departments"
  //    بيتعامل مع الحالتين عشان مايكسرش لو غيروه
  const deptsMeta = data?.departments_performance ?? {};
  const departments = deptsMeta.data ?? deptsMeta.departments ?? [];

  const trendChart = buildTrendChart(data?.performance_trend);

  const deptsCurrentPage = deptsMeta.current_page ?? 1;
  const deptsLastPage = deptsMeta.last_page ?? 1;
  const hasDeptsPagination = deptsLastPage > 1;

  // =====================================================
  // KPI CARDS — من company_summary
  // =====================================================
  const kpiCards = [
    {
      label: t("hrCommandCenter.totalEmployees", "Total Employees"),
      value: summary.total_employees ?? "—",
      note: `${summary.total_departments ?? 0} ${t(
        "hrCommandCenter.departments",
        "departments",
      )}`,
      icon: FiUsers,
      iconBg: "bg-[#eff6ff] text-[#3b82f6]",
    },
    {
      label: t("hrCommandCenter.overallScore", "Overall Score"),
      value: summary.overall_score != null ? `${fmt(summary.overall_score)}%` : "—",
      note: data?.period_name ?? "",
      icon: FiTrendingUp,
      iconBg: "bg-[#ecfdf5] text-[#10b981]",
    },
    {
      label: t("hrCommandCenter.highPerformers", "High Performers"),
      value: summary.high_performers_count ?? "—",
      note: t("hrCommandCenter.acrossCompany", "Across the company"),
      icon: FiCheckCircle,
      iconBg: "bg-[#f5f3ff] text-[#8b5cf6]",
    },
    {
      label: t("hrCommandCenter.needsAttention", "Needs Attention"),
      value: summary.needs_attention_count ?? "—",
      note: t("hrCommandCenter.requiresReview", "Require review"),
      icon: FiAlertTriangle,
      iconBg: "bg-[#fff7ed] text-[#f97316]",
    },
  ];

  // =====================================================
  // PERFORMANCE BREAKDOWN — من at_a_glance
  // =====================================================
  const breakdownBars = [
    {
      label: t("hrCommandCenter.tasksRate", "Tasks completion"),
      value: Number(glance.tasks_rate ?? 0),
      type: "green",
    },
    {
      label: t("hrCommandCenter.qualityRate", "Quality of work"),
      value: Number(glance.quality_rate ?? 0),
      type: "blue",
    },
    {
      label: t("hrCommandCenter.attendanceRate", "Attendance rate"),
      value: Number(glance.attendance_rate ?? 0),
      type: "orange",
    },
  ];

  // =====================================================
  // HELPERS
  // =====================================================
  const getDeptBadge = (label) => {
    const v = String(label ?? "").toLowerCase();
    if (v.includes("high"))
      return { dot: "bg-[#10b981]", badge: "bg-[#ecfdf5] text-[#15803d]" };
    if (v.includes("attention") || v.includes("low"))
      return { dot: "bg-[#ef4444]", badge: "bg-[#fef2f2] text-[#dc2626]" };
    return { dot: "bg-[#f97316]", badge: "bg-[#fff7ed] text-[#c2410c]" };
  };

  const getProgressColor = (type) => {
    switch (type) {
      case "orange":
        return "bg-[#f97316]";
      case "blue":
        return "bg-[#3b82f6]";
      default:
        return "bg-[#10b981]";
    }
  };

  // =====================================================
  // PAGE
  // =====================================================
  if (loading)
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-[60vh] items-center justify-center text-[#627d98]"
      >
        <FiRefreshCw className="h-7 w-7 animate-spin" />
      </div>
    );

  if (isError)
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-[#dc2626]"
      >
        <p className="text-sm font-semibold">{error || "Failed to load data."}</p>
        <button
          onClick={() => refetch()}
          className="rounded-xl bg-[#dc2626] px-4 py-2 text-xs font-bold text-white hover:bg-[#b91c1c] transition-colors"
        >
          Retry
        </button>
      </div>
    );

  return (
    <motion.div
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full min-w-0 space-y-6 overflow-x-hidden"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* =================================================
          HEADER
      ================================================= */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b879f]">
            {isArabic
              ? "الموارد البشرية / مقاييس الأداء"
              : "HR Portal / Performance Metrics"}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-[#1e293b] md:text-[21px]">
              {t("hrCommandCenter.title", "Performance Metrics")}
            </h1>

            {data?.period_name && (
              <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-[11px] font-semibold text-[#15803d]">
                {data.period_name}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm font-normal text-[#64748b]">
            {t("hrCommandCenter.subtitle", "Company performance overview.")}
          </p>
        </div>

        <motion.button
          type="button"
          onClick={() => navigate("/hr/ai-insights")}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#243B53] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c2f42]"
        >
          <LuSparkles className="h-4 w-4" />
          <span>{t("hrCommandCenter.explainToday", "Explain today")}</span>
        </motion.button>
      </motion.div>

      {/* =================================================
          ERROR
      ================================================= */}
      {error && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-5"
        >
          <p className="text-sm font-semibold text-[#dc2626]">{error}</p>
        </motion.div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}
      {loading && !data && (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#243B53]" />
        </div>
      )}

      {/* =================================================
          KPI CARDS — من company_summary
      ================================================= */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={itemVariants}
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

      {/* =================================================
          LOWER SECTION
      ================================================= */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_1fr]"
      >
        {/* --------------------------------------------
            DEPARTMENTS PERFORMANCE — من departments_performance.data
            New Department | 3 employees | 11.67% | Needs Attention
            tasks_rate: 0 | attendance_rate: 33.33 | quality_rate: 0
        --------------------------------------------- */}
        <motion.section
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-base font-bold text-[#1e293b] sm:text-lg">
                {t("hrCommandCenter.departmentsPerformance", "Departments performance")}
              </h2>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
              <FiInfo className="h-[18px] w-[18px]" />
            </div>
          </div>

          {departments.length === 0 && !loading ? (
            <p className="py-10 text-center text-sm text-[#94a3b8]">
              {t("hrCommandCenter.noDepartments", "No departments found")}
            </p>
          ) : (
            <div className="divide-y divide-[#f1f5f9]">
              {departments.map((dept) => {
                const styles = getDeptBadge(dept.status_label);

                // ✅ بارات القسم — من بياناته هو
                const deptBars = [
                  {
                    label: t("hrCommandCenter.tasksRate", "Tasks"),
                    value: Number(dept.tasks_rate ?? 0),
                    color: "bg-[#10b981]",
                  },
                  {
                    label: t("hrCommandCenter.qualityRate", "Quality"),
                    value: Number(dept.quality_rate ?? 0),
                    color: "bg-[#3b82f6]",
                  },
                  {
                    label: t("hrCommandCenter.attendanceRate", "Attendance"),
                    value: Number(dept.attendance_rate ?? 0),
                    color: "bg-[#f97316]",
                  },
                ];

                return (
                  <div
                    key={dept.department_id}
                    className="px-5 py-4 transition-colors hover:bg-[#fafbfc] sm:px-6"
                  >
                    {/* صف 1: أيقونة + اسم + بادج + سكور */}
                    <div className="flex min-h-[52px] items-center gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f8fafc] text-[#64748b]">
                        <FiUsers className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-bold text-[#1e293b]">
                            {dept.name}
                          </span>
                          {dept.status_label && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${styles.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
                              />
                              {dept.status_label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-5 text-[#64748b]">
                          {dept.total_employees}{" "}
                          {t("hrCommandCenter.employees", "employees")}
                        </p>
                      </div>

                      <div className="shrink-0 text-right rtl:text-left">
                        <span className="text-sm font-bold text-[#102a43]">
                          {fmt(dept.overall_score)}%
                        </span>
                      </div>
                    </div>

                    {/* صف 2: بارات القسم — من بياناته */}
                    <div className="mt-3 space-y-1.5 pr-1">
                      {deptBars.map((bar) => (
                        <div key={bar.label} className="flex items-center gap-2.5">
                          <span className="w-16 shrink-0 text-[10px] font-medium text-[#64748b]">
                            {bar.label}
                          </span>

                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef2f6]">
                            <div
                              className={`h-full rounded-full transition-all duration-[1200ms] ease-out ${bar.color}`}
                              style={{
                                width: progressStarted ? `${bar.value}%` : "0%",
                              }}
                            />
                          </div>

                          <span className="w-10 shrink-0 text-right text-[10px] font-bold text-[#334155] rtl:text-left">
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

          {/* Pagination */}
          {hasDeptsPagination && !loading && (
            <div className="flex items-center justify-between border-t border-[#f1f5f9] px-6 py-4">
              <button
                type="button"
                disabled={deptsCurrentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#334155] transition hover:bg-[#f8fafc] disabled:opacity-40"
              >
                {t("common.prev", "Prev")}
              </button>
              <span className="text-xs text-[#94a3b8]">
                {deptsCurrentPage} / {deptsLastPage}
              </span>
              <button
                type="button"
                disabled={deptsCurrentPage >= deptsLastPage}
                onClick={() => setPage((prev) => Math.min(deptsLastPage, prev + 1))}
                className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#334155] transition hover:bg-[#f8fafc] disabled:opacity-40"
              >
                {t("common.next", "Next")}
              </button>
            </div>
          )}
        </motion.section>

        {/* --------------------------------------------
            PERFORMANCE BREAKDOWN — من at_a_glance
            tasks_rate: 0 | quality_rate: 0 | attendance_rate: 25
        --------------------------------------------- */}
        <motion.section
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-5 sm:px-6">
            <h2 className="text-base font-bold text-[#1e293b] sm:text-lg">
              {t("hrCommandCenter.performanceBreakdown", "Performance breakdown")}
            </h2>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
              <FiInfo className="h-[18px] w-[18px]" />
            </div>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-6">
            {breakdownBars.map((item, index) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#64748b]">
                    {item.label}
                  </span>
                  <span className="text-xs font-bold text-[#1e293b]">
                    {fmt(item.value)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
                  <div
                    className={`h-full rounded-full transition-all duration-[1200ms] ease-out ${getProgressColor(
                      item.type,
                    )}`}
                    style={{
                      width: progressStarted ? `${item.value}%` : "0%",
                      transitionDelay: `${index * 120}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>

      {/* =================================================
          PERFORMANCE TREND — من performance_trend
      ================================================= */}
      <motion.section
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-6"
      >
        <h2 className="text-base font-bold text-[#1e293b] sm:text-lg">
          {t("hrCommandCenter.performanceTrend", "Performance trend")}
        </h2>
        <p className="mt-1 text-[11px] text-[#94a3b8]">
          {t(
            "hrCommandCenter.trendSubtitle",
            "Company overall score across the period months.",
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
                stroke="#10b981"
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
                  stroke="#10b981"
                  strokeWidth="2"
                />
              ))}
            </svg>

            <div className="mt-1 flex justify-between px-1 text-[10px] text-[#64748b]">
              {trendChart.points.map((point, index) => (
                <span key={index}>{point.label}</span>
              ))}
            </div>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-[#94a3b8]">
            {t("hrCommandCenter.noTrendData", "No trend data available")}
          </p>
        )}
      </motion.section>
    </motion.div>
  );
};

export default PerformanceMetrics;