"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import DateRangePicker from "@/components/DateRangePicker";
import PriceRangePicker from "@/components/PriceRangePicker";
import LocationPicker, { type LocationValue } from "@/components/LocationPicker";
import AdminRoomsList from "@/components/admin/AdminRoomsList";
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

      <AdminRoomsList
        rooms={filtered}
        usersByUid={usersByUid}
        emptyMessage={t("admin.rooms.empty")}
        onToggleOccupied={handleToggleOccupied}
        onDelete={setConfirmDelete}
      />

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

