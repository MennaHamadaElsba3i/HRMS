import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    FiBookOpen,
    FiRefreshCw,
    FiLoader,
    FiAlertCircle,
    FiArrowRight,
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
const PoliciesList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const lang = i18n.language === "ar" ? "ar" : "en";
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/policies?lang=${lang}`, {
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
    }, [lang]);
    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);
    const handleAskAboutPolicy = (policy) => {
        navigate("/employee/ai-assistant", {
            state: {
                openPolicyAssistant: true,
                policyDefaultTitle: policy.title,
            },
        });
    };
    return (
        <div className="w-full space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold tracking-wider text-[#3f7d5a] uppercase mb-1">
                        {t("companyPolicies.eyebrow", "Resources")}
                    </p>
                    <h1 className="text-2xl md:text-[28px] font-bold text-[#1e293b] tracking-tight">
                        {t("companyPolicies.title", "Company policies")}
                    </h1>
                    <p className="text-sm text-[#64748b] mt-1 font-normal">
                        {t("companyPolicies.subtitle", "Everything you need to work with confidence.")}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchPolicies}
                    aria-label={t("companyPolicies.refresh", "Refresh")}
                    className="flex size-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#3f7d5a] hover:border-[#3f7d5a]/40 transition cursor-pointer"
                >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>
            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#e2e8f0]/80 bg-white py-12 text-sm text-[#64748b]">
                    <FiLoader className="w-4 h-4 animate-spin" />
                    {t("companyPolicies.loading", "Loading policies...")}
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
                        {t("companyPolicies.emptyTitle", "No policies found")}
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
                                            {policy.title}
                                        </h3>
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGES[policy.status] || STATUS_BADGES.draft
                                                }`}
                                        >
                                            {policy.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#64748b] mt-0.5">
                                        {policy.description}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleAskAboutPolicy(policy)}
                                aria-label={t("companyPolicies.askAboutPolicy", "Ask about this policy")}
                                className="shrink-0 text-[#94a3b8] hover:text-[#3f7d5a] transition-colors cursor-pointer"
                            >
                                <FiArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default PoliciesList;
