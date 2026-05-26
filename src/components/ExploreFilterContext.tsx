"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LocationValue } from "./LocationPicker";
import type { Room, PropertyType } from "@/lib/types";

export type SortOrder = "" | "price-asc" | "price-desc";

export interface ExploreFilter {
  location: LocationValue;
  type: PropertyType | "";
  sort: SortOrder;
}

const empty: ExploreFilter = { location: {}, type: "", sort: "" };

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
      sort: (searchParams?.get("sort") as SortOrder | null) ?? ""
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
      if (next.sort) params.set("sort", next.sort);
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

export function applyFilter(rooms: Room[], filter: ExploreFilter): Room[] {
  let out = rooms.filter((r) => !r.isOccupied);
  if (filter.location.province) {
    out = out.filter((r) => r.city === filter.location.province);
  }
  if (filter.location.district) {
    out = out.filter((r) => r.district === filter.location.district);
  }
  if (filter.type) {
    out = out.filter((r) => r.type === filter.type);
  }
  if (filter.sort === "price-asc") {
    out = [...out].sort((a, b) => a.price - b.price);
  } else if (filter.sort === "price-desc") {
    out = [...out].sort((a, b) => b.price - a.price);
  }
  return out;
}
