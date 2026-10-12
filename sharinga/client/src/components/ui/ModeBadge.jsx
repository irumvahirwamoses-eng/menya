export default function ModeBadge({ mode, className = "", withText = true }) {
  const Icon = mode.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${mode.chip} ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {withText && <span>{mode.label}</span>}
    </span>
  );
}
