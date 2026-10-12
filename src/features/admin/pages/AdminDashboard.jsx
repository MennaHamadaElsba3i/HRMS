import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FiUsers,
  FiFileText,
  FiMoreHorizontal,
  FiChevronRight,
  FiCheckCircle,
  FiX,
  FiDownload,
  FiRefreshCw,
  FiMapPin,
  FiInfo,
  FiAlertTriangle,
  FiAlertCircle,
  FiSearch,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import useOwnerDashboard from "../hooks/useOwnerDashboard";

const SEVERITY_META = {
  success: {
    icon: FiCheckCircle,
    bg: "bg-[#ecfdf5]",
    color: "text-[#10b981]",
    badge: "bg-[#ecfdf5] text-[#16a34a]",
    dot: "bg-[#16a34a]",
  },
  info: {
    icon: FiInfo,
    bg: "bg-[#e0f2fe]",
    color: "text-[#0284c7]",
    badge: "bg-[#f1f5f9] text-[#475569]",
    dot: "bg-[#64748b]",
  },
  warning: {
    icon: FiAlertTriangle,
    bg: "bg-[#ffedd5]",
    color: "text-[#f97316]",
    badge: "bg-[#fff7ed] text-[#c2410c]",
    dot: "bg-[#f97316]",
  },
  error: {
    icon: FiAlertCircle,
    bg: "bg-[#fee2e2]",
    color: "text-[#dc2626]",
    badge: "bg-[#fee2e2] text-[#dc2626]",
    dot: "bg-[#dc2626]",
  },
};
const NEUTRAL_META = {
  icon: FiFileText,
  bg: "bg-[#f1f5f9]",
  color: "text-[#64748b]",
  badge: "bg-[#f1f5f9] text-[#64748b]",
  dot: "bg-[#64748b]",
};
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-[#e2e8f0] ${className}`} />
);

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith("ar");

  const { data, loading, error, errorMessage, refetch } = useOwnerDashboard();

  const kpis = data?.kpis;
  const apiActivities = data?.recent_activities ?? [];
  const quickUsers = data?.quick_view_users ?? [];
  const nf = useMemo(
    () => new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US"),
    [isRtl],
  );
  const fmt = (v) => (v === null || v === undefined ? "—" : nf.format(v));
  const showSkeleton = loading && !data;

  const [menuOpen, setMenuOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const [toast, setToast] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const [modal, setModal] = useState({
    open: false,
    type: "",
    title: "",
    items: [],
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // --------------------------------------------------
  // Framer Motion
  // --------------------------------------------------

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 18,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: "easeOut",
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: "easeOut",
      },
    },
  };

  const rowVariants = {
    hidden: {
      opacity: 0,
      x: isRtl ? 15 : -15,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -8,
      scale: 0.97,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.18,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -8,
      scale: 0.97,
      transition: {
        duration: 0.15,
      },
    },
  };

  const modalBackdropVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.15,
      },
    },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      y: 25,
      scale: 0.96,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: 15,
      scale: 0.97,
      transition: {
        duration: 0.2,
      },
    },
  };

  const toastVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      scale: 0.96,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -15,
      scale: 0.96,
      transition: {
        duration: 0.2,
      },
    },
  };

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const showToast = (title, message) => {
    setToast({
      visible: true,
      title,
      message,
    });

    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        visible: false,
      }));
    }, 3000);
  };

  const closeModal = () => {
    setModal({
      open: false,
      type: "",
      title: "",
      items: [],
    });
  };

  const openModal = (type, title, items = []) => {
    setModal({
      open: true,
      type,
      title,
      items,
    });
  };

  // --------------------------------------------------
  // KPI cards (all values come from data.kpis)
  // --------------------------------------------------

  const metrics = [
    {
      id: "users",
      kpi: kpis?.total_users,
      titleKey: "adminDashboard.totalUsers",
      titleDefault: "Total users",
      value: fmt(kpis?.total_users?.value),
      hasSubtext: true,
      icon: FiUsers,
      bg: "bg-[#ecfdf5]",
      color: "text-[#10b981]",
    },
    {
      id: "branches",
      kpi: kpis?.branch_locations,
      titleKey: "adminDashboard.branchLocations",
      titleDefault: "Branch locations",
      value: fmt(kpis?.branch_locations?.value),
      icon: FiMapPin,
      bg: "bg-[#fef2f2]",
      color: "text-[#ef4444]",
    },
    {
      id: "review",
      kpi: kpis?.review_completion,
      titleKey: "adminDashboard.reviewCompletion",
      titleDefault: "Review completion",
      value:
        kpis?.review_completion?.formatted ??
        (kpis?.review_completion?.value === undefined ||
        kpis?.review_completion?.value === null
          ? "—"
          : `${nf.format(kpis.review_completion.value)}%`),
      icon: FiCheckCircle,
      bg: "bg-[#ecfeff]",
      color: "text-[#06b6d4]",
    },
    {
      id: "policies",
      kpi: kpis?.active_policies,
      titleKey: "adminDashboard.publishedPolicies",
      titleDefault: "Published policies",
      value: fmt(kpis?.active_policies?.value),
      icon: FiFileText,
      bg: "bg-[#fff7ed]",
      color: "text-[#f97316]",
    },
  ];

  // --------------------------------------------------
  // Recent activity
  // --------------------------------------------------

  const recentActivities = apiActivities.map((a) => {
    const meta =
      SEVERITY_META[String(a.severity || "").trim().toLowerCase()] ||
      NEUTRAL_META;
    return {
      id: a.id,
      title: a.action || "—",
      desc: a.user_name || "",
      time: a.timestamp || "",
      severity: a.severity || "",
      ...meta,
    };
  });

  // --------------------------------------------------
  // Quick view users (client-side search over API data)
  // --------------------------------------------------

  const filteredUsers = quickUsers.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.name || "").toLowerCase().includes(q) ||
      String(u.job_title || "").toLowerCase().includes(q)
    );
  });

  // --------------------------------------------------
  // Actions
  // --------------------------------------------------

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      kpis: data?.kpis ?? null,
      quickViewUsers: quickUsers,
      recentActivities: apiActivities,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "admin-dashboard-report.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setMenuOpen(false);

    showToast(
      t("adminDashboard.exportSuccessTitle", "Export successful"),
      t(
        "adminDashboard.exportSuccessMessage",
        "Dashboard report exported successfully.",
      ),
    );
  };

  const handleRefresh = async () => {
    setMenuOpen(false);
    setIsRefreshing(true);

    const ok = await refetch();

    setIsRefreshing(false);

    if (ok) {
      showToast(
        t("adminDashboard.refreshSuccessTitle", "Data refreshed"),
        t(
          "adminDashboard.refreshSuccessMessage",
          "Dashboard data has been refreshed successfully.",
        ),
      );
    }
  };

  const handleSeeActivity = () => {
    openModal(
      "activity",
      t("adminDashboard.recentCriticalActivities", "Recent critical system activities"),
      recentActivities,
    );
  };

  return (
    <>
      <motion.div
        className="w-full space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-[28px] font-bold text-[#1e293b] tracking-tight">
              {t("adminDashboard.dashboard", "Dashboard")}
            </h1>

            <p className="text-sm text-[#64748b] mt-1 font-normal">
              {t(
                "adminDashboard.overviewSubtitle",
                "Manage your organization's people, access, and settings.",
              )}
            </p>
          </div>

          <div className="relative">
            <motion.button
              whileHover={{
                scale: 1.05,
              }}
              whileTap={{
                scale: 0.94,
              }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#1e293b] hover:bg-[#f8fafc] shadow-xs transition"
              aria-label="More options"
            >
              <FiMoreHorizontal className="w-5 h-5" />
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`absolute ${isRtl ? "left-0" : "right-0"
                    } mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#e2e8f0] py-1.5 z-20 text-xs`}
                >
                  <motion.button
                    whileHover={{
                      x: isRtl ? -3 : 3,
                    }}
                    onClick={handleExportReport}
                    className={`w-full ${isRtl ? "text-right" : "text-left"
                      } px-4 py-2.5 hover:bg-[#f8fafc] text-[#1e293b] flex items-center gap-2`}
                  >
                    <FiDownload className="w-3.5 h-3.5 text-[#64748b]" />
                    {t("adminDashboard.exportReport", "Export report")}
                  </motion.button>

                  <motion.button
                    whileHover={{
                      x: isRtl ? -3 : 3,
                    }}
                    onClick={handleRefresh}
                    className={`w-full ${isRtl ? "text-right" : "text-left"
                      } px-4 py-2.5 hover:bg-[#f8fafc] text-[#1e293b] flex items-center gap-2`}
                  >
                    <FiRefreshCw className="w-3.5 h-3.5 text-[#64748b]" />
                    {t("adminDashboard.refreshData", "Refresh data")}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4">
            <p className="text-sm text-[#b91c1c]">
              {errorMessage ||
                t("adminDashboard.loadError", "Failed to load dashboard data.")}
            </p>
            <button
              type="button"
              onClick={refetch}
              className="shrink-0 text-sm font-semibold text-[#2f6f4d] hover:text-[#23583c]"
            >
              {t("adminDashboard.retry", "Try again")}
            </button>
          </div>
        )}

        {/* KPI Cards Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <motion.div
                key={metric.id}
                variants={cardVariants}
                whileHover={{
                  y: -4,
                  transition: {
                    duration: 0.2,
                  },
                }}
                className="bg-white rounded-2xl p-5 border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <motion.div
                    whileHover={{
                      rotate: 5,
                      scale: 1.08,
                    }}
                    className={`w-10 h-10 rounded-xl ${metric.bg} ${metric.color} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-[#64748b]">
                    {metric.kpi?.label ||
                      t(metric.titleKey, metric.titleDefault)}
                  </p>

                  {showSkeleton ? (
                    <Skeleton className="h-8 w-20 mt-2" />
                  ) : (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.35 }}
                      className="text-3xl font-bold text-[#0f172a] mt-1 tracking-tight"
                    >
                      {metric.value}
                    </motion.p>
                  )}

                  {showSkeleton && metric.hasSubtext ? (
                    <Skeleton className="h-3 w-28 mt-2" />
                  ) : (
                    metric.kpi?.subtext && (
                      <p className="text-xs text-[#64748b] mt-1">
                        {metric.kpi.subtext}
                      </p>
                    )
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Recent Activity (table) */}
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-2xl p-6 border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-[#1e293b]">
                {t(
                  "adminDashboard.recentCriticalActivities",
                  "Recent critical system activities",
                )}
              </h2>

              <p className="text-xs text-[#64748b] mt-0.5 font-normal">
                {t(
                  "adminDashboard.recentCriticalActivitiesSubtitle",
                  "The latest administrative and security events.",
                )}
              </p>
            </div>

            <motion.button
              whileHover={{
                x: isRtl ? -3 : 3,
              }}
              whileTap={{
                scale: 0.96,
              }}
              onClick={handleSeeActivity}
              className="text-xs font-semibold text-[#2f6f4d] hover:text-[#23583c] flex items-center gap-1 transition"
            >
              <span>{t("adminDashboard.seeActivity", "See activity")}</span>

              <FiChevronRight
                className={`w-3.5 h-3.5 stroke-[2.5] ${isRtl ? "rotate-180" : ""
                  }`}
              />
            </motion.button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="pb-3 text-start text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                    {t("adminDashboard.colUser", "User")}
                  </th>
                  <th className="pb-3 text-start text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                    {t("adminDashboard.colAction", "Action")}
                  </th>
                  <th className="pb-3 text-start text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                    {t("adminDashboard.colTimestamp", "Timestamp")}
                  </th>
                  <th className="pb-3 text-start text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                    {t("adminDashboard.colSeverity", "Severity")}
                  </th>
                </tr>
              </thead>

              {showSkeleton ? (
                <tbody className="divide-y divide-[#f1f5f9]">
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="py-3.5">
                        <Skeleton className="h-3.5 w-28" />
                      </td>
                      <td className="py-3.5">
                        <Skeleton className="h-3.5 w-48" />
                      </td>
                      <td className="py-3.5">
                        <Skeleton className="h-3 w-20" />
                      </td>
                      <td className="py-3.5">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <motion.tbody
                  variants={containerVariants}
                  className="divide-y divide-[#f1f5f9]"
                >
                  {recentActivities.map((act) => (
                    <motion.tr
                      key={act.id}
                      variants={rowVariants}
                      onClick={() => openModal("activity", act.title, [act])}
                      className="cursor-pointer hover:bg-[#f8fafc] transition"
                    >
                      <td className="py-3.5 pe-3 text-sm font-semibold text-[#1e293b]">
                        {act.desc || "—"}
                      </td>
                      <td className="py-3.5 pe-3 text-sm text-[#64748b]">
                        {act.title}
                      </td>
                      <td className="py-3.5 pe-3 text-xs text-[#94a3b8] whitespace-nowrap">
                        {act.time}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${act.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${act.dot}`}
                          />
                          {act.severity || "—"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              )}
            </table>
          </div>

          {!loading && recentActivities.length === 0 && (
            <p className="py-4 text-sm text-[#64748b]">
              {t("adminDashboard.noActivity", "No recent activity.")}
            </p>
          )}
        </motion.div>

        {/* Quick View Users */}
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-2xl p-6 border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1e293b]">
                {t("adminDashboard.quickView", "Quick view")}
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5 font-normal">
                {t(
                  "adminDashboard.quickViewSubtitle",
                  "Recently active people in your workspace.",
                )}
              </p>
            </div>

            <div className="relative w-full max-w-[260px]">
              <FiSearch
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] mt-1.5 ${isRtl ? "right-3" : "left-3"
                  }`}
              />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                aria-label={t("adminDashboard.searchUsers", "Search users")}
                className={`w-full h-9 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-xs text-[#1e293b] outline-none focus:border-[#10b981] ${isRtl ? "pr-9 pl-3" : "pl-9 pr-3"
                  }`}
              />
            </div>
          </div>

          {showSkeleton ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#e2e8f0]"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
          ) : !loading && filteredUsers.length === 0 ? (
            <p className="text-sm text-[#64748b]">
              {t("adminDashboard.noUsers", "No users to show.")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUsers.map((u) => {
                const isActive =
                  String(u.status || "").toLowerCase() === "active";
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#e2e8f0]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center shrink-0 text-sm font-bold">
                        {(u.name || "?").trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#1e293b] truncate">
                          {u.name || "—"}
                        </h4>
                        <p className="text-xs text-[#64748b] mt-0.5 truncate">
                          {u.job_title || "—"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${isActive
                        ? "bg-[#ecfdf5] text-[#16a34a]"
                        : "bg-[#f1f5f9] text-[#64748b]"
                        }`}
                    >
                      {isActive
                        ? t("usersPage.statusActive", "Active")
                        : t("usersPage.statusInactive", "Inactive")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Refresh Overlay */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
              }}
              className="bg-white rounded-2xl shadow-xl border border-[#e2e8f0] px-5 py-4 flex items-center gap-3"
            >
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <FiRefreshCw className="w-5 h-5 text-[#3f7d5a]" />
              </motion.div>

              <span className="text-sm font-medium text-[#334e68]">
                {t("adminDashboard.refreshing", "Refreshing data...")}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed top-5 ${isRtl ? "left-5" : "right-5"
              } z-[120] flex items-center gap-3 rounded-xl border border-[#d9e2ec] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(16,42,67,0.12)]`}
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-[#e8f3eb] text-[#3f7d5a]">
              <FiCheckCircle size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#243B53]">
                {toast.title}
              </p>

              <p className="mt-0.5 text-xs text-[#829ab1]">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Modal */}
      <AnimatePresence>
        {modal.open && (
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeModal}
            className="fixed inset-0 z-[110] bg-slate-950/30 backdrop-blur-[2px] flex items-center justify-center p-4"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef2f7]">
                <div>
                  <h3 className="text-base font-bold text-[#1e293b]">
                    {modal.title}
                  </h3>

                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    {t(
                      "adminDashboard.recentCriticalActivitiesSubtitle",
                      "The latest administrative and security events.",
                    )}
                  </p>
                </div>

                <motion.button
                  whileHover={{
                    scale: 1.05,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  onClick={closeModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b]"
                >
                  <FiX className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Modal Content */}
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {modal.type === "activity" && (
                  <div className="space-y-3">
                    {modal.items.map((item) => {
                      const Icon = item.icon;

                      return (
                        <motion.div
                          key={item.id}
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className="flex items-start gap-3 p-3 rounded-xl border border-[#e2e8f0]"
                        >
                          <div
                            className={`w-10 h-10 rounded-full ${item.bg} ${item.color} flex items-center justify-center shrink-0`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-[#1e293b]">
                              {item.title}
                            </h4>

                            <p className="text-xs text-[#64748b] mt-1">
                              {item.desc}
                            </p>

                            <span className="inline-block text-[11px] text-[#94a3b8] mt-1.5">
                              {item.time}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 border-t border-[#eef2f7] flex justify-end">
                <motion.button
                  whileHover={{
                    y: -1,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-[#3f7d5a] text-white text-xs font-semibold hover:bg-[#356c4d] transition"
                >
                  {t("common.close", "Close")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminDashboard;