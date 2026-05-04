"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";

interface OptionPickerProps<T extends string> {
  open: boolean;
  onClose: () => void;
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  mode?: "modal" | "dropdown";
}

export default function OptionPicker<T extends string>({
  open,
  onClose,
  title,
  options,
  value,
  onChange,
  mode = "modal"
}: OptionPickerProps<T>) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || mode !== "modal") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mode]);

  useEffect(() => {
    if (!open || mode !== "dropdown") return;
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onClick);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, mode, onClose]);

  if (!open) return null;

  function pick(v: T) {
    onChange(v);
    onClose();
  }

  if (mode === "dropdown") {
    return (
      <div
        ref={dropdownRef}
        role="listbox"
        aria-label={title}
        className="absolute left-0 top-full z-[1100] mt-2 w-full min-w-[220px] max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-cardHover"
      >
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value || "default"}
              type="button"
              onClick={() => pick(o.value)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                active ? "font-semibold text-brand" : "text-ink"
              }`}
            >
              <span>{o.label}</span>
              {active ? <Icon name="check" className="h-4 w-4 shrink-0 text-brand" /> : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:max-h-[80vh] sm:w-full sm:max-w-md sm:rounded-3xl">
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
          <span aria-hidden />
          <h2 className="text-center text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {options.map((o) => {
            const active = value === o.value;
            return (
              <li key={o.value || "default"}>
                <button
                  type="button"
                  onClick={() => pick(o.value)}
                  className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${
                    active ? "font-semibold text-brand" : "text-ink"
                  }`}
                >
                  <span>{o.label}</span>
                  {active ? <Icon name="check" className="h-4 w-4 shrink-0 text-brand" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
