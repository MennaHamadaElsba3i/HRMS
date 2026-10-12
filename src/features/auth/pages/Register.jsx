import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import MainAuthForm from "../components/MainAuthForm";
import { useRegister } from "../hooks/useRegister";
import { useAuth } from "../../../context/AuthContext";
import { ROLE_ROUTES } from "../../../utils/roleRoutes";
import { parseBackendMessages } from "../../../utils/parseBackendMessages";

/* =========================
   ANIMATION
========================= */

const containerVariants = {
  hidden: {
    opacity: 0,
    x: 40,
  },

  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const { isAuthenticated, role } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role && ROLE_ROUTES[role]) {
      navigate(ROLE_ROUTES[role], { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // =========================
  // MESSAGE
  // =========================

  const [messageKey, setMessageKey] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState("");
  // messageList holds multiple parsed messages from a 422 response
  const [messageList, setMessageList] = useState([]);

  /* =========================
     PASSWORD VALIDATION
  ========================= */

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  /* =========================
     REGISTER
  ========================= */

  const handleRegister = (e) => {
    e.preventDefault();

    // Clear previous message
    setMessageKey("");
    setMessageText("");
    setMessageType("");
    setMessageList([]);

    // =========================
    // REQUIRED FIELDS
    // =========================

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !contact.trim() ||
      !password ||
      !confirmPassword
    ) {
      setMessageKey("auth.register.errorRequired");
      setMessageType("error");
      return;
    }

    // =========================
    // PASSWORD REQUIREMENTS
    // =========================

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setMessageKey("auth.register.errorRequirements");
      setMessageType("error");
      return;
    }

    // =========================
    // PASSWORD MATCH
    // =========================

    if (password !== confirmPassword) {
      setMessageKey("auth.register.errorMismatch");
      setMessageType("error");
      return;
    }

    // =========================
    // CURRENT LANGUAGE
    // =========================

    // Backend accepts only "ar" or "en"
    const currentLanguage = i18n.language?.startsWith("ar") ? "ar" : "en";

    console.log("=================================");
    console.log("Register language:", i18n.language);
    console.log("Backend language:", currentLanguage);
    console.log("=================================");

    // =========================
    // DATA SENT TO BACKEND
    // =========================

    const registerData = {
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: contact.trim(),
      phone: phone.trim() || null,
      password: password,
      password_confirmation: confirmPassword,
      lang: currentLanguage,
    };

    console.log("Register data:", registerData);

    // =========================
    // REGISTER REQUEST
    // =========================

    registerMutation.mutate(registerData, {
      // ==================================================
      // SUCCESS - 201
      // ==================================================

      onSuccess: (data) => {
        // Registration successful: do not create an active session
        // Direct the user to the Owner Login page as required
        setMessageKey("auth.register.successMessage");
        if (data?.message) {
          setMessageText(data.message);
        }
        setMessageType("success");

        setTimeout(() => {
          navigate("/owner/login", { replace: true });
        }, 1500);
      },

      // ==================================================
      // ERROR
      // ==================================================

      onError: (error) => {
        console.log("========== REGISTER ERROR ==========");
        console.log("FULL ERROR:", error);
        console.log("ERROR MESSAGE:", error?.message);
        console.log("ERROR CODE:", error?.code);
        console.log("ERROR RESPONSE:", error?.response);
        console.log("RESPONSE STATUS:", error?.response?.status);
        console.log("RESPONSE DATA:", error?.response?.data);
        console.log("REQUEST CONFIG:", error?.config);
        console.log("REQUEST URL:", error?.config?.url);
        console.log("REQUEST METHOD:", error?.config?.method);
        console.log("REQUEST DATA:", error?.config?.data);
        console.log("====================================");
        const status = error?.response?.status;
        const responseData = error?.response?.data;

        const backendMessage = responseData?.message;

        // Clear previous messages
        setMessageKey("");
        setMessageText("");
        setMessageList([]);

        // =========================
        // 422 VALIDATION ERROR
        // Backend now combines all validation errors into one message string.
        // =========================

        if (status === 422) {
          if (backendMessage) {
            const messages = parseBackendMessages(backendMessage);

            if (messages.length > 1) {
              setMessageList(messages);
            } else {
              setMessageText(messages[0] || backendMessage);
            }
          } else {
            setMessageKey("auth.register.errorGeneric");
          }

          setMessageType("error");
          return;
        }

        // =========================
        // 429 TOO MANY REQUESTS
        // =========================

        if (status === 429) {
          if (backendMessage) {
            setMessageText(backendMessage);
          } else {
            setMessageKey("auth.register.tooManyRequests");
          }

          setMessageType("error");
          return;
        }

        // =========================
        // OTHER BACKEND ERROR
        // =========================

        if (backendMessage) {
          setMessageText(backendMessage);
        } else {
          setMessageKey("auth.register.errorGeneric");
        }

        setMessageType("error");
      },
    });
  };

  return (
    <MainAuthForm>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* =========================
            TITLE
        ========================= */}

        <motion.h1 className="title" variants={itemVariants}>
          {t("auth.register.title")}
        </motion.h1>

        {/* =========================
            SUBTITLE
        ========================= */}

        <motion.p className="subtitle" variants={itemVariants}>
          {t("auth.register.alreadyHaveAccount")}{" "}
          <Link to="/owner/login" className="signup-link">
            {t("auth.register.signIn")}
          </Link>
        </motion.p>

        <motion.form
          onSubmit={handleRegister}
          className="register-form"
          variants={itemVariants}
        >
          {/* =========================
              FIRST NAME + LAST NAME
          ========================= */}

          <motion.div className="form-row" variants={itemVariants}>
            {/* FIRST NAME */}

            <motion.div className="form-group" variants={itemVariants}>
              <label htmlFor="firstName">{t("auth.register.firstName")}</label>

              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>

                <input
                  id="firstName"
                  type="text"
                  placeholder={t("auth.register.firstNamePlaceholder")}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </motion.div>

            {/* LAST NAME */}

            <motion.div className="form-group" variants={itemVariants}>
              <label htmlFor="lastName">{t("auth.register.lastName")}</label>

              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>

                <input
                  id="lastName"
                  type="text"
                  placeholder={t("auth.register.lastNamePlaceholder")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* =========================
              CONTACT / EMAIL
          ========================= */}

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="contact">{t("auth.register.contact")}</label>

            <div className="input-wrapper">
              <svg
                className="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>

              <input
                id="contact"
                type="email"
                autoComplete="email"
                placeholder={t("auth.register.contactPlaceholder")}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <span className="field-hint">{t("auth.register.contactHint")}</span>
          </motion.div>

          {/* =========================
              PHONE
          ========================= */}

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="phone">{t("auth.register.phone", "Phone")}</label>

            <div className="input-wrapper">
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder={t(
                  "auth.register.phonePlaceholder",
                  "Phone number",
                )}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </motion.div>

          {/* =========================
              PASSWORD
          ========================= */}

          <motion.div
            className="form-group password-group"
            variants={itemVariants}
          >
            <label htmlFor="password">{t("auth.register.password")}</label>

            <div className="input-wrapper">
              <svg
                className="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 018 0v3" />
              </svg>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("auth.register.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword
                    ? t("auth.register.hidePassword")
                    : t("auth.register.showPassword")
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 4.2A10.7 10.7 0 0112 4c7 0 10 8 10 8a16.4 16.4 0 01-3.1 4.5" />
                      <path d="M6.6 6.6C3.8 8.5 2 12 2 12s3 8 10 8a10.5 10.5 0 004-.8" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            {/* PASSWORD HINTS */}

            <motion.div className="password-hints" variants={itemVariants}>
              <span className={`hint-item ${hasMinLength ? "valid" : ""}`}>
                <span className="dot"></span>
                {t("auth.register.reqLength")}
              </span>

              <span className={`hint-item ${hasLetter ? "valid" : ""}`}>
                <span className="dot"></span>
                {t("auth.register.reqLetter")}
              </span>

              <span className={`hint-item ${hasNumber ? "valid" : ""}`}>
                <span className="dot"></span>
                {t("auth.register.reqNumber")}
              </span>
            </motion.div>
          </motion.div>

          {/* =========================
              CONFIRM PASSWORD
          ========================= */}

          <motion.div
            className="form-group password-group"
            variants={itemVariants}
          >
            <label htmlFor="confirmPassword">
              {t("auth.register.confirmPassword")}
            </label>

            <div className="input-wrapper">
              <svg
                className="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 018 0v3" />
              </svg>

              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? t("auth.register.hideConfirmPassword")
                    : t("auth.register.showConfirmPassword")
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showConfirmPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 4.2A10.7 10.7 0 0112 4c7 0 10 8 10 8a16.4 16.4 0 01-3.1 4.5" />
                      <path d="M6.6 6.6C3.8 8.5 2 12 2 12s3 8 10 8a10.5 10.5 0 004-.8" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            {/* PASSWORD MISMATCH */}

            {confirmPassword && password !== confirmPassword && (
              <motion.span
                className="confirm-error"
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                {t("auth.register.errorMismatch")}
              </motion.span>
            )}
          </motion.div>

          {/* =========================
              CREATE ACCOUNT BUTTON
          ========================= */}

          <motion.button
            type="submit"
            className="submit-btn"
            disabled={registerMutation.isPending}
            variants={itemVariants}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            {registerMutation.isPending
              ? t("auth.register.creatingAccount", "Creating Account...")
              : t("auth.register.createAccount")}
          </motion.button>

          {/* =========================
              MESSAGE (single or list)
          ========================= */}

          {messageList.length > 1 ? (
            <motion.div
              className={`form-message ${messageType}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ alignItems: "flex-start" }}
            >
              <span className="message-icon" style={{ marginTop: "1px" }}>
                !
              </span>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1rem",
                  lineHeight: 1.6,
                }}
              >
                {messageList.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </motion.div>
          ) : (messageKey || messageText) ? (
            <motion.div
              className={`form-message ${messageType}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="message-icon">
                {messageType === "success" ? "✓" : "!"}
              </span>

              <span>{messageText || t(messageKey)}</span>
            </motion.div>
          ) : null}


          {/* =========================
              TERMS
          ========================= */}

          <motion.p className="terms-text" variants={itemVariants}>
            {t("auth.register.agreePrefix")}

            <a href="#terms">{t("auth.register.termsOfService")}</a>

            {t("auth.register.and")}

            <a href="#privacy">{t("auth.register.privacyPolicy")}</a>

            {t("auth.register.termsSuffix")}
          </motion.p>
        </motion.form>
      </motion.div>
    </MainAuthForm>
  );
}
