"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import AuthModal from "@/components/AuthModal";
import PriceRangePicker from "@/components/PriceRangePicker";
import LocationPicker, { type LocationValue } from "@/components/LocationPicker";
import PropertyTypePicker from "@/components/PropertyTypePicker";
import { useSession } from "@/lib/session";
import { submitRoomWanted } from "@/lib/wanted";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import type { PropertyType } from "@/lib/types";

export default function WantRoomPage() {
  const router = useRouter();
  const session = useSession();
  const t = useT();

  const [authOpen, setAuthOpen] = useState(false);
  const [name, setName] = useState(session?.username ?? "");
  const [phone, setPhone] = useState(session?.phoneNumber ?? "");
  const [telegram, setTelegram] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [location, setLocation] = useState<LocationValue>({});
  const [locationOpen, setLocationOpen] = useState(false);
  const [propertyType, setPropertyType] = useState<PropertyType | "any">("any");
  const [typeOpen, setTypeOpen] = useState(false);
  const [bedrooms, setBedrooms] = useState("");
  const [notes, setNotes] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const locationLabel = [location.area, location.district, location.province].filter(Boolean).join(", ");

  if (!session) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Icon name="home" className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-extrabold">{t("wantRoom.login.title")}</h1>
        <p className="text-sm text-ink-muted">{t("wantRoom.login.body")}</p>
        <button type="button" className="btn-primary" onClick={() => setAuthOpen(true)}>
          {t("findRoom.login.cta")}
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} defaultTab="login" />
      </div>
    );
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-extrabold">{t("wantRoom.success.title")}</h1>
        <p className="max-w-sm text-sm text-ink-muted">{t("wantRoom.success.body")}</p>
        <button type="button" className="btn-primary mt-2" onClick={() => router.push("/explore")}>
          {t("findRoom.success.done")}
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError("");
    if (!phone.trim()) {
      setPhoneError(t("findRoom.error.phoneRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const posInt = (s: string): number | null => {
        const n = Math.round(Number(s));
        return s.trim() && Number.isFinite(n) ? Math.max(0, n) : null;
      };
      await submitRoomWanted({
        renterId: session!.uid,
        renterName: (name.trim() || t("common.anonymousUser")).slice(0, 100),
        renterPhone: phone.trim().slice(0, 32),
        renterTelegram: telegram.trim().slice(0, 32),
        budgetMin: posInt(budgetMin),
        budgetMax: posInt(budgetMax),
        province: location.province ?? "",
        district: location.district ?? "",
        area: location.area ?? "",
        propertyType,
        bedrooms: posInt(bedrooms),
        notes: notes.trim().slice(0, 2000),
      });
      toast.success(t("wantRoom.toast.posted"));
      setSent(true);
    } catch {
      toast.error(t("findRoom.error.failed"));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t("wantRoom.title.before")} <span className="text-brand">{t("wantRoom.title.highlight")}</span>
        </h1>
        <p className="mt-2 text-sm text-ink-muted">{t("wantRoom.subtitle")}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">{t("findRoom.field.name")}</span>
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">{t("findRoom.field.phone")}</span>
            <input
              className={`input mt-1 ${phoneError ? "border-red-400" : ""}`}
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
            />
            {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
          </label>
        </div>

        <label className="block">
          <span className="label">{t("wantRoom.field.telegram")}</span>
          <input className="input mt-1" type="tel" placeholder={t("wantRoom.field.telegram.placeholder")} value={telegram} onChange={(e) => setTelegram(e.target.value)} />
        </label>

        <div>
          <span className="label">{t("findRoom.field.budget")}</span>
          <div className="mt-1">
            <PriceRangePicker
              min={budgetMin}
              max={budgetMax}
              placeholder={t("findRoom.field.anyBudget")}
              onChange={(mn, mx) => { setBudgetMin(mn); setBudgetMax(mx); }}
            />
          </div>
        </div>

        <div>
          <span className="label">{t("findRoom.field.location")}</span>
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="input mt-1 flex w-full items-center justify-between gap-2 text-left"
          >
            <span className={locationLabel ? "text-ink" : "text-ink-soft"}>
              {locationLabel || t("findRoom.field.anyLocation")}
            </span>
            <Icon name="map-pin" className="h-4 w-4 shrink-0 text-ink-soft" />
          </button>
          <LocationPicker
            open={locationOpen}
            onClose={() => setLocationOpen(false)}
            mode="modal"
            intent="select"
            value={location}
            onChange={setLocation}
          />
        </div>

        <div>
          <span className="label">{t("findRoom.field.type")}</span>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTypeOpen(true)}
              className="input flex flex-1 items-center justify-between gap-2 text-left"
            >
              <span className={propertyType !== "any" ? "text-ink" : "text-ink-soft"}>
                {propertyType === "any" ? t("findRoom.field.anyType") : t(`admin.propertyType.${propertyType}`)}
              </span>
              <Icon name="chevron-down" className="h-4 w-4 shrink-0 text-ink-soft" />
            </button>
            {propertyType !== "any" && (
              <button type="button" onClick={() => setPropertyType("any")} className="btn-ghost shrink-0 text-xs">
                {t("common.clear")}
              </button>
            )}
          </div>
          <PropertyTypePicker
            open={typeOpen}
            onClose={() => setTypeOpen(false)}
            onPick={(ty) => { setPropertyType(ty); setTypeOpen(false); }}
          />
        </div>

        <label className="block">
          <span className="label">{t("findRoom.field.bedrooms")}</span>
          <input
            className="input mt-1"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t("findRoom.field.anyBedrooms")}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="label">{t("findRoom.field.notes")}</span>
          <textarea
            className="input mt-1 min-h-[110px] resize-y"
            placeholder={t("findRoom.field.notes.placeholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
          {submitting ? t("findRoom.submitting") : t("wantRoom.submit")}
        </button>
      </form>
    </div>
  );
}
