"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RoomCard from "@/components/RoomCard";
import Icon, { propertyIcon } from "@/components/Icon";
import ListingActionMenu from "@/components/ListingActionMenu";
import { signOut, updateLoginPhone } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { useLocalRooms } from "@/lib/local-rooms";
import { downscalePhoto } from "@/lib/image";
import {
  loadOverrides,
  saveOverrides,
  type ProfileOverrides
} from "@/lib/profile-overrides";

export default function ProfilePage() {
  const router = useRouter();
  const session = useSession();
  const allLocalRooms = useLocalRooms();
  const [overrides, setOverrides] = useState<ProfileOverrides>({});
  const [editing, setEditing] = useState<"profile" | "contact" | null>(null);
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
  // Login phone is the auth identity — comes from session and is not part
  // of the public contact info.
  const loginPhone = session.phoneNumber ?? "";
  // Public contact channels are fully independent. Whatever is saved is
  // shown; the empty array means "no contacts" (no auto-fallback).
  const contactPhones = overrides.contactPhones ?? [];
  const telegramPhones = overrides.telegramPhones ?? [];
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
      <section className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="absolute right-3 top-3 sm:hidden">
          <ProfileActionsMenu
            onEdit={() => setEditing("profile")}
            onLogout={handleLogout}
            signingOut={signingOut}
          />
        </div>
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
              {loginPhone ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
                  <Icon name="phone" className="h-4 w-4 text-brand" />
                  {loginPhone}
                </p>
              ) : null}
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-ink-muted">
                <Icon name="calendar" className="h-3.5 w-3.5 text-brand" />
                Joined {memberSinceLabel}
              </span>
            </div>
          </div>
          <div className="hidden gap-2 sm:flex sm:shrink-0">
            <button
              type="button"
              onClick={() => setEditing("profile")}
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

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold sm:text-lg">Contact info</h2>
          <button
            type="button"
            onClick={() => setEditing("contact")}
            className="btn-primary"
          >
            <Icon name="pencil" className="h-4 w-4" />
            Edit
          </button>
        </div>
        <p className="mb-3 text-xs text-ink-soft">
          This is how renters reach you on your listings — separate from your
          login phone.
        </p>
        <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          {contactPhones.length > 0 ? (
            contactPhones.map((p) => (
              <ContactInfoRow
                key={`tel-${p}`}
                icon="phone"
                label="Phone"
                value={p}
                href={`tel:${p.replace(/\s/g, "")}`}
              />
            ))
          ) : (
            <ContactInfoRow
              icon="phone"
              label="Phone"
              value="Not set"
              muted
            />
          )}
          {telegramPhones.length > 0 ? (
            telegramPhones.map((t) => {
              const handle = `+${t.replace(/\D/g, "")}`;
              return (
                <ContactInfoRow
                  key={`tg-${t}`}
                  icon="telegram"
                  label="Telegram"
                  value={t}
                  href={`https://t.me/${handle}`}
                />
              );
            })
          ) : (
            <ContactInfoRow
              icon="telegram"
              label="Telegram"
              value="Not set"
              muted
            />
          )}
        </ul>
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
                <li key={room.id} className="relative">
                  <Link
                    href={`/rooms/${room.id}`}
                    className="flex items-center gap-3 p-3 pr-12 transition hover:bg-slate-50"
                  >
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {room.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={room.images[0]}
                          alt={room.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon
                          name={propertyIcon(room.type)}
                          className="h-7 w-7 text-slate-300"
                          strokeWidth={1.4}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-ink">
                          {room.title}
                        </span>
                        {room.isOccupied ? (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Occupied
                          </span>
                        ) : null}
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
                  </Link>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <ListingActionMenu room={room} />
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((room) => (
                <div key={room.id} className="relative">
                  <RoomCard room={room} />
                  {room.isOccupied ? (
                    <span className="pointer-events-none absolute left-3 top-12 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow">
                      Occupied
                    </span>
                  ) : null}
                  <div className="absolute right-2 top-2">
                    <ListingActionMenu room={room} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {editing === "profile" ? (
        <EditProfileModal
          initial={{
            username,
            loginPhone,
            avatarUrl: avatarUrl ?? ""
          }}
          onCancel={() => setEditing(null)}
          onSave={async (next) => {
            // Update the login phone first — this can fail (e.g. Firebase
            // requires recent login) and we want to surface the error in
            // the modal before persisting other fields.
            if (next.loginPhone !== loginPhone) {
              await updateLoginPhone(next.loginPhone);
            }
            const merged: ProfileOverrides = {
              ...overrides,
              username: next.username,
              avatarUrl: next.avatarUrl || undefined
            };
            saveOverrides(merged);
            setOverrides(merged);
            setEditing(null);
          }}
        />
      ) : null}

      {editing === "contact" ? (
        <EditContactModal
          initial={{
            contactPhones: overrides.contactPhones ?? [],
            telegramPhones: overrides.telegramPhones ?? []
          }}
          onCancel={() => setEditing(null)}
          onSave={(next) => {
            // Preserve empty arrays — they mean "explicitly cleared", not
            // "never set". Only `undefined` triggers the first-time seed.
            const merged: ProfileOverrides = {
              ...overrides,
              contactPhones: next.contactPhones,
              telegramPhones: next.telegramPhones
            };
            saveOverrides(merged);
            setOverrides(merged);
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ContactInfoRow({
  icon,
  label,
  value,
  href,
  muted = false
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  value: string;
  href?: string;
  muted?: boolean;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</p>
        <p
          className={`truncate text-sm font-semibold ${
            muted ? "text-ink-muted" : "text-ink"
          }`}
        >
          {value}
        </p>
      </div>
    </>
  );
  return (
    <li>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
          className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 transition hover:border-brand hover:bg-brand/5"
        >
          {inner}
        </a>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 px-3 py-2">
          {inner}
        </div>
      )}
    </li>
  );
}

function EditProfileModal({
  initial,
  onCancel,
  onSave
}: {
  initial: {
    username: string;
    loginPhone: string;
    avatarUrl: string;
  };
  onCancel: () => void;
  onSave: (next: {
    username: string;
    loginPhone: string;
    avatarUrl: string;
  }) => Promise<void> | void;
}) {
  const [username, setUsername] = useState(initial.username);
  const [loginPhone, setLoginPhone] = useState(initial.loginPhone);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!username.trim() || !loginPhone.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await onSave({
        username: username.trim(),
        loginPhone: loginPhone.trim(),
        avatarUrl: avatarUrl.trim()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
      setSaving(false);
    }
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
            <label className="label" htmlFor="profile-login-phone">
              Login phone
            </label>
            <input
              id="profile-login-phone"
              className="input"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              placeholder="+855 12 345 678"
              inputMode="tel"
              required
            />
            <p className="mt-1 text-[11px] text-ink-soft">
              You sign in with this number. Changing it doesn&rsquo;t affect
              the contact info you publish on listings.
            </p>
          </div>
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditContactModal({
  initial,
  onCancel,
  onSave
}: {
  initial: { contactPhones: string[]; telegramPhones: string[] };
  onCancel: () => void;
  onSave: (next: { contactPhones: string[]; telegramPhones: string[] }) => void;
}) {
  const [phones, setPhones] = useState<string[]>(
    initial.contactPhones.length ? initial.contactPhones : [""]
  );
  const [telegrams, setTelegrams] = useState<string[]>(
    initial.telegramPhones.length ? initial.telegramPhones : [""]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      contactPhones: phones.map((p) => p.trim()).filter(Boolean),
      telegramPhones: telegrams.map((t) => t.trim()).filter(Boolean)
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
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-cardHover"
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
          <h3 className="text-lg font-bold">Edit contact info</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
            aria-label="Close"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
          <p className="mb-4 text-xs text-ink-soft">
            Renters see these on your listings. They&rsquo;re independent of
            your login phone — clear them to publish nothing.
          </p>

          <ContactListEditor
            label="Phone numbers"
            iconName="phone"
            placeholder="+855 12 345 678"
            values={phones}
            onChange={setPhones}
            addLabel="Add phone"
          />

          <div className="mt-5">
            <ContactListEditor
              label="Telegram phones"
              iconName="telegram"
              placeholder="+855 12 345 678"
              values={telegrams}
              onChange={setTelegrams}
              addLabel="Add Telegram"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 sm:px-6">
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

function ContactListEditor({
  label,
  iconName,
  placeholder,
  values,
  onChange,
  addLabel,
  emptyHint
}: {
  label: string;
  iconName: React.ComponentProps<typeof Icon>["name"];
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  emptyHint?: string;
}) {
  function update(i: number, val: string) {
    onChange(values.map((v, idx) => (idx === i ? val : v)));
  }
  function remove(i: number) {
    const next = values.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [""]);
  }
  function add() {
    onChange([...values, ""]);
  }
  return (
    <div>
      <span className="label flex items-center gap-1.5">
        <Icon name={iconName} className="h-4 w-4 text-brand" />
        {label}
      </span>
      <ul className="space-y-2">
        {values.map((v, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              className="input flex-1"
              value={v}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              inputMode="tel"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-slate-100 hover:text-ink"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand"
      >
        <Icon name="plus" className="h-3.5 w-3.5" />
        {addLabel}
      </button>
      {emptyHint ? (
        <p className="mt-1 text-[11px] text-ink-soft">{emptyHint}</p>
      ) : null}
    </div>
  );
}

function ProfileActionsMenu({
  onEdit,
  onLogout,
  signingOut
}: {
  onEdit: () => void;
  onLogout: () => void;
  signingOut: boolean;
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

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((cur) => !cur)}
        aria-label="Profile options"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-slate-100 hover:text-ink"
      >
        <Icon name="more-vertical" className="h-5 w-5" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-cardHover"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-slate-50"
          >
            <Icon name="user" className="h-4 w-4 shrink-0" />
            Edit profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Icon name="arrow-right" className="h-4 w-4 shrink-0" />
            {signingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
