import { LuInfo } from "react-icons/lu";

const tones = {
  info: "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]",
  warning: "border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]",
};

export default function AiNotice({ children, tone = "info" }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[12.5px] ${
        tones[tone] ?? tones.info
      }`}
    >
      <LuInfo className="mt-0.5 shrink-0 text-[15px]" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}