import axiosInstance from "../../../utils/axiosInstance";

// =========================
// Login
// =========================
export const loginUser = async (loginData) => {
  const { email, password, lang } = loginData;

  const response = await axiosInstance.post(
    "/auth/login",
    {
      email,
      password,
    },
    {
      params: {
        lang,
      },
    },
  );

  return response.data;
};

// =========================
// Logout
// POST /auth/logout
// =========================
export const logoutUser = async (lang = "en") => {
  const response = await axiosInstance.post(
    "/auth/logout",
    {},
    {
      params: {
        lang,
      },
    },
  );

  return response.data;
};

// =========================
// Refresh Token
// POST /api/refresh
// =========================
export const refreshTokenApi = async (refreshToken) => {
  const payload = {
    refresh_token: refreshToken,
  };

  try {
    const response = await axiosInstance.post("/auth/refresh", payload);
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const response = await axiosInstance.post("/refresh", payload);
      return response.data;
    }
    throw err;
  }
};

// =========================
// Google Login (Owner Only)
// GET /auth/google/redirect
// =========================
export const googleRedirect = async () => {
  const response = await axiosInstance.get("/auth/google/redirect");

  return response.data;
};

// =========================
// Fetch Authenticated User
// GET /auth/user
// Called after Google OAuth redirect to retrieve the user object
// using the token stored in localStorage (injected by axiosInstance interceptor).
// =========================
export const fetchCurrentUser = async () => {
  const response = await axiosInstance.get("/auth/user");

  return response.data;
};

// =========================
// Register
// =========================
export const registerUser = async (registerData) => {
  const { name, email, phone, password, password_confirmation, lang } =
    registerData;

  const response = await axiosInstance.post(
    "/auth/register",
    {
      name,
      email,
      phone,
      password,
      password_confirmation,
    },
    {
      params: {
        lang,
      },
    },
  );

  return response.data;
};

// =========================
// Forgot Password
// POST /auth/forget-password
// =========================
export const forgotPassword = async (forgotPasswordData) => {
  const { email } = forgotPasswordData;

  const response = await axiosInstance.post("/auth/forget-password", {
    email,
  });

  return response.data;
};

// =========================
// Verify OTP
// POST /auth/forgot-password/verify-otp
// =========================
export const verifyOTP = async (verifyOTPData) => {
  const { email, otp } = verifyOTPData;

  const response = await axiosInstance.post(
    "/auth/forgot-password/verify-otp",
    {
      email,
      otp,
    },
  );

  return response.data;
};

// =========================
// Reset Password
// POST /auth/forgot-password/reset
// =========================
export const resetPassword = async (resetPasswordData) => {
  const { reset_token, password, password_confirmation } = resetPasswordData;

  const response = await axiosInstance.post("/auth/forgot-password/reset", {
    reset_token,
    password,
    password_confirmation,
  });

  return response.data;
};

// =========================
// Resend OTP
// POST /auth/forgot-password/resend-otp
// =========================
export const resendOTP = async (resendOTPData) => {
  const { email } = resendOTPData;

  const response = await axiosInstance.post(
    "/auth/forgot-password/resend-otp",
    {
      email,
    },
  );

  return response.data;
};
