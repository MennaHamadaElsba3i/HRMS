import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

const readAuthFromUrl = () => {
  const hash = window.location.hash ? window.location.hash.replace(/^#/, "") : "";
  const search = window.location.search ? window.location.search.replace(/^\?/, "") : "";
  if (!hash && !search) return null;

  const hp = new URLSearchParams(hash);
  const sp = new URLSearchParams(search);

  const token = hp.get("token") || hp.get("access_token") || sp.get("token") || sp.get("access_token");
  if (!token) return null;

  const parseJson = (val) => {
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      try {
        return JSON.parse(decodeURIComponent(val));
      } catch {
        return null;
      }
    }
  };

  const rawUser = parseJson(hp.get("user") || sp.get("user"));
  const rawData = parseJson(hp.get("data") || sp.get("data"));
  const dataUser = rawData?.user || (rawData && !rawData.token ? rawData : null);

  return { token, urlUser: rawUser || dataUser };
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

  const [pendingAuth] = useState(readAuthFromUrl);
  const [processing, setProcessing] = useState(!!pendingAuth);

  useEffect(() => {
    if (!pendingAuth || handled.current) return;
    handled.current = true;

    window.history.replaceState(null, "", window.location.pathname);

    const { token, urlUser } = pendingAuth;
    const payload = decodeJwt(token);

    const jwtUser = payload?.user || payload;
    const user = {
      ...(jwtUser && typeof jwtUser === "object" ? jwtUser : {}),
      ...(urlUser && typeof urlUser === "object" ? urlUser : {}),
    };

    const role = user.role || payload?.role || "Owner";
    user.role = role;
    user.id = user.id || user.userId || payload?.sub || 1;
    user.userId = user.id;

    if (!role) {
      toast.error("Google login failed.");
      setProcessing(false);
      return;
    }

    login({
      token,
      user,
    });
    toast.success("Signed in with Google");
  }, [pendingAuth, login]);

  // نستنى لحد ما الـ state يتثبّت قبل ما نعرض الراوتس
  useEffect(() => {
    if (processing && isAuthenticated) setProcessing(false);
  }, [processing, isAuthenticated]);

  if (processing) return null; // أو Loader
  return children;
}