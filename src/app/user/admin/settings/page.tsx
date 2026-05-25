"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import SelectField from "@/components/SelectField";
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
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import type { PricePeriod, PropertyType } from "@/lib/types";

const PROPERTY_TYPE_KEYS: Record<PropertyType, string> = {
  room: "admin.propertyType.room",
  apartment: "admin.propertyType.apartment",
  condo: "admin.propertyType.condo",
  flat: "admin.propertyType.flat",
  house: "admin.propertyType.house",
  villa: "admin.propertyType.villa"
};

const PRICE_PERIOD_KEYS: Record<PricePeriod, string> = {
  daily: "admin.pricePeriod.daily",
  weekly: "admin.pricePeriod.weekly",
  monthly: "admin.pricePeriod.monthly",
  yearly: "admin.pricePeriod.yearly"
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
  const t = useT();

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const dirty = !settingsEqual(draft, stored);

  function handleSave() {
    saveAdminSettings(draft);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
    toast.success(t("toast.admin.settings.saved"));
  }

  function handleReset() {
    resetAllLocalData();
    setDraft(getAdminSettings());
    setConfirmReset(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 4000);
    toast.success(t("toast.admin.settings.reset"));
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("admin.settings.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t("admin.settings.subtitle")}
        </p>
      </header>

      <Section
        icon="building"
        title={t("admin.settings.general.title")}
        description={t("admin.settings.general.desc")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={t("admin.settings.field.siteName")}
            value={draft.siteName}
            onChange={(v) => setDraft({ ...draft, siteName: v })}
          />
          <Field
            label={t("admin.settings.field.supportEmail")}
            value={draft.supportEmail}
            onChange={(v) => setDraft({ ...draft, supportEmail: v })}
          />
          <Field
            label={t("admin.settings.field.supportPhone")}
            value={draft.supportPhone}
            onChange={(v) => setDraft({ ...draft, supportPhone: v })}
          />
          <Field
            label={t("admin.settings.field.defaultCurrency")}
            value={draft.defaultCurrency}
            onChange={(v) => setDraft({ ...draft, defaultCurrency: v })}
          />
        </div>
      </Section>

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
        icon="bed"
        title={t("admin.settings.pricing.title")}
        description={t("admin.settings.pricing.desc")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-period">{t("admin.settings.pricing.defaultPeriod")}</label>
            <SelectField<PricePeriod>
              id="s-period"
              ariaLabel={t("admin.settings.pricing.defaultPeriod")}
              value={draft.defaultPricePeriod}
              options={(Object.keys(PRICE_PERIOD_KEYS) as PricePeriod[]).map((p) => ({
                value: p,
                label: t(PRICE_PERIOD_KEYS[p])
              }))}
              onChange={(v) => setDraft({ ...draft, defaultPricePeriod: v })}
            />
          </div>
          <NumberField
            label={t("admin.settings.pricing.exchangeRate")}
            value={draft.exchangeRateKhrPerUsd}
            step={50}
            onChange={(v) => setDraft({ ...draft, exchangeRateKhrPerUsd: v })}
          />
          <NumberField
            label={t("admin.settings.pricing.water")}
            value={draft.defaultWaterPrice}
            step={0.05}
            onChange={(v) => setDraft({ ...draft, defaultWaterPrice: v })}
          />
          <NumberField
            label={t("admin.settings.pricing.electricity")}
            value={draft.defaultElectricityPrice}
            step={0.05}
            onChange={(v) => setDraft({ ...draft, defaultElectricityPrice: v })}
          />
          <NumberField
            label={t("admin.settings.pricing.wifi")}
            value={draft.defaultWifiPrice}
            step={1}
            onChange={(v) => setDraft({ ...draft, defaultWifiPrice: v })}
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
            on={draft.autoPublishListings}
            onChange={(v) => setDraft({ ...draft, autoPublishListings: v })}
          />
          <ToggleRow
            label={t("admin.settings.moderation.phoneVerification")}
            hint={t("admin.settings.moderation.phoneVerification.hint")}
            on={draft.requirePhoneVerification}
            onChange={(v) => setDraft({ ...draft, requirePhoneVerification: v })}
          />
          <ToggleRow
            label={t("admin.settings.moderation.emailAlerts")}
            hint={t("admin.settings.moderation.emailAlerts.hint")}
            on={draft.emailAlertsOnReports}
            onChange={(v) => setDraft({ ...draft, emailAlertsOnReports: v })}
          />
        </div>
      </Section>

      <AccessControlSection />

      <Section
        icon="trash"
        title={t("admin.settings.danger.title")}
        description={t("admin.settings.danger.desc")}
        tone="danger"
      >
        {resetDone ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {t("admin.settings.danger.resetDone")}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="btn-danger"
        >
          <Icon name="trash" className="h-4 w-4" />
          {t("admin.settings.danger.resetButton")}
        </button>
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
              <h3 className="text-base font-bold">{t("admin.settings.confirmReset.title")}</h3>
            </div>
            <p className="text-sm text-ink-muted">
              {t("admin.settings.confirmReset.body")}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="btn-ghost">
                {t("common.cancel")}
              </button>
              <button type="button" onClick={handleReset} className="btn-danger">
                {t("common.reset")}
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

function AccessControlSection() {
  const users = useAdminUsers();
  const session = useSession();
  const [uids, setUids] = useState<string[]>([]);
  const [addUid, setAddUid] = useState("");
  const t = useT();

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
      title={t("admin.settings.access.title")}
      description={t("admin.settings.access.desc")}
    >
      <div className="space-y-4">
        <div>
          <p className="label mb-2">{t("admin.settings.access.currentAdmins")}</p>
          {allAdmins.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {t("admin.settings.access.noAdmins")}
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
                        {s === "Allowlist" ? t("admin.settings.access.allowlist") : t("admin.settings.access.role")}
                      </span>
                    ))}
                    {a.sources.includes("Allowlist") ? (
                      a.uid === session?.uid ? (
                        <button
                          type="button"
                          disabled
                          aria-label={t("admin.settings.access.cantRemoveSelf")}
                          title={t("admin.settings.access.cantRemoveSelf")}
                          className="cursor-not-allowed rounded-full p-1.5 text-slate-300"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemove(a.uid)}
                          aria-label={t("admin.settings.access.removeFromAllowlist")}
                          title={t("admin.settings.access.removeFromAllowlist")}
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
          <p className="label mb-2">{t("admin.settings.access.addLabel")}</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder={t("admin.settings.access.addPlaceholder")}
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
              {t("common.add")}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-soft">
            {t("admin.settings.access.helperPrefix")}{" "}
            <Link href="/user/admin/users" className="font-semibold text-brand hover:underline">
              {t("admin.settings.access.helperLink")}
            </Link>
            {t("admin.settings.access.helperSuffix")}
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
