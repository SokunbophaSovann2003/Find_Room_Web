"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import {
  ALL_PROPERTY_TYPES,
  saveAdminSettings,
  useAdminSettings,
  type AdminSettings
} from "@/lib/admin";
import { getAutoPublishSetting, setAutoPublishSetting } from "@/lib/rooms";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import type { PropertyType } from "@/lib/types";

const PROPERTY_TYPE_KEYS: Record<PropertyType, string> = {
  room: "admin.propertyType.room",
  apartment: "admin.propertyType.apartment",
  condo: "admin.propertyType.condo",
  flat: "admin.propertyType.flat",
  house: "admin.propertyType.house",
  villa: "admin.propertyType.villa"
};

function settingsEqual(a: AdminSettings, b: AdminSettings): boolean {
  return (
    a.activePropertyTypes.join("|") === b.activePropertyTypes.join("|") &&
    a.amenities.join("|") === b.amenities.join("|") &&
    a.autoOccupyDays === b.autoOccupyDays
  );
}

export default function AdminSettingsPage() {
  const stored = useAdminSettings();
  const [draft, setDraft] = useState<AdminSettings>(stored);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const t = useT();

  // Auto-publish is a GLOBAL policy stored in Firestore (not localStorage), so
  // it is tracked separately from the rest of the localStorage-backed draft.
  const [autoPublish, setAutoPublish] = useState(false);
  const [loadedAutoPublish, setLoadedAutoPublish] = useState(false);

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  useEffect(() => {
    let cancelled = false;
    getAutoPublishSetting().then((v) => {
      if (!cancelled) {
        setAutoPublish(v);
        setLoadedAutoPublish(v);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = !settingsEqual(draft, stored) || autoPublish !== loadedAutoPublish;

  async function handleSave() {
    saveAdminSettings(draft);
    try {
      await setAutoPublishSetting(autoPublish);
      setLoadedAutoPublish(autoPublish);
    } catch {
      toast.error(t("toast.admin.settings.saveFailed"));
      return;
    }
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
    toast.success(t("toast.admin.settings.saved"));
  }

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("admin.settings.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t("admin.settings.subtitle")}
        </p>
      </header>

      <Section
        icon="map-pin"
        title={t("admin.settings.taxonomy.title")}
        description={t("admin.settings.taxonomy.desc")}
      >
        <div>
          <p className="label mb-2">{t("admin.settings.propertyTypes")}</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ALL_PROPERTY_TYPES.map((pt) => {
              const on = draft.activePropertyTypes.includes(pt);
              return (
                <li key={pt}>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        activePropertyTypes: on
                          ? draft.activePropertyTypes.filter((x) => x !== pt)
                          : [...draft.activePropertyTypes, pt]
                      })
                    }
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                      on
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-slate-200 bg-white text-ink-muted hover:border-slate-300"
                    }`}
                  >
                    <span>{t(PROPERTY_TYPE_KEYS[pt])}</span>
                    {on ? <Icon name="check" className="h-4 w-4" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {draft.activePropertyTypes.length === 0 ? (
            <p className="mt-2 text-xs text-red-700">
              {t("admin.settings.propertyTypes.required")}
            </p>
          ) : null}
        </div>

        <div>
          <p className="label mb-2">{t("admin.settings.amenities")}</p>
          <AmenitiesEditor
            amenities={draft.amenities}
            onChange={(amenities) => setDraft({ ...draft, amenities })}
          />
        </div>
      </Section>

      <Section
        icon="shield"
        title={t("admin.settings.moderation.title")}
        description={t("admin.settings.moderation.desc")}
      >
        <div className="space-y-2">
          <ToggleRow
            label={t("admin.settings.moderation.autoPublish")}
            hint={t("admin.settings.moderation.autoPublish.hint")}
            on={autoPublish}
            onChange={setAutoPublish}
          />
        </div>
        <div>
          <label className="block">
            <span className="label">{t("admin.settings.autoOccupy.label")}</span>
            <input
              className="input mt-1"
              type="number"
              min={7}
              step={1}
              value={draft.autoOccupyDays}
              onChange={(e) => {
                // Allow free editing; skip commit on empty so clearing to
                // retype a value doesn't snap to 7 on every keystroke.
                const str = e.target.value;
                if (str === "") return;
                const raw = Math.round(Number(str));
                if (Number.isFinite(raw) && raw >= 1) {
                  setDraft({ ...draft, autoOccupyDays: raw });
                }
              }}
              onBlur={() => {
                // Enforce minimum only when focus leaves the field.
                if (draft.autoOccupyDays < 7) {
                  setDraft({ ...draft, autoOccupyDays: 7 });
                }
              }}
            />
          </label>
          <p className="mt-1.5 text-xs text-ink-muted">
            {t("admin.settings.autoOccupy.hint")}
          </p>
        </div>
      </Section>

      {dirty || savedAt ? (
        <div className="sticky bottom-20 z-30 lg:bottom-4">
          <div className="card flex items-center justify-between gap-3 px-4 py-3 shadow-cardHover">
            <p className="text-sm font-semibold text-ink">
              {savedAt ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <Icon name="check" className="h-4 w-4" />
                  {t("admin.settings.savedBar.saved")}
                </span>
              ) : (
                t("admin.settings.savedBar.unsaved")
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraft(stored)}
                disabled={!dirty}
                className="btn-ghost disabled:opacity-40"
              >
                {t("admin.settings.savedBar.discard")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || draft.activePropertyTypes.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                <Icon name="check" className="h-4 w-4" />
                {t("admin.settings.savedBar.save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}

function AmenitiesEditor({
  amenities,
  onChange
}: {
  amenities: string[];
  onChange: (next: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const t = useT();

  function add() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (amenities.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...amenities, trimmed]);
    setInput("");
  }

  function remove(label: string) {
    onChange(amenities.filter((a) => a !== label));
  }

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {amenities.map((a) => (
          <li
            key={a}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1.5 text-xs font-medium text-ink"
          >
            {a}
            <button
              type="button"
              onClick={() => remove(a)}
              aria-label={t("admin.settings.amenities.removeAria", { name: a })}
              className="flex h-5 w-5 items-center justify-center rounded-full text-ink-muted transition hover:bg-red-50 hover:text-red-700"
            >
              <Icon name="x" className="h-3 w-3" />
            </button>
          </li>
        ))}
        {amenities.length === 0 ? (
          <li className="text-xs text-ink-muted">{t("admin.settings.amenities.empty")}</li>
        ) : null}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder={t("admin.settings.amenities.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} className="btn-secondary">
          <Icon name="plus" className="h-4 w-4" />
          {t("common.add")}
        </button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children
}: {
  icon: "map-pin" | "shield" | "message";
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className={`card p-5 ${open ? "space-y-4" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        </div>
        <Icon
          name="chevron-down"
          className={`mt-1 h-4 w-4 shrink-0 text-ink-muted transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open ? children : null}
    </section>
  );
}

function ToggleRow({
  label,
  hint,
  on,
  onChange
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-ink-muted">{hint}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          on ? "bg-brand" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

