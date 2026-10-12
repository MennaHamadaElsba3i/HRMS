import { useTranslation } from "react-i18next";
import { useAiEmployees } from "../../hooks/useAiEmployees";
import { getAiLang } from "../../utils/aiHelpers";
import { aiInputClass, aiLabelClass } from "./aiFormStyles";

// Hidden for Employee (always their own record).
export default function AiEmployeePicker({ target }) {
  const { t, i18n } = useTranslation();
  const { employees, isLoading } = useAiEmployees(getAiLang(i18n));

  if (target.isSelf) return null;

  const hasList = employees.length > 0;

  return (
    <div className="min-w-0 flex-1">
      <label htmlFor="ai-employee" className={aiLabelClass}>
        {t("ai.form.employee")}
      </label>

      {hasList ? (
        <select
          id="ai-employee"
          value={target.selectedId}
          onChange={(e) => target.setSelectedId(e.target.value)}
          className={aiInputClass}
        >
          <option value="">{t("ai.form.selectEmployee")}</option>
          {employees.map((emp) => (
            <option key={emp.code} value={emp.code}>
              {emp.name ? `${emp.name} — ${emp.code}` : emp.code}
            </option>
          ))}
        </select>
      ) : (
        <input
          id="ai-employee"
          type="text"
          dir="ltr"
          value={target.selectedId}
          onChange={(e) => target.setSelectedId(e.target.value)}
          placeholder={
            isLoading
              ? t("ai.form.loadingEmployees")
              : t("ai.form.employeePlaceholder")
          }
          className={aiInputClass}
        />
      )}
    </div>
  );
}