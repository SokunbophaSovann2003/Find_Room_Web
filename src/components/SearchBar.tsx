"use client";

import { useState } from "react";
import Icon from "./Icon";
import LocationPicker, { type LocationValue } from "./LocationPicker";
import OptionPicker from "./OptionPicker";
import { useExploreFilter, type SortOrder } from "./ExploreFilterContext";
import { useDesktop } from "@/lib/use-desktop";
import type { PropertyType } from "@/lib/types";

const PROPERTY_TYPE_OPTIONS: { value: PropertyType | ""; label: string }[] = [
  { value: "", label: "Any property type" },
  { value: "room", label: "Room" },
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "flat", label: "Flat" },
  { value: "villa", label: "Villa" }
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "", label: "Sort by price" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" }
];

function formatLocation(loc: LocationValue): string {
  const parts = [loc.province, loc.district, loc.area].filter(Boolean);
  return parts.length ? parts.join(", ") : "";
}

function labelFor<T extends string>(
  options: { value: T; label: string }[],
  value: T
): string {
  return options.find((o) => o.value === value)?.label ?? "";
}

export default function SearchBar() {
  const { filter, setFilter } = useExploreFilter();
  const [pickerOpen, setPickerOpen] = useState<"location" | "type" | "sort" | null>(null);
  const isDesktop = useDesktop();
  const mode = isDesktop ? "dropdown" : "modal";

  const locationLabel = formatLocation(filter.location);
  const typeLabel = labelFor(PROPERTY_TYPE_OPTIONS, filter.type);
  const sortLabel = labelFor(SORT_OPTIONS, filter.sort);

  function toggle(key: "location" | "type" | "sort") {
    setPickerOpen((cur) => (cur === key ? null : key));
  }

  return (
    <form
      className="flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-card sm:flex-row sm:items-center sm:rounded-full"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => toggle("location")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50 sm:rounded-full sm:px-4"
        >
          <Icon name="map-pin" className="h-5 w-5 shrink-0 text-brand" />
          <span className={`flex-1 truncate ${locationLabel ? "text-ink" : "text-ink-soft"}`}>
            {locationLabel || "Where to? Province, district, area…"}
          </span>
          {locationLabel ? <span className="h-6 w-6 shrink-0" aria-hidden /> : null}
        </button>
        {locationLabel ? (
          <button
            type="button"
            aria-label="Clear location"
            onClick={() => setFilter({ ...filter, location: {} })}
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-slate-200 hover:text-ink sm:right-4"
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

      <div className="hidden h-8 w-px bg-slate-200 sm:block" />

      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => toggle("type")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50 sm:rounded-full sm:px-4"
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
          title="Property type"
          options={PROPERTY_TYPE_OPTIONS}
          value={filter.type}
          onChange={(next) => setFilter({ ...filter, type: next })}
        />
      </div>

      <div className="hidden h-8 w-px bg-slate-200 sm:block" />

      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => toggle("sort")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50 sm:rounded-full sm:px-4"
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
          title="Sort by price"
          options={SORT_OPTIONS}
          value={filter.sort}
          onChange={(next) => setFilter({ ...filter, sort: next })}
        />
      </div>

      <button type="submit" className="btn-primary sm:px-6">
        <Icon name="search" className="h-4 w-4" />
        Search
      </button>
    </form>
  );
}
