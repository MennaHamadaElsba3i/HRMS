import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiCalendar } from "react-icons/fi";
import toast from "react-hot-toast";
import { useApproveLeaveRequest } from "../../hr/hooks/useLeaveRequests";
import { useManagerPendingLeaveRequests } from "../hooks/useTeamLeaveApprovals";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const TeamLeaveApprovals = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.toLowerCase().startsWith("ar") ? "ar" : "en";
  const requestsQuery = useManagerPendingLeaveRequests(lang);
  const approveMutation = useApproveLeaveRequest(lang);
  const requests = requestsQuery.data || [];

  const handleApprove = async (requestId) => {
    try {
      const response = await approveMutation.mutateAsync(requestId);
      toast.success(
        response?.message ||
          t("managerLeave.approveSuccess", "Leave request approved."),
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t("managerLeave.approveError", "Could not approve the leave request."),
      );
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="w-full space-y-6 pb-12 font-sans"
    >
      {/* ======================================
          1. BREADCRUMB + PAGE HEADER
      ====================================== */}
      <motion.div variants={fadeUp} transition={{ duration: 0.2, ease: "easeOut" }}>
        <p className="text-[11px] font-bold tracking-wider text-[#6b879f] uppercase">
          {t("managerLeave.breadcrumb", "MANAGER PORTAL / TEAM LEAVE APPROVALS")}
        </p>
        <h1 className="text-lg md:text-[21px] font-bold text-[#1e293b] tracking-tight mt-1">
          {t("managerLeave.title", "Team Leave Approvals")}
        </h1>
        <p className="text-sm text-[#829ab1] mt-1 font-normal">
          {t(
            "managerLeave.subtitle",
            "Keep your team aligned, supported, and moving forward."
          )}
        </p>
      </motion.div>

      {/* ======================================
          2. LEAVE APPROVALS TABLE CARD
      ====================================== */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="bg-[#f8fafc]/60 border-b border-[#f1f5f9] text-[11px] font-bold tracking-wider text-[#94a3b8]">
                <th className="py-4 px-6">{t("managerLeave.table.member", "MEMBER")}</th>
                <th className="py-4 px-6">{t("managerLeave.table.leaveType", "LEAVE TYPE")}</th>
                <th className="py-4 px-6">{t("managerLeave.table.dates", "DATES")}</th>
                <th className="py-4 px-6">{t("managerLeave.table.days", "DAYS")}</th>
                <th className="py-4 px-6">{t("managerLeave.table.reason", "REASON")}</th>
                <th className="py-4 px-6 text-right rtl:text-left">
                  <span className="sr-only">{t("common.actions", "Actions")}</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f1f5f9]">
              {requestsQuery.isLoading || requestsQuery.isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#64748b]">
                    {requestsQuery.isLoading
                      ? t("managerLeave.loading", "Loading leave requests...")
                      : requestsQuery.isError
                        ? requestsQuery.error?.response?.data?.message ||
                          t("managerLeave.loadError", "Could not load leave requests.")
                        : t("managerLeave.empty.title", "No leave requests found")}
                    {requestsQuery.isError && (
                      <button
                        type="button"
                        onClick={() => requestsQuery.refetch()}
                        disabled={requestsQuery.isFetching}
                        className="ml-2 text-xs font-semibold text-red-600 underline disabled:opacity-50"
                      >
                        {t("managerLeave.retry", "Retry")}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    className="transition hover:bg-[#f8fafc]/40"
                  >
                    <td className="px-6 py-5 text-sm font-semibold text-[#102a43]">
                      {request.user?.name ||
                        request.user?.full_name ||
                        request.employee?.name ||
                        "—"}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#475569]">
                      {request.leave_type?.name || "—"}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#475569]">
                      {formatLeaveDateRange(
                        request.start_date,
                        request.end_date,
                        lang,
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#475569]">
                      {request.days ?? "—"}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#475569]">
                      {request.reason || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-right rtl:text-left">
                      {request.status?.toLowerCase() === "pending" ? (
                        <button
                          type="button"
                          onClick={() => handleApprove(request.id)}
                          disabled={approveMutation.isPending}
                          className="text-xs font-semibold text-[#059669] transition hover:text-[#047857] disabled:opacity-50"
                        >
                          {t("managerLeave.actions.approve", "Approve")}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            request.status?.toLowerCase() === "approved"
                              ? "bg-[#ecfdf5] text-[#059669]"
                              : "bg-[#fef2f2] text-[#ef4444]"
                          }`}
                        >
                          {request.status?.toLowerCase() === "approved"
                            ? t("managerLeave.statusApproved", "Approved")
                            : t("managerLeave.statusDeclined", "Declined")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!requestsQuery.isLoading &&
          !requestsQuery.isError &&
          requests.length === 0 && (
          <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
              <FiCalendar size={18} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#102a43]">
              {t("managerLeave.empty.title", "No leave requests pending")}
            </h3>
            <p className="mt-1 text-xs text-[#94a3b8]">
              {t("managerLeave.empty.description", "All team leave requests have been reviewed.")}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TeamLeaveApprovals;

function formatLeaveDateRange(start, end, lang) {
  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formattedStart = formatDate(start);
  const formattedEnd = formatDate(end);
  return formattedStart === formattedEnd
    ? formattedStart
    : `${formattedStart} – ${formattedEnd}`;
}