import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiDownload,
  FiCheck,
  FiFileText,
  FiX,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import {
  useApproveLeaveRequest,
  useHrPendingLeaveRequests,
  useRejectLeaveRequest,
} from "../hooks/useLeaveRequests";
import { useOwnerPendingLeaveRequests } from "../../admin/hooks/useOwnerLeaveRequests";

const categoryStyle =
  "bg-[#f5f3ff] text-[#7c3aed]";

const pageVariants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: {
      duration: 0.18,
    },
  },
};

const LeaveRequests = ({ role = "hr" }) => {
  const { t, i18n } = useTranslation();

  const isArabic = i18n.language?.toLowerCase().startsWith("ar");
  const lang = isArabic ? "ar" : "en";

  const hrRequestsQuery = useHrPendingLeaveRequests(lang, role === "hr");
  const ownerRequestsQuery = useOwnerPendingLeaveRequests(
    lang,
    role === "owner",
  );
  const requestsQuery =
    role === "owner" ? ownerRequestsQuery : hrRequestsQuery;
  const approveMutation = useApproveLeaveRequest(lang);
  const rejectMutation = useRejectLeaveRequest(lang);
  const requests = useMemo(
    () =>
      (requestsQuery.data || []).map((request) =>
        mapLeaveRequest(request, isArabic, t),
      ),
    [requestsQuery.data, isArabic, t],
  );

  const [activeAction, setActiveAction] = useState(null);

  const [rejectModal, setRejectModal] = useState({
    open: false,
    request: null,
  });

  const [rejectNote, setRejectNote] = useState("");
  const [rejectNoteError, setRejectNoteError] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = isArabic ? "ar" : "en";
  }, [isArabic]);

  const translatedRequests = requests;

  const showMessage = (type, text) => {
    setMessage({
      type,
      text,
    });

    setTimeout(() => {
      setMessage(null);
    }, 2500);
  };

  const handleApprove = async (request) => {
    setActiveAction(`approve-${request.id}`);

    try {
      const response = await approveMutation.mutateAsync(request.id);
      setActiveAction(null);
      showMessage("success", response?.message || t("leaveRequests.approveSuccess"));
    } catch (error) {
      setActiveAction(null);
      showMessage(
        "error",
        getLeaveRequestError(error, isArabic
          ? "تعذر الموافقة على طلب الإجازة."
          : "Failed to approve the leave request."),
      );
    }
  };

  const handleRejectClick = (request) => {
    setRejectModal({
      open: true,
      request,
    });

    setRejectNote("");
    setRejectNoteError("");
  };

  const closeRejectModal = () => {
    setRejectModal({
      open: false,
      request: null,
    });

    setRejectNote("");
    setRejectNoteError("");
  };

  const handleConfirmReject = async () => {
    const trimmedNote = rejectNote.trim();

    if (!rejectModal.request) {
      return;
    }

    if (trimmedNote.length < 3 || trimmedNote.length > 2000) {
      setRejectNoteError(
        isArabic
          ? "يجب أن يكون سبب الرفض بين 3 و2000 حرف."
          : "The rejection note must be between 3 and 2000 characters.",
      );
      return;
    }

    const request = rejectModal.request;

    setActiveAction(`reject-${request.id}`);

    try {
      const response = await rejectMutation.mutateAsync({
        id: request.id,
        rejectionReason: trimmedNote,
      });
      setActiveAction(null);
      closeRejectModal();
      showMessage(
        "rejected",
        response?.message || t("leaveRequests.rejectSuccess"),
      );
    } catch (error) {
      setActiveAction(null);
      showMessage(
        "error",
        getLeaveRequestError(error, isArabic
          ? "تعذر رفض طلب الإجازة."
          : "Failed to reject the leave request."),
      );
    }
  };

  const handleExport = () => {
    const headers = [
      t("leaveRequests.table.employee"),
      t("leaveRequests.table.roleDepartment"),
      t("leaveRequests.table.category"),
      t("leaveRequests.table.duration"),
      t("leaveRequests.table.days"),
      t("leaveRequests.table.reason"),
    ];

    const rows = translatedRequests.map((request) => [
      request.name,
      `${request.role} - ${request.department}`,
      request.category,
      request.dates,
      request.days,
      request.reason,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leave-requests.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showMessage(
      "success",
      isArabic
        ? "تم تصدير قائمة الطلبات بنجاح"
        : "Leave requests exported successfully.",
    );
  };

  const pendingCount =
    requestsQuery.isLoading || requestsQuery.isError ? "—" : requests.length;

  return (
    <motion.div
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full min-w-0 space-y-6 overflow-x-hidden"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* ==================== Toast ==================== */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{
              opacity: 0,
              y: -15,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.97,
            }}
            transition={{
              duration: 0.2,
            }}
            className={`fixed right-5 top-5 z-[100] flex max-w-[360px] items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-xl ${
              message.type === "success"
                ? "border-[#d1fae5] text-[#047857]"
                : "border-[#fecaca] text-[#dc2626]"
            }`}
          >
            {message.type === "success" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf5]">
                <FiCheck size={17} />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fef2f2]">
                <FiAlertCircle size={17} />
              </div>
            )}

            <span className="text-xs font-semibold sm:text-sm">
              {message.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== Header ==================== */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b879f]">
            {isArabic
              ? "الموارد البشرية / طلبات الإجازات"
              : "HR Portal / Leave Requests"}
          </p>

          <h1 className="mt-1 text-lg font-bold tracking-tight text-[#1e293b] md:text-[21px]">
            {t("leaveRequests.title")}
          </h1>

          <p className="mt-1 text-sm font-normal text-[#64748b]">
            {t("leaveRequests.subtitle")}
          </p>
        </div>

        <motion.button
          type="button"
          onClick={handleExport}
          whileHover={{
            y: -2,
            scale: 1.02,
          }}
          whileTap={{
            scale: 0.97,
          }}
          transition={{
            duration: 0.2,
          }}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
        >
          <FiDownload className="h-4 w-4" />

          <span>{t("leaveRequests.export")}</span>
        </motion.button>
      </motion.div>

      {/* ==================== Statistics ==================== */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* Pending */}
        <motion.div
          variants={itemVariants}
          whileHover={{
            y: -4,
            transition: {
              duration: 0.2,
              ease: "easeOut",
            },
          }}
          className="flex flex-col justify-between rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
              {isArabic ? "طلبات قيد المراجعة" : "Pending Reviews"}
            </p>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7ed] text-[#f97316]">
              <FiClock className="h-[18px] w-[18px]" />
            </div>
          </div>

          <div className="mt-2">
            <p className="text-[27px] font-bold tracking-tight text-[#0f172a]">
              {pendingCount}
            </p>

            <p className="mt-1 text-xs font-normal text-[#64748b]">
              {isArabic ? "في انتظار المراجعة" : "Waiting for review"}
            </p>
          </div>
        </motion.div>

      </motion.div>

      {/* ==================== Results ==================== */}
      <motion.div variants={itemVariants}>
        <p className="text-xs font-normal text-[#64748b]">
          {isArabic
            ? `${pendingCount} طلبات قيد المراجعة`
            : `${pendingCount} pending requests`}
        </p>
      </motion.div>

      {/* ==================== Main Card ==================== */}
      <motion.div
        variants={itemVariants}
        className="w-full overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-[#1e293b] sm:text-lg">
              {t("leaveRequests.queue")}
            </h2>

            <p className="mt-1 text-xs text-[#64748b]">
              {isArabic
                ? "مراجعة وإدارة طلبات الإجازات"
                : "Review and manage employee leave requests."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {requestsQuery.isError && (
              <button
                type="button"
                onClick={() => requestsQuery.refetch()}
                disabled={requestsQuery.isFetching}
                className="text-xs font-semibold text-red-600 underline disabled:opacity-50"
              >
                {isArabic ? "إعادة المحاولة" : "Retry"}
              </button>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
              <FiFileText className="h-[18px] w-[18px]" />
            </div>
          </div>
        </div>

        {requestsQuery.isError && (
          <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            {requestsQuery.error?.response?.data?.message ||
              (isArabic
                ? "تعذر تحميل طلبات الإجازات."
                : "Failed to load leave requests.")}
          </p>
        )}

        {/* ==================== Desktop Table ==================== */}
        <div className="hidden w-full lg:block">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[17%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[13%]" />
              <col className="w-[21%]" />
            </colgroup>

            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] rtl:text-right sm:text-[11px]">
                  {t("leaveRequests.table.employee")}
                </th>

                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] rtl:text-right sm:text-[11px]">
                  {t("leaveRequests.table.roleDepartment")}
                </th>

                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] rtl:text-right sm:text-[11px]">
                  {t("leaveRequests.table.category")}
                </th>

                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] rtl:text-right sm:text-[11px]">
                  {t("leaveRequests.table.duration")}
                </th>

                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] rtl:text-right sm:text-[11px]">
                  {t("leaveRequests.table.days")}
                </th>

                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] rtl:text-right sm:text-[11px]">
                  {t("leaveRequests.table.reason")}
                </th>

                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] rtl:text-right sm:text-[11px]">
                  {t("leaveRequests.table.actions")}
                </th>
              </tr>
            </thead>

            <tbody>
              {requestsQuery.isLoading || requestsQuery.isError || requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8fafc] text-[#94a3b8]">
                        <FiCheck size={22} />
                      </div>

                      <p className="text-sm font-bold text-[#1e293b] sm:text-base">
                        {requestsQuery.isLoading
                          ? isArabic
                            ? "جاري تحميل الطلبات..."
                            : "Loading requests..."
                          : requestsQuery.isError
                            ? isArabic
                              ? "تعذر تحميل الطلبات"
                              : "Could not load requests"
                            : isArabic
                          ? "لا توجد طلبات معلقة"
                          : "No pending requests"}
                      </p>

                      <p className="mt-1 text-xs text-[#64748b] sm:text-sm">
                        {!requestsQuery.isLoading &&
                          !requestsQuery.isError &&
                          (isArabic
                          ? "تمت مراجعة جميع طلبات الإجازات."
                          : "All leave requests have been reviewed.")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                translatedRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-t border-[#f1f5f9] transition-colors hover:bg-[#fafbfc]"
                  >
                    {/* Employee */}
                    <td className="px-5 py-5 align-middle">
                      <span className="block truncate text-sm font-bold text-[#1e293b]">
                        {request.name}
                      </span>
                    </td>

                    {/* Role / Department */}
                    <td className="px-4 py-5 align-middle">
                      <div className="truncate text-xs font-medium text-[#475569] sm:text-sm">
                        {request.role}
                      </div>

                      <div className="mt-1 truncate text-xs text-[#94a3b8]">
                        {request.department}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-5 align-middle">
                      <span
                        className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1.5 sm:text-xs ${categoryStyle}`}
                      >
                        {request.category}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-5 align-middle">
                      <span className="block truncate text-xs text-[#64748b] sm:text-sm">
                        {request.dates}
                      </span>
                    </td>

                    {/* Requested days */}
                    <td className="px-4 py-5 align-middle">
                      <span className="block truncate text-xs font-medium text-[#475569] sm:text-sm">
                        {request.days}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-5 align-middle">
                      <span className="block truncate text-xs text-[#475569]" title={request.reason}>
                        {request.reason || "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-5 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={activeAction !== null}
                          onClick={() => handleApprove(request)}
                          className="flex h-9 min-w-[88px] items-center justify-center gap-1.5 rounded-lg bg-[#ecfdf5] px-3 text-xs font-semibold text-[#15803d] transition hover:bg-[#dcfce7] hover:shadow-sm active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {activeAction === `approve-${request.id}` ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#15803d] border-t-transparent" />
                          ) : (
                            <>
                              <FiCheck size={14} />

                              {t("leaveRequests.approve")}
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={activeAction !== null}
                          onClick={() => handleRejectClick(request)}
                          className="flex h-9 items-center justify-center rounded-lg bg-[#fef2f2] px-3 text-xs font-semibold text-[#dc2626] transition hover:bg-[#fee2e2] hover:shadow-sm active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t("leaveRequests.reject")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ==================== Mobile ==================== */}
        <div className="divide-y divide-[#f1f5f9] lg:hidden">
          {requestsQuery.isLoading || requestsQuery.isError || requests.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f8fafc] text-[#94a3b8]">
                <FiCheck size={22} />
              </div>

              <p className="mt-3 text-sm font-bold text-[#1e293b]">
                {requestsQuery.isLoading
                  ? isArabic
                    ? "جاري تحميل الطلبات..."
                    : "Loading requests..."
                  : requestsQuery.isError
                    ? isArabic
                      ? "تعذر تحميل الطلبات"
                      : "Could not load requests"
                    : isArabic
                      ? "لا توجد طلبات معلقة"
                      : "No pending requests"}
              </p>

              {!requestsQuery.isLoading && !requestsQuery.isError && (
                <p className="mt-1 text-xs text-[#64748b]">
                  {isArabic
                    ? "تمت مراجعة جميع طلبات الإجازات."
                    : "All leave requests have been reviewed."}
                </p>
              )}
            </div>
          ) : (
            translatedRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="p-5 transition-colors hover:bg-[#fafbfc]"
              >
                {/* Employee */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#1e293b] sm:text-base">
                      {request.name}
                    </h3>

                    <p className="mt-1 truncate text-xs text-[#475569] sm:text-sm">
                      {request.role}
                    </p>

                    <p className="mt-1 truncate text-xs text-[#94a3b8]">
                      {request.department}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-bold sm:px-3 sm:text-xs ${categoryStyle}`}
                  >
                    {request.category}
                  </span>
                </div>

                {/* Info */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#f8fafc] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8]">
                      {t("leaveRequests.table.duration")}
                    </p>

                    <p className="mt-1 text-xs text-[#475569]">
                      {request.dates}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#f8fafc] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8]">
                      {t("leaveRequests.table.days")}
                    </p>

                    <p className="mt-1 text-xs text-[#475569]">
                      {request.days}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <p className="mt-4 flex items-start gap-2 text-xs text-[#475569] sm:text-sm">
                  <FiFileText className="mt-0.5 shrink-0" size={15} />
                  <span>{request.reason || "—"}</span>
                </p>

                {/* Buttons */}
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    disabled={activeAction !== null}
                    onClick={() => handleApprove(request)}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#ecfdf5] px-4 text-xs font-semibold text-[#15803d] transition hover:bg-[#dcfce7] active:scale-[0.98] disabled:opacity-50"
                  >
                    {activeAction === `approve-${request.id}` ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#15803d] border-t-transparent" />
                    ) : (
                      <>
                        <FiCheck size={14} />

                        {t("leaveRequests.approve")}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={activeAction !== null}
                    onClick={() => handleRejectClick(request)}
                    className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#fef2f2] px-4 text-xs font-semibold text-[#dc2626] transition hover:bg-[#fee2e2] active:scale-[0.98] disabled:opacity-50"
                  >
                    {t("leaveRequests.reject")}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* ==================== Reject Modal ==================== */}
      <AnimatePresence>
        {rejectModal.open && rejectModal.request && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeRejectModal();
              }
            }}
          >
            {/* Overlay */}
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[2px]"
            />

            {/* Modal */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-leave-title"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-[#f1f5f9] px-6 py-5">
                <div>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#fef2f2] text-[#ef4444]">
                    <FiX className="h-[18px] w-[18px]" />
                  </div>

                  <h3
                    id="reject-leave-title"
                    className="text-base font-bold text-[#1e293b]"
                  >
                    {isArabic ? "رفض طلب الإجازة" : "Reject Leave Request"}
                  </h3>

                  <p className="mt-1 text-xs text-[#64748b] sm:text-sm">
                    {rejectModal.request.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition hover:bg-[#f8fafc] hover:text-[#475569]"
                  aria-label={isArabic ? "إغلاق" : "Close"}
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                    {isArabic ? "سبب الرفض" : "Rejection note"}
                  </label>

                  <textarea
                    value={rejectNote}
                    onChange={(event) => {
                      setRejectNote(event.target.value);
                      setRejectNoteError("");
                    }}
                    rows={4}
                    maxLength={2000}
                    placeholder={
                      isArabic
                        ? "اكتبي سبب رفض الطلب..."
                        : "Add a note for the employee..."
                    }
                    className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-xs text-[#334155] outline-none transition placeholder:text-[#94a3b8] focus:border-[#94a3b8] focus:ring-2 focus:ring-[#f1f5f9] sm:text-sm"
                  />
                  {rejectNoteError && (
                    <p className="mt-1.5 text-xs text-red-600" role="alert">
                      {rejectNoteError}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeRejectModal}
                    className="flex-1 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-xs font-semibold text-[#64748b] transition hover:bg-[#f8fafc] active:scale-[0.98] sm:text-sm"
                  >
                    {t("common.cancel")}
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    disabled={activeAction !== null}
                    className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#b91c1c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                  >
                    {activeAction === `reject-${rejectModal.request.id}` ? (
                      <span className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      t("leaveRequests.reject")
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LeaveRequests;

function mapLeaveRequest(request, isArabic, t) {
  const employee = request.user || request.employee || {};
  const startDate = formatLeaveDate(request.start_date, isArabic);
  const endDate = formatLeaveDate(request.end_date, isArabic);

  return {
    ...request,
    name: employee.name || employee.full_name || "—",
    role: employee.job_title || employee.role_label || employee.role || "—",
    department:
      employee.department?.name || employee.department_name || "—",
    category:
      getLocalizedLeaveTypeName(request.leave_type?.name, isArabic, t) ||
      (isArabic ? "إجازة" : "Leave"),
    dates: startDate === endDate ? startDate : `${startDate} – ${endDate}`,
    days:
      request.days == null
        ? "—"
        : new Intl.NumberFormat(isArabic ? "ar" : "en").format(request.days),
    reason: getLocalizedLeaveReason(request.reason, isArabic, t),
  };
}

function getLocalizedLeaveTypeName(name, isArabic, t) {
  if (!name || !isArabic || /[\u0600-\u06ff]/i.test(name)) {
    return name || "";
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

function getLocalizedLeaveReason(reason, isArabic, t) {
  if (!reason || !isArabic) {
    return reason || "";
  }

  const normalizedReason = reason.trim().toLowerCase().replace(/[^a-z]/g, "");
  const translations = [
    { key: "familyTrip", values: ["familytrip"] },
    { key: "medicalAppointment", values: ["medicalappointment"] },
    { key: "personalTime", values: ["personaltime"] },
    { key: "personalAppointment", values: ["personalappointment"] },
  ];
  const translation = translations.find(({ values }) =>
    values.includes(normalizedReason),
  );

  return translation
    ? t(`managerLeave.reasons.${translation.key}`)
    : reason;
}

function formatLeaveDate(value, isArabic) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(isArabic ? "ar" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getLeaveRequestError(error, fallback) {
  const responseData = error?.response?.data;
  const validationErrors =
    responseData?.errors || responseData?.data?.errors || {};
  const messages = Object.values(validationErrors)
    .flat(Infinity)
    .filter((value) => typeof value === "string");

  if (messages.length > 0) {
    return messages.join(" ");
  }

  return (
    responseData?.message ||
    responseData?.data?.message ||
    (error?.response?.status
      ? `${fallback} (HTTP ${error.response.status})`
      : error?.message || fallback)
  );
}
