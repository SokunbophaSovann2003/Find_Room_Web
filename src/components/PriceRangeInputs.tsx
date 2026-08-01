"use client";

import { useT } from "@/lib/language";

interface PriceRangeInputsProps {
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
  currency?: string;
  className?: string;
}

/**
 * Inline min/max price entry — two number fields on one row, typed directly
 * (no popup). Used on the renter request forms where a quick from–to range is
 * clearer than a dialog. For the browse filters (Explore/admin) see
 * PriceRangePicker, which keeps its popup.
 */
export default function PriceRangeInputs({
  min,
  max,
  onChange,
  currency = "$",
  className
}: PriceRangeInputsProps) {
  const t = useT();
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Field
        currency={currency}
        placeholder={t("priceRange.min")}
        value={min}
        onChange={(v) => onChange(v, max)}
      />
      <span aria-hidden className="shrink-0 text-ink-soft">
        –
      </span>
      <Field
        currency={currency}
        placeholder={t("priceRange.max")}
        value={max}
        onChange={(v) => onChange(min, v)}
      />
    </div>
  );
}

function Field({
  currency,
  placeholder,
  value,
  onChange
}: {
  currency: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
        {currency}
      </span>
      <input
        type="number"
        min={0}
        inputMode="decimal"
        aria-label={placeholder}
        placeholder={placeholder}
        className="input pl-7"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
