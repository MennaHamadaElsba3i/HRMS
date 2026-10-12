import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    FiBookOpen,
    FiPlus,
    FiRefreshCw,
    FiLoader,
    FiCheckCircle,
    FiAlertCircle,
    FiX,
    FiGitBranch,
    FiChevronDown,
    FiCheck,
    FiClock,
} from "react-icons/fi";
const API_BASE_URL = "/api";
const getAuthHeaders = () => {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("accessToken");
    return {
        Accept: "application/json",
        "Accept-Language": localStorage.getItem("i18nextLng") || "en",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};
const STATUS_BADGES = {
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    archived: "bg-slate-100 text-slate-500 border-slate-200",
};
const ACTION_BADGES = {
    version_activated: "bg-emerald-50 text-emerald-700 border-emerald-200",
    version_created: "bg-blue-50 text-blue-700 border-blue-200",
    policy_created: "bg-indigo-50 text-indigo-700 border-indigo-200",
    version_archived: "bg-slate-100 text-slate-600 border-slate-200",
};
const STATUS_OPTIONS = ["draft", "active", "archived"];
const EMPTY_FORM = { title: "", description: "", content: "" };
const ManagePolicies = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language === "ar" ? "ar" : "en";
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [versionStatusFilter, setVersionStatusFilter] = useState("");
    // Create policy modal
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [feedback, setFeedback] = useState(null);
    // New version modal
    const [versionPolicy, setVersionPolicy] = useState(null);
    const [versionContent, setVersionContent] = useState("");
    const [versionErrors, setVersionErrors] = useState({});
    const [versionCreating, setVersionCreating] = useState(false);
    // Versions expand + activate
    const [expandedPolicyId, setExpandedPolicyId] = useState(null);
    const [activatingVersionId, setActivatingVersionId] = useState(null);
    // Audit history modal - GET /policies/{id}/audits
    const [auditPolicy, setAuditPolicy] = useState(null);
    const [audits, setAudits] = useState([]);
    const [auditsLoading, setAuditsLoading] = useState(false);
    const [auditsError, setAuditsError] = useState(null);
    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const params = new URLSearchParams({ lang });
            if (statusFilter) params.set("status", statusFilter);
            if (versionStatusFilter) params.set("version_status", versionStatusFilter);
            const res = await fetch(`${API_BASE_URL}/policies?${params.toString()}`, {
                method: "GET",
                headers: getAuthHeaders(),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.message || "Failed to load policies");
            setPolicies(json?.data?.data ?? json?.data ?? []);
        } catch (err) {
            setListError(err.message || "Failed to load policies");
        } finally {
            setLoading(false);
        }
    }, [lang, statusFilter, versionStatusFilter]);
    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);
    const anyModalOpen = showModal || versionPolicy !== null || auditPolicy !== null;
    useEffect(() => {
        if (!anyModalOpen) return;
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                setShowModal(false);
                setVersionPolicy(null);
                setAuditPolicy(null);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [anyModalOpen]);
    useEffect(() => {
        document.body.style.overflow = anyModalOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [anyModalOpen]);
    // ===== Audit history fetch - GET /policies/{policy}/audits =====
    const openAuditModal = async (policy) => {
        setAuditPolicy(policy);
        setAudits([]);
        setAuditsError(null);
        setAuditsLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/policies/${policy.id}/audits?lang=${lang}`,
                {
                    method: "GET",
                    headers: getAuthHeaders(),
                },
            );
            const json = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setAuditsError("Unauthenticated. Please login again.");
                return;
            }
            if (res.status === 404) {
                setAuditsError(json?.message || "Policy not found.");
                return;
            }
            if (!res.ok) {
                setAuditsError(
                    json?.message || "An error occurred processing the request.",
                );
                return;
            }
            setAudits(json?.data ?? []);
        } catch (err) {
            setAuditsError(err.message || "Network error");
        } finally {
            setAuditsLoading(false);
        }
    };
    const closeAuditModal = () => {
        setAuditPolicy(null);
        setAudits([]);
        setAuditsError(null);
    };
    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };
    const openModal = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
        setShowModal(true);
    };
    const closeModal = () => {
        if (creating) return;
        setShowModal(false);
    };
    const handleCreatePolicy = async (e) => {
        e.preventDefault();
        setCreating(true);
        setFormErrors({});
        setFeedback(null);
        try {
            const res = await fetch(`${API_BASE_URL}/policies?lang=${lang}`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    content: form.content,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setFeedback({ type: "error", message: "Unauthenticated. Please login again." });
                setShowModal(false);
                return;
            }
            if (res.status === 422) {
                setFormErrors(json?.errors || {});
                return;
            }
            if (!res.ok) {
                setFeedback({
                    type: "error",
                    message: json?.message || "An error occurred processing the request.",
                });
                setShowModal(false);
                return;
            }
            setFeedback({ type: "success", message: json?.message || "Policy created successfully." });
            setShowModal(false);
            setForm(EMPTY_FORM);
            fetchPolicies();
        } catch (err) {
            setFeedback({ type: "error", message: err.message || "Network error" });
            setShowModal(false);
        } finally {
            setCreating(false);
        }
    };
    // ===== New version handlers =====
    const openVersionModal = (policy) => {
        setVersionContent("");
        setVersionErrors({});
        setVersionPolicy(policy);
    };
    const closeVersionModal = () => {
        if (versionCreating) return;
        setVersionPolicy(null);
    };
    const handleCreateVersion = async (e) => {
        e.preventDefault();
        if (!versionPolicy) return;
        setVersionCreating(true);
        setVersionErrors({});
        setFeedback(null);
        try {
            const res = await fetch(
                `${API_BASE_URL}/policies/${versionPolicy.id}/versions?lang=${lang}`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ content: versionContent }),
                },
            );
            const json = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setFeedback({ type: "error", message: "Unauthenticated. Please login again." });
                setVersionPolicy(null);
                return;
            }
            if (res.status === 404) {
                setFeedback({ type: "error", message: json?.message || "Policy not found." });
                setVersionPolicy(null);
                return;
            }
            if (res.status === 422) {
                setVersionErrors(json?.errors || {});
                return;
            }
            if (!res.ok) {
                setFeedback({
                    type: "error",
                    message: json?.message || "An error occurred processing the request.",
                });
                setVersionPolicy(null);
                return;
            }
            setFeedback({
                type: "success",
                message: json?.message || "Policy version created successfully.",
            });
            setVersionPolicy(null);
            setVersionContent("");
            fetchPolicies();
        } catch (err) {
            setFeedback({ type: "error", message: err.message || "Network error" });
            setVersionPolicy(null);
        } finally {
            setVersionCreating(false);
        }
    };
    // ===== Activate version =====
    const handleActivateVersion = async (policyId, versionId) => {
        setActivatingVersionId(versionId);
        setFeedback(null);
        try {
            const res = await fetch(
                `${API_BASE_URL}/policies/${policyId}/versions/${versionId}/activate?lang=${lang}`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                },
            );
            const json = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setFeedback({ type: "error", message: "Unauthenticated. Please login again." });
                return;
            }
            if (res.status === 404) {
                setFeedback({ type: "error", message: json?.message || "Policy or policy version not found." });
                return;
            }
            if (res.status === 422) {
                setFeedback({ type: "error", message: json?.message || "The policy version does not belong to this policy." });
                return;
            }
            if (!res.ok) {
                setFeedback({
                    type: "error",
                    message: json?.message || "An error occurred processing the request.",
                });
                return;
            }
            setFeedback({
                type: "success",
                message: "Policy version activated successfully.",
            });
            fetchPolicies();
        } catch (err) {
            setFeedback({ type: "error", message: err.message || "Network error" });
        } finally {
            setActivatingVersionId(null);
        }
    };
    const inputClass = (field) =>
        `w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none transition focus:border-[#3f7d5a] focus:ring-2 focus:ring-[#3f7d5a]/20 ${
            formErrors[field] ? "border-red-300" : "border-[#e2e8f0]"
        }`;
    const versionInputClass =
        `w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none transition focus:border-[#3f7d5a] focus:ring-2 focus:ring-[#3f7d5a]/20 ${
            versionErrors.content ? "border-red-300" : "border-[#e2e8f0]"
        }`;
    const selectClass =
        "rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-[#3f7d5a] focus:ring-2 focus:ring-[#3f7d5a]/20 cursor-pointer";
    return (
        <div className="w-full space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold tracking-wider text-[#3f7d5a] uppercase mb-1">
                        {t("hrPolicies.eyebrow", "HR / Policies")}
                    </p>
                    <h1 className="text-2xl md:text-[28px] font-bold text-[#1e293b] tracking-tight">
                        {t("hrPolicies.title", "Company policies")}
                    </h1>
                    <p className="text-sm text-[#64748b] mt-1 font-normal">
                        {t("hrPolicies.subtitle", "Create and manage your company policies.")}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={selectClass}
                        aria-label="Filter by status"
                    >
                        <option value="">{t("hrPolicies.allStatuses", "All statuses")}</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select
                        value={versionStatusFilter}
                        onChange={(e) => setVersionStatusFilter(e.target.value)}
                        className={selectClass}
                        aria-label="Filter by version status"
                    >
                        <option value="">{t("hrPolicies.allVersions", "All versions")}</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={fetchPolicies}
                        aria-label={t("hrPolicies.refresh", "Refresh")}
                        className="flex size-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#3f7d5a] hover:border-[#3f7d5a]/40 transition cursor-pointer"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        type="button"
                        onClick={openModal}
                        className="flex items-center gap-2 rounded-xl bg-[#3f7d5a] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#356a4c] transition cursor-pointer"
                    >
                        <FiPlus className="w-4 h-4" />
                        {t("hrPolicies.createPolicy", "Create policy")}
                    </button>
                </div>
            </div>
            {feedback && (
                <div
                    className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
                        feedback.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-red-50 border-red-200 text-red-600"
                    }`}
                >
                    {feedback.type === "success" ? (
                        <FiCheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                        <FiAlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="flex-1">{feedback.message}</span>
                    <button
                        type="button"
                        onClick={() => setFeedback(null)}
                        className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>
            )}
            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#e2e8f0]/80 bg-white py-12 text-sm text-[#64748b]">
                    <FiLoader className="w-4 h-4 animate-spin" />
                    {t("hrPolicies.loading", "Loading policies...")}
                </div>
            ) : listError ? (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    <FiAlertCircle className="w-4 h-4 shrink-0" />
                    {listError}
                </div>
            ) : policies.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#e2e8f0] bg-white py-12 text-center">
                    <FiBookOpen className="w-6 h-6 text-[#94a3b8]" />
                    <p className="text-sm font-bold text-[#1e293b]">
                        {t("hrPolicies.emptyTitle", "No policies yet")}
                    </p>
                    <p className="text-xs text-[#64748b]">
                        {t("hrPolicies.emptyDesc", "Create your first policy to get started.")}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {policies.map((policy) => {
                        const isExpanded = expandedPolicyId === policy.id;
                        return (
                            <div
                                key={policy.id}
                                className="bg-white rounded-2xl border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#eef4f0] text-[#3f7d5a]">
                                            <FiBookOpen className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-[#1e293b]">
                                                    {policy.title}
                                                </h3>
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                        STATUS_BADGES[policy.status] || STATUS_BADGES.draft
                                                    }`}
                                                >
                                                    {policy.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#64748b] mt-0.5">
                                                {policy.description}
                                            </p>
                                            <p className="text-[11px] text-[#94a3b8] mt-1.5">
                                                {t("hrPolicies.versions", "Versions")}: {policy.versions?.length ?? 0}
                                                {policy.created_at
                                                    ? ` · ${new Date(policy.created_at).toLocaleDateString(
                                                          lang === "ar" ? "ar-EG" : "en-US",
                                                      )}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openAuditModal(policy)}
                                            className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] px-3 py-2 text-xs font-bold text-[#64748b] hover:text-[#1e293b] transition cursor-pointer"
                                        >
                                            <FiClock className="w-3.5 h-3.5" />
                                            {t("hrPolicies.history", "History")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedPolicyId(isExpanded ? null : policy.id)
                                            }
                                            className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] px-3 py-2 text-xs font-bold text-[#64748b] hover:text-[#1e293b] transition cursor-pointer"
                                        >
                                            <FiGitBranch className="w-3.5 h-3.5" />
                                            {t("hrPolicies.versions", "Versions")}
                                            <FiChevronDown
                                                className={`w-3.5 h-3.5 transition-transform ${
                                                    isExpanded ? "rotate-180" : ""
                                                }`}
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openVersionModal(policy)}
                                            className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] px-3.5 py-2 text-xs font-bold text-[#3f7d5a] hover:bg-[#eef4f0] hover:border-[#3f7d5a]/40 transition cursor-pointer"
                                        >
                                            <FiGitBranch className="w-3.5 h-3.5" />
                                            {t("hrPolicies.newVersion", "New version")}
                                        </button>
                                    </div>
                                </div>
                                {/* Versions List */}
                                {isExpanded && (
                                    <div className="border-t border-[#e2e8f0] bg-[#fafbfc] rounded-b-2xl px-5 py-4 space-y-2.5">
                                        {(policy.versions ?? []).length === 0 ? (
                                            <p className="text-xs text-[#94a3b8] py-2 text-center">
                                                {t("hrPolicies.noVersions", "No versions yet")}
                                            </p>
                                        ) : (
                                            policy.versions.map((v) => (
                                                <div
                                                    key={v.id}
                                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="shrink-0 flex size-7 items-center justify-center rounded-lg bg-[#eef4f0] text-[11px] font-bold text-[#3f7d5a]">
                                                            v{v.version}
                                                        </span>
                                                        <span
                                                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                                STATUS_BADGES[v.status] || STATUS_BADGES.draft
                                                            }`}
                                                        >
                                                            {v.status}
                                                        </span>
                                                        <p className="text-xs text-[#64748b] truncate max-w-[320px]">
                                                            {v.content}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-3">
                                                        {v.effective_date && (
                                                            <span className="text-[11px] text-[#94a3b8]">
                                                                {new Date(v.effective_date).toLocaleDateString(
                                                                    lang === "ar" ? "ar-EG" : "en-US",
                                                                )}
                                                            </span>
                                                        )}
                                                        {v.status === "active" ? (
                                                            <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700">
                                                                <FiCheck className="w-3.5 h-3.5" />
                                                                {t("hrPolicies.currentVersion", "Current")}
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                disabled={activatingVersionId === v.id}
                                                                onClick={() =>
                                                                    handleActivateVersion(policy.id, v.id)
                                                                }
                                                                className="flex items-center gap-1.5 rounded-xl bg-[#3f7d5a] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#356a4c] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                                            >
                                                                {activatingVersionId === v.id ? (
                                                                    <FiLoader className="w-3.5 h-3.5 animate-spin" />
                                                                ) : (
                                                                    <FiCheck className="w-3.5 h-3.5" />
                                                                )}
                                                                {activatingVersionId === v.id
                                                                    ? t("hrPolicies.activating", "Activating...")
                                                                    : t("hrPolicies.activate", "Activate")}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {/* ==================== Create Policy Modal ==================== */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        onClick={closeModal}
                        className="absolute inset-0 bg-[rgba(16,42,67,0.55)] backdrop-blur-[2px]"
                    />
                    <div className="relative w-full max-w-lg max-h-[90dvh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-[#eef4f0] text-[#3f7d5a]">
                                    <FiBookOpen className="w-4 h-4" />
                                </div>
                                <h2 className="text-base font-bold text-[#1e293b]">
                                    {t("hrPolicies.modalTitle", "Create new policy")}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={creating}
                                aria-label={t("hrPolicies.close", "Close")}
                                className="flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition disabled:opacity-40 cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreatePolicy} className="flex flex-col min-h-0 flex-1">
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#1e293b]">
                                        {t("hrPolicies.formTitle", "Title")} *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={handleChange("title")}
                                        placeholder={t("hrPolicies.formTitlePlaceholder", "e.g. Employee Attendance Policy")}
                                        className={inputClass("title")}
                                    />
                                    {formErrors.title && (
                                        <p className="text-xs text-red-500">{formErrors.title[0]}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#1e293b]">
                                        {t("hrPolicies.formDescription", "Description")} *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={handleChange("description")}
                                        placeholder={t("hrPolicies.formDescriptionPlaceholder", "Short description of the policy")}
                                        className={inputClass("description")}
                                    />
                                    {formErrors.description && (
                                        <p className="text-xs text-red-500">{formErrors.description[0]}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#1e293b]">
                                        {t("hrPolicies.formContent", "Content")} *
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={form.content}
                                        onChange={handleChange("content")}
                                        placeholder={t("hrPolicies.formContentPlaceholder", "Write the full policy content here...")}
                                        className={`${inputClass("content")} resize-y`}
                                    />
                                    {formErrors.content && (
                                        <p className="text-xs text-red-500">{formErrors.content[0]}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e2e8f0] bg-[#fafbfc] shrink-0">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={creating}
                                    className="rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm font-bold text-[#64748b] hover:text-[#1e293b] transition disabled:opacity-50 cursor-pointer"
                                >
                                    {t("hrPolicies.cancel", "Cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex items-center gap-2 rounded-xl bg-[#3f7d5a] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#356a4c] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {creating && <FiLoader className="w-4 h-4 animate-spin" />}
                                    {creating
                                        ? t("hrPolicies.saving", "Saving...")
                                        : t("hrPolicies.save", "Create policy")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ==================== New Version Modal ==================== */}
            {versionPolicy && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        onClick={closeVersionModal}
                        className="absolute inset-0 bg-[rgba(16,42,67,0.55)] backdrop-blur-[2px]"
                    />
                    <div className="relative w-full max-w-lg max-h-[90dvh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-[#eef4f0] text-[#3f7d5a]">
                                    <FiGitBranch className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#1e293b]">
                                        {t("hrPolicies.newVersionTitle", "New policy version")}
                                    </h2>
                                    <p className="text-xs text-[#64748b] truncate max-w-[280px]">
                                        {versionPolicy.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeVersionModal}
                                disabled={versionCreating}
                                aria-label={t("hrPolicies.close", "Close")}
                                className="flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition disabled:opacity-40 cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateVersion} className="flex flex-col min-h-0 flex-1">
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#1e293b]">
                                        {t("hrPolicies.versionContent", "New content")} *
                                    </label>
                                    <textarea
                                        rows={8}
                                        value={versionContent}
                                        onChange={(e) => {
                                            setVersionContent(e.target.value);
                                            setVersionErrors((prev) => ({ ...prev, content: undefined }));
                                        }}
                                        placeholder={t("hrPolicies.versionContentPlaceholder", "Write the updated policy content here...")}
                                        className={`${versionInputClass} resize-y`}
                                        autoFocus
                                    />
                                    {versionErrors.content && (
                                        <p className="text-xs text-red-500">{versionErrors.content[0]}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e2e8f0] bg-[#fafbfc] shrink-0">
                                <button
                                    type="button"
                                    onClick={closeVersionModal}
                                    disabled={versionCreating}
                                    className="rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm font-bold text-[#64748b] hover:text-[#1e293b] transition disabled:opacity-50 cursor-pointer"
                                >
                                    {t("hrPolicies.cancel", "Cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={versionCreating}
                                    className="flex items-center gap-2 rounded-xl bg-[#3f7d5a] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#356a4c] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {versionCreating && <FiLoader className="w-4 h-4 animate-spin" />}
                                    {versionCreating
                                        ? t("hrPolicies.saving", "Saving...")
                                        : t("hrPolicies.createVersion", "Create version")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ==================== Audit History Modal - GET /policies/{id}/audits ==================== */}
            {auditPolicy && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        onClick={closeAuditModal}
                        className="absolute inset-0 bg-[rgba(16,42,67,0.55)] backdrop-blur-[2px]"
                    />
                    <div className="relative w-full max-w-xl max-h-[85dvh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-[#eef4f0] text-[#3f7d5a]">
                                    <FiClock className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#1e293b]">
                                        {t("hrPolicies.auditTitle", "Audit history")}
                                    </h2>
                                    <p className="text-xs text-[#64748b] truncate max-w-[300px]">
                                        {auditPolicy.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeAuditModal}
                                aria-label={t("hrPolicies.close", "Close")}
                                className="flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {auditsLoading ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#64748b]">
                                    <FiLoader className="w-4 h-4 animate-spin" />
                                    {t("hrPolicies.loadingAudits", "Loading history...")}
                                </div>
                            ) : auditsError ? (
                                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                                    <FiAlertCircle className="w-4 h-4 shrink-0" />
                                    {auditsError}
                                </div>
                            ) : audits.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-center">
                                    <FiClock className="w-6 h-6 text-[#94a3b8]" />
                                    <p className="text-sm font-bold text-[#1e293b]">
                                        {t("hrPolicies.noAudits", "No audit history yet")}
                                    </p>
                                    <p className="text-xs text-[#64748b]">
                                        {t("hrPolicies.noAuditsDesc", "Actions on this policy will appear here.")}
                                    </p>
                                </div>
                            ) : (
                                <div className="relative space-y-4">
                                    {/* Timeline line */}
                                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#e2e8f0]" />
                                    {audits.map((a) => (
                                        <div key={a.id} className="relative flex gap-4">
                                            {/* Timeline dot */}
                                            <span className="relative z-10 mt-1.5 size-[15px] shrink-0 rounded-full border-2 border-[#3f7d5a] bg-white" />
                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                            ACTION_BADGES[a.action] ||
                                                            "bg-slate-100 text-slate-600 border-slate-200"
                                                        }`}
                                                    >
                                                        {a.action?.replace(/_/g, " ")}
                                                    </span>
                                                    {(a.old_status || a.new_status) && (
                                                        <span className="text-[11px] font-bold text-[#64748b]">
                                                            {a.old_status} → {a.new_status}
                                                        </span>
                                                    )}
                                                </div>
                                                {a.description && (
                                                    <p className="text-xs text-[#1e293b]">
                                                        {a.description}
                                                    </p>
                                                )}
                                                <p className="text-[11px] text-[#94a3b8]">
                                                    {a.performer?.name || `#${a.performed_by}`}
                                                    {a.created_at
                                                        ? ` · ${new Date(a.created_at).toLocaleString(
                                                              lang === "ar" ? "ar-EG" : "en-US",
                                                          )}`
                                                        : ""}
                                                    {a.policy_version
                                                        ? ` · v${a.policy_version.version}`
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ManagePolicies;

