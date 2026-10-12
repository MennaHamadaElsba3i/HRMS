import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getTodayAttendance } from "../api/attendanceApi";

export const getCurrentLocation = ({ required = true } = {}) => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      const msg =
        localStorage.getItem("language") === "ar"
          ? "المتصفح لا يدعم خاصية تحديد الموقع الجغرافي."
          : "Geolocation is not supported by this browser.";
      if (required) {
        reject(new Error(msg));
      } else {
        resolve({ latitude: null, longitude: null });
      }
      return;
    }

    const options = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        try {
          sessionStorage.setItem("workwise_last_location", JSON.stringify(coords));
        } catch {
          // ignore
        }
        resolve(coords);
      },
      (error) => {
        console.warn("Geolocation error:", error);

        // Check if we have cached coords in sessionStorage
        try {
          const cached = sessionStorage.getItem("workwise_last_location");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.latitude != null && parsed?.longitude != null) {
              resolve(parsed);
              return;
            }
          }
        } catch {
          // ignore
        }

        if (required) {
          let errorMsg =
            localStorage.getItem("language") === "ar"
              ? "يرجى السماح بصلاحية الموقع الجغرافي (GPS) في المتصفح لتسجيل الحضور."
              : "Location permission is required for attendance check-in. Please enable location access in your browser.";

          if (error?.code === 1) {
            errorMsg =
              localStorage.getItem("language") === "ar"
                ? "تم حظر إذن الموقع الجغرافي في المتصفح. اضغط على أيقونة القفل 🔒 أو علامة الضبط بجوار الرابط في شريط العنوان واجعل Location على (Allow / سماح) ثم اضغط Check In مجدداً."
                : "Location permission is blocked. Click the lock 🔒 icon next to the URL in your browser address bar, set Location to 'Allow', then click Check In again.";
          } else if (error?.code === 2) {
            errorMsg =
              localStorage.getItem("language") === "ar"
                ? "تعذر تحديد الموقع الجغرافي. يرجى التأكد من اتصال الإنترنت أو تفعيل خدمة الموقع في جهازك."
                : "Location unavailable. Please check your device location settings or internet connection.";
          } else if (error?.code === 3) {
            errorMsg =
              localStorage.getItem("language") === "ar"
                ? "انتهت مهلة طلب الموقع الجغرافي. يرجى الضغط على زر Check In والموافقة على نافذة الإذن فور ظهورها."
                : "Location request timed out. Please click Check In and accept the permission prompt.";
          }

          reject(new Error(errorMsg));
        } else {
          resolve({ latitude: null, longitude: null });
        }
      },
      options
    );
  });
};

export const useTodayAttendance = () => {
  const { i18n } = useTranslation();

  return useQuery({
    queryKey: ["attendance", "today", i18n.language],
    queryFn: async () => {
      let latitude = null;
      let longitude = null;

      // Do NOT trigger browser prompt on initial page load; only use cached session location if already present
      try {
        const cached = sessionStorage.getItem("workwise_last_location");
        if (cached) {
          const parsed = JSON.parse(cached);
          latitude = parsed?.latitude;
          longitude = parsed?.longitude;
        }
      } catch {
        // ignore
      }

      return getTodayAttendance({
        latitude,
        longitude,
        lang: i18n.language,
      });
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};
