import { useState, useMemo } from "react";
import {
  FiFileText,
  FiChevronDown,
  FiTrendingUp,
  FiArrowRight,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useEmployeePerformance } from "../../../hooks/usePerformance";

const Performance = () => {
  const { t, i18n } = useTranslation();

  const isArabic = i18n.language?.startsWith("ar");

  // =========================
  // STATES
  // =========================
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // =========================
  // DATA — GET /api/employee/performance
  // =========================
  const { data: perfData, isLoading: loading, isError, error, refetch } = useEmployeePerformance();

  // Derived values — fallback to safe defaults if API not ready yet
  const overallScore = useMemo(() => {
    const s = perfData?.overall?.score;
    return s != null ? Math.round(s) : 87;
  }, [perfData]);

  const scoreChange = useMemo(() => {
    return perfData?.overall?.change_label ?? "+5% from last month";
  }, [perfData]);

  const breakdown = useMemo(() => ({
    tasks:      perfData?.at_a_glance?.tasks_rate      ?? 92,
    quality:    perfData?.at_a_glance?.quality_rate    ?? 88,
    attendance: perfData?.at_a_glance?.attendance_rate ?? 95,
  }), [perfData]);

  const goals = useMemo(() => {
    const apiGoals = perfData?.metrics?.goals;
    if (!apiGoals) return [
      { title: t("employeePerformance.goals.completeFlutterTraining", "Complete Flutter training"), due: t("employeePerformance.goals.dueSep", "Sep 30"), progress: 75 },
      { title: t("employeePerformance.goals.leadCrossTeamWorkshop", "Lead one cross-team workshop"), due: t("employeePerformance.goals.dueOct", "Oct 15"), progress: 50 },
      { title: t("employeePerformance.goals.automateMonthlyReporting", "Automate monthly reporting"), due: t("employeePerformance.goals.dueNov", "Nov 01"), progress: 30 },
    ];
    return [
      { title: t("employeePerformance.goals.completed", "Goals Completed"), due: perfData?.period_name ?? "", progress: Math.round(apiGoals.completion_rate ?? 0) },
      { title: t("employeePerformance.goals.averageProgress", "Average Progress"), due: t("employeePerformance.goals.currentPeriod", "Current period"), progress: Math.round(apiGoals.average_progress ?? 0) },
    ];
  }, [perfData, isArabic, t]);

  const selectedYear = perfData?.period_name?.split(" ")[1] ?? new Date().getFullYear().toString();

  // =========================
  // YEARS
  // =========================

  const years = ["2026", "2025", "2024"];

  if (loading) return <div dir={isArabic ? "rtl" : "ltr"} className="min-h-[60vh] flex items-center justify-center text-[#627d98]"><FiRefreshCw className="h-7 w-7 animate-spin" /></div>;
  if (isError) return <div dir={isArabic ? "rtl" : "ltr"} className="min-h-[60vh] flex flex-col items-center justify-center gap-3"><FiAlertCircle className="h-9 w-9 text-rose-500" /><p className="text-sm text-[#627d98]">{error?.message}</p><button onClick={() => refetch()} className="px-4 py-2 bg-[#243b53] text-white rounded-lg text-xs font-semibold">{isArabic ? "إعادة المحاولة" : "Retry"}</button></div>;

  return (
    <>
      <style>
        {`
          @keyframes scoreCircle {
            from { transform: scale(0.85); opacity: 0.3; }
            to { transform: scale(1); opacity: 1; }
          }
          .score-animation { animation: scoreCircle 0.8s ease-out forwards; }

          @keyframes progressFill { from { width: 0; } }
          .progress-animation { animation: progressFill 1.1s ease-out both; }

          @keyframes chartLine {
            from { stroke-dashoffset: 700; opacity: 0; }
            to { stroke-dashoffset: 0; opacity: 1; }
          }
          .chart-line-animation {
            stroke-dasharray: 700;
            animation: chartLine 1.4s ease-out forwards;
          }

          @keyframes chartArea { from { opacity: 0; } to { opacity: 1; } }
          .chart-area-animation { animation: chartArea 1.2s ease-out forwards; }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .performance-card { animation: fadeUp 0.45s ease-out both; }

          @keyframes modalIn {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .review-modal-animation { animation: modalIn 0.2s ease-out forwards; }
        `}
      </style>

      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-[#f5f7f8] text-[#243b53]"
      >
        {/* PAGE HEADER */}
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5b8c6a]">
              {t("employeePerformance.eyebrow", "GROWTH & DEVELOPMENT")}
            </p>

            <h1 className="text-[29px] font-bold leading-[1.15] tracking-[-0.7px] text-[#102a43]">
              {t("employeePerformance.title", "My performance")}
            </h1>

            <p className="mt-1 text-[13px] text-[#627d98]">
              {t(
                "employeePerformance.subtitle",
                "A clear view of your progress and goals.",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="flex h-[46px] items-center gap-2 rounded-[7px] border border-[#d9e2ec] bg-white px-4 text-[12px] font-semibold text-[#243b53] transition-all duration-200 hover:bg-[#f8fafb] hover:shadow-sm active:scale-[0.98]"
          >
            <FiFileText className="h-4 w-4 text-[#486581]" />
            <span>
              {t("employeePerformance.viewReviewHistory", "View review history")}
            </span>
          </button>
        </div>

        {/* TOP CARDS */}
        <div
          dir="ltr"
          className="grid grid-cols-1 gap-4 xl:grid-cols-[248px_310px_minmax(0,1fr)]"
        >
          {/* OVERALL SCORE */}
          <div
            dir={isArabic ? "rtl" : "ltr"}
            className="performance-card min-h-[300px] rounded-[11px] border border-[#d9e2ec] bg-white p-[22px]"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[15px] font-medium text-[#243b53]">
                  {t("employeePerformance.overallScore", "Overall score")}
                </h2>
                <p className="mt-1 text-[11px] text-[#627d98]">
                  {t(
                    "employeePerformance.currentPerformancePeriod",
                    "Current performance period",
                  )}
                </p>
              </div>
              <FiTrendingUp className="mt-1 h-[18px] w-[18px] text-[#829ab1]" />
            </div>

            <div className="mt-[21px] flex justify-center">
              <div
                className="score-animation relative flex h-[150px] w-[150px] items-center justify-center rounded-full transition-all duration-700"
                style={{
                  // ✅ الدايرة بقت ديناميكية حسب overallScore بدل 313deg ثابتة
                  background: `conic-gradient(#5b8c6a 0deg ${
                    overallScore * 3.6
                  }deg, #e7eef0 ${overallScore * 3.6}deg 360deg)`,
                }}
              >
                <div className="flex h-[132px] w-[132px] flex-col items-center justify-center rounded-full bg-white">
                  <div className="flex items-start leading-none">
                    <span
                      className={`text-[31px] font-bold tracking-[-1px] text-[#102a43] transition-opacity ${
                        loading ? "opacity-40" : ""
                      }`}
                    >
                      {overallScore}
                    </span>
                    <span className="mt-[3px] text-[14px] font-semibold text-[#243b53]">
                      %
                    </span>
                  </div>
                  <span className="mt-1 text-[10px] text-[#627d98]">
                    {t("employeePerformance.overallScore", "Overall score")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-[21px] flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#4f8563]">
              <FiTrendingUp className="h-[14px] w-[14px]" />
              <span>{scoreChange}</span>
            </div>
          </div>

          {/* AT A GLANCE */}
          <div
            dir={isArabic ? "rtl" : "ltr"}
            className="performance-card min-h-[300px] rounded-[11px] border border-[#d9e2ec] bg-white p-[22px]"
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="text-[15px] font-medium text-[#243b53]">
              {t("employeePerformance.atAGlance", "At a glance")}
            </h2>
            <p className="mt-1 text-[11px] text-[#627d98]">
              {t(
                "employeePerformance.performanceBreakdown",
                "Performance breakdown",
              )}
            </p>

            <div className="mt-[25px] space-y-[21px]">
              {[
                {
                  label: t("employeePerformance.tasksCompleted", "Tasks completed"),
                  value: breakdown.tasks,
                  color: "bg-[#5b8c6a]",
                  delay: "0.2s",
                },
                {
                  label: t("employeePerformance.qualityOfWork", "Quality of work"),
                  value: breakdown.quality,
                  color: "bg-[#70a5c3]",
                  delay: "0.35s",
                },
                {
                  label: t("employeePerformance.attendance", "Attendance"),
                  value: breakdown.attendance,
                  color: "bg-[#d3a054]",
                  delay: "0.5s",
                },
              ].map((item, index) => (
                <div key={index}>
                  <div className="mb-[8px] flex items-center justify-between">
                    <span className="text-[11px] text-[#627d98]">{item.label}</span>
                    <span className="text-[10px] font-bold text-[#102a43]">
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-[6px] overflow-hidden rounded-full bg-[#edf2f4]">
                    <div
                      className={`progress-animation h-full rounded-full ${item.color}`}
                      style={{ width: `${item.value}%`, animationDelay: item.delay }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PERFORMANCE TREND */}
          <div
            dir={isArabic ? "rtl" : "ltr"}
            className="performance-card min-h-[300px] rounded-[11px] border border-[#d9e2ec] bg-white p-[22px]"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[15px] font-medium text-[#243b53]">
                  {t("employeePerformance.performanceTrend", "Performance trend")}
                </h2>
                <p className="mt-1 text-[11px] text-[#627d98]">
                  {t(
                    "employeePerformance.performanceLastSixMonths",
                    "Your score over the last six months.",
                  )}
                </p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setYearMenuOpen((prev) => !prev)}
                  className="flex h-[38px] items-center gap-3 rounded-[7px] border border-[#d9e2ec] bg-white px-3 text-[11px] font-medium text-[#243b53] transition-all duration-200 hover:border-[#b8c8d6] hover:shadow-sm active:scale-[0.98]"
                >
                  <span>{selectedYear}</span>
                  <FiChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      yearMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {yearMenuOpen && (
                  <div
                    className={`absolute top-[43px] z-30 min-w-[100px] overflow-hidden rounded-[8px] border border-[#d9e2ec] bg-white py-1 shadow-lg ${
                      isArabic ? "left-0" : "right-0"
                    }`}
                  >
                    {years.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          setSelectedYear(year);
                          setYearMenuOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-sm transition-colors hover:bg-[#f5f7f8] ${
                          selectedYear === year
                            ? "font-semibold text-[#5b8c6a]"
                            : "text-[#243b53]"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-[23px]">
              <svg
                viewBox="0 0 500 145"
                className="h-[145px] w-full"
                preserveAspectRatio="none"
              >
                <line x1="0" y1="25" x2="500" y2="25" stroke="#edf2f4" strokeWidth="1" strokeDasharray="2 3" />
                <line x1="0" y1="62" x2="500" y2="62" stroke="#edf2f4" strokeWidth="1" strokeDasharray="2 3" />
                <line x1="0" y1="99" x2="500" y2="99" stroke="#edf2f4" strokeWidth="1" strokeDasharray="2 3" />

                <path
                  d="M 0 101 C 28 97, 40 94, 75 91 C 102 88, 112 88, 140 78 C 162 71, 173 80, 198 75 C 225 70, 238 67, 265 66 C 293 65, 305 70, 330 58 C 354 47, 374 51, 397 45 C 421 39, 430 30, 455 29 C 475 28, 487 25, 500 22 L 500 125 L 0 125 Z"
                  fill="#eef5f1"
                  className="chart-area-animation"
                />
                <path
                  d="M 0 101 C 28 97, 40 94, 75 91 C 102 88, 112 88, 140 78 C 162 71, 173 80, 198 75 C 225 70, 238 67, 265 66 C 293 65, 305 70, 330 58 C 354 47, 374 51, 397 45 C 421 39, 430 30, 455 29 C 475 28, 487 25, 500 22"
                  fill="none"
                  stroke="#5b8c6a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="chart-line-animation"
                />

                <circle cx="0" cy="101" r="3" fill="white" stroke="#5b8c6a" strokeWidth="2" />
                <circle cx="75" cy="91" r="3" fill="white" stroke="#5b8c6a" strokeWidth="2" />
                <circle cx="140" cy="78" r="3" fill="white" stroke="#5b8c6a" strokeWidth="2" />
                <circle cx="265" cy="66" r="3" fill="white" stroke="#5b8c6a" strokeWidth="2" />
                <circle cx="397" cy="45" r="3" fill="white" stroke="#5b8c6a" strokeWidth="2" />
                <circle cx="500" cy="22" r="3" fill="white" stroke="#5b8c6a" strokeWidth="2" />
              </svg>

              <div className="mt-[2px] flex justify-between px-[1px] text-[10px] text-[#627d98]">
                <span>{t("employeePerformance.months.apr", "Apr")}</span>
                <span>{t("employeePerformance.months.may", "May")}</span>
                <span>{t("employeePerformance.months.jun", "Jun")}</span>
                <span>{t("employeePerformance.months.jul", "Jul")}</span>
                <span>{t("employeePerformance.months.aug", "Aug")}</span>
                <span>{t("employeePerformance.months.sep", "Sep")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CURRENT GOALS */}
        <div
          className="performance-card mt-4 rounded-[11px] border border-[#d9e2ec] bg-white px-[22px] pb-[15px]"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-start justify-between border-b border-[#e6edf2] py-[23px]">
            <div>
              <h2 className="text-[15px] font-medium text-[#243b53]">
                {t("employeePerformance.currentGoals", "Current goals")}
              </h2>
              <p className="mt-1 text-[11px] text-[#627d98]">
                {t("employeePerformance.developmentPlan", "Development plan")}
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-[#4f8563] transition-opacity hover:opacity-75"
            >
              <span>{t("employeePerformance.viewAll", "View all")}</span>
              <FiArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div>
            {goals.map((goal, index) => (
              <div
                key={index}
                className={`flex min-h-[67px] items-center justify-between gap-5 ${
                  index !== goals.length - 1 ? "border-b border-[#e6edf2]" : ""
                }`}
              >
                <div>
                  <h3 className="text-[12px] font-semibold text-[#102a43]">
                    {goal.title}
                  </h3>
                  <p className="mt-1 text-[10px] text-[#627d98]">
                    {t("employeePerformance.due", "Due")} {goal.due}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="min-w-[35px] text-right text-[11px] font-semibold text-[#315b82]">
                    {goal.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REVIEW HISTORY MODAL */}
      {reviewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a43]/40 px-4 backdrop-blur-[2px]"
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            dir={isArabic ? "rtl" : "ltr"}
            className="review-modal-animation w-full max-w-[480px] rounded-[14px] border border-[#d9e2ec] bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#e6edf2] pb-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <FiFileText className="h-4 w-4 text-[#5b8c6a]" />
                  <h2 className="text-[16px] font-semibold text-[#102a43]">
                    {t("employeePerformance.reviewHistory.title", "Review history")}
                  </h2>
                </div>
                <p className="text-[11px] text-[#627d98]">
                  {t("employeePerformance.reviewHistory.subtitle", "Previous reviews")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#627d98] transition hover:bg-[#f5f7f8] hover:text-[#243b53]"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-[9px] border border-[#e6edf2] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef5f1]">
                    <FiCheckCircle className="h-4 w-4 text-[#5b8c6a]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#102a43]">
                      {t("employeePerformance.reviewHistory.midYear", "Mid-year review")}
                    </p>
                    <p className="mt-1 text-[10px] text-[#627d98]">
                      {t("employeePerformance.reviewHistory.midYearDate", "June 2026")}
                    </p>
                  </div>
                </div>
                <span className="text-[12px] font-bold text-[#5b8c6a]">87%</span>
              </div>

              <div className="flex items-center justify-between rounded-[9px] border border-[#e6edf2] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef5f1]">
                    <FiCheckCircle className="h-4 w-4 text-[#5b8c6a]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#102a43]">
                      {t("employeePerformance.reviewHistory.lastReview", "Last review")}
                    </p>
                    <p className="mt-1 text-[10px] text-[#627d98]">
                      {t("employeePerformance.reviewHistory.lastReviewDate", "January 2026")}
                    </p>
                  </div>
                </div>
                <span className="text-[12px] font-bold text-[#5b8c6a]">82%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="mt-5 h-[40px] w-full rounded-[7px] bg-[#243b53] text-[12px] font-semibold text-white transition hover:bg-[#102a43] active:scale-[0.99]"
            >
              {t("employeePerformance.reviewHistory.close", "Close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Performance;