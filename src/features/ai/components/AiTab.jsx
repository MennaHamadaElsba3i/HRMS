import { Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import { getAiFeaturesForRole } from "../config/aiFeatures";
import { AI_FEATURE_VIEWS } from "../config/aiFeatureViews";
import AiErrorBoundary from "./shared/AiErrorBoundary";

export default function AiTab({ eyebrow, title, subtitle, initialFeature }) {
  const { t } = useTranslation();
  const { role } = useAuth();

  // Only the features this role is allowed to see
  const features = useMemo(() => getAiFeaturesForRole(role), [role]);

  const [activeKey, setActiveKey] = useState(
    () =>
      features.find((f) => f.key === initialFeature)?.key ??
      features[0]?.key,
  );

  if (features.length === 0) return null;

  const active = features.find((f) => f.key === activeKey) ?? features[0];
  const View = AI_FEATURE_VIEWS[active.key];

  return (
    <div className="mx-auto w-full max-w-[1400px] min-w-0 font-sans text-[#102a43]">
      {/* Header */}
      <div className="mb-6">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#5b8c6a]">
          {eyebrow ?? t("ai.tag")}
        </span>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#102a43] sm:text-[30px]">
          {title ?? t("ai.title")}
        </h1>
        <p className="mt-1 text-[13px] text-[#627d98] sm:text-[14px]">
          {subtitle ?? t("ai.subtitle")}
        </p>
      </div>

      {/* Feature switcher (wraps on small screens, no horizontal overflow) */}
      <div role="tablist" className="mb-7 flex flex-wrap gap-2">
        {features.map(({ key, labelKey, icon: Icon }) => {
          const isActive = key === active.key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveKey(key)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${
                isActive
                  ? "bg-[#102a43] text-white shadow-xs"
                  : "border border-[#d9e2ec] bg-white text-[#486581] hover:border-[#9fb3c8] hover:bg-[#f8fafc]"
              }`}
            >
              <Icon className="text-[16px]" />
              <span>{t(labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Active feature (key resets its state when switching) */}
      <Suspense
        fallback={
          <p className="text-[13px] text-[#627d98]">{t("ai.loading")}</p>
        }
      >
        {View ? (
          <AiErrorBoundary key={active.key}>
    <View />
  </AiErrorBoundary>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d9e2ec] bg-white p-6 text-[13px] text-[#627d98]">
            {t("ai.comingSoon")}
          </div>
        )}
      </Suspense>
    </div>
  );
}