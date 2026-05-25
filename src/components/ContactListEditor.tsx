"use client";

import Icon from "./Icon";
import { useT } from "@/lib/language";

// Editable list of contact strings (phone numbers, Telegram handles, etc.).
// Used in the create-room form so each listing publishes its own contacts.
export default function ContactListEditor({
  label,
  iconName,
  placeholder,
  values,
  onChange,
  addLabel,
  emptyHint
}: {
  label: string;
  iconName: React.ComponentProps<typeof Icon>["name"];
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  emptyHint?: string;
}) {
  const t = useT();
  function update(i: number, val: string) {
    onChange(values.map((v, idx) => (idx === i ? val : v)));
  }
  function remove(i: number) {
    const next = values.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [""]);
  }
  function add() {
    onChange([...values, ""]);
  }
  return (
    <div>
      <span className="label flex items-center gap-1.5">
        <Icon name={iconName} className="h-4 w-4 text-brand" />
        {label}
      </span>
      <ul className="space-y-2">
        {values.map((v, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              className="input flex-1"
              value={v}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              inputMode="tel"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={t("contactList.remove.aria", { label, n: i + 1 })}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-slate-100 hover:text-ink"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand"
      >
        <Icon name="plus" className="h-3.5 w-3.5" />
        {addLabel}
      </button>
      {emptyHint ? (
        <p className="mt-1 text-[11px] text-ink-soft">{emptyHint}</p>
      ) : null}
    </div>
  );
}
