import { useTranslation } from "react-i18next";
import { LuInfo } from "react-icons/lu";
import { humanizeKey, toDisplayText } from "../../utils/aiHelpers";

export default function AiInsufficientData({ message, missingCategories }) {
  const { t } = useTranslation();
  const categories = Array.isArray(missingCategories) ? missingCategories : [];

  return (
    <div className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <LuInfo className="mt-0.5 shrink-0 text-[20px] text-[#c2410c]" />
        <div className="min-w-0">
          <h4 className="text-[14px] font-bold text-[#9a3412]">
            {t("ai.insufficient.title")}
          </h4>
          <p className="mt-1 break-words text-[13px] text-[#9a3412]">
            {message
              ? toDisplayText(message)
              : t("ai.insufficient.description")}
          </p>

          {categories.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c2410c]">
                {t("ai.insufficient.missing")}
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-[#fed7aa] bg-white px-3 py-1 text-[12px] font-medium text-[#9a3412]"
                  >
                    {t(`ai.insufficient.categories.${key}`, humanizeKey(key))}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}