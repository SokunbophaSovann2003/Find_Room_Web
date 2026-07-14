import Icon, { type IconName } from "@/components/Icon";

// Compact metric card used by the admin rooms dashboard and the user's own
// profile listings summary. Keeps the two visually identical.
export default function StatCard({
  label,
  value,
  hint,
  icon,
  highlight = false
}: {
  label: string;
  value: number;
  hint?: string;
  icon: IconName;
  highlight?: boolean;
}) {
  return (
    <div className={`card flex flex-col items-center gap-1.5 p-3 text-center sm:gap-2 sm:p-4 ${highlight ? "border-sky-200 ring-1 ring-sky-200" : ""}`}>
      <p className={`text-xl font-extrabold tracking-tight sm:text-2xl ${highlight ? "text-sky-600" : ""}`}>{value}</p>
      <div className="flex w-full items-center justify-center gap-1 sm:justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft sm:text-xs">
          {label}
        </span>
        <span className={`hidden h-8 w-8 flex-none items-center justify-center rounded-lg sm:flex ${highlight ? "bg-sky-100 text-sky-600" : "bg-brand/10 text-brand"}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      {hint ? <p className="text-[10px] leading-tight text-ink-muted sm:text-[11px]">{hint}</p> : null}
    </div>
  );
}
