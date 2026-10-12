import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getOwnerDashboard } from "../api";

const useOwnerDashboard = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const reqId = useRef(0);

  // بترجّع true لو نجح، false لو فشل (عشان زرار Refresh)
  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(false);

    try {
      const res = await getOwnerDashboard(lang);
      if (id === reqId.current) setData(res?.data ?? null);
      return true;
    } catch (err) {
      if (id === reqId.current) {
        setError(true);
        setErrorMessage(err?.response?.data?.message || "");
      }
      return false;
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchData();
    return () => {
      reqId.current++;
    };
  }, [fetchData]);

  return { data, loading, error, errorMessage, refetch: fetchData };
};

export default useOwnerDashboard;