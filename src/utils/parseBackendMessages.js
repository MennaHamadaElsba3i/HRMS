/**
 * parseBackendMessages
 *
 * The backend (on 422 validation errors) combines multiple validation messages
 * into a single string, e.g.:
 *   "The email address field is required. The password field is required."
 *
 * This function splits that string into an array of individual messages.
 * It is ONLY called for 422 responses; all other status codes return
 * a single message and are NOT passed through this function.
 *
 * Strategy:
 *   - Split on ". " (period followed by space).
 *   - Re-append "." to each segment except the last (which already ends in ".").
 *   - Filter out any empty segments.
 *   - If splitting produces only one non-empty segment, return it as-is.
 *
 * @param {string} message - The raw backend message string.
 * @returns {string[]} - Array of individual message strings (length >= 1).
 */
export function parseBackendMessages(message) {
  if (!message || typeof message !== "string") return [];

  const trimmed = message.trim();
  if (!trimmed) return [];

  // Split on ". " boundary
  const segments = trimmed.split(". ");

  if (segments.length <= 1) {
    return [trimmed];
  }

  const messages = segments.map((seg, idx) => {
    const s = seg.trim();
    if (!s) return null;
    if (idx < segments.length - 1) {
      return s.endsWith(".") ? s : s + ".";
    }
    return s.endsWith(".") ? s : s + ".";
  });

  const filtered = messages.filter(Boolean);

  return filtered.length > 0 ? filtered : [trimmed];
}
