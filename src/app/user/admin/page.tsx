"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon, { propertyIcon, type IconName } from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import DateRangePicker from "@/components/DateRangePicker";
import PriceRangePicker from "@/components/PriceRangePicker";
import LocationPicker, { type LocationValue } from "@/components/LocationPicker";
import ListingEditModal, { type ListingEditValues } from "@/components/admin/ListingEditModal";
import { ALL_PROPERTY_TYPES, useAdminUsers, type AdminUser } from "@/lib/admin";
import {
  deleteLocalRoom,
  updateLocalRoom,
  useLocalRooms
} from "@/lib/local-rooms";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import type { PropertyType, Room } from "@/lib/types";

type StatusFilter = "all" | "available" | "occupied";
type TypeFilter = "all" | PropertyType;

const ADD_ROOM_PATH = "/profile/list-room";

export default function AdminRoomsPage() {
  const rooms = useLocalRooms();
  const users = useAdminUsers();
  const t = useT();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [locationFilter, setLocationFilter] = useState<LocationValue>({});
  const [locationOpen, setLocationOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Room | null>(null);

  const usersByUid = useMemo(() => {
    const map = new Map<string, AdminUser>();
    for (const u of users) map.set(u.uid, u);
    return map;
  }, [users]);

  const stats = useMemo(() => {
    const occupied = rooms.filter((r) => r.isOccupied).length;
    const available = rooms.length - occupied;
    const types = new Set(rooms.map((r) => r.type)).size;
    return { total: rooms.length, available, occupied, types };
  }, [rooms]);

  const locationLabel =
    locationFilter.area ?? locationFilter.district ?? locationFilter.province ?? "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    const minP = priceMin ? Number(priceMin) : null;
    const maxP = priceMax ? Number(priceMax) : null;
    return rooms.filter((r) => {
      if (statusFilter === "available" && r.isOccupied) return false;
      if (statusFilter === "occupied" && !r.isOccupied) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (locationFilter.province && r.city !== locationFilter.province) return false;
      if (locationFilter.district && r.district !== locationFilter.district) return false;
      if (locationFilter.area && r.area !== locationFilter.area) return false;
      if (fromMs !== null && r.createdAt < fromMs) return false;
      if (toMs !== null && r.createdAt > toMs) return false;
      if (minP !== null && !Number.isNaN(minP) && r.price < minP) return false;
      if (maxP !== null && !Number.isNaN(maxP) && r.price > maxP) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.owner.name.toLowerCase().includes(q) ||
        (r.district?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rooms, query, statusFilter, typeFilter, locationFilter, dateFrom, dateTo, priceMin, priceMax]);

  function handleEditSave(values: ListingEditValues) {
    if (!editing) return;
    const newOwnerName = usersByUid.get(values.ownerUid)?.username ?? editing.owner.name;
    updateLocalRoom(editing.id, {
      title: values.title,
      price: values.price,
      isOccupied: values.isOccupied,
      owner: {
        ...editing.owner,
        id: values.ownerUid,
        name: newOwnerName
      }
    });
    setEditing(null);
    toast.success(t("toast.admin.listingUpdated"));
  }

  function handleToggleOccupied(room: Room) {
    const nextOccupied = !room.isOccupied;
    updateLocalRoom(room.id, { isOccupied: nextOccupied });
    toast.success(
      nextOccupied
        ? t("toast.admin.listing.occupied", { title: room.title })
        : t("toast.admin.listing.available", { title: room.title })
    );
  }

  function handleDelete() {
    if (!confirmDelete) return;
    const title = confirmDelete.title;
    deleteLocalRoom(confirmDelete.id);
    setConfirmDelete(null);
    toast.success(t("toast.admin.listing.deleted", { title }));
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("admin.rooms.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t("admin.rooms.subtitle")}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("admin.rooms.stat.rooms")}
          value={stats.total}
          hint={t("admin.rooms.stat.availableHint", { n: stats.available })}
          icon="building"
        />
        <StatCard
          label={t("admin.rooms.stat.available")}
          value={stats.available}
          hint={stats.available === 0 ? t("admin.rooms.stat.allOccupied") : t("admin.rooms.stat.openToRenters")}
          icon="home"
        />
        <StatCard
          label={t("admin.rooms.stat.occupied")}
          value={stats.occupied}
          hint={stats.occupied === 0 ? t("admin.rooms.stat.noneOccupied") : t("admin.rooms.stat.currentlyRented")}
          icon="check"
        />
        <StatCard
          label={t("admin.rooms.stat.types")}
          value={stats.types}
          hint={stats.types === 0 ? t("admin.rooms.stat.noRooms") : t("admin.rooms.stat.distinctCategories")}
          icon="bed"
        />
      </section>

      <div className="card flex flex-col gap-3 p-3 lg:grid lg:grid-cols-[minmax(0,1fr)_140px_140px_160px_auto_auto_auto] lg:items-center">
        {/* Search + filters-toggle row. Toggle hides on lg+ where filters stay inline. */}
        <div className="flex items-center gap-2 lg:contents">
          <div className="relative flex-1 lg:col-span-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
            />
            <input
              className="input pl-9"
              placeholder={t("admin.rooms.search.placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="rooms-filter-controls"
            aria-label={filtersOpen ? t("admin.filter.hideFilters") : t("admin.filter.showFilters")}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-muted transition hover:bg-slate-50 hover:text-ink lg:hidden"
          >
            <Icon
              name="chevron-down"
              className={`h-4 w-4 transition ${filtersOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div
          id="rooms-filter-controls"
          className={`${filtersOpen ? "flex" : "hidden"} flex-col gap-3 lg:contents`}
        >
          <FilterSelect
            ariaLabel={t("admin.filter.statusLabel")}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: "all", label: t("admin.filter.anyStatus") },
              { value: "available", label: t("admin.status.available") },
              { value: "occupied", label: t("admin.status.occupied") }
            ]}
          />
          <FilterSelect
            ariaLabel={t("admin.filter.typeLabel")}
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as TypeFilter)}
            options={[
              { value: "all", label: t("admin.filter.anyType") },
              ...ALL_PROPERTY_TYPES.map((pt) => ({
                value: pt,
                label: t(`admin.propertyType.${pt}`)
              }))
            ]}
          />
          <div className="relative">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={locationOpen}
              onClick={() => setLocationOpen(true)}
              className="input flex w-full items-center justify-between gap-2 text-left"
            >
              <span
                className={`truncate ${locationLabel ? "text-ink" : "text-ink-soft"}`}
              >
                {locationLabel || t("admin.filter.anyLocation")}
              </span>
              <Icon name="map-pin" className="h-4 w-4 shrink-0 text-ink-soft" />
            </button>
            <LocationPicker
              open={locationOpen}
              onClose={() => setLocationOpen(false)}
              mode="modal"
              intent="browse"
              value={locationFilter}
              onChange={setLocationFilter}
            />
          </div>
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            placeholder={t("admin.filter.anyCreatedDate")}
            onChange={(f, to) => {
              setDateFrom(f);
              setDateTo(to);
            }}
          />
          <PriceRangePicker
            min={priceMin}
            max={priceMax}
            placeholder={t("admin.filter.anyPrice")}
            onChange={(mn, mx) => {
              setPriceMin(mn);
              setPriceMax(mx);
            }}
          />
        </div>

        <Link href={ADD_ROOM_PATH} className="btn-primary justify-center">
          <Icon name="plus" className="h-4 w-4" />
          {t("admin.rooms.addRoom")}
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("admin.rooms.col.listing")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.rooms.col.owner")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.rooms.col.location")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.rooms.col.price")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.rooms.col.status")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("admin.rooms.col.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-muted">
                  {t("admin.rooms.empty")}
                </td>
              </tr>
            ) : (
              filtered.map((room) => (
                <tr key={room.id} className="transition hover:bg-slate-50">
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
                  <td className="px-4 py-3 text-ink-muted">
                    {room.district ? `${room.district}, ` : ""}
                    {room.city}
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand">${room.price}</td>
                  <td className="px-4 py-3">
                    <StatusPill occupied={!!room.isOccupied} />
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      room={room}
                      onEdit={() => setEditing(room)}
                      onToggle={() => handleToggleOccupied(room)}
                      onDelete={() => setConfirmDelete(room)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {filtered.length === 0 ? (
          <li className="card px-4 py-10 text-center text-sm text-ink-muted">
            {t("admin.rooms.empty")}
          </li>
        ) : (
          filtered.map((room) => (
            <li key={room.id} className="card p-3">
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
                    {room.owner.name} · {room.district ?? room.city}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-sm font-bold text-brand">
                      ${room.price}
                      <span className="ml-0.5 text-[11px] font-medium text-ink-muted">
                        {t("room.suffix.monthly")}
                      </span>
                    </p>
                    <StatusPill occupied={!!room.isOccupied} />
                  </div>
                </div>
                <RowActions
                  room={room}
                  onEdit={() => setEditing(room)}
                  onToggle={() => handleToggleOccupied(room)}
                  onDelete={() => setConfirmDelete(room)}
                />
              </div>
            </li>
          ))
        )}
      </ul>

      {editing ? (
        <ListingEditModal
          room={editing}
          users={users}
          onCancel={() => setEditing(null)}
          onSubmit={handleEditSave}
        />
      ) : null}

      <ConfirmModal
        open={!!confirmDelete}
        title={t("admin.rooms.delete.title")}
        body={
          confirmDelete ? (
            <>
              <b>{confirmDelete.title}</b>{t("admin.rooms.delete.body.suffix")}
            </>
          ) : null
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
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

function StatCard({
  label,
  value,
  hint,
  icon
}: {
  label: string;
  value: number;
  hint: string;
  icon: IconName;
}) {
  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-[11px] text-ink-muted">{hint}</p>
    </div>
  );
}

function FilterSelect({
  ariaLabel,
  value,
  onChange,
  options
}: {
  ariaLabel: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="input flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="truncate">{current.label}</span>
        <Icon
          name="chevron-down"
          className={`h-4 w-4 shrink-0 text-ink-soft transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-cardHover"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-brand/10 font-semibold text-brand"
                    : "text-ink hover:bg-slate-50"
                }`}
              >
                {o.label}
                {active ? <Icon name="check" className="h-4 w-4 text-brand" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
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
  onEdit,
  onToggle,
  onDelete
}: {
  room: Room;
  onEdit: () => void;
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
          <MenuItem icon="pencil" label={t("admin.rooms.action.edit")} onClick={onEdit} />
          <MenuItem
            icon="shield"
            label={room.isOccupied ? t("admin.rooms.action.markAvailable") : t("admin.rooms.action.markOccupied")}
            onClick={onToggle}
          />
          <MenuItem icon="trash" label={t("admin.rooms.action.delete")} danger onClick={onDelete} />
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
  icon: "home" | "pencil" | "shield" | "trash";
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
