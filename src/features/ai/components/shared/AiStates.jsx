import { useTranslation } from "react-i18next";
import { LuShieldAlert, LuInbox } from "react-icons/lu";

export function AiLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-32 animate-pulse rounded-xl bg-[#e2e8f0]" />
      <div className="h-24 animate-pulse rounded-xl bg-[#edf2f7]" />
      <div className="h-24 animate-pulse rounded-xl bg-[#edf2f7]" />
    </div>
  );
}

export function AiError({ message, onRetry }) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-5 sm:flex-row sm:items-center"
    >
      <LuShieldAlert className="shrink-0 text-[20px] text-[#dc2626]" />
      <p className="min-w-0 flex-1 break-words text-[13px] text-[#991b1b]">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer rounded-lg border border-[#fecaca] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#991b1b] transition hover:bg-[#fff5f5]"
        >
          {t("ai.errors.retry")}
        </button>
      )}
    </div>
  );
}

export function AiEmpty({ title, description }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-[#d9e2ec] bg-white px-6 py-10 text-center">
      <LuInbox className="mb-3 text-[28px] text-[#9fb3c8]" />
      <h4 className="text-[14px] font-bold text-[#102a43]">{title}</h4>
      {description && (
        <p className="mt-1 max-w-md text-[12.5px] text-[#627d98]">
          {description}
        </p>
      )}
    </div>
  );
}