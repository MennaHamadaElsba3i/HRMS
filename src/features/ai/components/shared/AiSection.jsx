export default function AiSection({
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs sm:p-6 ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6f4ea] text-[#137333]">
            <Icon className="text-[16px]" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold leading-tight text-[#102a43]">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[12.5px] text-[#627d98]">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}