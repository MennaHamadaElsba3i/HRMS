import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import "../../../styles/auth/ResetPassword.css";

import MainAuthForm from "../components/MainAuthForm";
import { useResetPassword } from "../hooks/useResetPassword";
import { useAuth } from "../../../context/AuthContext";

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clearAuthSession } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetPasswordMutation = useResetPassword();

  // =====================================================
  // PASSWORD REQUIREMENTS
  // =====================================================

  const passwordRequirements = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  // =====================================================
  // PASSWORD STRENGTH
  // =====================================================

  const strengthScore =
    Object.values(passwordRequirements).filter(Boolean).length;

  const strengthPercentage = (strengthScore / 5) * 100;

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleReset = (e) => {
    e.preventDefault();

    // ===================================================
    // CHECK PASSWORD REQUIREMENTS
    // ===================================================

    if (strengthScore < 5) {
      toast.error(t("auth.resetPassword.errorRequirements"));
      return;
    }

    // ===================================================
    // CHECK PASSWORD MATCH
    // ===================================================

    if (newPassword !== confirmPassword) {
      toast.error(t("auth.resetPassword.errorMismatch"));
      return;
    }

    // ===================================================
    // GET RESET TOKEN
    // ===================================================

    const resetToken = sessionStorage.getItem("resetToken");

    if (!resetToken) {
      toast.error(t("auth.resetPassword.errorGeneric"));

      navigate("/ForgotPassword", {
        replace: true,
      });

      return;
    }

    // ===================================================
    // REQUEST DATA
    // ===================================================

    // Swagger does NOT support "lang" for this endpoint.
    const resetPasswordData = {
      reset_token: resetToken,
      password: newPassword,
      password_confirmation: confirmPassword,
    };

    console.log("=================================");
    console.log("RESET PASSWORD");
    console.log("Reset Password data:", {
      reset_token: resetToken,
      password: "***",
      password_confirmation: "***",
    });
    console.log("=================================");

    // ===================================================
    // SEND REQUEST
    // ===================================================

    resetPasswordMutation.mutate(resetPasswordData, {
      // ===============================================
      // SUCCESS
      // ===============================================

      onSuccess: (data) => {
        console.log("=================================");
        console.log("RESET PASSWORD SUCCESS");
        console.log("Reset Password response:", data);
        console.log("=================================");

        // =================================================
        // REMOVE TEMPORARY RESET DATA
        // =================================================

        sessionStorage.removeItem("resetEmail");
        sessionStorage.removeItem("resetToken");
        sessionStorage.removeItem("authFlow");

        // =================================================
        // CLEAR ANY OLD AUTH SESSION
        // =================================================
        // This is important if an Admin/Owner was logged in
        // in the same browser before starting activation.

        clearAuthSession();

        // =================================================
        // SUCCESS MESSAGE
        // =================================================

        toast.success(t("auth.resetPassword.success"));

        // =================================================
        // GO TO LOGIN
        // =================================================

        setTimeout(() => {
          navigate("/login", {
            replace: true,
          });
        }, 1200);
      },

      // ===============================================
      // ERROR
      // ===============================================

      onError: (error) => {
        console.log("=================================");
        console.log("RESET PASSWORD ERROR");
        console.log("Status:", error?.response?.status);
        console.log("Backend response:", error?.response?.data);
        console.log("=================================");

        const status = error?.response?.status;

        // =================================================
        // GET ACTUAL BACKEND MESSAGE
        // =================================================

        const backendMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data?.errors?.[0] ||
          error?.message;

        // =================================================
        // 422
        // Invalid / expired reset token
        // =================================================

        if (status === 422) {
          toast.error(
            backendMessage ||
              t("auth.resetPassword.errorGeneric")
          );

          sessionStorage.removeItem("resetToken");
          sessionStorage.removeItem("resetEmail");

          setTimeout(() => {
            navigate("/ForgotPassword", {
              replace: true,
            });
          }, 1500);

          return;
        }

        // =================================================
        // 429
        // Too many requests
        // =================================================

        if (status === 429) {
          toast.error(
            backendMessage ||
              t("auth.resetPassword.errorGeneric")
          );

          return;
        }

        // =================================================
        // OTHER BACKEND ERRORS
        // =================================================

        toast.error(
          backendMessage ||
            t("auth.resetPassword.errorGeneric")
        );
      },
    });
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <MainAuthForm>
      <div className="reset-password-card">

        {/* =================================================
            TITLE
        ================================================= */}

        <h1>
          {t("auth.resetPassword.title")}
        </h1>

        <p className="reset-password-description">
          {t("auth.resetPassword.subtitle")}
        </p>

        {/* =================================================
            NEW PASSWORD
        ================================================= */}

        <div className="password-field">
          <label htmlFor="newPassword">
            {t("auth.resetPassword.newPassword")}
          </label>

          <div className="password-input-wrapper">
            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t(
                "auth.resetPassword.newPasswordPlaceholder"
              )}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={resetPasswordMutation.isPending}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowNewPassword((prev) => !prev)
              }
              disabled={resetPasswordMutation.isPending}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* =================================================
            PASSWORD STRENGTH
        ================================================= */}

        <div className="password-strength">
          <div className="strength-bar">
            <div
              className="strength-bar-fill"
              style={{
                width: `${strengthPercentage}%`,
              }}
            />
          </div>

          <span>
            {t("auth.resetPassword.strength")}
          </span>

          <div className="requirements">

            {/* LENGTH */}

            <div
              className={
                passwordRequirements.length
                  ? "requirement valid"
                  : "requirement"
              }
            >
              <span className="requirement-circle" />

              {t("auth.resetPassword.reqLength")}
            </div>

            {/* UPPERCASE */}

            <div
              className={
                passwordRequirements.uppercase
                  ? "requirement valid"
                  : "requirement"
              }
            >
              <span className="requirement-circle" />

              {t("auth.resetPassword.reqUppercase")}
            </div>

            {/* LOWERCASE */}

            <div
              className={
                passwordRequirements.lowercase
                  ? "requirement valid"
                  : "requirement"
              }
            >
              <span className="requirement-circle" />

              {t("auth.resetPassword.reqLowercase")}
            </div>

            {/* NUMBER */}

            <div
              className={
                passwordRequirements.number
                  ? "requirement valid"
                  : "requirement"
              }
            >
              <span className="requirement-circle" />

              {t("auth.resetPassword.reqNumber")}
            </div>

            {/* SPECIAL */}

            <div
              className={
                passwordRequirements.special
                  ? "requirement valid"
                  : "requirement"
              }
            >
              <span className="requirement-circle" />

              {t("auth.resetPassword.reqSpecial")}
            </div>

          </div>
        </div>

        {/* =================================================
            CONFIRM PASSWORD
        ================================================= */}

        <div className="password-field confirm-field">
          <label htmlFor="confirmPassword">
            {t("auth.resetPassword.confirmPassword")}
          </label>

          <div className="password-input-wrapper">
            <input
              id="confirmPassword"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              placeholder={t(
                "auth.resetPassword.confirmPasswordPlaceholder"
              )}
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              disabled={resetPasswordMutation.isPending}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowConfirmPassword((prev) => !prev)
              }
              disabled={resetPasswordMutation.isPending}
            >
              {showConfirmPassword ? (
                <FaEyeSlash />
              ) : (
                <FaEye />
              )}
            </button>
          </div>
        </div>

        {/* =================================================
            RESET BUTTON
        ================================================= */}

        <button
          type="button"
          className="reset-password-button"
          onClick={handleReset}
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending
            ? t("auth.resetPassword.resetting")
            : t("auth.resetPassword.resetButton")}
        </button>

      </div>
    </MainAuthForm>
  );
};

export default ResetPassword;