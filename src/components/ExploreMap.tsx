"use client";

import { useEffect, useMemo, useState } from "react";
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

const MAP_VIEW_KEY = "exploreMapView";

function saveMapView(center: [number, number], zoom: number) {
  try { sessionStorage.setItem(MAP_VIEW_KEY, JSON.stringify({ center, zoom })); } catch {}
}

function loadMapView(): MapFocus | null {
  try {
    const raw = sessionStorage.getItem(MAP_VIEW_KEY);
    return raw ? (JSON.parse(raw) as MapFocus) : null;
  } catch { return null; }
}

interface ExploreMapProps {
  rooms: Room[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onBoundsChange?: (bounds: Bounds) => void;
  focus?: MapFocus | null;
  // Serialized location selection. Changes whenever the user picks a different
  // province/district/area, even when the resolved coordinates are identical
  // (e.g. two areas in the same district), so the map re-focuses every time.
  focusKey?: string;
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
      const c = map.getCenter();
      saveMapView([c.lat, c.lng], map.getZoom());
    };
    fire();
    map.on("moveend", fire);
    return () => {
      map.off("moveend", fire);
    };
  }, [map, onBoundsChange]);
  return null;
}

function FocusController({ focus, focusKey }: { focus?: MapFocus | null; focusKey?: string }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    map.flyTo(focus.center, focus.zoom, { duration: 0.7 });
  }, [map, focus, focusKey]);
  return null;
}

function MyLocationControl() {
  const map = useMap();
  const t = useT();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  function handleClick() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus("idle");
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 0.7 });
      },
      () => {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      },
      { timeout: 10000 }
    );
  }

  const baseClass = "absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border shadow transition";
  const stateClass =
    status === "error"
      ? "border-red-200 bg-red-50 text-red-500"
      : status === "loading"
        ? "border-brand/30 bg-brand/10 text-brand cursor-wait"
        : "border-slate-200 bg-white text-brand hover:bg-brand hover:text-white";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
      aria-label={t("mapPin.useMyLocation.aria")}
      className={`${baseClass} ${stateClass}`}
    >
      {status === "loading" ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      ) : status === "error" ? (
        <Icon name="x" className="h-5 w-5" />
      ) : (
        <Icon name="map-pin" className="h-5 w-5" />
      )}
    </button>
  );
}

type PositionedRoom = Room & { lat: number; lng: number };

function isPositioned(r: Room): r is PositionedRoom {
  return r.lat != null && r.lng != null;
}

// Render only the markers inside the current viewport (plus a 20% buffer so
// pins are ready just outside the edges when panning). Recomputed on
// moveend/zoomend, debounced, so dense catalogs don't put a marker for every
// listing into the DOM at once.
function ViewportMarkers({
  rooms,
  activeId,
  onSelect
}: {
  rooms: PositionedRoom[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const map = useMap();
  const [bounds, setBounds] = useState<L.LatLngBounds>(() => map.getBounds());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const update = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setBounds(map.getBounds()), 150);
    };
    // The bounds captured at mount can be wrong if the container hasn't been
    // laid out yet, so refresh once the map is ready (and after layout settles)
    // in addition to reacting to pan/zoom.
    map.whenReady(() => setBounds(map.getBounds()));
    const settle = setTimeout(() => setBounds(map.getBounds()), 300);
    map.on("moveend", update);
    map.on("zoomend", update);
    map.on("resize", update);
    return () => {
      if (timer) clearTimeout(timer);
      clearTimeout(settle);
      map.off("moveend", update);
      map.off("zoomend", update);
      map.off("resize", update);
    };
  }, [map]);

  const visible = useMemo(() => {
    const padded = bounds.pad(0.2);
    return rooms.filter((r) => padded.contains([r.lat, r.lng]));
  }, [rooms, bounds]);

  return (
    <>
      {visible.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={priceIcon(r.price, r.id === activeId)}
          eventHandlers={{ click: () => onSelect?.(r.id) }}
        />
      ))}
    </>
  );
}

export default function ExploreMap({ rooms, activeId, onSelect, onBoundsChange, focus, focusKey }: ExploreMapProps) {
  const positioned: PositionedRoom[] = rooms.filter(isPositioned);
  const saved = loadMapView();
  const initialCenter: [number, number] = focus?.center
    ?? saved?.center
    ?? (positioned.length > 0
      ? [positioned[0].lat, positioned[0].lng]
      : [11.5564, 104.9282]);
  const initialZoom = focus?.zoom ?? saved?.zoom ?? 13;

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
      <FocusController focus={focus} focusKey={focusKey} />
      <MyLocationControl />
      <ViewportMarkers rooms={positioned} activeId={activeId} onSelect={onSelect} />
    </MapContainer>
  );
}
