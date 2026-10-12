import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuSparkles, LuFileText, LuCheck, LuTarget } from "react-icons/lu";
import { useEvaluationDraft } from "../../hooks/useAi";
import { useAiTarget } from "../../hooks/useAiTarget";
import {
  getAiLang,
  getAiErrorMessage,
  getQuarterOptions,
  formatAiDate,
  hasAiValue,
  isInsufficientData,
} from "../../utils/aiHelpers";
import AiSection from "../shared/AiSection";
import AiNotice from "../shared/AiNotice";
import AiValue from "../shared/AiValue";
import AiInsufficientData from "../shared/AiInsufficientData";
import AiEmployeePicker from "../shared/AiEmployeePicker";
import AiPeriodSelect from "../shared/AiPeriodSelect";
import { AiLoading, AiError, AiEmpty } from "../shared/AiStates";
import {
  aiInputClass,
  aiLabelClass,
  aiPrimaryButtonClass,
} from "../shared/aiFormStyles";

// Editable copy of the generated narrative (not saved anywhere automatically)
function DraftNarrative({ initial }) {
  const [text, setText] = useState(initial);
  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      rows={8}
      className={`${aiInputClass} resize-y leading-relaxed`}
    />
  );
}

export default function EvaluationDraftView() {
  const { t, i18n } = useTranslation();
  const lang = getAiLang(i18n);
  const target = useAiTarget();
  const mutation = useEvaluationDraft(lang);

  const [period, setPeriod] = useState(() => getQuarterOptions()[0]);
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");

  const scoreValue = Number(score);
  const canSubmit =
    Boolean(target.employeeId) &&
    Boolean(period) &&
    score !== "" &&
    Number.isFinite(scoreValue);

  const submit = () => {
    if (!canSubmit) return;
    const body = {
      employee_id: target.employeeId,
      period,
      evaluation_scores: { overall_score: scoreValue },
    };
    if (notes.trim()) body.manager_notes = notes.trim();
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
    (hasAiValue(data?.evaluation_narrative) ||
      hasAiValue(data?.strengths) ||
      hasAiValue(data?.improvement_areas));

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AiEmployeePicker target={target} />
          <AiPeriodSelect
            id="evaldraft-period"
            value={period}
            onChange={setPeriod}
          />
          <div className="min-w-0">
            <label htmlFor="evaldraft-score" className={aiLabelClass}>
              {t("ai.form.overallScore")}
            </label>
            <input
              id="evaldraft-score"
              type="number"
              min="0"
              step="any"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className={aiInputClass}
            />
            <p className="mt-1 text-[11.5px] text-[#829ab1]">
              {t("ai.form.overallScoreHint")}
            </p>
          </div>
          <div className="min-w-0 md:col-span-2">
            <label htmlFor="evaldraft-notes" className={aiLabelClass}>
              {t("ai.form.managerNotes")}{" "}
              <span className="font-normal text-[#829ab1]">
                ({t("ai.form.optional")})
              </span>
            </label>
            <textarea
              id="evaldraft-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("ai.form.managerNotesPlaceholder")}
              className={`${aiInputClass} resize-y`}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending || !canSubmit}
            className={aiPrimaryButtonClass}
          >
            <LuSparkles className="text-[15px]" />
            {mutation.isPending
              ? t("ai.form.generating")
              : t("ai.form.generate")}
          </button>
        </div>
      </form>

      {mutation.isIdle && (
        <p className="text-[13px] text-[#627d98]">
          {t("ai.evaluationDraft.intro")}
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
          title={t("ai.evaluationDraft.emptyTitle")}
          description={t("ai.evaluationDraft.emptyDescription")}
        />
      )}

      {mutation.isSuccess && hasContent && (
        <div className="space-y-6">
          {data.human_review_required === true && (
            <AiNotice tone="warning">
              {t("ai.evaluationDraft.humanReview")}
            </AiNotice>
          )}

          {hasAiValue(data.evaluation_narrative) && (
            <AiSection
              title={t("ai.evaluationDraft.narrative")}
              subtitle={t("ai.evaluationDraft.editableHint")}
              icon={LuFileText}
            >
              <DraftNarrative
                key={data.created_at ?? "draft"}
                initial={String(data.evaluation_narrative)}
              />
            </AiSection>
          )}

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            {hasAiValue(data.strengths) && (
              <AiSection
                title={t("ai.evaluationDraft.strengths")}
                icon={LuCheck}
              >
                <AiValue value={data.strengths} />
              </AiSection>
            )}
            {hasAiValue(data.improvement_areas) && (
              <AiSection
                title={t("ai.evaluationDraft.improvementAreas")}
                icon={LuTarget}
              >
                <AiValue value={data.improvement_areas} />
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