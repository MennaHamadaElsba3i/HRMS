import { useTranslation } from "react-i18next";
import AiTab from "../../ai/components/AiTab";

export default function AIInsights() {
  const { t } = useTranslation();

  return (
    <AiTab
      title={t("aiInsights.title")}
      subtitle={t("aiInsights.subtitle")}
    />
  );
}