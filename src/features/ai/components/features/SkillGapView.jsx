import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuSparkles, LuTarget, LuLightbulb } from "react-icons/lu";
import { useSkillGap } from "../../hooks/useAi";
import { useAiTarget } from "../../hooks/useAiTarget";
import {
  getAiLang,
  getAiErrorMessage,
  formatAiDate,
  hasAiValue,
  isInsufficientData
} from "../../utils/aiHelpers";
import AiSection from "../shared/AiSection";
import AiNotice from "../shared/AiNotice";
import AiValue from "../shared/AiValue";
import AiEmployeePicker from "../shared/AiEmployeePicker";
import AiPeriodSelect from "../shared/AiPeriodSelect";
import { AiLoading, AiError, AiEmpty } from "../shared/AiStates";
import {
  aiInputClass,
  aiLabelClass,
  aiPrimaryButtonClass,
} from "../shared/aiFormStyles";
import AiInsufficientData from "../shared/AiInsufficientData";

export default function SkillGapView() {
  const { t, i18n } = useTranslation();
  const lang = getAiLang(i18n);
  const mutation = useSkillGap(lang);
  const last = mutation.lastRequest; // restored after a refresh
  const target = useAiTarget(last?.employee_id);

  const [period, setPeriod] = useState(last?.period ?? "");
  const [targetRole, setTargetRole] = useState(last?.target_role ?? "");
  const [targetSkills, setTargetSkills] = useState(
    Array.isArray(last?.target_skills) ? last.target_skills.join(", ") : "",
  );

  const submit = () => {
    if (!target.employeeId) return;

    const skills = targetSkills
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const body = { employee_id: target.employeeId, period: period || null };
    if (targetRole.trim()) body.target_role = targetRole.trim();
    if (skills.length) body.target_skills = skills;

    mutation.mutate(body);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const data = mutation.data?.data;
  const insufficient = isInsufficientData(data);
  const hasContent =
    !insufficient &&
    (hasAiValue(data?.skill_gaps) || hasAiValue(data?.recommendations));

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AiEmployeePicker target={target} />
          <AiPeriodSelect
            id="skillgap-period"
            value={period}
            onChange={setPeriod}
            optional
          />
          <div className="min-w-0">
            <label htmlFor="skillgap-role" className={aiLabelClass}>
              {t("ai.form.targetRole")}{" "}
              <span className="font-normal text-[#829ab1]">
                ({t("ai.form.optional")})
              </span>
            </label>
            <input
              id="skillgap-role"
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder={t("ai.form.targetRolePlaceholder")}
              className={aiInputClass}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="skillgap-skills" className={aiLabelClass}>
              {t("ai.form.targetSkills")}{" "}
              <span className="font-normal text-[#829ab1]">
                ({t("ai.form.optional")})
              </span>
            </label>
            <input
              id="skillgap-skills"
              type="text"
              value={targetSkills}
              onChange={(e) => setTargetSkills(e.target.value)}
              placeholder={t("ai.form.targetSkillsPlaceholder")}
              className={aiInputClass}
            />
            <p className="mt-1 text-[11.5px] text-[#829ab1]">
              {t("ai.form.targetSkillsHint")}
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending || !target.employeeId}
            className={aiPrimaryButtonClass}
          >
            <LuSparkles className="text-[15px]" />
            {mutation.isPending
              ? t("ai.form.generating")
              : t("ai.form.generate")}
          </button>
        </div>
      </form>

      {target.isSelf && !target.employeeId && (
        <AiError message={t("ai.errors.noEmployeeCode")} />
      )}

      {mutation.isIdle && (
        <p className="text-[13px] text-[#627d98]">{t("ai.skillGap.intro")}</p>
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
          title={t("ai.skillGap.emptyTitle")}
          description={t("ai.skillGap.emptyDescription")}
        />
      )}

      {mutation.isSuccess && hasContent && (
        <div className="space-y-6">
          {data?.target_role && (
            <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#102a43] px-4 py-1.5 text-[12.5px] font-semibold text-white">
              <LuTarget className="shrink-0" />
              <span className="min-w-0 break-words">
                {t("ai.skillGap.targetRole")}: {data.target_role}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            {hasAiValue(data?.skill_gaps) && (
              <AiSection title={t("ai.skillGap.skillGaps")} icon={LuTarget}>
                <AiValue value={data.skill_gaps} />
              </AiSection>
            )}
            {hasAiValue(data?.recommendations) && (
              <AiSection
                title={t("ai.skillGap.recommendations")}
                icon={LuLightbulb}
              >
                <AiValue value={data.recommendations} />
              </AiSection>
            )}
          </div>

          {hasAiValue(data?.disclaimer) && (
            <AiNotice tone="warning">
              <AiValue value={data.disclaimer} />
            </AiNotice>
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