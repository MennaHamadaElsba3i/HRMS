import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LuSparkles,
  LuShieldAlert,
  LuActivity,
  LuListChecks,
} from "react-icons/lu";
import { useAttentionSignal } from "../../hooks/useAi";
import { useAiTarget } from "../../hooks/useAiTarget";
import {
  getAiLang,
  getAiErrorMessage,
  getQuarterOptions,
  formatAiDate,
  hasAiValue,
  humanizeKey,
  isInsufficientData,
} from "../../utils/aiHelpers";
import AiSection from "../shared/AiSection";
import AiNotice from "../shared/AiNotice";
import AiValue from "../shared/AiValue";
import AiInsufficientData from "../shared/AiInsufficientData";
import AiEmployeePicker from "../shared/AiEmployeePicker";
import AiPeriodSelect from "../shared/AiPeriodSelect";
import { AiLoading, AiError, AiEmpty } from "../shared/AiStates";
import { aiPrimaryButtonClass } from "../shared/aiFormStyles";

const levelStyles = {
  high: "border border-[#fecaca] bg-[#fef2f2] text-[#dc2626]",
  medium: "border border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
  low: "border border-[#bbf7d0] bg-[#ecfdf5] text-[#16a34a]",
};

export default function AttentionSignalView() {
  const { t, i18n } = useTranslation();
  const lang = getAiLang(i18n);
  const target = useAiTarget();
  const mutation = useAttentionSignal(lang);

  const [period, setPeriod] = useState(() => getQuarterOptions()[0]);

  const submit = () => {
    if (!target.employeeId || !period) return;
    mutation.mutate({ employee_id: target.employeeId, target_period: period });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const data = mutation.data?.data;
  const insufficient = isInsufficientData(data);
  const levelKey = String(data?.attention_level ?? "").toLowerCase();
  const hasContent =
    !insufficient &&
    (Boolean(levelKey) ||
      hasAiValue(data?.explanation) ||
      hasAiValue(data?.contributing_indicators) ||
      hasAiValue(data?.recommended_follow_up));

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs sm:flex-row sm:items-end"
      >
        <AiEmployeePicker target={target} />
        <AiPeriodSelect
          id="attention-period"
          value={period}
          onChange={setPeriod}
        />
        <button
          type="submit"
          disabled={mutation.isPending || !target.employeeId || !period}
          className={aiPrimaryButtonClass}
        >
          <LuSparkles className="text-[15px]" />
          {mutation.isPending
            ? t("ai.form.generating")
            : t("ai.form.generate")}
        </button>
      </form>

      {mutation.isIdle && (
        <p className="text-[13px] text-[#627d98]">
          {t("ai.attentionSignal.intro")}
        </p>
      )}

      {mutation.isPending && <AiLoading />}

      {mutation.isError && (
        <AiError
          message={getAiErrorMessage(mutation.error, t)}
          onRetry={submit}
        />
      )}

      {mutation.isSuccess && insufficient && (
        <AiInsufficientData
          message={data.message}
          missingCategories={data.missing_categories}
        />
      )}

      {mutation.isSuccess && !insufficient && !hasContent && (
        <AiEmpty
          title={t("ai.attentionSignal.emptyTitle")}
          description={t("ai.attentionSignal.emptyDescription")}
        />
      )}

      {mutation.isSuccess && hasContent && (
        <div className="space-y-6">
          {(data.advisory_only === true ||
            data.human_review_required === true) && (
            <AiNotice tone="warning">
              {[
                data.advisory_only === true && t("ai.attentionSignal.advisory"),
                data.human_review_required === true &&
                  t("ai.attentionSignal.humanReview"),
              ]
                .filter(Boolean)
                .join(" ")}
            </AiNotice>
          )}

          <AiSection
            title={t("ai.attentionSignal.level")}
            icon={LuShieldAlert}
          >
            <div className="flex flex-wrap items-center gap-3">
              {levelKey && (
                <span
                  className={`rounded-full px-4 py-1.5 text-[13px] font-bold ${
                    levelStyles[levelKey] ??
                    "border border-[#d9e2ec] bg-[#f8fafc] text-[#486581]"
                  }`}
                >
                  {t(
                    `ai.attentionSignal.levels.${levelKey}`,
                    humanizeKey(levelKey),
                  )}
                </span>
              )}
              {data.target_period && (
                <span className="text-[12.5px] text-[#627d98]">
                  {t("ai.attentionSignal.targetPeriod")}: {data.target_period}
                </span>
              )}
              {data.comparison_period && (
                <span className="text-[12.5px] text-[#627d98]">
                  {t("ai.attentionSignal.comparisonPeriod")}:{" "}
                  {data.comparison_period}
                </span>
              )}
            </div>
            {hasAiValue(data.explanation) && (
              <p className="mt-4 break-words text-[13.5px] leading-relaxed text-[#243b53]">
                <AiValue value={data.explanation} />
              </p>
            )}
          </AiSection>

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            {hasAiValue(data.contributing_indicators) && (
              <AiSection
                title={t("ai.attentionSignal.indicators")}
                icon={LuActivity}
              >
                <AiValue value={data.contributing_indicators} />
              </AiSection>
            )}
            {hasAiValue(data.recommended_follow_up) && (
              <AiSection
                title={t("ai.attentionSignal.followUp")}
                icon={LuListChecks}
              >
                <AiValue value={data.recommended_follow_up} />
              </AiSection>
            )}
          </div>

          {data.created_at && (
            <p className="text-[11.5px] text-[#829ab1]">
              {t("ai.generatedAt")}: {formatAiDate(data.created_at, lang)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}