import { useTranslation } from "react-i18next";
import AiTab from "../../ai/components/AiTab";

export default function AITeamInsights() {
  const { t } = useTranslation();

  return (
    <AiTab
      eyebrow={t("managerAI.breadcrumb")}
      title={t("managerAI.title")}
      subtitle={t("managerAI.subtitle")}
    />
  );
}