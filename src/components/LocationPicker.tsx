"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import {
  PROVINCES,
  districtsOf,
  areasOf
} from "@/lib/locations";

export interface LocationValue {
  province?: string;
  district?: string;
  area?: string;
}

type View = "province" | "district" | "area";

export default function LocationPicker({
  open,
  onClose,
  value,
  onChange,
  mode = "modal",
  intent = "browse"
}: {
  open: boolean;
  onClose: () => void;
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  mode?: "modal" | "dropdown";
  // "browse" → the picker is filtering an existing list (Explore page).
  // "select" → the picker is collecting a value (e.g. listing creation).
  // The copy on the "all in X" rows changes to match.
  intent?: "browse" | "select";
}) {
  const allLabel = intent === "select" ? "Clear" : "Show all rooms";
  const provinceLabel = (province: string) =>
    intent === "select" ? `Use ${province}` : `Show all rooms in ${province}`;
  const districtLabel = (district: string) =>
    intent === "select" ? `Use ${district}` : `Show all rooms in ${district}`;
  const [view, setView] = useState<View>("province");
  const [draft, setDraft] = useState<{ province?: string; district?: string }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (value.area && value.province && value.district) {
      setDraft({ province: value.province, district: value.district });
      setView("area");
    } else if (value.district && value.province) {
      setDraft({ province: value.province, district: value.district });
      setView("district");
    } else if (value.province) {
      setDraft({ province: value.province });
      setView("province");
    } else {
      setDraft({});
      setView("province");
    }
  }, [open, value.province, value.district, value.area]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || mode !== "modal") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mode]);

  useEffect(() => {
    if (!open || mode !== "dropdown") return;
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onClick);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, mode, onClose]);

  if (!open) return null;

  function pickProvince(p: string) {
    const dists = districtsOf(p);
    if (dists.length === 0) {
      onChange({ province: p });
      onClose();
      return;
    }
    setDraft({ province: p });
    setView("district");
  }

  function pickAllInProvince() {
    if (!draft.province) return;
    onChange({ province: draft.province });
    onClose();
  }

  function pickDistrict(d: string) {
    if (!draft.province) return;
    const ars = areasOf(draft.province, d);
    if (ars.length === 0) {
      onChange({ province: draft.province, district: d });
      onClose();
      return;
    }
    setDraft({ ...draft, district: d });
    setView("area");
  }

  function pickAllInDistrict() {
    if (!draft.province || !draft.district) return;
    onChange({ province: draft.province, district: draft.district });
    onClose();
  }

  function pickArea(a: string) {
    if (!draft.province || !draft.district) return;
    onChange({ province: draft.province, district: draft.district, area: a });
    onClose();
  }

  function back() {
    if (view === "area") setView("district");
    else if (view === "district") setView("province");
  }

  function clearAll() {
    onChange({});
    onClose();
  }

  const header = (
    <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-2">
      {view !== "province" ? (
        <button
          type="button"
          onClick={back}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-slate-100"
        >
          <Icon name="arrow-right" className="h-5 w-5 rotate-180" />
        </button>
      ) : (
        <span aria-hidden />
      )}
      <h2 className="text-center text-sm font-semibold text-ink">Location</h2>
      {mode === "modal" ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
        >
          <Icon name="x" className="h-5 w-5" />
        </button>
      ) : (
        <span aria-hidden />
      )}
    </div>
  );

  const list = (
    <ul className="flex-1 overflow-y-auto">
      {view === "province" ? (
        <>
          {(value.province || value.district || value.area) ? (
            <RowAction onClick={clearAll} label={allLabel} />
          ) : null}
          {PROVINCES.map((p) => (
            <Row key={p} onClick={() => pickProvince(p)} label={p} hasMore={districtsOf(p).length > 0} />
          ))}
        </>
      ) : null}

      {view === "district" && draft.province ? (
        <>
          <RowAction onClick={pickAllInProvince} label={provinceLabel(draft.province)} />
          {districtsOf(draft.province).map((d) => (
            <Row
              key={d}
              onClick={() => pickDistrict(d)}
              label={d}
              hasMore={areasOf(draft.province!, d).length > 0}
            />
          ))}
        </>
      ) : null}

      {view === "area" && draft.province && draft.district ? (
        <>
          <RowAction onClick={pickAllInDistrict} label={districtLabel(draft.district)} />
          {areasOf(draft.province, draft.district).map((a) => (
            <Row key={a} onClick={() => pickArea(a)} label={a} />
          ))}
        </>
      ) : null}
    </ul>
  );

  if (mode === "dropdown") {
    return (
      <div
        ref={dropdownRef}
        role="dialog"
        aria-label="Location"
        className="absolute left-0 top-full z-[1100] mt-2 flex max-h-96 w-full min-w-[280px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-cardHover"
      >
        {header}
        {list}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Location"
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:max-h-[80vh] sm:w-full sm:max-w-md sm:rounded-3xl">
        {header}
        {list}
      </div>
    </div>
  );
}

function Row({ onClick, label, hasMore = false }: { onClick: () => void; label: string; hasMore?: boolean }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-ink transition hover:bg-slate-50"
      >
        <span>{label}</span>
        {hasMore ? <Icon name="arrow-right" className="h-4 w-4 shrink-0 text-ink-soft" /> : null}
      </button>
    </li>
  );
}

function RowAction({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm font-semibold text-brand transition hover:bg-brand/5"
      >
        {label}
      </button>
    </li>
  );
}
