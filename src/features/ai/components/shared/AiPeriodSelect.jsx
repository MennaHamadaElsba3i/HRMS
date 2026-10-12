import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getQuarterOptions } from "../../utils/aiHelpers";
import { aiInputClass, aiLabelClass } from "./aiFormStyles";

export default function AiPeriodSelect({
  id,
  value,
  onChange,
  optional = false,
}) {
  const { t } = useTranslation();
  const periods = useMemo(() => getQuarterOptions(), []);

  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className={aiLabelClass}>
        {t("ai.form.period")}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={aiInputClass}
      >
        {optional && <option value="">{t("ai.form.noPeriod")}</option>}
        {periods.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
}