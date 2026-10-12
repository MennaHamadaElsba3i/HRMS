import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

export default function CtaSection({ data }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith("ar");

  return (
    <section
      id="contact"
      className="hidden bg-[#F5F7F8] py-20 lg:block xl:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          className="
            relative
            overflow-hidden
            rounded-[24px]
            bg-[#243B53]
            px-10
            py-12
            shadow-[0_16px_40px_rgba(16,42,67,0.14)]
            xl:px-14
            xl:py-14
          "
        >
          {/* Subtle decorative shape */}
          <div
            className="
              pointer-events-none
              absolute
              -right-24
              -top-24
              h-64
              w-64
              rounded-full
              border
              border-white/5
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-32
              right-16
              h-72
              w-72
              rounded-full
              border
              border-white/5
            "
          />

          <div
            className="
              relative
              z-10
              flex
              items-center
              justify-between
              gap-12
            "
          >
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: "easeOut",
              }}
              className="max-w-2xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                }}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/15
                  bg-white/5
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-white/85
                "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span>{data?.badge || t("home.cta.badge")}</span>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: 0.3,
                }}
                className="
                  mt-5
                  max-w-2xl
                  text-3xl
                  font-bold
                  leading-tight
                  tracking-tight
                  text-white
                  xl:text-[40px]
                "
              >
                {data?.title || t("home.cta.title")}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: 0.4,
                }}
                className="
                  mt-4
                  max-w-xl
                  text-sm
                  leading-7
                  text-[#D9E2EC]
                  xl:text-base
                  xl:leading-7
                "
              >
                {data?.description || t("home.cta.subtitle")}
              </motion.p>
            </motion.div>

            {/* Right CTA */}
            <motion.div
              initial={{ opacity: 0, x: 35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.7,
                delay: 0.3,
                ease: "easeOut",
              }}
              className="
                flex
                shrink-0
                flex-col
                items-center
                gap-2
              "
            >
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to="/register"
                  className="
                    inline-flex
                    min-w-[180px]
                    items-center
                    justify-center
                    gap-3
                    rounded-xl
                    bg-white
                    px-6
                    py-3.5
                    text-sm
                    font-bold
                    text-[#243B53]
                    shadow-md
                    transition-all
                    duration-200
                    hover:bg-[#F5F7F8]
                    hover:shadow-lg
                  "
                >
                  <span>{data?.button_text || t("home.cta.btnPrimary")}</span>

                  <FiArrowRight
                    className="h-4 w-4"
                    style={{
                      transform: isRtl
                        ? "rotate(180deg)"
                        : "none",
                    }}
                  />
                </Link>
              </motion.div>

              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.6,
                }}
                className="
                  text-[11px]
                  font-medium
                  text-white/60
                "
              >
                {data?.subnotes || t("home.cta.noCreditCard")}
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}