"use client";

import dynamic from "next/dynamic";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon, { amenityIcon } from "@/components/Icon";
import LocationPicker, { type LocationValue } from "@/components/LocationPicker";
import ContactListEditor from "@/components/ContactListEditor";
import { useSession } from "@/lib/session";
import { addLocalRoom, getLocalRoomById, updateLocalRoom } from "@/lib/local-rooms";
import { findRoomById } from "@/lib/mock-data";
import { downscalePhoto } from "@/lib/image";
import { loadOverrides } from "@/lib/profile-overrides";
import { DEFAULT_AMENITIES, getAdminSettings, pushIncomingNotification } from "@/lib/admin";
import ConfirmModal from "@/components/ConfirmModal";
import SelectField from "@/components/SelectField";
import {
  clearListRoomPrefs,
  loadListRoomPrefs,
  saveListRoomPrefs,
  type ListRoomFeePref
} from "@/lib/list-room-prefs";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import type { Room, PropertyType, PricePeriod } from "@/lib/types";

const PRICE_PERIODS: { value: PricePeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
];

const FEE_UNIT_KEYS: Record<string, string> = {
  electricity: "room.fee.electricity.unit",
  water: "room.fee.water.unit",
  wifi: "room.fee.wifi.unit",
  service: "room.suffix.monthly",
  parking: "room.suffix.monthly",
};

import type { PinValue } from "@/components/MapPinPicker";

const MapPinPicker = dynamic(() => import("@/components/MapPinPicker"), {
  ssr: false
});

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


function formatLocation(loc: LocationValue): string {
  return [loc.province, loc.district, loc.area].filter(Boolean).join(", ");
}

