import { useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PREFIX_RE = /^\/(ar|en)(?=\/|$)/;
const toLang = (lng) => (lng?.startsWith("ar") ? "ar" : "en");

const getUrlLang = () => {
  const m = window.location.pathname.match(PREFIX_RE);
  return m ? m[1] : null;
};

// Rewrites the browser URL so it starts with /<lang> (also drops the legacy ?lang= param)
const applyPrefix = (lang) => {
  const { pathname, search, hash } = window.location;
  const rest = pathname.replace(PREFIX_RE, "");
  const params = new URLSearchParams(search);
  params.delete("lang");
  const qs = params.toString();
  const path = `/${lang}${rest === "/" ? "" : rest}`;
  window.history.replaceState(
    window.history.state,
    "",
    `${path}${qs ? `?${qs}` : ""}${hash}`,
  );
};

const getInitialLang = (i18nLang) => {
  const urlLang = getUrlLang();
  if (urlLang) return urlLang;
  const legacy = new URLSearchParams(window.location.search).get("lang");
  return legacy === "ar" || legacy === "en" ? legacy : toLang(i18nLang);
};

export default function LanguageRouter({ children }) {
  const { i18n } = useTranslation();
  const current = toLang(i18n.language);

  // Runs before BrowserRouter mounts, so the router always reads a prefixed URL
  const [lang, setLang] = useState(() => {
    const initial = getInitialLang(i18n.language);
    applyPrefix(initial);
    return initial;
  });

  // URL language wins on first load
  useEffect(() => {
    if (current !== lang) i18n.changeLanguage(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Language switcher -> URL
  const prev = useRef(current);
  useEffect(() => {
    if (prev.current === current) return;
    prev.current = current;
    if (current !== lang) {
      applyPrefix(current);
      setLang(current);
    }
  }, [current, lang]);

  // Browser back/forward between /en/... and /ar/... entries
  useEffect(() => {
    const onPop = () => {
      const urlLang = getUrlLang();
      if (urlLang && urlLang !== lang) {
        setLang(urlLang);
        i18n.changeLanguage(urlLang);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [lang, i18n]);

  // key={lang} remounts the router so the new basename is picked up
  return (
    <BrowserRouter key={lang} basename={`/${lang}`}>
      {children}
    </BrowserRouter>
  );
}