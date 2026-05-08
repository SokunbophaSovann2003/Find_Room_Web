"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { amenityIcon } from "@/components/Icon";
import LocationPicker, { type LocationValue } from "@/components/LocationPicker";
import { useSession } from "@/lib/session";
import { addLocalRoom } from "@/lib/local-rooms";
import { downscalePhoto } from "@/lib/image";
import { loadOverrides } from "@/lib/profile-overrides";
import type { Room, PropertyType } from "@/lib/types";

const AMENITIES = [
  "Wi-Fi",
  "Air conditioning",
  "Parking",
  "Security",
  "Kitchen",
  "Elevator",
  "Pool",
  "Gym",
  "Laundry",
  "Balcony"
];

const FEE_TYPES = [
  { value: "rent", label: "Monthly rent", unit: "/ month" },
  { value: "deposit", label: "Deposit", unit: "" },
  { value: "electricity", label: "Electricity", unit: "/ kWh" },
  { value: "water", label: "Water", unit: "/ m³" },
  { value: "wifi", label: "Wi-Fi", unit: "/ month" },
  { value: "service", label: "Service charge", unit: "/ month" },
  { value: "parking", label: "Parking", unit: "/ month" },
  { value: "other", label: "Other", unit: "" }
];

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: "room", label: "Room" },
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "flat", label: "Flat" },
  { value: "villa", label: "Villa" }
];

function formatLocation(loc: LocationValue): string {
  return [loc.province, loc.district, loc.area].filter(Boolean).join(", ");
}

interface FeeRow {
  id: number;
  type: string;
  price: string;
}

interface PhotoItem {
  id: number;
  file: File;
  url: string;
}

const newId = (() => {
  let n = 0;
  return () => ++n;
})();

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_PHOTOS = 5;

function parseCoord(val: string, range: number): number | undefined {
  if (!val.trim()) return undefined;
  const n = Number(val);
  if (!Number.isFinite(n) || n < -range || n > range) return undefined;
  return n;
}

