import { useLocation } from "react-router-dom";
import AiTab from "../../ai/components/AiTab";

export default function AIAssistant() {
  const location = useLocation();

  return (
    <AiTab
      initialFeature={
        location.state?.openPolicyAssistant ? "policyAssistant" : undefined
      }
    />
  );
}