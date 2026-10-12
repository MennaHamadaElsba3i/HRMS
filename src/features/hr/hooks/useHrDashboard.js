import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getHrDashboard } from "../api";

const useHrDashboard = (perPage = 10) => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(false);

      try {
        const res = await getHrDashboard({ per_page: perPage }, lang);
        if (!cancelled) setData(res?.data ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setErrorMessage(err?.response?.data?.message || "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [lang, perPage, reloadKey]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return { data, loading, error, errorMessage, refetch };
};

export default useHrDashboard;