interface FeeRow {
  id: number;
  type: string;
  price: string;
  customLabel?: string;
  customUnit?: string;
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

export default function ListRoomPage() {
  const router = useRouter();
  const session = useSession();
  const t = useT();
  const searchParams = useSearchParams();
  const editingId = searchParams?.get("editing") ?? null;
  const isEditing = !!editingId;
  // Read admin-configured defaults once per mount — settings changes
  // mid-edit shouldn't snap the user's typed values.
  const settingsRef = useRef(getAdminSettings());
  const settings = settingsRef.current;
  const amenityOptions = settings.amenities.length > 0 ? settings.amenities : DEFAULT_AMENITIES;
  const initialType = ((): PropertyType => {
    const q = searchParams?.get("type");
    const valid = settings.activePropertyTypes;
    return valid.includes(q as PropertyType) ? (q as PropertyType) : valid[0] ?? "apartment";
  })();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PropertyType>(initialType);
  const [bedrooms, setBedrooms] = useState(1);
  const [floor, setFloor] = useState(1);
  const [areaSqm, setAreaSqm] = useState<string>("");
  const [location, setLocation] = useState<LocationValue>({});
  const [locationOpen, setLocationOpen] = useState(false);
  const [pin, setPin] = useState<PinValue | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [rentPeriod, setRentPeriod] = useState<PricePeriod>(settings.defaultPricePeriod);
  const pinFetchRef = useRef(0);

  async function handlePinChange(next: PinValue | null) {
    setPin(next);
    if (!next) return;
    const reqId = ++pinFetchRef.current;
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${next.lat}&lon=${next.lng}&format=json&zoom=18&accept-language=en`,
        { headers: { accept: "application/json" } }
      );
      if (!r.ok) return;
      const j = (await r.json()) as { display_name?: string };
      if (pinFetchRef.current !== reqId) return;
      const display = j.display_name ?? "";
      const name = display.split(",").slice(0, 3).map((s) => s.trim()).filter(Boolean).join(", ");
      if (name) setPin({ ...next, name });
    } catch {
      // Network/JSON errors fall back to coordinates — non-fatal.
    }
  }
  const [savedUsername, setSavedUsername] = useState<string | undefined>();
  // Per-listing contacts. Seeded with the user's login phone the first time
  // the form renders so a brand-new user has a sensible default; the user can
  // edit, add, or clear them freely before publishing.
  const [contactPhones, setContactPhones] = useState<string[]>([""]);
  const [telegramPhones, setTelegramPhones] = useState<string[]>([""]);

  useEffect(() => {
    if (!session?.uid) return;
    const saved = loadOverrides(session.uid);
    setSavedUsername(saved.username);
  }, [session?.uid]);

  useEffect(() => {
    if (session?.phoneNumber) {
      setContactPhones((prev) =>
        prev.length === 1 && prev[0] === "" ? [session.phoneNumber!] : prev
      );
    }
  }, [session?.phoneNumber]);

  // When the user copies a listing, we navigate here with ?copyFrom=<id>.
  // Pre-fill every field except photos (those require File objects we can't
  // synthesise from URLs cleanly — the user re-adds them).
  const copyAppliedRef = useRef(false);
  useEffect(() => {
    if (copyAppliedRef.current) return;
    const copyId = searchParams?.get("copyFrom");
    if (!copyId) return;
    const source = getLocalRoomById(copyId) ?? findRoomById(copyId);
    if (!source) return;
    copyAppliedRef.current = true;

    setTitle(`${t("listRoom.copyPrefix")} ${source.title}`);
    setDescription(source.description);
    setType(source.type);
    setBedrooms(source.bedrooms);
    setFloor(source.floor ?? 1);
    setAreaSqm(source.areaSqm ? String(source.areaSqm) : "");
    setLocation({
      province: source.city,
      district: source.district,
      area: source.area
    });
    if (typeof source.lat === "number" && typeof source.lng === "number") {
      setPin({ lat: source.lat, lng: source.lng, name: source.address });
    }
    setSelected(new Set(source.amenities ?? []));
    setRentPeriod(source.pricePeriod ?? "monthly");

    const nextFees: FeeRow[] = [
      { id: newId(), type: "rent", price: String(source.price) }
    ];
    if (source.deposit !== undefined)
      nextFees.push({ id: newId(), type: "deposit", price: String(source.deposit) });
    if (source.electricityPrice !== undefined)
      nextFees.push({ id: newId(), type: "electricity", price: String(source.electricityPrice) });
    if (source.waterPrice !== undefined)
      nextFees.push({ id: newId(), type: "water", price: String(source.waterPrice) });
    if (source.wifiPrice !== undefined)
      nextFees.push({ id: newId(), type: "wifi", price: String(source.wifiPrice) });
    if (source.otherFees) {
      for (const f of source.otherFees) {
        const m = /^\$?([\d.]+)\s*(.*)$/.exec(f.amount.trim());
        nextFees.push({
          id: newId(),
          type: "other",
          price: m ? m[1] : "",
          customLabel: f.label,
          customUnit: m && m[2] ? m[2].trim() : undefined
        });
      }
    }
    setFees(nextFees);

    if (source.owner.phoneNumbers.length) {
      setContactPhones(source.owner.phoneNumbers);
    }
    if (source.owner.telegramPhones?.length) {
      setTelegramPhones(source.owner.telegramPhones);
    }
  }, [searchParams]);

  // Editing an existing listing: hydrate every field from the source room
  // (no title prefix, photos preserved as URLs). Mirrors the copy flow but
  // keeps the listing's id and createdAt on submit.
  const editAppliedRef = useRef(false);
  useEffect(() => {
    if (editAppliedRef.current) return;
    if (!editingId) return;
    const source = getLocalRoomById(editingId) ?? findRoomById(editingId);
    if (!source) return;
    editAppliedRef.current = true;

    setTitle(source.title);
    setDescription(source.description);
    setType(source.type);
    setBedrooms(source.bedrooms);
    setFloor(source.floor ?? 1);
    setAreaSqm(source.areaSqm ? String(source.areaSqm) : "");
    setLocation({
      province: source.city,
      district: source.district,
      area: source.area
    });
    if (typeof source.lat === "number" && typeof source.lng === "number") {
      setPin({ lat: source.lat, lng: source.lng, name: source.address });
    }
    setSelected(new Set(source.amenities ?? []));
    setRentPeriod(source.pricePeriod ?? "monthly");
    setExistingImages(source.images ?? []);

    const nextFees: FeeRow[] = [
      { id: newId(), type: "rent", price: String(source.price) }
    ];
    if (source.deposit !== undefined)
      nextFees.push({ id: newId(), type: "deposit", price: String(source.deposit) });
    if (source.electricityPrice !== undefined)
      nextFees.push({ id: newId(), type: "electricity", price: String(source.electricityPrice) });
    if (source.waterPrice !== undefined)
      nextFees.push({ id: newId(), type: "water", price: String(source.waterPrice) });
    if (source.wifiPrice !== undefined)
      nextFees.push({ id: newId(), type: "wifi", price: String(source.wifiPrice) });
    if (source.otherFees) {
      for (const f of source.otherFees) {
        const m = /^\$?([\d.]+)\s*(.*)$/.exec(f.amount.trim());
        nextFees.push({
          id: newId(),
          type: "other",
          price: m ? m[1] : "",
          customLabel: f.label,
          customUnit: m && m[2] ? m[2].trim() : undefined
        });
      }
    }
    setFees(nextFees);

    if (source.owner.phoneNumbers.length) {
      setContactPhones(source.owner.phoneNumbers);
    }
    if (source.owner.telegramPhones?.length) {
      setTelegramPhones(source.owner.telegramPhones);
    }
  }, [editingId]);

  // Hydrate the persisted "things that don't change per listing" fields
  // (location, fees, amenities, contacts…) from the user's last publish.
  // Skipped when copying from an existing listing — the copy flow already
  // owns those fields.
  const prefsAppliedRef = useRef(false);
  useEffect(() => {
    if (prefsAppliedRef.current) return;
    if (!session?.uid) return;
    if (searchParams?.get("copyFrom")) return;
    if (editingId) return;
    const prefs = loadListRoomPrefs(session.uid);
    if (!prefs) return;
    prefsAppliedRef.current = true;

    if (prefs.description) setDescription(prefs.description);
    if (prefs.location && Object.keys(prefs.location).length > 0) {
      setLocation(prefs.location);
    }
    if (prefs.pin) setPin(prefs.pin);
    if (prefs.amenities?.length) setSelected(new Set(prefs.amenities));
    if (prefs.rentPeriod) setRentPeriod(prefs.rentPeriod);
    if (prefs.fees?.length) {
      setFees(
        prefs.fees.map((f) => ({
          id: newId(),
          type: f.type,
          price: f.price,
          customLabel: f.customLabel,
          customUnit: f.customUnit
        }))
      );
    }
    if (prefs.contactPhones?.length) setContactPhones(prefs.contactPhones);
    if (prefs.telegramPhones?.length) setTelegramPhones(prefs.telegramPhones);
  }, [session?.uid, searchParams]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Pre-populate with Rent + Electricity + Water so the host only has to fill
  // in their rent price — admin settings provide reasonable utility defaults.
  const [fees, setFees] = useState<FeeRow[]>(() => {
    const s = getAdminSettings();
    return [
      { id: newId(), type: "rent", price: "" },
      { id: newId(), type: "electricity", price: String(s.defaultElectricityPrice) },
      { id: newId(), type: "water", price: String(s.defaultWaterPrice) }
    ];
  });
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  // Photos already attached to the room being edited. We keep these as URL
  // strings (not File objects) because we can't reconstitute Files from URLs.
  // On submit they're concatenated with newly-uploaded photos.
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorRef = useRef<HTMLParagraphElement | null>(null);

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
        oversized === 1
          ? t("listRoom.photos.oversized.one")
          : t("listRoom.photos.oversized.many", { n: oversized })
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
    setPhotos((prev) =>
      [...prev, ...items].slice(0, Math.max(0, MAX_PHOTOS - existingImages.length))
    );
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
    // Pre-fill utility prices from admin-configured defaults so the host
    // doesn't have to retype the standard rates every listing.
    const prefilled =
      next.value === "water"
        ? String(settings.defaultWaterPrice)
        : next.value === "electricity"
        ? String(settings.defaultElectricityPrice)
        : next.value === "wifi"
        ? String(settings.defaultWifiPrice)
        : "";
    setFees((prev) => [...prev, { id: newId(), type: next.value, price: prefilled }]);
  }

  function performResetForm() {
    setTitle("");
    setDescription("");
    setBedrooms(1);
    setFloor(1);
    setAreaSqm("");
    setLocation({});
    setPin(null);
    setSelected(new Set());
    setFees([{ id: newId(), type: "rent", price: "" }]);
    setRentPeriod(settings.defaultPricePeriod);
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setContactPhones(session?.phoneNumber ? [session.phoneNumber] : [""]);
    setTelegramPhones([""]);
    setError(null);
    // Also discard the persisted prefs so the cleared state sticks across
    // visits — otherwise the next mount would re-hydrate what we just wiped.
    if (session?.uid) clearListRoomPrefs(session.uid);
    toast.info(t("toast.form.cleared"));
  }

  function resetForm() {
    // The previous implementation used the native window.confirm. We surface a
    // styled ConfirmModal instead so the prompt matches the rest of the app.
    setConfirmResetOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!session) {
      setError(t("listRoom.error.signInRequired"));
      return;
    }
    if (!title.trim()) return failWith(t("listRoom.error.titleRequired"));
    if (!description.trim()) return failWith(t("listRoom.error.descriptionRequired"));
    if (!location.province) return failWith(t("listRoom.error.provinceRequired"));

    const rentFee = fees.find((f) => f.type === "rent");
    const rentValue = Number(rentFee?.price);
    if (!rentFee || !Number.isFinite(rentValue) || rentValue <= 0) {
      return failWith(t("listRoom.error.rentRequired"));
    }

    setSubmitting(true);
    try {
      const newImages = await Promise.all(
        photos.slice(0, Math.max(0, MAX_PHOTOS - existingImages.length)).map((p) => downscalePhoto(p.file))
      );
      const images = [...existingImages, ...newImages];

      const num = (val: string) => {
        const n = Number(val);
        return Number.isFinite(n) && n > 0 ? n : undefined;
      };
      const feeBy = (key: string) => fees.find((f) => f.type === key);
      const ownerPhones = contactPhones.map((p) => p.trim()).filter(Boolean);
      const ownerTelegrams = telegramPhones.map((t) => t.trim()).filter(Boolean);

      const otherFees = fees
        .filter((f) => !["rent", "deposit", "electricity", "water", "wifi"].includes(f.type) && f.price.trim())
        .map((f) => {
          const fallbackUnit = FEE_TYPES.find((t) => t.value === f.type)?.unit ?? "";
          const unit = f.type === "other" ? (f.customUnit?.trim() ?? "") : fallbackUnit;
          return {
            label:
              f.type === "other"
                ? f.customLabel?.trim() || "Other"
                : FEE_TYPES.find((t) => t.value === f.type)?.label ?? f.type,
            amount: `$${f.price}${unit ? ` ${unit}` : ""}`.trim()
          };
        });

      if (editingId) {
        const existing = getLocalRoomById(editingId);
        const patch: Partial<Room> = {
          title: title.trim(),
          description: description.trim(),
          price: rentValue,
          pricePeriod: rentPeriod,
          deposit: num(feeBy("deposit")?.price ?? ""),
          electricityPrice: num(feeBy("electricity")?.price ?? ""),
          waterPrice: num(feeBy("water")?.price ?? ""),
          wifiPrice: num(feeBy("wifi")?.price ?? ""),
          otherFees,
          type,
          address: pin?.name ?? "",
          city: location.province,
          district: location.district,
          area: location.area,
          lat: pin?.lat,
          lng: pin?.lng,
          bedrooms,
          areaSqm: num(areaSqm),
          floor,
          amenities: Array.from(selected),
          images,
          owner: {
            ...(existing?.owner ?? {
              id: session.uid,
              name: savedUsername ?? session.username ?? t("common.anonymousUser"),
              memberSince: new Date().toISOString().slice(0, 10),
              listingsCount: 1
            }),
            phoneNumbers: ownerPhones,
            telegramPhones: ownerTelegrams.length ? ownerTelegrams : undefined
          }
        };
        updateLocalRoom(editingId, patch);
        toast.success(t("toast.listing.updated", { title: patch.title ?? "" }));
        router.replace("/profile");
        return;
      }

      const room: Room = {
        id: `local-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        price: rentValue,
        pricePeriod: rentPeriod,
        currency: "USD",
        deposit: num(feeBy("deposit")?.price ?? ""),
        electricityPrice: num(feeBy("electricity")?.price ?? ""),
        waterPrice: num(feeBy("water")?.price ?? ""),
        wifiPrice: num(feeBy("wifi")?.price ?? ""),
        otherFees,
        type,
        address: pin?.name ?? "",
        city: location.province,
        district: location.district,
        area: location.area,
        lat: pin?.lat,
        lng: pin?.lng,
        bedrooms,
        areaSqm: num(areaSqm),
        floor,
        amenities: Array.from(selected),
        images,
        owner: {
          id: session.uid,
          name: savedUsername ?? session.username ?? t("common.anonymousUser"),
          phoneNumbers: ownerPhones,
          telegramPhones: ownerTelegrams.length ? ownerTelegrams : undefined,
          memberSince: new Date().toISOString().slice(0, 10),
          listingsCount: 1
        },
        createdAt: Date.now(),
        lastActivityAt: Date.now()
      };

      addLocalRoom(room);
      pushIncomingNotification({
        kind: "listing-posted",
        title: t("listRoom.notif.title"),
        body: t("listRoom.notif.body", {
          owner: room.owner.name,
          title: room.title,
          price: room.price,
          suffix: t(`room.suffix.${room.pricePeriod ?? "monthly"}`)
        }),
        relatedId: room.id
      });

      // Persist the cross-listing fields so the next visit pre-fills them.
      // Strip the local numeric ids from fees — they're regenerated on hydrate
      // so they never collide with the page's id counter.
      if (session?.uid) {
        saveListRoomPrefs(session.uid, {
          description,
          location,
          pin,
          amenities: Array.from(selected),
          fees: fees.map<ListRoomFeePref>((f) => ({
            type: f.type,
            price: f.price,
            customLabel: f.customLabel,
            customUnit: f.customUnit
          })),
          rentPeriod,
          contactPhones: ownerPhones,
          telegramPhones: ownerTelegrams
        });
      }

      toast.success(t("toast.listing.published", { title: room.title }));
      router.replace("/profile");
    } catch (err) {
      setSubmitting(false);
      failWith(err instanceof Error ? t(err.message) : t("listRoom.error.saveFailed"));
    }
  }

  function failWith(msg: string) {
    setError(msg);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  const rentFee = fees.find((f) => f.type === "rent");

  return (
    <div className="pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-8">
        <nav className="mb-3 flex items-center gap-2 text-sm text-ink-muted">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="-ml-2 hidden h-9 items-center gap-1.5 rounded-full px-2 font-medium text-ink-muted transition hover:bg-slate-100 hover:text-brand sm:inline-flex"
          >
            <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
            {t("listRoom.nav.profile")}
          </button>
        </nav>

        <header className="mb-5">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            {t(isEditing ? "listRoom.editTitle.template" : "listRoom.title.template")}{" "}
            <span className="text-brand">
              {t(`type.${type}`) || t("listRoom.title.highlight.fallback")}
            </span>
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {t(isEditing ? "listRoom.editSubtitle" : "listRoom.subtitle")}
          </p>
        </header>

        <form id="list-room-form" onSubmit={handleSubmit}>
          {/* Photos */}
          <section>
            <h2 className="mb-2 text-base font-bold">{t("listRoom.photos.heading")}</h2>
            <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
              {existingImages.length + photos.length < MAX_PHOTOS ? (
                <li>
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-white text-ink-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand">
                    <Icon name="plus" className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">
                      {existingImages.length + photos.length === 0
                        ? t("listRoom.photos.add")
                        : t("listRoom.photos.more")}
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
              {existingImages.map((src, i) => (
                <li
                  key={`existing-${i}`}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setExistingImages((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    aria-label={t("listRoom.photos.remove.aria")}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-ink shadow transition hover:bg-white"
                  >
                    <Icon name="x" className="h-3 w-3" />
                  </button>
                </li>
              ))}
              {photos.map((p) => (
                <li
                  key={p.id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    aria-label={t("listRoom.photos.remove.aria")}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-ink shadow transition hover:bg-white"
                  >
                    <Icon name="x" className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Title */}
          <section className="mt-5">
            <h2 className="mb-2 text-base font-bold">
              {t("listRoom.titleField.heading")} <span className="text-red-500">*</span>
            </h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("listRoom.titleField.placeholder")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft transition hover:border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </section>

          {/* Property details — stats row + edit button */}
          <section className="mt-5">
            <h2 className="mb-2 text-base font-bold">
              <span className="text-brand">
                {t(`type.${type}`)}
              </span>{" "}
              {t("listRoom.details.heading")}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-3.5 text-sm text-ink-muted">
                <li className="inline-flex items-center gap-1.5">
                  <Icon name="bed" className="h-4 w-4 text-brand" />
                  {bedrooms === 1
                    ? t("listRoom.details.bed.one")
                    : t("listRoom.details.bed.many", { n: bedrooms })}
                </li>
                {areaSqm ? (
                  <li className="inline-flex items-center gap-1.5">
                    <Icon name="ruler" className="h-4 w-4 text-brand" />
                    {areaSqm} m²
                  </li>
                ) : null}
                <li className="inline-flex items-center gap-1.5">
                  <Icon name="elevator" className="h-4 w-4 text-brand" />
                  {floor === 1
                    ? t("listRoom.details.floor.one")
                    : t("listRoom.details.floor.many", { n: floor })}
                </li>
              </ul>
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/5"
              >
                <Icon name="pencil" className="h-4 w-4" />
                {t("listRoom.details.edit")}
              </button>
            </div>
          </section>

          {/* About this place */}
          <section className="mt-5">
            <h2 className="mb-2 text-base font-bold">
              {t("listRoom.about.heading")} <span className="text-red-500">*</span>
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("listRoom.about.placeholder")}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-soft transition hover:border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </section>

          {/* Amenities */}
          <section className="mt-5">
            <h2 className="mb-2 text-base font-bold">{t("listRoom.amenities.heading")}</h2>
            <ul className="flex flex-wrap gap-2">
              <li>
                <button
                  type="button"
                  onClick={() => setAmenitiesOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand bg-brand px-3 py-1.5 text-sm text-white transition hover:bg-brand-dark"
                >
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  <span className="font-semibold">{t("listRoom.amenities.add")}</span>
                </button>
              </li>
              {Array.from(selected).map((a) => (
                <li
                  key={a}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand bg-white px-3 py-1.5 text-sm text-brand"
                >
                  <Icon name={amenityIcon(a)} className="h-3.5 w-3.5 text-brand" />
                  <span className="font-semibold">{a}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Fees & utilities */}
          <section className="mt-5">
            <h2 className="mb-2 text-base font-bold">
              {t("listRoom.fees.heading")} <span className="text-red-500">*</span>
            </h2>
            {(() => {
              const filledExtras = fees.filter(
                (f) => f.type !== "rent" && f.price.trim()
              );
              const hasRent = !!rentFee?.price?.trim();
              return (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {hasRent || filledExtras.length > 0 ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-2.5">
                        <span className="flex-1 text-sm text-ink">{t("listRoom.fees.rentLabel")}</span>
                        <span className="text-sm font-semibold text-ink">
                          ${rentFee?.price || "0"}
                        </span>
                        <span className="whitespace-nowrap text-xs text-ink-muted">
                          {t(`room.suffix.${rentPeriod}`)}
                        </span>
                      </div>
                      {filledExtras.map((f) => {
                        const meta = FEE_TYPES.find((ft) => ft.value === f.type);
                        const label =
                          f.type === "other"
                            ? f.customLabel?.trim() || t("listRoom.fees.other.fallback")
                            : t(`feeType.${f.type}`) || meta?.label || f.type;
                        return (
                          <div
                            key={f.id}
                            className="flex items-center gap-3 border-t border-slate-100 px-4 py-2.5"
                          >
                            <span className="flex-1 text-sm text-ink">{label}</span>
                            <span className="text-sm font-semibold text-ink">
                              ${f.price}
                            </span>
                            {f.type === "other" ? (
                              f.customUnit?.trim() ? (
                                <span className="whitespace-nowrap text-xs text-ink-muted">
                                  {f.customUnit.trim()}
                                </span>
                              ) : null
                            ) : FEE_UNIT_KEYS[f.type] ? (
                              <span className="whitespace-nowrap text-xs text-ink-muted">
                                {t(FEE_UNIT_KEYS[f.type])}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-ink-soft">
                      {t("listRoom.fees.fillIn")}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setFeesOpen(true)}
                    className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-2 text-xs font-semibold text-brand transition hover:bg-brand/5"
                  >
                    <Icon name="pencil" className="h-3.5 w-3.5" />
                    {hasRent || filledExtras.length > 0 ? t("listRoom.fees.editFees") : t("listRoom.fees.addFees")}
                  </button>
                </div>
              );
            })()}
          </section>

          {/* Contact */}
          <section className="mt-5">
            <h2 className="text-base font-bold">{t("room.section.host")}</h2>
            <p className="mb-2 text-xs text-ink-muted">
              {t("listRoom.contact.heading")}
            </p>
            {(() => {
              const phones = contactPhones.filter((p) => p.trim());
              const tgs = telegramPhones.filter((tg) => tg.trim());
              const hasAny = phones.length + tgs.length > 0;
              return (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {hasAny ? (
                    <>
                      {phones.map((p, i) => (
                        <div
                          key={`tel-${p}`}
                          className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-slate-100" : ""}`}
                        >
                          <Icon name="phone" className="h-4 w-4 shrink-0 text-brand" />
                          <span className="flex-1 truncate text-sm font-semibold text-ink">
                            {p}
                          </span>
                          <span className="text-xs text-ink-muted">{t("room.contactLabel.phone")}</span>
                        </div>
                      ))}
                      {tgs.map((tg) => (
                        <div
                          key={`tg-${tg}`}
                          className="flex items-center gap-3 border-t border-slate-100 px-4 py-2.5"
                        >
                          <Icon name="telegram" className="h-4 w-4 shrink-0 text-brand" />
                          <span className="flex-1 truncate text-sm font-semibold text-ink">
                            {tg}
                          </span>
                          <span className="text-xs text-ink-muted">{t("room.contactLabel.telegram")}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-ink-soft">
                      {t("listRoom.contact.add")}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-2 text-xs font-semibold text-brand transition hover:bg-brand/5"
                  >
                    <Icon name="pencil" className="h-3.5 w-3.5" />
                    {hasAny ? t("listRoom.contact.edit") : t("listRoom.contact.add")}
                  </button>
                </div>
              );
            })()}
          </section>

          {/* Location */}
          <section className="mt-5">
            <h2 className="mb-3 text-base font-bold">
              {t("listRoom.location.heading")} <span className="text-red-500">*</span>
            </h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setLocationOpen(true)}
                className="input flex w-full items-center justify-between text-left"
              >
                <span
                  className={`min-w-0 flex-1 truncate ${
                    location.province ? "text-ink" : "text-ink-soft"
                  }`}
                >
                  {formatLocation(location) || t("search.location.placeholder")}
                </span>
                <Icon name="chevron-down" className="ml-2 h-4 w-4 shrink-0 text-ink-soft" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPinOpen(true)}
                  className="input flex min-w-0 flex-1 items-center justify-between text-left"
                >
                  <span
                    className={`min-w-0 flex-1 truncate ${
                      pin ? "text-ink" : "text-ink-soft"
                    }`}
                  >
                    {pin
                      ? pin.name ?? t("listRoom.location.pin.move")
                      : t("listRoom.location.pin.set")}
                  </span>
                  <Icon name="map-pin" className="ml-2 h-4 w-4 shrink-0 text-ink-soft" />
                </button>
                {pin ? (
                  <button
                    type="button"
                    onClick={() => handlePinChange(null)}
                    aria-label={t("common.clear")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-slate-100 hover:text-ink"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
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

        </form>
      </div>

      {/*
        Page-owned action bar. Pinned to the bottom at every breakpoint so the
        host always has Create/Cancel/Clear in reach — replaces the global
        BottomNav / AdminFloatingNav (both hide on this route).
      */}
      {/* Mobile: full-width bar pinned to bottom edge.
          Desktop: floating bar matching the form's max-w-2xl width. */}
      <div
        className="fixed inset-x-0 bottom-0 z-[1050] sm:bottom-6 bg-transparent"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3 sm:px-6
          border-t border-slate-200 bg-white/95 backdrop-blur
          sm:border sm:rounded-2xl sm:shadow-cardHover sm:bg-white/95">
          <button
            type="button"
            onClick={resetForm}
            disabled={submitting}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-ink-muted transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Icon name="trash" className="h-4 w-4" />
            {t("listRoom.bottomBar.clear")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/profile");
              }
            }}
            disabled={submitting}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-ink-muted transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Icon name="x" className="h-4 w-4" />
            {t("listRoom.bottomBar.cancel")}
          </button>
          <button
            type="submit"
            form="list-room-form"
            disabled={submitting}
            className="btn-primary h-11 flex-1 justify-center"
          >
            {submitting
              ? t(isEditing ? "common.saving" : "listRoom.bottomBar.creating")
              : t(isEditing ? "common.save" : "listRoom.bottomBar.create")}
            {submitting ? null : <Icon name="arrow-right" className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <LocationPicker
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        value={location}
        onChange={(next) => setLocation(next)}
        intent="select"
      />

      <MapPinPicker
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        value={pin}
        onChange={handlePinChange}
      />

      <ContactSheet
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        contactPhones={contactPhones}
        setContactPhones={setContactPhones}
        telegramPhones={telegramPhones}
        setTelegramPhones={setTelegramPhones}
      />

      <FeesSheet
        open={feesOpen}
        onClose={() => setFeesOpen(false)}
        fees={fees}
        updateFee={updateFee}
        removeFee={removeFee}
        addFee={addFee}
        rentPeriod={rentPeriod}
        setRentPeriod={setRentPeriod}
      />

      <AmenitiesSheet
        open={amenitiesOpen}
        onClose={() => setAmenitiesOpen(false)}
        selected={selected}
        toggle={toggle}
        options={amenityOptions}
      />

      <DetailsSheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        type={type}
        setType={setType}
        bedrooms={bedrooms}
        setBedrooms={setBedrooms}
        floor={floor}
        setFloor={setFloor}
        areaSqm={areaSqm}
        setAreaSqm={setAreaSqm}
      />

      <ConfirmModal
        open={confirmResetOpen}
        title={t("listRoom.confirmClear.title")}
        body={t("listRoom.confirmClear.body")}
        confirmLabel={t("listRoom.confirmClear.confirm")}
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          setConfirmResetOpen(false);
          performResetForm();
        }}
      />
    </div>
  );
}


function ContactSheet({
  open,
  onClose,
  contactPhones,
  setContactPhones,
  telegramPhones,
  setTelegramPhones
}: {
  open: boolean;
  onClose: () => void;
  contactPhones: string[];
  setContactPhones: (next: string[]) => void;
  telegramPhones: string[];
  setTelegramPhones: (next: string[]) => void;
}) {
  const t = useT();
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

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("listRoom.modal.editContact.title")}
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:max-h-[80vh] sm:max-w-md sm:rounded-3xl">
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
          <span aria-hidden />
          <h3 className="text-center text-base font-semibold text-ink">
            {t("listRoom.modal.editContact.title")}
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
        <div className="space-y-4 overflow-y-auto p-4 sm:p-5">
          <ContactListEditor
            label={t("listRoom.contact.phones.heading")}
            iconName="phone"
            placeholder="+855 12 345 678"
            values={contactPhones}
            onChange={setContactPhones}
            addLabel={t("listRoom.contact.phone.add")}
          />
          <ContactListEditor
            label={t("listRoom.contact.telegram.heading")}
            iconName="telegram"
            placeholder="+855 12 345 678"
            values={telegramPhones}
            onChange={setTelegramPhones}
            addLabel={t("listRoom.contact.telegram.add")}
          />
        </div>
        <div
          className="border-t border-slate-100 px-4 py-3 sm:px-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-primary h-11 w-full justify-center"
          >
            {t("listRoom.modal.done")}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeesSheet({
  open,
  onClose,
  fees,
  updateFee,
  removeFee,
  addFee,
  rentPeriod,
  setRentPeriod
}: {
  open: boolean;
  onClose: () => void;
  fees: FeeRow[];
  updateFee: (id: number, patch: Partial<FeeRow>) => void;
  removeFee: (id: number) => void;
  addFee: () => void;
  rentPeriod: PricePeriod;
  setRentPeriod: (p: PricePeriod) => void;
}) {
  const t = useT();
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

  const rentFee = fees.find((f) => f.type === "rent");
  const extras = fees.filter((f) => f.type !== "rent");

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("listRoom.modal.editFees.title")}
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:max-h-[80vh] sm:max-w-md sm:rounded-3xl">
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
          <span aria-hidden />
          <h3 className="text-center text-base font-semibold text-ink">
            {t("listRoom.modal.editFees.title")}
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
          <div className="grid grid-cols-[1fr_auto_auto_2rem] items-center gap-x-2 gap-y-3">
            <span className="text-sm font-semibold text-ink">{t("listRoom.fees.rentLabel")}</span>
            <div className="flex h-9 items-stretch overflow-hidden rounded border border-slate-200 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <span className="flex items-center px-2 text-sm font-semibold text-ink-muted">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={rentFee?.price ?? ""}
                onChange={(e) => rentFee && updateFee(rentFee.id, { price: e.target.value })}
                placeholder="0"
                className="w-16 bg-transparent pr-2 text-right text-sm font-semibold text-ink placeholder:text-ink-soft focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <SelectField<PricePeriod>
                ariaLabel={t("listRoom.field.rentPeriod")}
                value={rentPeriod}
                options={PRICE_PERIODS.map((p) => ({ value: p.value, label: t(`period.${p.value}`) || p.label }))}
                onChange={setRentPeriod}
                triggerClassName="flex h-9 w-full cursor-pointer items-center justify-between gap-1 rounded border border-slate-200 bg-white pl-3 pr-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            {extras.map((fee) => {
              const meta = FEE_TYPES.find((ft) => ft.value === fee.type) ?? FEE_TYPES[0];
              const isOther = fee.type === "other";
              return (
                <Fragment key={fee.id}>
                  {isOther ? (
                    <input
                      type="text"
                      value={fee.customLabel ?? ""}
                      onChange={(e) => updateFee(fee.id, { customLabel: e.target.value })}
                      placeholder={t("listRoom.field.feeLabel")}
                      className="h-9 min-w-0 rounded border border-slate-200 bg-white px-2 text-sm text-ink placeholder:text-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  ) : (
                    <div className="min-w-0">
                      <SelectField<string>
                        ariaLabel={t("listRoom.field.feeType")}
                        value={fee.type}
                        options={FEE_TYPES.filter((ft) => ft.value !== "rent").map((ft) => ({
                          value: ft.value,
                          label: t(`feeType.${ft.value}`) || ft.label
                        }))}
                        onChange={(v) => updateFee(fee.id, { type: v })}
                        triggerClassName="flex h-9 w-full cursor-pointer items-center justify-between gap-1 rounded border border-slate-200 bg-white pl-3 pr-2 text-sm text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                  )}
                  <div className="flex h-9 items-stretch overflow-hidden rounded border border-slate-200 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                    <span className="flex items-center px-2 text-sm font-semibold text-ink-muted">$</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={fee.price}
                      onChange={(e) => updateFee(fee.id, { price: e.target.value })}
                      placeholder="0"
                      className="w-16 bg-transparent pr-2 text-right text-sm font-semibold text-ink placeholder:text-ink-soft focus:outline-none"
                    />
                  </div>
                  {isOther ? (
                    <input
                      type="text"
                      value={fee.customUnit ?? ""}
                      onChange={(e) => updateFee(fee.id, { customUnit: e.target.value })}
                      placeholder={t("listRoom.field.feeUnit")}
                      className="h-9 w-20 rounded border border-slate-200 bg-white px-2 text-xs text-ink placeholder:text-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  ) : (
                    <span className="whitespace-nowrap text-xs text-ink-muted">
                      {FEE_UNIT_KEYS[fee.type] ? t(FEE_UNIT_KEYS[fee.type]) : ""}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFee(fee.id)}
                    aria-label={t("common.remove")}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition hover:bg-slate-100 hover:text-ink"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </Fragment>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addFee}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-ink-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand"
          >
            <Icon name="plus" className="h-4 w-4" />
            {t("listRoom.field.addFee")}
          </button>
        </div>
        <div
          className="border-t border-slate-100 px-4 py-3 sm:px-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-primary h-11 w-full justify-center"
          >
            {t("listRoom.modal.done")}
          </button>
        </div>
      </div>
    </div>
  );
}

function AmenitiesSheet({
  open,
  onClose,
  selected,
  toggle,
  options
}: {
  open: boolean;
  onClose: () => void;
  selected: Set<string>;
  toggle: (a: string) => void;
  options: string[];
}) {
  const t = useT();
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

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("listRoom.modal.editAmenities.title")}
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:max-h-[80vh] sm:max-w-md sm:rounded-3xl">
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
          <span aria-hidden />
          <h3 className="text-center text-base font-semibold text-ink">
            {t("listRoom.amenities.heading")}
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
          <ul className="flex flex-wrap gap-2">
            {options.map((a) => {
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
        </div>
        <div
          className="border-t border-slate-100 px-4 py-3 sm:px-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-primary h-11 w-full justify-center"
          >
            {t("listRoom.modal.done")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailsSheet({
  open,
  onClose,
  type,
  setType,
  bedrooms,
  setBedrooms,
  floor,
  setFloor,
  areaSqm,
  setAreaSqm
}: {
  open: boolean;
  onClose: () => void;
  type: PropertyType;
  setType: (t: PropertyType) => void;
  bedrooms: number;
  setBedrooms: (n: number) => void;
  floor: number;
  setFloor: (n: number) => void;
  areaSqm: string;
  setAreaSqm: (v: string) => void;
}) {
  const t = useT();
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

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("listRoom.modal.editDetails.title")}
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:max-h-[80vh] sm:max-w-md sm:rounded-3xl">
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
          <span aria-hidden />
          <h3 className="text-center text-base font-semibold text-ink">
            {t("listRoom.modal.editDetails.title")}
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
        <div className="overflow-y-auto">
          <label className="flex items-center gap-3 px-4 py-3 focus-within:bg-slate-50">
            <Icon name="bed" className="h-4 w-4 shrink-0 text-brand" />
            <span className="flex-1 text-sm text-ink">{t("listRoom.field.bedrooms")}</span>
            <input
              type="number"
              min={0}
              value={bedrooms}
              onChange={(e) => setBedrooms(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 rounded border border-slate-200 px-2 py-1.5 text-right text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <label className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 focus-within:bg-slate-50">
            <Icon name="ruler" className="h-4 w-4 shrink-0 text-brand" />
            <span className="flex-1 text-sm text-ink">{t("listRoom.field.area")}</span>
            <input
              type="number"
              min={0}
              value={areaSqm}
              onChange={(e) => setAreaSqm(e.target.value)}
              placeholder="28"
              className="w-20 rounded border border-slate-200 px-2 py-1.5 text-right text-sm font-semibold text-ink placeholder:text-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <label className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 focus-within:bg-slate-50">
            <Icon name="elevator" className="h-4 w-4 shrink-0 text-brand" />
            <span className="flex-1 text-sm text-ink">{t("listRoom.field.floor")}</span>
            <input
              type="number"
              min={0}
              value={floor}
              onChange={(e) => setFloor(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 rounded border border-slate-200 px-2 py-1.5 text-right text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
        </div>
        <div
          className="border-t border-slate-100 px-4 py-3 sm:px-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-primary h-11 w-full justify-center"
          >
            {t("listRoom.modal.done")}
          </button>
        </div>
      </div>
    </div>
  );
}
