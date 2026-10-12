import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  FiUsers,
  FiMapPin,
  FiMessageSquare,
  FiActivity,
  FiSettings,
  FiX,
  FiCamera,
  FiUpload,
  FiTrash2,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";

import { profileSettingsConfig } from "../../../config/profileSettingsConfig";
import { useAuth } from "../../../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import SecureImage from "../../../components/SecureImage";

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const MAX_FILE_SIZE_MB = 5;

const ProfileSettings = ({ role = "employee" }) => {
  const { t, i18n } = useTranslation();
  const { logout, currentUser } = useAuth();

  const isRtl = i18n.language?.startsWith("ar");
  const language = isRtl ? "ar" : "en";

  // Employee ID for query
  const employeeId = currentUser?.id ?? currentUser?.userId;

  // Use custom profile hook
  const {
    profile: employee,
    isLoading,
    isError,
    error,
    updateProfile,
    isUpdating,
  } = useProfile(employeeId);

  // =====================================================
  // FALLBACK CONFIG
  // =====================================================
  const initialData =
    profileSettingsConfig[role] || profileSettingsConfig.employee;

  // =====================================================
  // NORMALIZE API DATA
  // =====================================================
  const employeeProfileData = {
    fullName:
      employee?.name || currentUser?.name || initialData?.fullName || "",
    jobTitle:
      employee?.job_title ||
      currentUser?.job_title ||
      currentUser?.role_label ||
      initialData?.jobTitle ||
      "",
    employeeId:
      employee?.employee_code ||
      currentUser?.employee_code ||
      (employeeId ? `EMP-${employeeId}` : initialData?.employeeId || ""),
    directManager:
      employee?.manager?.name ||
      currentUser?.manager?.name ||
      initialData?.directManager ||
      "-",
    workLocation:
      employee?.company_location?.name ||
      currentUser?.company_location?.name ||
      initialData?.workLocation ||
      "-",
    workEmail:
      employee?.email || currentUser?.email || initialData?.workEmail || "",
    phone:
      employee?.phone || currentUser?.phone || initialData?.phone || "-",
    address:
      employee?.address || currentUser?.address || initialData?.address || "",
    avatarUrl:
      employee?.avatar_url ||
      employee?.avatar ||
      currentUser?.avatar_url ||
      currentUser?.avatar ||
      initialData?.avatarUrl ||
      null,
  };

  // Local state for immediate UI feedback after edit
  const [editedProfile, setEditedProfile] = useState(null);

  const data = editedProfile
    ? {
        ...employeeProfileData,
        ...editedProfile,
      }
    : employeeProfileData;

  // =====================================================
  // ACCOUNT SETTINGS
  // =====================================================
  const [biometricLogin, setBiometricLogin] = useState(
    initialData?.biometricLogin ?? false,
  );

  const [pushNotifications, setPushNotifications] = useState(
    initialData?.pushNotifications ?? false,
  );

  // =====================================================
  // MODALS
  // =====================================================
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // =====================================================
  // EDIT FORM STATE
  // =====================================================
  const [editForm, setEditForm] = useState({
    fullName: "",
    jobTitle: "",
    directManager: "",
    workLocation: "",
    workEmail: "",
    phone: "",
    address: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // =====================================================
  // OPEN EDIT PROFILE
  // =====================================================
  const handleOpenEditModal = () => {
    setEditForm({
      fullName: data?.fullName || "",
      jobTitle: data?.jobTitle || "",
      directManager: data?.directManager || "",
      workLocation: data?.workLocation || "",
      workEmail: data?.workEmail || "",
      phone: data?.phone || "",
      address: data?.address || currentUser?.address || "",
    });

    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditModalOpen(true);
  };

  // =====================================================
  // CLOSE EDIT PROFILE
  // =====================================================
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // =====================================================
  // AVATAR FILE SELECTION WITH VALIDATION & PREVIEW
  // =====================================================
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error(
        t(
          "profileSettingsPage.invalidImageType",
          "Please select a valid image file (PNG, JPG, JPEG, WebP)",
        ),
      );
      return;
    }

    // Check file size (max MB)
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(
        t(
          "profileSettingsPage.imageTooLarge",
          `Image size must be less than ${MAX_FILE_SIZE_MB}MB`,
        ),
      );
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================
  const handleSaveProfile = async () => {
    const formData = new FormData();
    if (editForm.fullName) formData.append("name", editForm.fullName);
    if (editForm.phone) formData.append("phone", editForm.phone);
    if (editForm.address) formData.append("address", editForm.address);
    formData.append("locale", language);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const response = await updateProfile(formData);
      const updatedUser = response?.data || response?.user || response;

      setEditedProfile({
        fullName: editForm.fullName || data.fullName,
        phone: editForm.phone || data.phone,
        address: editForm.address || data.address,
        jobTitle: editForm.jobTitle || data.jobTitle,
        avatarUrl:
          updatedUser?.avatar_url ||
          updatedUser?.avatar ||
          avatarPreview ||
          data?.avatarUrl ||
          null,
      });

      handleCloseEditModal();
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  // =====================================================
  // CONFIRM LOGOUT
  // =====================================================
  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  // =====================================================
  // LOADING STATE
  // =====================================================
  if (role === "employee" && isLoading) {
    return (
      <div className="w-full space-y-6">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#3f7d5a] uppercase mb-1">
            {t("profileSettingsPage.eyebrow", "Account")}
          </p>

          <h1 className="text-2xl md:text-[28px] font-bold text-[#1e293b] tracking-tight">
            {t("profileSettingsPage.title", "Settings")}
          </h1>

          <p className="text-sm text-[#64748b] mt-1">
            {t(
              "profileSettingsPage.subtitle",
              "Manage your employee profile and preferences.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="h-24 bg-[#f1f5f9] animate-pulse" />

            <div className="px-6 pb-6">
              <div className="flex items-start justify-between -mt-8">
                <div className="size-16 rounded-full bg-[#e2e8f0] animate-pulse ring-4 ring-white" />

                <div className="mt-10 h-9 w-28 rounded-lg bg-[#f1f5f9] animate-pulse" />
              </div>

              <div className="mt-5 space-y-3">
                <div className="h-5 w-40 rounded bg-[#f1f5f9] animate-pulse" />
                <div className="h-4 w-32 rounded bg-[#f1f5f9] animate-pulse" />
                <div className="h-3 w-28 rounded bg-[#f1f5f9] animate-pulse" />
              </div>

              <div className="mt-5 pt-5 border-t border-[#f1f5f9] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-12 rounded bg-[#f8fafc] animate-pulse" />
                <div className="h-12 rounded bg-[#f8fafc] animate-pulse" />
                <div className="h-12 rounded bg-[#f8fafc] animate-pulse" />
                <div className="h-12 rounded bg-[#f8fafc] animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="space-y-5">
              <div className="h-5 w-40 rounded bg-[#f1f5f9] animate-pulse" />

              <div className="h-4 w-56 rounded bg-[#f1f5f9] animate-pulse" />

              <div className="h-16 rounded bg-[#f8fafc] animate-pulse" />

              <div className="h-16 rounded bg-[#f8fafc] animate-pulse" />

              <div className="h-12 rounded bg-[#f8fafc] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================
  if (role === "employee" && isError) {
    return (
      <div className="w-full space-y-6">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#3f7d5a] uppercase mb-1">
            {t("profileSettingsPage.eyebrow", "Account")}
          </p>

          <h1 className="text-2xl md:text-[28px] font-bold text-[#1e293b] tracking-tight">
            {t("profileSettingsPage.title", "Profile & settings")}
          </h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-base font-bold text-red-700">
            {t(
              "profileSettingsPage.loadErrorTitle",
              "Unable to load your profile",
            )}
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error?.response?.data?.message ||
              error?.message ||
              t(
                "profileSettingsPage.loadError",
                "Something went wrong while loading your profile.",
              )}
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {/* =====================================================
          MAIN PAGE CONTENT
      ===================================================== */}
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div>
          <p className="text-xs font-bold tracking-wider text-[#3f7d5a] uppercase mb-1">
            {t("profileSettingsPage.eyebrow", "Account")}
          </p>

          <h1 className="text-2xl md:text-[28px] font-bold text-[#1e293b] tracking-tight">
            {t("profileSettingsPage.title", "Settings")}
          </h1>

          <p className="text-sm text-[#64748b] mt-1 font-normal">
            {t(
              "profileSettingsPage.subtitle",
              "Manage your employee profile and preferences.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* =====================================================
              PROFILE CARD
          ====================================================== */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Cover Banner */}
            <div className="h-24 bg-gradient-to-r from-[#102a43] to-[#486581]" />

            <div className="px-6 pb-6">
              {/* Avatar + Edit button */}
              <div className="flex items-start justify-between -mt-8">
                <div className="flex items-end gap-4">
                  <div className="relative flex size-16 overflow-hidden items-center justify-center rounded-full bg-[#d9eee7] text-[#3f7d5a] text-lg font-bold ring-4 ring-white shadow-sm">
                    {data.avatarUrl ? (
                      <SecureImage
                        src={data.avatarUrl}
                        alt={data.fullName || "Profile"}
                        className="w-full h-full object-cover"
                        fallback={getInitials(data.fullName)}
                      />
                    ) : (
                      getInitials(data.fullName)
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="mt-10 inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] hover:text-[#1e293b] transition shadow-sm"
                >
                  <FiCamera className="w-4 h-4 text-[#64748b]" />
                  {t("profileSettingsPage.editProfile", "Edit profile")}
                </button>
              </div>

              {/* Basic Info */}
              <div className="mt-3">
                <h2 className="text-base font-bold text-[#1e293b]">
                  {data.fullName}
                </h2>

                <p className="text-sm text-[#64748b] mt-0.5">
                  {data.jobTitle}
                </p>

                <p className="text-xs font-semibold text-[#3f7d5a] mt-1">
                  {data.employeeId}
                </p>
              </div>

              {/* Details grid */}
              <div className="mt-5 pt-5 border-t border-[#f1f5f9] grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {/* Direct Manager */}
                <div className="flex items-start gap-3">
                  <FiUsers className="w-4 h-4 text-[#94a3b8] mt-0.5 shrink-0" />

                  <div>
                    <p className="text-xs text-[#64748b]">
                      {t(
                        "profileSettingsPage.directManager",
                        "Direct manager",
                      )}
                    </p>

                    <p className="text-sm font-semibold text-[#1e293b] mt-0.5">
                      {data.directManager}
                    </p>
                  </div>
                </div>

                {/* Work Location */}
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-4 h-4 text-[#94a3b8] mt-0.5 shrink-0" />

                  <div>
                    <p className="text-xs text-[#64748b]">
                      {t(
                        "profileSettingsPage.workLocation",
                        "Work location",
                      )}
                    </p>

                    <p className="text-sm font-semibold text-[#1e293b] mt-0.5">
                      {data.workLocation}
                    </p>
                  </div>
                </div>

                {/* Work Email */}
                <div className="flex items-start gap-3">
                  <FiMessageSquare className="w-4 h-4 text-[#94a3b8] mt-0.5 shrink-0" />

                  <div>
                    <p className="text-xs text-[#64748b]">
                      {t("profileSettingsPage.workEmail", "Work email")}
                    </p>

                    <p className="text-sm font-semibold text-[#1e293b] mt-0.5 break-all">
                      {data.workEmail}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <FiActivity className="w-4 h-4 text-[#94a3b8] mt-0.5 shrink-0" />

                  <div>
                    <p className="text-xs text-[#64748b]">
                      {t("profileSettingsPage.phone", "Phone")}
                    </p>

                    <p className="text-sm font-semibold text-[#1e293b] mt-0.5">
                      {data.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              ACCOUNT SETTINGS CARD
          ====================================================== */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-[#1e293b]">
                    {t(
                      "profileSettingsPage.accountSettings",
                      "Account settings",
                    )}
                  </h2>

                  <p className="text-xs text-[#64748b] mt-0.5 font-normal">
                    {t(
                      "profileSettingsPage.accountSettingsSubtitle",
                      "Personalize how WiseWork works for you.",
                    )}
                  </p>
                </div>

                <FiSettings className="w-5 h-5 text-[#94a3b8] shrink-0" />
              </div>

              <div className="divide-y divide-[#f1f5f9]">
                {/* Biometric Login */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#1e293b]">
                      {t(
                        "profileSettingsPage.biometricLogin",
                        "Biometric login",
                      )}
                    </p>

                    <p className="text-xs text-[#64748b] mt-0.5">
                      {t(
                        "profileSettingsPage.biometricLoginDesc",
                        "Use device biometrics for a faster sign in.",
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={biometricLogin}
                    onClick={() =>
                      setBiometricLogin((prev) => !prev)
                    }
                    className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 ${
                      biometricLogin ? "bg-[#12B76A]" : "bg-[#e2e8f0]"
                    }`}
                  >
                    <span
                      className={`inline-block size-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                        biometricLogin
                          ? "translate-x-2.5 rtl:-translate-x-2.5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#1e293b]">
                      {t(
                        "profileSettingsPage.pushNotifications",
                        "Push notifications",
                      )}
                    </p>

                    <p className="text-xs text-[#64748b] mt-0.5">
                      {t(
                        "profileSettingsPage.pushNotificationsDesc",
                        "Receive updates about tasks and requests.",
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={pushNotifications}
                    onClick={() =>
                      setPushNotifications((prev) => !prev)
                    }
                    className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 ${
                      pushNotifications ? "bg-[#12B76A]" : "bg-[#e2e8f0]"
                    }`}
                  >
                    <span
                      className={`inline-block size-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                        pushNotifications
                          ? "translate-x-2.5 rtl:-translate-x-2.5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Language Switcher */}
                <div className="py-4">
                  <p className="text-xs font-semibold text-[#1e293b] mb-2">
                    {t("profileSettingsPage.language", "Language")}
                  </p>

                  <select
                    value={language}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#486581]/30 transition"
                  >
                    <option value="en">
                      {t("common.english", "English")}
                    </option>

                    <option value="ar">
                      {t("common.arabic", "العربية")}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="mt-6 w-full rounded-lg bg-[#fee2e2] px-4 py-3 text-sm font-semibold text-[#dc2626] hover:bg-[#fecaca] transition"
            >
              {t("profileSettingsPage.logout", "Log out")}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          EDIT PROFILE MODAL WITH AVATAR UPLOAD PREVIEW
      ====================================================== */}
      {isEditModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl transition-all"
              dir={isRtl ? "rtl" : "ltr"}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
                <div>
                  <h3 className="text-lg font-bold text-[#1e293b]">
                    {t(
                      "profileSettingsPage.editProfileTitle",
                      "Edit profile",
                    )}
                  </h3>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    {t(
                      "profileSettingsPage.editProfileSubtitle",
                      "Update your personal information and profile picture.",
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="text-[#94a3b8] hover:text-[#1e293b] p-1 rounded-lg hover:bg-[#f1f5f9] transition"
                  aria-label="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Avatar Upload Section */}
              <div className="py-5 border-b border-[#e2e8f0]">
                <label className="block text-sm font-semibold text-[#1e293b] mb-3">
                  {t("profileSettingsPage.avatarLabel", "Profile Picture")}
                </label>

                <div className="flex items-center gap-5">
                  {/* Current or Preview Image */}
                  <div className="relative group size-20 overflow-hidden rounded-full bg-[#d9eee7] text-[#3f7d5a] text-xl font-bold ring-4 ring-[#f1f5f9] shrink-0 flex items-center justify-center shadow-inner">
                    {avatarPreview || data.avatarUrl ? (
                      <SecureImage
                        src={avatarPreview || data.avatarUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                        fallback={getInitials(editForm.fullName || data.fullName)}
                      />
                    ) : (
                      getInitials(editForm.fullName || data.fullName)
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#cbd5e1] bg-white text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] hover:border-[#94a3b8] transition shadow-xs"
                      >
                        <FiUpload className="w-3.5 h-3.5 text-[#475569]" />
                        {avatarPreview || avatarFile
                          ? t("profileSettingsPage.changePhoto", "Change photo")
                          : t("profileSettingsPage.uploadPhoto", "Upload photo")}
                      </button>

                      {(avatarPreview || avatarFile) && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          {t("common.remove", "Remove")}
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />

                    <p className="text-[11px] text-[#64748b]">
                      {t(
                        "profileSettingsPage.avatarHint",
                        "Allowed formats: PNG, JPG, JPEG, WebP. Max size: 5MB.",
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Form Fields */}
              <div className="pt-4 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    {t("profileSettingsPage.fullNameLabel", "Full name")}
                  </label>

                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-[#cbd5e1] px-3.5 py-2 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3f7d5a]/30 focus:border-[#3f7d5a] transition"
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    {t("profileSettingsPage.jobTitleLabel", "Job title")}
                  </label>

                  <input
                    type="text"
                    value={editForm.jobTitle}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        jobTitle: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-[#cbd5e1] px-3.5 py-2 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3f7d5a]/30 focus:border-[#3f7d5a] transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    {t("profileSettingsPage.phone", "Phone")}
                  </label>

                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-[#cbd5e1] px-3.5 py-2 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3f7d5a]/30 focus:border-[#3f7d5a] transition"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    {t("profileSettingsPage.addressLabel", "Address")}
                  </label>

                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-[#cbd5e1] px-3.5 py-2 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3f7d5a]/30 focus:border-[#3f7d5a] transition"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isUpdating}
                  className="rounded-lg border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] transition disabled:opacity-50"
                >
                  {t("profileSettingsPage.cancelEdit", "Cancel")}
                </button>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#243B53] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1c2f42] transition disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                >
                  {isUpdating ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      {t("common.saving", isRtl ? "جاري الحفظ..." : "Saving...")}
                    </>
                  ) : (
                    t("profileSettingsPage.saveChanges", "Save changes")
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* =====================================================
          LOGOUT CONFIRMATION MODAL
      ====================================================== */}
      {isLogoutModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              dir={isRtl ? "rtl" : "ltr"}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1e293b]">
                  {t(
                    "profileSettingsPage.logoutConfirmTitle",
                    "Confirm Logout",
                  )}
                </h3>

                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="text-[#94a3b8] hover:text-[#1e293b] p-1 rounded-lg hover:bg-[#f1f5f9] transition"
                  aria-label="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Message */}
              <p className="text-sm text-[#64748b] mb-6">
                {t(
                  "profileSettingsPage.logoutConfirmMessage",
                  "Are you sure you want to log out of your account?",
                )}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] transition"
                >
                  {t("profileSettingsPage.cancelLogout", "Cancel")}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b91c1c] transition"
                >
                  {t("profileSettingsPage.confirmLogout", "Log out")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default ProfileSettings;

