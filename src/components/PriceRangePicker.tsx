"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

interface PriceRangePickerProps {
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
  placeholder?: string;
  currency?: string;
  className?: string;
}

export default function PriceRangePicker({
  min,
  max,
  onChange,
  placeholder = "Any price",
  currency = "$",
  className
}: PriceRangePickerProps) {
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

  const empty = !min && !max;
  const label = empty
    ? placeholder
    : `${min ? `${currency}${min}` : `${currency}0`} - ${max ? `${currency}${max}` : "∞"}`;

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="input flex w-full items-center justify-between gap-2 text-left"
      >
        <span
          className={`truncate whitespace-nowrap ${empty ? "text-ink-soft" : "text-ink"}`}
        >
          {label}
        </span>
        <Icon
          name="chevron-down"
          className={`h-4 w-4 shrink-0 text-ink-soft transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <PickerPanel
          min={min}
          max={max}
          currency={currency}
          onCancel={() => setOpen(false)}
          onApply={(nMin, nMax) => {
            onChange(nMin, nMax);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function PickerPanel({
  min,
  max,
  currency,
  onCancel,
  onApply
}: {
  min: string;
  max: string;
  currency: string;
  onCancel: () => void;
  onApply: (min: string, max: string) => void;
}) {
  const [tempMin, setTempMin] = useState(min);
  const [tempMax, setTempMax] = useState(max);

  function commit() {
    onApply(tempMin.trim(), tempMax.trim());
  }

  return (
    <>
      <div
        aria-hidden
        onClick={onCancel}
        className="fixed inset-0 z-[1150] bg-ink/40 lg:hidden"
      />
      <div
        role="dialog"
        aria-label="Select price range"
        className="fixed left-1/2 top-1/2 z-[1200] flex w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-cardHover lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-1.5 lg:w-[320px] lg:translate-x-0 lg:translate-y-0"
      >
        <div className="border-b border-slate-100 px-4 py-2.5">
          <p className="text-sm font-semibold text-ink">Price range</p>
          <p className="text-[11px] text-ink-muted">Leave a field empty for no limit.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          <PriceInput
            label="Min"
            currency={currency}
            value={tempMin}
            onChange={setTempMin}
          />
          <PriceInput
            label="Max"
            currency={currency}
            value={tempMax}
            onChange={setTempMax}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5">
          <button
            type="button"
            onClick={() => {
              setTempMin("");
              setTempMax("");
              onApply("", "");
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-slate-100 hover:text-ink"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-slate-100 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={commit}
            className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand/90"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

function PriceInput({
  label,
  currency,
  value,
  onChange
}: {
  label: string;
  currency: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label text-[11px] uppercase tracking-wider text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
          {currency}
        </span>
        <input
          type="number"
          min={0}
          inputMode="decimal"
          placeholder="0"
          className="input pl-7"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
