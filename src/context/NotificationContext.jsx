import { createContext, useContext } from "react";
import { useNotifications as useNotificationsHook } from "../features/notifications/hooks/useNotifications";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children, currentRole, currentUserId }) => {
  const notificationUtils = useNotificationsHook(currentUserId);

  return (
    <NotificationContext.Provider value={{ ...notificationUtils, currentRole }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return {
      notifications: [],
      allNotifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      markAsRead: () => {},
      toggleNotificationRead: () => {},
      markAllAsRead: () => {},
      clearNotification: () => {},
      clearAllNotifications: () => {},
      setNotifications: () => {},
      refreshNotifications: () => {},
      currentRole: "admin",
    };
  }
  return ctx;
};
