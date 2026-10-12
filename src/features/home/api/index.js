import axiosInstance from "../../../utils/axiosInstance";

// =====================================================
// GET PUBLIC LANDING PAGE
// GET /api/landing-page   (no auth)
// Language is sent via Accept-Language header (ar | en)
// =====================================================
export const getLandingPage = async (lang) => {
  const response = await axiosInstance.get("/landing-page", {
    headers: lang
      ? { "Accept-Language": lang, "App-Language": lang }
      : undefined,
  });

  return response.data;
};