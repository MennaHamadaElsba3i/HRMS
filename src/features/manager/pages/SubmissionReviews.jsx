import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiX,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiExternalLink,
  FiPaperclip,
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiCalendar,
  FiMessageSquare,
} from "react-icons/fi";
import {
  getSubmissionReviewQueue,
  getSubmissionDetails,
  approveSubmission,
  rejectSubmission,
  requestSubmissionChanges,
} from "../../../services/submissionsApi";

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const listStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const getFileUrl = (filePath) => {
  if (!filePath) return "#";
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("blob:")
  ) {
    return filePath;
  }
  const root = (
    import.meta.env.VITE_API_BASE_URL ||
    "https://workwise-production-3941.up.railway.app/api"
  ).replace(/\/api\/?$/, "");

  return `${root}/storage/${filePath.replace(/^\/+/, "")}`;
};

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDateTime = (iso, isRtl) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(isRtl ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_CONFIG = {
  "Pending Review": {
    labelEn: "Pending Review",
    labelAr: "بانتظار المراجعة",
    badge: "bg-[#fef3c7] text-[#b45309] border-[#fde68a]",
    icon: FiClock,
  },
  "Changes Requested": {
    labelEn: "Changes Requested",
    labelAr: "تعديلات مطلوبة",
    badge: "bg-[#fff7ed] text-[#c2410c] border-[#ffedd5]",
    icon: FiAlertCircle,
  },
  Approved: {
    labelEn: "Approved",
    labelAr: "معتمد",
    badge: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
    icon: FiCheckCircle,
  },
  Rejected: {
    labelEn: "Rejected",
    labelAr: "مرفوض",
    badge: "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]",
    icon: FiX,
  },
};

const SubmissionReviews = ({ role: propRole }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isRtl = i18n.language?.startsWith("ar");

  // Determine current portal role
  const portalRole = useMemo(() => {
    if (propRole) return propRole;
    if (location.pathname.startsWith("/admin")) return "Owner";
    if (location.pathname.startsWith("/hr")) return "HR";
    return "Manager";
  }, [propRole, location.pathname]);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [total, setTotal] = useState(0);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Highlight state
  const selectedQueueId = location.state?.submissionQueueId ?? null;
  const [highlightId, setHighlightId] = useState(selectedQueueId);

  // Action Modals
  const [changeModalSubmission, setChangeModalSubmission] = useState(null);
  const [rejectModalSubmission, setRejectModalSubmission] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Details loading cache
  const [loadingDetailsId, setLoadingDetailsId] = useState(null);

  const fetchQueue = useCallback(
    async (currentPage = 1, showRefreshSpinner = false) => {
      if (showRefreshSpinner) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
        const response = await getSubmissionReviewQueue({
          page: currentPage,
          per_page: perPage,
          lang,
        });

        const queueData = response?.data;
        const items = Array.isArray(queueData)
          ? queueData
          : Array.isArray(queueData?.data)
            ? queueData.data
            : [];

        // Normalize submission records
        const mapped = items.map((sub, idx) => ({
          ...sub,
          id: sub.id || idx + 1,
          expanded: sub.id === selectedQueueId || idx === 0,
        }));

        setSubmissions(mapped);
        if (queueData?.total !== undefined) {
          setTotal(queueData.total);
          setPage(queueData.current_page || currentPage);
          setPerPage(queueData.per_page || perPage);
        } else {
          setTotal(mapped.length);
        }
      } catch (err) {
        console.error("Error fetching submission review queue:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            t("managerSubmissions.fetchError", "Failed to load review queue"),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [i18n.language, perPage, selectedQueueId, t],
  );

  useEffect(() => {
    fetchQueue(page);
  }, [fetchQueue, page]);

  // Scroll to highlighted submission if navigated from dashboard
  useEffect(() => {
    if (!selectedQueueId) return;
    const timer = setTimeout(() => {
      document
        .getElementById(`submission-${selectedQueueId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
    const clearTimer = setTimeout(() => setHighlightId(null), 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [selectedQueueId]);

  // Fetch full submission details when expanding if not loaded yet
  const handleToggleExpand = async (submission) => {
    const nextExpanded = !submission.expanded;
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submission.id ? { ...s, expanded: nextExpanded } : s,
      ),
    );

    // If expanding and detailed relations aren't present yet, fetch them
    if (nextExpanded && (!submission.attachments || !submission.task)) {
      setLoadingDetailsId(submission.id);
      try {
        const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
        const detailsRes = await getSubmissionDetails(submission.id, { lang });
        if (detailsRes?.data) {
          setSubmissions((prev) =>
            prev.map((s) =>
              s.id === submission.id
                ? {
                    ...s,
                    ...detailsRes.data,
                    expanded: true,
                  }
                : s,
            ),
          );
        }
      } catch (err) {
        console.warn("Could not load full submission details:", err);
      } finally {
        setLoadingDetailsId(null);
      }
    }
  };

  // Toast notifications helper
  const showToast = (message, isError = false) => {
    toast.custom(
      (toastItem) => (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={
            toastItem.visible
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 12, scale: 0.96 }
          }
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${
            isError ? "bg-[#b91c1c]" : "bg-[#102a43]"
          }`}
        >
          {isError ? (
            <FiAlertCircle className="w-4 h-4 text-[#fca5a5]" />
          ) : (
            <FiCheckCircle className="w-4 h-4 text-[#86efac]" />
          )}
          <span>{message}</span>
        </motion.div>
      ),
      { position: isRtl ? "bottom-left" : "bottom-right" },
    );
  };

  // APPROVE SUBMISSION
  const handleApprove = async (id) => {
    setSubmittingAction(true);
    try {
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
      await approveSubmission(id, { lang });

      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "Approved" } : s)),
      );

      try {
        const sub = submissions.find((s) => s.id === id);
        const taskId = sub?.task_id || sub?.task?.id;
        if (taskId) {
          const cache = JSON.parse(
            localStorage.getItem("wisework_task_submissions_cache") || "{}",
          );
          if (cache[taskId]) {
            cache[taskId] = { ...cache[taskId], status: "Approved" };
            localStorage.setItem(
              "wisework_task_submissions_cache",
              JSON.stringify(cache),
            );
          }
        }
      } catch (e) {}

      showToast(
        t(
          "managerSubmissions.toastApproved",
          "Submission approved and task completed",
        ),
      );
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          t("managerSubmissions.errorApprove", "Failed to approve submission"),
        true,
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  // REQUEST CHANGES
  const handleOpenChangeModal = (submission) => {
    setChangeModalSubmission(submission);
    setFeedbackText("");
  };

  const handleCloseChangeModal = () => {
    if (submittingAction) return;
    setChangeModalSubmission(null);
    setFeedbackText("");
  };

  const handleSendChangeRequest = async () => {
    if (!changeModalSubmission || submittingAction) return;
    if (!feedbackText.trim()) {
      showToast(
        t(
          "managerSubmissions.feedbackRequired",
          "Please enter feedback explaining the changes needed",
        ),
        true,
      );
      return;
    }

    setSubmittingAction(true);
    try {
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
      await requestSubmissionChanges(
        changeModalSubmission.id,
        { feedback: feedbackText.trim() },
        { lang },
      );

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === changeModalSubmission.id
            ? {
                ...s,
                status: "Changes Requested",
                reviews: [
                  ...(s.reviews || []),
                  {
                    id: Date.now(),
                    feedback: feedbackText.trim(),
                    status: "Changes Requested",
                    created_at: new Date().toISOString(),
                  },
                ],
              }
            : s,
        ),
      );

      try {
        const taskId =
          changeModalSubmission?.task_id || changeModalSubmission?.task?.id;
        if (taskId) {
          const cache = JSON.parse(
            localStorage.getItem("wisework_task_submissions_cache") || "{}",
          );
          if (cache[taskId]) {
            cache[taskId] = { ...cache[taskId], status: "Changes Requested" };
            localStorage.setItem(
              "wisework_task_submissions_cache",
              JSON.stringify(cache),
            );
          }
        }
      } catch (e) {}

      handleCloseChangeModal();
      showToast(
        t("managerSubmissions.toastChangeRequested", "Change request sent"),
      );
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          t(
            "managerSubmissions.errorChangeRequest",
            "Failed to request changes",
          ),
        true,
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  // REJECT SUBMISSION
  const handleOpenRejectModal = (submission) => {
    setRejectModalSubmission(submission);
    setFeedbackText("");
  };

  const handleCloseRejectModal = () => {
    if (submittingAction) return;
    setRejectModalSubmission(null);
    setFeedbackText("");
  };

  const handleSendReject = async () => {
    if (!rejectModalSubmission || submittingAction) return;
    if (!feedbackText.trim()) {
      showToast(
        t(
          "managerSubmissions.feedbackRequired",
          "Please enter feedback explaining the reason for rejection",
        ),
        true,
      );
      return;
    }

    setSubmittingAction(true);
    try {
      const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
      await rejectSubmission(
        rejectModalSubmission.id,
        { feedback: feedbackText.trim() },
        { lang },
      );

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === rejectModalSubmission.id
            ? {
                ...s,
                status: "Rejected",
                reviews: [
                  ...(s.reviews || []),
                  {
                    id: Date.now(),
                    feedback: feedbackText.trim(),
                    status: "Rejected",
                    created_at: new Date().toISOString(),
                  },
                ],
              }
            : s,
        ),
      );

      try {
        const taskId =
          rejectModalSubmission?.task_id || rejectModalSubmission?.task?.id;
        if (taskId) {
          const cache = JSON.parse(
            localStorage.getItem("wisework_task_submissions_cache") || "{}",
          );
          if (cache[taskId]) {
            cache[taskId] = { ...cache[taskId], status: "Rejected" };
            localStorage.setItem(
              "wisework_task_submissions_cache",
              JSON.stringify(cache),
            );
          }
        }
      } catch (e) {}

      handleCloseRejectModal();
      showToast(t("managerSubmissions.toastRejected", "Submission rejected"));
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          t("managerSubmissions.errorReject", "Failed to reject submission"),
        true,
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Status filter
      if (statusFilter !== "all") {
        const normStatus = (sub.status || "").toLowerCase().replace(/\s+/g, "");
        const filterVal = statusFilter.toLowerCase().replace(/\s+/g, "");
        if (normStatus !== filterVal) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (sub.task?.title || sub.title || "").toLowerCase();
        const user = (sub.user?.name || sub.submitter || "").toLowerCase();
        const note = (sub.note || "").toLowerCase();
        return title.includes(q) || user.includes(q) || note.includes(q);
      }

      return true;
    });
  }, [submissions, statusFilter, searchQuery]);

  // Role breadcrumb label
  const breadcrumbText = useMemo(() => {
    if (portalRole === "Owner") {
      return isRtl
        ? "بوابة المالك / مراجعة التسليمات"
        : "OWNER PORTAL / SUBMISSION REVIEWS";
    }
    if (portalRole === "HR") {
      return isRtl
        ? "بوابة الموارد البشرية / مراجعة التسليمات"
        : "HR PORTAL / SUBMISSION REVIEWS";
    }
    return t(
      "managerSubmissions.breadcrumb",
      "MANAGER PORTAL / SUBMISSION REVIEWS",
    );
  }, [portalRole, isRtl, t]);

  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div
      className="w-full space-y-6 pb-12 font-sans"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#6b879f] uppercase">
            {breadcrumbText}
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-[#102a43] tracking-tight mt-1">
            {t("managerSubmissions.title", "Submission Reviews")}
          </h1>
          <p className="text-sm text-[#829ab1] mt-1 font-normal">
            {t(
              "managerSubmissions.subtitle",
              "Keep your team aligned, supported, and moving forward.",
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => fetchQueue(page, true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-3.5 py-2 text-xs font-semibold text-[#102a43] hover:bg-[#f8fafc] transition shadow-sm disabled:opacity-50"
            title="Refresh list"
          >
            <FiRefreshCw
              className={`w-3.5 h-3.5 text-[#64748b] ${
                refreshing ? "animate-spin text-[#2563eb]" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {refreshing
                ? t("common.refreshing", "Refreshing...")
                : t("common.refresh", "Refresh")}
            </span>
          </motion.button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e2e8f0] shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              "managerSubmissions.searchPlaceholder",
              "Search by task, member, or notes...",
            )}
            className="w-full h-10 ps-9 pe-3 text-xs text-[#102a43] placeholder:text-[#94a3b8] rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#486581] focus:ring-1 focus:ring-[#486581] transition bg-[#f8fafc]"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: isRtl ? "الكل" : "All" },
            { id: "pendingreview", label: isRtl ? "معلقة" : "Pending" },
            {
              id: "changesrequested",
              label: isRtl ? "مطلوب تعديلات" : "Changes Req.",
            },
            { id: "approved", label: isRtl ? "معتمدة" : "Approved" },
            { id: "rejected", label: isRtl ? "مرفوضة" : "Rejected" },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? "bg-[#102a43] text-white shadow-sm"
                    : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#102a43]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Error Banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#dc2626]">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchQueue(page)}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-[#dc2626] text-white hover:bg-[#b91c1c] transition"
          >
            {t("common.retry", "Retry")}
          </button>
        </div>
      )}

      {/* 4. Submissions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-[#e2e8f0] animate-pulse space-y-4"
            >
              <div className="h-5 w-28 bg-[#f1f5f9] rounded-full" />
              <div className="h-6 w-1/2 bg-[#f1f5f9] rounded-lg" />
              <div className="h-4 w-1/3 bg-[#f1f5f9] rounded" />
              <div className="h-16 w-full bg-[#f8fafc] rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredSubmissions.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={listStagger}
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredSubmissions.map((submission) => {
              const statusCfg =
                STATUS_CONFIG[submission.status] ||
                STATUS_CONFIG["Pending Review"];
              const StatusIcon = statusCfg.icon;

              const taskTitle =
                submission.task?.title ||
                submission.title ||
                `Task #${submission.task_id}`;
              const submitterName =
                submission.user?.name ||
                submission.submitter ||
                `Member #${submission.user_id}`;
              const submittedDate = formatDateTime(
                submission.submitted_at || submission.created_at,
                isRtl,
              );

              const attachments = submission.attachments || [];
              const reviews = submission.reviews || [];
              const isDetailsLoading = loadingDetailsId === submission.id;

              return (
                <motion.div
                  key={submission.id}
                  id={`submission-${submission.id}`}
                  variants={cardVariants}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm transition-all duration-300 ${
                    highlightId === submission.id
                      ? "ring-2 ring-[#486581]/40 border-[#486581]"
                      : "hover:border-[#cbd5e1]"
                  }`}
                >
                  {/* Top Bar: Status + Quick Expand Toggle */}
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${statusCfg.badge}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>
                        {isRtl ? statusCfg.labelAr : statusCfg.labelEn}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleExpand(submission)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748b] hover:text-[#102a43] transition p-1"
                    >
                      <span>
                        {submission.expanded
                          ? isRtl
                            ? "طي"
                            : "Collapse"
                          : isRtl
                            ? "عرض التفاصيل"
                            : "View Details"}
                      </span>
                      {submission.expanded ? (
                        <FiChevronUp className="w-4 h-4" />
                      ) : (
                        <FiChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Submission Main Info */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      {/* Task Title */}
                      <h3 className="text-base md:text-lg font-bold text-[#102a43] tracking-tight">
                        {taskTitle}
                      </h3>

                      {/* Meta: Submitter + Date */}
                      <div className="flex items-center gap-2 text-xs text-[#64748b] mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-medium text-[#334155]">
                          <FiUser className="w-3.5 h-3.5 text-[#94a3b8]" />
                          <span>{submitterName}</span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-[#64748b]">
                          <FiCalendar className="w-3.5 h-3.5 text-[#94a3b8]" />
                          <span>{submittedDate}</span>
                        </span>
                        {attachments.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[#2563eb] font-semibold">
                              <FiPaperclip className="w-3.5 h-3.5" />
                              <span>
                                {attachments.length}{" "}
                                {isRtl ? "مرفقات" : "attachment(s)"}
                              </span>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Submitter Note */}
                      {submission.note && (
                        <div className="mt-3.5 p-3.5 rounded-xl bg-[#f8fafc] border border-[#f1f5f9]">
                          <p className="text-xs text-[#334155] leading-relaxed">
                            <span className="font-bold text-[#102a43] me-1">
                              {t(
                                "managerSubmissions.submitterNotes",
                                "Submitter notes:",
                              )}
                            </span>
                            {submission.note}
                          </p>
                        </div>
                      )}

                      {/* Loading Details Skeleton if expanding */}
                      {isDetailsLoading && (
                        <div className="mt-3 py-2 text-xs text-[#64748b] flex items-center gap-2">
                          <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>
                            {isRtl
                              ? "جارٍ تحميل المرفقات وسجل المراجعة..."
                              : "Loading attachments & review log..."}
                          </span>
                        </div>
                      )}

                      {/* Expanded Section: Attachments & Previous Reviews */}
                      {submission.expanded && (
                        <div className="mt-4 space-y-4">
                          {/* Attached Files List */}
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
                              {isRtl
                                ? "الملفات المرفقة"
                                : "Attached Deliverables"}
                            </p>
                            {attachments.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {attachments.map((file) => {
                                  const url = getFileUrl(file.file_path);
                                  return (
                                    <a
                                      key={file.id || file.file_name}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={file.file_name}
                                      className="inline-flex items-center gap-2 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#334155] transition border border-[#e2e8f0]"
                                    >
                                      <FiFileText className="w-3.5 h-3.5 text-[#2563eb]" />
                                      <span className="truncate max-w-[180px]">
                                        {file.file_name}
                                      </span>
                                      {file.file_size && (
                                        <span className="text-[10px] text-[#64748b]">
                                          ({formatFileSize(file.file_size)})
                                        </span>
                                      )}
                                      <FiExternalLink className="w-3 h-3 text-[#94a3b8]" />
                                    </a>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-[#94a3b8] italic">
                                {isRtl
                                  ? "لم يتم إرفاق ملفات مع هذا التسليم"
                                  : "No files attached with this submission"}
                              </p>
                            )}
                          </div>

                          {/* Previous Reviews Log */}
                          {reviews.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
                                {isRtl
                                  ? "سجل المراجعات والتعليقات"
                                  : "Review History"}
                              </p>
                              <div className="space-y-2">
                                {reviews.map((rev, rIdx) => (
                                  <div
                                    key={rev.id || rIdx}
                                    className="p-3 rounded-xl bg-[#fafafa] border border-[#f1f5f9] text-xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                                      <span className="font-semibold text-[#102a43]">
                                        {rev.status || "Review"}
                                      </span>
                                      <span>
                                        {formatDateTime(rev.created_at, isRtl)}
                                      </span>
                                    </div>
                                    <p className="text-[#475569] leading-relaxed">
                                      {rev.feedback}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-col items-stretch gap-2 shrink-0 md:w-48 self-start">
                      {submission.status === "Approved" ? (
                        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] text-xs font-bold">
                          <FiCheckCircle className="w-4 h-4" />
                          <span>{isRtl ? "تم الاعتماد" : "Approved"}</span>
                        </div>
                      ) : (
                        <>
                          {/* Approve & Complete Button */}
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => handleApprove(submission.id)}
                            disabled={submittingAction}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#15803d] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#166534] transition shadow-sm disabled:opacity-50"
                          >
                            <FiCheckCircle className="w-4 h-4" />
                            <span>
                              {t(
                                "managerSubmissions.approveComplete",
                                "Approve & Complete",
                              )}
                            </span>
                          </motion.button>

                          {/* Request Changes & Reject Buttons */}
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => handleOpenChangeModal(submission)}
                              disabled={submittingAction}
                              className="flex-1 rounded-xl bg-[#d97706] px-3 py-2 text-xs font-semibold text-white hover:bg-[#b45309] transition shadow-sm text-center disabled:opacity-50"
                            >
                              {t(
                                "managerSubmissions.requestChanges",
                                "Request Changes",
                              )}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => handleOpenRejectModal(submission)}
                              disabled={submittingAction}
                              className="rounded-xl bg-[#dc2626] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#b91c1c] transition shadow-sm disabled:opacity-50"
                            >
                              {t("managerSubmissions.reject", "Reject")}
                            </motion.button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Pagination Controls */}
          {total > perPage && (
            <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0]">
              <span className="text-xs text-[#64748b]">
                {isRtl
                  ? `عرض صفحة ${page} من ${totalPages} (إجمالي ${total})`
                  : `Page ${page} of ${totalPages} (Total ${total})`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#d9e2ec] bg-white text-[#102a43] hover:bg-[#f8fafc] disabled:opacity-40 transition"
                >
                  {isRtl ? "السابق" : "Previous"}
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#d9e2ec] bg-white text-[#102a43] hover:bg-[#f8fafc] disabled:opacity-40 transition"
                >
                  {isRtl ? "التالي" : "Next"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e2e8f0] bg-white p-12 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] mb-3">
            <FiCheckCircle className="w-6 h-6 text-[#15803d]" />
          </div>
          <p className="text-base font-bold text-[#102a43]">
            {t("managerSubmissions.noSubmissions", "No submissions found")}
          </p>
          <p className="text-xs text-[#829ab1] mt-1 max-w-sm">
            {t(
              "managerSubmissions.noSubmissionsDesc",
              "There are currently no deliverables in this queue awaiting review.",
            )}
          </p>
        </motion.div>
      )}

      {/* 5. Request Changes Modal (Feedback Body) */}
      <AnimatePresence>
        {changeModalSubmission !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#d97706]">
                  <FiAlertCircle className="w-5 h-5" />
                  <h3 className="text-base font-bold text-[#102a43]">
                    {t("managerSubmissions.requestChanges", "Request Changes")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseChangeModal}
                  disabled={submittingAction}
                  className="text-[#94a3b8] hover:text-[#102a43] transition p-1 rounded-lg"
                  aria-label="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-[#fffbeb] border border-[#fef3c7] rounded-xl text-xs text-[#92400e] mb-4">
                <p className="font-semibold">
                  {changeModalSubmission.task?.title ||
                    changeModalSubmission.title ||
                    `Task #${changeModalSubmission.task_id}`}
                </p>
                <p className="text-[11px] mt-0.5 text-[#b45309]">
                  {isRtl
                    ? "سيتم إشعار الموظف بالتعديلات المطلوبة لإعادة التسليم."
                    : "The employee will receive your feedback and can resubmit the deliverable."}
                </p>
              </div>

              <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                {isRtl ? "ملاحظات التعديل المطلوبة *" : "Required Feedback *"}
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t(
                  "managerSubmissions.changePlaceholder",
                  "Explain what needs to change in detail...",
                )}
                rows={4}
                required
                className="w-full rounded-xl border border-[#d9e2ec] px-3.5 py-2.5 text-xs text-[#102a43] placeholder:text-[#9fb3c8] focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 resize-none"
              />

              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={handleCloseChangeModal}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl border border-[#d9e2ec] text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleSendChangeRequest}
                  disabled={submittingAction || !feedbackText.trim()}
                  className="flex-1 rounded-xl bg-[#d97706] py-2.5 text-xs font-semibold text-white hover:bg-[#b45309] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingAction
                    ? isRtl
                      ? "جارٍ الإرسال..."
                      : "Sending..."
                    : t(
                        "managerSubmissions.sendChangeRequest",
                        "Send Change Request",
                      )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Reject Modal (Feedback Body) */}
      <AnimatePresence>
        {rejectModalSubmission !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#dc2626]">
                  <FiAlertCircle className="w-5 h-5" />
                  <h3 className="text-base font-bold text-[#102a43]">
                    {t("managerSubmissions.reject", "Reject Submission")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseRejectModal}
                  disabled={submittingAction}
                  className="text-[#94a3b8] hover:text-[#102a43] transition p-1 rounded-lg"
                  aria-label="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-xs text-[#991b1b] mb-4">
                <p className="font-semibold">
                  {rejectModalSubmission.task?.title ||
                    rejectModalSubmission.title ||
                    `Task #${rejectModalSubmission.task_id}`}
                </p>
                <p className="text-[11px] mt-0.5 text-[#b91c1c]">
                  {isRtl
                    ? "يرجى توضيح سبب رفض التسليم."
                    : "Please explain the reason for rejecting this deliverable."}
                </p>
              </div>

              <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                {isRtl ? "سبب الرفض *" : "Rejection Reason *"}
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t(
                  "managerSubmissions.rejectPlaceholder",
                  "Provide clear feedback on why this submission was rejected...",
                )}
                rows={4}
                required
                className="w-full rounded-xl border border-[#d9e2ec] px-3.5 py-2.5 text-xs text-[#102a43] placeholder:text-[#9fb3c8] focus:outline-none focus:ring-2 focus:ring-[#dc2626]/30 resize-none"
              />

              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={handleCloseRejectModal}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl border border-[#d9e2ec] text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleSendReject}
                  disabled={submittingAction || !feedbackText.trim()}
                  className="flex-1 rounded-xl bg-[#dc2626] py-2.5 text-xs font-semibold text-white hover:bg-[#b91c1c] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingAction
                    ? isRtl
                      ? "جارٍ الرفض..."
                      : "Rejecting..."
                    : t("managerSubmissions.reject", "Reject")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubmissionReviews;
