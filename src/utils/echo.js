import Echo from "laravel-echo";
import Pusher from "pusher-js";

if (typeof window !== "undefined") {
  window.Pusher = Pusher;
}

export const getAuthToken = () => {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

const pusherKey = import.meta.env.VITE_REVERB_APP_KEY;
const pusherHost = import.meta.env.VITE_REVERB_HOST;
const pusherPort = import.meta.env.VITE_REVERB_PORT
  ? parseInt(import.meta.env.VITE_REVERB_PORT, 10)
  : 443;
const pusherScheme = import.meta.env.VITE_REVERB_SCHEME || "https";

const rawApiBase =
  import.meta.env.VITE_API_BASE_URL ||
  "https://workwise-production-3941.up.railway.app";
const cleanApiBase = (rawApiBase || "").trim().replace(/\/+$/, "");
const authEndpoint = cleanApiBase.endsWith("/api")
  ? `${cleanApiBase}/broadcasting/auth`
  : `${cleanApiBase}/api/broadcasting/auth`;

export const createEcho = () => {
  if (typeof window === "undefined") return null;

  if (!pusherKey || !pusherHost) {
    console.warn("⚠️ Reverb credentials missing in environment variables.");
    return null;
  }

  const echo = new Echo({
    broadcaster: "reverb",
    key: pusherKey,
    wsHost: pusherHost,
    wsPort: pusherPort || 443,
    wssPort: pusherPort || 443,
    forceTLS: pusherScheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint,
    auth: {
      headers: {
        get Authorization() {
          const t = getAuthToken();
          return t ? `Bearer ${t}` : "";
        },
        Accept: "application/json",
      },
    },
  });

  window.Echo = echo;
  return echo;
};

const echo = createEcho();

export const disconnectEcho = () => {
  if (typeof window !== "undefined" && window.Echo) {
    try {
      window.Echo.disconnect();
      console.log("🔌 Echo disconnected");
    } catch (e) {
      console.warn("Error disconnecting Echo:", e);
    }
  }
};

export const reconnectEcho = () => {
  if (typeof window !== "undefined") {
    const token = getAuthToken();
    if (window.Echo) {
      try {
        if (window.Echo.connector?.options?.auth?.headers) {
          window.Echo.connector.options.auth.headers.Authorization = token
            ? `Bearer ${token}`
            : "";
        }
        if (window.Echo.connector?.pusher?.config?.auth?.headers) {
          window.Echo.connector.pusher.config.auth.headers.Authorization = token
            ? `Bearer ${token}`
            : "";
        }
        window.Echo.connect();
        console.log("⚡ Echo reconnected");
      } catch (e) {
        console.warn("Error reconnecting Echo:", e);
      }
    } else {
      createEcho();
    }
  }
};

export default echo;
