import { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  FiSearch,
  FiArrowUpRight,
  FiChevronRight,
  FiFileText,
  FiRefreshCw,
  FiEye,
  FiX,
  FiUser,
  FiCalendar,
  FiLayers,
  FiAlertCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getAuditLogs } from "../../../api/auditsApi";

const ActivityLog = ({ role }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const isRtl = i18n.language?.startsWith("ar");

  const isHrPath =
    location.pathname.startsWith("/hr") ||
    String(role || "").toLowerCase() === "hr";

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedLog, setSelectedLog] = useState(null);

  // =========================================================
  // FETCH AUDIT LOGS
  // GET /api/audits?lang=ar|en
  // =========================================================

  const fetchLogs = useCallback(
    async (manualRefresh = false) => {
      try {
        if (manualRefresh) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

        const response = await getAuditLogs({
          lang,
        });

        /*
          Expected API response:

          {
            success: true,
            message: "Audit logs retrieved successfully.",
            data: [
              {
                id: 1,
                action: "leave_created",
                entity_type: "App\\Models\\LeaveRequest",
                entity_id: 5,
                user_id: 2,
                old_values: null,
                new_values: {
                  status: "pending"
                },
                created_at: "2026-10-03T09:19:18.000000Z"
              }
            ]
          }
        */

        if (response?.success === true && Array.isArray(response?.data)) {
          setLogs(response.data);
          return;
        }

        if (Array.isArray(response?.data)) {
          setLogs(response.data);
          return;
        }

        if (Array.isArray(response)) {
          setLogs(response);
          return;
        }

        setLogs([]);
      } catch (err) {
        console.error("Audit Logs API Error:", err);

        const status = err?.response?.status;

        let message;

        if (status === 401) {
          message = t("adminInline.your_session_has_expired_please_login_again", "Your session has expired. Please login again.");
        } else if (status === 403) {
          message = t("adminInline.you_do_not_have_permission_to_view_audit_logs", "You do not have permission to view audit logs.");
        } else if (status === 500) {
          message = t("adminInline.internal_server_error", "Internal server error.");
        } else {
          message =
            err?.response?.data?.message ||
            err?.message ||
            (t("adminInline.failed_to_load_audit_logs", "Failed to load audit logs."));
        }

        setError(message);

        toast.error(message);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [i18n.language, isRtl],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // =========================================================
  // FORMAT ACTION
  // =========================================================

  const formatAction = useCallback(
    (rawAction) => {
      if (!rawAction) {
        return t("auditLogs.filterInfo", "Event");
      }

      const translationKey = `auditLogs.actions.${rawAction}`;
      const translated = t(translationKey);

      if (translated !== translationKey) {
        return translated;
      }

      return String(rawAction)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    },
    [t],
  );

  // =========================================================
  // FORMAT ENTITY TYPE
  // =========================================================

  const formatEntityType = useCallback((entityType) => {
    if (!entityType) {
      return "System";
    }

    const parts = String(entityType).split("\\");
    const entity = parts[parts.length - 1];

    return entity || entityType;
  }, []);

  // =========================================================
  // GET ACTION TYPE
  // =========================================================

  const getActionType = useCallback((action = "") => {
    const act = String(action).toLowerCase();

    if (
      act.includes("create") ||
      act.includes("created") ||
      act.includes("store") ||
      act.includes("add") ||
      act.includes("added") ||
      act.includes("invite")
    ) {
      return "create";
    }

    if (
      act.includes("update") ||
      act.includes("updated") ||
      act.includes("change") ||
      act.includes("changed") ||
      act.includes("edit") ||
      act.includes("edited") ||
      act.includes("approve") ||
      act.includes("approved")
    ) {
      return "update";
    }

    if (
      act.includes("delete") ||
      act.includes("deleted") ||
      act.includes("destroy") ||
      act.includes("remove") ||
      act.includes("removed") ||
      act.includes("reject") ||
      act.includes("rejected")
    ) {
      return "delete";
    }

    return "info";
  }, []);

  // =========================================================
  // ACTION BADGE
  // =========================================================

  const getActionBadge = useCallback(
    (action = "") => {
      const type = getActionType(action);

      if (type === "create") {
        return {
          bg: "bg-[#ecfdf5]",
          text: "text-[#10b981]",
          dot: "bg-[#10b981]",
          type: "create",
          label: t("auditLogs.filterSuccess", "Created"),
        };
      }

      if (type === "update") {
        return {
          bg: "bg-[#fffbeb]",
          text: "text-[#d97706]",
          dot: "bg-[#d97706]",
          type: "update",
          label: t("auditLogs.filterWarning", "Updated"),
        };
      }

      if (type === "delete") {
        return {
          bg: "bg-[#fef2f2]",
          text: "text-[#ef4444]",
          dot: "bg-[#ef4444]",
          type: "delete",
          label: t("adminInline.deleted", "Deleted"),
        };
      }

      return {
        bg: "bg-[#f1f5f9]",
        text: "text-[#64748b]",
        dot: "bg-[#64748b]",
        type: "info",
        label: t("auditLogs.filterInfo", "Info"),
      };
    },
    [getActionType, isRtl, t],
  );

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDateTime = useCallback(
    (dateString) => {
      if (!dateString) {
        return "—";
      }

      const date = new Date(dateString);

      if (Number.isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleString(isRtl ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [isRtl],
  );

  // =========================================================
  // SAFE JSON STRING
  // =========================================================

  const stringifyValues = useCallback((value) => {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }, []);

  // =========================================================
  // FILTER LOGS
  // =========================================================

  const filteredLogs = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      const badge = getActionBadge(log?.action);

      const matchesFilter =
        activeFilter === "All" ||
        badge.type.toLowerCase() === activeFilter.toLowerCase();

      if (!matchesFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [
        log?.id,
        log?.action,
        formatAction(log?.action),
        log?.entity_type,
        formatEntityType(log?.entity_type),
        log?.entity_id,
        log?.user_id,
        log?.created_at,
        stringifyValues(log?.old_values),
        stringifyValues(log?.new_values),
      ]
        .filter(
          (value) => value !== null && value !== undefined && value !== "",
        )
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [
    logs,
    activeFilter,
    searchQuery,
    getActionBadge,
    formatAction,
    formatEntityType,
    stringifyValues,
  ]);

  // =========================================================
  // EXPORT
  // =========================================================

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast.error(
        t("adminInline.no_logs_available_to_export", "No logs available to export."),
      );
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      filters: {
        search: searchQuery || null,
        filter: activeFilter === "All" ? null : activeFilter,
      },
      totalLogs: filteredLogs.length,
      logs: filteredLogs.map((log) => ({
        id: log.id,
        action: log.action,
        actionLabel: formatAction(log.action),
        entityType: log.entity_type,
        entityName: formatEntityType(log.entity_type),
        entityId: log.entity_id,
        userId: log.user_id,
        oldValues: log.old_values,
        newValues: log.new_values,
        createdAt: log.created_at,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wisework_audit_logs_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);

    toast.success(
      t("auditLogs.exportSuccess", "Activity log exported successfully."),
      {
        duration: 3000,
        icon: "✓",
      },
    );
  };

  // =========================================================
  // FILTER OPTIONS
  // =========================================================

  const filterOptions = [
    {
      key: "All",
      label: t("auditLogs.filterAll", "All"),
    },
    {
      key: "create",
      label: t("auditLogs.filterSuccess", "Created"),
    },
    {
      key: "update",
      label: t("auditLogs.filterWarning", "Updated"),
    },
    {
      key: "delete",
      label: t("adminInline.deleted", "Deleted"),
    },
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
      className="w-full space-y-6"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* =====================================================
          BREADCRUMB
      ====================================================== */}

      <div className="flex items-center gap-2 text-xs font-medium text-[#64748b]">
        <span>
          {isHrPath
            ? t("portal.hrPortal", "HR Portal")
            : t("auditLogs.breadcrumbAdmin", "Administration")}
        </span>

        <FiChevronRight
          className={`w-3.5 h-3.5 text-[#94a3b8] ${isRtl ? "rotate-180" : ""}`}
        />

        <span className="text-[#334e68] font-semibold">
          {t("auditLogs.title", "Audit Logs")}
        </span>
      </div>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold text-[#1e293b] tracking-tight">
            {t("auditLogs.title", "Audit Logs")}
          </h1>

          <p className="text-sm text-[#64748b] mt-1 font-normal">
            {t(
              "auditLogs.subtitle",
              "A searchable record of administrative actions and system events.",
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh */}

          <motion.button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={loading || isRefreshing}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs sm:text-sm font-semibold text-[#1e293b] hover:bg-[#f8fafc] hover:border-[#cbd5e1] shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            <FiRefreshCw
              className={`w-4 h-4 text-[#475569] ${
                isRefreshing ? "animate-spin text-[#3f7d5a]" : ""
              }`}
            />

            <span className="hidden sm:inline">
              {t("adminInline.refresh", "Refresh")}
            </span>
          </motion.button>

          {/* Export */}

          <motion.button
            type="button"
            onClick={handleExport}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs sm:text-sm font-semibold text-[#1e293b] hover:bg-[#f8fafc] hover:border-[#cbd5e1] shadow-2xs transition cursor-pointer"
          >
            <FiArrowUpRight className="w-4 h-4 text-[#475569]" />

            <span>{t("auditLogs.exportConfig", "Export JSON")}</span>
          </motion.button>
        </div>
      </div>

      {/* =====================================================
          MAIN CARD
      ====================================================== */}

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.08,
          ease: "easeOut",
        }}
        className="bg-white rounded-2xl p-6 border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6"
      >
        {/* Card Header */}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#1e293b]">
              {t("auditLogs.cardTitle", "Audit logs")}
            </h2>

            <p className="text-xs sm:text-sm text-[#64748b] mt-0.5 font-normal">
              {t(
                "auditLogs.cardSubtitle",
                "Review administrative actions and system events.",
              )}
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f1f5f9] text-[#475569]">
            {filteredLogs.length} {t("adminInline.records", "records")}
          </span>
        </div>

        {/* =================================================
            SEARCH + FILTER
        ================================================== */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}

          <div className="relative flex-1 max-w-xl">
            <FiSearch
              className={`absolute ${
                isRtl ? "right-3.5" : "left-3.5"
              } top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]`}
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                "auditLogs.searchPlaceholder",
                "Search by action, user ID, entity...",
              )}
              className={`w-full ${
                isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
              } py-2 border border-[#e2e8f0] rounded-xl text-xs sm:text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3f7d5a] focus:ring-1 focus:ring-[#3f7d5a]/20 transition bg-white`}
            />
          </div>

          {/* Filters */}

          <div className="flex items-center gap-1.5 flex-wrap">
            {filterOptions.map((filter) => {
              const isActive = activeFilter === filter.key;

              return (
                <motion.button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  whileTap={{ scale: 0.96 }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-[#243b53] text-white shadow-2xs"
                      : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b]"
                  }`}
                >
                  {filter.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================== */}

        {loading && !isRefreshing ? (
          <div className="py-16 space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-12 bg-slate-100/80 animate-pulse rounded-xl w-full"
              />
            ))}
          </div>
        ) : error && logs.length === 0 ? (
          /* =================================================
             ERROR
          ================================================== */

          <div className="py-14 text-center">
            <FiAlertCircle className="w-10 h-10 mx-auto text-red-300 mb-3" />

            <p className="text-sm text-red-600 font-medium">{error}</p>

            <button
              type="button"
              onClick={() => fetchLogs()}
              className="mt-4 px-4 py-2 bg-[#243b53] text-white rounded-lg text-xs font-semibold hover:bg-[#1a2d3f] transition"
            >
              {t("adminInline.try_again", "Try Again")}
            </button>
          </div>
        ) : (
          /* =================================================
             TABLE
          ================================================== */

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="border-b border-[#f1f5f9] text-[11px] font-bold text-[#94a3b8] tracking-wider uppercase">
                  <th className="pb-3.5 px-2">#</th>

                  <th className="pb-3.5 px-3">
                    {t("auditLogs.colAction", "ACTION")}
                  </th>

                  <th className="pb-3.5 px-3">
                    {t("adminInline.entity", "ENTITY")}
                  </th>

                  <th className="pb-3.5 px-3">
                    {t("auditLogs.colActor", "USER ID")}
                  </th>

                  <th className="pb-3.5 px-3">
                    {t("auditLogs.colTimestamp", "TIMESTAMP")}
                  </th>

                  <th className="pb-3.5 px-2 text-center">
                    {t("adminInline.details", "DETAILS")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f8fafc]">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => {
                    const badge = getActionBadge(log?.action);

                    const hasValues =
                      log?.new_values !== null || log?.old_values !== null;

                    return (
                      <motion.tr
                        key={log?.id || index}
                        initial={{
                          opacity: 0,
                          y: 6,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.2,
                          delay: index * 0.03,
                        }}
                        className="hover:bg-[#f8fafc]/80 transition group"
                      >
                        {/* ID */}

                        <td className="py-4 px-2 text-xs font-mono text-[#94a3b8]">
                          #{log?.id ?? "—"}
                        </td>

                        {/* ACTION */}

                        <td className="py-4 px-3 text-sm font-semibold text-[#1e293b]">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
                            />

                            <span>{formatAction(log?.action)}</span>
                          </span>
                        </td>

                        {/* ENTITY */}

                        <td className="py-4 px-3 text-xs text-[#475569] font-medium">
                          <div className="flex items-center gap-2">
                            <FiLayers className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />

                            <div>
                              <span className="font-semibold text-[#1e293b]">
                                {formatEntityType(log?.entity_type)}
                              </span>

                              {log?.entity_id !== null &&
                                log?.entity_id !== undefined && (
                                  <span className="text-[#94a3b8] ml-1 rtl:ml-0 rtl:mr-1">
                                    (#
                                    {log.entity_id})
                                  </span>
                                )}
                            </div>
                          </div>
                        </td>

                        {/* USER */}

                        <td className="py-4 px-3 text-xs text-[#475569]">
                          <span className="inline-flex items-center gap-1.5 bg-[#f8fafc] px-2 py-1 rounded-md text-[#334e68] font-mono">
                            <FiUser className="w-3 h-3 text-[#94a3b8]" />

                            {log?.user_id
                              ? `User #${log.user_id}`
                              : t("adminInline.system", "System")}
                          </span>
                        </td>

                        {/* DATE */}

                        <td className="py-4 px-3 text-xs text-[#64748b] whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <FiCalendar className="w-3.5 h-3.5 text-[#94a3b8]" />

                            {formatDateTime(log?.created_at)}
                          </div>
                        </td>

                        {/* DETAILS */}

                        <td className="py-4 px-2 text-center whitespace-nowrap">
                          {hasValues ? (
                            <button
                              type="button"
                              onClick={() => setSelectedLog(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#2f6f4d] hover:bg-[#ecfdf5] rounded-lg transition cursor-pointer"
                            >
                              <FiEye className="w-3.5 h-3.5" />

                              <span>{t("adminInline.view", "View")}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-[#cbd5e1]">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-14 text-center text-xs text-[#94a3b8]"
                    >
                      <FiFileText className="w-8 h-8 mx-auto mb-2 text-[#cbd5e1]" />

                      <p>
                        {t(
                          "auditLogs.noLogsFound",
                          "No logs found matching your criteria.",
                        )}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* =====================================================
          DETAIL MODAL
      ====================================================== */}

      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-[#e2e8f0] space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}

              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
                <div>
                  <h3 className="text-base font-bold text-[#1e293b]">
                    {t("adminInline.audit_log_record", "Audit Log Record")} #
                    {selectedLog.id}
                  </h3>

                  <p className="text-xs text-[#64748b] mt-0.5">
                    {formatAction(selectedLog.action)} ·{" "}
                    {formatDateTime(selectedLog.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Summary */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#f8fafc] p-3 rounded-xl">
                <div>
                  <span className="text-[#94a3b8] block mb-1">
                    {t("adminInline.entity", "Entity:")}
                  </span>

                  <span className="font-semibold text-[#1e293b]">
                    {formatEntityType(selectedLog.entity_type)}

                    {selectedLog.entity_id !== null &&
                      selectedLog.entity_id !== undefined &&
                      ` (#${selectedLog.entity_id})`}
                  </span>
                </div>

                <div>
                  <span className="text-[#94a3b8] block mb-1">
                    {t("adminInline.actor_user", "Actor / User:")}
                  </span>

                  <span className="font-semibold text-[#1e293b]">
                    {selectedLog.user_id
                      ? `User #${selectedLog.user_id}`
                      : t("adminInline.system", "System")}
                  </span>
                </div>

                <div>
                  <span className="text-[#94a3b8] block mb-1">
                    {t("adminInline.action", "Action:")}
                  </span>

                  <span className="font-semibold text-[#1e293b]">
                    {formatAction(selectedLog.action)}
                  </span>
                </div>

                <div>
                  <span className="text-[#94a3b8] block mb-1">
                    {t("adminInline.date", "Date:")}
                  </span>

                  <span className="font-semibold text-[#1e293b]">
                    {formatDateTime(selectedLog.created_at)}
                  </span>
                </div>
              </div>

              {/* New Values */}

              {selectedLog.new_values !== null &&
                selectedLog.new_values !== undefined && (
                  <div>
                    <h4 className="text-xs font-bold text-[#059669] mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10b981]" />

                      {t("adminInline.new_values", "New Values")}
                    </h4>

                    <pre className="text-xs bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl overflow-x-auto text-[#1e293b] font-mono leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}

              {/* Old Values */}

              {selectedLog.old_values !== null &&
                selectedLog.old_values !== undefined && (
                  <div>
                    <h4 className="text-xs font-bold text-[#d97706] mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#d97706]" />

                      {t("adminInline.previous_values", "Previous Values")}
                    </h4>

                    <pre className="text-xs bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl overflow-x-auto text-[#1e293b] font-mono leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

              {/* Close */}

              <div className="pt-3 border-t border-[#f1f5f9] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-[#243b53] text-white rounded-xl text-xs font-semibold hover:bg-[#1a2d3f] transition cursor-pointer"
                >
                  {t("adminInline.close", "Close")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActivityLog;
