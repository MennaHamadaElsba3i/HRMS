// Same normalization used in axiosInstance / Sidebar
export const getAiLang = (i18n) =>
    i18n.language?.startsWith("ar") ? "ar" : "en";

// Quarter options in the "YYYY-Qn" format shown in the API docs.
// Current quarter + the previous 3, newest first.
export const getQuarterOptions = (count = 4) => {
    const now = new Date();
    let year = now.getFullYear();
    let quarter = Math.floor(now.getMonth() / 3) + 1;

    const options = [];
    for (let i = 0; i < count; i += 1) {
        options.push(`${year}-Q${quarter}`);
        quarter -= 1;
        if (quarter === 0) {
            quarter = 4;
            year -= 1;
        }
    }
    return options;
};
// Maps an axios error to a user-facing message.
// Prefers the backend message / validation errors when available.
export const getAiErrorMessage = (error, t) => {
    if (error?.code === "ECONNABORTED") return t("ai.errors.timeout");
    if (!error?.response) return t("ai.errors.network");

    const { status, data } = error.response;

    if (status === 422 && data?.errors) {
        const first = Object.values(data.errors).flat()[0];
        if (first) return first;
    }
    if (status === 403) return data?.message || t("ai.errors.forbidden");
    if (status === 404 || status === 405 || status === 501) {
        return t("ai.errors.unavailable");
    }
    if (status >= 500) return t("ai.errors.server");

    return data?.message || t("ai.errors.generic");
};

export const formatAiDate = (value, lang = "en") => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
};
export const humanizeKey = (key) =>
  String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// true if the value (string/number/array/object) contains anything to show
export const hasAiValue = (value) => {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.some(hasAiValue);
  if (typeof value === "object") return Object.values(value).some(hasAiValue);
  return true;
};

// Safe text for any value (never renders an object as a React child)
export const toDisplayText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
export const isInsufficientData = (data) => data?.status === "insufficient_data";