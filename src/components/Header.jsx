import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiBell,
  FiChevronDown,
  FiMenu,
  FiUser,
  FiLogOut,
} from "react-icons/fi";

import LanguageSwitcher from "./LanguageSwitcher";
import NotificationDropdown from "./NotificationDropdown";
import SecureImage from "./SecureImage";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

const Header = ({ onToggleMenu, role }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { currentUser, role: authRole, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  // Get the actual logged-in user's role
  const effectiveRole = currentUser?.role || authRole || role || "employee";

  const normalizedRole = String(effectiveRole).trim().toLowerCase();

  const isAr = i18n.language?.startsWith("ar");

  // User information
  const avatarText = currentUser?.initials || "U";

  const displayName =
    (isAr && currentUser?.nameAr
      ? currentUser.nameAr
      : currentUser?.name || currentUser?.nameAr) || "User";

  const displayRole =
    currentUser?.role_label ||
    currentUser?.job_title ||
    t("portal.staffMember", "Staff Member");

  // Profile route according to the user's role
  const profileRoutes = {
    employee: "/employee/profile",
    manager: "/manager/profile",
    hr: "/hr/settings",
    owner: "/admin/settings",
    admin: "/admin/settings",
  };

  const profilePath = profileRoutes[normalizedRole] || "/employee/profile";

  // Avatar colors
  let avatarBg = "bg-[#e7eef5]";
  let avatarColor = "text-[#486581]";

  if (normalizedRole === "employee") {
    avatarBg = "bg-[#d7eee9]";
    avatarColor = "text-[#235850]";
  } else if (normalizedRole === "hr") {
    avatarBg = "bg-[#ede9fe]";
    avatarColor = "text-[#5b21b6]";
  } else if (normalizedRole === "manager") {
    avatarBg = "bg-[#fef3c7]";
    avatarColor = "text-[#92400e]";
  }

  // Close notifications
  const handleClose = useCallback(() => {
    setNotifOpen(false);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Navigate to the correct profile page
  const handleProfileClick = () => {
    setProfileOpen(false);
    navigate(profilePath);
  };

  // Logout
  const handleLogout = () => {
    setProfileOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-[65px] items-center justify-between border-b border-[#e2e8f0] bg-white px-4 sm:px-6 lg:px-8">
      {/* Mobile Menu Button */}
      <button
        type="button"
        className="flex lg:hidden items-center justify-center p-2 text-[#243b53] rounded-lg hover:bg-[#f0f4f7] transition shrink-0 cursor-pointer"
        onClick={onToggleMenu}
        aria-label="Toggle Menu"
      >
        <FiMenu className="w-5 h-5" />
      </button>

      {/* Searchbox */}
      <div className="flex items-center gap-2 h-[38px] max-[760px]:h-[35px] w-[min(440px,45vw)] max-[760px]:flex-1 max-[760px]:w-auto max-[760px]:mx-1.5 rounded-lg border border-[#e2e8f0] bg-[#fbfcfd] px-3 max-[760px]:px-2 min-w-0">
        <FiSearch className="w-4 h-4 text-[#829ab1] shrink-0" />

        <input
          className="flex-1 bg-transparent text-[12px] text-[#334e68] outline-none placeholder:text-[#829ab1] min-w-0"
          placeholder={t(
            "portal.searchPlaceholder",
            "Search tasks, policies, calendar...",
          )}
        />

        <kbd className="hidden border border-[#e2e8f0] bg-[#eef2f5] rounded px-1.5 py-0.5 text-[10px] text-[#829ab1] font-sans whitespace-nowrap">
          ⌘ K
        </kbd>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4 max-[760px]:gap-1.5 shrink-0">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <div className="relative shrink-0">
          <button
            type="button"
            className="relative flex items-center justify-center p-1.5 text-[#486581] rounded-lg hover:bg-[#f0f4f7] transition"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((prev) => !prev)}
            title={t("portal.notifications", "Notifications")}
          >
            <FiBell className="w-[19px] h-[19px]" />

            {unreadCount > 0 && (
              <span className="absolute top-[5px] right-[5px] w-[7px] h-[7px] rounded-full bg-[#e56b6f] border-[1.5px] border-white" />
            )}
          </button>

          <NotificationDropdown
            isOpen={notifOpen}
            onClose={handleClose}
            role={effectiveRole}
          />
        </div>

        {/* User Profile Dropdown */}
        <div className="relative shrink-0" ref={profileRef}>
          {/* Profile Button */}
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 px-2 py-1 max-[760px]:px-0.5 rounded-lg hover:bg-[#f0f4f7] transition cursor-pointer border-0 bg-transparent shrink-0"
          >
            <div
              className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold ${avatarColor} overflow-hidden shrink-0`}
            >
              {currentUser?.avatar_url || currentUser?.avatar ? (
                <SecureImage
                  src={currentUser?.avatar_url || currentUser?.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  fallback={avatarText}
                />
              ) : (
                avatarText
              )}
            </div>

            <div className="flex flex-col text-left rtl:text-right max-[760px]:hidden">
              <strong className="text-[12px] font-bold text-[#1e293b] leading-tight">
                {displayName}
              </strong>

              <span className="text-[10px] text-[#829ab1] mt-0.5 leading-tight">
                {displayRole}
              </span>
            </div>

            <FiChevronDown
              className={`w-3.5 h-3.5 text-[#829ab1] max-[760px]:hidden transition-transform ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-56 rounded-xl border border-[#e2e8f0] bg-white shadow-lg py-2 z-50">
              {/* User Information */}
              <div className="px-4 py-3 border-b border-[#e2e8f0]">
                <p className="text-sm font-bold text-[#1e293b] truncate">
                  {displayName}
                </p>

                <p className="text-xs text-[#829ab1] mt-1 truncate">
                  {currentUser?.email || ""}
                </p>
              </div>

              {/* Profile */}
              <button
                type="button"
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#334e68] hover:bg-[#f0f4f7] transition"
              >
                <FiUser className="w-4 h-4" />

                <span>{t("portal.profile", "Profile")}</span>
              </button>

              {/* Divider */}
              <div className="border-t border-[#e2e8f0] my-1" />

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <FiLogOut className="w-4 h-4" />

                <span>{t("portal.logout", "Log out")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
