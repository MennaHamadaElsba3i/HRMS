import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiPaperclip,
  FiArrowRight,
  FiArrowLeft,
  FiX,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
} from "react-icons/fi";
import {
  useCreateEmployeeLeaveRequest,
  useEmployeeLeaveBalances,
  useEmployeeLeaveRequests,
  useEmployeeLeaveTypes,
  useUploadEmployeeLeaveAttachment,
} from "../hooks/useEmployeeLeave";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

import { useHolidays } from "../../../hooks/useHolidays";

export default function LeaveBalances() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith("ar");
  const { data: holidaysList } = useHolidays();
  const lang = isRtl ? "ar" : "en";
  const year = new Date().getFullYear();
  const leaveTypesQuery = useEmployeeLeaveTypes(lang);
  const balancesQuery = useEmployeeLeaveBalances(year, lang);
  const requestsQuery = useEmployeeLeaveRequests(year, lang);
  const createRequestMutation = useCreateEmployeeLeaveRequest(lang);
  const uploadAttachmentMutation = useUploadEmployeeLeaveAttachment(lang);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);
  const leaveTypes = (leaveTypesQuery.data || []).filter(
    (leaveType) => leaveType.is_active !== false,
  );
  const selectedLeaveType = leaveTypes.find(
    (leaveType) => String(leaveType.id) === leaveTypeId,
  );
  const balances = balancesQuery.data || [];
  const selectedBalance = balances.find(
    (balance) => String(balance.leave_type_id) === leaveTypeId,
  );
  const recentRequests = requestsQuery.data || [];

  // ==========================================
  // Calendar Modal State
  // ==========================================
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const isSubmitting =
    createRequestMutation.isPending || uploadAttachmentMutation.isPending;
  const balanceCheckPending =
    selectedLeaveType?.requires_balance && balancesQuery.isLoading;

  // ==========================================
  // File Attachment Handlers
  // ==========================================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetRequestForm = () => {
    setLeaveTypeId("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setAttachedFile(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ==========================================
  // Form Submission Handler
  // ==========================================
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!leaveTypeId) {
      errors.leave_type_id = t(
        "leaveBalances.validation.leaveType",
        "Select a leave type.",
      );
    }
    if (selectedLeaveType?.requires_balance) {
      if (balancesQuery.isLoading) {
        errors.leave_type_id = t(
          "leaveBalances.validation.balanceLoading",
          "Wait while your leave balance is checked.",
        );
      } else if (balancesQuery.isError) {
        errors.leave_type_id = t(
          "leaveBalances.validation.balanceUnavailable",
          "Your leave balance could not be verified. Retry loading balances.",
        );
      } else if (!selectedBalance) {
        errors.leave_type_id = t(
          "leaveBalances.validation.balanceMissing",
          "No balance is set up for this leave type. Contact HR to set it up.",
        );
      }
    }

    if (!startDate) {
      errors.start_date = t(
        "leaveBalances.validation.startDate",
        "Select a start date.",
      );
    }
    if (!endDate) {
      errors.end_date = t(
        "leaveBalances.validation.endDate",
        "Select an end date.",
      );
    } else if (startDate && endDate < startDate) {
      errors.end_date = t(
        "leaveBalances.toastInvalidDates",
        "End date cannot be earlier than start date.",
      );
    }
    if (!reason.trim()) {
      errors.reason = t(
        "leaveBalances.validation.reason",
        "Enter a reason for your request.",
      );
    }
    if (selectedLeaveType?.requires_attachment && !attachedFile) {
      errors.attachment = t(
        "leaveBalances.validation.attachment",
        "This leave type requires a supporting document.",
      );
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const response = await createRequestMutation.mutateAsync({
        leave_type_id: Number(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || null,
      });
      const createdRequest = response?.data || response;

      if (attachedFile) {
        if (!createdRequest?.id) {
          toast.error(
            t(
              "leaveBalances.attachmentLinkError",
              "The request was created, but its attachment could not be linked.",
            ),
          );
          resetRequestForm();
          return;
        }

        try {
          await uploadAttachmentMutation.mutateAsync({
            requestId: createdRequest.id,
            file: attachedFile,
          });
        } catch (error) {
          const uploadError =
            error?.response?.data?.message || error?.message;
          const message = t(
            "leaveBalances.attachmentUploadError",
            "The request was created, but the attachment could not be uploaded.",
          );
          toast.error(uploadError ? `${message} ${uploadError}` : message);
          resetRequestForm();
          return;
        }
      }

      toast.success(
        response?.message ||
          t("leaveBalances.toastSubmitted", "Leave request submitted successfully!"),
      );
      resetRequestForm();
    } catch (error) {
      const { fieldErrors: apiFieldErrors, message } = getLeaveFormError(
        error,
        t("leaveBalances.toastSubmitError", "Could not submit the leave request."),
      );

      if (apiFieldErrors.leave_type_id === "balanceMissing") {
        apiFieldErrors.leave_type_id = t(
          "leaveBalances.validation.balanceMissing",
          "No balance is set up for this leave type. Contact HR to set it up.",
        );
      }

      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors);
      } else {
        toast.error(message);
      }
    }
  };

  // Calendar Days
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true });
    }
    return days;
  }, [calendarMonth]);

  const monthNamesLongEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthNamesLongAr = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 pb-12 font-sans"
    >
      {/* 1. Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <span className="text-[11px] font-bold tracking-wider text-[#5b8c6a] uppercase mb-1 block">
            {t("leaveBalances.timeOffTag", "TIME OFF")}
          </span>
          <h1 className="text-2xl md:text-[28px] font-bold text-[#102a43] tracking-tight">
            {t("leaveBalances.title", "Leave & balances")}
          </h1>
          <p className="text-sm text-[#829ab1] mt-1 font-normal">
            {t("leaveBalances.subtitle", "Plan time away and keep track of your remaining allowance.")}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-4 py-2.5 text-xs font-semibold text-[#102a43] hover:bg-[#f8fafc] transition shadow-sm shrink-0 self-start sm:self-auto"
        >
          <FiCalendar className="w-4 h-4 text-[#64748b]" />
          <span>{t("leaveBalances.viewCalendar", "View calendar")}</span>
        </motion.button>
      </motion.div>

      {/* 2. Balance Cards Grid */}
      {balancesQuery.isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <span>
            {t("leaveBalances.balanceLoadError", "Could not load leave balances.")}
          </span>
          <button
            type="button"
            onClick={() => balancesQuery.refetch()}
            disabled={balancesQuery.isFetching}
            className="ms-3 font-semibold underline disabled:opacity-50"
          >
            {t("leaveBalances.retry", "Retry")}
          </button>
        </div>
      ) : balancesQuery.isLoading ? (
        <p className="text-sm text-[#64748b]">
          {t("leaveBalances.loadingBalances", "Loading leave balances...")}
        </p>
      ) : balances.length === 0 ? (
        <p className="rounded-2xl border border-[#e2e8f0] bg-white p-6 text-sm text-[#64748b]">
          {t("leaveBalances.noBalances", "No leave balances are available.")}
        </p>
      ) : (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {balances.map((balance) => {
            const allocated = Number(balance.allocated_days) || 0;
            const remaining = Number(balance.remaining_days) || 0;
            const progress = allocated
              ? Math.min(100, (remaining / allocated) * 100)
              : 0;

            return (
              <motion.div
                key={balance.id}
                whileHover={{ y: -2 }}
                className="flex flex-col justify-between rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {getLocalizedLeaveTypeName(
                      balance.leave_type?.name,
                      isRtl,
                      t,
                    )}
                  </span>
                  <FiCalendar className="h-4 w-4 text-[#cbd5e1]" />
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold leading-none text-[#102a43] md:text-3xl">
                      {formatLeaveNumber(remaining, lang)}
                    </span>
                    <span className="text-xs text-[#829ab1]">
                      / {formatLeaveNumber(allocated, lang)}{" "}
                      {t("leaveBalances.days", "days")}
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-[#486581]"
                    />
                  </div>
                </div>

                <span className="mt-3 block text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  {remaining === 1
                    ? t("leaveBalances.daysRemainingSingle", {
                        count: formatLeaveNumber(remaining, lang),
                      })
                    : t("leaveBalances.daysRemaining", {
                        count: formatLeaveNumber(remaining, lang),
                      })}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* 3. Main Section: Request Leave Form + Recent Requests */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Request Leave Form (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-[#e2e8f0] bg-white p-6 md:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-base md:text-lg font-bold text-[#102a43]">
                {t("leaveBalances.requestLeave", "Request leave")}
              </h2>
              <p className="text-xs text-[#829ab1] mt-0.5">
                {t("leaveBalances.requestSubtitle", "Submit a request for manager approval.")}
              </p>
            </div>
            <FiCalendar className="w-4 h-4 text-[#cbd5e1]" />
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Leave Type */}
              <div>
                <label className="text-xs font-semibold text-[#64748b] mb-1.5 block">
                  {t("leaveBalances.leaveType", "Leave type")}
                  <span className="ms-1 text-red-600" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={leaveTypeId}
                    aria-required="true"
                    onChange={(e) => {
                      setLeaveTypeId(e.target.value);
                      setFieldErrors((current) => ({
                        ...current,
                        leave_type_id: "",
                        attachment: "",
                      }));
                    }}
                    disabled={
                      leaveTypesQuery.isLoading ||
                      leaveTypesQuery.isError ||
                      leaveTypes.length === 0
                    }
                    className="w-full h-10 px-3.5 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] font-medium appearance-none focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition cursor-pointer disabled:opacity-60"
                  >
                    <option value="" disabled hidden>
                      {leaveTypesQuery.isLoading
                        ? t("leaveBalances.loadingTypes", "Loading leave types...")
                        : t("leaveBalances.selectLeaveType", "Select leave type")}
                    </option>
                    {leaveTypes.map((leaveType) => (
                      <option key={leaveType.id} value={leaveType.id}>
                        {getLocalizedLeaveTypeName(leaveType.name, isRtl, t)}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown
                    className={`absolute ${isRtl ? "left-3.5" : "right-3.5"} top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none w-4 h-4`}
                  />
                </div>
                {fieldErrors.leave_type_id && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {fieldErrors.leave_type_id}
                  </p>
                )}
                {balancesQuery.isError && (
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-red-600">
                      {balancesQuery.error?.response?.data?.message ||
                        t(
                          "leaveBalances.balanceLoadError",
                          "Could not load leave balances.",
                        )}
                    </p>
                    <button
                      type="button"
                      onClick={() => balancesQuery.refetch()}
                      disabled={balancesQuery.isFetching}
                      className="shrink-0 text-xs font-semibold text-red-700 underline disabled:opacity-50"
                    >
                      {t("leaveBalances.retry", "Retry")}
                    </button>
                  </div>
                )}
                {leaveTypesQuery.isError && (
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-red-600">
                      {leaveTypesQuery.error?.response?.data?.message ||
                        t("leaveBalances.typeLoadError", "Could not load leave types.")}
                    </p>
                    <button
                      type="button"
                      onClick={() => leaveTypesQuery.refetch()}
                      disabled={leaveTypesQuery.isFetching}
                      className="shrink-0 text-xs font-semibold text-red-700 underline disabled:opacity-50"
                    >
                      {t("leaveBalances.retry", "Retry")}
                    </button>
                  </div>
                )}
                {!leaveTypesQuery.isLoading &&
                  !leaveTypesQuery.isError &&
                  leaveTypes.length === 0 && (
                    <p className="mt-1.5 text-xs text-[#64748b]">
                      {t("leaveBalances.noLeaveTypes", "No leave types are available.")}
                    </p>
                  )}
              </div>

              {/* Start Date */}
              <div>
                <label className="text-xs font-semibold text-[#64748b] mb-1.5 block">
                  {t("leaveBalances.startDate", "Start date")}
                  <span className="ms-1 text-red-600" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  aria-required="true"
                  min={getTodayDate()}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      start_date: "",
                      end_date: "",
                    }));
                  }}
                  className="w-full h-10 px-3.5 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] font-medium focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                />
                {fieldErrors.start_date && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {fieldErrors.start_date}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-semibold text-[#64748b] mb-1.5 block">
                  {t("leaveBalances.endDate", "End date")}
                  <span className="ms-1 text-red-600" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  aria-required="true"
                  min={startDate || getTodayDate()}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      end_date: "",
                    }));
                  }}
                  className="w-full h-10 px-3.5 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] font-medium focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition"
                />
                {fieldErrors.end_date && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {fieldErrors.end_date}
                  </p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-semibold text-[#64748b] mb-1.5 block">
                {t("leaveBalances.reason", "Reason")}
                <span className="ms-1 text-red-600" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                value={reason}
                aria-required="true"
                onChange={(e) => {
                  setReason(e.target.value);
                  setFieldErrors((current) => ({ ...current, reason: "" }));
                }}
                placeholder={t("leaveBalances.reasonPlaceholder", "Add a reason for your request...")}
                rows={3}
                className="w-full p-3.5 bg-white border border-[#d9e2ec] rounded-xl text-xs text-[#102a43] placeholder-[#94a3b8] focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition resize-none"
              />
              {fieldErrors.reason && (
                <p className="mt-1.5 text-xs text-red-600" role="alert">
                  {fieldErrors.reason}
                </p>
              )}
            </div>

            {/* Attach Document (Dashed Box) */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  handleFileChange(event);
                  setFieldErrors((current) => ({
                    ...current,
                    attachment: "",
                  }));
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-[#cbd5e1] hover:border-[#64748b] rounded-xl p-3 bg-[#fbfcfd] hover:bg-[#f8fafc] transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FiPaperclip className="text-[#64748b] w-4 h-4" />
                  {attachedFile ? (
                    <div className="flex items-center gap-2">
                      <FiFileText className="text-[#059669] w-4 h-4" />
                      <span className="text-xs font-medium text-[#102a43]">
                        {attachedFile.name}
                      </span>
                      <span className="text-[10px] text-[#94a3b8]">
                        ({(attachedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-[#64748b]">
                      {t("leaveBalances.attachDocument", "Attach supporting document")}
                      {selectedLeaveType?.requires_attachment && (
                        <span className="ms-1 text-red-600" aria-hidden="true">
                          *
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {attachedFile && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-[#94a3b8] hover:text-[#dc2626] p-1 transition"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
              {fieldErrors.attachment && (
                <p className="mt-1.5 text-xs text-red-600" role="alert">
                  {fieldErrors.attachment}
                </p>
              )}
            </div>

            {/* Submit Button (Animated State transition) */}
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={
                  isSubmitting ||
                  leaveTypesQuery.isLoading ||
                  leaveTypes.length === 0 ||
                  balanceCheckPending
                }
                className="px-5 py-2.5 bg-[#102a43] hover:bg-[#1a3857] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>
                    {uploadAttachmentMutation.isPending
                      ? t("leaveBalances.uploadingAttachment", "Uploading attachment...")
                      : t("leaveBalances.submitting", "Submitting...")}
                  </span>
                ) : (
                  <>
                    <span>{t("leaveBalances.submitRequest", "Submit request")}</span>
                    {isRtl ? <FiArrowLeft className="w-3.5 h-3.5" /> : <FiArrowRight className="w-3.5 h-3.5" />}
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Right Column: Recent Requests (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="mb-5">
            <h2 className="text-base font-bold text-[#102a43]">
              {t("leaveBalances.recentRequests", "Recent requests")}
            </h2>
            <p className="text-xs text-[#829ab1] mt-0.5">
              {t("leaveBalances.recentSubtitle", "Your latest time-off activity.")}
            </p>
          </div>

          {requestsQuery.isError ? (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
              <p>
                {requestsQuery.error?.response?.data?.message ||
                  t("leaveBalances.requestHistoryError", "Could not load your leave requests.")}
              </p>
              <button
                type="button"
                onClick={() => requestsQuery.refetch()}
                disabled={requestsQuery.isFetching}
                className="mt-2 font-semibold underline disabled:opacity-50"
              >
                {t("leaveBalances.retry", "Retry")}
              </button>
            </div>
          ) : requestsQuery.isLoading ? (
            <p className="text-xs text-[#64748b]">
              {t("leaveBalances.loadingRequests", "Loading your leave requests...")}
            </p>
          ) : recentRequests.length === 0 ? (
            <p className="text-xs text-[#64748b]">
              {t("leaveBalances.noRecentRequests", "No recent requests recorded.")}
            </p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {recentRequests.map((request) => {
                  const status = String(request.status || "").toLowerCase();
                  const statusLabel =
                    status === "approved"
                      ? t("leaveBalances.statusApproved", "Approved")
                      : status === "rejected"
                        ? t("leaveBalances.statusRejected", "Rejected")
                        : status === "cancelled"
                          ? t("leaveBalances.statusCancelled", "Cancelled")
                          : t("leaveBalances.statusPending", "Pending");
                  const statusStyle =
                    status === "approved"
                      ? "bg-[#ecfdf5] text-[#059669]"
                      : status === "rejected" || status === "cancelled"
                        ? "bg-[#fef2f2] text-[#dc2626]"
                        : "bg-[#fefce8] text-[#d97706]";

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#f1f5f9] p-3 transition hover:bg-[#f8fafc]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#eff6ff] font-bold text-[#2563eb]">
                          <span className="text-sm leading-none">
                            {formatLeaveDay(request.start_date, lang)}
                          </span>
                          <span className="mt-0.5 text-[9px] uppercase leading-tight">
                            {formatLeaveMonth(request.start_date, lang)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-bold capitalize text-[#102a43]">
                            {getLocalizedLeaveTypeName(
                              request.leave_type?.name,
                              isRtl,
                              t,
                            )}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-[#64748b]">
                            {formatLeaveDateRange(
                              request.start_date,
                              request.end_date,
                              lang,
                            )}
                            {request.days != null &&
                              ` · ${formatLeaveNumber(request.days, lang)} ${t(
                                Number(request.days) === 1
                                  ? "leaveBalances.day"
                                  : "leaveBalances.daysPlural",
                                Number(request.days) === 1 ? "day" : "days",
                              )}`}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* 4. Calendar Modal */}
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCalendarOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#e2e8f0] overflow-hidden p-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9]">
                <div>
                  <h3 className="text-base font-bold text-[#102a43]">
                    {t("leaveBalances.calendarModalTitle", "Leave Calendar")}
                  </h3>
                  <p className="text-xs text-[#829ab1] mt-0.5">
                    {t("leaveBalances.calendarModalSubtitle", "Overview of your scheduled time off.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#102a43] transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Month Controls */}
              <div className="flex items-center justify-between py-4">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                  }
                  className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f8fafc] transition"
                >
                  {isRtl ? <FiChevronRight /> : <FiChevronLeft />}
                </button>

                <h4 className="text-sm font-bold text-[#102a43]">
                  {isRtl
                    ? `${monthNamesLongAr[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`
                    : `${monthNamesLongEn[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`}
                </h4>

                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                  }
                  className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f8fafc] transition"
                >
                  {isRtl ? <FiChevronLeft /> : <FiChevronRight />}
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">
                <span>{isRtl ? "أحد" : "Sun"}</span>
                <span>{isRtl ? "إثن" : "Mon"}</span>
                <span>{isRtl ? "ثلا" : "Tue"}</span>
                <span>{isRtl ? "أرب" : "Wed"}</span>
                <span>{isRtl ? "خمي" : "Thu"}</span>
                <span>{isRtl ? "جمع" : "Fri"}</span>
                <span>{isRtl ? "سبت" : "Sat"}</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  if (!item.isCurrentMonth) {
                    return <div key={`empty-${idx}`} className="h-9 rounded-lg" />;
                  }

                  const currentDayDate = new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth(),
                    item.day,
                  );
                  const holidayItem = (holidaysList || []).find((h) => {
                    if (!h.start_date) return false;
                    const start = new Date(h.start_date);
                    const end = h.end_date ? new Date(h.end_date) : start;
                    const cur = currentDayDate.getTime();
                    return (
                      cur >= new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() &&
                      cur <= new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
                    );
                  });

                  const dayKey = [
                    calendarMonth.getFullYear(),
                    String(calendarMonth.getMonth() + 1).padStart(2, "0"),
                    String(item.day).padStart(2, "0"),
                  ].join("-");
                  const leaveOnDay = recentRequests.find((request) => {
                    const status = String(request.status || "").toLowerCase();
                    return (
                      (status === "approved" || status === "pending") &&
                      request.start_date <= dayKey &&
                      request.end_date >= dayKey
                    );
                  });
                  const isApprovedLeave =
                    String(leaveOnDay?.status || "").toLowerCase() === "approved";

                  const cellTitle = holidayItem
                    ? leaveOnDay
                      ? `${holidayItem.name} · ${getLocalizedLeaveTypeName(
                          leaveOnDay.leave_type?.name,
                          isRtl,
                          t,
                        )} (${leaveOnDay.status})`
                      : holidayItem.name
                    : leaveOnDay
                    ? `${getLocalizedLeaveTypeName(
                        leaveOnDay.leave_type?.name,
                        isRtl,
                        t,
                      )} ${leaveOnDay.status}`
                    : undefined;

                  return (
                    <div
                      key={`day-${item.day}`}
                      title={cellTitle}
                      className={`relative flex h-9 flex-col items-center justify-center rounded-lg text-xs font-semibold transition ${
                        holidayItem
                          ? "bg-amber-50 text-amber-800 font-bold border border-amber-200"
                          : leaveOnDay && isApprovedLeave
                          ? "border border-[#a7f3d0] bg-[#ecfdf5] font-bold text-[#059669]"
                          : leaveOnDay
                          ? "border border-[#bfdbfe] bg-[#eff6ff] font-bold text-[#2563eb]"
                          : "text-[#334155] hover:bg-[#f8fafc]"
                      }`}
                    >
                      <span>{item.day}</span>
                      {holidayItem && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute bottom-1" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#f1f5f9]">
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748b]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-300" />
                    <span>Official Holiday</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0]" />
                    <span>{t("leaveBalances.statusApproved", "Approved")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#eff6ff] border border-[#bfdbfe]" />
                    <span>{t("leaveBalances.statusPending", "Pending")}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="px-4 py-2 bg-[#102a43] text-white text-xs font-semibold rounded-xl hover:bg-[#1a3857] transition"
                >
                  {t("leaveBalances.close", "Close")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLeaveNumber(value, lang) {
  return new Intl.NumberFormat(lang, {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getLocalizedLeaveTypeName(name, isArabic, t) {
  if (!name || !isArabic || /[\u0600-\u06ff]/i.test(name)) {
    return name || "—";
  }

  const normalizedName = name.trim().toLowerCase().replace(/[^a-z]/g, "");
  const translations = [
    { key: "annual", names: ["annual", "annualleave"] },
    { key: "casual", names: ["casual", "casualleave"] },
    { key: "sick", names: ["sick", "sickleave"] },
    { key: "unpaid", names: ["unpaid", "unpaidleave"] },
    { key: "emergency", names: ["emergency", "emergencyleave"] },
  ];
  const translation = translations.find(({ names }) =>
    names.some((knownName) => normalizedName.endsWith(knownName)),
  );

  if (!translation) {
    return name;
  }

  const translatedName = t(`leaveBalances.${translation.key}`);
  return normalizedName.startsWith("new")
    ? `${translatedName} ${t("leaveBalances.newTypeSuffix")}`
    : translatedName;
}

function parseLeaveDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLeaveDay(value, lang) {
  const date = parseLeaveDate(value);
  return date ? new Intl.NumberFormat(lang).format(date.getDate()) : "—";
}

function formatLeaveMonth(value, lang) {
  const date = parseLeaveDate(value);
  return date
    ? new Intl.DateTimeFormat(lang, { month: "short" }).format(date)
    : "";
}

function formatLeaveDateRange(start, end, lang) {
  const formatDate = (value) => {
    const date = parseLeaveDate(value);
    return date
      ? new Intl.DateTimeFormat(lang, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(date)
      : value || "—";
  };

  return start === end
    ? formatDate(start)
    : `${formatDate(start)} – ${formatDate(end)}`;
}

function getLeaveFormError(error, fallback) {
  const responseData = error?.response?.data;
  const apiMessage =
    responseData?.message || responseData?.data?.message || "";
  const validationErrors =
    responseData?.errors || responseData?.data?.errors || {};
  const fieldNames = {
    leave_type_id: "leave_type_id",
    start_date: "start_date",
    end_date: "end_date",
    reason: "reason",
    file: "attachment",
    attachment: "attachment",
  };
  const fieldErrors = {};
  const unmappedMessages = [];

  Object.entries(validationErrors).forEach(([field, value]) => {
    const messages = Array.isArray(value) ? value : [value];
    const text = messages
      .filter((message) => typeof message === "string")
      .join(" ");
    if (!text) return;

    const mappedField = fieldNames[field];
    if (mappedField) {
      fieldErrors[mappedField] = text;
    } else {
      unmappedMessages.push(text);
    }
  });

  if (/leave balance does not exist/i.test(apiMessage)) {
    fieldErrors.leave_type_id = "balanceMissing";
  }

  return {
    fieldErrors,
    message:
      unmappedMessages.join(" ") ||
      apiMessage ||
      (error?.response?.status
        ? `${fallback} (HTTP ${error.response.status})`
        : error?.message || fallback),
  };
}