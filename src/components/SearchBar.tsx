"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import LocationPicker, { type LocationValue } from "./LocationPicker";
import OptionPicker from "./OptionPicker";
import { useExploreFilter } from "./ExploreFilterContext";
import { useDesktop } from "@/lib/use-desktop";
import { useT, useLanguage } from "@/lib/language";
import { locationDisplayName } from "@/lib/locations";
import type { PropertyType } from "@/lib/types";

const PROPERTY_TYPE_KEYS: { value: PropertyType | ""; key: string }[] = [
  { value: "", key: "search.type.any" },
  { value: "room", key: "type.room" },
  { value: "house", key: "type.house" },
  { value: "apartment", key: "type.apartment" },
  { value: "condo", key: "type.condo" },
  { value: "flat", key: "type.flat" },
  { value: "villa", key: "type.villa" }
];

function formatLocation(loc: LocationValue, lang: "km" | "en"): string {
  const parts = [loc.province, loc.district, loc.area]
    .filter(Boolean)
    .map((k) => locationDisplayName(k!, lang));
  return parts.length ? parts.join(", ") : "";
}

function formatPrice(min: string, max: string): string {
  if (!min && !max) return "";
  return `${min ? `$${min}` : "$0"} – ${max ? `$${max}` : "∞"}`;
}

