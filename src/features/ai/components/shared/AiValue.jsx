import { hasAiValue, humanizeKey } from "../../utils/aiHelpers";

export default function AiValue({ value }) {
  if (!hasAiValue(value)) return null;

  if (Array.isArray(value)) {
    return (
      <ul className="space-y-2">
        {value.filter(hasAiValue).map((item, index) => {
          const isPrimitive = typeof item !== "object";
          return (
            <li
              key={index}
              className={
                isPrimitive
                  ? "flex items-start gap-2.5 text-[13.5px] text-[#243b53]"
                  : "rounded-lg border border-[#edf2f7] bg-[#f8fafc] p-3"
              }
            >
              {isPrimitive && (
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f766e]" />
              )}
              <div className="min-w-0 break-words">
                <AiValue value={item} />
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => hasAiValue(v));
    return (
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {entries.map(([key, v]) => (
          <div key={key} className="min-w-0">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-[#829ab1]">
              {humanizeKey(key)}
            </dt>
            <dd className="mt-0.5 break-words text-[13.5px] text-[#243b53]">
              <AiValue value={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span className="break-words">{String(value)}</span>;
}