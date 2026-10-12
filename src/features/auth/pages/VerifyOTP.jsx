import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import "../../../styles/auth/VerifyOTP.css";
import MainAuthForm from "../components/MainAuthForm";

import { useVerifyEmail } from "../hooks/useVerifyEmail";
import { useResendOTP } from "../hooks/useResendOTP";

export default function VerifyOTP() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [resetEmail, setResetEmail] = useState(null);

  const inputRefs = useRef([]);

  const verifyOTPMutation = useVerifyEmail();
  const resendOTPMutation = useResendOTP();

  // Get email from sessionStorage
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("resetEmail");

    if (!savedEmail) {
      toast.error(t("auth.verifyOtp.emailNotFound"));
      navigate("/ForgotPassword", { replace: true });
      return;
    }

    setResetEmail(savedEmail);
  }, [navigate, t]);

  // Countdown timer
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Handle OTP input
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;

    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerify = (e) => {
    e.preventDefault();

    const email = sessionStorage.getItem("resetEmail");

    if (!email) {
      toast.error(t("auth.verifyOtp.emailNotFound"));

      navigate("/ForgotPassword", {
        replace: true,
      });

      return;
    }

    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error(t("auth.verifyOtp.codeLengthError"));
      return;
    }

    const verifyOTPData = {
      email,
      otp: otpValue,
    };

    verifyOTPMutation.mutate(verifyOTPData, {
      onSuccess: (data) => {
        const resetToken = data?.data?.reset_token;

        if (!resetToken) {
          toast.error(t("auth.verifyOtp.resetTokenMissing"));
          return;
        }

        sessionStorage.setItem("resetToken", resetToken);

        toast.success(t("auth.verifyOtp.verifiedSuccess"));

        setTimeout(() => {
          navigate("/ResetPassword", {
            replace: true,
          });
        }, 1000);
      },

      onError: (error) => {
        const status = error?.response?.status;

        if (status === 422) {
          toast.error(t("auth.verifyOtp.validationError"));

          // Clear old reset data
          // sessionStorage.removeItem("resetEmail");
          sessionStorage.removeItem("resetToken");

          // Return to Forgot Password
          // setTimeout(() => {
          //   navigate("/ForgotPassword", {
          //     replace: true,
          //   });
          // }, 1200);

          return;
        }

        if (status === 429) {
          toast.error(t("auth.verifyOtp.tooManyRequests"));
          return;
        }

        toast.error(t("auth.verifyOtp.errorGeneric"));
      },
    });
  };

  // Resend OTP
  const handleResend = () => {
    const email = sessionStorage.getItem("resetEmail");

    if (!email) {
      toast.error(t("auth.verifyOtp.emailNotFound"));

      navigate("/ForgotPassword", {
        replace: true,
      });

      return;
    }

    const resendOTPData = {
      email,
    };

    resendOTPMutation.mutate(resendOTPData, {
      onSuccess: () => {
        setOtp(["", "", "", "", "", ""]);
        setTimer(60);

        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 0);

        toast.success(t("auth.verifyOtp.resendSuccess"));
      },

      onError: (error) => {
        const status = error?.response?.status;

        if (status === 422) {
          toast.error(t("auth.verifyOtp.resendError"));

          sessionStorage.removeItem("resetEmail");
          sessionStorage.removeItem("resetToken");

          setTimeout(() => {
            navigate("/ForgotPassword", {
              replace: true,
            });
          }, 1200);

          return;
        }

        if (status === 429) {
          toast.error(t("auth.verifyOtp.tooManyRequests"));
          return;
        }

        toast.error(t("auth.verifyOtp.resendError"));
      },
    });
  };

  const formattedTimer = `00:${timer.toString().padStart(2, "0")}`;

  return (
    <MainAuthForm>
      <h1 className="title">{t("auth.verifyOtp.title")}</h1>

      <p className="subtitle">{t("auth.verifyOtp.subtitle")}</p>

      {/* Email */}
      {resetEmail && (
        <div className="otp-email-container">
          <span className="otp-email-label">
            {t("auth.verifyOtp.emailSentTo")}
          </span>

          <span className="otp-email">{resetEmail}</span>
        </div>
      )}

      <form onSubmit={handleVerify}>
        <div className="form-group">
          <label>{t("auth.verifyOtp.codeLabel")}</label>

          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={verifyOTPMutation.isPending}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="sign-in"
          disabled={verifyOTPMutation.isPending || resendOTPMutation.isPending}
        >
          {verifyOTPMutation.isPending
            ? t("auth.verifyOtp.verifying")
            : t("auth.verifyOtp.verifyButton")}
        </button>
      </form>

      <div className="resend-code">
        {timer > 0 ? (
          <span>
            {t("auth.verifyOtp.resendPrompt")}{" "}
            <strong>
              {t("auth.verifyOtp.resendIn", {
                time: formattedTimer,
              })}
            </strong>
          </span>
        ) : (
          <>
            <span>{t("auth.verifyOtp.didntReceive")}</span>

            <button
              type="button"
              className="verify-btn"
              onClick={handleResend}
              disabled={
                resendOTPMutation.isPending || verifyOTPMutation.isPending
              }
            >
              {resendOTPMutation.isPending
                ? t("auth.verifyOtp.sending")
                : t("auth.verifyOtp.resendCode")}
            </button>
          </>
        )}
      </div>

      <div className="back-login">
        <Link to="/login">{t("auth.verifyOtp.backToSignIn")}</Link>
      </div>
    </MainAuthForm>
  );
}
