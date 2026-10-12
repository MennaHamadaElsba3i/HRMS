import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

const readTokenFromHash = () => {
  const hash = window.location.hash;
  if (!hash || !hash.includes("token=")) return null;
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  return p.get("token") || p.get("access_token");
};

const decodeJwt = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export default function GoogleCallbackGate({ children }) {
  const { login, isAuthenticated } = useAuth();
  const handled = useRef(false);

  // بيتقري مرة واحدة قبل ما أي Route يتعرض
  const [pendingToken] = useState(readTokenFromHash);
  const [processing, setProcessing] = useState(!!pendingToken);

  useEffect(() => {
    if (!pendingToken || handled.current) return;
    handled.current = true;

    // نضّف الـ hash بس ونفضل في نفس الصفحة (/admin/dashboard)
    window.history.replaceState(null, "", window.location.pathname);

    const payload = decodeJwt(pendingToken);
    if (!payload?.role) {
      toast.error("Google login failed.");
      setProcessing(false);
      return;
    }

    login({
      token: pendingToken,
      user: { id: payload.sub, role: payload.role },
    });
    toast.success("Signed in with Google");
  }, [pendingToken, login]);

  // نستنى لحد ما الـ state يتثبّت قبل ما نعرض الراوتس
  useEffect(() => {
    if (processing && isAuthenticated) setProcessing(false);
  }, [processing, isAuthenticated]);

  if (processing) return null; // أو Loader
  return children;
}