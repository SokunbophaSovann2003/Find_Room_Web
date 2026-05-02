import Link from "next/link";
import Icon from "./Icon";
import type { Room } from "@/lib/types";

export default function RoomCard({ room }: { room: Room }) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {room.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.images[0]}
            alt={room.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : null}

        <div className="absolute left-3 top-3 flex gap-1.5">
          {room.isNew ? (
            <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow">
              NEW
            </span>
          ) : null}
          {room.isFeatured ? (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white shadow">
              FEATURED
            </span>
          ) : null}
        </div>

      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-semibold text-ink">{room.title}</h3>
          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-ink-muted">
            {room.type}
          </span>
        </div>

        <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
          <Icon name="map-pin" className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">
            {room.district ? `${room.district}, ` : ""}
            {room.city}
          </span>
        </p>

        <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Icon name="bed" className="h-4 w-4" /> {room.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="bath" className="h-4 w-4" /> {room.bathrooms}
          </span>
          {room.areaSqm ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="ruler" className="h-4 w-4" /> {room.areaSqm} m²
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="text-lg font-extrabold text-ink">${room.price}</span>
            <span className="text-xs text-ink-soft"> / month</span>
          </div>
          <span className="text-xs font-medium text-brand">View details →</span>
        </div>
      </div>
    </Link>
  );
}
