"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import {
  ALL_PROPERTY_TYPES,
  getAdminSettings,
  getAdminUids,
  resetAllLocalData,
  saveAdminSettings,
  setAdminUids,
  useAdminSettings,
  useAdminUsers,
  type AdminSettings
} from "@/lib/admin";
import { useSession } from "@/lib/session";
import type { PricePeriod, PropertyType } from "@/lib/types";

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  room: "Room",
  apartment: "Apartment",
  condo: "Condo",
  flat: "Flat",
  house: "House",
  villa: "Villa"
};

const PRICE_PERIOD_LABELS: Record<PricePeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly"
};

function settingsEqual(a: AdminSettings, b: AdminSettings): boolean {
  return (
    a.siteName === b.siteName &&
    a.supportEmail === b.supportEmail &&
    a.supportPhone === b.supportPhone &&
    a.defaultCurrency === b.defaultCurrency &&
    a.autoPublishListings === b.autoPublishListings &&
    a.requirePhoneVerification === b.requirePhoneVerification &&
    a.emailAlertsOnReports === b.emailAlertsOnReports &&
    a.defaultPricePeriod === b.defaultPricePeriod &&
    a.defaultWaterPrice === b.defaultWaterPrice &&
    a.defaultElectricityPrice === b.defaultElectricityPrice &&
    a.defaultWifiPrice === b.defaultWifiPrice &&
    a.exchangeRateKhrPerUsd === b.exchangeRateKhrPerUsd &&
    a.activePropertyTypes.join("|") === b.activePropertyTypes.join("|") &&
    a.amenities.join("|") === b.amenities.join("|")
  );
}

