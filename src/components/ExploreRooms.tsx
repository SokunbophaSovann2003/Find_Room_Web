"use client";

import { useState } from "react";
import RoomCard from "./RoomCard";
import Icon from "./Icon";
import type { Room } from "@/lib/types";

type View = "list" | "map";

function mapQueryFor(room: Room): string {
  if (room.lat != null && room.lng != null) return `${room.lat},${room.lng}`;
  return `${room.address}, ${room.city}`;
}

export default function ExploreRooms({ rooms }: { rooms: Room[] }) {
  const [view, setView] = useState<View>("list");
  const [activeId, setActiveId] = useState<string | null>(rooms[0]?.id ?? null);

  const activeRoom = rooms.find((r) => r.id === activeId) ?? rooms[0];
  const mapQuery = activeRoom ? mapQueryFor(activeRoom) : "Phnom Penh, Cambodia";

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Explore all rooms</h2>
          <p className="text-sm text-ink-muted">{rooms.length} rooms available right now</p>
        </div>

        <div role="tablist" className="flex gap-1 self-start rounded-full border border-slate-200 bg-white p-1">
          <ViewTab active={view === "list"} onClick={() => setView("list")} icon="menu" label="List" />
          <ViewTab active={view === "map"} onClick={() => setView("map")} icon="map-pin" label="Map" />
        </div>
      </div>

      {view === "list" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <iframe
              key={mapQuery}
              title="Rooms on Google Maps"
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=14&output=embed`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto pr-1">
            {rooms.map((room) => (
              <MapRoomItem
                key={room.id}
                room={room}
                active={room.id === activeRoom?.id}
                onSelect={() => setActiveId(room.id)}
              />
            ))}
          </div>
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

function MapRoomItem({
  room,
  active,
  onSelect
}: {
  room: Room;
  active: boolean;
  onSelect: () => void;
}) {
  const externalHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQueryFor(room))}`;

  return (
    <div
      onClick={onSelect}
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
        active ? "border-brand bg-brand/5 shadow-card" : "border-slate-200 bg-white hover:border-brand/50"
      }`}
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {room.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={room.images[0]} alt={room.title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold text-ink">{room.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
          {room.district ? `${room.district}, ` : ""}
          {room.city}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-ink">
            ${room.price}
            <span className="text-xs text-ink-soft"> /mo</span>
          </span>
          <a
            href={externalHref}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-brand hover:text-brand-dark"
          >
            Open in Maps ↗
          </a>
        </div>
      </div>
    </div>
  );
}
