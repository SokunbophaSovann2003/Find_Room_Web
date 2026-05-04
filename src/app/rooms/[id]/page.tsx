"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageGallery from "@/components/ImageGallery";
import RoomCard from "@/components/RoomCard";
import Icon, { amenityIcon } from "@/components/Icon";
import { findRoomById, similarRooms } from "@/lib/mock-data";
import { getLocalRoomById } from "@/lib/local-rooms";
import type { Room } from "@/lib/types";

type RoomState = Room | "loading" | "missing";

export default function RoomDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomState>(() => findRoomById(params.id) ?? "loading");
  const [contactOpen, setContactOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    const found = findRoomById(params.id) ?? getLocalRoomById(params.id);
    setRoom(found ?? "missing");
  }, [params.id]);

  useEffect(() => {
    if (!contactOpen && !locationOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setContactOpen(false);
        setLocationOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contactOpen, locationOpen]);

  useEffect(() => {
    if (!contactOpen && !locationOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [contactOpen, locationOpen]);

  if (room === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }
  if (room === "missing") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Room not found</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The listing you’re looking for doesn’t exist or has been removed.
        </p>
        <Link href="/explore" className="btn-primary mt-6">
          Back to Explore
        </Link>
      </div>
    );
  }

  const similar = similarRooms(room);
  const mapQuery =
    room.lat != null && room.lng != null
      ? `${room.lat},${room.lng}`
      : `${room.address}, ${room.city}`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const phoneDigits = room.owner.phoneNumber.replace(/\s/g, "");
  const telegramLink = room.owner.telegramPhone
    ? `+${room.owner.telegramPhone.replace(/\D/g, "")}`
    : undefined;

  const fullAddress = [room.address, room.area, room.district, room.city]
    .filter(Boolean)
    .join(", ");

  const locationCard = (
    <section>
      <div className="mb-2 flex items-end justify-between">
        <h2 className="text-base font-bold">Location</h2>
        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-brand hover:text-brand-dark"
        >
          Open in Maps ↗
        </a>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-start gap-2 border-b border-slate-200 px-3 py-2.5">
          <Icon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p className="text-xs font-medium leading-snug text-ink">{fullAddress}</p>
        </div>
        <div className="relative aspect-[16/9] w-full bg-slate-100 lg:aspect-[4/3]">
          <iframe
            title={`${room.title} — map`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );

  const hostCard = (
    <section>
      <h2 className="mb-3 text-base font-bold lg:hidden">Contact the host</h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-brand/20">
            {room.owner.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={room.owner.avatarUrl}
                alt={room.owner.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-brand">
                {room.owner.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-ink-soft">
              Listed by
            </p>
            <p className="truncate font-semibold text-ink">{room.owner.name}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
            <ContactRow
              icon="phone"
              label="Phone"
              value={room.owner.phoneNumber}
              href={`tel:${phoneDigits}`}
            />
            {telegramLink ? (
              <ContactRow
                icon="telegram"
                label="Telegram"
                value={room.owner.telegramPhone ?? telegramLink}
                href={`https://t.me/${telegramLink}`}
              />
            ) : null}
        </ul>
      </div>
    </section>
  );

  return (
    <div className="pb-24 sm:pb-0">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand"
        >
          <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
          Back
        </button>

        <ImageGallery images={room.images} title={room.title} typeLabel={room.type} />

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="space-y-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
                  {room.title}
                </h1>
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink-muted">
                  <Icon name="map-pin" className="h-4 w-4" />
                  {fullAddress}
                </p>
              </div>
              <div className="hidden shrink-0 whitespace-nowrap sm:block sm:pt-1">
                <span className="text-3xl font-extrabold text-brand sm:text-4xl">
                  ${room.price}
                </span>
                <span className="ml-1 text-sm text-ink-muted">/ month</span>
              </div>
            </header>

            <ul className="flex flex-nowrap items-center justify-between gap-x-2 sm:justify-start sm:gap-x-5">
              <StatChip icon="bed" value={room.bedrooms} label="Bed" />
              {room.areaSqm ? (
                <>
                  <span className="hidden h-3 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
                  <StatChip icon="ruler" value={room.areaSqm} label="m²" />
                </>
              ) : null}
              {room.floor != null ? (
                <>
                  <span className="hidden h-3 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
                  <StatChip icon="elevator" value={room.floor} label="Floor" />
                </>
              ) : null}
            </ul>

            <section>
              <h2 className="mb-2 text-base font-bold">About this place</h2>
              <p className="text-sm leading-relaxed text-ink-muted">
                {room.description}
              </p>
            </section>

            {room.amenities.length > 0 ? (
              <section>
                <h2 className="mb-3 text-base font-bold">What this place offers</h2>
                <ul className="flex flex-wrap gap-2">
                  {room.amenities.map((a) => (
                    <li
                      key={a}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm"
                    >
                      <Icon name={amenityIcon(a)} className="h-4 w-4 text-brand" />
                      <span className="font-semibold text-ink">{a}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h2 className="mb-2 text-base font-bold">Fees & utilities</h2>
              <dl className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <FeeRow label="Monthly rent" value={`$${room.price} / month`} />
                {room.deposit != null ? (
                  <FeeRow label="Deposit (before move-in)" value={`$${room.deposit}`} />
                ) : null}
                {room.electricityPrice != null ? (
                  <FeeRow label="Electricity" value={`$${room.electricityPrice} / kWh`} />
                ) : null}
                {room.waterPrice != null ? (
                  <FeeRow label="Water" value={`$${room.waterPrice} / m³`} />
                ) : null}
                {room.wifiPrice != null ? (
                  <FeeRow label="Wi-Fi" value={`$${room.wifiPrice} / month`} />
                ) : null}
                {room.otherFees?.map((f) => (
                  <FeeRow key={f.label} label={f.label} value={f.amount} />
                ))}
              </dl>
            </section>

            <div className="hidden space-y-8 sm:block lg:hidden">
              {hostCard}
              {locationCard}
            </div>
          </div>

          <aside className="hidden space-y-4 lg:block">
            {hostCard}
            {locationCard}
          </aside>
        </div>

        {similar.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold">Similar rooms</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {similar.map((r) => (
                <RoomCard key={r.id} room={r} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center gap-2">
          <div className="shrink-0 whitespace-nowrap">
            <span className="text-xl font-extrabold leading-tight text-brand">${room.price}</span>
            <span className="ml-0.5 text-xs font-medium text-ink-muted">/ month</span>
          </div>
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="btn-secondary h-11 flex-1 justify-center px-3"
          >
            <Icon name="map-pin" className="h-4 w-4" />
            Location
          </button>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="btn-primary h-11 flex-1 justify-center px-3"
          >
            <Icon name="phone" className="h-4 w-4" />
            Contact
          </button>
        </div>
      </div>

      {contactOpen ? (
        <div
          className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Contact the host"
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setContactOpen(false)} aria-hidden />
          <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:max-h-[80vh] sm:w-full sm:max-w-md sm:rounded-3xl">
            <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
              <span aria-hidden />
              <h2 className="text-center text-base font-semibold text-ink">Contact the host</h2>
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-brand/20">
                  {room.owner.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={room.owner.avatarUrl}
                      alt={room.owner.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-brand">
                      {room.owner.name.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-ink-soft">Listed by</p>
                  <p className="truncate font-semibold text-ink">{room.owner.name}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <ContactRow
                  icon="phone"
                  label="Phone"
                  value={room.owner.phoneNumber}
                  href={`tel:${phoneDigits}`}
                />
                {telegramLink ? (
                  <ContactRow
                    icon="telegram"
                    label="Telegram"
                    value={room.owner.telegramPhone ?? telegramLink}
                    href={`https://t.me/${telegramLink}`}
                  />
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {locationOpen ? (
        <div
          className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Location"
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setLocationOpen(false)} aria-hidden />
          <div className="relative flex h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:h-auto sm:max-h-[80vh] sm:w-full sm:max-w-md sm:rounded-3xl">
            <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
              <span aria-hidden />
              <h2 className="text-center text-base font-semibold text-ink">Location</h2>
              <button
                type="button"
                onClick={() => setLocationOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-3">
                <Icon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <p className="text-sm font-medium leading-snug text-ink">{fullAddress}</p>
              </div>
              <div className="relative w-full flex-1 bg-slate-100 sm:aspect-[16/10] sm:flex-none">
                <iframe
                  title={`${room.title} — map`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-brand hover:bg-brand/5"
              >
                Open in Maps ↗
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatChip({
  icon,
  value,
  label
}: {
  icon: "bed" | "ruler" | "elevator";
  value: number | string;
  label: string;
}) {
  return (
    <li className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
      <Icon name={icon} className="h-4 w-4 text-brand" />
      <span className="text-sm">
        <span className="font-bold text-ink">{value}</span>
        <span className="ml-1 text-ink-muted">{label}</span>
      </span>
    </li>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href
}: {
  icon: "phone" | "telegram" | "email" | "wechat" | "facebook";
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="truncate text-sm font-semibold text-ink">{value}</p>
      </div>
    </>
  );
  return (
    <li>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
          className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 transition hover:border-brand hover:bg-brand/5"
        >
          {inner}
        </a>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
          {inner}
        </div>
      )}
    </li>
  );
}

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
