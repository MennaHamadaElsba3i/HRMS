import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { LuPenLine, LuPlus, LuX, LuTrash2, LuInfo, LuTriangleAlert, LuStar } from "react-icons/lu";
import {
    useLandingSections,
    useLandingFeatures,
    useUpdateLandingSection,
    useCreateLandingFeature,
    useUpdateLandingFeature,
    useDeleteLandingFeature,
    useLandingRoles,
    useCreateLandingRole,
    useUpdateLandingRole,
    useDeleteLandingRole,
    useLandingPlans,
    useCreateLandingPlan,
    useUpdateLandingPlan,
    useDeleteLandingPlan,
} from "../hooks";

// =========================
// Section schemas (من الـ response الفعلي)
// =========================
const T = "text";
const A = "textarea";
const SECTION_SCHEMAS = {
    hero: [
        { key: "badge", type: T },
        { key: "title", type: T },
        { key: "description", type: A },
        { key: "primary_button", type: T },
        { key: "secondary_button", type: T },
        { key: "trust_text", type: T },
        { key: "ticker_tags", type: "strings" },
    ],
    about: [
        { key: "badge", type: T },
        { key: "title", type: T },
        { key: "description", type: A },
        {
            key: "stats",
            type: "objects",
            fields: [
                { key: "label", type: T },
                { key: "value", type: T },
                { key: "subtext", type: T },
            ],
        },
        {
            key: "highlights",
            type: "objects",
            fields: [
                { key: "title", type: T },
                { key: "description", type: A },
            ],
        },
    ],
    ai_insights: [
        { key: "badge", type: T },
        { key: "title", type: T },
        { key: "description", type: A },
        { key: "button_text", type: T },
    ],
    // content هنا مصفوفة مباشرة، فبنلفها في { items } داخل الفورم
    global_stats: [
        {
            key: "items",
            type: "objects",
            fields: [
                { key: "value", type: T },
                { key: "label", type: T },
            ],
        },
    ],
    cta: [
        { key: "badge", type: T },
        { key: "title", type: T },
        { key: "description", type: A },
        { key: "button_text", type: T },
        { key: "subnotes", type: T },
    ],
    footer: [
        { key: "brand_description", type: A },
        {
            key: "columns",
            type: "group",
            fields: [
                { key: "platform", type: "strings" },
                { key: "resources", type: "strings" },
                { key: "company", type: "strings" },
            ],
        },
        {
            key: "contact",
            type: "group",
            fields: [
                { key: "email", type: T },
                { key: "phone", type: T },
                { key: "address", type: T },
            ],
        },
        { key: "copyright", type: T },
        { key: "bottom_tagline", type: T },
    ],
};

// =========================
// Helpers
// =========================
const getIn = (obj, path) => path.reduce((acc, k) => acc?.[k], obj);

const setIn = (obj, path, value) => {
    if (!path.length) return value;
    const [head, ...rest] = path;
    const clone = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
    clone[head] = setIn(obj?.[head], rest, value);
    return clone;
};

const clean = (v) =>
    Array.isArray(v)
        ? v.filter((x) => typeof x !== "string" || x.trim() !== "").map(clean)
        : v && typeof v === "object"
            ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]))
            : v;

const toForm = (section) =>
    section.section_key === "global_stats"
        ? { items: JSON.parse(JSON.stringify(section.content ?? [])) }
        : JSON.parse(JSON.stringify(section.content ?? {}));

const fromForm = (key, form) => clean(key === "global_stats" ? form.items : form);

const getSummary = (content, t) => {
    if (Array.isArray(content)) return t("landingPageAdmin.itemsCount", { count: content.length });
    return content?.title || content?.brand_description || content?.badge || "";
};

const getError = (err, fallback) => err?.response?.data?.message || fallback;

const inputCls =
    "w-full border border-[#bcccdc] rounded-lg bg-white px-3 text-[14px] text-[#243b53] outline-none box-border transition-all duration-150 placeholder:text-[#829ab1] focus:border-[#486581] focus:shadow-[0_0_0_2px_#d9e2ec]";
const btnPrimary =
    "inline-flex items-center justify-center gap-2 h-10 px-[18px] bg-[#243b53] border-0 rounded-lg text-white text-[14px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#334e68] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap";
const btnSecondary =
    "inline-flex items-center justify-center gap-2 h-10 px-[18px] bg-white border border-[#bcccdc] rounded-lg text-[#486581] text-[14px] font-semibold cursor-pointer transition-all duration-150 hover:bg-[#f0f4f7] whitespace-nowrap";
const iconBtn =
    "w-8 h-8 rounded-lg border border-[#d9e2ec] bg-white text-[#486581] flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-[#f0f4f7] shrink-0";

const modalBackdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.18 } },
};
const modalPanel = {
    hidden: { opacity: 0, scale: 0.96, y: 18 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.26, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.18 } },
};

// =========================
// Modal shell
// =========================
function Modal({ title, onClose, isRtl, wide = false, children }) {
    const { t } = useTranslation();

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(16,42,67,0.5)] p-4 box-border"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                variants={modalPanel}
                initial="hidden"
                animate="visible"
                exit="exit"
                dir={isRtl ? "rtl" : "ltr"}
                className={`w-full ${wide ? "max-w-[720px]" : "max-w-[512px]"} bg-white rounded-2xl p-6 shadow-[0_20px_30px_rgba(16,42,67,0.2)] box-border max-h-[90vh] overflow-y-auto`}
            >
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-[18px] font-bold text-[#243b53] m-0">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("landingPageAdmin.close")}
                        className="bg-transparent border-0 text-[#627d98] p-[6px] rounded-md cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-[#f0f4f7] hover:text-[#243b53]"
                    >
                        <LuX size={20} />
                    </button>
                </div>
                {children}
            </motion.div>
        </motion.div>
    );
}

