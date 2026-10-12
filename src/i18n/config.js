import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import "./rtl.css";

const savedLanguage = localStorage.getItem("i18nextLng");
const urlSegment = window.location.pathname.split("/")[1];
const initialLanguage =
  urlSegment === "ar" || urlSegment === "en"
    ? urlSegment
    : savedLanguage === "ar"
      ? "ar"
      : "en";

export const updateDocumentDirection = (lng) => {
  const isAr = lng && (lng === "ar" || lng.startsWith("ar"));
  const dir = isAr ? "rtl" : "ltr";
  const cleanLng = isAr ? "ar" : "en";
  document.documentElement.dir = dir;
  document.documentElement.lang = cleanLng;
  document.body.dir = dir;
  if (isAr) {
    document.documentElement.classList.add("rtl");
    document.body.classList.add("rtl");
  } else {
    document.documentElement.classList.remove("rtl");
    document.body.classList.remove("rtl");
  }
};

// Set direction immediately before initial render
updateDocumentDirection(initialLanguage);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  returnObjects: true,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  const cleanLng = lng && (lng === "ar" || lng.startsWith("ar")) ? "ar" : "en";
  localStorage.setItem("i18nextLng", cleanLng);
  updateDocumentDirection(cleanLng);
});

export default i18n;
