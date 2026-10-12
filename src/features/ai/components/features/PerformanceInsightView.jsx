import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LuSparkles,
  LuShieldCheck,
  LuTrendingUp,
  LuLightbulb,
  LuListChecks,
} from "react-icons/lu";
import { usePerformanceInsight } from "../../hooks/useAi";
import { useAiTarget } from "../../hooks/useAiTarget";
import {
  getAiLang,
  getAiErrorMessage,
  getQuarterOptions,
  isInsufficientData,
  formatAiDate,
  hasAiValue,
  humanizeKey,
} from "../../utils/aiHelpers";
import AiInsufficientData from "../shared/AiInsufficientData";
import AiSection from "../shared/AiSection";
import AiNotice from "../shared/AiNotice";
import AiValue from "../shared/AiValue";
import AiEmployeePicker from "../shared/AiEmployeePicker";
import AiPeriodSelect from "../shared/AiPeriodSelect";
import { AiLoading, AiError, AiEmpty } from "../shared/AiStates";
import { aiPrimaryButtonClass } from "../shared/aiFormStyles";

export default function PerformanceInsightView() {
  const { t, i18n } = useTranslation();
  const lang = getAiLang(i18n);
  const target = useAiTarget();
  const mutation = usePerformanceInsight(lang);

  const [period, setPeriod] = useState(() => getQuarterOptions()[0]);

  const submit = () => {
    if (!target.employeeId || !period) return;
    mutation.mutate({ employee_id: target.employeeId, period });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const data = mutation.data?.data;
     const insufficient = isInsufficientData(data);
  const rawFacts = data?.verified_facts;
  const facts =
    rawFacts && typeof rawFacts === "object" && !Array.isArray(rawFacts)
      ? rawFacts
      : {};
  const { target_period: targetPeriod, ...restFacts } = facts;

  const sections = [
    {
      key: "facts",
      title: t("ai.performanceInsight.verifiedFacts"),
      icon: LuShieldCheck,
      value: restFacts,
    },
    {
      key: "trends",
      title: t("ai.performanceInsight.trends"),
      icon: LuTrendingUp,
      value: data?.calculated_trends,
    },
    {
      key: "interpretation",
      title: t("ai.performanceInsight.interpretation"),
      icon: LuLightbulb,
      value: data?.interpretation,
    },
    {
      key: "actions",
      title: t("ai.performanceInsight.recommendedActions"),
      icon: LuListChecks,
      value: data?.recommended_actions,
    },
  ].filter((section) => hasAiValue(section.value));

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs sm:flex-row sm:items-end"
      >
        <AiEmployeePicker target={target} />
        <AiPeriodSelect
          id="performance-period"
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

      {target.isSelf && !target.employeeId && (
        <AiError message={t("ai.errors.noEmployeeCode")} />
      )}

      {mutation.isIdle && (
        <p className="text-[13px] text-[#627d98]">
          {t("ai.performanceInsight.intro")}
        </p>
      )}

      {mutation.isPending && <AiLoading />}

      {mutation.isError && (
        <AiError
          message={getAiErrorMessage(mutation.error, t)}
          onRetry={submit}
        />
      )}

      {mutation.isSuccess && (
        <div className="space-y-6">
          {data?.status && data.status !== "success" && !insufficient && (
            <AiNotice tone="warning">
              {t("ai.performanceInsight.statusNote", {
                status: humanizeKey(data.status),
              })}
            </AiNotice>
          )}

             {insufficient ? (
     <AiInsufficientData
       message={data.message}
       missingCategories={data.missing_categories}
     />
   ) : sections.length === 0 ? (
            <AiEmpty
              title={t("ai.performanceInsight.emptyTitle")}
              description={t("ai.performanceInsight.emptyDescription")}
            />
          ) : (
            <>
              {targetPeriod && (
                <div className="inline-flex items-center rounded-full bg-[#102a43] px-4 py-1.5 text-[12.5px] font-semibold text-white">
                  {t("ai.performanceInsight.targetPeriod")}: {targetPeriod}
                </div>
              )}

              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                {sections.map(({ key, title, icon, value }) => (
                  <AiSection key={key} title={title} icon={icon}>
                    <AiValue value={value} />
                  </AiSection>
                ))}
              </div>
            </>
          )}

          {data?.created_at && (
            <p className="text-[11.5px] text-[#829ab1]">
              {t("ai.generatedAt")}: {formatAiDate(data.created_at, lang)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}