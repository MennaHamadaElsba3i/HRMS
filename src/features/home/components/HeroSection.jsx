import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";
import { APP_NAME } from "../../../utils/global";

// "Smarter HR Management. Empowered Teams." -> ["Smarter HR Management.", "Empowered Teams."]
const splitTitle = (title) => {
  const m = String(title).match(/^(.+?[.!?؟])\s+(.+)$/s);
  return m ? [m[1], m[2]] : [String(title), ""];
};

// "10,000+ Trusted by ..." -> ["10,000+", "Trusted by ..."] (only if it starts with a number)
const splitTrust = (text) => {
  const m = String(text).match(/^(\S*\d\S*)\s+(.*)$/s);
  return m ? [m[1], m[2]] : ["", String(text)];
};

export default function HeroSection({ data }) {
  const { t, i18n } = useTranslation();

  const isRtl = i18n.language?.startsWith("ar");
 const hero = data || {};
  const [titleMain, titleAccent] = hero.title
    ? splitTitle(hero.title)
    : [t("home.hero.titleMain"), t("home.hero.titleAccent")];
  const [trustNumber, trustRest] = hero.trust_text
    ? splitTrust(hero.trust_text)
    : ["10,000+", t("home.hero.trustedBy")];

  const scrollToFeatures = () => {
    const el = document.getElementById("features");

    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section
      id="home"
      className="
        relative
        overflow-hidden
        bg-[#243B53]
        text-white
        pt-28
        pb-16
        sm:pt-32
        sm:pb-20
        lg:pt-36
        lg:pb-28
        scroll-mt-0
      "
    >
      {/* =========================
          BACKGROUND SHAPES
      ========================= */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-0
          top-0
          hidden
          h-72
          w-72
          rounded-full
          bg-[#486581]/10
          blur-3xl
          sm:block
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          bottom-0
          left-0
          hidden
          h-64
          w-64
          rounded-full
          bg-[#5B8C6A]/5
          blur-3xl
          sm:block
        "
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="
            grid
            items-center
            gap-12
            sm:gap-14
            lg:grid-cols-2
            lg:gap-16
          "
        >
          {/* =========================
              LEFT / HERO CONTENT
          ========================= */}

          <motion.div
            initial={{
              opacity: 0,
              x: isRtl ? 60 : -60,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            className="
              relative
              z-10
              text-center
              lg:text-start
            "
          >
            {/* =========================
                1. EYEBROW / BADGE
            ========================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.1,
              }}
              className="
                mx-auto
                mb-4
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/15
                bg-white/5
                px-3.5
                py-1.5
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.06em]
                text-white/80
                sm:mb-6
                sm:px-4
                sm:py-2
                sm:text-xs
                lg:mx-0
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#5B8C6A]" />

              <span>{hero.badge || t("home.hero.badge")}</span>
            </motion.div>

            {/* =========================
                2. MAIN HEADING
            ========================= */}

            <motion.h1
              initial={{
                opacity: 0,
                y: 35,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: "easeOut",
              }}
              className="
                mx-auto
                mb-4
                max-w-3xl
                text-center
                text-3xl
                font-bold
                leading-[1.15]
                tracking-tight
                text-white
                sm:mb-6
                sm:text-5xl
                sm:leading-[1.08]
                lg:mx-0
                lg:text-start
                lg:text-6xl
              "
            >
              {titleMain}{" "}
              {titleAccent && (
                <span className="text-[#AFC4B5]">{titleAccent}</span>
              )}
            </motion.h1>

            {/* =========================
                3. DESCRIPTION (RESPONSIVE)
            ========================= */}

            <motion.p
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.4,
              }}
              className="
                mx-auto
                mb-6
                block
                max-w-2xl
                text-center
                text-sm
                leading-relaxed
                text-white/75
                sm:mb-8
                sm:text-base
                sm:leading-7
                lg:mx-0
                lg:text-start
                lg:text-lg
              "
            >
              {hero.description || t("home.hero.description")}
            </motion.p>

            {/* =========================
                4. CTA BUTTONS
            ========================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.55,
              }}
              className="
                mb-8
                flex
                flex-col
                items-center
                justify-center
                gap-3.5
                sm:mb-10
                sm:flex-row
                sm:gap-4
                lg:justify-start
              "
            >
              {/* Primary CTA */}
              <Link
                to="/register"
                className="
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2.5
                  rounded-lg
                  bg-[#5B8C6A]
                  px-6
                  py-3.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition-all
                  duration-200
                  hover:bg-[#4E7A5B]
                  hover:shadow-md
                  sm:w-auto
                "
              >
                <span>{hero.primary_button || t("home.hero.ctaPrimary")}</span>

                <FiArrowRight
                  className={`
                    h-4
                    w-4
                    transition-transform
                    ${isRtl ? "rotate-180" : ""}
                  `}
                />
              </Link>

              {/* Secondary CTA */}
              <button
                type="button"
                onClick={scrollToFeatures}
                className="
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-white/20
                  bg-white/5
                  px-6
                  py-3.5
                  text-sm
                  font-semibold
                  text-white
                  transition-all
                  duration-200
                  hover:border-white/30
                  hover:bg-white/10
                  sm:w-auto
                "
              >
                {hero.secondary_button || t("home.hero.ctaSecondary")}
              </button>
            </motion.div>

            {/* =========================
                5. TRUST / SOCIAL PROOF
            ========================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.7,
              }}
              className="
                flex
                flex-col
                items-center
                justify-center
                gap-3
                sm:flex-row
                sm:gap-4
                lg:justify-start
                rtl:lg:flex-row-reverse
              "
            >
              {/* Avatars */}
              <div className="flex -space-x-2 rtl:space-x-reverse">
                <span
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    border-[#243B53]
                    bg-[#486581]
                    text-[9px]
                    font-bold
                    text-white
                    sm:h-9
                    sm:w-9
                    sm:text-[10px]
                  "
                >
                  HR
                </span>

                <span
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    border-[#243B53]
                    bg-[#5B8C6A]
                    text-[9px]
                    font-bold
                    text-white
                    sm:h-9
                    sm:w-9
                    sm:text-[10px]
                  "
                >
                  WW
                </span>

                <span
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    border-[#243B53]
                    bg-[#D9E2EC]
                    text-[9px]
                    font-bold
                    text-[#243B53]
                    sm:h-9
                    sm:w-9
                    sm:text-[10px]
                  "
                >
                  AI
                </span>
              </div>

              {/* Trust Text */}
              <p
                className="
                  max-w-[260px]
                  text-center
                  text-xs
                  leading-5
                  text-white/65
                  sm:max-w-none
                  sm:text-sm
                  sm:text-start
                "
              >
                {trustNumber && (
                  <>
                    <strong className="font-semibold text-white">
                      {trustNumber}
                    </strong>{" "}
                  </>
                )}
                {trustRest}
              </p>
            </motion.div>
          </motion.div>

          {/* =========================
              6. RIGHT COLUMN / DASHBOARD PREVIEW
          ========================= */}

          <motion.div
            initial={{
              opacity: 0,
              x: isRtl ? -80 : 80,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            transition={{
              duration: 1,
              delay: 0.25,
              ease: "easeOut",
            }}
            className="
              relative
              mx-auto
              w-full
              max-w-[390px]
              pt-4
              sm:max-w-[500px]
              sm:pt-5
              lg:max-w-none
              lg:pt-0
            "
          >
            {/* =========================
                SHIFT SCHEDULED FLOATING BADGE
            ========================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: -30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.9,
              }}
              className="
                absolute
                -top-1
                left-2
                z-20
                flex
                items-center
                gap-2
                rounded-lg
                border
                border-[#D9E2EC]
                bg-white
                px-2.5
                py-2
                shadow-md
                sm:-top-2
                sm:left-3
                sm:gap-2.5
                sm:px-3
                sm:py-2.5
                lg:-left-8
                lg:-top-5
                lg:gap-3
                lg:rounded-xl
                lg:px-4
                lg:py-3
              "
            >
              <div
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  bg-[#F5F7F8]
                  text-[#486581]
                  sm:h-8
                  sm:w-8
                  lg:h-9
                  lg:w-9
                  lg:rounded-lg
                "
              >
                <FiCalendar className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              </div>

              <div>
                <strong
                  className="
                    block
                    text-[9px]
                    font-semibold
                    text-[#243B53]
                    sm:text-[10px]
                    lg:text-xs
                  "
                >
                  {t("home.hero.preview.shiftScheduled")}
                </strong>

                <small
                  className="
                    mt-0.5
                    block
                    whitespace-nowrap
                    text-[8px]
                    text-[#6B7785]
                    sm:text-[9px]
                    lg:text-[10px]
                  "
                >
                  {t("home.hero.preview.shiftTime")}
                </small>
              </div>
            </motion.div>

            {/* =========================
                DASHBOARD PREVIEW SHELL
            ========================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 40,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.9,
                delay: 0.45,
                ease: "easeOut",
              }}
              className="
                overflow-hidden
                rounded-xl
                border
                border-white/20
                bg-white
                shadow-xl
                shadow-[#102A43]/30
                sm:rounded-2xl
                lg:shadow-2xl
              "
            >
              {/* Preview Bar */}
              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-[#D9E2EC]
                  bg-[#F8FAFB]
                  px-3.5
                  py-2.5
                  sm:px-4
                  sm:py-3
                  lg:px-5
                  lg:py-3.5
                "
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#B44A4A]" />
                  <span className="h-2 w-2 rounded-full bg-[#C58B2A]" />
                  <span className="h-2 w-2 rounded-full bg-[#3F7D5A]" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3F7D5A]" />

                  <span className="text-[8px] font-bold text-[#3F7D5A] sm:text-[9px] lg:text-[11px]">
                    {t("home.hero.preview.liveStatus")}
                  </span>
                </div>
              </div>

              {/* Preview Content */}
              <div
                className="
                  space-y-3
                  p-3.5
                  sm:space-y-4
                  sm:p-5
                  lg:space-y-4.5
                  lg:p-5
                "
              >
                {/* Portal Header */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.85,
                  }}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-2
                  "
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-[#243B53]
                        text-[9px]
                        font-bold
                        text-white
                        sm:h-9
                        sm:w-9
                        lg:h-10
                        lg:w-10
                        lg:text-xs
                      "
                    >
                      WW
                    </div>

                    <div className="min-w-0">
                      <strong
                        className="
                          block
                          truncate
                          text-[10px]
                          font-semibold
                          text-[#243B53]
                          sm:text-[11px]
                          lg:text-[13px]
                        "
                      >
                        {APP_NAME} Portal
                      </strong>

                      <span
                        className="
                          mt-0.5
                          block
                          truncate
                          text-[8px]
                          text-[#6B7785]
                          sm:text-[9px]
                          lg:text-[10px]
                        "
                      >
                        {t("home.hero.preview.portalLabel")}
                      </span>
                    </div>
                  </div>

                  <span
                    className="
                      shrink-0
                      rounded-full
                      bg-[#EAF2ED]
                      px-2
                      py-1
                      text-[8px]
                      font-semibold
                      text-[#3F7D5A]
                      sm:text-[9px]
                      lg:px-2.5
                      lg:text-[10px]
                    "
                  >
                    {t("home.hero.preview.activeQuarter")}
                  </span>
                </motion.div>

                {/* System Operational */}
                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    rounded-md
                    bg-[#F5F7F8]
                    px-2.5
                    py-1.5
                    sm:px-3
                    sm:py-2
                  "
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3F7D5A]" />

                  <span className="text-[8px] font-semibold text-[#486581] sm:text-[9px]">
                    {t("home.hero.preview.systemOperational")}
                  </span>
                </div>

                {/* Stats */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 1,
                  }}
                  className="
                    grid
                    grid-cols-3
                    gap-2
                    sm:gap-2.5
                  "
                >
                  {/* Attendance */}
                  <div
                    className="
                      min-w-0
                      rounded-lg
                      border
                      border-[#D9E2EC]
                      bg-[#F8FAFB]
                      p-2
                      sm:p-2.5
                      lg:p-3
                    "
                  >
                    <span
                      className="
                        block
                        truncate
                        text-[7px]
                        font-medium
                        text-[#6B7785]
                        sm:text-[8px]
                        lg:text-[9px]
                      "
                    >
                      {t("home.hero.preview.attendanceRate")}
                    </span>

                    <strong
                      className="
                        mt-0.5
                        block
                        text-[12px]
                        font-bold
                        text-[#3F7D5A]
                        sm:text-sm
                        lg:text-base
                      "
                    >
                      {t("home.hero.preview.attendanceRateVal")}
                    </strong>
                  </div>

                  {/* Employees */}
                  <div
                    className="
                      min-w-0
                      rounded-lg
                      border
                      border-[#D9E2EC]
                      bg-[#F8FAFB]
                      p-2
                      sm:p-2.5
                      lg:p-3
                    "
                  >
                    <span
                      className="
                        block
                        truncate
                        text-[7px]
                        font-medium
                        text-[#6B7785]
                        sm:text-[8px]
                        lg:text-[9px]
                      "
                    >
                      {t("home.hero.preview.activeEmployees")}
                    </span>

                    <strong
                      className="
                        mt-0.5
                        block
                        text-[12px]
                        font-bold
                        text-[#243B53]
                        sm:text-sm
                        lg:text-base
                      "
                    >
                      {t("home.hero.preview.activeEmployeesVal")}
                    </strong>
                  </div>

                  {/* Pending */}
                  <div
                    className="
                      min-w-0
                      rounded-lg
                      border
                      border-[#D9E2EC]
                      bg-[#F8FAFB]
                      p-2
                      sm:p-2.5
                      lg:p-3
                    "
                  >
                    <span
                      className="
                        block
                        truncate
                        text-[7px]
                        font-medium
                        text-[#6B7785]
                        sm:text-[8px]
                        lg:text-[9px]
                      "
                    >
                      {t("home.hero.preview.pendingRequests")}
                    </span>

                    <strong
                      className="
                        mt-0.5
                        block
                        text-[12px]
                        font-bold
                        text-[#C58B2A]
                        sm:text-sm
                        lg:text-base
                      "
                    >
                      {t("home.hero.preview.pendingRequestsVal")}
                    </strong>
                  </div>
                </motion.div>

                {/* Chart */}
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 1.1,
                  }}
                  className="
                    rounded-lg
                    border
                    border-[#D9E2EC]
                    bg-white
                    p-2.5
                    sm:rounded-xl
                    sm:p-3.5
                    lg:p-4
                  "
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="
                        truncate
                        text-[8px]
                        font-semibold
                        text-[#486581]
                        sm:text-[9px]
                        lg:text-[11px]
                      "
                    >
                      {t("home.hero.preview.weeklyPresence")}
                    </span>

                    <span
                      className="
                        shrink-0
                        text-[8px]
                        font-semibold
                        text-[#5B8C6A]
                        sm:text-[9px]
                        lg:text-[10px]
                      "
                    >
                      {t("home.hero.preview.weeklyTrend")}
                    </span>
                  </div>

                  <div
                    className="
                      mt-3
                      flex
                      h-16
                      items-end
                      gap-1.5
                      sm:mt-4
                      sm:h-20
                      sm:gap-2
                      lg:mt-5
                      lg:h-24
                    "
                  >
                    <span
                      className="w-full rounded-t-sm bg-[#D9E2EC]"
                      style={{ height: "45%" }}
                    />

                    <span
                      className="w-full rounded-t-sm bg-[#D9E2EC]"
                      style={{ height: "65%" }}
                    />

                    <span
                      className="w-full rounded-t-sm bg-[#486581]/70"
                      style={{ height: "85%" }}
                    />

                    <span
                      className="w-full rounded-t-sm bg-[#D9E2EC]"
                      style={{ height: "60%" }}
                    />

                    <span
                      className="w-full rounded-t-sm bg-[#5B8C6A]"
                      style={{ height: "95%" }}
                    />

                    <span
                      className="w-full rounded-t-sm bg-[#D9E2EC]"
                      style={{ height: "70%" }}
                    />

                    <span
                      className="w-full rounded-t-sm bg-[#486581]"
                      style={{ height: "90%" }}
                    />
                  </div>
                </motion.div>

                {/* Insight */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 1.25,
                  }}
                  className="
                    rounded-lg
                    border
                    border-[#D9E2EC]
                    bg-[#F5F7F8]
                    p-2.5
                    sm:p-3
                    lg:p-3.5
                  "
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-md
                        bg-[#EAF2ED]
                        text-[#3F7D5A]
                        sm:h-8
                        sm:w-8
                      "
                    >
                      <FiCheckCircle className="h-3.5 w-3.5" />
                    </div>

                    <p
                      className="
                        text-[8px]
                        leading-4
                        text-[#6B7785]
                        sm:text-[9px]
                        sm:leading-4
                        lg:text-[11px]
                        lg:leading-5
                      "
                    >
                      <strong className="font-semibold text-[#243B53]">
                        {t("home.hero.preview.insightLabel")}
                      </strong>{" "}
                      {t("home.hero.preview.aiInsightText")}
                    </p>
                  </div>
                </motion.div>

                {/* Leave Request */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 1.35,
                  }}
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-[#D9E2EC]
                    bg-white
                    p-2.5
                    sm:p-3
                    lg:p-3.5
                  "
                >
                  <div
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-md
                      bg-[#EAF2ED]
                      text-[#3F7D5A]
                      sm:h-9
                      sm:w-9
                    "
                  >
                    <FiCheckCircle className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0">
                    <strong
                      className="
                        block
                        truncate
                        text-[9px]
                        font-semibold
                        text-[#243B53]
                        sm:text-[10px]
                        lg:text-xs
                      "
                    >
                      {t("home.hero.preview.leaveApproved")}
                    </strong>

                    <small
                      className="
                        mt-0.5
                        block
                        truncate
                        text-[8px]
                        text-[#6B7785]
                        sm:text-[9px]
                        lg:text-[10px]
                      "
                    >
                      {t("home.hero.preview.leaveEmployee")}
                    </small>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* =========================
                BOTTOM FLOATING BADGE (DESKTOP ONLY)
            ========================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 1.1,
              }}
              className="
                absolute
                -bottom-5
                right-2
                z-20
                hidden
                items-center
                gap-3
                rounded-xl
                border
                border-[#D9E2EC]
                bg-white
                px-4
                py-3
                shadow-lg
                lg:-right-8
                lg:flex
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#EAF2ED]
                  text-[#3F7D5A]
                "
              >
                <FiCheckCircle className="h-4 w-4" />
              </div>

              <div>
                <strong className="block text-xs font-semibold text-[#243B53]">
                  {t("home.hero.preview.leaveApproved")}
                </strong>

                <small className="mt-0.5 block text-[10px] text-[#6B7785]">
                  {t("home.hero.preview.leaveEmployee")}
                </small>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}