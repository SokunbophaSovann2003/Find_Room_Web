"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "./Icon";

export interface PinPosition {
  lat: number;
  lng: number;
}

interface LocationPinMapModalProps {
  open: boolean;
  onClose: () => void;
  value: PinPosition | null;
  onChange: (pos: PinPosition | null) => void;
}

const DEFAULT_CENTER: PinPosition = { lat: 11.5564, lng: 104.9282 };

function CenterTracker({ onChange }: { onChange: (pos: PinPosition) => void }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onChange({ lat: c.lat, lng: c.lng });
    }
  });
  return null;
}

function MyLocationControl() {
  const map = useMap();
  function handleClick() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 0.7 });
      },
      () => {
        // permission denied / unavailable — fail silently
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Use my current location"
      className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-brand shadow transition hover:bg-brand hover:text-white"
    >
      <Icon name="map-pin" className="h-5 w-5" />
    </button>
  );
}

function CenterPin() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-full"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-lg">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div className="mx-auto h-2 w-2 -translate-y-1 rounded-full bg-emerald-700/50" />
    </div>
  );
}

export default function LocationPinMapModal({
  open,
  onClose,
  value,
  onChange
}: LocationPinMapModalProps) {
  const [draft, setDraft] = useState<PinPosition>(value ?? DEFAULT_CENTER);

  useEffect(() => {
    if (open) setDraft(value ?? DEFAULT_CENTER);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const initialCenter: [number, number] = [draft.lat, draft.lng];
  const initialZoom = value ? 15 : 12;

  function save() {
    onChange(draft);
    onClose();
  }
  function clear() {
    onChange(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pin location on map"
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative flex h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:h-[80vh] sm:w-full sm:max-w-2xl sm:rounded-3xl">
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-2">
          <span aria-hidden />
          <h2 className="text-center text-sm font-semibold text-ink">Pin location on map</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex-1">
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
            <CenterTracker onChange={setDraft} />
            <MyLocationControl />
          </MapContainer>
          <CenterPin />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-3">
          <p className="min-w-0 flex-1 truncate text-xs text-ink-soft">
            {`Center: ${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}`}
          </p>
          {value ? (
            <button
              type="button"
              onClick={clear}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Clear
            </button>
          ) : null}
          <button type="button" onClick={save} className="btn-primary">
            Save pin
          </button>
        </div>
      </div>
    </div>
  );
}
