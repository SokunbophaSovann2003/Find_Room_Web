"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import DateRangePicker from "@/components/DateRangePicker";
import PriceRangePicker from "@/components/PriceRangePicker";
import LocationPicker, { type LocationValue } from "@/components/LocationPicker";
import StatCard from "@/components/StatCard";
import FilterSelect from "@/components/FilterSelect";
import AdminRoomsList from "@/components/admin/AdminRoomsList";
import { ALL_PROPERTY_TYPES, useAdminSettings, useAdminUsers, type AdminUser } from "@/lib/admin";
import { isAutoOccupied } from "@/lib/auto-occupy";
import { deleteRoom, updateRoom, useRooms } from "@/lib/rooms";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import type { PropertyType, Room } from "@/lib/types";

type StatusFilter = "all" | "pending" | "available" | "occupied";
type TypeFilter = "all" | PropertyType;

export default function AdminRoomsPage() {
  const { rooms } = useRooms();
  const users = useAdminUsers();
  const { autoOccupyDays } = useAdminSettings();
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
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<Room[] | null>(null);
  const [confirmReject, setConfirmReject] = useState<Room | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const usersByUid = useMemo(() => {
    const map = new Map<string, AdminUser>();
    for (const u of users) map.set(u.uid, u);
    return map;
  }, [users]);

  const stats = useMemo(() => {
    const pending = rooms.filter((r) => r.status === "pending").length;
    const published = rooms.filter((r) => (r.status ?? "published") === "published");
    const occupied = published.filter((r) => r.isOccupied || isAutoOccupied(r, autoOccupyDays)).length;
    const available = published.length - occupied;
    const types = new Set(rooms.map((r) => r.type)).size;
    // Exclude rejected rooms from total so available + occupied + pending = total
    return { total: pending + published.length, available, occupied, pending, types };
  }, [rooms, autoOccupyDays]);

  const locationLabel =
    locationFilter.area ?? locationFilter.district ?? locationFilter.province ?? "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    const minP = priceMin ? Number(priceMin) : null;
    const maxP = priceMax ? Number(priceMax) : null;
    return rooms.filter((r) => {
      const effectivelyOccupied = r.isOccupied || isAutoOccupied(r, autoOccupyDays);
      const roomStatus = r.status ?? "published";
      if (statusFilter === "pending" && roomStatus !== "pending") return false;
      if (statusFilter === "available" && (roomStatus !== "published" || effectivelyOccupied)) return false;
      if (statusFilter === "occupied" && (roomStatus !== "published" || !effectivelyOccupied)) return false;
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
  }, [rooms, query, statusFilter, typeFilter, locationFilter, dateFrom, dateTo, priceMin, priceMax, autoOccupyDays]);

  function handleToggleOccupied(room: Room) {
    const nextOccupied = !room.isOccupied;
    void updateRoom(room.id, { isOccupied: nextOccupied });
    toast.success(
      nextOccupied
        ? t("toast.admin.listing.occupied", { title: room.title })
        : t("toast.admin.listing.available", { title: room.title })
    );
  }

  function handleDelete() {
    if (!confirmDelete) return;
    const title = confirmDelete.title;
    void deleteRoom(confirmDelete.id, confirmDelete.owner.id);
    setConfirmDelete(null);
    toast.success(t("toast.admin.listing.deleted", { title }));
  }

  function handleApprove(room: Room) {
    // Preserve lastActivityAt so approval doesn't reset the auto-occupy clock
    void updateRoom(room.id, { status: "published", rejectionReason: undefined, lastActivityAt: room.lastActivityAt });
    toast.success(t("toast.admin.listing.approved", { title: room.title }));
  }

  function handleReject(room: Room) {
    setConfirmReject(room);
    setRejectReason("");
  }

  function handleRejectConfirm() {
    if (!confirmReject) return;
    void updateRoom(confirmReject.id, { status: "rejected", rejectionReason: rejectReason.trim() || undefined });
    toast.success(t("toast.admin.listing.rejected", { title: confirmReject.title }));
    setConfirmReject(null);
    setRejectReason("");
  }

  function handleBulkApprove(selected: Room[]) {
    for (const room of selected) {
      void updateRoom(room.id, { status: "published", rejectionReason: undefined, lastActivityAt: room.lastActivityAt });
    }
    toast.success(t("toast.admin.listing.bulkApproved", { n: selected.length }));
  }

  function handleBulkReject(selected: Room[]) {
    for (const room of selected) {
      void updateRoom(room.id, { status: "rejected" });
    }
    toast.success(t("toast.admin.listing.bulkRejected", { n: selected.length }));
  }

  function handleBulkOccupy(selected: Room[]) {
    for (const room of selected) {
      if (!room.isOccupied) void updateRoom(room.id, { isOccupied: true });
    }
    toast.success(t("toast.admin.listing.bulkOccupied", { n: selected.length }));
  }

  function handleBulkUnoccupy(selected: Room[]) {
    for (const room of selected) {
      if (room.isOccupied) void updateRoom(room.id, { isOccupied: false });
    }
    toast.success(t("toast.admin.listing.bulkAvailable", { n: selected.length }));
  }

  function handleBulkDelete() {
    if (!confirmBulkDelete) return;
    const n = confirmBulkDelete.length;
    for (const room of confirmBulkDelete) void deleteRoom(room.id, room.owner.id);
    setConfirmBulkDelete(null);
    toast.success(t("toast.admin.listing.bulkDeleted", { n }));
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("admin.rooms.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t("admin.rooms.subtitle")}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard
          label={t("admin.rooms.stat.rooms")}
          value={stats.total}
          hint={t("admin.rooms.stat.availableHint", { n: stats.available })}
          icon="building"
        />
        <StatCard
          label={t("admin.rooms.stat.pending")}
          value={stats.pending}
          hint={stats.pending === 0 ? t("admin.rooms.stat.noPending") : t("admin.rooms.stat.awaitingReview")}
          icon="bell"
          highlight={stats.pending > 0}
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
              { value: "pending", label: t("listing.status.pending") + (stats.pending > 0 ? ` (${stats.pending})` : "") },
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
      </div>

      <AdminRoomsList
        rooms={filtered}
        usersByUid={usersByUid}
        emptyMessage={t("admin.rooms.empty")}
        onToggleOccupied={handleToggleOccupied}
        onDelete={setConfirmDelete}
        onApprove={handleApprove}
        onReject={handleReject}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onBulkOccupy={handleBulkOccupy}
        onBulkUnoccupy={handleBulkUnoccupy}
        onBulkDelete={setConfirmBulkDelete}
        paginated
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

      <ConfirmModal
        open={!!confirmBulkDelete}
        title={t("admin.rooms.bulk.delete.title")}
        body={
          confirmBulkDelete ? t("admin.rooms.bulk.delete.body", { n: confirmBulkDelete.length }) : null
        }
        onCancel={() => setConfirmBulkDelete(null)}
        onConfirm={handleBulkDelete}
      />

      {confirmReject ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-base font-bold text-ink">{t("admin.rooms.reject.title")}</h2>
            <p className="text-sm text-ink-muted">
              <b>{confirmReject.title}</b>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t("admin.rooms.reject.reasonLabel")}
              </label>
              <textarea
                className="input min-h-[80px] w-full resize-none"
                placeholder={t("admin.rooms.reject.reasonPlaceholder")}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setConfirmReject(null)}>
                {t("common.cancel")}
              </button>
              <button type="button" className="btn-danger" onClick={handleRejectConfirm}>
                {t("admin.rooms.action.reject")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


