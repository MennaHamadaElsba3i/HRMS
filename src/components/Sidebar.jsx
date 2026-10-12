import { NavLink, useLocation } from "react-router-dom";
import { FiArrowRight, FiMoreHorizontal, FiX } from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";
import { useTranslation } from "react-i18next";

import { navConfig } from "../navigation/navConfig";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

import logoImg from "../assets/Logos.svg";
import { APP_NAME, BRAND_NAME } from "../utils/global";

const Sidebar = ({ role = "admin", isOpen = false, onClose }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { currentUser } = useAuth();

  const isRtl = i18n.language?.startsWith("ar");

  // Determine if this is an admin page or admin role
  const isAdminPage =
    role === "admin" ||
    location.pathname.startsWith("/admin") ||
    location.pathname === "/admin" ||
    location.pathname === "/branches";

  const effectiveRole = isAdminPage ? "admin" : role;
  const links = navConfig[effectiveRole] || navConfig[role] || [];

  // Resolve user info from localStorage or AuthContext
  const storedUser = (() => {
    try {
      const raw =
        localStorage.getItem("currentUser") ||
        localStorage.getItem("user") ||
        localStorage.getItem("admin") ||
        localStorage.getItem("auth_user");

      if (!raw) return null;

      const parsed = JSON.parse(raw);
      return parsed?.user || parsed?.data || parsed;
    } catch {
      return null;
    }
  })();

  const activeUser = storedUser || currentUser;

  // =========================
  // User Display Information
  // =========================

  let userInfo;

  if (isAdminPage) {
    const adminName = activeUser?.name
      ? isRtl && activeUser?.nameAr
        ? activeUser.nameAr
        : activeUser.name
      : activeUser?.fullName ||
      activeUser?.username ||
      (t("portal.defaultAdminName", "Ahmed Nasser"));

    const adminAvatarText = activeUser?.initials
      ? activeUser.initials.toUpperCase()
      : adminName
        ? (() => {
          const parts = adminName.trim().split(/\s+/);

          return parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();
        })()
        : "AN";

    userInfo = {
      displayName: adminName,
      displayTitle:
        activeUser?.role_label ||
        activeUser?.jobTitle ||
        activeUser?.roleTitle ||
        (t("portal.defaultAdminTitle", "Administrator")),
      avatarText: adminAvatarText,
      avatarBg: "#daf0e3",
      avatarColor: "#1e4b3c",
    };
  } else if (effectiveRole === "hr") {
    userInfo = {
      displayName: activeUser?.name
        ? isRtl && activeUser?.nameAr
          ? activeUser.nameAr
          : activeUser.name
        : t("portal.defaultHrName", "Mostafa Khalil"),

      displayTitle:
        activeUser?.role_label ||
        activeUser?.job_title ||
        (t("portal.defaultHrTitle", "HR Specialist")),

      avatarText:
        activeUser?.initials
          ? activeUser.initials.toUpperCase()
          : "MK",

      avatarBg: "#ede9fe",
      avatarColor: "#5b21b6",
    };
  } else if (effectiveRole === "manager") {
    userInfo = {
      displayName: activeUser?.name
        ? isRtl && activeUser?.nameAr
          ? activeUser.nameAr
          : activeUser.name
        : t("portal.defaultManagerName", "Layla Hassan"),

      displayTitle:
        activeUser?.role_label ||
        activeUser?.job_title ||
        (t("portal.defaultManagerTitle", "Manager")),

      avatarText:
        activeUser?.initials
          ? activeUser.initials.toUpperCase()
          : "LH",

      avatarBg: "#fef3c7",
      avatarColor: "#92400e",
    };
  } else {
    userInfo = {
      displayName: activeUser?.name
        ? isRtl && activeUser?.nameAr
          ? activeUser.nameAr
          : activeUser.name
        : t("portal.defaultEmployeeName", "Omar Haddad"),

      displayTitle:
        activeUser?.role_label ||
        activeUser?.job_title ||
        (t("portal.defaultEmployeeTitle", "Senior Product Analyst")),

      avatarText:
        activeUser?.initials
          ? activeUser.initials.toUpperCase()
          : "OH",

      avatarBg: "#d7eee9",
      avatarColor: "#235850",
    };
  }

  const { displayName, displayTitle, avatarText, avatarBg, avatarColor } =
    userInfo;

  const portalLabel = t(
    `portal.${effectiveRole}Portal`,
    `${effectiveRole.toUpperCase()} PORTAL`,
  );

  // =========================
  // Sidebar Position
  // =========================

  const sidebarPosition = isRtl ? "right-0" : "left-0";
  const hiddenPosition = isRtl ? "translate-x-full" : "-translate-x-full";

  // =========================
  // Sidebar Sections
  // =========================

  const sections = [
    "GENERAL",
    "OPERATIONS",
    "FINANCIAL & REWARDS",
    "GROWTH & GOVERNANCE",
  ];

  const sectionLabelKeys = {
    GENERAL: "portal.sections.general",
    OPERATIONS: "portal.sections.operations",
    "FINANCIAL & REWARDS": "portal.sections.financialRewards",
    "GROWTH & GOVERNANCE": "portal.sections.growthGovernance",
  };
  return (
    <>
      {/* =========================
          Mobile Backdrop
      ========================= */}

      {isOpen && (
        <div
          onClick={onClose}
          className="
            fixed
            inset-0
            z-[45]
            bg-[rgba(16,42,67,0.5)]
            lg:hidden
          "
        />
      )}

      {/* =========================
          Sidebar
      ========================= */}

      <aside
        style={{
          height: "100dvh",
          maxHeight: "100dvh",
        }}
        className={`
          fixed
          ${sidebarPosition}
          top-0
          bottom-0
          z-50

          flex
          w-[256px]
          flex-col
          overflow-hidden

          bg-[#1c364f]
          border-r
          border-[#294861]
          rtl:border-r-0
          rtl:border-l
          rtl:border-[#294861]

          px-4
          py-5

          shadow-xl

          transition-transform
          duration-300
          ease-in-out

          lg:translate-x-0

          ${isOpen ? "translate-x-0" : hiddenPosition}
        `}
      >
        {/* =========================
            Brand
        ========================= */}

        <div
          className="
            mb-6
            flex
            items-center
            justify-between
            px-2
            shrink-0
          "
        >
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt={`${APP_NAME} Logo`}
              className="
                h-8
                w-8
                shrink-0
                rounded-xl
              "
            />

            <span
              className="
                text-lg
                font-bold
                tracking-tight
                text-white
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
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-[#9fb3c8] hover:text-white rounded-lg hover:bg-[#294861] transition cursor-pointer"
            aria-label="Close Sidebar"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* =========================
            Portal Label
        ========================= */}

        <p
          className="
            mb-3
            px-3
            shrink-0
            text-[11px]
            font-bold
            uppercase
            tracking-[0.14em]
            text-[#7a9bb8]
          "
        >
          {portalLabel}
        </p>

        {/* =========================
            Navigation
        ========================= */}

        <nav
          style={{
            flex: "1 1 0%",
            minHeight: 0,
          }}
          className="
            flex
            h-0
            flex-col
            gap-1.5
            overflow-y-auto
            overflow-x-hidden
            pr-1
            rtl:pr-0
            rtl:pl-1
            [scrollbar-width:thin]
            [scrollbar-color:#2b4b68_transparent]
          "
        >
          {sections.map((section) => {
            const sectionItems = links.filter(
              (link) => (link.section || "GENERAL") === section,
            );

            // Don't show empty sections
            if (sectionItems.length === 0) return null;

            return (
              <div key={section} className="mb-4 flex flex-col gap-1.5">
                {/* =========================
                    Section Title
                ========================= */}

                <h3
                  className="
                    mb-1
                    mt-2
                    px-3
                    text-[12px]
                    font-bold
                    uppercase
                    tracking-[0.12em]
                    text-[#a9c5df]
                  "
                >
                  {t(sectionLabelKeys[section], section)}
                </h3>

                {/* =========================
                    Section Items
                ========================= */}

                {sectionItems.map((link) => {
                  const Icon = link.icon;

                  const title = link.titleKey
                    ? t(link.titleKey, link.title)
                    : link.title;

                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={onClose}
                      style={({ isActive }) =>
                        isActive
                          ? {
                            backgroundColor: "#2b4b68",
                            borderLeft: isRtl
                              ? "none"
                              : "3.5px solid #52d1b2",
                            borderRight: isRtl
                              ? "3.5px solid #52d1b2"
                              : "none",
                            borderTop: "none",
                            borderBottom: "none",
                            borderRadius: "8px",
                          }
                          : {
                            border: "none",
                            backgroundColor: "transparent",
                          }
                      }
                      className={({ isActive }) => `
                        group
                        relative
                        flex
                        h-[43px]
                        shrink-0
                        items-center
                        gap-3.5

                        rounded-[8px]
                        border-0
                        outline-none
                        focus:outline-none

                        px-3.5
                        py-1.5

                        text-[13.5px]
                        font-medium

                        transition-all
                        duration-150

                        ${isActive
                          ? "text-white font-semibold shadow-sm"
                          : "text-[#8fa8c1] hover:bg-[#2b4b68]/50 hover:text-white"
                        }
                      `}
                    >
                      {/* Icon */}

                      {Icon && (
                        <Icon
                          className="
                            h-4.5
                            w-4.5
                            shrink-0
                          "
                        />
                      )}

                      {/* Title */}

                      <span className="flex-1 truncate">{title}</span>

                      {/* Notification Badge */}

                      {link.path.includes("notifications") &&
                        unreadCount > 0 && (
                          <span
                            className="
                              ml-auto
                              flex
                              h-5
                              w-5
                              items-center
                              justify-center
                              rounded-full
                              bg-[#eb5757]
                              text-[11px]
                              font-bold
                              leading-none
                              text-white
                              rtl:ml-0
                              rtl:mr-auto
                            "
                          >
                            {unreadCount}
                          </span>
                        )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* =========================
            Bottom Section
        ========================= */}

        <div className="mt-auto flex flex-col pt-3 shrink-0">
          {/* Need a hand? Card - Only for non-admin portals */}

          {!isAdminPage && effectiveRole === "employee" && (
            <NavLink
              to="/employee/ai-assistant"
              onClick={onClose}
              style={{
                backgroundColor: "#223d57",
                borderColor: "#38597b",
                borderWidth: "1px",
                borderStyle: "solid",
              }}
              className="
                group
                flex
                items-center
                gap-3.5
                rounded-xl
                p-4
                transition-all
                duration-200
                hover:border-[#4a729c]
                hover:bg-[#284869]
              "
            >
              {/* Sparkle Icon */}

              <LuSparkles
                className="
                  h-6
                  w-6
                  shrink-0
                  text-[#52d1b2]
                  transition-transform
                  duration-200
                  group-hover:scale-110
                "
              />

              {/* Texts */}

              <div className="flex min-w-0 flex-1 flex-col">
                <strong className="text-[13.5px] font-bold leading-tight text-white">
                  {t("portal.needAHand", "Need a hand?")}
                </strong>

                <span className="mt-1 text-[11.5px] leading-tight text-[#8fa8c1]">
                  {t("portal.askAi", "Ask the AI Assistant")}
                </span>
              </div>

              {/* Arrow */}

              <FiArrowRight
                className={`
                  h-4
                  w-4
                  shrink-0
                  text-[#8fa8c1]
                  transition-transform
                  duration-200
                  group-hover:translate-x-1
                  ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}
                `}
              />
            </NavLink>
          )}

          {/* Divider Line */}
          {/* 
          <div
            style={{
              height: "1px",
              backgroundColor: "#294863",
              margin: isAdminPage ? "8px 0 14px 0" : "14px 0",
              width: "100%",
              border: "none",
            }}
          /> */}

          {/* User Mini Profile */}


        </div>
      </aside>
    </>
  );
};

export default Sidebar;
