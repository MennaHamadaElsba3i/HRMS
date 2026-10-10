// Per-tab storage (cleared when the tab is closed), keyed by user + feature + language
const PREFIX = "wisework:ai";

const buildKey = (userId, featureKey, lang) =>
  `${PREFIX}:${userId}:${featureKey}:${lang}`;

export const readAiCache = (userId, featureKey, lang) => {
  if (!userId) return null;
  try {
    const raw = sessionStorage.getItem(buildKey(userId, featureKey, lang));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writeAiCache = (userId, featureKey, lang, entry) => {
  if (!userId) return;
  try {
    sessionStorage.setItem(
      buildKey(userId, featureKey, lang),
      JSON.stringify(entry),
    );
  } catch {
    // storage full / blocked: ignore, the result is still shown
  }
};

export const clearAiCache = () => {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
};