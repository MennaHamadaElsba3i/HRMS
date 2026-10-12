import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiZap,
  FiLayers,
  FiChevronDown,
} from "react-icons/fi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

const trustFeatures = [
  "Centralized Data",
  "Automated Shifts",
  "Leave Workflows",
  "Performance KPIs",
  "Audit Ready",
  "GPS Geofencing",
  "AI Career Coach",
  "Real-Time Payroll",
  "Skill-Gap Insights",
  "Role Governance",
];

export default function AboutSection({ data, tickerTags }) {
  const { t } = useTranslation();
  const swiperRef = useRef(null);

  // =========================
  // Accordion State
  // =========================
  const [openItem, setOpenItem] = useState("item-0");

  const toggleItem = (item) => {
    setOpenItem((current) => (current === item ? null : item));
  };

  const rawTicker = t("home.ticker", {
    returnObjects: true,
  });

  const baseItems =
    Array.isArray(tickerTags) && tickerTags.length > 0
      ? tickerTags
      : Array.isArray(rawTicker) && rawTicker.length > 0
        ? rawTicker
        : trustFeatures;

  const repeatedItems = [
    ...baseItems,
    ...baseItems,
    ...baseItems,
  ];

  const handleMouseEnter = () => {
    swiperRef.current?.autoplay?.stop();
  };

  const handleMouseLeave = () => {
    swiperRef.current?.autoplay?.start();
  };

  // =========================
  // Accordion Items
  // =========================
  const accordionStyles = [
    { icon: FiCheckCircle, iconWrapper: "bg-[#EAF2ED]", iconColor: "text-[#3F7D5A]" },
    { icon: FiLayers, iconWrapper: "bg-[#F5F7F8]", iconColor: "text-[#486581]" },
    { icon: FiZap, iconWrapper: "bg-[#F5F7F8]", iconColor: "text-[#486581]" },
  ];

  const fallbackHighlights = [
    { title: t("home.about.solutionTitle"), description: t("home.about.solutionDesc") },
    { title: t("home.about.problemTitle"), description: t("home.about.problemDesc") },
    { title: t("home.about.clarityTitle"), description: t("home.about.clarityDesc") },
  ];

  const highlights =
    Array.isArray(data?.highlights) && data.highlights.length > 0
      ? data.highlights
      : fallbackHighlights;

  const accordionItems = highlights.map((h, i) => ({
    id: `item-${i}`,
    title: h.title,
    description: h.description,
    ...accordionStyles[i % accordionStyles.length],
  }));

  const fallbackStats = [1, 2, 3].map((n) => ({
    title: t(`home.about.stat${n}Value`),
    sub: t(`home.about.stat${n}Label`),
  }));

  const aboutStats =
    Array.isArray(data?.stats) && data.stats.length > 0
      ? data.stats.map((s) => ({
        title: `${s.value ?? ""} ${s.label ?? ""}`.trim(),
        sub: s.subtext,
      }))
      : fallbackStats;

  return (
    <>
      {/* =========================
          TRUST TICKER
      ========================= */}

      <motion.div
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
          amount: 0.2,
        }}
        transition={{
          duration: 0.6,
        }}
        className="
          w-full
          border-y border-white/10
          bg-[#486581]
          text-white
        "
      >
        <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8">
          <div
            className="w-full overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Swiper
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              modules={[Autoplay, FreeMode]}
              loop={true}
              freeMode={{
                enabled: true,
                momentum: false,
              }}
              autoplay={{
                delay: 0,
                disableOnInteraction: false,
              }}
              speed={5000}
              slidesPerView="auto"
              spaceBetween={36}
              allowTouchMove={false}
              simulateTouch={false}
              touchStartPreventDefault={false}
              className="w-full"
            >
              {repeatedItems.map((item, idx) => (
                <SwiperSlide
                  key={idx}
                  className="!w-auto select-none"
                >
                  <div className="flex items-center gap-4 py-4">
                    <span
                      className="
                        whitespace-nowrap
                        text-xs
                        font-medium
                        tracking-wide
                        text-white/90
                        sm:text-sm
                      "
                    >
                      {item}
                    </span>

                    <span
                      aria-hidden="true"
                      className="
                        h-1.5
                        w-1.5
                        shrink-0
                        rounded-full
                        bg-[#AFC4B5]
                      "
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </motion.div>

      {/* =========================
          ABOUT SECTION
      ========================= */}

      <section
        id="about"
        className="bg-[#F5F7F8] py-20 sm:py-24"
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* =========================
    LEFT SIDE
========================= */}

            <motion.div
              initial={{
                opacity: 0,
                x: -60,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.25,
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
            >
              {/* About WiseWork - Visible Everywhere */}

              <div
                className="
      inline-flex
      items-center
      gap-2
      text-sm
      font-semibold
      text-[#486581]
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

                <span>{data?.badge || t("home.about.badge")}</span>
              </div>

              {/* Desktop Only Content */}

              <div className="hidden lg:block">
                <h2
                  className="
        mt-4
        max-w-2xl
        text-3xl
        font-bold
        leading-tight
        tracking-tight
        text-[#202B33]
        sm:text-4xl
      "
                >
                  {data?.title || t("home.about.title")}
                </h2>

                <p
                  className="
        mt-[18px]
        max-w-2xl
        text-base
        leading-7
        text-[#6B7785]
      "
                >
                  {data?.description || t("home.about.subtitle")}
                </p>

                <div
                  className="
        mt-8
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-3
      "
                >
                  {aboutStats.map((stat, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-sm"
                    >
                      <strong
                        className={`block text-lg font-bold ${i === 2 ? "text-[#3F7D5A]" : "text-[#243B53]"
                          }`}
                      >
                        {stat.title}
                      </strong>

                      <span className="mt-1 block text-xs leading-5 text-[#6B7785]">
                        {stat.sub}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* =========================
                RIGHT SIDE ACCORDION
            ========================= */}

            <motion.div
              initial={{
                opacity: 0,
                x: 60,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.25,
              }}
              transition={{
                duration: 0.8,
                delay: 0.15,
                ease: "easeOut",
              }}
              className="
                rounded-2xl
                border
                border-[#D9E2EC]
                bg-white
                p-4
                shadow-md
                sm:p-5
                lg:p-6
              "
            >
              {accordionItems.map((item, index) => {
                const Icon = item.icon;
                const isOpen = openItem === item.id;
                const panelId = `about-panel-${item.id}`;

                return (
                  <div
                    key={item.id}
                    className={`
                      ${index !== accordionItems.length - 1
                        ? "border-b border-[#EAEDF1]"
                        : ""
                      }
                    `}
                  >
                    {/* Accordion Header */}

                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="
                        group
                        flex
                        w-full
                        items-center
                        gap-3
                        py-5
                        text-left
                        transition-colors
                        duration-200
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-[#5B8C6A]/40
                        sm:gap-4
                      "
                    >
                      {/* Icon */}

                      <div
                        className={`
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          transition-colors
                          duration-200
                          ${item.iconWrapper}
                          ${item.iconColor}
                        `}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Title */}

                      <span
                        className="
                          min-w-0
                          flex-1
                          text-left
                          text-sm
                          font-semibold
                          leading-6
                          text-[#243B53]
                          transition-colors
                          duration-200
                          group-hover:text-[#3F7D5A]
                          sm:text-base
                        "
                      >
                        {item.title}
                      </span>

                      {/* Chevron */}

                      <motion.span
                        animate={{
                          rotate: isOpen ? 180 : 0,
                        }}
                        transition={{
                          duration: 0.25,
                          ease: "easeOut",
                        }}
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-[#F5F7F8]
                          text-[#486581]
                          transition-colors
                          duration-200
                          group-hover:bg-[#EAF2ED]
                          group-hover:text-[#3F7D5A]
                        "
                      >
                        <FiChevronDown className="h-4 w-4" />
                      </motion.span>
                    </button>

                    {/* Accordion Content */}

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panelId}
                          initial={{
                            height: 0,
                            opacity: 0,
                          }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                          }}
                          transition={{
                            height: {
                              duration: 0.3,
                              ease: "easeOut",
                            },
                            opacity: {
                              duration: 0.2,
                            },
                          }}
                          className="overflow-hidden"
                        >
                          <div
                            className="
                              pb-5
                              pl-14
                              pr-2
                              text-sm
                              leading-7
                              text-[#6B7785]
                              sm:pl-14
                              sm:pr-4
                            "
                          >
                            {item.description}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}