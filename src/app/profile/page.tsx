"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RoomCard from "@/components/RoomCard";
import Icon from "@/components/Icon";
import { signOut } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { useLocalRooms } from "@/lib/local-rooms";
import { downscalePhoto } from "@/lib/image";

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
  const session = useSession();
  const allLocalRooms = useLocalRooms();
  const [overrides, setOverrides] = useState<ProfileOverrides>({});
  const [editing, setEditing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setOverrides(loadOverrides());
  }, []);

  const listings = useMemo(
    () => (session ? allLocalRooms.filter((r) => r.owner.id === session.uid) : []),
    [allLocalRooms, session]
  );

  if (!session) return null;

  const username = overrides.username ?? session.username ?? "FindRoom user";
  const phoneNumber = overrides.phoneNumber ?? session.phoneNumber ?? "";
  const avatarUrl = overrides.avatarUrl;
  const memberSinceLabel = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });
  const initial = username.trim().charAt(0).toUpperCase() || "?";

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
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-2xl font-bold text-brand ring-4 ring-brand/10 sm:h-24 sm:w-24 sm:text-3xl">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {username}
              </h1>
              {phoneNumber ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
                  <Icon name="phone" className="h-4 w-4 text-brand" />
                  {phoneNumber}
                </p>
              ) : null}
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
            username,
            phoneNumber,
            avatarUrl: avatarUrl ?? ""
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
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    setUploading(true);
    setPhotoError(null);
    try {
      const dataUrl = await downscalePhoto(file, 320, 0.85);
      setAvatarUrl(dataUrl);
    } catch {
      setPhotoError("Could not load that image.");
    } finally {
      setUploading(false);
    }
  }

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
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4"
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
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-24 w-24 overflow-hidden rounded-full bg-slate-100 ring-4 ring-brand/10">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand">
                  {(username.trim() || "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                {uploading
                  ? "Loading…"
                  : avatarUrl
                  ? "Change photo"
                  : "Upload photo"}
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  Remove
                </button>
              ) : null}
            </div>
            {photoError ? (
              <p className="text-xs text-red-700">{photoError}</p>
            ) : null}
          </div>
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
