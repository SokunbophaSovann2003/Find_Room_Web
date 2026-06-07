"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";

// Compact "rows per page" dropdown for paginated admin tables. Opens upward
// since it sits at the bottom of the table.
export default function PageSizeSelect({
  value,
  options,
  onChange,
  label,
  optionLabel
}: {
  value: number;
  options: number[];
  onChange: (n: number) => void;
  label: string;
  optionLabel: (n: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-ink-muted transition hover:bg-slate-50 hover:text-ink"
      >
        {optionLabel(value)}
        <Icon
          name="chevron-down"
          className={`h-3.5 w-3.5 shrink-0 text-ink-soft transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute bottom-full left-0 z-30 mb-1.5 min-w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-cardHover"
        >
          {options.map((n) => {
            const active = n === value;
            return (
              <button
                key={n}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(n);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-brand/10 font-semibold text-brand"
                    : "text-ink hover:bg-slate-50"
                }`}
              >
                {optionLabel(n)}
                {active ? <Icon name="check" className="h-4 w-4 text-brand" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
