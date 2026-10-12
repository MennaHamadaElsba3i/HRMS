import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LuSparkles,
  LuUsers,
  LuFileText,
  LuLightbulb,
  LuTarget,
  LuListChecks,
} from "react-icons/lu";
import { useTeamInsight } from "../../hooks/useAi";
import { useAiEmployees } from "../../hooks/useAiEmployees";
import {
  getAiLang,
  getAiErrorMessage,
  getQuarterOptions,
  formatAiDate,
  hasAiValue,
  isInsufficientData,
} from "../../utils/aiHelpers";
import AiSection from "../shared/AiSection";
import AiValue from "../shared/AiValue";
import AiInsufficientData from "../shared/AiInsufficientData";
import AiPeriodSelect from "../shared/AiPeriodSelect";
import { AiLoading, AiError, AiEmpty } from "../shared/AiStates";
import {
  aiInputClass,
  aiLabelClass,
  aiPrimaryButtonClass,
} from "../shared/aiFormStyles";

function Kpi({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xs">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
        {label}
      </p>
      <p className="mt-1 break-words text-[20px] font-extrabold text-[#102a43]">
        {value}
      </p>
    </div>
  );
}

export default function TeamInsightView() {
  const { t, i18n } = useTranslation();
  const lang = getAiLang(i18n);
  const mutation = useTeamInsight(lang);
  const { employees } = useAiEmployees(lang);

  const [department, setDepartment] = useState("");
  const [period, setPeriod] = useState(() => getQuarterOptions()[0]);

  const departmentOptions = useMemo(
    () => [...new Set(employees.map((e) => e.department).filter(Boolean))],
    [employees],
  );

  const submit = () => {
    if (!department.trim() || !period) return;
    mutation.mutate({ department: department.trim(), period });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const data = mutation.data?.data;
  const insufficient = isInsufficientData(data);
  const hasContent =
    !insufficient &&
    (hasAiValue(data?.summary) ||
      hasAiValue(data?.top_common_skills) ||
      hasAiValue(data?.top_common_gaps) ||
      hasAiValue(data?.recommended_management_actions));

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="team-department" className={aiLabelClass}>
            {t("ai.form.department")}
          </label>
          <input
            id="team-department"
            type="text"
            list="ai-department-options"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder={t("ai.form.departmentPlaceholder")}
            className={aiInputClass}
          />
          <datalist id="ai-department-options">
            {departmentOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <AiPeriodSelect
          id="team-period"
          value={period}
          onChange={setPeriod}
        />
        <button
          type="submit"
          disabled={mutation.isPending || !department.trim() || !period}
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
          {t("ai.teamInsight.intro")}
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
          title={t("ai.teamInsight.emptyTitle")}
          description={t("ai.teamInsight.emptyDescription")}
        />
      )}

      {mutation.isSuccess && hasContent && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {data.department && (
              <Kpi label={t("ai.teamInsight.department")} value={data.department} />
            )}
            {data.period && (
              <Kpi label={t("ai.teamInsight.period")} value={data.period} />
            )}
            {data.team_size !== undefined && data.team_size !== null && (
              <Kpi label={t("ai.teamInsight.teamSize")} value={data.team_size} />
            )}
          </div>

          {hasAiValue(data.summary) && (
            <AiSection title={t("ai.teamInsight.summary")} icon={LuFileText}>
              <p className="break-words text-[13.5px] leading-relaxed text-[#243b53]">
                <AiValue value={data.summary} />
              </p>
            </AiSection>
          )}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            {hasAiValue(data.top_common_skills) && (
              <AiSection title={t("ai.teamInsight.topSkills")} icon={LuLightbulb}>
                <AiValue value={data.top_common_skills} />
              </AiSection>
            )}
            {hasAiValue(data.top_common_gaps) && (
              <AiSection title={t("ai.teamInsight.topGaps")} icon={LuTarget}>
                <AiValue value={data.top_common_gaps} />
              </AiSection>
            )}
            {hasAiValue(data.recommended_management_actions) && (
              <AiSection
                title={t("ai.teamInsight.actions")}
                icon={LuListChecks}
              >
                <AiValue value={data.recommended_management_actions} />
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