export default function ListRoomPage() {
  const router = useRouter();
  const session = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PropertyType>("apartment");
  const [bedrooms, setBedrooms] = useState(1);
  const [floor, setFloor] = useState(1);
  const [areaSqm, setAreaSqm] = useState<string>("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<LocationValue>({});
  const [locationOpen, setLocationOpen] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [profileOverrides, setProfileOverrides] = useState<{
    contactPhones?: string[];
    telegramPhones?: string[];
    username?: string;
  }>({});

  useEffect(() => {
    const saved = loadOverrides();
    setProfileOverrides({
      contactPhones: saved.contactPhones,
      telegramPhones: saved.telegramPhones,
      username: saved.username
    });
  }, []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fees, setFees] = useState<FeeRow[]>([{ id: newId(), type: "rent", price: "" }]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Your browser doesn't support location access.");
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoBusy(false);
        setError(null);
      },
      () => {
        setGeoBusy(false);
        setError("Couldn't get your location. Enter coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const accepted: File[] = [];
    let oversized = 0;
    for (const file of Array.from(files)) {
      if (file.size > MAX_PHOTO_BYTES) {
        oversized += 1;
        continue;
      }
      accepted.push(file);
    }
    if (oversized > 0) {
      setError(
        `${oversized} photo${oversized === 1 ? " is" : "s are"} larger than 10 MB and ${oversized === 1 ? "was" : "were"} skipped.`
      );
    } else {
      setError(null);
    }
    if (accepted.length === 0) return;
    const items: PhotoItem[] = accepted.map((file) => ({
      id: newId(),
      file,
      url: URL.createObjectURL(file)
    }));
    setPhotos((prev) => [...prev, ...items].slice(0, MAX_PHOTOS));
  }
  function removePhoto(id: number) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  function toggle(a: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  }

  function updateFee(id: number, patch: Partial<FeeRow>) {
    setFees((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function removeFee(id: number) {
    setFees((prev) => prev.filter((f) => f.id !== id));
  }
  function addFee() {
    const used = new Set(fees.map((f) => f.type));
    const next = FEE_TYPES.find((t) => !used.has(t.value)) ?? FEE_TYPES[FEE_TYPES.length - 1];
    setFees((prev) => [...prev, { id: newId(), type: next.value, price: "" }]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!session) {
      setError("You need to be signed in to publish a listing.");
      return;
    }
    if (!title.trim()) return failWith("Add a title for your listing.");
    if (!description.trim()) return failWith("Add a short description.");
    if (!address.trim()) return failWith("Add the room address.");
    if (!location.province) return failWith("Pick a province for your listing.");

    const rentFee = fees.find((f) => f.type === "rent");
    const rentValue = Number(rentFee?.price);
    if (!rentFee || !Number.isFinite(rentValue) || rentValue <= 0) {
      return failWith("Set a monthly rent amount.");
    }

    setSubmitting(true);
    try {
      const images = await Promise.all(
        photos.slice(0, MAX_PHOTOS).map((p) => downscalePhoto(p.file))
      );

      const num = (val: string) => {
        const n = Number(val);
        return Number.isFinite(n) && n > 0 ? n : undefined;
      };
      const feeBy = (key: string) => fees.find((f) => f.type === key);
      const ownerPhones = profileOverrides.contactPhones ?? [];
      const ownerTelegrams = profileOverrides.telegramPhones ?? [];

      const room: Room = {
        id: `local-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        price: rentValue,
        currency: "USD",
        deposit: num(feeBy("deposit")?.price ?? ""),
        electricityPrice: num(feeBy("electricity")?.price ?? ""),
        waterPrice: num(feeBy("water")?.price ?? ""),
        wifiPrice: num(feeBy("wifi")?.price ?? ""),
        otherFees: fees
          .filter((f) => !["rent", "deposit", "electricity", "water", "wifi"].includes(f.type) && f.price.trim())
          .map((f) => ({
            label: FEE_TYPES.find((t) => t.value === f.type)?.label ?? f.type,
            amount: `$${f.price}${FEE_TYPES.find((t) => t.value === f.type)?.unit ?? ""}`.trim()
          })),
        type,
        address: address.trim(),
        city: location.province,
        district: location.district,
        area: location.area,
        lat: parseCoord(lat, 90),
        lng: parseCoord(lng, 180),
        bedrooms,
        areaSqm: num(areaSqm),
        floor,
        amenities: Array.from(selected),
        images,
        owner: {
          id: session.uid,
          name: profileOverrides.username ?? session.username ?? "FindRoom user",
          phoneNumbers: ownerPhones,
          telegramPhones: ownerTelegrams.length ? ownerTelegrams : undefined,
          memberSince: new Date().toISOString().slice(0, 10),
          listingsCount: 1
        },
        createdAt: Date.now()
      };

      addLocalRoom(room);
      router.replace("/profile");
    } catch (err) {
      setSubmitting(false);
      failWith(err instanceof Error ? err.message : "Could not save the listing.");
    }
  }

  function failWith(msg: string) {
    setError(msg);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  return (
    <div className="pb-24 sm:pb-0">
      <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6 sm:pt-8">
        <nav className="mb-3 flex items-center gap-2 text-sm text-ink-muted">
          <Link href="/profile" className="hover:text-brand">
            Profile
          </Link>
          <span>›</span>
          <span className="text-ink">List a room</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            List your room
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Just a few details — you can edit anything after publishing.
          </p>
        </header>

        <form id="list-room-form" className="space-y-5" onSubmit={handleSubmit}>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="space-y-3 p-4 sm:p-5">
              <FieldHeading>Listing</FieldHeading>
              <div>
                <input
                  id="title"
                  className="input"
                  placeholder="Title — e.g. Cozy studio near Riverside"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <textarea
                id="description"
                rows={3}
                className="input"
                placeholder="Short description — neighbourhood, vibe, anything special…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
              <Field label="Type">
                <select
                  className="input"
                  value={type}
                  onChange={(e) => setType(e.target.value as PropertyType)}
                >
                  {PROPERTY_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Beds">
                <input
                  type="number"
                  min={0}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Math.max(0, Number(e.target.value) || 0))}
                  className="input"
                />
              </Field>
              <Field label="Floor">
                <input
                  type="number"
                  min={0}
                  value={floor}
                  onChange={(e) => setFloor(Math.max(0, Number(e.target.value) || 0))}
                  className="input"
                />
              </Field>
              <Field label="Area (m²)">
                <input
                  type="number"
                  min={0}
                  placeholder="28"
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 sm:p-5">
              <Field label="Province / district / area">
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  className="input flex items-center justify-between text-left"
                >
                  <span className={`min-w-0 flex-1 truncate ${location.province ? "text-ink" : "text-ink-soft"}`}>
                    {formatLocation(location) || "Pick province, then district / area…"}
                  </span>
                  <Icon name="chevron-down" className="ml-2 h-4 w-4 shrink-0 text-ink-soft" />
                </button>
              </Field>
              <Field label="Street address">
                <input
                  className="input"
                  placeholder="St. 110"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude">
                  <input
                    className="input"
                    placeholder="11.5564"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    className="input"
                    placeholder="104.9282"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    inputMode="decimal"
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoBusy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-ink-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <Icon name="map-pin" className="h-4 w-4" />
                {geoBusy ? "Locating…" : "Use my current location"}
              </button>
              <p className="text-xs text-ink-soft">
                Coordinates pin the room on the map. Optional — leave blank to fall back to the address.
              </p>
            </div>
          </div>

          <ContactSummary
            phones={profileOverrides.contactPhones ?? []}
            telegrams={profileOverrides.telegramPhones ?? []}
          />

          <section>
            <FieldHeading className="mb-2">
              Photos
              {photos.length > 0 ? (
                <span className="ml-1.5 text-ink-muted">({photos.length}/{MAX_PHOTOS})</span>
              ) : null}
            </FieldHeading>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.length < MAX_PHOTOS ? (
                <li>
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-white text-ink-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Icon name="plus" className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold">
                      {photos.length === 0 ? "Add photos" : "Add more"}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        addPhotos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </li>
              ) : null}
              {photos.map((p) => (
                <li
                  key={p.id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.file.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    aria-label="Remove photo"
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-ink shadow transition hover:bg-white"
                  >
                    <Icon name="x" className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-soft">
              Up to {MAX_PHOTOS} photos · PNG or JPG · max 10 MB each
            </p>
          </section>

          <section>
            <FieldHeading className="mb-2">Amenities</FieldHeading>
            <ul className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const active = selected.has(a);
                return (
                  <li key={a}>
                    <button
                      type="button"
                      onClick={() => toggle(a)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                        active
                          ? "border-brand bg-brand text-white"
                          : "border-slate-200 bg-white text-ink hover:border-slate-300"
                      }`}
                    >
                      <Icon
                        name={amenityIcon(a)}
                        className={`h-3.5 w-3.5 ${active ? "text-white" : "text-brand"}`}
                      />
                      <span className="font-semibold">{a}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <FieldHeading className="mb-2">Pricing</FieldHeading>
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              {fees.map((fee) => {
                const meta = FEE_TYPES.find((t) => t.value === fee.type) ?? FEE_TYPES[0];
                const canRemove = fees.length > 1;
                return (
                  <div
                    key={fee.id}
                    className="flex items-center gap-2"
                  >
                    <select
                      value={fee.type}
                      onChange={(e) => updateFee(fee.id, { type: e.target.value })}
                      className="input h-10 flex-1 sm:max-w-[180px]"
                    >
                      {FEE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex h-10 flex-1 items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                      <span className="flex items-center px-2.5 text-sm font-semibold text-ink-muted">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={fee.price}
                        onChange={(e) => updateFee(fee.id, { price: e.target.value })}
                        placeholder="0"
                        className="w-full bg-transparent px-1 text-sm outline-none"
                      />
                      {meta.unit ? (
                        <span className="flex items-center whitespace-nowrap border-l border-slate-200 bg-slate-50 px-3 text-xs font-medium text-ink-muted">
                          {meta.unit}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFee(fee.id)}
                      disabled={!canRemove}
                      aria-label="Remove fee"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Icon name="x" className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addFee}
                className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-ink-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand sm:w-auto"
              >
                <Icon name="plus" className="h-4 w-4" />
                Add fee
              </button>
            </div>
          </section>

          {error ? (
            <p
              ref={errorRef}
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <div className="hidden items-center justify-end gap-2 pt-2 sm:flex">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Publishing…" : "Publish listing"}
              {submitting ? null : <Icon name="arrow-right" className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <button
          type="submit"
          form="list-room-form"
          disabled={submitting}
          className="btn-primary h-11 w-full justify-center"
        >
          {submitting ? "Publishing…" : "Publish"}
          {submitting ? null : <Icon name="arrow-right" className="h-4 w-4" />}
        </button>
      </div>

      <LocationPicker
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        value={location}
        onChange={(next) => setLocation(next)}
      />
    </div>
  );
}

function FieldHeading({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-[11px] font-semibold uppercase tracking-wide text-ink-soft ${className}`}>
      {children}
    </h2>
  );
}

function Field({
  label,
  className = "",
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function ContactSummary({
  phones,
  telegrams
}: {
  phones: string[];
  telegrams: string[];
}) {
  const isEmpty = phones.length === 0 && telegrams.length === 0;
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <FieldHeading>Contact</FieldHeading>
      {isEmpty ? (
        <p className="text-sm text-ink-muted">
          No contact channels yet — renters won&rsquo;t be able to reach you.
        </p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {phones.map((p) => (
            <li key={`p-${p}`} className="flex items-center gap-2">
              <Icon name="phone" className="h-4 w-4 shrink-0 text-brand" />
              <span className="font-semibold text-ink">{p}</span>
            </li>
          ))}
          {telegrams.map((t) => (
            <li key={`t-${t}`} className="flex items-center gap-2">
              <Icon name="telegram" className="h-4 w-4 shrink-0 text-brand" />
              <span className="font-semibold text-ink">{t}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink-soft">
        Listings inherit the contact channels from your{" "}
        <Link
          href="/profile"
          className="font-semibold text-brand hover:text-brand-dark"
        >
          profile
        </Link>
        . Add or update them there.
      </p>
    </div>
  );
}
