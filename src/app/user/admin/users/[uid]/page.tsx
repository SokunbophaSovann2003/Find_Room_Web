"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import UserFormModal, { type UserFormValues } from "@/components/admin/UserFormModal";
import AdminRoomsList from "@/components/admin/AdminRoomsList";
import {
  deleteAdminUser,
  toggleAdminUserStatus,
  updateAdminUser,
  useAdminUsers,
  type AdminUser
} from "@/lib/admin";
import { deleteLocalRoom, updateLocalRoom, useLocalRooms } from "@/lib/local-rooms";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import type { Room } from "@/lib/types";

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ uid: string }>();
  const uid = decodeURIComponent(params.uid ?? "");
  const users = useAdminUsers();
  const allRooms = useLocalRooms();
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState<Room | null>(null);

  const user = useMemo(() => users.find((u) => u.uid === uid), [users, uid]);
  const listings = useMemo(
    () => allRooms.filter((r) => r.owner.id === uid),
    [allRooms, uid]
  );
  // Same shape AdminRoomsList expects so the Owner column avatar resolves.
  const usersByUid = useMemo(() => {
    const m = new Map<string, AdminUser>();
    for (const u of users) m.set(u.uid, u);
    return m;
  }, [users]);

  if (!user) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-muted">
          <Icon name="user" className="h-7 w-7" />
        </span>
        <h2 className="text-lg font-bold">{t("admin.userDetail.notFound.title")}</h2>
        <p className="max-w-sm text-sm text-ink-muted">
          {t("admin.userDetail.notFound.body")}
        </p>
        <Link href="/user/admin/users" className="btn-primary mt-2">
          {t("admin.userDetail.backToUsers")}
        </Link>
      </div>
    );
  }

  function handleEditSave(values: UserFormValues) {
    updateAdminUser(user!.uid, values);
    setEditing(false);
    toast.success(t("toast.admin.user.updated", { name: values.username }));
  }

  function handleDelete() {
    const name = user!.username;
    deleteAdminUser(user!.uid);
    setConfirmDelete(false);
    toast.success(t("toast.admin.user.deleted", { name }));
    router.replace("/user/admin/users");
  }

  function handleToggleStatus() {
    if (!user) return;
    const wasActive = user.status === "active";
    toggleAdminUserStatus(user.uid);
    toast.success(
      wasActive
        ? t("toast.admin.user.disabled", { name: user.username })
        : t("toast.admin.user.enabled", { name: user.username })
    );
    // Mirror the auto-occupy behaviour from the users index page so disabling
    // from either location yields the same result.
    if (wasActive) {
      const toHide = listings.filter((r) => !r.isOccupied);
      // Preserve lastActivityAt so admin forcing isOccupied:true doesn't reset
      // the auto-occupy clock — the stale counter should reflect the landlord's
      // last genuine edit, not this admin action.
      for (const r of toHide) {
        updateLocalRoom(r.id, {
          isOccupied: true,
          lastActivityAt: r.lastActivityAt ?? r.createdAt ?? Date.now()
        });
      }
      if (toHide.length > 0) {
        toast.info(t("toast.admin.user.listingsHidden", { n: toHide.length }));
      }
    }
  }

  function handleToggleRoomOccupied(room: Room) {
    const nextOccupied = !room.isOccupied;
    // When marking occupied, preserve the auto-occupy clock so it keeps
    // reflecting the landlord's last genuine activity, not this admin action.
    updateLocalRoom(room.id, {
      isOccupied: nextOccupied,
      ...(nextOccupied ? { lastActivityAt: room.lastActivityAt ?? room.createdAt ?? Date.now() } : {})
    });
    toast.success(
      nextOccupied
        ? t("toast.admin.listing.occupied", { title: room.title })
        : t("toast.admin.listing.available", { title: room.title })
    );
  }

  function handleDeleteRoom() {
    if (!confirmDeleteRoom) return;
    const title = confirmDeleteRoom.title;
    deleteLocalRoom(confirmDeleteRoom.id);
    setConfirmDeleteRoom(null);
    toast.success(t("toast.admin.listing.deleted", { title }));
  }

  const initial = user.username.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/user/admin/users"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          {t("admin.userDetail.allUsers")}
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col items-center gap-3 text-center sm:hidden">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand/15 text-2xl font-bold text-brand ring-4 ring-brand/10">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">{user.username}</h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <RolePill role={user.role} />
            <StatusPill status={user.status} />
          </div>
          <p className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
            <Icon name="phone" className="h-4 w-4 text-brand" />
            {user.phoneNumber}
          </p>
          {user.email ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
              <Icon name="email" className="h-4 w-4 text-brand" />
              {user.email}
            </p>
          ) : null}
        </div>

        <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-3xl font-bold text-brand ring-4 ring-brand/10">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold tracking-tight">{user.username}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <RolePill role={user.role} />
                <StatusPill status={user.status} />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
                <Icon name="phone" className="h-4 w-4 text-brand" />
                {user.phoneNumber}
              </p>
              {user.email ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                  <Icon name="email" className="h-4 w-4 text-brand" />
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Link
              href={`/user/admin/notifications/compose?to=${encodeURIComponent(user.uid)}`}
              className="btn-secondary"
            >
              <Icon name="message" className="h-4 w-4" />
              {t("admin.userDetail.sendNotification")}
            </Link>
            <button type="button" onClick={() => setEditing(true)} className="btn-secondary">
              <Icon name="pencil" className="h-4 w-4" />
              {t("admin.userDetail.edit")}
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              className="btn-secondary"
            >
              <Icon name="shield" className="h-4 w-4" />
              {user.status === "active" ? t("admin.userDetail.disable") : t("admin.userDetail.enable")}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="btn-danger"
            >
              <Icon name="trash" className="h-4 w-4" />
              {t("admin.userDetail.delete")}
            </button>
          </div>
        </div>

        {/* Mobile action row */}
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:hidden">
          <Link
            href={`/user/admin/notifications/compose?to=${encodeURIComponent(user.uid)}`}
            className="btn-secondary"
          >
            <Icon name="message" className="h-4 w-4" />
            {t("admin.userDetail.send")}
          </Link>
          <button type="button" onClick={() => setEditing(true)} className="btn-secondary">
            <Icon name="pencil" className="h-4 w-4" />
            {t("admin.userDetail.edit")}
          </button>
          <button
            type="button"
            onClick={handleToggleStatus}
            className="btn-secondary"
          >
            <Icon name="shield" className="h-4 w-4" />
            {user.status === "active" ? t("admin.userDetail.disable") : t("admin.userDetail.enable")}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="btn-danger"
          >
            <Icon name="trash" className="h-4 w-4" />
            {t("admin.userDetail.delete")}
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl">
            {t("admin.userDetail.listings")}
            <span className="ml-2 rounded-full bg-brand/10 px-2.5 py-0.5 text-sm font-semibold text-brand">
              {listings.length}
            </span>
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Icon name="home" className="h-6 w-6" />
            </span>
            <h3 className="text-base font-bold">{t("admin.userDetail.noListings.title")}</h3>
            <p className="max-w-sm text-sm text-ink-muted">
              {t("admin.userDetail.noListings.body")}
            </p>
          </div>
        ) : (
          <AdminRoomsList
            rooms={listings}
            usersByUid={usersByUid}
            emptyMessage={t("admin.rooms.empty")}
            onToggleOccupied={handleToggleRoomOccupied}
            onDelete={setConfirmDeleteRoom}
            hideOwnerColumn
          />
        )}
      </section>

      {editing ? (
        <UserFormModal
          mode="edit"
          initial={user}
          onCancel={() => setEditing(false)}
          onSubmit={handleEditSave}
        />
      ) : null}

      <ConfirmModal
        open={confirmDelete}
        title={t("admin.userDetail.delete.title")}
        body={
          <>
            <b>{user.username}</b>{t("admin.userDetail.delete.body.suffix")}
          </>
        }
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        open={!!confirmDeleteRoom}
        title={t("admin.rooms.delete.title")}
        body={
          confirmDeleteRoom ? (
            <>
              <b>{confirmDeleteRoom.title}</b>{t("admin.rooms.delete.body.suffix")}
            </>
          ) : null
        }
        onCancel={() => setConfirmDeleteRoom(null)}
        onConfirm={handleDeleteRoom}
      />
    </div>
  );
}

function RolePill({ role }: { role: "admin" | "user" }) {
  const t = useT();
  if (role === "admin") {
    return (
      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
        {t("admin.role.admin")}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
      {t("admin.role.user")}
    </span>
  );
}

function StatusPill({ status }: { status: "active" | "disabled" }) {
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
