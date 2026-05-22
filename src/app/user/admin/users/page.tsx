"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import DateRangePicker from "@/components/DateRangePicker";
import UserFormModal, { type UserFormValues } from "@/components/admin/UserFormModal";
import {
  addAdminUser,
  deleteAdminUser,
  toggleAdminUserStatus,
  updateAdminUser,
  useAdminUsers,
  type AdminUser
} from "@/lib/admin";
import { useLocalRooms } from "@/lib/local-rooms";

type StatusFilter = "all" | "active" | "disabled";
type RoleFilter = "all" | "user" | "admin";

export default function AdminUsersPage() {
  const router = useRouter();
  const users = useAdminUsers();
  const rooms = useLocalRooms();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

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

  function handleAdd(values: UserFormValues) {
    addAdminUser(values);
    setAdding(false);
  }

  function handleEditSave(values: UserFormValues) {
    if (!editing) return;
    updateAdminUser(editing.uid, values);
    setEditing(null);
  }

  function handleDelete() {
    if (!confirmDelete) return;
    deleteAdminUser(confirmDelete.uid);
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Users</h1>
        <p className="mt-1 text-sm text-ink-muted">
          View, add, edit, disable or delete user accounts.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Users"
          value={stats.total}
          hint={`${stats.active} active`}
          icon="user"
        />
        <StatCard
          label="Active"
          value={stats.active}
          hint={stats.active === 0 ? "No active accounts" : "Currently enabled"}
          icon="check"
        />
        <StatCard
          label="Disabled"
          value={stats.disabled}
          hint={stats.disabled === 0 ? "All accounts active" : "Suspended accounts"}
          icon="shield"
        />
        <StatCard
          label="Admins"
          value={stats.admins}
          hint={stats.admins === 1 ? "1 admin account" : `${stats.admins} admin accounts`}
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
              placeholder="Search name, phone, or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="users-filter-controls"
            aria-label={filtersOpen ? "Hide filters" : "Show filters"}
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
            ariaLabel="Status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: "all", label: "Any status" },
              { value: "active", label: "Active" },
              { value: "disabled", label: "Disabled" }
            ]}
          />
          <FilterSelect
            ariaLabel="Role"
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as RoleFilter)}
            options={[
              { value: "all", label: "Any role" },
              { value: "user", label: "User" },
              { value: "admin", label: "Admin" }
            ]}
          />
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            placeholder="Any created date"
            onChange={(f, t) => {
              setDateFrom(f);
              setDateTo(t);
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="btn-primary justify-center"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add user
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Listings</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-muted">
                  No users match this search.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.uid} className="transition hover:bg-slate-50">
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
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs text-ink-muted">User</span>
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
                      onToggle={() => toggleAdminUserStatus(u.uid)}
                      onDelete={() => setConfirmDelete(u)}
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
            No users match this search.
          </li>
        ) : (
          filtered.map((u) => (
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
                  onToggle={() => toggleAdminUserStatus(u.uid)}
                  onDelete={() => setConfirmDelete(u)}
                />
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <StatusPill status={u.status} />
                {u.role === "admin" ? (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand">
                    Admin
                  </span>
                ) : null}
                <span className="text-ink-muted">{listingsByUid.get(u.uid) ?? 0} listings</span>
              </div>
            </li>
          ))
        )}
      </ul>

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

      {confirmDelete ? (
        <ConfirmDeleteModal
          user={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
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
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Disabled
    </span>
  );
}

function RowActions({
  user,
  onView,
  onEdit,
  onToggle,
  onDelete
}: {
  user: AdminUser;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-slate-100 hover:text-ink"
        aria-label="Row actions"
      >
        <Icon name="more-vertical" className="h-4 w-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-cardHover"
        >
          <MenuItem icon="user" label="View profile" onClick={onView} />
          <MenuItem icon="pencil" label="Edit" onClick={onEdit} />
          <MenuItem
            icon="shield"
            label={user.status === "active" ? "Disable" : "Enable"}
            onClick={onToggle}
          />
          <MenuItem icon="trash" label="Delete" danger onClick={onDelete} />
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
  icon: "user" | "pencil" | "shield" | "trash";
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

function ConfirmDeleteModal({
  user,
  onCancel,
  onConfirm
}: {
  user: AdminUser;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-cardHover"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700">
            <Icon name="trash" className="h-4 w-4" />
          </span>
          <h3 className="text-base font-bold">Delete user?</h3>
        </div>
        <p className="text-sm text-ink-muted">
          This removes <b>{user.username}</b> from the admin user list. Their listings stay in
          place but become unowned. This can&apos;t be undone in the mock data.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
