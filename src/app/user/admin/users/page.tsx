"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import DateRangePicker from "@/components/DateRangePicker";
import UserFormModal, { type UserFormValues } from "@/components/admin/UserFormModal";
import PageSizeSelect from "@/components/admin/PageSizeSelect";
import LoadMoreSentinel from "@/components/admin/LoadMoreSentinel";
import {
  addAdminUser,
  deleteAdminUser,
  toggleAdminUserStatus,
  updateAdminUser,
  useAdminUsers,
  type AdminUser
} from "@/lib/admin";
import { updateRoom, useRooms } from "@/lib/rooms";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";

type StatusFilter = "all" | "active" | "disabled";
type RoleFilter = "all" | "user" | "admin";

// Mobile cards render this many rows up front, then load more on scroll.
const MOBILE_PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const router = useRouter();
  const users = useAdminUsers();
  const rooms = useRooms();
  const t = useT();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState<AdminUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<AdminUser[] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mobileVisible, setMobileVisible] = useState(MOBILE_PAGE_SIZE);

  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

  const listingsByUid = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rooms) {
      map.set(r.owner.id, (map.get(r.owner.id) ?? 0) + 1);
    }
    return map;
  }, [rooms]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "active").length;
    const disabled = users.length - active;
    const admins = users.filter((u) => u.role === "admin").length;
    return { total: users.length, active, disabled, admins };
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // `YYYY-MM-DD` from <input type="date"> → ms range that covers the whole day.
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    return users.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (fromMs !== null && u.createdAt < fromMs) return false;
      if (toMs !== null && u.createdAt > toMs) return false;
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.phoneNumber.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [users, query, statusFilter, roleFilter, dateFrom, dateTo]);

  const totalRows = filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

  // Clamp the current page when the result set shrinks (filter change, deletes,
  // or a larger page size) so we never land on an empty page past the end.
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const rangeStart = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalRows);

  // Mobile cards: reset the infinite-scroll window when filters/search change,
  // then reveal MOBILE_PAGE_SIZE more each time the user scrolls to the bottom.
  useEffect(() => {
    setMobileVisible(MOBILE_PAGE_SIZE);
  }, [query, statusFilter, roleFilter, dateFrom, dateTo]);
  const mobileUsers = filtered.slice(0, mobileVisible);

  // Drop selected ids that no longer exist (after a bulk delete or filter
  // change) so the toolbar count stays accurate.
  useEffect(() => {
    setSelectedIds((prev) => {
      const live = new Set(users.map((u) => u.uid));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (live.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [users]);

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedIds.has(u.uid)),
    [users, selectedIds]
  );

  const allPageSelected =
    pagedUsers.length > 0 && pagedUsers.every((u) => selectedIds.has(u.uid));
  const somePageSelected = pagedUsers.some((u) => selectedIds.has(u.uid));

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const u of pagedUsers) next.delete(u.uid);
      } else {
        for (const u of pagedUsers) next.add(u.uid);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleBulkDisable(selected: AdminUser[]) {
    let disabledCount = 0;
    let hiddenCount = 0;
    for (const u of selected) {
      if (u.status !== "active") continue;
      void toggleAdminUserStatus(u.uid);
      disabledCount += 1;
      const toHide = rooms.filter((r) => r.owner.id === u.uid && !r.isOccupied);
      for (const r of toHide) void updateRoom(r.id, { isOccupied: true });
      hiddenCount += toHide.length;
    }
    clearSelection();
    if (disabledCount > 0) {
      toast.success(t("toast.admin.user.bulkDisabled", { n: disabledCount }));
    }
    if (hiddenCount > 0) {
      toast.info(t("toast.admin.user.listingsHidden", { n: hiddenCount }));
    }
  }

  function handleBulkDelete() {
    if (!confirmBulkDelete) return;
    const n = confirmBulkDelete.length;
    for (const u of confirmBulkDelete) void deleteAdminUser(u.uid);
    setConfirmBulkDelete(null);
    toast.success(t("toast.admin.user.bulkDeleted", { n }));
  }

  function handleAdd(values: UserFormValues) {
    void addAdminUser(values);
    setAdding(false);
    toast.success(t("toast.admin.user.added", { name: values.username }));
  }

  function handleEditSave(values: UserFormValues) {
    if (!editing) return;
    void updateAdminUser(editing.uid, values);
    setEditing(null);
    toast.success(t("toast.admin.user.updated", { name: values.username }));
  }

  function handleDelete() {
    if (!confirmDelete) return;
    const name = confirmDelete.username;
    void deleteAdminUser(confirmDelete.uid);
    setConfirmDelete(null);
    toast.success(t("toast.admin.user.deleted", { name }));
  }

  function handleToggleStatus(u: AdminUser) {
    const wasActive = u.status === "active";
    void toggleAdminUserStatus(u.uid);
    toast.success(
      wasActive
        ? t("toast.admin.user.disabled", { name: u.username })
        : t("toast.admin.user.enabled", { name: u.username })
    );
    // When an admin disables a user, hide their listings from explore by
    // flipping each available room to occupied. We don't auto-restore on
    // re-enable: any room marked occupied while the user was disabled may
    // also have been legitimately occupied, so we leave the call to the
    // owner once they're active again.
    if (wasActive) {
      const toHide = rooms.filter((r) => r.owner.id === u.uid && !r.isOccupied);
      for (const r of toHide) void updateRoom(r.id, { isOccupied: true });
      if (toHide.length > 0) {
        toast.info(t("toast.admin.user.listingsHidden", { n: toHide.length }));
      }
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("admin.users.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t("admin.users.subtitle")}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("admin.users.stat.users")}
          value={stats.total}
          hint={t("admin.users.stat.activeHint", { n: stats.active })}
          icon="user"
        />
        <StatCard
          label={t("admin.users.stat.active")}
          value={stats.active}
          hint={stats.active === 0 ? t("admin.users.stat.noActive") : t("admin.users.stat.currentlyEnabled")}
          icon="check"
        />
        <StatCard
          label={t("admin.users.stat.disabled")}
          value={stats.disabled}
          hint={stats.disabled === 0 ? t("admin.users.stat.allActive") : t("admin.users.stat.suspended")}
          icon="shield"
        />
        <StatCard
          label={t("admin.users.stat.admins")}
          value={stats.admins}
          hint={stats.admins === 1 ? t("admin.users.stat.oneAdmin") : t("admin.users.stat.manyAdmins", { n: stats.admins })}
          icon="shield"
        />
      </section>

      <div className="card flex flex-col gap-3 p-3 lg:grid lg:grid-cols-[minmax(0,1fr)_140px_140px_auto_auto] lg:items-center">
        {/* Search + filters-toggle row. Toggle hides on lg+ where filters stay inline. */}
        <div className="flex items-center gap-2 lg:contents">
          <div className="relative flex-1 lg:col-span-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
            />
            <input
              className="input pl-9"
              placeholder={t("admin.users.search.placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="users-filter-controls"
            aria-label={filtersOpen ? t("admin.filter.hideFilters") : t("admin.filter.showFilters")}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-muted transition hover:bg-slate-50 hover:text-ink lg:hidden"
          >
            <Icon
              name="chevron-down"
              className={`h-4 w-4 transition ${filtersOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Collapsible filter group on mobile; flows into the grid on lg+. */}
        <div
          id="users-filter-controls"
          className={`${filtersOpen ? "flex" : "hidden"} flex-col gap-3 lg:contents`}
        >
          <FilterSelect
            ariaLabel={t("admin.filter.statusLabel")}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: "all", label: t("admin.filter.anyStatus") },
              { value: "active", label: t("admin.status.active") },
              { value: "disabled", label: t("admin.status.disabled") }
            ]}
          />
          <FilterSelect
            ariaLabel={t("admin.filter.roleLabel")}
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as RoleFilter)}
            options={[
              { value: "all", label: t("admin.filter.anyRole") },
              { value: "user", label: t("admin.role.user") },
              { value: "admin", label: t("admin.role.admin") }
            ]}
          />
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            placeholder={t("admin.filter.anyCreatedDate")}
            onChange={(f, to) => {
              setDateFrom(f);
              setDateTo(to);
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="btn-primary justify-center"
        >
          <Icon name="plus" className="h-4 w-4" />
          {t("admin.users.addUser")}
        </button>
      </div>

      {/* Bulk-action toolbar (desktop). Appears when rows are selected. */}
      {selectedUsers.length > 0 ? (
        <div className="hidden items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/5 px-4 py-2.5 md:flex">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-ink">
              {t("admin.users.bulk.selected", { n: selectedUsers.length })}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
            >
              {t("admin.users.bulk.clear")}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkDisable(selectedUsers)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
            >
              <Icon name="shield" className="h-4 w-4" />
              {t("admin.users.bulk.disable")}
            </button>
            <button
              type="button"
              onClick={() => setConfirmBulkDelete(selectedUsers)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <Icon name="trash" className="h-4 w-4" />
              {t("admin.users.bulk.delete")}
            </button>
          </div>
        </div>
      ) : null}

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block">
        <div className="h-[640px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label={t("admin.users.bulk.selectAll")}
                  checked={allPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allPageSelected && somePageSelected;
                  }}
                  onChange={togglePage}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-brand focus:ring-brand"
                />
              </th>
              <th className="px-4 py-3 font-semibold">{t("admin.users.col.user")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.users.col.phone")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.users.col.role")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.users.col.status")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.users.col.listings")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("admin.users.col.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-muted">
                  {t("admin.users.empty")}
                </td>
              </tr>
            ) : (
              pagedUsers.map((u) => (
                <tr
                  key={u.uid}
                  className={`transition hover:bg-slate-50 ${
                    selectedIds.has(u.uid) ? "bg-brand/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={t("admin.users.bulk.selectRow")}
                      checked={selectedIds.has(u.uid)}
                      onChange={() => toggleRow(u.uid)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-brand focus:ring-brand"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/user/admin/users/${u.uid}`} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-sm font-bold text-brand">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          u.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{u.username}</p>
                        {u.email ? (
                          <p className="truncate text-xs text-ink-muted">{u.email}</p>
                        ) : null}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{u.phoneNumber}</td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                        {t("admin.role.admin")}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-muted">{t("admin.role.user")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{listingsByUid.get(u.uid) ?? 0}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      user={u}
                      onView={() => router.push(`/user/admin/users/${u.uid}`)}
                      onEdit={() => setEditing(u)}
                      onToggle={() => u.status === "active" ? setConfirmDisable(u) : handleToggleStatus(u)}
                      onDelete={() => setConfirmDelete(u)}
                      onSend={() =>
                        router.push(
                          `/user/admin/notifications/compose?to=${encodeURIComponent(u.uid)}`
                        )
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination (desktop only) */}
      {totalRows > 0 ? (
        <div className="hidden flex-col items-center justify-between gap-3 sm:flex-row md:flex">
          <div className="flex items-center gap-3">
            <p className="text-xs text-ink-muted">
              {t("admin.users.pagination.summary", {
                from: rangeStart,
                to: rangeEnd,
                total: totalRows
              })}
            </p>
            <PageSizeSelect
              value={pageSize}
              options={PAGE_SIZE_OPTIONS}
              onChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
              label={t("admin.users.pagination.perPageLabel")}
              optionLabel={(n) => t("admin.users.pagination.perPage", { n })}
            />
          </div>
          <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-ink-muted transition hover:bg-slate-50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-ink-muted"
              >
                <Icon name="chevron-down" className="h-4 w-4 rotate-90" />
                {t("admin.users.pagination.prev")}
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                    n === page
                      ? "border-brand bg-brand text-white"
                      : "border-slate-200 bg-white text-ink-muted hover:bg-slate-50 hover:text-ink"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
                className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-ink-muted transition hover:bg-slate-50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-ink-muted"
              >
                {t("admin.users.pagination.next")}
                <Icon name="chevron-down" className="h-4 w-4 -rotate-90" />
              </button>
            </div>
        </div>
      ) : null}

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {filtered.length === 0 ? (
          <li className="card px-4 py-10 text-center text-sm text-ink-muted">
            {t("admin.users.empty")}
          </li>
        ) : (
          mobileUsers.map((u) => (
            <li key={u.uid} className="card p-3">
              <div className="flex items-center gap-3">
                <Link
                  href={`/user/admin/users/${u.uid}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-base font-bold text-brand"
                >
                  {u.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    u.username.charAt(0).toUpperCase()
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/user/admin/users/${u.uid}`}
                    className="block truncate text-sm font-semibold text-ink"
                  >
                    {u.username}
                  </Link>
                  <p className="truncate text-xs text-ink-muted">{u.phoneNumber}</p>
                </div>
                <RowActions
                  user={u}
                  onView={() => (window.location.href = `/user/admin/users/${u.uid}`)}
                  onEdit={() => setEditing(u)}
                  onToggle={() => handleToggleStatus(u)}
                  onDelete={() => setConfirmDelete(u)}
                  onSend={() =>
                    router.push(
                      `/user/admin/notifications/compose?to=${encodeURIComponent(u.uid)}`
                    )
                  }
                />
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <StatusPill status={u.status} />
                {u.role === "admin" ? (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand">
                    {t("admin.role.admin")}
                  </span>
                ) : null}
                <span className="text-ink-muted">{t("admin.users.listingsCount", { n: listingsByUid.get(u.uid) ?? 0 })}</span>
              </div>
            </li>
          ))
        )}
      </ul>

      <LoadMoreSentinel
        className="md:hidden"
        hasMore={mobileVisible < filtered.length}
        onLoadMore={() => setMobileVisible((v) => v + MOBILE_PAGE_SIZE)}
      />

      {adding ? (
        <UserFormModal
          mode="add"
          onCancel={() => setAdding(false)}
          onSubmit={handleAdd}
        />
      ) : null}

      {editing ? (
        <UserFormModal
          mode="edit"
          initial={editing}
          onCancel={() => setEditing(null)}
          onSubmit={handleEditSave}
        />
      ) : null}

      <ConfirmModal
        open={!!confirmDisable}
        title={t("admin.userDetail.disable.title")}
        body={
          confirmDisable ? (
            <><b>{confirmDisable.username}</b>{t("admin.userDetail.disable.body.suffix")}</>
          ) : null
        }
        onCancel={() => setConfirmDisable(null)}
        onConfirm={() => { const u = confirmDisable!; setConfirmDisable(null); handleToggleStatus(u); }}
      />

      <ConfirmModal
        open={!!confirmDelete}
        title={t("admin.users.delete.title")}
        body={
          confirmDelete ? (
            <>
              {t("admin.users.delete.body.prefix")}<b>{confirmDelete.username}</b>{t("admin.users.delete.body.suffix")}
            </>
          ) : null
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        open={!!confirmBulkDelete}
        title={t("admin.users.bulk.delete.title")}
        body={
          confirmBulkDelete ? t("admin.users.bulk.delete.body", { n: confirmBulkDelete.length }) : null
        }
        onCancel={() => setConfirmBulkDelete(null)}
        onConfirm={handleBulkDelete}
      />
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
          className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-cardHover"
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

function StatusPill({ status }: { status: AdminUser["status"] }) {
  const t = useT();
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {t("admin.status.active")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {t("admin.status.disabled")}
    </span>
  );
}

function RowActions({
  user,
  onView,
  onEdit,
  onToggle,
  onDelete,
  onSend
}: {
  user: AdminUser;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onSend: () => void;
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
          <MenuItem icon="user" label={t("admin.users.action.viewProfile")} onClick={onView} />
          <MenuItem icon="message" label={t("admin.users.action.sendNotification")} onClick={onSend} />
          <MenuItem icon="pencil" label={t("admin.users.action.edit")} onClick={onEdit} />
          <MenuItem
            icon="shield"
            label={user.status === "active" ? t("admin.users.action.disable") : t("admin.users.action.enable")}
            onClick={onToggle}
          />
          <MenuItem icon="trash" label={t("admin.users.action.delete")} danger onClick={onDelete} />
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
  icon: "user" | "pencil" | "shield" | "trash" | "message";
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

