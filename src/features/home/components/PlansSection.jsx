import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const STAGES = ["START", "SCALE", "LEAD"];
const AUDIENCE_KEYS = ["basic", "pro", "enterprise"];

export default function PlansSection({ plans }) {
  const { t } = useTranslation();

  const [activePlan, setActivePlan] = useState(0);

  // Fallback content (used only when the API fails / returns nothing)
  const fallbackPlanTiers = [
    {
      key: "basic",
      name: t("home.plans.basic.name"),
      audience: t("home.plans.basic.audience"),
      stage: "START",
      stageNumber: "01",
      price: t("home.plans.basic.price"),
      userPeriod: t("home.plans.basic.userPeriod"),
      desc: t("home.plans.basic.desc"),
      features: t("home.plans.basic.features", { returnObjects: true }) || [],
      featured: false,
      btnText: t("home.plans.getStarted"),
    },
    {
      key: "pro",
      name: t("home.plans.pro.name"),
      audience: t("home.plans.pro.audience"),
      stage: "SCALE",
      stageNumber: "02",
      price: t("home.plans.pro.price"),
      userPeriod: t("home.plans.pro.userPeriod"),
      desc: t("home.plans.pro.desc"),
      features: t("home.plans.pro.features", { returnObjects: true }) || [],
      featured: true,
      btnText: t("home.plans.getStarted"),
    },
    {
      key: "enterprise",
      name: t("home.plans.enterprise.name"),
      audience: t("home.plans.enterprise.audience"),
      stage: "LEAD",
      stageNumber: "03",
      price: t("home.plans.enterprise.price"),
      userPeriod: t("home.plans.enterprise.userPeriod"),
      desc: t("home.plans.enterprise.desc"),
      features:
        t("home.plans.enterprise.features", { returnObjects: true }) || [],
      featured: false,
      btnText: t("home.plans.contactSales"),
    },
  ];

  // Backend plans (sorted by `order`) or fallback
  const planTiers =
    Array.isArray(plans) && plans.length > 0
      ? [...plans]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((p, i) => ({
            key: p.id,
            name: p.name,
            audience: AUDIENCE_KEYS[i]
              ? t(`home.plans.${AUDIENCE_KEYS[i]}.audience`, "")
              : "",
            stage: STAGES[i] ?? String(i + 1).padStart(2, "0"),
            stageNumber: String(i + 1).padStart(2, "0"),
            price: p.price,
            userPeriod: p.billing_period,
            desc: p.description,
            features: Array.isArray(p.features) ? p.features : [],
            featured: Boolean(p.is_popular),
            btnText: p.button_text,
            link: p.button_link,
          }))
      : fallbackPlanTiers;

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

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 40,
    },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: index * 0.12,
        ease: "easeOut",
      },
    }),
  };

  const selectedPlan = planTiers[activePlan] || planTiers[0];

  return (
    <section
      id="plans"
      className="relative overflow-hidden bg-[#F5F7F8] py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* =========================
            SECTION HEADING
        ========================= */}

        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.3,
          }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E2EC] bg-white px-3 py-1.5 text-sm font-semibold text-[#486581] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#5B8C6A]" />

            <span>{t("home.plans.badge")}</span>
          </div>

          <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-[#202B33] sm:text-4xl lg:text-5xl">
            {t("home.plans.title")}
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#6B7785] sm:text-base sm:leading-8">
            {t("home.plans.subtitle")}
          </p>
        </motion.div>

        {/* =====================================================
            RESPONSIVE ONLY
            MOBILE / TABLET PLAN SELECTOR
        ===================================================== */}

        <div className="mt-14 lg:hidden">
          {/* Horizontal stages */}

          <div className="relative">
            {/* Base Line */}

            <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-[31px] h-px bg-[#D9E2EC]" />

            {/* Active Progress */}

            <motion.div
              initial={false}
              animate={{
                width:
                  activePlan === 0
                    ? "0%"
                    : activePlan === 1
                      ? "33.33%"
                      : "66.66%",
              }}
              transition={{
                duration: 0.35,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute left-[16.66%] top-[31px] h-px bg-[#8FB79A]"
            />

            <div className="relative z-10 grid grid-cols-3">
              {planTiers.map((plan, index) => {
                const isActive = activePlan === index;

                return (
                  <button
                    key={plan.key}
                    type="button"
                    onClick={() => setActivePlan(index)}
                    aria-pressed={isActive}
                    className="flex min-w-0 flex-col items-center text-center outline-none"
                  >
                    <motion.div
                      animate={{
                        scale: isActive ? 1 : 0.9,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      className={`flex h-[62px] w-[62px] items-center justify-center rounded-full border transition-all duration-300 sm:h-[72px] sm:w-[72px] ${
                        isActive
                          ? "border-[#243B53] bg-[#243B53] text-white shadow-lg shadow-[#243B53]/20"
                          : "border-[#D9E2EC] bg-white text-[#486581] shadow-sm"
                      }`}
                    >
                      <div>
                        <span
                          className={`block text-[9px] font-bold tracking-[0.15em] ${
                            isActive ? "text-white/60" : "text-[#9AA6B2]"
                          }`}
                        >
                          {plan.stageNumber}
                        </span>

                        <span className="mt-0.5 block text-[10px] font-bold tracking-[0.1em] sm:text-xs">
                          {plan.stage}
                        </span>
                      </div>
                    </motion.div>

                    <span
                      className={`mt-2 text-[10px] font-bold uppercase tracking-[0.06em] sm:text-xs ${
                        isActive ? "text-[#243B53]" : "text-[#9AA6B2]"
                      }`}
                    >
                      {plan.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Plan */}

          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPlan.key}
                initial={{
                  opacity: 0,
                  y: 16,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                }}
              >
                <div
                  className={`rounded-[24px] border bg-white p-6 shadow-md ${
                    selectedPlan.featured
                      ? "border-[#243B53] shadow-[#243B53]/10"
                      : "border-[#D9E2EC]"
                  }`}
                >
                  {/* Featured */}

                  <div className="min-h-[24px]">
                    {selectedPlan.featured && (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2ED] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#3F7D5A]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5B8C6A]" />

                        <span>{t("home.plans.recommendedBadge")}</span>
                      </div>
                    )}
                  </div>

                  {/* Name */}

                  <div className="mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA6B2]">
                      {selectedPlan.stageNumber} · {selectedPlan.stage}
                    </span>

                    <h3 className="mt-2 text-2xl font-bold text-[#243B53]">
                      {selectedPlan.name}
                    </h3>

                    <p className="mt-1.5 text-sm font-medium text-[#6B7785]">
                      {selectedPlan.audience}
                    </p>
                  </div>

                  {/* Price */}

                  <div className="mt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tight text-[#243B53]">
                        {selectedPlan.price}
                      </span>

                      <span className="text-xs font-medium text-[#9AA6B2] sm:text-sm">
                        {selectedPlan.userPeriod}
                      </span>
                    </div>
                  </div>

                  {/* Description */}

                  <p className="mt-4 text-sm leading-6 text-[#6B7785]">
                    {selectedPlan.desc}
                  </p>

                  <div className="my-6 h-px w-full bg-[#EAEDF1]" />

                  {/* Features */}

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#486581]">
                      {t("home.plans.whatsIncluded")}
                    </p>

                    <ul className="mt-4 space-y-3">
                      {Array.isArray(selectedPlan.features) &&
                        selectedPlan.features.map((feat, index) => (
                          <motion.li
                            key={index}
                            initial={{
                              opacity: 0,
                              x: -8,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                            }}
                            transition={{
                              delay: index * 0.04,
                              duration: 0.25,
                            }}
                            className="flex items-start gap-3 text-sm leading-6 text-[#486581]"
                          >
                            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF2ED] text-[#3F7D5A]">
                              <FiCheck className="h-3 w-3" />
                            </span>

                            <span>{feat}</span>
                          </motion.li>
                        ))}
                    </ul>
                  </div>

                  {/* Button */}

                  <div className="mt-8">
                    <Link
                      to={selectedPlan.link || "/register"}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#243B53] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-[#243B53]/15 transition-all duration-200 hover:bg-[#102A43]"
                    >
                      <span>{selectedPlan.btnText}</span>

                      <FiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* =====================================================
            DESKTOP ONLY
            ORIGINAL 3-CARD LAYOUT
        ===================================================== */}

        <div className="relative mt-16 hidden lg:mt-20 lg:block">
          {/* DESKTOP CONNECTING LINE */}

          <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-[42px] h-px bg-[#D9E2EC]" />

          {/* Animated progress line */}

          <motion.div
            initial={{
              scaleX: 0,
            }}
            whileInView={{
              scaleX: 1,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
            }}
            className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-[42px] h-px origin-left bg-[#8FB79A]"
          />

          {/* PLAN ITEMS */}

          <div className="grid grid-cols-3 gap-8">
            {planTiers.map((plan, index) => (
              <motion.div
                key={plan.key}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{
                  once: true,
                  amount: 0.15,
                }}
                className="relative flex flex-col"
              >
                {/* STAGE */}

                <div className="relative z-10 flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{
                      scale: 1.08,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className={`flex h-[84px] w-[84px] items-center justify-center rounded-full border ${
                      plan.featured
                        ? "border-[#243B53] bg-[#243B53] text-white shadow-lg shadow-[#243B53]/20"
                        : "border-[#D9E2EC] bg-white text-[#243B53] shadow-sm"
                    }`}
                  >
                    <div className="text-center">
                      <span
                        className={`block text-[10px] font-bold tracking-[0.18em] ${
                          plan.featured ? "text-white/60" : "text-[#9AA6B2]"
                        }`}
                      >
                        {plan.stageNumber}
                      </span>

                      <span className="mt-0.5 block text-xs font-bold tracking-[0.12em]">
                        {plan.stage}
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* PLAN CONTENT */}

                <motion.div
                  whileHover={{
                    y: plan.featured ? -6 : -4,
                  }}
                  transition={{
                    duration: 0.25,
                    ease: "easeOut",
                  }}
                  className={`mt-6 flex flex-1 flex-col rounded-[24px] border bg-white p-8 ${
                    plan.featured
                      ? "border-[#243B53] shadow-xl shadow-[#243B53]/10"
                      : "border-[#D9E2EC] shadow-sm"
                  }`}
                >
                  {/* Featured Label */}

                  <div className="min-h-[24px]">
                    {plan.featured && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -5,
                        }}
                        whileInView={{
                          opacity: 1,
                          y: 0,
                        }}
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          delay: 0.3,
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2ED] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#3F7D5A]"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5B8C6A]" />

                        <span>{t("home.plans.recommendedBadge")}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Plan Name */}

                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-[#243B53]">
                      {plan.name}
                    </h3>

                    <p className="mt-1.5 text-sm font-medium text-[#6B7785]">
                      {plan.audience}
                    </p>
                  </div>

                  {/* Price */}

                  <div className="mt-7">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`font-bold tracking-tight ${
                          plan.featured
                            ? "text-4xl text-[#243B53] sm:text-5xl"
                            : "text-3xl text-[#243B53] sm:text-4xl"
                        }`}
                      >
                        {plan.price}
                      </span>

                      <span className="text-xs font-medium text-[#9AA6B2] sm:text-sm">
                        {plan.userPeriod}
                      </span>
                    </div>
                  </div>

                  {/* Description */}

                  <p className="mt-4 min-h-[72px] text-sm leading-6 text-[#6B7785]">
                    {plan.desc}
                  </p>

                  {/* Divider */}

                  <div className="my-6 h-px w-full bg-[#EAEDF1]" />

                  {/* Features */}

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#486581]">
                      {t("home.plans.whatsIncluded")}
                    </p>

                    <ul className="mt-4 space-y-3">
                      {Array.isArray(plan.features) &&
                        plan.features.map((feat, idx) => (
                          <motion.li
                            key={idx}
                            initial={{
                              opacity: 0,
                              x: -8,
                            }}
                            whileInView={{
                              opacity: 1,
                              x: 0,
                            }}
                            viewport={{
                              once: true,
                            }}
                            transition={{
                              delay: 0.25 + index * 0.1 + idx * 0.04,
                              duration: 0.25,
                            }}
                            className="flex items-start gap-3 text-sm leading-6 text-[#486581]"
                          >
                            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF2ED] text-[#3F7D5A]">
                              <FiCheck className="h-3 w-3" />
                            </span>

                            <span>{feat}</span>
                          </motion.li>
                        ))}
                    </ul>
                  </div>

                  {/* Button */}

                  <div className="mt-8 pt-2">
                    <motion.div
                      whileHover={{
                        scale: 1.02,
                      }}
                      whileTap={{
                        scale: 0.98,
                      }}
                    >
                      <Link
                        to={plan.link || "/register"}
                        className={`group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all duration-200 ${
                          plan.featured
                            ? "bg-[#243B53] text-white shadow-md shadow-[#243B53]/15 hover:bg-[#102A43]"
                            : "border border-[#D9E2EC] bg-white text-[#243B53] hover:border-[#243B53] hover:bg-[#F5F7F8]"
                        }`}
                      >
                        <span>{plan.btnText}</span>

                        <FiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}