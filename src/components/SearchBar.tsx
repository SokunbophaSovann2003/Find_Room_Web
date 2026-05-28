"use client";

import { useState } from "react";
import Icon from "./Icon";
import LocationPicker, { type LocationValue } from "./LocationPicker";
import OptionPicker from "./OptionPicker";
import { useExploreFilter, type SortOrder } from "./ExploreFilterContext";
import { useDesktop } from "@/lib/use-desktop";
import { useT } from "@/lib/language";
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

const SORT_KEYS: { value: SortOrder; key: string }[] = [
  { value: "", key: "search.sort.default" },
  { value: "price-asc", key: "search.sort.asc" },
  { value: "price-desc", key: "search.sort.desc" }
];

function formatLocation(loc: LocationValue): string {
  const parts = [loc.province, loc.district, loc.area].filter(Boolean);
  return parts.length ? parts.join(", ") : "";
}

export default function SearchBar() {
  const t = useT();
  const { filter, setFilter } = useExploreFilter();
  const [pickerOpen, setPickerOpen] = useState<"location" | "type" | "sort" | null>(null);
  const isDesktop = useDesktop();
  const mode = isDesktop ? "dropdown" : "modal";

  const propertyTypeOptions = PROPERTY_TYPE_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));
  const sortOptions = SORT_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));

  const locationLabel = formatLocation(filter.location);
  const typeLabel = propertyTypeOptions.find((o) => o.value === filter.type)?.label ?? "";
  const sortLabel = sortOptions.find((o) => o.value === filter.sort)?.label ?? "";

  function toggle(key: "location" | "type" | "sort") {
    setPickerOpen((cur) => (cur === key ? null : key));
  }

  return (
    <form
      className="flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-card lg:flex-row lg:items-center lg:rounded-full"
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
          {locationLabel ? <span className="h-6 w-6 shrink-0" aria-hidden /> : null}
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
        </button>
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

      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => toggle("sort")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50 lg:rounded-full lg:px-4"
        >
          <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center text-base font-bold text-brand">$</span>
          <span className={`flex-1 truncate ${filter.sort ? "text-ink" : "text-ink-soft"}`}>
            {sortLabel}
          </span>
        </button>
        <OptionPicker<SortOrder>
          open={pickerOpen === "sort"}
          onClose={() => setPickerOpen(null)}
          mode={mode}
          title={t("search.sort.default")}
          options={sortOptions}
          value={filter.sort}
          onChange={(next) => setFilter({ ...filter, sort: next })}
        />
      </div>

      <button type="submit" className="btn-primary lg:px-6">
        <Icon name="search" className="h-4 w-4" />
        {t("search.submit")}
      </button>
    </form>
  );
}