// =========================
// Generic schema-driven field
// =========================
function Field({ field, path, form, setForm, t }) {
    const value = getIn(form, path);
    const label = t(`landingPageAdmin.fields.${field.key}`, field.key);
    const onChange = (v) => setForm((prev) => setIn(prev, path, v));

    if (field.type === "text") {
        return (
            <div className="flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-[#486581]">{label}</label>
                <input
                    type="text"
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${inputCls} h-[42px]`}
                />
            </div>
        );
    }

    if (field.type === "textarea") {
        return (
            <div className="flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-[#486581]">{label}</label>
                <textarea
                    rows={3}
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${inputCls} py-2 resize-y`}
                />
            </div>
        );
    }

    if (field.type === "strings") {
        const items = Array.isArray(value) ? value : [];
        return (
            <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-[#486581]">{label}</label>
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => onChange(items.map((x, idx) => (idx === i ? e.target.value : x)))}
                            className={`${inputCls} h-[40px]`}
                        />
                        <button
                            type="button"
                            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                            aria-label={t("landingPageAdmin.remove")}
                            className={`${iconBtn} !border-[#fecaca] !text-[#dc2626] hover:!bg-[#fef2f2]`}
                        >
                            <LuTrash2 size={15} />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => onChange([...items, ""])}
                    className={`${btnSecondary} !h-9 self-start`}
                >
                    <LuPlus size={15} />
                    {t("landingPageAdmin.addItem")}
                </button>
            </div>
        );
    }

    if (field.type === "objects") {
        const items = Array.isArray(value) ? value : [];
        const empty = Object.fromEntries(field.fields.map((f) => [f.key, ""]));
        return (
            <div className="flex flex-col gap-3">
                <label className="text-[14px] font-semibold text-[#243b53]">{label}</label>
                {items.map((_, i) => (
                    <div key={i} className="border border-[#d9e2ec] rounded-xl p-4 flex flex-col gap-3 bg-[#f8fafc]">
                        <div className="flex justify-between items-center">
                            <span className="text-[12px] font-semibold text-[#829ab1]">#{i + 1}</span>
                            <button
                                type="button"
                                onClick={() => onChange(items.filter((__, idx) => idx !== i))}
                                aria-label={t("landingPageAdmin.remove")}
                                className={`${iconBtn} !border-[#fecaca] !text-[#dc2626] hover:!bg-[#fef2f2]`}
                            >
                                <LuTrash2 size={15} />
                            </button>
                        </div>
                        {field.fields.map((sub) => (
                            <Field key={sub.key} field={sub} path={[...path, i, sub.key]} form={form} setForm={setForm} t={t} />
                        ))}
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => onChange([...items, { ...empty }])}
                    className={`${btnSecondary} !h-9 self-start`}
                >
                    <LuPlus size={15} />
                    {t("landingPageAdmin.addItem")}
                </button>
            </div>
        );
    }

    if (field.type === "group") {
        return (
            <fieldset className="border border-[#d9e2ec] rounded-xl p-4 flex flex-col gap-4 m-0 min-w-0">
                <legend className="px-2 text-[14px] font-semibold text-[#243b53]">{label}</legend>
                {field.fields.map((sub) => (
                    <Field key={sub.key} field={sub} path={[...path, sub.key]} form={form} setForm={setForm} t={t} />
                ))}
            </fieldset>
        );
    }

    return null;
}

// =========================
// Section edit modal
// =========================
function SectionModal({ section, lang, isRtl, onClose }) {
    const { t } = useTranslation();
    const schema = SECTION_SCHEMAS[section.section_key] || [];
    const [form, setForm] = useState(() => toForm(section));
    const mutation = useUpdateLandingSection(lang);

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(
            { key: section.section_key, content: fromForm(section.section_key, form) },
            {
                onSuccess: (res) => {
                    toast.success(res?.message || t("landingPageAdmin.sectionUpdated"));
                    onClose();
                },
                onError: (err) => toast.error(getError(err, t("landingPageAdmin.saveFailed"))),
            },
        );
    };

    return (
        <Modal
            wide
            isRtl={isRtl}
            onClose={onClose}
            title={`${t("landingPageAdmin.editSection")}: ${t(`landingPageAdmin.sections.${section.section_key}`, section.section_key)}`}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {schema.map((field) => (
                    <Field key={field.key} field={field} path={[field.key]} form={form} setForm={setForm} t={t} />
                ))}
                <div className="flex justify-end gap-[10px] mt-2">
                    <button type="button" onClick={onClose} className={btnSecondary}>
                        {t("landingPageAdmin.cancel")}
                    </button>
                    <button type="submit" disabled={mutation.isPending} className={btnPrimary}>
                        {mutation.isPending ? t("landingPageAdmin.saving") : t("landingPageAdmin.save")}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// =========================
// Feature create/edit modal
// =========================
function FeatureModal({ feature, lang, isRtl, onClose }) {
    const { t } = useTranslation();
    const isEditing = !!feature;
    const [icon, setIcon] = useState(feature?.icon ?? "");
    const [title, setTitle] = useState(feature?.title ?? "");
    const [description, setDescription] = useState(feature?.description ?? "");
    const [order, setOrder] = useState(feature?.order != null ? String(feature.order) : "");

    const createMutation = useCreateLandingFeature(lang);
    const updateMutation = useUpdateLandingFeature(lang);
    const pending = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            icon: icon.trim(),
            title: title.trim(),
            description: description.trim(),
            ...(order !== "" ? { order: Number(order) } : {}),
        };

        const opts = {
            onSuccess: (res) => {
                toast.success(
                    res?.message ||
                    t(isEditing ? "landingPageAdmin.featureUpdated" : "landingPageAdmin.featureCreated"),
                );
                onClose();
            },
            onError: (err) => toast.error(getError(err, t("landingPageAdmin.saveFailed"))),
        };

        if (isEditing) {
            updateMutation.mutate({ id: feature.id, payload }, opts);
        } else {
            createMutation.mutate({ ...payload, is_active: true }, opts);
        }
    };

    return (
        <Modal
            isRtl={isRtl}
            onClose={onClose}
            title={t(isEditing ? "landingPageAdmin.editFeature" : "landingPageAdmin.addFeature")}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-[6px]">
                    <label className="text-[14px] font-medium text-[#486581]">{t("landingPageAdmin.fields.icon")}</label>
                    <input
                        type="text"
                        maxLength={255}
                        required
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="user-group"
                        dir="ltr"
                        className={`${inputCls} h-[42px]`}
                    />
                    <span className="text-[12px] text-[#829ab1]">{t("landingPageAdmin.iconHint")}</span>
                </div>

                <div className="flex flex-col gap-[6px]">
                    <label className="text-[14px] font-medium text-[#486581]">{t("landingPageAdmin.fields.title")}</label>
                    <input
                        type="text"
                        maxLength={255}
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={`${inputCls} h-[42px]`}
                    />
                </div>

                <div className="flex flex-col gap-[6px]">
                    <label className="text-[14px] font-medium text-[#486581]">
                        {t("landingPageAdmin.fields.description")}
                    </label>
                    <textarea
                        rows={4}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`${inputCls} py-2 resize-y`}
                    />
                </div>

                <div className="flex flex-col gap-[6px]">
                    <label className="text-[14px] font-medium text-[#486581]">{t("landingPageAdmin.fields.order")}</label>
                    <input
                        type="number"
                        min="0"
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                        className={`${inputCls} h-[42px]`}
                    />
                    <span className="text-[12px] text-[#829ab1]">{t("landingPageAdmin.orderHint")}</span>
                </div>

                <div className="flex justify-end gap-[10px] mt-2">
                    <button type="button" onClick={onClose} className={btnSecondary}>
                        {t("landingPageAdmin.cancel")}
                    </button>
                    <button type="submit" disabled={pending} className={btnPrimary}>
                        {pending
                            ? t("landingPageAdmin.saving")
                            : t(isEditing ? "landingPageAdmin.save" : "landingPageAdmin.addFeature")}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
// =========================
// Delete confirmation modal (feature / role)
// =========================
function DeleteModal({ name, mutation, id, successKey, isRtl, onClose }) {
    const { t } = useTranslation();

    const handleDelete = () => {
        mutation.mutate(id, {
            onSuccess: (res) => {
                toast.success(res?.message || t(successKey));
                onClose();
            },
            onError: (err) => toast.error(getError(err, t("landingPageAdmin.deleteFailed"))),
        });
    };

    return (
        <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(16,42,67,0.5)] p-4 box-border"
            onMouseDown={(e) => e.target === e.currentTarget && !mutation.isPending && onClose()}
        >
            <motion.div
                variants={modalPanel}
                initial="hidden"
                animate="visible"
                exit="exit"
                dir={isRtl ? "rtl" : "ltr"}
                className="w-full max-w-[420px] bg-white rounded-2xl p-6 shadow-[0_20px_30px_rgba(16,42,67,0.2)] box-border"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-[#fef2f2] text-[#dc2626] flex items-center justify-center mb-4">
                        <LuTriangleAlert size={28} />
                    </div>
                    <h2 className="text-[18px] font-bold text-[#243b53] m-0 mb-2">
                        {t("landingPageAdmin.deleteTitle")}
                    </h2>
                    <p className="text-[14px] text-[#627d98] leading-[1.6] m-0 mb-6">
                        {t("landingPageAdmin.deleteMessage", { name })}
                    </p>
                    <div className="flex justify-center gap-[10px] w-full">
                        <button
                            type="button"
                            disabled={mutation.isPending}
                            onClick={onClose}
                            className="flex-1 h-10 bg-white border border-[#bcccdc] rounded-lg text-[#486581] text-[14px] font-semibold cursor-pointer transition-all duration-150 hover:bg-[#f0f4f7] disabled:opacity-60"
                        >
                            {t("landingPageAdmin.cancel")}
                        </button>
                        <button
                            type="button"
                            disabled={mutation.isPending}
                            onClick={handleDelete}
                            className="flex-1 h-10 bg-[#dc2626] border-0 rounded-lg text-white text-[14px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#b91c1c] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {mutation.isPending ? t("landingPageAdmin.deleting") : t("landingPageAdmin.confirmDelete")}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// =========================
// Role create/edit modal
// =========================
function RoleModal({ role, lang, isRtl, onClose }) {
    const { t } = useTranslation();
    const isEditing = !!role;
    const [roleName, setRoleName] = useState(role?.role_name ?? "");
    const [title, setTitle] = useState(role?.title ?? "");
    const [description, setDescription] = useState(role?.description ?? "");
    const [features, setFeatures] = useState(role?.features?.length ? [...role.features] : [""]);
    const [order, setOrder] = useState(role?.order != null ? String(role.order) : "");

    const createMutation = useCreateLandingRole(lang);
    const updateMutation = useUpdateLandingRole(lang);
    const pending = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = (e) => {
        e.preventDefault();
        const cleanFeatures = features.map((f) => f.trim()).filter(Boolean);
        if (cleanFeatures.length === 0) {
            toast.error(t("landingPageAdmin.featuresRequired"));
            return;
        }

        const payload = {
            role_name: roleName.trim(),
            title: title.trim(),
            description: description.trim(),
            features: cleanFeatures,
            ...(order !== "" ? { order: Number(order) } : {}),
        };

        const opts = {
            onSuccess: (res) => {
                toast.success(
                    res?.message ||
                    t(isEditing ? "landingPageAdmin.roleUpdated" : "landingPageAdmin.roleCreated"),
                );
                onClose();
            },
            onError: (err) => toast.error(getError(err, t("landingPageAdmin.saveFailed"))),
        };

        if (isEditing) {
            updateMutation.mutate({ id: role.id, payload }, opts);
        } else {
            createMutation.mutate({ ...payload, is_active: true }, opts);
        }
    };

    return (
        <Modal
            isRtl={isRtl}
            onClose={onClose}
            title={t(isEditing ? "landingPageAdmin.editRole" : "landingPageAdmin.addRole")}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-[6px]">
                    <label className="text-[14px] font-medium text-[#486581]">{t("landingPageAdmin.fields.role_name")}</label>
                    <input
                        type="text"
                        maxLength={255}
                        required
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        className={`${inputCls} h-[42px]`}
                    />
                </div>

                <div className="flex flex-col gap-[6px]">
                    <label className="text-[14px] font-medium text-[#486581]">{t("landingPageAdmin.fields.title")}</label>
                    <input
                        type="text"
                        maxLength={255}
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={`${inputCls} h-[42px]`}
                    />
                </div>

                <div className="flex flex-col gap-[6px]">
                    <label className="text-[14px] font-medium text-[#486581]">{t("landingPageAdmin.fields.description")}</label>
                    <textarea
                        rows={4}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`${inputCls} py-2 resize-y`}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-medium text-[#486581]">{t("landingPageAdmin.fields.features")}</label>
                    {features.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => setFeatures((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                                className={`${inputCls} h-[40px]`}
                            />
                            <button
                                type="button"
                                onClick={() => setFeatures((prev) => prev.filter((_, idx) => idx !== i))}
                                aria-label={t("landingPageAdmin.remove")}
                                className={`${iconBtn} !border-[#fecaca] !text-[#dc2626] hover:!bg-[#fef2f2]`}
                            >
                                <LuTrash2 size={15} />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFeatures((prev) => [...prev, ""])}
                        className={`${btnSecondary} !h-9 self-start`}
                    >
                        <LuPlus size={15} />
                        {t("landingPageAdmin.addItem")}
                    </button>
                </div>

                <div className="flex flex-col gap-[6px]">
                    <label className="text-[14px] font-medium text-[#486581]">{t("landingPageAdmin.fields.order")}</label>
                    <input
                        type="number"
                        min="0"
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                        className={`${inputCls} h-[42px]`}
                    />
                    <span className="text-[12px] text-[#829ab1]">{t("landingPageAdmin.orderHint")}</span>
                </div>

                <div className="flex justify-end gap-[10px] mt-2">
                    <button type="button" onClick={onClose} className={btnSecondary}>
                        {t("landingPageAdmin.cancel")}
                    </button>
                    <button type="submit" disabled={pending} className={btnPrimary}>
                        {pending
                            ? t("landingPageAdmin.saving")
                            : t(isEditing ? "landingPageAdmin.save" : "landingPageAdmin.addRole")}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// =========================
// Plan create/edit modal
// =========================
function PlanModal({ plan, lang, isRtl, onClose }) {
    const { t } = useTranslation();
    const isEditing = !!plan;
    const [name, setName] = useState(plan?.name ?? "");
    const [description, setDescription] = useState(plan?.description ?? "");
    const [price, setPrice] = useState(plan?.price ?? "");
    const [billingPeriod, setBillingPeriod] = useState(plan?.billing_period ?? "");
    const [isPopular, setIsPopular] = useState(!!plan?.is_popular);
    const [features, setFeatures] = useState(plan?.features?.length ? [...plan.features] : [""]);
    const [buttonText, setButtonText] = useState(plan?.button_text ?? "");
    const [buttonLink, setButtonLink] = useState(plan?.button_link ?? "");
    const [order, setOrder] = useState(plan?.order != null ? String(plan.order) : "");

    const createMutation = useCreateLandingPlan(lang);
    const updateMutation = useUpdateLandingPlan(lang);
    const pending = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = (e) => {
        e.preventDefault();
        const cleanFeatures = features.map((f) => f.trim()).filter(Boolean);
        if (cleanFeatures.length === 0) {
            toast.error(t("landingPageAdmin.featuresRequired"));
            return;
        }

        // اختياري: في التعديل بنبعت null لو اتمسح، وفي الإنشاء بنتجاهله لو فاضي
        const optional = (value) => {
            const v = value.trim();
            if (v !== "") return v;
            return isEditing ? null : undefined;
        };

        const payload = {
            name: name.trim(),
            price: price.trim(),
            is_popular: isPopular,
            features: cleanFeatures,
            description: optional(description),
            billing_period: optional(billingPeriod),
            button_text: optional(buttonText),
            button_link: optional(buttonLink),
            ...(order !== "" ? { order: Number(order) } : {}),
        };

        const opts = {
            onSuccess: (res) => {
                toast.success(
                    res?.message ||
                    t(isEditing ? "landingPageAdmin.planUpdated" : "landingPageAdmin.planCreated"),
                );
                onClose();
            },
            onError: (err) => toast.error(getError(err, t("landingPageAdmin.saveFailed"))),
        };

        if (isEditing) {
            updateMutation.mutate({ id: plan.id, payload }, opts);
        } else {
            createMutation.mutate({ ...payload, is_active: true }, opts);
        }
    };

    const labelCls = "text-[14px] font-medium text-[#486581]";

    return (
        <Modal
            wide
            isRtl={isRtl}
            onClose={onClose}
            title={t(isEditing ? "landingPageAdmin.editPlan" : "landingPageAdmin.addPlan")}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-[6px]">
                    <label className={labelCls}>{t("landingPageAdmin.fields.name")}</label>
                    <input
                        type="text"
                        maxLength={255}
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${inputCls} h-[42px]`}
                    />
                </div>

                <div className="flex flex-col gap-[6px]">
                    <label className={labelCls}>{t("landingPageAdmin.fields.description")}</label>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`${inputCls} py-2 resize-y`}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-[6px]">
                        <label className={labelCls}>{t("landingPageAdmin.fields.price")}</label>
                        <input
                            type="text"
                            maxLength={255}
                            required
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className={`${inputCls} h-[42px]`}
                        />
                        <span className="text-[12px] text-[#829ab1]">{t("landingPageAdmin.priceHint")}</span>
                    </div>

                    <div className="flex flex-col gap-[6px]">
                        <label className={labelCls}>{t("landingPageAdmin.fields.billing_period")}</label>
                        <input
                            type="text"
                            maxLength={255}
                            value={billingPeriod}
                            onChange={(e) => setBillingPeriod(e.target.value)}
                            className={`${inputCls} h-[42px]`}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className={labelCls}>{t("landingPageAdmin.fields.features")}</label>
                    {features.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => setFeatures((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                                className={`${inputCls} h-[40px]`}
                            />
                            <button
                                type="button"
                                onClick={() => setFeatures((prev) => prev.filter((_, idx) => idx !== i))}
                                aria-label={t("landingPageAdmin.remove")}
                                className={`${iconBtn} !border-[#fecaca] !text-[#dc2626] hover:!bg-[#fef2f2]`}
                            >
                                <LuTrash2 size={15} />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFeatures((prev) => [...prev, ""])}
                        className={`${btnSecondary} !h-9 self-start`}
                    >
                        <LuPlus size={15} />
                        {t("landingPageAdmin.addItem")}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-[6px]">
                        <label className={labelCls}>{t("landingPageAdmin.fields.button_text")}</label>
                        <input
                            type="text"
                            maxLength={255}
                            value={buttonText}
                            onChange={(e) => setButtonText(e.target.value)}
                            className={`${inputCls} h-[42px]`}
                        />
                    </div>

                    <div className="flex flex-col gap-[6px]">
                        <label className={labelCls}>{t("landingPageAdmin.fields.button_link")}</label>
                        <input
                            type="text"
                            maxLength={255}
                            dir="ltr"
                            value={buttonLink}
                            onChange={(e) => setButtonLink(e.target.value)}
                            placeholder="/contact-sales"
                            className={`${inputCls} h-[42px]`}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-[6px]">
                    <label className={labelCls}>{t("landingPageAdmin.fields.order")}</label>
                    <input
                        type="number"
                        min="0"
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                        className={`${inputCls} h-[42px]`}
                    />
                    <span className="text-[12px] text-[#829ab1]">{t("landingPageAdmin.orderHint")}</span>
                </div>

                <div className="flex items-center justify-between">
                    <label htmlFor="plan-is-popular" className={labelCls}>
                        {t("landingPageAdmin.fields.is_popular")}
                    </label>
                    <button
                        id="plan-is-popular"
                        type="button"
                        role="switch"
                        aria-checked={isPopular}
                        onClick={() => setIsPopular((prev) => !prev)}
                        className={`relative w-11 h-6 rounded-full border-0 cursor-pointer p-0 outline-none transition-colors duration-200 ease-in-out ${isPopular ? "bg-[#5b8c6a]" : "bg-[#bcccdc]"
                            }`}
                    >
                        <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-[left] duration-200 ease-in-out ${isPopular ? "left-6" : "left-1"
                                }`}
                        />
                    </button>
                </div>

                <div className="flex justify-end gap-[10px] mt-2">
                    <button type="button" onClick={onClose} className={btnSecondary}>
                        {t("landingPageAdmin.cancel")}
                    </button>
                    <button type="submit" disabled={pending} className={btnPrimary}>
                        {pending
                            ? t("landingPageAdmin.saving")
                            : t(isEditing ? "landingPageAdmin.save" : "landingPageAdmin.addPlan")}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
// =========================
// Skeleton / error / empty
// =========================
function CardsSkeleton({ count = 3 }) {
    return (
        <div className="grid grid-cols-1 min-[901px]:grid-cols-2 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white border border-[#d9e2ec] rounded-xl py-5 px-[22px] min-h-[130px] flex flex-col justify-between"
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
    );
}

function ErrorBox({ error, onRetry, t }) {
    return (
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4 flex justify-between items-center gap-3 flex-wrap">
            <p className="text-sm font-semibold text-[#dc2626] m-0">
                {getError(error, t("landingPageAdmin.loadError"))}
            </p>
            <button
                type="button"
                onClick={onRetry}
                className="h-9 px-4 bg-white border border-[#fecaca] rounded-lg text-[#dc2626] text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#fef2f2]"
            >
                {t("landingPageAdmin.retry")}
            </button>
        </div>
    );
}

// =========================
// Page
// =========================
export default function LandingPage() {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith("ar");
    const lang = isRtl ? "ar" : "en";

    const sectionsQuery = useLandingSections(lang);
    const featuresQuery = useLandingFeatures(lang);

    const rolesQuery = useLandingRoles(lang);
    const deleteFeatureMutation = useDeleteLandingFeature(lang);
    const deleteRoleMutation = useDeleteLandingRole(lang);

    const plansQuery = useLandingPlans(lang);
    const deletePlanMutation = useDeleteLandingPlan(lang);

    const [editingSection, setEditingSection] = useState(null);
    const [featureModal, setFeatureModal] = useState({ open: false, feature: null });


    const [roleModal, setRoleModal] = useState({ open: false, role: null });
    const [deletingFeature, setDeletingFeature] = useState(null);
    const [deletingRole, setDeletingRole] = useState(null);

    const [planModal, setPlanModal] = useState({ open: false, plan: null });
    const [deletingPlan, setDeletingPlan] = useState(null);

    const sections = sectionsQuery.data?.data ?? [];
    const features = useMemo(
        () => [...(featuresQuery.data?.data ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [featuresQuery.data],
    );

    const roles = useMemo(
        () => [...(rolesQuery.data?.data ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [rolesQuery.data],
    );

    const plans = useMemo(
        () => [...(plansQuery.data?.data ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [plansQuery.data],
    );
    const formatDate = (iso) =>
        iso ? new Date(iso).toLocaleString(isRtl ? "ar-EG" : "en-GB") : "—";

    return (
        <>
            <div dir={isRtl ? "rtl" : "ltr"} className="w-full max-w-[1400px] mx-auto box-border">
                {/* HEADER */}
                <div className="mb-[24px]">
                    <h1 className="text-[28px] font-bold leading-[1.2] text-[#243b53] tracking-[-0.02em]">
                        {t("landingPageAdmin.title")}
                    </h1>
                    <p className="text-[14px] text-[#627d98] mt-[6px] leading-[1.4]">
                        {t("landingPageAdmin.subtitle")}
                    </p>
                </div>

                {/* LANGUAGE NOTICE */}
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#d9e2ec] bg-[#f0f4f8] p-4">
                    <LuInfo size={18} className="text-[#486581] mt-[2px] shrink-0" />
                    <p className="m-0 text-[13px] text-[#486581] leading-[1.5]">
                        {t("landingPageAdmin.langNotice", {
                            language: t(isRtl ? "common.arabic" : "common.english"),
                        })}
                    </p>
                </div>

                {/* SECTIONS */}
                <div className="bg-white border border-[#d9e2ec] rounded-[14px] py-6 px-7 shadow-[0_1px_3px_rgba(16,42,67,0.03)] box-border mb-6">
                    <div className="mb-6">
                        <h2 className="text-[18px] font-bold text-[#243b53] m-0 leading-[1.3]">
                            {t("landingPageAdmin.sectionsTitle")}
                        </h2>
                        <p className="text-[14px] text-[#829ab1] mt-1 leading-[1.4]">
                            {t("landingPageAdmin.sectionsSubtitle")}
                        </p>
                    </div>

                    {sectionsQuery.isLoading ? (
                        <CardsSkeleton count={6} />
                    ) : sectionsQuery.isError ? (
                        <ErrorBox error={sectionsQuery.error} onRetry={() => sectionsQuery.refetch()} t={t} />
                    ) : sections.length === 0 ? (
                        <p className="py-12 text-center text-sm text-[#829ab1]">{t("landingPageAdmin.noSections")}</p>
                    ) : (
                        <div className="grid grid-cols-1 min-[901px]:grid-cols-2 gap-4">
                            {sections.map((section) => (
                                <div
                                    key={section.id}
                                    className="bg-white border border-[#d9e2ec] rounded-xl py-5 px-[22px] flex flex-col justify-between gap-4 min-h-[130px] box-border transition-colors duration-150 hover:border-[#bcccdc]"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-[16px] font-bold text-[#243b53] m-0 leading-[1.2]">
                                                {t(`landingPageAdmin.sections.${section.section_key}`, section.section_key)}
                                            </h3>
                                            <p className="text-[13px] text-[#627d98] mt-2 mb-0 leading-[1.5] line-clamp-2">
                                                {getSummary(section.content, t)}
                                            </p>
                                        </div>
                                        <span
                                            dir="ltr"
                                            className="inline-flex items-center h-[26px] px-[10px] bg-[#e7eef5] text-[#486581] rounded-full text-[12px] font-semibold shrink-0"
                                        >
                                            {section.section_key}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-[14px] border-t border-[#eef1f4] gap-3">
                                        <span className="text-[12px] text-[#829ab1]">
                                            {t("landingPageAdmin.lastUpdated")}: {formatDate(section.updated_at)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setEditingSection(section)}
                                            aria-label={`${t("landingPageAdmin.edit")} ${section.section_key}`}
                                            className={iconBtn}
                                        >
                                            <LuPenLine size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FEATURES */}
                <div className="bg-white border border-[#d9e2ec] rounded-[14px] py-6 px-7 shadow-[0_1px_3px_rgba(16,42,67,0.03)] box-border">
                    <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
                        <div>
                            <h2 className="text-[18px] font-bold text-[#243b53] m-0 leading-[1.3]">
                                {t("landingPageAdmin.featuresTitle")}
                            </h2>
                            <p className="text-[14px] text-[#829ab1] mt-1 leading-[1.4]">
                                {t("landingPageAdmin.featuresSubtitle")}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFeatureModal({ open: true, feature: null })}
                            className={btnPrimary}
                        >
                            <LuPlus size={17} />
                            <span>{t("landingPageAdmin.addFeature")}</span>
                        </button>
                    </div>

                    {featuresQuery.isLoading ? (
                        <CardsSkeleton count={4} />
                    ) : featuresQuery.isError ? (
                        <ErrorBox error={featuresQuery.error} onRetry={() => featuresQuery.refetch()} t={t} />
                    ) : features.length === 0 ? (
                        <p className="py-12 text-center text-sm text-[#829ab1]">{t("landingPageAdmin.noFeatures")}</p>
                    ) : (
                        <div className="grid grid-cols-1 min-[901px]:grid-cols-2 gap-4">
                            {features.map((feature) => (
                                <div
                                    key={feature.id}
                                    className="bg-white border border-[#d9e2ec] rounded-xl py-5 px-[22px] flex flex-col justify-between gap-4 min-h-[154px] box-border transition-colors duration-150 hover:border-[#bcccdc]"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-[16px] font-bold text-[#243b53] m-0 leading-[1.3]">
                                                {feature.title}
                                            </h3>
                                            <p className="text-[13px] text-[#627d98] mt-2 mb-0 leading-[1.5]">
                                                {feature.description}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center h-[26px] px-[10px] bg-[#e7eef5] text-[#486581] rounded-full text-[12px] font-semibold shrink-0 whitespace-nowrap">
                                            #{feature.order}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-[14px] border-t border-[#eef1f4] gap-3">
                                        <span dir="ltr" className="text-[12px] text-[#829ab1] truncate">
                                            {t("landingPageAdmin.fields.icon")}: {feature.icon}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setFeatureModal({ open: true, feature })}
                                                aria-label={`${t("landingPageAdmin.edit")} ${feature.title}`}
                                                className={iconBtn}
                                            >
                                                <LuPenLine size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingFeature(feature)}
                                                aria-label={`${t("landingPageAdmin.delete")} ${feature.title}`}
                                                className={`${iconBtn} !border-[#fecaca] !text-[#dc2626] hover:!bg-[#fef2f2]`}
                                            >
                                                <LuTrash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* ROLES */}
                <div className="bg-white border border-[#d9e2ec] rounded-[14px] py-6 px-7 shadow-[0_1px_3px_rgba(16,42,67,0.03)] box-border mt-6">
                    <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
                        <div>
                            <h2 className="text-[18px] font-bold text-[#243b53] m-0 leading-[1.3]">
                                {t("landingPageAdmin.rolesTitle")}
                            </h2>
                            <p className="text-[14px] text-[#829ab1] mt-1 leading-[1.4]">
                                {t("landingPageAdmin.rolesSubtitle")}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setRoleModal({ open: true, role: null })}
                            className={btnPrimary}
                        >
                            <LuPlus size={17} />
                            <span>{t("landingPageAdmin.addRole")}</span>
                        </button>
                    </div>

                    {rolesQuery.isLoading ? (
                        <CardsSkeleton count={4} />
                    ) : rolesQuery.isError ? (
                        <ErrorBox error={rolesQuery.error} onRetry={() => rolesQuery.refetch()} t={t} />
                    ) : roles.length === 0 ? (
                        <p className="py-12 text-center text-sm text-[#829ab1]">{t("landingPageAdmin.noRoles")}</p>
                    ) : (
                        <div className="grid grid-cols-1 min-[901px]:grid-cols-2 gap-4">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className="bg-white border border-[#d9e2ec] rounded-xl py-5 px-[22px] flex flex-col justify-between gap-4 box-border transition-colors duration-150 hover:border-[#bcccdc]"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0">
                                            <span className="inline-flex items-center h-[24px] px-[10px] bg-[#e7eef5] text-[#486581] rounded-full text-[11px] font-bold tracking-[0.04em] mb-2">
                                                {role.role_name}
                                            </span>
                                            <h3 className="text-[16px] font-bold text-[#243b53] m-0 leading-[1.3]">{role.title}</h3>
                                            <p className="text-[13px] text-[#627d98] mt-2 mb-0 leading-[1.5]">{role.description}</p>
                                        </div>
                                        <span className="inline-flex items-center h-[26px] px-[10px] bg-[#e7eef5] text-[#486581] rounded-full text-[12px] font-semibold shrink-0 whitespace-nowrap">
                                            #{role.order}
                                        </span>
                                    </div>

                                    <ul className="m-0 p-0 list-none flex flex-col gap-[6px]">
                                        {(role.features ?? []).map((f, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[13px] text-[#486581] leading-[1.5]">
                                                <span className="w-[6px] h-[6px] rounded-full bg-[#5b8c6a] mt-[7px] shrink-0" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="flex justify-end items-center pt-[14px] border-t border-[#eef1f4] gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRoleModal({ open: true, role })}
                                            aria-label={`${t("landingPageAdmin.edit")} ${role.title}`}
                                            className={iconBtn}
                                        >
                                            <LuPenLine size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeletingRole(role)}
                                            aria-label={`${t("landingPageAdmin.delete")} ${role.title}`}
                                            className={`${iconBtn} !border-[#fecaca] !text-[#dc2626] hover:!bg-[#fef2f2]`}
                                        >
                                            <LuTrash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                        {/* PLANS */}
        <div className="bg-white border border-[#d9e2ec] rounded-[14px] py-6 px-7 shadow-[0_1px_3px_rgba(16,42,67,0.03)] box-border mt-6">
          <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-[18px] font-bold text-[#243b53] m-0 leading-[1.3]">
                {t("landingPageAdmin.plansTitle")}
              </h2>
              <p className="text-[14px] text-[#829ab1] mt-1 leading-[1.4]">
                {t("landingPageAdmin.plansSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlanModal({ open: true, plan: null })}
              className={btnPrimary}
            >
              <LuPlus size={17} />
              <span>{t("landingPageAdmin.addPlan")}</span>
            </button>
          </div>

          {plansQuery.isLoading ? (
            <CardsSkeleton count={3} />
          ) : plansQuery.isError ? (
            <ErrorBox error={plansQuery.error} onRetry={() => plansQuery.refetch()} t={t} />
          ) : plans.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#829ab1]">{t("landingPageAdmin.noPlans")}</p>
          ) : (
            <div className="grid grid-cols-1 min-[901px]:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white border rounded-xl py-5 px-[22px] flex flex-col justify-between gap-4 box-border transition-colors duration-150 ${
                    plan.is_popular
                      ? "border-[#5b8c6a] hover:border-[#5b8c6a]"
                      : "border-[#d9e2ec] hover:border-[#bcccdc]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="inline-flex items-center h-[24px] px-[10px] bg-[#e7eef5] text-[#486581] rounded-full text-[11px] font-bold tracking-[0.04em]">
                          {plan.name}
                        </span>
                        {plan.is_popular && (
                          <span className="inline-flex items-center gap-1 h-[24px] px-[10px] bg-[#e8f3eb] text-[#3f7d5a] rounded-full text-[11px] font-bold">
                            <LuStar size={12} />
                            {t("landingPageAdmin.popular")}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[20px] font-bold text-[#243b53] m-0 leading-[1.2]">{plan.price}</h3>
                      {plan.billing_period && (
                        <p className="text-[12px] text-[#829ab1] mt-1 mb-0">{plan.billing_period}</p>
                      )}
                      {plan.description && (
                        <p className="text-[13px] text-[#627d98] mt-2 mb-0 leading-[1.5]">{plan.description}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center h-[26px] px-[10px] bg-[#e7eef5] text-[#486581] rounded-full text-[12px] font-semibold shrink-0 whitespace-nowrap">
                      #{plan.order}
                    </span>
                  </div>

                  <ul className="m-0 p-0 list-none flex flex-col gap-[6px]">
                    {(plan.features ?? []).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[#486581] leading-[1.5]">
                        <span className="w-[6px] h-[6px] rounded-full bg-[#5b8c6a] mt-[7px] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-center pt-[14px] border-t border-[#eef1f4] gap-3">
                    <div className="min-w-0 text-[12px] text-[#829ab1]">
                      {plan.button_text && (
                        <span className="block truncate">
                          {t("landingPageAdmin.fields.button_text")}: {plan.button_text}
                        </span>
                      )}
                      {plan.button_link && (
                        <span dir="ltr" className="block truncate">
                          {t("landingPageAdmin.fields.button_link")}: {plan.button_link}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPlanModal({ open: true, plan })}
                        aria-label={`${t("landingPageAdmin.edit")} ${plan.name}`}
                        className={iconBtn}
                      >
                        <LuPenLine size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPlan(plan)}
                        aria-label={`${t("landingPageAdmin.delete")} ${plan.name}`}
                        className={`${iconBtn} !border-[#fecaca] !text-[#dc2626] hover:!bg-[#fef2f2]`}
                      >
                        <LuTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
            </div>

            <AnimatePresence>
                {editingSection && (
                    <SectionModal
                        key={`section-${editingSection.section_key}`}
                        section={editingSection}
                        lang={lang}
                        isRtl={isRtl}
                        onClose={() => setEditingSection(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {featureModal.open && (
                    <FeatureModal
                        key={`feature-${featureModal.feature?.id ?? "new"}`}
                        feature={featureModal.feature}
                        lang={lang}
                        isRtl={isRtl}
                        onClose={() => setFeatureModal({ open: false, feature: null })}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {roleModal.open && (
                    <RoleModal
                        key={`role-${roleModal.role?.id ?? "new"}`}
                        role={roleModal.role}
                        lang={lang}
                        isRtl={isRtl}
                        onClose={() => setRoleModal({ open: false, role: null })}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deletingFeature && (
                    <DeleteModal
                        key={`del-feature-${deletingFeature.id}`}
                        name={deletingFeature.title}
                        id={deletingFeature.id}
                        mutation={deleteFeatureMutation}
                        successKey="landingPageAdmin.featureDeleted"
                        isRtl={isRtl}
                        onClose={() => setDeletingFeature(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deletingRole && (
                    <DeleteModal
                        key={`del-role-${deletingRole.id}`}
                        name={deletingRole.title}
                        id={deletingRole.id}
                        mutation={deleteRoleMutation}
                        successKey="landingPageAdmin.roleDeleted"
                        isRtl={isRtl}
                        onClose={() => setDeletingRole(null)}
                    />
                )}
            </AnimatePresence>

                  <AnimatePresence>
        {planModal.open && (
          <PlanModal
            key={`plan-${planModal.plan?.id ?? "new"}`}
            plan={planModal.plan}
            lang={lang}
            isRtl={isRtl}
            onClose={() => setPlanModal({ open: false, plan: null })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingPlan && (
          <DeleteModal
            key={`del-plan-${deletingPlan.id}`}
            name={deletingPlan.name}
            id={deletingPlan.id}
            mutation={deletePlanMutation}
            successKey="landingPageAdmin.planDeleted"
            isRtl={isRtl}
            onClose={() => setDeletingPlan(null)}
          />
        )}
      </AnimatePresence>
        </>
    );
}