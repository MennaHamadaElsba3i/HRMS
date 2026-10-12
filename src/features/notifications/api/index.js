import axiosInstance from "../../../utils/axiosInstance";

export const fetchNotifications = async (page = 1, perPage = 100) => {
  const response = await axiosInstance.get("/notifications", {
    params: { page, per_page: perPage },
    headers: { Accept: "application/json" },
  });
  return response.data;
};

export const fetchUnreadCount = async () => {
  const response = await axiosInstance.get("/notifications/unread-count", {
    headers: { Accept: "application/json" },
  });
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await axiosInstance.patch(`/notifications/${id}/read`, null, {
    headers: { Accept: "application/json" },
  });
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await axiosInstance.patch("/notifications/read-all", null, {
    headers: { Accept: "application/json" },
  });
  return response.data;
};

export const clearAllNotifications = async () => {
  const response = await axiosInstance.delete("/notifications/clear-all", {
    headers: { Accept: "application/json" },
  });
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await axiosInstance.delete(`/notifications/${id}`, {
    headers: { Accept: "application/json" },
  });
  return response.data;
};

export const updateFcmToken = async (fcmToken) => {
  const response = await axiosInstance.post(
    "/notifications/fcm-token",
    { fcm_token: fcmToken },
    { headers: { Accept: "application/json" } }
  );
  return response.data;
};
