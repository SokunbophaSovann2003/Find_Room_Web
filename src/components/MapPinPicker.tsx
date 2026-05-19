"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "./Icon";

export interface PinValue {
  lat: number;
  lng: number;
  name?: string;
}

const PHNOM_PENH: [number, number] = [11.5564, 104.9282];

// Sync `draft` with the map's center as the user pans, so the fixed
// centered pin overlay always reflects the latest geo position.
function CenterTracker({
  onChange
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    moveend() {
      const c = map.getCenter();
      onChange(c.lat, c.lng);
    }
  });
  return null;
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16, { duration: 0.6 });
  }, [map, target]);
  return null;
}

function MyLocationControl({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const [busy, setBusy] = useState(false);
  function handleClick() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onPick(pos.coords.latitude, pos.coords.longitude);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Use my location"
      disabled={busy}
      className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-brand shadow transition hover:bg-brand hover:text-white disabled:opacity-60"
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Icon name="map-pin" className="h-5 w-5" />
      )}
    </button>
  );
}

export default function MapPinPicker({
  open,
  onClose,
  value,
  onChange
}: {
  open: boolean;
  onClose: () => void;
  value: PinValue | null;
  onChange: (next: PinValue) => void;
}) {
  const [draft, setDraft] = useState<PinValue>(
    value ?? { lat: PHNOM_PENH[0], lng: PHNOM_PENH[1] }
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(value ?? { lat: PHNOM_PENH[0], lng: PHNOM_PENH[1] });
      setFlyTarget(null);
    }
  }, [open, value]);

  // Reverse-geocode the current center so the footer shows a place name
  // instead of coordinates. Debounced to avoid hammering Nominatim while the
  // user is still moving the map, and gated by a seq so stale responses don't
  // overwrite newer ones.
  const geocodeSeqRef = useRef(0);
  useEffect(() => {
    if (!open) return;
    const reqId = ++geocodeSeqRef.current;
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${draft.lat}&lon=${draft.lng}&format=json&zoom=18&accept-language=en`,
          { headers: { accept: "application/json" } }
        );
        if (!r.ok) return;
        const j = (await r.json()) as { display_name?: string };
        if (geocodeSeqRef.current !== reqId) return;
        const display = j.display_name ?? "";
        const name = display
          .split(",")
          .slice(0, 3)
          .map((s) => s.trim())
          .filter(Boolean)
          .join(", ");
        if (name) setDraft((d) => ({ ...d, name }));
      } catch {
        // Network/JSON errors fall back to coordinates — non-fatal.
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [open, draft.lat, draft.lng]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const initialCenter: [number, number] = value ? [value.lat, value.lng] : PHNOM_PENH;
  const initialZoom = value ? 16 : 13;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pin location on map"
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div className="relative flex h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:h-[80vh] sm:max-w-2xl sm:rounded-3xl">
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
          <span aria-hidden />
          <h2 className="text-center text-base font-semibold text-ink">Pin location</h2>
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
            <CenterTracker onChange={(lat, lng) => setDraft({ lat, lng })} />
            <FlyTo target={flyTarget} />
            <MyLocationControl onPick={(lat, lng) => setFlyTarget([lat, lng])} />
          </MapContainer>
          {/* Fixed center pin — its bottom tip sits over the map center, which
              is what the moveend handler reads. */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-[400] -translate-x-1/2 -translate-y-full"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
          <p className="line-clamp-2 min-w-0 flex-1 text-xs leading-snug text-ink-muted">
            {draft.name ?? `${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}`}
          </p>
          <button
            type="button"
            onClick={() => {
              onChange(draft);
              onClose();
            }}
            className="btn-primary h-10"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
