import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, BookOpen, Download, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* =====================================================
   API ENDPOINT (رابط الـ Backend الخاص بـ الـ Database)
===================================================== */
const API_URL = "/api/hr/policies";

/* =====================================================
   LOCAL STORAGE (حل مؤقت — البيانات متضيعش مع الـ Refresh)
===================================================== */
const STORAGE_KEY = "hr_company_policies";

const DEFAULT_POLICIES = [
  { id: "punctuality", translationKey: "punctuality" },
  { id: "leave", translationKey: "leave" },
  { id: "salary-advance", translationKey: "salaryAdvance" },
];

const loadLocalPolicies = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_POLICIES;
  } catch (error) {
    console.error("Error reading localStorage:", error);
    return DEFAULT_POLICIES;
  }
};

const saveLocalPolicies = (policies) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
  } catch (error) {
    console.error("Error writing localStorage:", error);
  }
};

/* =====================================================
   MOTION
===================================================== */

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

/* =====================================================
   POLICY CARD
===================================================== */

function PolicyCard({ policy, onEdit, onDelete }) {
  const { t } = useTranslation();

  const isTranslatedPolicy = Boolean(policy.translationKey);

  const title = isTranslatedPolicy
    ? t(`hrCompanyPolicies.policies.${policy.translationKey}.title`)
    : policy.title;

  const description = isTranslatedPolicy
    ? t(`hrCompanyPolicies.policies.${policy.translationKey}.description`)
    : policy.description;

  const effectiveDate = isTranslatedPolicy
    ? t(`hrCompanyPolicies.policies.${policy.translationKey}.effectiveDate`)
    : policy.effectiveDate;

  const version = isTranslatedPolicy
    ? t(`hrCompanyPolicies.policies.${policy.translationKey}.version`)
    : policy.version || "v1.0";

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className="
        group
        rounded-2xl
        border
        border-[#e2e8f0]/80
        bg-white
        p-5
        shadow-[0_1px_3px_rgba(0,0,0,0.03)]
        transition-shadow
        duration-200
        hover:shadow-md
      "
    >
      {/* =====================================================
         ICON + STATUS
      ===================================================== */}

      <div className="flex items-start justify-between gap-4">
        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            bg-[#eff6ff]
            text-[#3b82f6]
            transition
            duration-200
            group-hover:scale-105
          "
        >
          <BookOpen className="h-4 w-4" />
        </div>

        <span
          className="
            rounded-full
            border
            border-[#a7f3d0]
            bg-[#ecfdf5]
            px-3
            py-1
            text-[11px]
            font-bold
            text-[#047857]
          "
        >
          {t("hrCompanyPolicies.aiSynced")}
        </span>
      </div>

      {/* =====================================================
         TITLE
      ===================================================== */}

      <h3 className="mt-4 text-base font-bold tracking-tight text-[#1e293b]">
        {title}
      </h3>

      {/* =====================================================
         DESCRIPTION
      ===================================================== */}

      <p className="mt-1 text-sm font-normal leading-6 text-[#64748b]">
        {description}
      </p>

      {/* =====================================================
         POLICY DETAILS
      ===================================================== */}

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#f1f5f9] pt-4">
        <div className="rounded-xl bg-[#f8fafc] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
            {t("hrCompanyPolicies.effectiveDate")}
          </p>

          <p className="mt-1 text-xs font-semibold text-[#1e293b]">
            {effectiveDate}
          </p>
        </div>

        <div className="rounded-xl bg-[#f8fafc] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
            {t("hrCompanyPolicies.document")}
          </p>

          <p className="mt-1 text-xs font-semibold text-[#1e293b]">{version}</p>
        </div>
      </div>

      {/* =====================================================
         ACTIONS
      ===================================================== */}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-4">
        {/* EDIT */}

        <button
          type="button"
          onClick={() => onEdit(policy)}
          className="
            rounded-lg
            border
            border-[#e2e8f0]
            bg-white
            px-3
            py-2
            text-xs
            font-semibold
            text-[#475569]
            transition
            hover:bg-[#f8fafc]
          "
        >
          {t("hrCompanyPolicies.editDocument")}
        </button>

        {/* DOWNLOAD + DELETE */}

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-lg
              px-2
              py-2
              text-xs
              font-semibold
              text-[#475569]
              transition
              hover:bg-[#f8fafc]
              hover:text-[#243B53]
            "
          >
            <Download className="h-3.5 w-3.5" />

            {t("hrCompanyPolicies.downloadPdf")}
          </button>

          <button
            type="button"
            onClick={() => onDelete(policy)}
            aria-label={t("hrCompanyPolicies.delete")}
            className="
              rounded-lg
              p-2
              text-[#94a3b8]
              transition
              hover:bg-[#fef2f2]
              hover:text-[#dc2626]
            "
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* =====================================================
   ADD / EDIT POLICY MODAL
===================================================== */

function AddPolicyModal({ onClose, onSave, editingPolicy }) {
  const { t } = useTranslation();

  const getInitialTitle = () => {
    if (!editingPolicy) return "";

    if (editingPolicy.translationKey) {
      return t(
        `hrCompanyPolicies.policies.${editingPolicy.translationKey}.title`,
      );
    }

    return editingPolicy.title || "";
  };

  const getInitialEffectiveDate = () => {
    if (!editingPolicy) return "";

    if (editingPolicy.translationKey) {
      return t(
        `hrCompanyPolicies.policies.${editingPolicy.translationKey}.effectiveDate`,
      );
    }

    return editingPolicy.effectiveDate || "";
  };

  const [title, setTitle] = useState(getInitialTitle());
  const [effectiveDate, setEffectiveDate] = useState(getInitialEffectiveDate());
  const [owner, setOwner] = useState(editingPolicy?.owner || "");
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(editingPolicy);

  /* =====================================================
     SAVE FORM
  ===================================================== */

  const handleFormSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    await onSave({
      title,
      effectiveDate,
      owner,
    });
    setLoading(false);
  };

  return (
    <motion.div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-[#0f172a]/40
        p-4
        backdrop-blur-[2px]
      "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="
          w-full
          max-w-xl
          overflow-hidden
          rounded-2xl
          border
          border-[#e2e8f0]/80
          bg-white
          shadow-xl
        "
      >
        {/* =====================================================
            MODAL HEADER
        ===================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-[#f1f5f9]
            px-5
            py-4
          "
        >
          <div>
            <h2 className="text-base font-bold text-[#1e293b]">
              {isEditing
                ? t("hrCompanyPolicies.editPolicyDocument")
                : t("hrCompanyPolicies.addPolicyDocument")}
            </h2>

            <p className="mt-1 text-xs text-[#64748b]">
              {isEditing
                ? t("hrCompanyPolicies.editDocument")
                : t("hrCompanyPolicies.addPolicyDocument")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              p-2
              text-[#94a3b8]
              transition
              hover:bg-[#f8fafc]
              hover:text-[#475569]
            "
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* =====================================================
            FORM
        ===================================================== */}

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* POLICY TITLE */}

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                {t("hrCompanyPolicies.policyTitle")}
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("hrCompanyPolicies.policyTitlePlaceholder")}
                className="
                  mt-1.5
                  w-full
                  rounded-lg
                  border
                  border-[#e2e8f0]
                  bg-white
                  px-3
                  py-2.5
                  text-xs
                  text-[#1e293b]
                  outline-none
                  transition
                  placeholder:text-[#94a3b8]
                  focus:border-[#94a3b8]
                  focus:ring-2
                  focus:ring-[#f1f5f9]
                "
              />
            </div>

            {/* EFFECTIVE DATE */}

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                {t("hrCompanyPolicies.effectiveDateLabel")}
              </label>

              <input
                type="text"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                placeholder={t("hrCompanyPolicies.effectiveDatePlaceholder")}
                className="
                  mt-1.5
                  w-full
                  rounded-lg
                  border
                  border-[#e2e8f0]
                  bg-white
                  px-3
                  py-2.5
                  text-xs
                  text-[#1e293b]
                  outline-none
                  transition
                  placeholder:text-[#94a3b8]
                  focus:border-[#94a3b8]
                  focus:ring-2
                  focus:ring-[#f1f5f9]
                "
              />
            </div>
          </div>

          {/* OWNER */}

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              {t("hrCompanyPolicies.owner")}
            </label>

            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder={t("hrCompanyPolicies.ownerPlaceholder")}
              className="
                mt-1.5
                w-full
                rounded-lg
                border
                border-[#e2e8f0]
                bg-white
                px-3
                py-2.5
                text-xs
                text-[#1e293b]
                outline-none
                transition
                placeholder:text-[#94a3b8]
                focus:border-[#94a3b8]
                focus:ring-2
                focus:ring-[#f1f5f9]
              "
            />
          </div>

          {/* =====================================================
              MODAL BUTTONS
          ===================================================== */}

          <div className="flex justify-end gap-3 border-t border-[#f1f5f9] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                rounded-lg
                border
                border-[#e2e8f0]
                bg-white
                px-4
                py-2.5
                text-xs
                font-semibold
                text-[#475569]
                transition
                hover:bg-[#f8fafc]
              "
            >
              {t("hrCompanyPolicies.cancel")}
            </button>

            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={loading}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-[#243B53]
                px-4
                py-2.5
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-[#1c2f42]
              "
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("hrCompanyPolicies.saveChanges")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =====================================================
   COMPANY POLICIES PAGE
===================================================== */

export default function CompanyPolicies() {
  const { t, i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  /* =====================================================
     FETCH POLICIES (API → localStorage Fallback)
  ===================================================== */

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setPolicies(data);
      saveLocalPolicies(data);
    } catch (error) {
      // الـ API مش شغال → نحمّل من localStorage عشان البيانات متضيعش
      console.warn("API unavailable — loading from localStorage:", error.message);
      setPolicies(loadLocalPolicies());
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     ADD POLICY
  ===================================================== */

  const handleAddPolicy = () => {
    setEditingPolicy(null);
    setIsModalOpen(true);
  };

  /* =====================================================
     EDIT POLICY
  ===================================================== */

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setIsModalOpen(true);
  };

  /* =====================================================
     DELETE POLICY
  ===================================================== */

  const handleDeletePolicy = async (policy) => {
    if (!window.confirm(t("hrCompanyPolicies.deleteConfirm"))) return;

    try {
      const response = await fetch(`${API_URL}/${policy.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
    } catch (error) {
      console.warn("API delete failed — deleting locally:", error.message);
    } finally {
      // الحذف المحلي في الحالتين (نجاح أو فشل الـ API)
      setPolicies((prev) => {
        const next = prev.filter((p) => p.id !== policy.id);
        saveLocalPolicies(next);
        return next;
      });
    }
  };

  /* =====================================================
     SAVE ADD / EDIT (API → localStorage Fallback)
  ===================================================== */

  const handleSavePolicy = async ({ title, effectiveDate, owner }) => {
    const isEditing = Boolean(editingPolicy);
    const policyId = editingPolicy?.id;

    // بناء النسخة المحلية (Fallback) لو الـ API مش شغال
    const buildLocalList = (list) =>
      isEditing
        ? list.map((p) =>
            p.id === policyId
              ? {
                  ...p,
                  translationKey: undefined,
                  title,
                  effectiveDate: effectiveDate || "N/A",
                  owner: owner || p.owner,
                  description: owner
                    ? `Owned by ${owner}`
                    : p.description || "New policy document",
                  version: p.version || "v1.0",
                }
              : p
          )
        : [
            ...list,
            {
              id: `custom-${Date.now()}`,
              title,
              effectiveDate: effectiveDate || "N/A",
              owner,
              description: owner
                ? `Owned by ${owner}`
                : "New policy document",
              version: "v1.0",
            },
          ];

    try {
      const url = isEditing ? `${API_URL}/${policyId}` : API_URL;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, effectiveDate, owner }),
      });

      if (!response.ok) throw new Error(`Save failed: ${response.status}`);

      const savedPolicy = await response.json();

      // توحيد الـ id (MongoDB بيرجع _id)
      const normalized = {
        ...savedPolicy,
        id: savedPolicy.id || savedPolicy._id,
      };

      setPolicies((prev) => {
        const next = isEditing
          ? prev.map((p) => (p.id === policyId ? normalized : p))
          : [...prev, normalized];
        saveLocalPolicies(next);
        return next;
      });
    } catch (error) {
      // الـ API فشل → تحديث محلي + حفظ في localStorage
      console.warn("API save failed — saving locally:", error.message);

      setPolicies((prev) => {
        const next = buildLocalList(prev);
        saveLocalPolicies(next);
        return next;
      });
    } finally {
      // قفل المودال في كل الأحوال
      setIsModalOpen(false);
      setEditingPolicy(null);
    }
  };

  return (
    <>
      <motion.div
        dir={isArabic ? "rtl" : "ltr"}
        className="w-full space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <motion.header
          variants={itemVariants}
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b879f]">
              HR / COMPANY POLICIES
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-[#1e293b] md:text-[21px]">
              {t("hrCompanyPolicies.title")}
            </h1>

            <p className="mt-1 text-sm font-normal text-[#64748b]">
              {t("hrCompanyPolicies.subtitle")}
            </p>
          </div>

          {/* ADD POLICY */}

          <button
            type="button"
            onClick={handleAddPolicy}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-[#243B53]
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-[#1c2f42]
            "
          >
            <Plus className="h-4 w-4" />

            <span>{t("hrCompanyPolicies.addPolicyDocument")}</span>
          </button>
        </motion.header>

        {/* =====================================================
            POLICY CARDS OR LOADING SPINNER
        ===================================================== */}

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#243B53]" />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onEdit={handleEditPolicy}
                onDelete={handleDeletePolicy}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      <AnimatePresence>
        {isModalOpen && (
          <AddPolicyModal
            onClose={() => {
              setIsModalOpen(false);
              setEditingPolicy(null);
            }}
            onSave={handleSavePolicy}
            editingPolicy={editingPolicy}
          />
        )}
      </AnimatePresence>
    </>
  );
}