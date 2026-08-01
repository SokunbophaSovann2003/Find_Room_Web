"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import ContactListEditor from "@/components/ContactListEditor";
import PriceRangeInputs from "@/components/PriceRangeInputs";
import LocationPicker, { type LocationValue } from "@/components/LocationPicker";
import PropertyTypePicker from "@/components/PropertyTypePicker";
import { useSession, getSession } from "@/lib/session";
import { submitRoomWanted } from "@/lib/wanted";
import { toast } from "@/lib/toast";
import { useT, useLanguage } from "@/lib/language";
import { locationDisplayName } from "@/lib/locations";
import type { PropertyType } from "@/lib/types";

export default function WantRoomPage() {
  const router = useRouter();
  const session = useSession();
  const t = useT();
  const { language } = useLanguage();

  const [phones, setPhones] = useState<string[]>([session?.phoneNumber ?? ""]);
  const [telegrams, setTelegrams] = useState<string[]>([""]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [location, setLocation] = useState<LocationValue>({});
  const [locationOpen, setLocationOpen] = useState(false);
  const [propertyType, setPropertyType] = useState<PropertyType | "any">("any");
  const [typeOpen, setTypeOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const locationLabel = [location.area, location.district, location.province]
    .filter((v): v is string => Boolean(v))
    .map((part) => locationDisplayName(part, language))
    .join(", ");

  // Login is gated by the Explore CTA (popup opens in context). Direct signed-out
  // access to this URL redirects to Explore instead of showing a blank page.
  useEffect(() => {
    // Synchronous check so a logged-in visitor (whose reactive session is null
    // on first render) isn't bounced back to Explore.
    if (!getSession()) router.replace("/explore");
  }, [router]);

  if (!session) return null;

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
    const cleanPhones = phones.map((p) => p.trim()).filter(Boolean).slice(0, 5);
    const cleanTelegrams = telegrams.map((tg) => tg.trim()).filter(Boolean).slice(0, 5);
    if (cleanPhones.length === 0) {
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
        renterName: (getSession()?.username || t("common.anonymousUser")).slice(0, 100),
        renterPhones: cleanPhones,
        renterTelegrams: cleanTelegrams,
        budgetMin: posInt(budgetMin),
        budgetMax: posInt(budgetMax),
        province: location.province ?? "",
        district: location.district ?? "",
        area: location.area ?? "",
        propertyType,
        bedrooms: null,
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
        {/* Contact — add as many phone numbers / Telegram handles as needed */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-ink">{t("findRoom.contact.title")}</h2>
          <div>
            <ContactListEditor
              label={t("listRoom.contact.phones.heading")}
              iconName="phone"
              placeholder="012 345 678"
              values={phones}
              onChange={(next) => { setPhones(next); setPhoneError(""); }}
              addLabel={t("listRoom.contact.phone.add")}
            />
            {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
          </div>
          <ContactListEditor
            label={t("listRoom.contact.telegram.heading")}
            iconName="telegram"
            placeholder="012 345 678"
            values={telegrams}
            onChange={setTelegrams}
            addLabel={t("listRoom.contact.telegram.add")}
          />
        </section>

        <div>
          <span className="label">{t("findRoom.field.budget")}</span>
          <PriceRangeInputs
            className="mt-1"
            min={budgetMin}
            max={budgetMax}
            onChange={(mn, mx) => { setBudgetMin(mn); setBudgetMax(mx); }}
          />
        </div>

        <div>
          <span className="label">{t("findRoom.field.location")}</span>
          <div className="input mt-1 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className={`flex-1 text-left ${locationLabel ? "text-ink" : "text-ink-soft"}`}
            >
              {locationLabel || t("findRoom.field.anyLocation")}
            </button>
            {locationLabel ? (
              <button
                type="button"
                onClick={() => setLocation({})}
                aria-label={t("common.clear")}
                className="shrink-0 rounded-full p-0.5 text-ink-soft transition hover:bg-slate-100 hover:text-ink"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLocationOpen(true)}
                aria-label={t("findRoom.field.location")}
                className="shrink-0 text-ink-soft"
              >
                <Icon name="map-pin" className="h-4 w-4" />
              </button>
            )}
          </div>
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
          <div className="input mt-1 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setTypeOpen(true)}
              className={`flex-1 text-left ${propertyType !== "any" ? "text-ink" : "text-ink-soft"}`}
            >
              {propertyType === "any" ? t("findRoom.field.anyType") : t(`admin.propertyType.${propertyType}`)}
            </button>
            {propertyType === "any" ? (
              <button
                type="button"
                onClick={() => setTypeOpen(true)}
                aria-label={t("findRoom.field.type")}
                className="shrink-0 text-ink-soft"
              >
                <Icon name="chevron-down" className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPropertyType("any")}
                aria-label={t("common.clear")}
                className="shrink-0 rounded-full p-0.5 text-ink-soft transition hover:bg-slate-100 hover:text-ink"
              >
                <Icon name="x" className="h-4 w-4" />
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
