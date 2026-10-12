import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { LuSparkles, LuSend } from "react-icons/lu";
import { usePolicyAssistant } from "../../hooks/useAi";
import { useAiTarget } from "../../hooks/useAiTarget";
import {
  getAiLang,
  getAiErrorMessage,
  hasAiValue,
  toDisplayText,
} from "../../utils/aiHelpers";
import AiSection from "../shared/AiSection";
import { AiError } from "../shared/AiStates";

const asList = (value) => (Array.isArray(value) ? value : []);

function Chips({ title, items }) {
  if (!hasAiValue(items)) return null;
  return (
    <div className="mt-3 border-t border-[#f0f4f8] pt-2.5">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, index) => (
          <span
            key={index}
            className="max-w-full break-words rounded-full bg-[#f0f4f8] px-2.5 py-1 text-[11.5px] font-medium text-[#486581]"
          >
            {toDisplayText(item)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PolicyAssistantView() {
  const { t, i18n } = useTranslation();
  const lang = getAiLang(i18n);
  const location = useLocation();
  const navigate = useNavigate();

  // The assistant answers using the signed-in user's own record
  const { ownCode: employeeId } = useAiTarget();
  const mutation = usePolicyAssistant(lang);
  const endRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  // Opened from a Company Policies card -> prefill the question (no auto-send)
  const [input, setInput] = useState(() => {
    const state = location.state;
    if (!state?.openPolicyAssistant) return "";
    const policy = state.policyTitleKey
      ? t(state.policyTitleKey, state.policyDefaultTitle)
      : state.policyDefaultTitle;
    return policy ? t("ai.policyAssistant.prefillQuestion", { policy }) : "";
  });

  // Clear the navigation state so a refresh doesn't prefill again
  useEffect(() => {
    if (location.state?.openPolicyAssistant) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, mutation.isPending]);

  const addMessage = (message) =>
    setMessages((prev) => [
      ...prev,
      { id: `${message.role}-${Date.now()}-${prev.length}`, ...message },
    ]);

  const handleSend = (e) => {
    e.preventDefault();
    const question = input.trim();
    if (question.length < 3 || !employeeId || mutation.isPending) return;

    addMessage({ role: "user", text: question });
    setInput("");

    mutation.mutate(
      { employee_id: employeeId, question, session_id: sessionId },
      {
        onSuccess: (response) => {
          const data = response?.data ?? {};
          if (data.session_id) setSessionId(data.session_id);
          addMessage({
            role: "assistant",
            text: toDisplayText(data.answer),
            references: asList(data.policy_references),
            facts: asList(data.employee_facts_used),
          });
        },
        onError: (error) =>
          addMessage({
            role: "assistant",
            isError: true,
            text: getAiErrorMessage(error, t),
          }),
      },
    );
  };

  const pills = [t("aiAssistant.pillSickLeave"), t("aiAssistant.pillRemoteWork")];

  return (
    <div className="space-y-4">
      {!employeeId && <AiError message={t("ai.errors.noEmployeeCode")} />}

      <AiSection
        title={t("ai.policyAssistant.title")}
        subtitle={t("ai.policyAssistant.subtitle")}
        icon={LuSparkles}
      >
        <div className="max-h-[55vh] min-h-[200px] space-y-5 overflow-y-auto pe-1">
          {messages.length === 0 && !mutation.isPending && (
            <p className="py-10 text-center text-[13px] text-[#627d98]">
              {t("ai.policyAssistant.empty")}
            </p>
          )}

          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] break-words rounded-2xl bg-[#102a43] px-4 py-2.5 text-[13.5px] font-medium text-white sm:max-w-[75%]">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex justify-start">
                <div
                  className={`min-w-0 max-w-[92%] rounded-xl border p-4 sm:max-w-[80%] ${
                    msg.isError
                      ? "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
                      : "border-[#e2e8f0] bg-white text-[#243b53]"
                  }`}
                >
                  <p className="whitespace-pre-line break-words text-[13.5px] leading-relaxed">
                    {msg.text || t("ai.policyAssistant.noAnswer")}
                  </p>
                  {!msg.isError && (
                    <>
                      <Chips
                        title={t("ai.policyAssistant.policyReferences")}
                        items={msg.references}
                      />
                      <Chips
                        title={t("ai.policyAssistant.employeeFacts")}
                        items={msg.facts}
                      />
                    </>
                  )}
                </div>
              </div>
            ),
          )}

          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="animate-pulse rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-[13px] text-[#627d98]">
                {t("ai.form.generating")}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {pills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => setInput(pill)}
              className="cursor-pointer rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-1.5 text-[12px] font-medium text-[#166534] transition hover:bg-[#dcfce7]"
            >
              {pill}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSend}
          className="mt-3 flex items-center gap-2 rounded-xl border border-[#d9e2ec] bg-white p-1.5 transition focus-within:border-[#486581] focus-within:ring-1 focus-within:ring-[#486581]"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("ai.policyAssistant.placeholder")}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] text-[#102a43] placeholder-[#9fb3c8] focus:outline-none"
          />
          <button
            type="submit"
            aria-label={t("ai.policyAssistant.send")}
            disabled={
              mutation.isPending || !employeeId || input.trim().length < 3
            }
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#102a43] text-white transition hover:bg-[#243b53] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LuSend className="text-[15px] rtl:-scale-x-100" />
          </button>
        </form>
      </AiSection>
    </div>
  );
}