import axios from "axios";

console.log("API URL:", import.meta.env.VITE_API_BASE_URL);

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  "https://workwise-production-3941.up.railway.app/api";

const getBaseUrl = () => {
  const trimmed = (rawBaseUrl || "").trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true", // <-- ده المهم
  },
});
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Send Accept-Language based on the stored language preference
    const storedLang = localStorage.getItem("i18nextLng");
    const lang = storedLang && storedLang.startsWith("ar") ? "ar" : "en";
    config.headers["Accept-Language"] = config.headers["Accept-Language"] || lang;
    config.headers["App-Language"] = config.headers["App-Language"] || lang;

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("permissions");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("admin");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("rememberMe");

      if (typeof window !== "undefined") {
        if (window.Echo) {
          try {
            window.Echo.disconnect();
          } catch (e) {
            // ignore
          }
        }
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));

        const path =
          window.location.pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";

        const isAuthPage =
          path.includes("/login") ||
          path.includes("/register") ||
          path.includes("/ForgotPassword") ||
          path.includes("/VerifyOTP") ||
          path.includes("/ResetPassword");

        if (!isAuthPage) {
          const redirectTo = path.startsWith("/admin")
            ? "/owner/login"
            : "/login";

          window.location.href = redirectTo;
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
