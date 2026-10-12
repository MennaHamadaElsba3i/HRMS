import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "../../../assets/logo.jpeg";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { APP_NAME, BRAND_NAME } from "../../../utils/global";
import { useAuth } from "../../../context/AuthContext";

export default function Navbar() {
  const { t } = useTranslation();
  const { isAuthenticated, role, ROLE_ROUTES } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);

      const sections = [
        "home",
        "about",
        "features",
        "roles",
        "plans",
        "contact",
      ];

      const scrollPos = window.scrollY + 110;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);

        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);

    const el = document.getElementById(id);

    if (!el) return;

    const navbarHeight = window.innerWidth >= 640 ? 76 : 68;

    const top =
      el.getBoundingClientRect().top +
      window.scrollY -
      navbarHeight;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  };

  const navLinks = [
    {
      id: "home",
      label: t("home.nav.home"),
    },
    {
      id: "about",
      label: t("home.nav.about"),
    },
    {
      id: "features",
      label: t("home.nav.features"),
    },
    {
      id: "roles",
      label: t("home.nav.roles"),
    },
    {
      id: "plans",
      label: t("home.nav.plans"),
    },
  ];

  const dashboardRoute =
    isAuthenticated && role
      ? ROLE_ROUTES[role] || "/admin/dashboard"
      : "/login";

  return (
    <header
      className={`
        fixed
        top-0
        left-0
        right-0
        z-[9999]
        w-full
        border-b
        border-white/10
        bg-[#243B53]
        transition-shadow
        duration-300
        ${
          scrolled
            ? "shadow-xl shadow-[#102A43]/40"
            : "shadow-md shadow-[#102A43]/20"
        }
      `}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        backgroundColor: "#243B53",
        zIndex: 9999,
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <nav
          className="
            flex
            h-[68px]
            items-center
            justify-between
            gap-2
            sm:h-[76px]
            sm:gap-4
          "
        >
          {/* =========================================
              LOGO
          ========================================= */}

          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("home");
            }}
            className="
              flex
              min-w-0
              shrink-0
              items-center
              gap-2
              text-white
              sm:gap-3
            "
          >
            <motion.img
              src={logoImg}
              alt={APP_NAME}
              whileHover={{
                rotate: 3,
                scale: 1.05,
              }}
              transition={{
                duration: 0.25,
              }}
              className="
                h-8
                w-8
                rounded-lg
                object-cover
                shadow-sm
                sm:h-10
                sm:w-10
                sm:rounded-xl
              "
            />

            <span
              className="
                hidden
                whitespace-nowrap
                text-lg
                font-bold
                tracking-tight
                text-white
                sm:block
                sm:text-xl
              "
            >
              {BRAND_NAME.prefix}

              <span
                style={{
                  color: BRAND_NAME.suffixColor,
                }}
              >
                {BRAND_NAME.suffix}
              </span>
            </span>
          </a>

          {/* =========================================
              DESKTOP NAV
          ========================================= */}

          <ul
            className="
              hidden
              items-center
              gap-6
              xl:gap-8
              lg:flex
            "
          >
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;

              return (
                <li key={link.id} className="list-none">
                  <a
                    href={`#${link.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.id);
                    }}
                    className={`
                      relative
                      block
                      py-2
                      text-sm
                      font-medium
                      transition-colors
                      duration-200
                      ${
                        isActive
                          ? "text-white"
                          : "text-white/70 hover:text-white"
                      }
                    `}
                  >
                    {link.label}

                    {isActive && (
                      <motion.span
                        layoutId="activeNavIndicator"
                        className="
                          absolute
                          -bottom-1
                          left-0
                          right-0
                          mx-auto
                          h-0.5
                          w-5
                          rounded-full
                          bg-[#5B8C6A]
                        "
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* =========================================
              DESKTOP ACTIONS
          ========================================= */}

          <div
            className="
              hidden
              items-center
              gap-3
              lg:flex
            "
          >
            <div className="rounded-lg text-white">
              <LanguageSwitcher />
            </div>

            <Link
              to={dashboardRoute}
              className="
                inline-flex
                items-center
                justify-center
                rounded-lg
                bg-white
                px-5
                py-2.5
                text-sm
                font-semibold
                text-[#243B53]
                shadow-sm
                transition-all
                hover:bg-[#F5F7F8]
                hover:shadow-md
              "
            >
              {isAuthenticated
                ? t("home.nav.dashboard", "Dashboard")
                : t("home.nav.signIn")}
            </Link>
          </div>

          {/* =========================================
              MOBILE ACTIONS (Visible on mobile/tablet)
          ========================================= */}

          <div
            className="
              flex
              shrink-0
              items-center
              gap-1.5
              sm:gap-2.5
              lg:hidden
            "
          >
            {/* LANGUAGE */}
            <div className="flex shrink-0 items-center text-white">
              <LanguageSwitcher />
            </div>

            {/* SIGN IN / DASHBOARD */}
            <Link
              to={dashboardRoute}
              className="
                inline-flex
                h-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-[#5B8C6A]
                px-2.5
                text-[11px]
                font-bold
                text-white
                shadow-sm
                transition-all
                hover:bg-[#4E7A5B]
                sm:h-10
                sm:px-3.5
                sm:text-xs
              "
            >
              {isAuthenticated
                ? t("home.nav.dashboard", "Dashboard")
                : t("home.nav.signIn")}
            </Link>

            {/* HAMBURGER TOGGLE */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-white/25
                bg-white/10
                text-white
                transition-all
                hover:border-white/40
                hover:bg-white/15
                sm:h-10
                sm:w-10
              "
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileMenuOpen ? "close" : "menu"}
                  initial={{
                    opacity: 0,
                    rotate: -90,
                    scale: 0.7,
                  }}
                  animate={{
                    opacity: 1,
                    rotate: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    rotate: 90,
                    scale: 0.7,
                  }}
                  transition={{
                    duration: 0.18,
                  }}
                  className="text-xl"
                >
                  {mobileMenuOpen ? <FiX /> : <FiMenu />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </div>

      {/* =========================================
          MOBILE MENU
      ========================================= */}

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="
              overflow-hidden
              border-t
              border-white/10
              bg-[#243B53]
              shadow-2xl
              lg:hidden
            "
          >
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <div className="space-y-1.5">
                {navLinks.map((link) => {
                  const isActive = activeSection === link.id;

                  return (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(link.id);
                      }}
                      className={`
                        flex
                        items-center
                        rounded-xl
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        transition-all
                        ${
                          isActive
                            ? "bg-white/15 text-white shadow-sm font-bold"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                        }
                      `}
                    >
                      {isActive && (
                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#5B8C6A] rtl:mr-0 rtl:ml-2" />
                      )}

                      {link.label}
                    </a>
                  );
                })}
              </div>

              <div
                className="
                  mt-4
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-white/15
                  bg-white/5
                  p-3
                "
              >
                <div>
                  <span className="block text-[11px] font-medium text-white/60">
                    {isAuthenticated ? t("home.nav.mobileAccount") : t("home.nav.mobileWelcome")}
                  </span>

                  <span className="text-sm font-bold text-white">
                    {isAuthenticated
                      ? t("home.nav.dashboard", "Dashboard")
                      : t("home.nav.signIn")}
                  </span>
                </div>

                <Link
                  to={dashboardRoute}
                  onClick={() => setMobileMenuOpen(false)}
                  className="
                    rounded-lg
                    bg-[#5B8C6A]
                    px-4
                    py-2.5
                    text-xs
                    font-semibold
                    text-white
                    transition-colors
                    hover:bg-[#4E7A5B]
                  "
                >
                  {isAuthenticated
                    ? t("home.nav.dashboard", "Dashboard")
                    : t("home.nav.signIn")}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}