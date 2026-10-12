import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";

function AnimatedNumber({ value, duration = 1800 }) {
  const ref = useRef(null);

  const isInView = useInView(ref, {
    once: true,
    amount: 0.5,
  });

  const [displayValue, setDisplayValue] = useState("0");

  const stringValue = String(value ?? "0");

  const match = stringValue.match(/^([^0-9]*)([\d,.]+)(.*)$/);

  const prefix = match?.[1] ?? "";
  const numberPart = match?.[2] ?? "0";
  const suffix = match?.[3] ?? "";

  const targetNumber = Number(numberPart.replace(/,/g, ""));

  useEffect(() => {
    if (!isInView) return;

    let animationFrame;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentNumber = targetNumber * easedProgress;

      const hasDecimal = numberPart.includes(".");

      let formattedNumber;

      if (hasDecimal) {
        const decimalPlaces =
          numberPart.split(".")[1]?.length || 1;

        formattedNumber = currentNumber
          .toFixed(decimalPlaces)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      } else {
        formattedNumber = Math.floor(currentNumber)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      setDisplayValue(
        `${prefix}${formattedNumber}${suffix}`
      );

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(stringValue);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [
    isInView,
    targetNumber,
    duration,
    numberPart,
    prefix,
    suffix,
    stringValue,
  ]);

  return <span ref={ref}>{displayValue}</span>;
}

export default function TrustStatsSection({ data }) {
  const { t } = useTranslation();

  const fallbackStats = [
    { number: t("home.stats.uptime"), label: t("home.stats.uptimeLabel") },
    { number: t("home.stats.speed"), label: t("home.stats.speedLabel") },
    { number: t("home.stats.employeesCount"), label: t("home.stats.employeesLabel") },
    { number: t("home.stats.security"), label: t("home.stats.securityLabel") },
  ];

  const stats =
    Array.isArray(data) && data.length > 0
      ? data.map((s) => ({ number: s.value, label: s.label }))
      : fallbackStats;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const statVariants = {
    hidden: {
      opacity: 0,
      y: 25,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="bg-[#102A43]">
      <div
        className="
          mx-auto
          w-full
          max-w-6xl
          px-5
          py-8
          sm:px-6
          sm:py-10
          lg:px-8
          lg:py-12
        "
      >
        {/* =====================================================
            RESPONSIVE VERSION
            ===================================================== */}
        <div className="lg:hidden">
          <motion.div
            className="
              -mx-5
              flex
              overflow-x-auto
              overscroll-x-contain
              px-5
              snap-x
              snap-mandatory
              scrollbar-none
              sm:-mx-6
              sm:px-6
            "
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.3,
            }}
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                variants={statVariants}
                className="
                  relative
                  flex
                  min-w-[170px]
                  snap-center
                  flex-1
                  flex-col
                  items-center
                  justify-center
                  px-5
                  py-5
                  text-center
                  sm:min-w-[190px]
                "
              >
                {/* Divider */}
                {idx > 0 && (
                  <span
                    className="
                      absolute
                      left-0
                      top-1/2
                      h-12
                      -translate-y-1/2
                      border-l
                      border-white/15
                    "
                  />
                )}

                {/* Number */}
                <div
                  className="
                    flex
                    h-[42px]
                    w-full
                    items-center
                    justify-center
                    whitespace-nowrap
                    text-[28px]
                    font-extrabold
                    leading-none
                    tracking-tight
                    text-white
                    sm:text-[30px]
                  "
                >
                  <AnimatedNumber value={stat.number} />
                </div>

                {/* Description */}
                <div
                  className="
                    mt-2
                    flex
                    min-h-[40px]
                    max-w-[150px]
                    items-start
                    justify-center
                    text-center
                    text-[11px]
                    font-medium
                    leading-5
                    text-[#D9E2EC]
                    sm:text-xs
                  "
                >
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Small scroll indicator */}
          <div className="mt-3 flex justify-center gap-1.5">
            {stats.map((_, idx) => (
              <span
                key={idx}
                className="
                  h-1
                  w-1
                  rounded-full
                  bg-white/30
                "
              />
            ))}
          </div>
        </div>

        {/* =====================================================
            DESKTOP VERSION — UNCHANGED
            ===================================================== */}
        <motion.div
          className="
            hidden
            grid-cols-1
            sm:grid-cols-2
            lg:grid
            lg:grid-cols-4
          "
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.3,
          }}
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              variants={statVariants}
              className={`
                relative
                flex
                min-h-[120px]
                flex-col
                items-center
                justify-center
                px-6
                text-center

                ${
                  idx > 0
                    ? "border-t border-white/10 sm:border-t-0"
                    : ""
                }
              `}
            >
              {/* Vertical divider */}
              {idx > 0 && (
                <span
                  className="
                    absolute
                    left-0
                    top-1/2
                    hidden
                    h-14
                    -translate-y-1/2
                    border-l
                    border-white/15
                    sm:block
                  "
                />
              )}

              {/* Number */}
              <div
                className="
                  flex
                  h-[48px]
                  w-full
                  items-center
                  justify-center
                  whitespace-nowrap
                  text-[30px]
                  font-extrabold
                  leading-none
                  tracking-tight
                  text-white
                  sm:text-[34px]
                  lg:text-[38px]
                "
              >
                <AnimatedNumber value={stat.number} />
              </div>

              {/* Description */}
              <div
                className="
                  mt-3
                  flex
                  min-h-[42px]
                  max-w-[200px]
                  items-start
                  justify-center
                  text-center
                  text-xs
                  font-medium
                  leading-5
                  text-[#D9E2EC]
                  sm:text-sm
                "
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}