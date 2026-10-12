import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import CheckInOutWidget from "../../../components/CheckInOutWidget";
import useManagerDashboard from "../hooks/useManagerDashboard";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// TODO: make sure these match the paths registered in your Manager routes.
const MANAGER_ROUTES = {
  taskManagement: "/manager/tasks",
  submissionReviews: "/manager/submissions",
};

// Employees flagged by the AI workload alert (keys match `managerTasks.*` member names)
const CARD_BASE =
  "bg-white rounded-2xl border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]";

// ======================== Skeleton Loading ========================
const ManagerDashboardSkeleton = () => (
  <>
    {/* KPI cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`${CARD_BASE} p-5`}>
          <div className="flex h-4 items-center">
            <div className="h-3 w-24 rounded bg-slate-200" />
          </div>
          <div className="mt-2 flex h-10 items-center">
            <div className="h-7 w-16 rounded bg-slate-200" />
          </div>
          <div className="mt-1 flex h-4 items-center">
            <div className="h-3 w-32 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>

    {/* Alert + Queue */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
      <div className={`${CARD_BASE} p-6`}>
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="mt-3 h-5 w-56 rounded bg-slate-200" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full max-w-md rounded bg-slate-200" />
          <div className="h-3 w-3/4 max-w-sm rounded bg-slate-200" />
        </div>
        <div className="mt-5 h-10 w-36 rounded-lg bg-slate-200" />
      </div>

      <div className={`${CARD_BASE} p-6`}>
        <div className="mb-3 h-5 w-44 rounded bg-slate-200" />
        <div className="divide-y divide-[#f1f5f9]">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3.5 first:pt-3 last:pb-0"
            >
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-3 w-28 rounded bg-slate-200" />
              </div>
              <div className="h-4 w-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

const TeamDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading, error, errorMessage, refetch } = useManagerDashboard();

  const kpis = data?.kpis;
  const workloadAlert = data?.widgets?.workload_alert;
  const pendingQueue = Array.isArray(data?.widgets?.pending_action_queue)
    ? data.widgets.pending_action_queue
    : [];

  const attendance = kpis?.attendance_today;

  // Texts are displayed exactly as the backend sends them (already localized by App-Language)
  const kpiCards = [
    {
      id: "directReports",
      label: kpis?.direct_reports?.label || t("managerDashboard.directReports", "Direct Reports"),
      value: kpis?.direct_reports?.value ?? 0,
      note: kpis?.direct_reports?.subtext,
    },
    {
      id: "activeTasks",
      label: kpis?.active_tasks?.label || t("managerDashboard.activeTasks", "Active Tasks"),
      value: kpis?.active_tasks?.value ?? 0,
      note: kpis?.active_tasks?.subtext,
    },
    {
      id: "pendingSubmissions",
      label:
        kpis?.pending_submissions?.label ||
        t("managerDashboard.pendingSubmissions", "Pending Submissions"),
      value: kpis?.pending_submissions?.value ?? 0,
      note: kpis?.pending_submissions?.subtext,
    },
    {
      id: "attendanceToday",
      label: attendance?.label || t("managerDashboard.attendanceToday", "Attendance Today"),
      value: attendance?.formatted ?? `${attendance?.count ?? 0}/${attendance?.total ?? 0}`,
      note: attendance?.subtext,
    },
  ];

  // No assignee IDs come from the API, so no filter state is passed.
  const handleRebalanceTasks = () => navigate(MANAGER_ROUTES.taskManagement);

  const handleReview = (queueId) =>
    navigate(MANAGER_ROUTES.submissionReviews, {
      state: { submissionQueueId: queueId },
    });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="w-full space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={fadeUp} transition={{ duration: 0.25, ease: "easeOut" }}>
        {/* Breadcrumb — was missing before, matches the UI design */}
        <p className="text-[11px] font-bold tracking-wider text-[#6b879f] uppercase">
          {t("managerDashboard.breadcrumb", "Manager Portal / Team Dashboard")}
        </p>
        <h1 className="text-lg md:text-[21px] font-bold text-[#1e293b] tracking-tight mt-1">
          {t("managerDashboard.title", "Team Dashboard")}
        </h1>
        <p className="text-sm text-[#64748b] mt-1 font-normal">
          {t(
            "managerDashboard.subtitle",
            "Keep your team aligned, supported, and moving forward.",
          )}
        </p>

        {/* Check-in / Check-out */}
        <div className="mt-4">
          <CheckInOutWidget compact />
        </div>
      </motion.div>

      {/* Metrics Cards */}
      {/* Loading */}
      {loading && <ManagerDashboardSkeleton />}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4">
          <p className="text-sm text-[#b91c1c]">
            {errorMessage ||
              t("managerDashboard.loadError", "Failed to load dashboard data.")}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="shrink-0 text-sm font-semibold text-[#2f6f4d] hover:text-[#23583c] transition"
          >
            {t("managerDashboard.retry", "Try again")}
          </button>
        </div>
      )}

      {/* Loaded */}
      {!loading && !error && data && (
        <>
          {/* Metrics Cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {kpiCards.map((card) => (
              <motion.div
                key={card.id}
                variants={fadeUp}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`${CARD_BASE} p-5`}
              >
                <p className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                  {card.label}
                </p>
                <p className="text-[27px] font-bold text-[#0f172a] mt-2 tracking-tight">
                  {card.value}
                </p>
                {/* min-h keeps card height equal when a KPI has no subtext */}
                <p className="text-xs text-[#64748b] mt-1 min-h-[1rem]">{card.note}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* AI Alert + Pending Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workload Alert */}
            {workloadAlert?.has_alert ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`${CARD_BASE} p-6 border-l-4 rtl:border-l border-l-[#ef4444] rtl:border-r-4 rtl:border-r-[#ef4444] relative`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[#dc2626] uppercase">
                      {workloadAlert.type ||
                        t("managerDashboard.aiWorkloadAlert", "AI Workload Alert")}
                    </p>
                    <h2 className="text-lg font-bold text-[#1e293b] mt-1.5">
                      {workloadAlert.title}
                    </h2>
                    <p className="text-sm text-[#64748b] mt-2 leading-relaxed max-w-md">
                      {workloadAlert.description}
                    </p>
                  </div>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fee2e2] text-[#dc2626]">
                    <FiAlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleRebalanceTasks}
                  className="mt-5 rounded-lg bg-[#243B53] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1c2f42] transition"
                >
                  {workloadAlert.action ||
                    t("managerDashboard.rebalanceTasks", "Rebalance Tasks")}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`${CARD_BASE} p-6`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-[#64748b] leading-relaxed">
                    {t(
                      "managerDashboard.noWorkloadAlert",
                      "No workload alerts right now. Your team's workload looks balanced.",
                    )}
                  </p>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[#16a34a]">
                    <FiCheckCircle className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pending Action Queue */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
              className={`${CARD_BASE} p-6`}
            >
              <h2 className="text-base font-bold text-[#1e293b] mb-2">
                {t("managerDashboard.pendingActionQueue", "Pending action queue")}
              </h2>

              {pendingQueue.length === 0 ? (
                <p className="py-4 text-sm text-[#64748b]">
                  {t(
                    "managerDashboard.noPendingSubmissions",
                    "No pending submissions to review.",
                  )}
                </p>
              ) : (
                <div className="divide-y divide-[#f1f5f9]">
                  {pendingQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3.5 first:pt-3 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1e293b]">{item.title}</p>
                        <p className="text-xs text-[#64748b] mt-0.5">
                          {[item.submitted_by, item.created_at].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReview(item.id)}
                        className="text-sm font-semibold text-[#2f6f4d] hover:text-[#23583c] transition shrink-0 ms-3"
                      >
                        {item.action_label || t("managerDashboard.review", "Review")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default TeamDashboard;