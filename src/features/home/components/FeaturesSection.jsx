import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiClock,
  FiCalendar,
  FiTrendingUp,
  FiBarChart2,
  FiCpu,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
} from "react-icons/fi";

// API icon name -> existing react-icons component (design unchanged)
const ICON_MAP = {
  "user-group": FiUsers,
  clock: FiClock,
  calendar: FiCalendar,
  "trending-up": FiTrendingUp,
  "chart-bar": FiBarChart2,
  sparkles: FiCpu,
};

// API icon name -> i18n key of the small footer badge (the API has no badge field)
const BADGE_KEY = {
  "user-group": "employees",
  clock: "attendance",
  calendar: "leaves",
  "trending-up": "performance",
  "chart-bar": "reports",
  sparkles: "aiInsights",
};

const FALLBACK_KEYS = ["employees", "attendance", "leaves", "performance", "reports", "aiInsights"];
const FALLBACK_ICONS = ["user-group", "clock", "calendar", "trending-up", "chart-bar", "sparkles"];

export default function FeaturesSection({ data }) {
  const { t } = useTranslation();

  const baseFeatures =
    Array.isArray(data) && data.length > 0
      ? [...data]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((f) => ({
            key: f.id,
            iconKey: f.icon,
            title: f.title,
            desc: f.description,
          }))
      : FALLBACK_KEYS.map((k, i) => ({
          key: k,
          iconKey: FALLBACK_ICONS[i],
          title: t(`home.features.items.${k}.title`),
          desc: t(`home.features.items.${k}.desc`),
        }));

  const featureItems = baseFeatures.map((f) => ({
    ...f,
    icon: ICON_MAP[f.iconKey] || FiCheckCircle,
    badge: BADGE_KEY[f.iconKey]
      ? t(`home.features.badges.${BADGE_KEY[f.iconKey]}`)
      : t("home.features.platformLabel"),
    highlight: f.iconKey === "sparkles",
  }));

  const [activeIndex, setActiveIndex] = useState(1);

  const total = featureItems.length;

  const nextSlide = () => {
    setActiveIndex((current) => (current + 1) % total);
  };

  const prevSlide = () => {
    setActiveIndex((current) => (current - 1 + total) % total);
  };

  // =========================
  // AUTOPLAY
  // =========================

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // GET CARD POSITION
  // =========================

  const getPosition = (index) => {
    if (index === activeIndex) {
      return "active";
    }

    const previousIndex = (activeIndex - 1 + total) % total;
    const nextIndex = (activeIndex + 1) % total;

    if (index === previousIndex) {
      return "left";
    }

    if (index === nextIndex) {
      return "right";
    }

    return "hidden";
  };

  return (
    <section
      id="features"
      className="
        relative
        overflow-hidden
        bg-[#F5F7F8]
        px-5
        py-20
        sm:px-6
        sm:py-24
        lg:px-8
        lg:py-28
      "
    >
      <div className="mx-auto w-full max-w-7xl">

        {/* =========================
            SECTION HEADING
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
            amount: 0.25,
          }}
          transition={{
            duration: 0.7,
            ease: "easeOut",
          }}
          className="
            mx-auto
            max-w-3xl
            text-center
          "
        >
          {/* Badge */}

          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-[#D9E2EC]
              bg-white
              px-4
              py-2
              text-xs
              font-semibold
              text-[#486581]
              shadow-sm
            "
          >
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-[#5B8C6A]
              "
            />

            <span>
              {t("home.features.badge")}
            </span>
          </div>

          {/* Title */}

          <motion.h2
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
              delay: 0.1,
            }}
            className="
              mt-5
              text-3xl
              font-bold
              leading-tight
              tracking-tight
              text-[#202B33]
              sm:text-4xl
              lg:text-5xl
            "
          >
            {t("home.features.title")}
          </motion.h2>

          {/* Subtitle */}

          <motion.p
            initial={{
              opacity: 0,
              y: 15,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
              delay: 0.2,
            }}
            className="
              mx-auto
              mt-5
              max-w-2xl
              text-sm
              leading-7
              text-[#6B7785]
              sm:text-base
              sm:leading-7
            "
          >
            {t("home.features.subtitle")}
          </motion.p>
        </motion.div>

        {/* =========================
            CAROUSEL
        ========================= */}

        <div
          className="
            relative
            mt-12
            sm:mt-14
            lg:mt-16
          "
        >
          {/* =========================
              DESKTOP / TABLET CAROUSEL
          ========================= */}

          <div
            className="
              relative
              hidden
              min-h-[390px]
              items-center
              justify-center
              overflow-visible
              md:flex
            "
          >
            {/* LEFT ARROW */}

            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous feature"
              className="
                absolute
                left-0
                top-1/2
                z-30
                flex
                h-11
                w-11
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-[#D9E2EC]
                bg-white
                text-[#243B53]
                shadow-md
                transition-all
                duration-200
                hover:scale-105
                hover:bg-[#243B53]
                hover:text-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#5B8C6A]/40
                lg:-left-5
              "
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>

            {/* RIGHT ARROW */}

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next feature"
              className="
                absolute
                right-0
                top-1/2
                z-30
                flex
                h-11
                w-11
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-[#D9E2EC]
                bg-white
                text-[#243B53]
                shadow-md
                transition-all
                duration-200
                hover:scale-105
                hover:bg-[#243B53]
                hover:text-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#5B8C6A]/40
                lg:-right-5
              "
            >
              <FiChevronRight className="h-5 w-5" />
            </button>

            {/* CARDS */}

            <div
              className="
                relative
                flex
                h-[390px]
                w-full
                items-center
                justify-center
              "
            >
              {featureItems.map((item, index) => {
                const position = getPosition(index);
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.key}
                    initial={false}
                    animate={{
                      x:
                        position === "active"
                          ? 0
                          : position === "left"
                            ? "-92%"
                            : position === "right"
                              ? "92%"
                              : "0%",
                      scale:
                        position === "active"
                          ? 1
                          : position === "hidden"
                            ? 0.7
                            : 0.82,
                      opacity:
                        position === "active"
                          ? 1
                          : position === "hidden"
                            ? 0
                            : 0.55,
                      zIndex:
                        position === "active"
                          ? 20
                          : position === "left" ||
                            position === "right"
                            ? 10
                            : 0,
                    }}
                    transition={{
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="
                      absolute
                      w-[58%]
                      max-w-[600px]
                    "
                  >
                    {/* CARD */}

                    <div
                      className={`
                        relative
                        min-h-[340px]
                        overflow-hidden
                        rounded-3xl
                        border
                        bg-white
                        p-7
                        shadow-xl
                        transition-all
                        duration-300
                        lg:p-9
                        ${position === "active"
                          ? item.highlight
                            ? "border-[#5B8C6A]/40 shadow-[#243B53]/15"
                            : "border-[#D9E2EC] shadow-[#243B53]/15"
                          : "border-[#D9E2EC]/70 shadow-[#243B53]/5"
                        }
                      `}
                    >
                      {/* Green Top Line */}

                      <div
                        className={`
                          absolute
                          inset-x-0
                          top-0
                          h-1
                          ${item.highlight
                            ? "bg-[#5B8C6A]"
                            : "bg-[#486581]"
                          }
                        `}
                      />

                      {/* QUOTE WATERMARK */}

                      <div
                        className="
                          pointer-events-none
                          absolute
                          right-6
                          top-3
                          select-none
                          text-[110px]
                          font-serif
                          font-bold
                          leading-none
                          text-[#243B53]/[0.035]
                        "
                      >
                        “
                      </div>

                      {/* HEADER */}

                      <div
                        className="
                          relative
                          flex
                          items-center
                          justify-between
                          gap-4
                        "
                      >
                        {/* ICON + INFO */}

                        <div className="flex items-center gap-4">
                          <div
                            className={`
                              flex
                              h-14
                              w-14
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              ${item.highlight
                                ? "bg-[#EAF2ED] text-[#3F7D5A]"
                                : "bg-[#F0F3F6] text-[#486581]"
                              }
                            `}
                          >
                            <Icon className="h-6 w-6" />
                          </div>

                          <div>
                            <h3
                              className="
                                text-lg
                                font-bold
                                leading-tight
                                text-[#243B53]
                                lg:text-xl
                              "
                            >
                              {item.title}
                            </h3>

                            <p
                              className="
                                mt-1
                                text-xs
                                font-medium
                                text-[#6B7785]
                              "
                            >
                              {t("home.features.platformLabel")}
                            </p>
                          </div>
                        </div>

                        {/* CHECK */}

                        <div
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[#EAF2ED]
                            text-[#3F7D5A]
                          "
                        >
                          <FiCheckCircle className="h-4 w-4" />
                        </div>
                      </div>

                      {/* DESCRIPTION */}

                      <p
                        className="
                          relative
                          mt-8
                          text-sm
                          leading-7
                          text-[#6B7785]
                          lg:text-base
                          lg:leading-8
                        "
                      >
                        {item.desc}
                      </p>

                      {/* FOOTER */}

                      <div
                        className="
                          absolute
                          bottom-7
                          left-7
                          right-7
                          flex
                          items-center
                          justify-between
                          gap-3
                          border-t
                          border-[#EAEDF1]
                          pt-5
                          lg:left-9
                          lg:right-9
                          lg:bottom-8
                        "
                      >
                        <span
                          className="
                            inline-flex
                            items-center
                            rounded-full
                            bg-[#F5F7F8]
                            px-3
                            py-1.5
                            text-[11px]
                            font-semibold
                            text-[#486581]
                            sm:text-xs
                          "
                        >
                          {item.badge}
                        </span>

                        <span
                          className="
                            text-xs
                            font-medium
                            text-[#9AA6B2]
                          "
                        >
                          {String(index + 1).padStart(2, "0")} /{" "}
                          {String(total).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* =========================
              MOBILE CAROUSEL
          ========================= */}

          <div className="md:hidden">
            <div className="relative">
              <AnimatePresence mode="wait">
                {(() => {
                  const item = featureItems[activeIndex];
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.key}
                      initial={{
                        opacity: 0,
                        x: 40,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: -40,
                      }}
                      transition={{
                        duration: 0.35,
                        ease: "easeOut",
                      }}
                    >
                      <div
                        className="
                          relative
                          min-h-[350px]
                          overflow-hidden
                          rounded-3xl
                          border
                          border-[#D9E2EC]
                          bg-white
                          p-6
                          shadow-lg
                        "
                      >
                        {/* Top Line */}

                        <div
                          className={`
                            absolute
                            inset-x-0
                            top-0
                            h-1
                            ${item.highlight
                              ? "bg-[#5B8C6A]"
                              : "bg-[#486581]"
                            }
                          `}
                        />

                        {/* Quote */}

                        <div
                          className="
                            pointer-events-none
                            absolute
                            right-4
                            top-2
                            text-[90px]
                            font-serif
                            font-bold
                            leading-none
                            text-[#243B53]/[0.035]
                          "
                        >
                          “
                        </div>

                        {/* Header */}

                        <div className="relative flex items-center gap-4">
                          <div
                            className={`
                              flex
                              h-14
                              w-14
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              ${item.highlight
                                ? "bg-[#EAF2ED] text-[#3F7D5A]"
                                : "bg-[#F0F3F6] text-[#486581]"
                              }
                            `}
                          >
                            <Icon className="h-6 w-6" />
                          </div>

                          <div className="min-w-0">
                            <h3
                              className="
                                text-lg
                                font-bold
                                leading-snug
                                text-[#243B53]
                              "
                            >
                              {item.title}
                            </h3>

                            <p
                              className="
                                mt-1
                                text-xs
                                font-medium
                                text-[#6B7785]
                              "
                            >
                              {t("home.features.platformLabel")}
                            </p>
                          </div>
                        </div>

                        {/* Description */}

                        <p
                          className="
                            relative
                            mt-8
                            text-sm
                            leading-7
                            text-[#6B7785]
                          "
                        >
                          {item.desc}
                        </p>

                        {/* Footer */}

                        <div
                          className="
                            absolute
                            bottom-6
                            left-6
                            right-6
                            flex
                            items-center
                            justify-between
                            gap-2
                            border-t
                            border-[#EAEDF1]
                            pt-4
                          "
                        >
                          <span
                            className="
                              rounded-full
                              bg-[#F5F7F8]
                              px-3
                              py-1.5
                              text-[11px]
                              font-semibold
                              text-[#486581]
                            "
                          >
                            {item.badge}
                          </span>

                          <span
                            className="
                              text-xs
                              font-medium
                              text-[#9AA6B2]
                            "
                          >
                            {String(activeIndex + 1).padStart(2, "0")} /{" "}
                            {String(total).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Mobile Navigation */}

              <div
                className="
                  mt-6
                  flex
                  items-center
                  justify-center
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous feature"
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-[#D9E2EC]
                    bg-white
                    text-[#243B53]
                    shadow-sm
                    transition-all
                    duration-200
                    hover:bg-[#243B53]
                    hover:text-white
                  "
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>

                {/* Dots */}

                <div className="flex items-center gap-1.5">
                  {featureItems.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Go to feature ${index + 1}`}
                      className={`
                        h-1.5
                        rounded-full
                        transition-all
                        duration-300
                        ${index === activeIndex
                          ? "w-6 bg-[#5B8C6A]"
                          : "w-1.5 bg-[#D9E2EC]"
                        }
                      `}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next feature"
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-[#D9E2EC]
                    bg-white
                    text-[#243B53]
                    shadow-sm
                    transition-all
                    duration-200
                    hover:bg-[#243B53]
                    hover:text-white
                  "
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Dots */}

          <div
            className="
              mt-8
              hidden
              items-center
              justify-center
              gap-1.5
              md:flex
            "
          >
            {featureItems.map((item, index) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to feature ${index + 1}`}
                className={`
                  h-1.5
                  rounded-full
                  transition-all
                  duration-300
                  ${index === activeIndex
                    ? "w-8 bg-[#5B8C6A]"
                    : "w-1.5 bg-[#D9E2EC] hover:bg-[#486581]"
                  }
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}