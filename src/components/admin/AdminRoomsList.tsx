"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Icon, { propertyIcon } from "@/components/Icon";
import { useAdminSettings, type AdminUser } from "@/lib/admin";
import { isAutoOccupied, daysSinceActivity } from "@/lib/auto-occupy";
import type { Room } from "@/lib/types";
import { useT } from "@/lib/language";

// Shared admin presentation for a list of rooms: desktop table + mobile cards
// with per-row Toggle/Delete actions. Used by the Rooms admin page and by the
// User Detail page so the two stay visually consistent.
export default function AdminRoomsList({
  rooms,
  usersByUid,
  emptyMessage,
  onToggleOccupied,
  onDelete,
  hideOwnerColumn = false
}: {
  rooms: Room[];
  usersByUid: Map<string, AdminUser>;
  emptyMessage: string;
  onToggleOccupied: (room: Room) => void;
  onDelete: (room: Room) => void;
  // Hide the Owner column when every row would show the same owner (e.g. the
  // listings table on the user detail page).
  hideOwnerColumn?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { autoOccupyDays } = useAdminSettings();
  const [sortDays, setSortDays] = useState<"asc" | "desc" | null>(null);

  function cycleSortDays() {
    setSortDays((cur) => (cur === null ? "desc" : cur === "desc" ? "asc" : null));
  }

  const sortedRooms = useMemo(() => {
    if (!sortDays) return rooms;
    return [...rooms].sort((a, b) => {
      const aOcc = a.isOccupied || isAutoOccupied(a, autoOccupyDays);
      const bOcc = b.isOccupied || isAutoOccupied(b, autoOccupyDays);
      if (aOcc && bOcc) return 0;
      if (aOcc) return 1;
      if (bOcc) return -1;
      const diff = daysSinceActivity(a) - daysSinceActivity(b);
      return sortDays === "desc" ? -diff : diff;
    });
  }, [rooms, sortDays, autoOccupyDays]);

  // Hide the Days Available column when every visible room is occupied —
  // e.g. when the status filter is set to "Occupied".
  const hasAvailableRooms = useMemo(
    () => sortedRooms.some((r) => !(r.isOccupied || isAutoOccupied(r, autoOccupyDays))),
    [sortedRooms, autoOccupyDays]
  );

  // Reset sort when the Days Available column is hidden (e.g. filter changed to
  // "Occupied") so stale sort state doesn't persist when the column reappears.
  useEffect(() => {
    if (!hasAvailableRooms) setSortDays(null);
  }, [hasAvailableRooms]);

  // Listing + Location + Price + Status + Actions = 5 base cols
  // +1 if Owner column shown, +1 if Days Available column shown
  const colCount = (hideOwnerColumn ? 5 : 6) + (hasAvailableRooms ? 1 : 0);

  // Click anywhere on the row goes to the room detail UNLESS the click target
  // is already an interactive element (owner link, maps link, action menu).
  function rowClickHandler(roomId: string) {
    return (e: React.MouseEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      router.push(`/rooms/${roomId}`);
    };
  }

  // Same convention as the room detail page (rooms/[id]/page.tsx): prefer the
  // pinned lat/lng, fall back to a human-readable "district, city" query.
  function mapsLinkFor(room: Room): string {
    const query =
      room.lat != null && room.lng != null
        ? `${room.lat},${room.lng}`
        : [room.district, room.city].filter(Boolean).join(", ") || room.city;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("admin.rooms.col.listing")}</th>
              {hideOwnerColumn ? null : (
                <th className="px-4 py-3 font-semibold">{t("admin.rooms.col.owner")}</th>
              )}
              <th className="px-4 py-3 font-semibold">{t("admin.rooms.col.location")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.rooms.col.price")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.rooms.col.status")}</th>
              {hasAvailableRooms ? (
                <th className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={cycleSortDays}
                    className={`inline-flex items-center gap-1 rounded transition hover:text-ink ${sortDays ? "text-brand" : "text-ink-soft hover:text-ink"}`}
                    title={sortDays === "desc" ? t("admin.rooms.col.daysAvailable.sort.desc") : sortDays === "asc" ? t("admin.rooms.col.daysAvailable.sort.asc") : t("admin.rooms.col.daysAvailable.sort.none")}
                  >
                    {t("admin.rooms.col.daysAvailable")}
                    {sortDays === "desc" ? (
                      <Icon name="chevron-down" className="h-3.5 w-3.5" />
                    ) : sortDays === "asc" ? (
                      <Icon name="chevron-down" className="h-3.5 w-3.5 rotate-180" />
                    ) : (
                      <Icon name="arrows-up-down" className="h-3.5 w-3.5" />
                    )}
                  </button>
                </th>
              ) : null}
              <th className="px-4 py-3 text-right font-semibold">{t("admin.rooms.col.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-12 text-center text-sm text-ink-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedRooms.map((room) => {
                const effectivelyOccupied = room.isOccupied || isAutoOccupied(room, autoOccupyDays);
                return (
                <tr
                  key={room.id}
                  onClick={rowClickHandler(room.id)}
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Link href={`/rooms/${room.id}`} className="flex items-center gap-3">
                      <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                        {room.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={room.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Icon name={propertyIcon(room.type)} className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{room.title}</p>
                        <p className="truncate text-xs text-ink-muted">{t(`type.${room.type}`)}</p>
                      </div>
                    </Link>
                  </td>
                  {hideOwnerColumn ? null : (
                    <td className="px-4 py-3">
                      <Link
                        href={`/user/admin/users/${room.owner.id}`}
                        className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-brand"
                      >
                        <OwnerAvatar
                          name={room.owner.name}
                          avatarUrl={usersByUid.get(room.owner.id)?.avatarUrl}
                        />
                        <span className="truncate">{room.owner.name}</span>
                      </Link>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <a
                      href={mapsLinkFor(room)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("admin.rooms.location.openInMaps")}
                      className="group inline-flex items-center gap-1.5 text-ink underline decoration-ink-soft decoration-dotted underline-offset-4 hover:text-brand hover:decoration-brand hover:decoration-solid"
                    >
                      <Icon name="map-pin" className="h-3.5 w-3.5 shrink-0 text-brand/70 group-hover:text-brand" />
                      <span>
                        {room.district ? `${room.district}, ` : ""}
                        {room.city}
                      </span>
                    </a>
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand">${room.price}</td>
                  <td className="px-4 py-3">
                    <StatusPill occupied={effectivelyOccupied} />
                  </td>
                  {hasAvailableRooms ? (
                    <td className="px-4 py-3">
                      {!effectivelyOccupied ? (
                        <span className="text-sm tabular-nums text-ink">
                          {daysSinceActivity(room)}
                          <span className="ml-0.5 text-xs text-ink-muted">d</span>
                        </span>
                      ) : null}
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <RowActions
                      room={room}
                      effectivelyOccupied={effectivelyOccupied}
                      onToggle={() => onToggleOccupied(room)}
                      onDelete={() => onDelete(room)}
                    />
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {rooms.length === 0 ? (
          <li className="card px-4 py-10 text-center text-sm text-ink-muted">
            {emptyMessage}
          </li>
        ) : (
          sortedRooms.map((room) => {
            const effectivelyOccupied = room.isOccupied || isAutoOccupied(room, autoOccupyDays);
            return (
            <li
              key={room.id}
              onClick={rowClickHandler(room.id)}
              className="card cursor-pointer p-3"
            >
              <div className="flex items-start gap-3">
                <Link
                  href={`/rooms/${room.id}`}
                  className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100"
                >
                  {room.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={room.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name={propertyIcon(room.type)} className="h-6 w-6 text-slate-300" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/rooms/${room.id}`}
                    className="block truncate text-sm font-semibold text-ink"
                  >
                    {room.title}
                  </Link>
                  <p className="truncate text-xs text-ink-muted">
                    {hideOwnerColumn ? null : `${room.owner.name} · `}
                    <a
                      href={mapsLinkFor(room)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("admin.rooms.location.openInMaps")}
                      className="inline-flex items-center gap-0.5 text-ink underline decoration-ink-soft decoration-dotted underline-offset-4 hover:text-brand hover:decoration-brand hover:decoration-solid"
                    >
                      <Icon name="map-pin" className="h-3 w-3 shrink-0 text-brand/70" />
                      {room.district ?? room.city}
                    </a>
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-sm font-bold text-brand">
                      ${room.price}
                      <span className="ml-0.5 text-[11px] font-medium text-ink-muted">
                        {t("room.suffix.monthly")}
                      </span>
                    </p>
                    <StatusPill occupied={effectivelyOccupied} />
                    {!effectivelyOccupied ? (
                      <span className="text-[11px] text-ink-muted">
                        {daysSinceActivity(room)}d
                      </span>
                    ) : null}
                  </div>
                </div>
                <RowActions
                  room={room}
                  effectivelyOccupied={effectivelyOccupied}
                  onToggle={() => onToggleOccupied(room)}
                  onDelete={() => onDelete(room)}
                />
              </div>
            </li>
            );
          })
        )}
      </ul>
    </>
  );
}

function OwnerAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-xs font-bold text-brand">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

function StatusPill({ occupied }: { occupied: boolean }) {
  const t = useT();
  if (occupied) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {t("admin.status.occupied")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {t("admin.status.available")}
    </span>
  );
}

function RowActions({
  room,
  effectivelyOccupied,
  onToggle,
  onDelete
}: {
  room: Room;
  effectivelyOccupied: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-slate-100 hover:text-ink"
        aria-label={t("admin.rowActions.aria")}
      >
        <Icon name="more-vertical" className="h-4 w-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-cardHover"
        >
          <MenuItem
            icon="shield"
            label={effectivelyOccupied ? t("admin.rooms.action.markAvailable") : t("admin.rooms.action.markOccupied")}
            onClick={() => {
              setOpen(false);
              onToggle();
            }}
          />
          <MenuItem
            icon="trash"
            label={t("admin.rooms.action.delete")}
            danger
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger
}: {
  icon: "home" | "shield" | "trash";
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium transition ${
        danger ? "text-red-700 hover:bg-red-50" : "text-ink hover:bg-slate-50"
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </button>
  );
}
