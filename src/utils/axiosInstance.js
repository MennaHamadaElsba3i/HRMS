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

const handleSessionExpired = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("refreshToken");
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
      } catch {
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
};

let refreshPromise = null;

const requestNewTokens = async (refreshToken) => {
  const baseURL = getBaseUrl();
  const payload = { refresh_token: refreshToken };
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  let response;
  try {
    response = await axios.post(`${baseURL}/auth/refresh`, payload, {
      headers,
      timeout: 15000,
    });
  } catch (err) {
    if (err.response?.status === 404) {
      const fallbackUrl = baseURL.endsWith("/api")
        ? `${baseURL}/refresh`
        : `${baseURL}/api/refresh`;
      response = await axios.post(fallbackUrl, payload, {
        headers,
        timeout: 15000,
      });
    } else {
      throw err;
    }
  }

  const resData = response.data;
  const newAccessToken =
    resData?.data?.access_token ||
    resData?.data?.token ||
    resData?.access_token ||
    resData?.token;
  const newRefreshToken =
    resData?.data?.refresh_token ||
    resData?.data?.refreshToken ||
    resData?.refresh_token ||
    resData?.refreshToken;

  if (!newAccessToken) {
    throw new Error("No access token returned from refresh endpoint");
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken || refreshToken,
  };
};

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest) {
      const url = originalRequest.url || "";
      const isAuthEndpoint =
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/refresh") ||
        url.includes("/refresh") ||
        url.includes("/auth/forget-password") ||
        url.includes("/auth/forgot-password");

      // If the request was to an auth endpoint or already retried once, do not refresh
      if (isAuthEndpoint || originalRequest._retry) {
        if (url.includes("/refresh")) {
          handleSessionExpired();
        }
        return Promise.reject(error);
      }

      const storedRefreshToken =
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("refreshToken");

      if (!storedRefreshToken) {
        handleSessionExpired();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = requestNewTokens(storedRefreshToken)
            .then((tokens) => {
              if (tokens.accessToken) {
                localStorage.setItem("token", tokens.accessToken);
              }
              if (tokens.refreshToken) {
                localStorage.setItem("refresh_token", tokens.refreshToken);
                localStorage.setItem("refreshToken", tokens.refreshToken);
              }

              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("auth:refreshed", { detail: tokens })
                );
              }

              return tokens.accessToken;
            })
            .catch((refreshError) => {
              const status = refreshError.response?.status;
              // If the refresh endpoint returns 401/403/422, the session cannot be renewed
              if (status === 401 || status === 403 || status === 422) {
                handleSessionExpired();
              }
              throw refreshError;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
