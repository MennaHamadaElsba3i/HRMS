import { useState, useEffect } from "react";
import {
  LuBuilding2,
  LuChevronRight,
  LuArrowUpRight,
  LuPlus,
  LuPenLine,
  LuTrash2,
  LuX,
  LuCheck,
  LuTriangleAlert,
} from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  useActiveCompanyLocation,
  useCreateCompanyLocation,
  useUpdateCompanyLocation,
  useDeactivateCompanyLocation,
  useActivateCompanyLocation,
} from "../../../hooks/useCompanyLocations";


const formatCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return "—";
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(
    lng
  ).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`;
};

const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const modalPanel = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.26, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.18 } },
};

const toastVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -15, scale: 0.96, transition: { duration: 0.2 } },
};

export default function Branches() {
  const { t, i18n } = useTranslation();

  const isRtl = i18n.language?.startsWith("ar");

  // =========================
  // React Query Hooks
  // =========================
  const {
    data: activeLocation,
    isLoading: loading,
    isError,
    error: fetchError,
    refetch: refetchLocation,
  } = useActiveCompanyLocation();

  // Normalize: API returns either a single object or null
  const branches = activeLocation ? [activeLocation] : [];
  const apiError = isError
    ? fetchError?.response?.data?.message || fetchError?.message || null
    : null;

  const createMutation    = useCreateCompanyLocation();
  const updateMutation    = useUpdateCompanyLocation();
  const deactivateMutation = useDeactivateCompanyLocation();
  const activateMutation   = useActivateCompanyLocation();

  // =========================
  // Modal State
  // =========================
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Delete Confirmation State
  const [deletingBranch, setDeletingBranch] = useState(null);
  const deleting = deactivateMutation.isPending;

  // =========================
  // Toast / Form State
  // =========================
  const [toast, setToast] = useState({ visible: false, title: "", message: "" });

  const [branchName, setBranchName]       = useState("");
  const [latitude, setLatitude]           = useState("30.0444");
  const [longitude, setLongitude]         = useState("31.2357");
  const [geofenceRadius, setGeofenceRadius] = useState("350");
  const [isActive, setIsActive]           = useState(true);
  const submitting = createMutation.isPending || updateMutation.isPending;

  // =========================
  // Toast
  // =========================
  const showSuccessToast = (title, message) => {
    setToast({ visible: true, title, message });

    window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // =========================
  // Close Modals with Escape
  // =========================
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeModal();
        setDeletingBranch(null);
      }
    };

    if (isModalOpen || deletingBranch) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, deletingBranch]);

  // =========================
  // Modal Helpers
  // =========================
  const openAddModal = () => {
    setEditingBranch(null);
    setBranchName("");
    setLatitude("30.0444");
    setLongitude("31.2357");
    setGeofenceRadius("350");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setBranchName(branch.name || "");
    setLatitude(String(branch.latitude ?? "30.0444"));
    setLongitude(String(branch.longitude ?? "31.2357"));
    setGeofenceRadius(String(branch.radius ?? 350));
    setIsActive(!!branch.is_active);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  // =====================================================
  // Toggle GPS — activate/deactivate endpoints
  // =====================================================
  const handleToggleGps = async (branch) => {
    const newState = !branch.is_active;

    try {
      if (newState) {
        await activateMutation.mutateAsync(branch.id);
      } else {
        await deactivateMutation.mutateAsync(branch.id);
      }
      showSuccessToast(
        newState
          ? t("branchesPage.gpsEnabledToastTitle", "Location Activated")
          : t("branchesPage.gpsDisabledToastTitle", "Location Deactivated"),
        newState
          ? t("branchesPage.gpsEnabledToastMessage", { name: branch.name, defaultValue: `${branch.name} is now active.` })
          : t("branchesPage.gpsDisabledToastMessage", { name: branch.name, defaultValue: `${branch.name} has been deactivated.` })
      );
    } catch (e) {
      showSuccessToast(
        t("branchesPage.updateFailedTitle", "Error"),
        e?.response?.data?.message || e?.message || t("branchesPage.updateFailed", "Failed to update location.")
      );
    }
  };

  // =====================================================
  // DELETE — Deactivate via PATCH /deactivate
  // =====================================================
  const handleDeleteBranch = async () => {
    if (!deletingBranch || deleting) return;

    const branchToDelete = deletingBranch;

    try {
      await deactivateMutation.mutateAsync(branchToDelete.id);
      setDeletingBranch(null);
      showSuccessToast(
        t("branchesPage.deactivatedTitle", "Location Deactivated"),
        `"${branchToDelete.name}" ${t("branchesPage.deactivatedMsg", "was deactivated successfully.")}`
      );
    } catch (e) {
      showSuccessToast(
        t("branchesPage.updateFailedTitle", "Error"),
        e?.response?.data?.message || e?.message
      );
    }
  };

  // =====================================================
  // Submit — POST (جديد) أو PUT (تعديل)
  // =====================================================
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!branchName.trim() || submitting) return;

    const body = {
      name: branchName.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Number(geofenceRadius) || 350,
      is_active: isActive,
    };

    const isEditing = !!editingBranch;

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: editingBranch.id, body });
      } else {
        await createMutation.mutateAsync(body);
      }

      closeModal();
      showSuccessToast(
        isEditing
          ? t("branchesPage.updatedTitle", "Location Updated")
          : t("branchesPage.addedTitle", "Location Added"),
        isEditing
          ? t("branchesPage.updatedMsg", "Your location was updated successfully.")
          : t("branchesPage.addedMsg", "The new location was added successfully.")
      );
    } catch (e) {
      const serverMsg =
        e?.response?.data?.errors
          ? Object.values(e.response.data.errors).flat()[0]
          : e?.response?.data?.message || e?.message;

      // 422: already has a location → switch to edit mode
      if (e?.response?.status === 422) {
        const msg = (serverMsg || "").toLowerCase();
        if (msg.includes("already") || msg.includes("exists")) {
          closeModal();
          refetchLocation();
          showSuccessToast(
            t("branchesPage.alreadyExistsTitle", "Location already exists"),
            t("branchesPage.alreadyExistsMsg", "Your company already has a location — you can edit it instead.")
          );
          return;
        }
      }

      showSuccessToast(t("branchesPage.updateFailedTitle", "Error"), serverMsg || "Failed");
    }
  };

  // =========================
  // Export Config
  // =========================
  const handleExportConfig = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      branches,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");

    downloadAnchor.href = url;
    downloadAnchor.download = "wisework_locations_config.json";

    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);

    showSuccessToast(
      t("branchesPage.exportSuccessTitle", "Export successful"),
      t(
        "branchesPage.exportSuccessMessage",
        "Locations configuration exported successfully."
      )
    );
  };

  const hasNoLocation = branches.length === 0;

  return (
    <>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="w-full max-w-[1400px] mx-auto box-border"
      >
        {/* HEADER */}
        <div className="flex justify-between items-end mb-[28px] gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#829ab1] mb-2">
              <span>{t("branchesPage.breadcrumbApp")}</span>

              <LuChevronRight
                size={14}
                className={`text-[#9fb3c8] ${isRtl ? "rotate-180" : ""}`}
              />

              <span className="text-[#486581]">
                {t("branchesPage.breadcrumbPage")}
              </span>
            </div>

            <h1 className="text-[28px] font-bold leading-[1.2] text-[#243b53] tracking-[-0.02em]">
              {t("branchesPage.title", "Locations")}
            </h1>

            <p className="text-[14px] text-[#627d98] mt-[6px] leading-[1.4]">
              {t("branchesPage.subtitle", "Configure and manage your WiseWork locations.")}
            </p>
          </div>

          <motion.button
            type="button"
            onClick={handleExportConfig}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-white border border-[#bcccdc] rounded-lg text-[#486581] text-[14px] font-semibold cursor-pointer shadow-[0_1px_2px_rgba(16,42,67,0.04)] transition-all duration-150 ease-in-out whitespace-nowrap hover:bg-[#f0f4f7] hover:border-[#9fb3c8]"
          >
            <LuArrowUpRight size={17} />

            <span>{t("branchesPage.exportConfig", "Export Config")}</span>
          </motion.button>
        </div>

        {/* API ERROR + Retry */}
        {apiError && (
          <div className="mb-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4 flex justify-between items-center gap-3 flex-wrap">
            <p className="text-sm font-semibold text-[#dc2626] m-0">
              {apiError}
            </p>

            <button
              type="button"
              onClick={() => refetchLocation()}
              className="h-9 px-4 bg-white border border-[#fecaca] rounded-lg text-[#dc2626] text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#fef2f2]"
            >
              Retry
            </button>
          </div>
        )}

        {/* MAIN CARD */}
        <div className="bg-white border border-[#d9e2ec] rounded-[14px] py-6 px-7 shadow-[0_1px_3px_rgba(16,42,67,0.03)] box-border">
          <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-[18px] font-bold text-[#243b53] m-0 leading-[1.3]">
                {t("branchesPage.cardTitle", "Branch locations")}
              </h2>

              <p className="text-[14px] text-[#829ab1] mt-1 leading-[1.4]">
                {hasNoLocation
                  ? t("branchesPage.noLocationDesc", "Add your company location to enable GPS enforcement")
                  : t("branchesPage.cardSubtitle", "Configure GPS enforcement for your location")}
              </p>
            </div>

            <motion.button
              type="button"
              onClick={() =>
                hasNoLocation ? openAddModal() : openEditModal(branches[0])
              }
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center gap-2 h-10 px-[18px] bg-[#243b53] border-0 rounded-lg text-white text-[14px] font-semibold cursor-pointer shadow-[0_1px_3px_rgba(16,42,67,0.12)] transition-colors duration-150 ease-in-out whitespace-nowrap hover:bg-[#334e68]"
            >
              {hasNoLocation ? <LuPlus size={17} /> : <LuPenLine size={17} />}

              <span>
                {hasNoLocation
                  ? t("branchesPage.addLocation", "Add Location")
                  : t("branchesPage.editLocation", "Edit Location")}
              </span>
            </motion.button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 min-[901px]:grid-cols-2 gap-4">
              {[0, 1].map((index) => (
                <div
                  key={index}
                  className="bg-white border border-[#d9e2ec] rounded-xl py-5 px-[22px] min-h-[154px] flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-[42px] h-[42px] rounded-lg bg-[#f1f5f9] animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 rounded bg-[#f1f5f9] animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-[#f1f5f9] animate-pulse" />
                    </div>
                  </div>
                  <div className="h-3 w-1/3 rounded bg-[#f1f5f9] animate-pulse" />
                </div>
              ))}
            </div>
          ) : branches.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#829ab1]">
              {t(
                "branchesPage.noLocationsFound",
                "No locations found — add your first location to get started"
              )}
            </p>
          ) : (
            <div className="grid grid-cols-1 min-[901px]:grid-cols-2 gap-4">
              {branches.map((branch) => (
                <motion.div
                  key={branch.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-[#d9e2ec] rounded-xl py-5 px-[22px] flex flex-col justify-between min-h-[154px] box-border transition-colors duration-150 ease-in-out hover:border-[#bcccdc]"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-[42px] h-[42px] rounded-lg bg-[#e7eef5] text-[#486581] flex items-center justify-center shrink-0">
                        <LuBuilding2 size={21} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-[16px] font-bold text-[#243b53] m-0 leading-[1.2]">
                          {branch.name}
                        </h3>

                        <p className="text-[12px] text-[#829ab1] mt-1 leading-normal whitespace-nowrap">
                          {formatCoordinates(branch.latitude, branch.longitude)}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-[6px] h-[26px] px-[10px] bg-[#e7eef5] text-[#486581] rounded-full text-[12px] font-semibold shrink-0 whitespace-nowrap">
                      <span className="w-[6px] h-[6px] rounded-full bg-[#486581]" />
                      <span>{branch.radius ?? 350} m</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-[18px] pt-[14px] border-t border-[#eef1f4] gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-[#486581] m-0 leading-[1.2]">
                        {t("branchesPage.gpsEnforcement")}
                      </p>

                      <p className="text-[12px] text-[#829ab1] mt-[2px] m-0 leading-[1.3]">
                        {t("branchesPage.gpsEnforcementDesc")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openEditModal(branch)}
                        aria-label={`Edit ${branch.name}`}
                        className="w-8 h-8 rounded-lg border border-[#d9e2ec] bg-white text-[#486581] flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-[#f0f4f7]"
                      >
                        <LuPenLine size={15} />
                      </button>

                      {/* Delete / Deactivate */}
                      <button
                        type="button"
                        onClick={() => setDeletingBranch(branch)}
                        aria-label={`Delete ${branch.name}`}
                        className="w-8 h-8 rounded-lg border border-[#fecaca] bg-white text-[#dc2626] flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-[#fef2f2]"
                      >
                        <LuTrash2 size={15} />
                      </button>

                      {/* GPS Toggle */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleToggleGps(branch)}
                        aria-label={`Toggle GPS for ${branch.name}`}
                        aria-pressed={!!branch.is_active}
                        className={`relative w-11 h-6 rounded-full border-0 cursor-pointer shrink-0 p-0 outline-none transition-colors duration-200 ease-in-out ${
                          branch.is_active ? "bg-[#5b8c6a]" : "bg-[#bcccdc]"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-[left] duration-200 ease-in-out ${
                            branch.is_active ? "left-6" : "left-1"
                          }`}
                        />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="branch-modal-backdrop"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(16,42,67,0.5)] p-4 box-border"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <motion.div
              key="branch-modal-panel"
              variants={modalPanel}
              initial="hidden"
              animate="visible"
              exit="exit"
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full max-w-[512px] bg-white rounded-2xl p-6 shadow-[0_20px_30px_rgba(16,42,67,0.2)] box-border max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[18px] font-bold text-[#243b53] m-0">
                  {editingBranch
                    ? t("branchesPage.modalTitleEdit", "Edit Location")
                    : t("branchesPage.modalTitle", "Add Location")}
                </h2>

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label={t("branchesPage.closeModal", "Close modal")}
                  className="bg-transparent border-0 text-[#627d98] p-[6px] rounded-md cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-[#f0f4f7] hover:text-[#243b53]"
                >
                  <LuX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-[6px]">
                  <label
                    htmlFor="branch-name"
                    className="text-[14px] font-medium text-[#486581]"
                  >
                    {t("branchesPage.branchNameLabel", "Location Name")}
                  </label>

                  <input
                    id="branch-name"
                    type="text"
                    placeholder={t(
                      "branchesPage.branchNamePlaceholder",
                      "e.g. Cairo Headquarters"
                    )}
                    value={branchName}
                    onChange={(event) => setBranchName(event.target.value)}
                    required
                    className="h-[42px] w-full border border-[#bcccdc] rounded-lg bg-white px-3 text-[14px] text-[#243b53] outline-none box-border transition-all duration-150 placeholder:text-[#829ab1] focus:border-[#486581] focus:shadow-[0_0_0_2px_#d9e2ec]"
                  />
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label
                    htmlFor="branch-latitude"
                    className="text-[14px] font-medium text-[#486581]"
                  >
                    {t("branchesPage.latitudeLabel", "Latitude")}
                  </label>

                  <input
                    id="branch-latitude"
                    type="number"
                    step="any"
                    placeholder="30.0444"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    required
                    className="h-[42px] w-full border border-[#bcccdc] rounded-lg bg-white px-3 text-[14px] text-[#243b53] outline-none box-border transition-all duration-150 placeholder:text-[#829ab1] focus:border-[#486581] focus:shadow-[0_0_0_2px_#d9e2ec]"
                  />
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label
                    htmlFor="branch-longitude"
                    className="text-[14px] font-medium text-[#486581]"
                  >
                    {t("branchesPage.longitudeLabel", "Longitude")}
                  </label>

                  <input
                    id="branch-longitude"
                    type="number"
                    step="any"
                    placeholder="31.2357"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    required
                    className="h-[42px] w-full border border-[#bcccdc] rounded-lg bg-white px-3 text-[14px] text-[#243b53] outline-none box-border transition-all duration-150 placeholder:text-[#829ab1] focus:border-[#486581] focus:shadow-[0_0_0_2px_#d9e2ec]"
                  />
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label
                    htmlFor="geofence-radius"
                    className="text-[14px] font-medium text-[#486581]"
                  >
                    {t("branchesPage.geofenceRadiusLabel", "Geofence Radius (meters)")}
                  </label>

                  <input
                    id="geofence-radius"
                    type="number"
                    min="1"
                    placeholder="350"
                    value={geofenceRadius}
                    onChange={(event) => setGeofenceRadius(event.target.value)}
                    className="h-[42px] w-full border border-[#bcccdc] rounded-lg bg-white px-3 text-[14px] text-[#243b53] outline-none box-border transition-all duration-150 placeholder:text-[#829ab1] focus:border-[#486581] focus:shadow-[0_0_0_2px_#d9e2ec]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label
                    htmlFor="branch-is-active"
                    className="text-[14px] font-medium text-[#486581]"
                  >
                    {t("branchesPage.activeLabel", "Active")}
                  </label>

                  <button
                    id="branch-is-active"
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => setIsActive((prev) => !prev)}
                    className={`relative w-11 h-6 rounded-full border-0 cursor-pointer p-0 outline-none transition-colors duration-200 ease-in-out ${
                      isActive ? "bg-[#5b8c6a]" : "bg-[#bcccdc]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-[left] duration-200 ease-in-out ${
                        isActive ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex justify-end gap-[10px] mt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-10 px-[18px] bg-white border border-[#bcccdc] rounded-lg text-[#486581] text-[14px] font-semibold cursor-pointer transition-all duration-150 hover:bg-[#f0f4f7]"
                  >
                    {t("branchesPage.cancel", "Cancel")}
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-10 px-[18px] bg-[#243b53] border-0 rounded-lg text-white text-[14px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#334e68] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? t("branchesPage.saving", "Saving...")
                      : editingBranch
                      ? t("branchesPage.saveChanges", "Save Changes")
                      : t("branchesPage.addLocation", "Add Location")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingBranch && (
          <motion.div
            key="delete-modal-backdrop"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(16,42,67,0.5)] p-4 box-border"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !deleting) {
                setDeletingBranch(null);
              }
            }}
          >
            <motion.div
              key="delete-modal-panel"
              variants={modalPanel}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-[420px] bg-white rounded-2xl p-6 shadow-[0_20px_30px_rgba(16,42,67,0.2)] box-border"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-[#fef2f2] text-[#dc2626] flex items-center justify-center mb-4">
                  <LuTriangleAlert size={28} />
                </div>

                <h2 className="text-[18px] font-bold text-[#243b53] m-0 mb-2">
                  {t("branchesPage.deactivateModalTitle", "Deactivate Location?")}
                </h2>

                <p className="text-[14px] text-[#627d98] leading-[1.6] m-0 mb-6">
                  {t("branchesPage.deactivateModalDesc", {
                    name: deletingBranch.name,
                    defaultValue: `Are you sure you want to deactivate "${deletingBranch.name}"? It will no longer be available for GPS enforcement.`,
                  })}
                </p>

                <div className="flex justify-center gap-[10px] w-full">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setDeletingBranch(null)}
                    className="flex-1 h-10 bg-white border border-[#bcccdc] rounded-lg text-[#486581] text-[14px] font-semibold cursor-pointer transition-all duration-150 hover:bg-[#f0f4f7] disabled:opacity-60"
                  >
                    {t("branchesPage.cancel", "Cancel")}
                  </button>

                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDeleteBranch}
                    className="flex-1 h-10 bg-[#dc2626] border-0 rounded-lg text-white text-[14px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#b91c1c] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {deleting
                      ? t("branchesPage.deleting", "Deleting...")
                      : t("branchesPage.confirmDeactivate", "Yes, Deactivate")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed top-5 ${
              isRtl ? "left-5" : "right-5"
            } z-[100] flex items-center gap-3 rounded-xl border border-[#d9e2ec] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(16,42,67,0.12)]`}
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-[#e8f3eb] text-[#3f7d5a]">
              <LuCheck size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#243B53]">
                {toast.title}
              </p>
              <p className="mt-0.5 text-xs text-[#829ab1]">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}