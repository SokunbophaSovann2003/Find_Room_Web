"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "./Icon";
import { useT } from "@/lib/language";
import type { Room } from "@/lib/types";

export type Bounds = [[number, number], [number, number]];
export interface MapFocus {
  center: [number, number];
  zoom: number;
}

interface ExploreMapProps {
  rooms: Room[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onBoundsChange?: (bounds: Bounds) => void;
  focus?: MapFocus | null;
}

function priceIcon(price: number, active: boolean): L.DivIcon {
  const cls = active
    ? "bg-emerald-700 text-white border-emerald-700"
    : "bg-white text-slate-900 border-slate-300";
  return L.divIcon({
    className: "",
    html: `<div class="inline-flex h-7 items-center rounded-full border px-3 text-xs font-bold shadow ${cls}">$${price}</div>`,
    iconSize: [60, 28],
    iconAnchor: [30, 14]
  });
}

function MapEventBridge({ onBoundsChange }: { onBoundsChange?: (b: Bounds) => void }) {
  const map = useMap();
  useEffect(() => {
    const fire = () => {
      const b = map.getBounds();
      onBoundsChange?.([
        [b.getSouth(), b.getWest()],
        [b.getNorth(), b.getEast()]
      ]);
    };
    fire();
    map.on("moveend", fire);
    return () => {
      map.off("moveend", fire);
    };
  }, [map, onBoundsChange]);
  return null;
}

function FocusController({ focus }: { focus?: MapFocus | null }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    map.flyTo(focus.center, focus.zoom, { duration: 0.7 });
  }, [map, focus]);
  return null;
}

function MyLocationControl() {
  const map = useMap();
  const t = useT();
  function handleClick() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 0.7 });
      },
      () => {
        // permission denied / unavailable — fail silently
      }
    );
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("mapPin.useMyLocation.aria")}
      className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-brand shadow transition hover:bg-brand hover:text-white"
    >
      <Icon name="map-pin" className="h-5 w-5" />
    </button>
  );
}

type PositionedRoom = Room & { lat: number; lng: number };

function isPositioned(r: Room): r is PositionedRoom {
  return r.lat != null && r.lng != null;
}

export default function ExploreMap({ rooms, activeId, onSelect, onBoundsChange, focus }: ExploreMapProps) {
  const positioned: PositionedRoom[] = rooms.filter(isPositioned);
  const initialCenter: [number, number] = focus?.center
    ?? (positioned.length > 0
      ? [positioned[0].lat, positioned[0].lng]
      : [11.5564, 104.9282]);
  const initialZoom = focus?.zoom ?? 13;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventBridge onBoundsChange={onBoundsChange} />
      <FocusController focus={focus} />
      <MyLocationControl />
      {positioned.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={priceIcon(r.price, r.id === activeId)}
          eventHandlers={{ click: () => onSelect?.(r.id) }}
        />
      ))}
    </MapContainer>
  );
}
