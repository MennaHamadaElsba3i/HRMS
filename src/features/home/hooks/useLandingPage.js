import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLandingPage } from "../api";

const useLandingPage = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const fetchLanding = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);

    try {
      const res = await getLandingPage(lang);
      if (id !== requestId.current) return;
      if (res?.success === false) throw new Error(res?.message || "Failed");
      setData(res?.data ?? null);
    } catch {
      if (id !== requestId.current) return;
      setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [lang]);

  // Refetch when the language changes so backend content matches the UI language
  useEffect(() => {
    fetchLanding();
    return () => {
      requestId.current += 1;
    };
  }, [fetchLanding]);

  // Skeleton only on the first load; on language change old content stays until new arrives
  return { data, loading: loading && !data, error, refetch: fetchLanding };
};

export default useLandingPage;