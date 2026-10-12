import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiCheck,
  FiArrowRight,
  FiChevronRight,
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiCalendar,
  FiFileText,
  FiUserPlus,
  FiTarget,
} from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";

const ROLE_ICONS = [FiUsers, FiUserPlus, FiTarget];

// Highlights the last two words of the title: "Turn HR data into | smarter decisions."
const splitAiTitle = (title) => {
  const words = String(title).trim().split(/\s+/);
  if (words.length < 3) return [String(title), ""];
  return [words.slice(0, -2).join(" "), words.slice(-2).join(" ")];
};

export default function RolesSection({ roles, aiInsights }) {
  const { t } = useTranslation();

  const [activeRole, setActiveRole] = useState(0);

  const getPoints = (key, fallback = []) => {
    const res = t(key, { returnObjects: true });
    return Array.isArray(res) ? res : fallback;
  };

  // Fallback content (used only when the API fails / returns nothing)
  const fallbackRoleCards = [
    {
      num: "01",
      label: t("home.roles.cards.hr.label", "HR Leaders"),
      title: t("home.roles.cards.hr.title", "Complete Operational Control"),
      desc: t(
        "home.roles.cards.hr.desc",
        "Automate repetitive workflows, maintain compliance, manage organizational hierarchies, and gain instant reporting with minimal manual effort."
      ),
      points: getPoints("home.roles.cards.hr.points", [
        "Automated onboarding & offboarding",
        "Comprehensive policy enforcement",
        "Instant bulk actions & CSV exports",
      ]),
      icon: FiUsers,
      accent: "green",
    },
    {
      num: "02",
      label: t("home.roles.cards.employee.label", "Employees"),
      title: t(
        "home.roles.cards.employee.title",
        "Intuitive Self-Service Portal"
      ),
      desc: t(
        "home.roles.cards.employee.desc",
        "Give your employees seamless access to request leaves, track attendance, review personal goals, and manage profile information on any device."
      ),
      points: getPoints("home.roles.cards.employee.points", [
        "One-click leave requests",
        "Transparent balance & history tracking",
        "Goal progress visibility",
      ]),
      icon: FiUserPlus,
      accent: "navy",
    },
    {
      num: "03",
      label: t("home.roles.cards.manager.label", "Managers & C-Level"),
      title: t(
        "home.roles.cards.manager.title",
        "Team Oversight & Agile Approvals"
      ),
      desc: t(
        "home.roles.cards.manager.desc",
        "Equip managers to review team attendance, approve leave requests in seconds, conduct structured evaluations, and foster team growth."
      ),
      points: getPoints("home.roles.cards.manager.points", [
        "Single-inbox approval center",
        "Team attendance overview",
        "Structured performance feedback",
      ]),
      icon: FiTarget,
      accent: "steel",
    },
  ];

  // Backend roles (sorted by `order`) or fallback
  const roleCards =
    Array.isArray(roles) && roles.length > 0
      ? [...roles]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((r, i) => ({
            num: String(i + 1).padStart(2, "0"),
            label: r.role_name,
            title: r.title,
            desc: r.description,
            points: Array.isArray(r.features) ? r.features : [],
            icon: ROLE_ICONS[i % ROLE_ICONS.length],
          }))
      : fallbackRoleCards;

  const ai = aiInsights || {};
  const [aiTitleMain, aiTitleAccent] = ai.title
    ? splitAiTitle(ai.title)
    : [
        t("home.roles.aiBanner.titlePart1"),
        t("home.roles.aiBanner.titleHighlight"),
      ];

  const currentRole = roleCards[activeRole] || roleCards[0];
  const CurrentIcon = currentRole.icon;

  const headingVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.65,
        ease: "easeOut",
      },
    },
  };

  return (
    <section
      id="roles"
      className="relative overflow-hidden bg-white px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* =========================
            SECTION HEADING
        ========================= */}

        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.25,
          }}
          className="mx-auto max-w-3xl text-center"
        >
          {/* Badge */}

          <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E2EC] bg-[#F5F7F8] px-4 py-2 text-xs font-semibold text-[#486581] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5B8C6A]" />

            <span>{t("home.roles.badge")}</span>
          </div>

          {/* Title */}

          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[#202B33] sm:text-4xl lg:text-5xl">
            {t("home.roles.title")}
          </h2>

          {/* Subtitle */}

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#6B7785] sm:text-base sm:leading-7">
            {t("home.roles.subtitle")}
          </p>
        </motion.div>

        {/* =========================
            ROLE SELECTOR
        ========================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.55,
            delay: 0.15,
          }}
          className="mx-auto mt-12 max-w-5xl border-b border-[#D9E2EC]"
        >
          <div className="grid grid-cols-3">
            {roleCards.map((role, index) => {
              const isActive = activeRole === index;

              return (
                <button
                  key={role.num}
                  type="button"
                  onClick={() => setActiveRole(index)}
                  className={`relative flex min-h-[72px] flex-col items-center justify-center gap-1 px-2 text-center transition-all duration-300 sm:min-h-[80px] sm:flex-row sm:gap-3 ${
                    isActive
                      ? "text-[#243B53]"
                      : "text-[#9AA6B2] hover:text-[#486581]"
                  }`}
                >
                  {/* Number */}

                  <span
                    className={`text-[11px] font-bold tracking-[0.16em] sm:text-xs ${
                      isActive ? "text-[#5B8C6A]" : "text-[#AAB5BF]"
                    }`}
                  >
                    {role.num}
                  </span>

                  {/* Label */}

                  <span className="max-w-[130px] text-xs font-semibold sm:max-w-none sm:text-sm lg:text-base">
                    {role.label}
                  </span>

                  {/* Active Line */}

                  {isActive && (
                    <motion.span
                      layoutId="activeRoleLine"
                      className="absolute bottom-[-1px] left-[12%] right-[12%] h-0.5 rounded-full bg-[#5B8C6A] sm:left-[18%] sm:right-[18%]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* =========================
            ROLE SHOWCASE
        ========================= */}

        <div className="relative mt-10 sm:mt-12 lg:mt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRole.num}
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -18,
              }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
              }}
              className="grid items-center gap-10 rounded-[28px] border border-[#D9E2EC] bg-[#F5F7F8] p-6 shadow-sm sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:p-12"
            >
              {/* =========================
                  LEFT CONTENT
              ========================= */}

              <div className="min-w-0">
                {/* Number + Role */}

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#243B53] text-xs font-bold text-white">
                    {currentRole.num}
                  </div>

                  <span className="text-sm font-semibold text-[#486581]">
                    {currentRole.label}
                  </span>
                </div>

                {/* Icon */}

                <div className="mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF2ED] text-[#3F7D5A]">
                  <CurrentIcon className="h-6 w-6" />
                </div>

                {/* Title */}

                <h3 className="mt-6 max-w-xl text-2xl font-bold leading-tight tracking-tight text-[#243B53] sm:text-3xl lg:text-4xl">
                  {currentRole.title}
                </h3>

                {/* Description */}

                <p className="mt-5 max-w-xl text-sm leading-7 text-[#6B7785] sm:text-base sm:leading-8">
                  {currentRole.desc}
                </p>

                {/* Features */}

                <div className="mt-7 space-y-3">
                  {currentRole.points.map((point, index) => (
                    <motion.div
                      key={`${point}-${index}`}
                      initial={{
                        opacity: 0,
                        x: -12,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay: 0.12 + index * 0.08,
                        duration: 0.3,
                      }}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF2ED] text-[#3F7D5A]">
                        <FiCheck className="h-3 w-3" />
                      </span>

                      <span className="text-sm leading-6 text-[#486581]">
                        {point}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* =========================
                  RIGHT PRODUCT PREVIEW
              ========================= */}

              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.96,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.08,
                  ease: "easeOut",
                }}
                className="relative min-w-0"
              >
                {/* Browser / Dashboard Window */}

                <div className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-xl shadow-[#243B53]/10">
                  {/* Window Header */}

                  <div className="flex items-center justify-between border-b border-[#EAEDF1] px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#D9E2EC]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#D9E2EC]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#D9E2EC]" />
                    </div>

                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9AA6B2]">
                      WiseWork
                    </span>
                  </div>

                  {/* =========================
                      HR PREVIEW
                  ========================= */}

                  {activeRole === 0 && (
                    <div className="p-5 sm:p-7">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium text-[#9AA6B2]">
                            {t("home.roles.preview.hr.section")}
                          </p>

                          <h4 className="mt-1 text-lg font-bold text-[#243B53] sm:text-xl">
                            {t("home.roles.preview.hr.title")}
                          </h4>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2ED] text-[#3F7D5A]">
                          <FiUsers className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <PreviewStat
                          icon={FiUsers}
                          label="Employees"
                          value="1,248"
                        />

                        <PreviewStat
                          icon={FiClock}
                          label="Attendance"
                          value="94%"
                        />

                        <PreviewStat
                          icon={FiFileText}
                          label="Reports"
                          value="24"
                        />
                      </div>

                      <div className="mt-5">
                        <PreviewProgress
                          label="Workforce utilization"
                          value="86%"
                          width="86%"
                        />

                        <PreviewProgress
                          label="Policy compliance"
                          value="92%"
                          width="92%"
                        />
                      </div>
                    </div>
                  )}

                  {/* =========================
                      EMPLOYEE PREVIEW
                  ========================= */}

                  {activeRole === 1 && (
                    <div className="p-5 sm:p-7">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium text-[#9AA6B2]">
                            {t("home.roles.preview.employee.section")}
                          </p>

                          <h4 className="mt-1 text-lg font-bold text-[#243B53] sm:text-xl">
                            {t("home.roles.preview.employee.greeting")}
                          </h4>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F3F6] text-[#486581]">
                          <FiUserPlus className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-6 rounded-2xl border border-[#D9E2EC] bg-[#F5F7F8] p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#486581]">
                            {t("home.roles.preview.employee.leaveBalance")}
                          </span>

                          <span className="text-sm font-bold text-[#243B53]">
                            {t("home.roles.preview.employee.leaveDays")}
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#D9E2EC]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "70%" }}
                            transition={{
                              duration: 0.8,
                              delay: 0.2,
                            }}
                            className="h-full rounded-full bg-[#5B8C6A]"
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <PreviewStat
                          icon={FiClock}
                          label="Attendance"
                          value="96%"
                        />

                        <PreviewStat
                          icon={FiTarget}
                          label="Goal progress"
                          value="85%"
                        />
                      </div>

                      <button
                        type="button"
                        className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#243B53] px-4 py-3 text-xs font-semibold text-white"
                      >
                        <span>Request Leave</span>
                        <FiArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* =========================
                      MANAGER PREVIEW
                  ========================= */}

                  {activeRole === 2 && (
                    <div className="p-5 sm:p-7">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium text-[#9AA6B2]">
                            {t("home.roles.preview.manager.section")}
                          </p>

                          <h4 className="mt-1 text-lg font-bold text-[#243B53] sm:text-xl">
                            {t("home.roles.preview.manager.title")}
                          </h4>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F3F6] text-[#486581]">
                          <FiCalendar className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        <ApprovalRow
                          name="Ahmed Hassan"
                          type="Leave request"
                        />

                        <ApprovalRow name="Sara Ali" type="Leave request" />

                        <ApprovalRow
                          name="Omar Khaled"
                          type="Performance review"
                        />
                      </div>

                      <div className="mt-5 rounded-2xl bg-[#F5F7F8] p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-[#486581]">
                              {t("home.roles.preview.manager.teamAttendance")}
                            </p>

                            <p className="mt-1 text-xl font-bold text-[#243B53]">
                              92%
                            </p>
                          </div>

                          <FiTrendingUp className="h-5 w-5 text-[#5B8C6A]" />
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#D9E2EC]">
                          <div className="h-full w-[92%] rounded-full bg-[#5B8C6A]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* =========================
            AI INSIGHTS BANNER
        ========================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 35,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
          className="mt-10 overflow-hidden rounded-[28px] bg-[#243B53] lg:grid lg:grid-cols-[0.9fr_1.1fr]"
        >
          {/* =========================
              LEFT CONTENT
              Desktop Only
          ========================= */}

          <div className="hidden p-7 sm:p-9 lg:block lg:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
              <LuSparkles className="h-3.5 w-3.5 text-[#8FB79A]" />

              <span>{ai.badge || t("home.roles.aiBanner.kicker")}</span>
            </div>

            <h3 className="mt-5 max-w-xl text-2xl font-bold leading-tight text-white sm:text-3xl">
              {aiTitleMain}{" "}
              {aiTitleAccent && (
                <span className="text-[#8FB79A]">{aiTitleAccent}</span>
              )}
            </h3>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
              {ai.description || t("home.roles.aiBanner.desc")}
            </p>

            <a
              href="#features"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-[#8FB79A]"
            >
              <span>{ai.button_text || t("home.roles.aiBanner.cta")}</span>

              <FiArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* =========================
              AI INSIGHTS PREVIEW
              Visible Everywhere
          ========================= */}

          <div className="flex min-w-0 items-center justify-center bg-[#102A43]/40 p-5 sm:p-7 md:p-9 lg:border-l lg:border-white/10 lg:p-10">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white p-5 shadow-2xl sm:p-6">
              {/* CARD HEADER */}

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-[#243B53]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF2ED] text-[#5B8C6A]">
                    <LuSparkles className="h-4 w-4" />
                  </div>

                  <span className="truncate">
                    {t("home.roles.aiBanner.cardTitle")}
                  </span>
                </div>

                <span className="shrink-0 text-[10px] font-medium text-[#9AA6B2] sm:text-xs">
                  {t("home.roles.aiBanner.cardUpdated")}
                </span>
              </div>

              {/* CARD BODY */}

              <div className="mt-6 grid gap-6 sm:grid-cols-[0.8fr_1.2fr]">
                {/* Score */}

                <div>
                  <span className="text-xs font-medium text-[#9AA6B2]">
                    {t("home.roles.aiBanner.scoreLabel")}
                  </span>

                  <div className="mt-1 flex items-end gap-1">
                    <span className="text-4xl font-bold text-[#243B53]">
                      86
                    </span>

                    <span className="mb-1 text-sm text-[#9AA6B2]">
                      {t("home.roles.aiBanner.scoreMax")}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#3F7D5A]">
                    <FiTrendingUp className="h-3.5 w-3.5" />

                    <span>{t("home.roles.aiBanner.trend")}</span>
                  </div>
                </div>

                {/* Chart */}

                <div className="flex h-28 items-end gap-2 border-b border-[#EAEDF1] pb-1">
                  {[44, 64, 54, 82, 72, 95].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{
                        height: 0,
                      }}
                      whileInView={{
                        height: `${height}%`,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        duration: 0.5,
                        delay: 0.1 + index * 0.08,
                      }}
                      className={`flex-1 rounded-t-md ${
                        index === 3 || index === 5
                          ? "bg-[#243B53]"
                          : "bg-[#8FB79A]"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* WHAT WE NOTICED */}

              <motion.div
                whileHover={{
                  scale: 1.01,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="mt-5 flex items-center gap-3 rounded-xl bg-[#F5F7F8] p-3 sm:p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF2ED] text-[#3F7D5A]">
                  <LuSparkles className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#243B53]">
                    {t("home.roles.aiBanner.noticeTitle")}
                  </p>

                  <p className="mt-0.5 text-[11px] leading-5 text-[#6B7785] sm:text-xs">
                    {t("home.roles.aiBanner.noticeDesc")}
                  </p>
                </div>

                <FiChevronRight className="h-4 w-4 shrink-0 text-[#9AA6B2]" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* =========================================================
   SMALL PREVIEW COMPONENTS
========================================================= */

function PreviewStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#D9E2EC] bg-white p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[#5B8C6A]" />

        <span className="text-[10px] font-medium text-[#9AA6B2]">{label}</span>
      </div>

      <p className="mt-2 text-lg font-bold text-[#243B53]">{value}</p>
    </div>
  );
}

function PreviewProgress({ label, value, width }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#6B7785]">{label}</span>

        <span className="text-xs font-bold text-[#243B53]">{value}</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAEDF1]">
        <motion.div
          initial={{
            width: 0,
          }}
          animate={{
            width,
          }}
          transition={{
            duration: 0.7,
            delay: 0.15,
          }}
          className="h-full rounded-full bg-[#5B8C6A]"
        />
      </div>
    </div>
  );
}

function ApprovalRow({ name, type }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#D9E2EC] bg-white p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0F3F6] text-xs font-bold text-[#486581]">
        {name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-[#243B53]">{name}</p>

        <p className="mt-0.5 truncate text-[10px] text-[#9AA6B2]">{type}</p>
      </div>

      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF2ED] text-[#3F7D5A]">
        <FiCheck className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}