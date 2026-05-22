"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoomCard from "@/components/RoomCard";
import Icon, { propertyIcon } from "@/components/Icon";
import UserFormModal, { type UserFormValues } from "@/components/admin/UserFormModal";
import {
  deleteAdminUser,
  toggleAdminUserStatus,
  updateAdminUser,
  useAdminUsers
} from "@/lib/admin";
import { useLocalRooms } from "@/lib/local-rooms";

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ uid: string }>();
  const uid = decodeURIComponent(params.uid ?? "");
  const users = useAdminUsers();
  const allRooms = useLocalRooms();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const user = useMemo(() => users.find((u) => u.uid === uid), [users, uid]);
  const listings = useMemo(
    () => allRooms.filter((r) => r.owner.id === uid),
    [allRooms, uid]
  );

  if (!user) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-muted">
          <Icon name="user" className="h-7 w-7" />
        </span>
        <h2 className="text-lg font-bold">User not found</h2>
        <p className="max-w-sm text-sm text-ink-muted">
          This account may have been deleted. Return to the user list to manage everyone else.
        </p>
        <Link href="/user/admin/users" className="btn-primary mt-2">
          Back to users
        </Link>
      </div>
    );
  }

  function handleEditSave(values: UserFormValues) {
    updateAdminUser(user!.uid, values);
    setEditing(false);
  }

  function handleDelete() {
    deleteAdminUser(user!.uid);
    setConfirmDelete(false);
    router.replace("/user/admin/users");
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
          All users
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
            <button type="button" onClick={() => setEditing(true)} className="btn-secondary">
              <Icon name="pencil" className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => toggleAdminUserStatus(user.uid)}
              className="btn-secondary"
            >
              <Icon name="shield" className="h-4 w-4" />
              {user.status === "active" ? "Disable" : "Enable"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="btn-danger"
            >
              <Icon name="trash" className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Mobile action row */}
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:hidden">
          <button type="button" onClick={() => setEditing(true)} className="btn-secondary">
            <Icon name="pencil" className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => toggleAdminUserStatus(user.uid)}
            className="btn-secondary"
          >
            <Icon name="shield" className="h-4 w-4" />
            {user.status === "active" ? "Disable" : "Enable"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="btn-danger"
          >
            <Icon name="trash" className="h-4 w-4" />
            Delete
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl">
            Listings
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
            <h3 className="text-base font-bold">No listings yet</h3>
            <p className="max-w-sm text-sm text-ink-muted">
              This user hasn&apos;t published any rooms.
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card sm:hidden">
              {listings.map((room) => (
                <li key={room.id}>
                  <Link
                    href={`/rooms/${room.id}`}
                    className="flex items-center gap-3 p-3 transition hover:bg-slate-50"
                  >
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {room.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={room.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon name={propertyIcon(room.type)} className="h-7 w-7 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{room.title}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {room.district ? `${room.district}, ` : ""}
                        {room.city}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-brand">
                        ${room.price}
                        <span className="ml-0.5 text-[11px] font-medium text-ink-muted">
                          / month
                        </span>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </>
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

      {confirmDelete ? (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-cardHover"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700">
                <Icon name="trash" className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold">Delete this user?</h3>
            </div>
            <p className="text-sm text-ink-muted">
              <b>{user.username}</b> will be removed from the user directory. Their listings stay
              but lose their owner link.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RolePill({ role }: { role: "admin" | "user" }) {
  if (role === "admin") {
    return (
      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
        Admin
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
      User
    </span>
  );
}

function StatusPill({ status }: { status: "active" | "disabled" }) {
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
