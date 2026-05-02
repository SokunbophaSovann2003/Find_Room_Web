"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoomCard from "@/components/RoomCard";
import Icon from "@/components/Icon";
import { CURRENT_USER, myListings } from "@/lib/mock-data";
import { signOut } from "@/lib/auth";

const OVERRIDES_KEY = "findroom.profile-overrides";

interface ProfileOverrides {
  username?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

function loadOverrides(): ProfileOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as ProfileOverrides) : {};
  } catch {
    return {};
  }
}

function saveOverrides(o: ProfileOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
}

export default function ProfilePage() {
  const router = useRouter();
  const listings = myListings();
  const [overrides, setOverrides] = useState<ProfileOverrides>({});
  const [editing, setEditing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setOverrides(loadOverrides());
  }, []);

  const user = {
    ...CURRENT_USER,
    username: overrides.username ?? CURRENT_USER.username,
    phoneNumber: overrides.phoneNumber ?? CURRENT_USER.phoneNumber,
    avatarUrl: overrides.avatarUrl ?? CURRENT_USER.avatarUrl
  };

  const memberSinceLabel = new Date(user.memberSince).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" }
  );

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/explore");
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-4 ring-brand/10 sm:h-24 sm:w-24">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {user.username}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
                <Icon name="phone" className="h-4 w-4 text-brand" />
                {user.phoneNumber}
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-ink-muted">
                <Icon name="calendar" className="h-3.5 w-3.5 text-brand" />
                Joined {memberSinceLabel}
              </span>
            </div>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-secondary"
            >
              Edit profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="btn-ghost"
            >
              {signingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold sm:text-xl">
            My listings
            <span className="ml-2 rounded-full bg-brand/10 px-2.5 py-0.5 text-sm font-semibold text-brand">
              {listings.length}
            </span>
          </h2>
          <Link href="/profile/list-room" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            List a room
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Icon name="home" className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-bold">No listings yet</h3>
            <p className="max-w-sm text-sm text-ink-muted">
              Publish your first room to start receiving messages from renters.
            </p>
            <Link href="/profile/list-room" className="btn-primary mt-2">
              Create your first listing
            </Link>
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
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {room.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={room.images[0]}
                          alt={room.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {room.title}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {room.district ? `${room.district}, ` : ""}
                        {room.city}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-brand">
                        ${room.price}
                        <span className="ml-0.5 text-[11px] font-medium text-ink-muted">
                          / mo
                        </span>
                      </p>
                    </div>
                    <Icon name="arrow-right" className="h-4 w-4 shrink-0 text-ink-soft" />
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
        <EditProfileModal
          initial={{
            username: user.username,
            phoneNumber: user.phoneNumber,
            avatarUrl: user.avatarUrl ?? ""
          }}
          onCancel={() => setEditing(false)}
          onSave={(next) => {
            const merged: ProfileOverrides = {
              username: next.username,
              phoneNumber: next.phoneNumber,
              avatarUrl: next.avatarUrl || undefined
            };
            saveOverrides(merged);
            setOverrides(merged);
            setEditing(false);
          }}
        />
      ) : null}
    </div>
  );
}

function EditProfileModal({
  initial,
  onCancel,
  onSave
}: {
  initial: { username: string; phoneNumber: string; avatarUrl: string };
  onCancel: () => void;
  onSave: (next: { username: string; phoneNumber: string; avatarUrl: string }) => void;
}) {
  const [username, setUsername] = useState(initial.username);
  const [phoneNumber, setPhoneNumber] = useState(initial.phoneNumber);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !phoneNumber.trim()) return;
    onSave({
      username: username.trim(),
      phoneNumber: phoneNumber.trim(),
      avatarUrl: avatarUrl.trim()
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-cardHover sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Edit profile</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
            aria-label="Close"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="profile-username">
              Name
            </label>
            <input
              id="profile-username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-phone">
              Phone
            </label>
            <input
              id="profile-phone"
              className="input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-avatar">
              Avatar URL <span className="text-ink-soft">(optional)</span>
            </label>
            <input
              id="profile-avatar"
              className="input"
              placeholder="https://…"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
