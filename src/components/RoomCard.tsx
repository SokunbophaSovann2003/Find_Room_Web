import Link from "next/link";
import Icon, { propertyIcon } from "./Icon";
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
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon
              name={propertyIcon(room.type)}
              className="h-14 w-14 text-slate-300"
              strokeWidth={1.4}
            />
          </div>
        )}

        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold capitalize text-white shadow">
            {room.type}
          </span>
        </div>

      </div>

      <div className="p-3 sm:p-4">
        <h3 className="line-clamp-1 font-semibold text-ink">{room.title}</h3>

        <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
          <Icon name="map-pin" className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">
            {room.district ? `${room.district}, ` : ""}
            {room.city}
          </span>
        </p>

        <div className="mt-3 flex items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-ink-muted sm:gap-3">
          <span className="inline-flex items-center gap-1">
            <Icon name="bed" className="h-4 w-4 shrink-0" /> {room.bedrooms}
          </span>
          {room.areaSqm ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="ruler" className="h-4 w-4 shrink-0" /> {room.areaSqm}m²
            </span>
          ) : null}
          {room.floor != null ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="elevator" className="h-4 w-4 shrink-0" /> {room.floor}F
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="text-base font-extrabold text-brand sm:text-lg">${room.price}</span>
            <span className="text-xs text-ink-soft"> / month</span>
          </div>
          <span className="hidden text-xs font-medium text-brand sm:inline">View details →</span>
        </div>
      </div>
    </Link>
  );
}
