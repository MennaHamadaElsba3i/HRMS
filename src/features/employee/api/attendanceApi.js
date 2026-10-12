import axiosInstance from "../../../utils/axiosInstance";

export const getTodayAttendance = async ({
  latitude,
  longitude,
  lang = "en",
} = {}) => {
  const params = {};
  if (latitude !== undefined && latitude !== null) params.latitude = latitude;
  if (longitude !== undefined && longitude !== null) params.longitude = longitude;

  const response = await axiosInstance.get("/attendance/today", {
    params,
    headers: {
      "Accept-Language": lang,
    },
  });

  return response.data;
};

export const checkIn = async (location = {}) => {
  if (location?.latitude == null || location?.longitude == null) {
    throw new Error(
      localStorage.getItem("language") === "ar"
        ? "يرجى السماح بصلاحية الموقع الجغرافي (GPS) في المتصفح لتسجيل الحضور."
        : "Please allow location/GPS permissions in your browser to check in."
    );
  }

  const payload = {
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
  };

  const response = await axiosInstance.post(
    "/attendance/check-in",
    payload,
  );

  return response.data;
};

export const checkOut = async (location = {}) => {
  const payload = {};
  if (location?.latitude != null && location?.longitude != null) {
    payload.latitude = Number(location.latitude);
    payload.longitude = Number(location.longitude);
  }

  const response = await axiosInstance.post(
    "/attendance/check-out",
    payload,
  );

  return response.data;
};

export const getAttendanceHistory = async ({
  month,
  year,
  perPage = 15,
} = {}) => {
  const params = { per_page: perPage };
  if (month) params.month = month;
  if (year) params.year = year;

  const response = await axiosInstance.get(
    "/attendance/history",
    {
      params,
    },
  );

  return response.data;
};