export default function SearchBar() {
  const t = useT();
  const { language } = useLanguage();
  const { filter, setFilter } = useExploreFilter();
  const [pickerOpen, setPickerOpen] = useState<"location" | "type" | null>(null);
  // Mobile: the three filters collapse into a single button that opens this sheet.
  const [sheetOpen, setSheetOpen] = useState(false);
  // Mobile only: the sheet edits a local draft; nothing is applied to the real
  // filter (or the results behind the sheet) until "Show results" is tapped.
  const [draft, setDraft] = useState(filter);
  const isDesktop = useDesktop();
  const mode = isDesktop ? "dropdown" : "modal";

  // Lock scroll + close on Escape while the mobile filter sheet is open.
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setSheetOpen(false); setPickerOpen(null); }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  const propertyTypeOptions = PROPERTY_TYPE_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));

  const locationLabel = formatLocation(filter.location, language);
  const typeLabel = propertyTypeOptions.find((o) => o.value === filter.type)?.label ?? "";
  const priceLabel = formatPrice(filter.priceMin, filter.priceMax);

  // Labels for the mobile sheet reflect the unsaved draft, not the applied filter.
  const draftLocationLabel = formatLocation(draft.location, language);
  const draftTypeLabel = propertyTypeOptions.find((o) => o.value === draft.type)?.label ?? "";

  function toggle(key: "location" | "type") {
    setPickerOpen((cur) => (cur === key ? null : key));
  }

  // Seed the draft with the currently applied filter each time the sheet opens.
  function openSheet() {
    setDraft(filter);
    setSheetOpen(true);
  }

  // Closing (X / backdrop / Escape) discards the draft — nothing is applied.
  function closeSheet() {
    setSheetOpen(false);
    setPickerOpen(null);
  }

  // "Show results" commits the draft to the real filter, then closes the sheet.
  function applyDraft() {
    setFilter(draft);
    closeSheet();
  }

  // Summary of active filters shown on the mobile trigger button.
  const summary = [
    locationLabel,
    filter.type ? typeLabel : "",
    priceLabel
  ].filter(Boolean).join(" · ");

  return (
    <>
    {/* Mobile: a single button that opens the combined filter sheet. Once
        filters are applied, the sliders icon becomes a clear-all (✕) button. */}
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={openSheet}
        className="flex w-full items-center gap-2 rounded-2xl bg-white p-3.5 text-left text-sm shadow-card"
      >
        <Icon name="search" className="h-5 w-5 shrink-0 text-brand" />
        <span className={`flex-1 truncate ${summary ? "text-ink" : "text-ink-soft"}`}>
          {summary || t("search.filters.placeholder")}
        </span>
        {summary ? (
          <span className="h-5 w-5 shrink-0" aria-hidden />
        ) : (
          <Icon name="filter" className="h-4 w-4 shrink-0 text-ink-soft" />
        )}
      </button>
      {summary ? (
        <button
          type="button"
          aria-label={t("search.filters.clear")}
          onClick={() => setFilter({ location: {}, type: "", priceMin: "", priceMax: "" })}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition hover:bg-slate-200 hover:text-ink"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      ) : null}
    </div>

    {sheetOpen ? (
      <div
        className="fixed inset-0 z-[1100] flex items-end justify-center sm:hidden"
        role="dialog"
        aria-modal="true"
        aria-label={t("search.filters.title")}
      >
        <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={closeSheet} aria-hidden />
        <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover">
          <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
            <span aria-hidden />
            <h2 className="text-center text-base font-semibold text-ink">{t("search.filters.title")}</h2>
            <button
              type="button"
              onClick={closeSheet}
              aria-label={t("common.close")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            {/* Location — chevron becomes a clear (✕) button once a value is set. */}
            <div>
              <span className="mb-1 block text-xs font-semibold text-ink-muted">{t("search.filters.location")}</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggle("location")}
                  className="input flex w-full items-center gap-2 text-left"
                >
                  <Icon name="map-pin" className="h-5 w-5 shrink-0 text-brand" />
                  <span className={`flex-1 truncate ${draftLocationLabel ? "text-ink" : "text-ink-soft"}`}>
                    {draftLocationLabel || t("search.location.placeholder")}
                  </span>
                  {draftLocationLabel ? (
                    <span className="h-6 w-6 shrink-0" aria-hidden />
                  ) : (
                    <Icon name="chevron-down" className="h-4 w-4 shrink-0 text-ink-soft" />
                  )}
                </button>
                {draftLocationLabel ? (
                  <button
                    type="button"
                    aria-label={t("search.clearLocation")}
                    onClick={() => setDraft({ ...draft, location: {} })}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition hover:bg-slate-200 hover:text-ink"
                  >
                    <Icon name="x" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <LocationPicker
                  open={pickerOpen === "location"}
                  onClose={() => setPickerOpen(null)}
                  mode="modal"
                  value={draft.location}
                  onChange={(next) => setDraft({ ...draft, location: next })}
                />
              </div>
            </div>

            {/* Type — chevron becomes a clear (✕) button once a value is set. */}
            <div>
              <span className="mb-1 block text-xs font-semibold text-ink-muted">{t("search.type.title")}</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggle("type")}
                  className="input flex w-full items-center gap-2 text-left"
                >
                  <Icon name="home" className="h-5 w-5 shrink-0 text-brand" />
                  <span className={`flex-1 truncate ${draft.type ? "text-ink" : "text-ink-soft"}`}>
                    {draft.type ? draftTypeLabel : t("search.type.any")}
                  </span>
                  {draft.type ? (
                    <span className="h-6 w-6 shrink-0" aria-hidden />
                  ) : (
                    <Icon name="chevron-down" className="h-4 w-4 shrink-0 text-ink-soft" />
                  )}
                </button>
                {draft.type ? (
                  <button
                    type="button"
                    aria-label={t("search.clearType")}
                    onClick={() => setDraft({ ...draft, type: "" })}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition hover:bg-slate-200 hover:text-ink"
                  >
                    <Icon name="x" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <OptionPicker<PropertyType | "">
                  open={pickerOpen === "type"}
                  onClose={() => setPickerOpen(null)}
                  mode="modal"
                  title={t("search.type.title")}
                  options={propertyTypeOptions}
                  value={draft.type}
                  onChange={(next) => setDraft({ ...draft, type: next })}
                />
              </div>
            </div>

            {/* Price range — inline min/max inputs (no nested popup). */}
            <div>
              <span className="mb-1 block text-xs font-semibold text-ink-muted">{t("priceRange.heading")}</span>
              <div className="flex items-center gap-2">
                <PriceInput
                  value={draft.priceMin}
                  placeholder={t("priceRange.min")}
                  onChange={(v) => setDraft({ ...draft, priceMin: v })}
                />
                <span className="shrink-0 text-ink-soft">–</span>
                <PriceInput
                  value={draft.priceMax}
                  placeholder={t("priceRange.max")}
                  onChange={(v) => setDraft({ ...draft, priceMax: v })}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 p-4">
            <button type="button" onClick={applyDraft} className="btn-primary w-full justify-center">
              {t("search.filters.apply")}
            </button>
          </div>
        </div>
      </div>
    ) : null}

    {/* Tablet / desktop: the inline three-field search bar. */}
    <form
      className="hidden w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-card sm:flex lg:flex-row lg:items-center lg:rounded-full"
      onSubmit={(e) => { e.preventDefault(); setPickerOpen(null); }}
    >
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => toggle("location")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50 lg:rounded-full lg:px-4"
        >
          <Icon name="map-pin" className="h-5 w-5 shrink-0 text-brand" />
          <span className={`flex-1 truncate ${locationLabel ? "text-ink" : "text-ink-soft"}`}>
            {locationLabel || t("search.location.placeholder")}
          </span>
          {locationLabel ? <span className="h-6 w-6 shrink-0" aria-hidden /> : <Icon name="chevron-down" className="h-4 w-4 shrink-0 text-ink-soft" />}
        </button>
        {locationLabel ? (
          <button
            type="button"
            aria-label={t("search.clearLocation")}
            onClick={() => setFilter({ ...filter, location: {} })}
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-slate-200 hover:text-ink lg:right-4"
          >
            <Icon name="x" className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <LocationPicker
          open={pickerOpen === "location"}
          onClose={() => setPickerOpen(null)}
          mode={mode}
          value={filter.location}
          onChange={(next) => setFilter({ ...filter, location: next })}
        />
      </div>

      <div className="hidden h-8 w-px bg-slate-200 lg:block" />

      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => toggle("type")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50 lg:rounded-full lg:px-4"
        >
          <Icon name="home" className="h-5 w-5 shrink-0 text-brand" />
          <span className={`flex-1 truncate capitalize ${filter.type ? "text-ink" : "text-ink-soft"}`}>
            {typeLabel}
          </span>
          {filter.type ? <span className="h-6 w-6 shrink-0" aria-hidden /> : <Icon name="chevron-down" className="h-4 w-4 shrink-0 text-ink-soft" />}
        </button>
        {filter.type ? (
          <button
            type="button"
            aria-label={t("search.clearType")}
            onClick={() => setFilter({ ...filter, type: "" })}
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-slate-200 hover:text-ink lg:right-4"
          >
            <Icon name="x" className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <OptionPicker<PropertyType | "">
          open={pickerOpen === "type"}
          onClose={() => setPickerOpen(null)}
          mode={mode}
          title={t("search.type.title")}
          options={propertyTypeOptions}
          value={filter.type}
          onChange={(next) => setFilter({ ...filter, type: next })}
        />
      </div>

      <div className="hidden h-8 w-px bg-slate-200 lg:block" />

      {/* Price range — inline min/max inputs (no popup). */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl px-3 py-2 lg:rounded-full lg:px-4">
        <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center text-base font-bold text-brand">$</span>
        <input
          type="number"
          min={0}
          inputMode="decimal"
          aria-label={t("priceRange.min")}
          placeholder={t("priceRange.min")}
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-ink-soft"
          value={filter.priceMin}
          onChange={(e) => setFilter({ ...filter, priceMin: e.target.value })}
        />
        <span className="shrink-0 text-ink-soft">–</span>
        <input
          type="number"
          min={0}
          inputMode="decimal"
          aria-label={t("priceRange.max")}
          placeholder={t("priceRange.max")}
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-ink-soft"
          value={filter.priceMax}
          onChange={(e) => setFilter({ ...filter, priceMax: e.target.value })}
        />
      </div>
    </form>
    </>
  );
}

function PriceInput({
  value,
  placeholder,
  onChange
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">$</span>
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
