import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiShield,
  FiSettings,
  FiStar,
} from "react-icons/fi";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

const CATEGORY_META = {
  evaluations: {
    icon: FiStar,
    iconClass: "text-indigo-500",
    bgClass: "bg-indigo-50",
  },
  security: { icon: FiShield, iconClass: "text-red-400", bgClass: "bg-red-50" },
  system: { icon: FiSettings, iconClass: "text-sky-500", bgClass: "bg-sky-50" },
};
const getCategoryMeta = (cat) =>
  CATEGORY_META[cat] || {
    icon: FiBell,
    iconClass: "text-slate-400",
    bgClass: "bg-slate-100",
  };

const NotificationDropdown = ({ isOpen, onClose, role }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotification,
    toggleNotificationRead,
  } = useNotifications();

  const isRtl = i18n.language?.startsWith("ar");
  const panelRef = useRef(null);

  const getTargetRoute = () => {
    if (location.pathname.startsWith("/employee"))
      return "/employee/notifications";
    if (location.pathname.startsWith("/hr")) return "/hr/notifications";
    if (location.pathname.startsWith("/manager"))
      return "/manager/notifications";
    if (
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/owner")
    )
      return "/admin/notifications";

    const normalized = String(
      role || currentUser?.role || localStorage.getItem("role") || "",
    ).toLowerCase();

    if (normalized === "owner" || normalized === "admin")
      return "/admin/notifications";
    if (normalized === "hr") return "/hr/notifications";
    if (normalized === "manager") return "/manager/notifications";
    return "/employee/notifications";
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSeeAll = () => {
    onClose();
    navigate(getTargetRoute());
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      toggleNotificationRead(notif.id);
    }
    onClose();
    navigate(getTargetRoute(), {
      state: { selectedNotificationId: notif.id },
    });
  };

  const preview = notifications.slice(0, 5);
  const positionClass = isRtl ? "left-0" : "right-0";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`absolute top-[calc(100%+8px)] ${positionClass} w-[min(380px,95vw)] bg-white rounded-2xl border border-slate-200 shadow-2xl z-[999] overflow-hidden`}
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <FiBell className="w-4 h-4 text-[#334e68]" />
              <span className="font-bold text-sm text-slate-800">
                {t("portal.notifications", "Notifications")}
              </span>
              {unreadCount > 0 && (
                <span className="bg-red-400 text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#334e68] px-2 py-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
                >
                  <FiCheckCircle className="w-3 h-3" />
                  {t("portal.markAll", "Mark all")}
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-slate-400 p-1 rounded-md hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
            {preview.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-sm gap-2">
                <FiBell className="w-7 h-7 opacity-40" />
                <span>
                  {t("portal.noNotifications", "No notifications yet")}
                </span>
              </div>
            ) : (
              preview.map((notif, idx) => {
                const meta = getCategoryMeta(notif.category);
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={notif.id || idx}
                    initial={{ opacity: 0, x: isRtl ? 8 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => handleNotificationClick(notif)}
                    className={`relative flex gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      notif.isRead
                        ? "bg-white hover:bg-slate-50"
                        : "bg-blue-50/40 hover:bg-slate-50"
                    }`}
                  >
                    {/* Unread dot */}
                    {!notif.isRead && (
                      <span
                        className={`absolute top-3.5 ${
                          isRtl ? "left-3.5" : "right-3.5"
                        } w-1.5 h-1.5 rounded-full bg-indigo-500`}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl ${meta.bgClass} flex items-center justify-center shrink-0`}
                    >
                      <Icon className={`w-4 h-4 ${meta.iconClass}`} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[13px] mb-0.5 truncate pe-4 ${
                          notif.isRead
                            ? "font-medium text-slate-700"
                            : "font-bold text-slate-800"
                        }`}
                      >
                        {notif.titleKey
                          ? t(notif.titleKey, notif.defaultTitle)
                          : notif.defaultTitle}
                      </p>
                      <p className="text-[12px] text-slate-500 line-clamp-2 mb-1">
                        {notif.descKey
                          ? t(notif.descKey, notif.defaultDesc)
                          : notif.defaultDesc}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {notif.timestamp}
                      </span>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notif.id);
                      }}
                      aria-label="Dismiss"
                      className="self-start mt-0.5 text-slate-300 hover:text-red-400 transition shrink-0 p-0.5 rounded cursor-pointer"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50">
            <span className="text-[12px] text-slate-400">
              {notifications.length > 5
                ? `+${notifications.length - 5} more`
                : ""}
            </span>
            <button
              onClick={handleSeeAll}
              className="flex items-center gap-1.5 bg-[#243b53] hover:bg-[#334e68] text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-lg transition"
            >
              <FiCheck className="w-3 h-3" />
              {t("portal.seeAll", "See all notifications")}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
