import Link from "next/link";
import { notFound } from "next/navigation";
import ImageGallery from "@/components/ImageGallery";
import RoomCard from "@/components/RoomCard";
import Icon, { amenityIcon } from "@/components/Icon";
import { findRoomById, similarRooms } from "@/lib/mock-data";

export default function RoomDetailPage({ params }: { params: { id: string } }) {
  const room = findRoomById(params.id);
  if (!room) notFound();

  const similar = similarRooms(room);
  const mapQuery =
    room.lat != null && room.lng != null
      ? `${room.lat},${room.lng}`
      : `${room.address}, ${room.city}`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const phoneDigits = room.owner.phoneNumber.replace(/\s/g, "");
  const telegramHandle = room.owner.telegramPhone?.replace(/\s|\+/g, "");

  const fullAddress = `${room.address}${room.district ? `, ${room.district}` : ""}, ${room.city}`;

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
            ) : null}
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
            {room.owner.telegramPhone ? (
              <ContactRow
                icon="telegram"
                label="Telegram"
                value={room.owner.telegramPhone}
                href={`https://t.me/${telegramHandle}`}
              />
            ) : null}
        </ul>
      </div>
    </section>
  );

  return (
    <div className="pb-24 sm:pb-0">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-8">
        <nav className="mb-3 flex items-center gap-2 text-sm text-ink-muted">
          <Link href="/explore" className="hover:text-brand">
            Explore
          </Link>
          <span>›</span>
          <span className="truncate text-ink">{room.title}</span>
        </nav>

        <ImageGallery images={room.images} title={room.title} />

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="space-y-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
                  {room.title}
                </h1>
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink-muted">
                  <Icon name="map-pin" className="h-4 w-4" />
                  {room.address}
                  {room.district ? `, ${room.district}` : ""}, {room.city}
                </p>
              </div>
              <div className="shrink-0 whitespace-nowrap sm:pt-1">
                <span className="text-3xl font-extrabold text-brand sm:text-4xl">
                  ${room.price}
                </span>
                <span className="ml-1 text-sm text-ink-muted">/ month</span>
              </div>
            </header>

            <ul className="flex flex-nowrap items-center justify-between gap-x-2 sm:justify-start sm:gap-x-5">
              <StatChip icon="bed" value={room.bedrooms} label="Bed" />
              <span className="hidden h-3 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
              <StatChip icon="bath" value={room.bathrooms} label="Bath" />
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

            <div className="space-y-8 lg:hidden">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((r) => (
                <RoomCard key={r.id} room={r} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold leading-tight">
              ${room.price}
              <span className="ml-0.5 text-xs font-medium text-ink-muted">/ mo</span>
            </div>
            {room.deposit != null ? (
              <p className="text-[11px] text-ink-muted">
                + ${room.deposit} deposit
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            {telegramHandle ? (
              <a
                href={`https://t.me/${telegramHandle}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary h-11 justify-center px-4"
              >
                <Icon name="telegram" className="h-4 w-4" />
                Telegram
              </a>
            ) : null}
            <a
              href={`tel:${phoneDigits}`}
              className="btn-primary h-11 justify-center px-5"
            >
              <Icon name="phone" className="h-4 w-4" />
              Call
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  value,
  label
}: {
  icon: "bed" | "bath" | "ruler" | "elevator";
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
