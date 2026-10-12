import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LuSparkles,
  LuCheck,
  LuTarget,
  LuListOrdered,
  LuFlag,
} from "react-icons/lu";
import { useCareerCoach } from "../../hooks/useAi";
import { useAiTarget } from "../../hooks/useAiTarget";
import {
  getAiLang,
  getQuarterOptions,
  getAiErrorMessage,
  formatAiDate,
  hasAiValue,
  humanizeKey,
  isInsufficientData,
  toDisplayText,
} from "../../utils/aiHelpers";
import AiSection from "../shared/AiSection";
import AiEmployeePicker from "../shared/AiEmployeePicker";
import AiInsufficientData from "../shared/AiInsufficientData";
import { AiLoading, AiError, AiEmpty } from "../shared/AiStates";
import { aiInputClass, aiLabelClass } from "../shared/aiFormStyles";

// Items can be { title, description, evidence[], priority } or a plain string
const asItem = (item) =>
  item && typeof item === "object" ? item : { title: toDisplayText(item) };

const asList = (value) => (Array.isArray(value) ? value.filter(hasAiValue) : []);

const priorityStyles = {
  high: "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]",
  medium: "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
  low: "border-[#bbf7d0] bg-[#ecfdf5] text-[#16a34a]",
};

function PriorityBadge({ priority }) {
  const { t } = useTranslation();
  if (!priority) return null;
  const key = String(priority).toLowerCase();

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
        priorityStyles[key] ?? "border-[#d9e2ec] bg-[#f8fafc] text-[#486581]"
      }`}
    >
      {t(`ai.careerCoach.priorities.${key}`, humanizeKey(key))}
    </span>
  );
}

function Evidence({ items }) {
  const { t } = useTranslation();
  const list = asList(items);
  if (list.length === 0) return null;

  return (
    <details className="group mt-3">
      <summary className="cursor-pointer select-none text-[12px] font-semibold text-[#0f766e] hover:underline">
        {t("ai.careerCoach.evidence")} ({list.length})
      </summary>
      <ul className="mt-2 space-y-2">
        {list.map((ev, index) => {
          const item = asItem(ev);
          return (
            <li
              key={index}
              className="rounded-lg border border-[#edf2f7] bg-[#f8fafc] p-2.5"
            >
              {item.source_type && (
                <span className="mb-1 inline-block rounded bg-[#e2e8f0] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#486581]">
                  {humanizeKey(item.source_type)}
                </span>
              )}
              <p className="break-words text-[12.5px] text-[#334e68]">
                {toDisplayText(item.claim ?? item.title)}
              </p>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function InsightCard({ item, accent }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e2e8f0] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 break-words text-[14px] font-bold text-[#102a43]">
          {toDisplayText(item.title)}
        </h4>
        <PriorityBadge priority={item.priority} />
      </div>
      {hasAiValue(item.description) && (
        <p className="mt-1.5 break-words text-[13px] leading-relaxed text-[#486581]">
          {toDisplayText(item.description)}
        </p>
      )}
      <Evidence items={item.evidence} />
      <span className={`mt-3 block h-0.5 w-8 rounded-full ${accent}`} />
    </div>
  );
}

export default function CareerCoachView() {
  const { t, i18n } = useTranslation();
const lang = getAiLang(i18n);
const mutation = useCareerCoach(lang);
const last = mutation.lastRequest; // restored after a refresh

// Employee: own code. Others: the employee picked in the form.
const target = useAiTarget(last?.employee_id);
const employeeId = target.employeeId;

const [period, setPeriod] = useState(last?.period ?? "");
const periods = useMemo(() => getQuarterOptions(), []);

  const submit = () => {
    if (!employeeId) return;
    mutation.mutate({ employee_id: employeeId, period: period || null });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const data = mutation.data?.data;
  const strengths = asList(data?.strengths);
  const areas = asList(data?.development_areas);
  const plan = asList(data?.development_plan);
  const followUp = data?.follow_up ?? {};

  const insufficient = isInsufficientData(data);
  const hasContent =
    !insufficient &&
    (hasAiValue(data?.development_focus) ||
      strengths.length > 0 ||
      areas.length > 0 ||
      plan.length > 0 ||
      hasAiValue(followUp.checkpoint) ||
      hasAiValue(followUp.review_focus));

  return (
    <div className="space-y-6">
      {/* Request form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs sm:flex-row sm:items-end"
      >
        <AiEmployeePicker target={target} />

        <div className="min-w-0 flex-1">
          <label htmlFor="career-period" className={aiLabelClass}>
            {t("ai.form.period")}
          </label>
          <select
            id="career-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={aiInputClass}
          >
            <option value="">{t("ai.form.noPeriod")}</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !employeeId}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#102a43] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#243b53] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LuSparkles className="text-[15px]" />
          {mutation.isPending ? t("ai.form.generating") : t("ai.form.generate")}
        </button>
      </form>

      {target.isSelf && !employeeId && (
        <AiError message={t("ai.errors.noEmployeeCode")} />
      )}

      {mutation.isIdle && (
        <p className="text-[13px] text-[#627d98]">
          {t("ai.careerCoach.intro")}
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
          title={t("ai.careerCoach.emptyTitle")}
          description={t("ai.careerCoach.emptyDescription")}
        />
      )}

      {mutation.isSuccess && hasContent && (
        <div className="space-y-6">
          {/* Development focus */}
          {hasAiValue(data.development_focus) && (
            <div className="relative overflow-hidden rounded-2xl bg-[#102a43] p-6 text-white shadow-xs sm:p-8">
              <div className="pointer-events-none absolute -top-10 end-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d1fae5] text-[#065f46]">
                  <LuSparkles className="text-[20px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#9fb3c8]">
                    {t("ai.careerCoach.developmentFocus")}
                  </p>
                  <h2 className="mt-1.5 break-words text-[18px] font-bold leading-snug sm:text-[21px] text-white">
                    {toDisplayText(data.development_focus)}
                  </h2>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            {strengths.length > 0 && (
              <AiSection title={t("ai.careerCoach.strengths")} icon={LuCheck}>
                <div className="space-y-3">
                  {strengths.map((item, index) => (
                    <InsightCard
                      key={index}
                      item={asItem(item)}
                      accent="bg-[#16a34a]"
                    />
                  ))}
                </div>
              </AiSection>
            )}

            {areas.length > 0 && (
              <AiSection
                title={t("ai.careerCoach.developmentAreas")}
                icon={LuTarget}
              >
                <div className="space-y-3">
                  {areas.map((item, index) => (
                    <InsightCard
                      key={index}
                      item={asItem(item)}
                      accent="bg-[#d97706]"
                    />
                  ))}
                </div>
              </AiSection>
            )}
          </div>

          {plan.length > 0 && (
            <AiSection
              title={t("ai.careerCoach.developmentPlan")}
              icon={LuListOrdered}
            >
              <ol className="space-y-4">
                {plan.map((step, index) => {
                  const item =
                    step && typeof step === "object"
                      ? step
                      : { action: toDisplayText(step) };

                  return (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#102a43] text-[12px] font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 rounded-xl border border-[#e2e8f0] p-4">
                        <p className="break-words text-[14px] font-bold text-[#102a43]">
                          {toDisplayText(item.action)}
                        </p>
                        {hasAiValue(item.reason) && (
                          <p className="mt-1.5 break-words text-[13px] text-[#486581]">
                            {toDisplayText(item.reason)}
                          </p>
                        )}
                        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {hasAiValue(item.measurable_target) && (
                            <div className="min-w-0">
                              <dt className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
                                {t("ai.careerCoach.measurableTarget")}
                              </dt>
                              <dd className="mt-0.5 break-words text-[13px] text-[#243b53]">
                                {toDisplayText(item.measurable_target)}
                              </dd>
                            </div>
                          )}
                          {hasAiValue(item.suggested_timeline) && (
                            <div className="min-w-0">
                              <dt className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
                                {t("ai.careerCoach.timeline")}
                              </dt>
                              <dd className="mt-0.5 break-words text-[13px] text-[#243b53]">
                                {toDisplayText(item.suggested_timeline)}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </AiSection>
          )}

          {(hasAiValue(followUp.checkpoint) ||
            hasAiValue(followUp.review_focus)) && (
            <AiSection title={t("ai.careerCoach.followUp")} icon={LuFlag}>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {hasAiValue(followUp.checkpoint) && (
                  <div className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
                      {t("ai.careerCoach.checkpoint")}
                    </dt>
                    <dd className="mt-1 break-words text-[13.5px] text-[#243b53]">
                      {toDisplayText(followUp.checkpoint)}
                    </dd>
                  </div>
                )}
                {hasAiValue(followUp.review_focus) && (
                  <div className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
                      {t("ai.careerCoach.reviewFocus")}
                    </dt>
                    <dd className="mt-1 break-words text-[13.5px] text-[#243b53]">
                      {toDisplayText(followUp.review_focus)}
                    </dd>
                  </div>
                )}
              </dl>
            </AiSection>
          )}

          {data.created_at && (
            <p className="text-[11.5px] text-[#829ab1]">
              {t("ai.careerCoach.generatedAt")}:{" "}
              {formatAiDate(data.created_at, lang)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}