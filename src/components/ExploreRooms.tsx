"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import RoomCard from "./RoomCard";
import Icon from "./Icon";
import ErrorBoundary from "./ErrorBoundary";
import { useLocalRooms } from "@/lib/local-rooms";
import { applyFilter, useExploreFilter } from "./ExploreFilterContext";
import { getLocationFocus } from "@/lib/locations";
import type { Bounds } from "./ExploreMap";
import type { Room } from "@/lib/types";

const ExploreMap = dynamic(() => import("./ExploreMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-ink-muted">
      Loading map…
    </div>
  )
});

type View = "list" | "map";

function inBounds(room: Room, bounds: Bounds | null): boolean {
  if (!bounds) return true;
  if (room.lat == null || room.lng == null) return false;
  const [[s, w], [n, e]] = bounds;
  return room.lat >= s && room.lat <= n && room.lng >= w && room.lng <= e;
}

export default function ExploreRooms({ rooms }: { rooms: Room[] }) {
  const [view, setView] = useState<View>("list");
  const localRooms = useLocalRooms();
  const { filter } = useExploreFilter();
  const allRooms = useMemo(
    () => applyFilter([...localRooms, ...rooms], filter),
    [localRooms, rooms, filter]
  );
  const [bounds, setBounds] = useState<Bounds | null>(null);

  const focus = useMemo(() => getLocationFocus(filter.location), [filter.location]);

  const visibleRooms = useMemo(
    () => (view === "map" ? allRooms.filter((r) => inBounds(r, bounds)) : allRooms),
    [allRooms, bounds, view]
  );

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Explore all rooms</h2>
          <p className="text-sm text-ink-muted">
            {view === "map"
              ? `${visibleRooms.length} ${visibleRooms.length === 1 ? "room" : "rooms"} in this area`
              : `${allRooms.length} ${allRooms.length === 1 ? "room" : "rooms"} available right now`}
          </p>
        </div>

        <div role="tablist" className="flex gap-1 self-start rounded-full border border-slate-200 bg-white p-1">
          <ViewTab active={view === "list"} onClick={() => setView("list")} icon="menu" label="List" />
          <ViewTab active={view === "map"} onClick={() => setView("map")} icon="map-pin" label="Map" />
        </div>
      </div>

      {view === "map" ? (
        <div className="mb-5 h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 lg:h-[480px]">
          <ErrorBoundary
            fallback={
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-ink-muted">
                <Icon name="map-pin" className="h-6 w-6 text-brand" />
                <p>Map failed to load. Switch to list view to keep browsing.</p>
              </div>
            }
          >
            <ExploreMap rooms={allRooms} onBoundsChange={setBounds} focus={focus} />
          </ErrorBoundary>
        </div>
      ) : null}

      {visibleRooms.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Icon name="search" className="h-6 w-6" />
          </span>
          <h3 className="text-base font-bold">
            {view === "map" ? "No rooms in this area" : "No rooms match these filters"}
          </h3>
          <p className="max-w-sm text-sm text-ink-muted">
            {view === "map"
              ? "Pan or zoom out to find more rooms."
              : "Try widening the location or clearing the property type."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {visibleRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </>
  );
}

function ViewTab({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: "menu" | "map-pin";
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? "bg-brand text-white shadow" : "text-ink-muted hover:text-ink"
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </button>
  );
}
