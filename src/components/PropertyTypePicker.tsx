"use client";

import { useEffect, useState } from "react";
import Icon, { propertyIcon } from "@/components/Icon";
import { getAdminSettings } from "@/lib/admin";
import { useT } from "@/lib/language";
import type { PropertyType } from "@/lib/types";

const PROPERTY_TYPE_CHOICES: { value: PropertyType; labelKey: string; hintKey: string }[] = [
  { value: "room",      labelKey: "type.room",      hintKey: "pick.type.room.hint" },
  { value: "apartment", labelKey: "type.apartment", hintKey: "pick.type.apartment.hint" },
  { value: "condo",     labelKey: "type.condo",     hintKey: "pick.type.condo.hint" },
  { value: "flat",      labelKey: "type.flat",      hintKey: "pick.type.flat.hint" },
  { value: "house",     labelKey: "type.house",     hintKey: "pick.type.house.hint" },
  { value: "villa",     labelKey: "type.villa",     hintKey: "pick.type.villa.hint" },
];

export default function PropertyTypePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (type: PropertyType) => void;
}) {
  const t = useT();
  const [pending, setPending] = useState<PropertyType | null>(null);
  // Track active property types reactively so the list updates in real time
  // when an admin changes the settings (e.g. in another tab or the admin panel
  // while the sheet is already open).
  const [activeTypes, setActiveTypes] = useState<Set<PropertyType>>(
    () => new Set(getAdminSettings().activePropertyTypes)
  );

  useEffect(() => {
    // Refresh whenever the sheet opens (catches changes made while it was closed).
    setActiveTypes(new Set(getAdminSettings().activePropertyTypes));

    function syncSettings() {
      setActiveTypes(new Set(getAdminSettings().activePropertyTypes));
    }
    // "storage" fires in same-origin tabs; the custom event fires in the
    // current tab when the admin panel saves settings.
    window.addEventListener("storage", syncSettings);
    window.addEventListener("findroom:admin-settings-change", syncSettings);
    return () => {
      window.removeEventListener("storage", syncSettings);
      window.removeEventListener("findroom:admin-settings-change", syncSettings);
    };
  }, []);

  useEffect(() => {
    if (!open) { setPending(null); return; }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
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

  const choices = PROPERTY_TYPE_CHOICES.filter((p) => activeTypes.has(p.value));

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("pick.type.aria")}
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:max-h-[80vh] sm:max-w-md sm:rounded-3xl">
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
          <span aria-hidden />
          <h3 className="text-center text-base font-semibold text-ink">
            {t("pick.type.title")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">
          <ul className="grid grid-cols-2 gap-3">
            {choices.map((p) => (
              <li key={p.value}>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => { setPending(p.value); onPick(p.value); }}
                  className="relative flex h-full w-full flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand hover:bg-brand/5 disabled:pointer-events-none"
                >
                  {pending === p.value ? (
                    <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                    </span>
                  ) : null}
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon name={propertyIcon(p.value)} className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-bold text-ink">{t(p.labelKey)}</span>
                  <span className="text-xs leading-snug text-ink-muted">
                    {t(p.hintKey)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
