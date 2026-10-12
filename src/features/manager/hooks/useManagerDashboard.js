import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getManagerDashboard } from "../api";

const useManagerDashboard = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const requestId = useRef(0);

  const fetchDashboard = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    setErrorMessage("");

    try {
      const res = await getManagerDashboard(lang);
      if (id !== requestId.current) return;

      if (res?.success === false) {
        throw new Error(res?.message || "Request failed");
      }
      setData(res?.data ?? null);
    } catch (err) {
      if (id !== requestId.current) return;
      setData(null);
      setError(true);
      setErrorMessage(err?.response?.data?.message || "");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [lang]);

  // Refetches whenever the language changes (so backend texts match the UI language)
  useEffect(() => {
    fetchDashboard();
    return () => {
      requestId.current += 1; // ignore in-flight responses after unmount / lang change
    };
  }, [fetchDashboard]);

  return { data, loading, error, errorMessage, refetch: fetchDashboard };
};

export default useManagerDashboard;