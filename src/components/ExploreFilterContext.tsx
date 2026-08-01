"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LocationValue } from "./LocationPicker";
import type { Room, PropertyType } from "@/lib/types";

export interface ExploreFilter {
  location: LocationValue;
  type: PropertyType | "";
  // Price range in USD, kept as raw input strings ("" = no bound).
  priceMin: string;
  priceMax: string;
}

const empty: ExploreFilter = { location: {}, type: "", priceMin: "", priceMax: "" };

const Ctx = createContext<{
  filter: ExploreFilter;
  setFilter: (next: ExploreFilter) => void;
}>({ filter: empty, setFilter: () => {} });

// Filters live in the URL so back-navigation from a room detail page restores
// the filtered view and links can be shared. The provider derives state from
// useSearchParams() and writes via router.replace().
export function ExploreFilterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filter = useMemo<ExploreFilter>(
    () => ({
      location: {
        province: searchParams?.get("province") ?? undefined,
        district: searchParams?.get("district") ?? undefined,
        area: searchParams?.get("area") ?? undefined
      },
      type: (searchParams?.get("type") as PropertyType | null) ?? "",
      priceMin: searchParams?.get("priceMin") ?? "",
      priceMax: searchParams?.get("priceMax") ?? ""
    }),
    [searchParams]
  );

  const setFilter = useCallback(
    (next: ExploreFilter) => {
      const params = new URLSearchParams();
      if (next.location.province) params.set("province", next.location.province);
      if (next.location.district) params.set("district", next.location.district);
      if (next.location.area) params.set("area", next.location.area);
      if (next.type) params.set("type", next.type);
      if (next.priceMin) params.set("priceMin", next.priceMin);
      if (next.priceMax) params.set("priceMax", next.priceMax);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname]
  );

  return <Ctx.Provider value={{ filter, setFilter }}>{children}</Ctx.Provider>;
}

export function useExploreFilter() {
  return useContext(Ctx);
}

// NOTE: applyFilter strips manually-occupied rooms (isOccupied: true) but does
// NOT strip auto-occupied rooms — it has no access to the admin autoOccupyDays
// setting. Callers must chain an additional isAutoOccupied check themselves.
// ExploreRooms.tsx does this correctly; any new consumer must do the same.
export function applyFilter(rooms: Room[], filter: ExploreFilter): Room[] {
  let out = rooms.filter((r) => !r.isOccupied);
  if (filter.location.province) {
    out = out.filter((r) => r.city === filter.location.province);
  }
  if (filter.location.district) {
    out = out.filter((r) => r.district === filter.location.district);
  }
  if (filter.location.area) {
    out = out.filter((r) => r.area === filter.location.area);
  }
  if (filter.type) {
    out = out.filter((r) => r.type === filter.type);
  }
  const min = filter.priceMin ? Number(filter.priceMin) : null;
  const max = filter.priceMax ? Number(filter.priceMax) : null;
  if (min != null && Number.isFinite(min)) {
    out = out.filter((r) => r.price >= min);
  }
  if (max != null && Number.isFinite(max)) {
    out = out.filter((r) => r.price <= max);
  }
  return out;
}