export default function AdminSettingsPage() {
  const stored = useAdminSettings();
  const [draft, setDraft] = useState<AdminSettings>(stored);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const dirty = !settingsEqual(draft, stored);

  function handleSave() {
    saveAdminSettings(draft);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  function handleReset() {
    resetAllLocalData();
    setDraft(getAdminSettings());
    setConfirmReset(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 4000);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage platform-wide configuration. Values persist locally — backend wiring comes later.
        </p>
      </header>

      <Section
        icon="building"
        title="General"
        description="Site identity and contact details shown across FindRoom."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Site name"
            value={draft.siteName}
            onChange={(v) => setDraft({ ...draft, siteName: v })}
          />
          <Field
            label="Support email"
            value={draft.supportEmail}
            onChange={(v) => setDraft({ ...draft, supportEmail: v })}
          />
          <Field
            label="Support phone"
            value={draft.supportPhone}
            onChange={(v) => setDraft({ ...draft, supportPhone: v })}
          />
          <Field
            label="Default currency"
            value={draft.defaultCurrency}
            onChange={(v) => setDraft({ ...draft, defaultCurrency: v })}
          />
        </div>
      </Section>

      <Section
        icon="map-pin"
        title="Listing taxonomy"
        description="Property types and amenities renters can filter by. New listings only see options enabled here."
      >
        <div>
          <p className="label mb-2">Property types</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ALL_PROPERTY_TYPES.map((t) => {
              const on = draft.activePropertyTypes.includes(t);
              return (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        activePropertyTypes: on
                          ? draft.activePropertyTypes.filter((x) => x !== t)
                          : [...draft.activePropertyTypes, t]
                      })
                    }
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                      on
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-slate-200 bg-white text-ink-muted hover:border-slate-300"
                    }`}
                  >
                    <span>{PROPERTY_TYPE_LABELS[t]}</span>
                    {on ? <Icon name="check" className="h-4 w-4" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {draft.activePropertyTypes.length === 0 ? (
            <p className="mt-2 text-xs text-red-700">
              At least one property type must be enabled.
            </p>
          ) : null}
        </div>

        <div>
          <p className="label mb-2">Amenities</p>
          <AmenitiesEditor
            amenities={draft.amenities}
            onChange={(amenities) => setDraft({ ...draft, amenities })}
          />
        </div>
      </Section>

      <Section
        icon="bed"
        title="Pricing defaults"
        description="Pre-fill the list-room form so hosts don't enter the same numbers every time."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-period">Default price period</label>
            <select
              id="s-period"
              className="input"
              value={draft.defaultPricePeriod}
              onChange={(e) =>
                setDraft({ ...draft, defaultPricePeriod: e.target.value as PricePeriod })
              }
            >
              {(Object.keys(PRICE_PERIOD_LABELS) as PricePeriod[]).map((p) => (
                <option key={p} value={p}>
                  {PRICE_PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <NumberField
            label="Exchange rate (KHR per USD)"
            value={draft.exchangeRateKhrPerUsd}
            step={50}
            onChange={(v) => setDraft({ ...draft, exchangeRateKhrPerUsd: v })}
          />
          <NumberField
            label="Water default ($ / m³)"
            value={draft.defaultWaterPrice}
            step={0.05}
            onChange={(v) => setDraft({ ...draft, defaultWaterPrice: v })}
          />
          <NumberField
            label="Electricity default ($ / kWh)"
            value={draft.defaultElectricityPrice}
            step={0.05}
            onChange={(v) => setDraft({ ...draft, defaultElectricityPrice: v })}
          />
          <NumberField
            label="Wi-Fi default ($ / month)"
            value={draft.defaultWifiPrice}
            step={1}
            onChange={(v) => setDraft({ ...draft, defaultWifiPrice: v })}
          />
        </div>
      </Section>

      <Section
        icon="shield"
        title="Moderation"
        description="Defaults for how new listings and accounts are handled."
      >
        <div className="space-y-2">
          <ToggleRow
            label="Auto-publish new listings"
            hint="Off = listings need admin approval before going live."
            on={draft.autoPublishListings}
            onChange={(v) => setDraft({ ...draft, autoPublishListings: v })}
          />
          <ToggleRow
            label="Require phone verification"
            hint="Renters must verify by SMS before contacting hosts."
            on={draft.requirePhoneVerification}
            onChange={(v) => setDraft({ ...draft, requirePhoneVerification: v })}
          />
          <ToggleRow
            label="Send email alerts for reports"
            hint="Notify admins by email when a listing is flagged."
            on={draft.emailAlertsOnReports}
            onChange={(v) => setDraft({ ...draft, emailAlertsOnReports: v })}
          />
        </div>
      </Section>

      <AccessControlSection />

      <Section
        icon="trash"
        title="Danger zone"
        description="Reset all locally-seeded demo data. Useful when you change seeds or want a clean slate."
        tone="danger"
      >
        {resetDone ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Local data has been reset. Reload the page to re-seed.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="btn-danger"
        >
          <Icon name="trash" className="h-4 w-4" />
          Reset local data
        </button>
      </Section>

      {dirty || savedAt ? (
        <div className="sticky bottom-20 z-30 lg:bottom-4">
          <div className="card flex items-center justify-between gap-3 px-4 py-3 shadow-cardHover">
            <p className="text-sm font-semibold text-ink">
              {savedAt ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <Icon name="check" className="h-4 w-4" />
                  Saved
                </span>
              ) : (
                "You have unsaved changes."
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraft(stored)}
                disabled={!dirty}
                className="btn-ghost disabled:opacity-40"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || draft.activePropertyTypes.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                <Icon name="check" className="h-4 w-4" />
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmReset ? (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setConfirmReset(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-cardHover"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700">
                <Icon name="trash" className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold">Reset all local data?</h3>
            </div>
            <p className="text-sm text-ink-muted">
              This clears mock users, mock notifications, settings, and all locally-stored
              listings. Your sign-in session stays. The data will re-seed on next load.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={handleReset} className="btn-danger">
                Reset
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
              aria-label={`Remove ${a}`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-ink-muted transition hover:bg-red-50 hover:text-red-700"
            >
              <Icon name="x" className="h-3 w-3" />
            </button>
          </li>
        ))}
        {amenities.length === 0 ? (
          <li className="text-xs text-ink-muted">No amenities yet.</li>
        ) : null}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Add an amenity (e.g. Rooftop)"
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
          Add
        </button>
      </div>
    </div>
  );
}

function AccessControlSection() {
  const users = useAdminUsers();
  const session = useSession();
  const [uids, setUids] = useState<string[]>([]);
  const [addUid, setAddUid] = useState("");

  useEffect(() => {
    setUids(getAdminUids());
  }, []);

  // Combined view: bootstrap allowlist + anyone with role=admin in the user store.
  const allAdmins = useMemo(() => {
    const seen = new Set<string>();
    const entries: { uid: string; name?: string; phone?: string; sources: string[] }[] = [];
    for (const u of uids) {
      const match = users.find((x) => x.uid === u);
      entries.push({
        uid: u,
        name: match?.username,
        phone: match?.phoneNumber,
        sources: ["Allowlist"]
      });
      seen.add(u);
    }
    for (const u of users) {
      if (u.role === "admin" && !seen.has(u.uid)) {
        entries.push({
          uid: u.uid,
          name: u.username,
          phone: u.phoneNumber,
          sources: ["Role"]
        });
      } else if (u.role === "admin" && seen.has(u.uid)) {
        const e = entries.find((x) => x.uid === u.uid);
        if (e && !e.sources.includes("Role")) e.sources.push("Role");
      }
    }
    return entries;
  }, [uids, users]);

  function commitUids(next: string[]) {
    setUids(next);
    setAdminUids(next);
  }

  function handleAdd() {
    const trimmed = addUid.trim();
    if (!trimmed || uids.includes(trimmed)) {
      setAddUid("");
      return;
    }
    commitUids([...uids, trimmed]);
    setAddUid("");
  }

  function handleRemove(uid: string) {
    // Guard: don't let an admin remove themselves and lock out of the console.
    // The UI also disables the button below, but enforce it here too so a
    // programmatic caller can't bypass the click guard.
    if (uid === session?.uid) return;
    commitUids(uids.filter((u) => u !== uid));
  }

  return (
    <Section
      icon="shield"
      title="Access control"
      description="Who can reach the admin console. The bootstrap allowlist works even if the user directory is empty."
    >
      <div className="space-y-4">
        <div>
          <p className="label mb-2">Current admins</p>
          {allAdmins.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No admins configured. Add at least one uid below before logging out.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {allAdmins.map((a) => (
                <li key={a.uid} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {a.name ?? a.uid}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {a.phone ? `${a.phone} · ` : ""}
                      <span className="font-mono text-[11px]">{a.uid}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {a.sources.map((s) => (
                      <span
                        key={s}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          s === "Allowlist"
                            ? "bg-brand/10 text-brand"
                            : "bg-slate-100 text-ink-muted"
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                    {a.sources.includes("Allowlist") ? (
                      a.uid === session?.uid ? (
                        <button
                          type="button"
                          disabled
                          aria-label="You can't remove yourself"
                          title="You can't remove yourself"
                          className="cursor-not-allowed rounded-full p-1.5 text-slate-300"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemove(a.uid)}
                          aria-label="Remove from allowlist"
                          title="Remove from allowlist"
                          className="rounded-full p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-700"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      )
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="label mb-2">Add to bootstrap allowlist</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="user uid (e.g. demo-85512000000)"
              value={addUid}
              onChange={(e) => setAddUid(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <button type="button" onClick={handleAdd} className="btn-secondary">
              <Icon name="plus" className="h-4 w-4" />
              Add
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-soft">
            For non-allowlist admins, edit a user in{" "}
            <Link href="/user/admin/users" className="font-semibold text-brand hover:underline">
              Users
            </Link>
            {" "}and set their role to Admin.
          </p>
        </div>
      </div>
    </Section>
  );
}

function Section({
  icon,
  title,
  description,
  tone,
  children
}: {
  icon: "building" | "map-pin" | "shield" | "trash" | "bed";
  title: string;
  description: string;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`card space-y-4 p-5 ${tone === "danger" ? "border-red-200/70 bg-red-50/30" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            tone === "danger" ? "bg-red-100 text-red-700" : "bg-brand/10 text-brand"
          }`}
        >
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function NumberField({
  label,
  value,
  step,
  onChange
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input"
        type="number"
        min={0}
        step={step ?? 1}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? n : 0);
        }}
      />
    </label>
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
