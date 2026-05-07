"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
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

export function ExploreFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<ExploreFilter>(empty);
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
