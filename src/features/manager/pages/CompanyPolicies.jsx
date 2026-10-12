import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    FiBookOpen,
    FiRefreshCw,
    FiLoader,
    FiAlertCircle,
} from "react-icons/fi";
const API_BASE_URL = "https://workwise-production-3941.up.railway.app/api";
const getAuthHeaders = () => {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("accessToken");
    return {
        Accept: "application/json",
        "Accept-Language": localStorage.getItem("i18nextLng") || "en",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};
const STATUS_BADGES = {
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    archived: "bg-slate-100 text-slate-500 border-slate-200",
};
const STATUS_OPTIONS = ["draft", "active", "archived"];
const CompanyPolicies = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language === "ar" ? "ar" : "en";
    const translatePolicy = (policy, field) => {
        const suffix = policy.title === "[TEST] Remote Work Policy" ? "remoteWork" : policy.title === "[TEST] Code of Conduct Policy" ? "codeOfConduct" : null;
        return suffix ? t(`managerPolicies.samples.${suffix}.${field}`, policy[field]) : policy[field];
    };
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const params = new URLSearchParams({ lang });
            if (statusFilter) params.set("status", statusFilter);
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
    }, [lang, statusFilter]);
    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);
    const selectClass =
        "rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-[#3f7d5a] focus:ring-2 focus:ring-[#3f7d5a]/20 cursor-pointer";
    return (
        <div className="w-full space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold tracking-wider text-[#3f7d5a] uppercase mb-1">
                        {t("managerPolicies.eyebrow", "Manager / Policies")}
                    </p>
                    <h1 className="text-2xl md:text-[28px] font-bold text-[#1e293b] tracking-tight">
                        {t("managerPolicies.title", "Company policies")}
                    </h1>
                    <p className="text-sm text-[#64748b] mt-1 font-normal">
                        {t("managerPolicies.subtitle", "Browse your company policies.")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={selectClass}
                        aria-label={t("managerPolicies.filterByStatus", "Filter by status")}
                    >
                        <option value="">{t("managerPolicies.allStatuses", "All statuses")}</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{t(`managerPolicies.status.${s}`, s)}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={fetchPolicies}
                        aria-label={t("managerPolicies.refresh", "Refresh")}
                        className="flex size-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#3f7d5a] hover:border-[#3f7d5a]/40 transition cursor-pointer"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>
            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#e2e8f0]/80 bg-white py-12 text-sm text-[#64748b]">
                    <FiLoader className="w-4 h-4 animate-spin" />
                    {t("managerPolicies.loading", "Loading policies...")}
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
                        {t("managerPolicies.emptyTitle", "No policies found")}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {policies.map((policy) => (
                        <div
                            key={policy.id}
                            className="flex items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-[#e2e8f0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#eef4f0] text-[#3f7d5a]">
                                    <FiBookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-[#1e293b]">
                                            {translatePolicy(policy, "title")}
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
                                        {translatePolicy(policy, "description")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default CompanyPolicies;
