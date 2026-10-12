import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useNotifications } from "../../../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronRight,
  FiCheck,
  FiX,
  FiSearch,
  FiBellOff,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
} from "react-icons/fi";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function Notification() {
  const { t } = useTranslation();

  const {
    notifications,
    setNotifications,
    unreadCount,
    loading,
    clearAllNotifications,
    clearNotification,
    markAllAsRead,
    toggleNotificationRead,
  } = useNotifications();

  const location = useLocation();

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Auto-open notification when navigated with a specific notification ID in state
  useEffect(() => {
    const notifId = location.state?.selectedNotificationId;
    if (notifId && notifications.length > 0) {
      const targetNotif = notifications.find((item) => item.id === notifId);
      if (targetNotif) {
        setSelectedNotification(targetNotif);
      }
    }
  }, [location.state, notifications]);

  // ============================================================
  // FILTER NOTIFICATIONS
  // ============================================================
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (filter === "unread" && item.isRead) return false;
      if (filter === "seen" && !item.isRead) return false;

      if (
        filter !== "all" &&
        filter !== "unread" &&
        filter !== "seen" &&
        item.category !== filter
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = (t(item.titleKey, item.defaultTitle) || "").toLowerCase();
        const desc = (t(item.descKey, item.defaultDesc) || "").toLowerCase();
        return title.includes(query) || desc.includes(query);
      }

      return true;
    });
  }, [notifications, filter, searchQuery, t]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success(t("portal.markedAllSuccess", "All notifications marked as read"), {
      id: "toast-mark-all",
    });
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    clearAllNotifications();
    setSelectedNotification(null);
    toast.success(t("portal.clearedAllSuccess", "All notifications cleared successfully"), {
      id: "toast-clear-all",
    });
  };

  const handleToggleRead = async (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const targetItem = notifications.find((item) => item.id === id);
    if (!targetItem) return;

    const nextStatus = !targetItem.isRead;
    if (nextStatus) {
      toast.success(t("portal.markedSeenSuccess", "Notification marked as seen"), {
        id: `toast-seen-${id}`,
      });
    } else {
      toast.success(t("portal.markedUnreadSuccess", "Notification marked as unread"), {
        id: `toast-unread-${id}`,
      });
    }

    await toggleNotificationRead(id);

    if (selectedNotification && selectedNotification.id === id) {
      setSelectedNotification((prev) => ({
        ...prev,
        isRead: nextStatus,
      }));
    }
  };

  const handleClear = (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    clearNotification(id);
    if (selectedNotification && selectedNotification.id === id) {
      setSelectedNotification(null);
    }

    toast.success(t("portal.clearedSuccess", "Notification cleared successfully"), {
      id: `toast-clear-${id}`,
    });
  };

  const getBadgeClasses = (category) => {
    const base =
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none";

    if (category === "evaluations") {
      return `${base} bg-[#e7eef5] text-[#334e68]`;
    }
    if (category === "security") {
      return `${base} bg-[#fbf2df] text-[#9b6b1e]`;
    }
    if (category === "system") {
      return `${base} bg-[#e8f3eb] text-[#16a34a]`;
    }
    return `${base} bg-[#eef2f5] text-[#334e68]`;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto flex w-full max-w-[1350px] flex-col gap-6 pb-12 font-sans"
    >
      {/* ============================================================
          SECTION TITLE + CONTROLS
      ============================================================ */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#102a43]">
            {t("portal.systemAlertsTitle", "System Notifications & Alerts")}
          </h2>
          <p className="mt-0.5 text-xs md:text-sm text-[#64748b]">
            {t(
              "portal.systemAlertsSubtitle",
              "Review system events, policy updates, and operational reminders"
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mark All */}
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#bcccdc] bg-white px-3.5 py-2 text-xs font-semibold text-[#102a43] transition hover:bg-[#f0f4f7] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <FiCheck className="h-3.5 w-3.5" />
            <span>{t("portal.markAllAsRead", "Mark all as read")}</span>
          </motion.button>

          {/* Clear All */}
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#fecaca] bg-white px-3.5 py-2 text-xs font-semibold text-[#dc2626] transition hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            <span>{t("portal.clearAll", "Clear All")}</span>
          </motion.button>

          {/* Filter */}
          <div className="relative">
            <select
              className="min-w-[105px] appearance-none rounded-xl border border-[#bcccdc] bg-white py-2 pl-3.5 pr-8 rtl:pl-8 rtl:pr-3.5 text-xs font-semibold text-[#102a43] outline-none transition hover:border-[#64748b] focus:border-[#102a43] shadow-sm cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter notifications"
            >
              <option value="all">{t("portal.all", "All")}</option>
              <option value="unread">{t("portal.unread", "Unread")}</option>
              <option value="seen">{t("portal.seen", "Seen")}</option>
              <option value="evaluations">{t("portal.evaluations", "Evaluations")}</option>
              <option value="security">{t("portal.security", "Security")}</option>
              <option value="system">{t("portal.system", "System")}</option>
            </select>
            <FiChevronRight className="pointer-events-none absolute right-3 rtl:right-auto rtl:left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-[#64748b]" />
          </div>
        </div>
      </motion.div>

      {/* ============================================================
          NOTIFICATION CENTER CARD
      ============================================================ */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      >
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f1f5f9] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#102a43]">
              {t("portal.notificationCenter", "Notification center")}
            </h3>
            <p className="mt-0.5 text-xs text-[#829ab1]">
              {unreadCount > 0
                ? t("portal.unreadCountMsg", {
                    count: unreadCount,
                    defaultValue: `${unreadCount} unread notifications requiring your attention.`,
                  })
                : t("portal.allReviewedMsg", "All notifications have been reviewed.")}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-[240px]">
            <FiSearch className="pointer-events-none absolute left-3 rtl:left-auto rtl:right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#829ab1]" />
            <input
              type="text"
              placeholder={t("portal.searchNotifications", "Search notifications...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2 pl-9 pr-3 rtl:pl-3 rtl:pr-9 text-xs text-[#102a43] outline-none placeholder:text-[#94a3b8] transition focus:border-[#486581] focus:bg-white"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-[#f1f5f9]">
          <AnimatePresence mode="popLayout">
            {loading ? (
              /* Loading Skeleton */
              <div className="flex flex-col gap-3 py-6 px-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-[#e2e8f0] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/5 rounded bg-[#e2e8f0]" />
                      <div className="h-2.5 w-4/5 rounded bg-[#f1f5f9]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((item) => {

                const title = item.titleKey ? t(item.titleKey, item.defaultTitle) : item.defaultTitle;
                const desc = item.descKey ? t(item.descKey, item.defaultDesc) : item.defaultDesc;
                const badge = item.badgeKey ? t(item.badgeKey, item.defaultBadge) : item.defaultBadge;
                const time = item.timestampKey ? t(item.timestampKey, item.timestamp) : item.timestamp;
                const actionLabel = item.actionKey
                  ? t(item.actionKey, item.defaultAction)
                  : item.defaultAction;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: item.isRead ? 0.8 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ x: 2 }}
                    className="group flex cursor-pointer items-start gap-3.5 rounded-xl px-3 py-4 transition hover:bg-[#f8fafc]"
                    onClick={() => setSelectedNotification(item)}
                  >
                    {/* Status Dot */}
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.isRead ? "bg-[#cbd5e1]" : "bg-[#16a34a] shadow-[0_0_0_2px_rgba(22,163,74,0.2)]"
                      }`}
                      onClick={(e) => handleToggleRead(item.id, e)}
                    />

                    {/* Main Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="text-xs md:text-sm font-semibold text-[#102a43]">
                            {title}
                          </span>
                          <span className={getBadgeClasses(item.category)}>
                            <span>•</span>
                            <span>{badge}</span>
                          </span>
                        </div>
                        <span className="shrink-0 text-xs text-[#829ab1]">{time}</span>
                      </div>

                      <p className="mt-1 text-xs text-[#64748b] leading-relaxed line-clamp-2">
                        {desc}
                      </p>

                      {/* Action buttons inside item */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.actionType && item.actionType !== "system" && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold text-[#334e68] transition hover:bg-[#eef2f5]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNotification(item);
                              }}
                            >
                              {actionLabel}
                            </button>
                          )}

                          <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                              item.isRead
                                ? "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]"
                                : "border-[#bbf7d0] bg-[#ecfdf5] text-[#16a34a] hover:bg-[#dcfce7]"
                            }`}
                            onClick={(e) => handleToggleRead(item.id, e)}
                          >
                            {item.isRead ? <FiCheckCircle className="h-3 w-3" /> : <FiEye className="h-3 w-3" />}
                            <span>{item.isRead ? t("portal.seen", "Seen") : t("portal.markAsSeen", "Mark as Seen")}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#94a3b8] hover:text-[#dc2626] transition p-1"
                          onClick={(e) => handleClear(item.id, e)}
                        >
                          <FiTrash2 className="h-3 w-3" />
                          <span>{t("portal.clearNotification", "Clear")}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#94a3b8]">
                  <FiBellOff className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-[#102a43]">
                  {t("portal.noNotificationsTitle", "No notifications found")}
                </h4>
                <p className="mt-1 text-xs text-[#829ab1]">
                  {t("portal.noNotificationsDesc", "There are no notifications matching your current filter.")}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Modal Details */}
      <AnimatePresence>
        {selectedNotification && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-[#e2e8f0]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9]">
                <span className={getBadgeClasses(selectedNotification.category)}>
                  • {t(selectedNotification.badgeKey, selectedNotification.defaultBadge)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="py-4 space-y-2">
                <h3 className="text-base md:text-lg font-bold text-[#102a43]">
                  {selectedNotification.titleKey ? t(selectedNotification.titleKey, selectedNotification.defaultTitle) : selectedNotification.defaultTitle}
                </h3>
                <p className="text-xs md:text-sm text-[#64748b] leading-relaxed">
                  {selectedNotification.descKey ? t(selectedNotification.descKey, selectedNotification.defaultDesc) : selectedNotification.defaultDesc}
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="rounded-xl bg-[#102a43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1c364f] transition"
                >
                  {t("portal.closeModal", "Close")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}