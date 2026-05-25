"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RoomCard from "@/components/RoomCard";
import Icon, { propertyIcon } from "@/components/Icon";
import ListingActionMenu from "@/components/ListingActionMenu";
import { signOut, updateLoginPhone } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { seedSampleListings, useLocalRooms } from "@/lib/local-rooms";
import { downscalePhoto } from "@/lib/image";
import {
  loadOverrides,
  saveOverrides,
  type ProfileOverrides
} from "@/lib/profile-overrides";
import { getAdminSettings } from "@/lib/admin";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import type { PropertyType } from "@/lib/types";

const PROPERTY_TYPE_CHOICES: { value: PropertyType; labelKey: string; hintKey: string }[] = [
  { value: "room", labelKey: "type.room", hintKey: "pick.type.room.hint" },
  { value: "apartment", labelKey: "type.apartment", hintKey: "pick.type.apartment.hint" },
  { value: "condo", labelKey: "type.condo", hintKey: "pick.type.condo.hint" },
  { value: "flat", labelKey: "type.flat", hintKey: "pick.type.flat.hint" },
  { value: "house", labelKey: "type.house", hintKey: "pick.type.house.hint" },
  { value: "villa", labelKey: "type.villa", hintKey: "pick.type.villa.hint" }
];

export default function ProfilePage() {
  const router = useRouter();
  const session = useSession();
  const t = useT();
  const allLocalRooms = useLocalRooms();
  const [overrides, setOverrides] = useState<ProfileOverrides>({});
  const [editing, setEditing] = useState<"profile" | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [pickTypeOpen, setPickTypeOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    setOverrides(loadOverrides(session.uid));
  }, [session]);

  useEffect(() => {
    if (session) seedSampleListings(session);
  }, [session]);

  const listings = useMemo(
    () => (session ? allLocalRooms.filter((r) => r.owner.id === session.uid) : []),
    [allLocalRooms, session]
  );

  if (!session) return null;

  const username = overrides.username ?? session.username ?? t("nav.profile");
  // Login phone is the auth identity — used to sign in. Contact info for
  // listings is now per-room, set during the create-room flow.
  const loginPhone = session.phoneNumber ?? "";
  const avatarUrl = overrides.avatarUrl;
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

        {/* Mobile: centered vertical layout */}
        <div className="flex flex-col items-center gap-3 text-center sm:hidden">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-brand/15 text-3xl font-bold text-brand ring-4 ring-brand/10">
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
          <h1 className="text-xl font-extrabold tracking-tight">{username}</h1>
          {loginPhone ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
              <Icon name="phone" className="h-4 w-4 text-brand" />
              {loginPhone}
            </p>
          ) : null}
        </div>

        {/* Desktop: horizontal layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-3xl font-bold text-brand ring-4 ring-brand/10">
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
              <h1 className="text-3xl font-extrabold tracking-tight">
                {username}
              </h1>
              {loginPhone ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
                  <Icon name="phone" className="h-4 w-4 text-brand" />
                  {loginPhone}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditing("profile")}
              className="btn-secondary"
            >
              <Icon name="pencil" className="h-4 w-4" />
              {t("profile.editProfile")}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="btn-danger"
            >
              <Icon name="log-out" className="h-4 w-4" />
              {signingOut ? t("profile.loggingOut") : t("profile.logOut")}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold sm:text-xl">
            {t("profile.myListings")}
            <span className="ml-2 rounded-full bg-brand/10 px-2.5 py-0.5 text-sm font-semibold text-brand">
              {listings.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={() => setPickTypeOpen(true)}
            className="btn-primary"
          >
            <Icon name="plus" className="h-4 w-4" />
            {t("profile.listARoom")}
          </button>
        </div>

        {listings.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Icon name="home" className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-bold">{t("profile.empty.title")}</h3>
            <p className="max-w-sm text-sm text-ink-muted">
              {t("profile.empty.body")}
            </p>
            <button
              type="button"
              onClick={() => setPickTypeOpen(true)}
              className="btn-primary mt-2"
            >
              {t("profile.empty.cta")}
            </button>
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
                            {t("profile.occupied")}
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
                          {t("profile.month")}
                        </span>
                      </p>
                    </div>
                  </Link>
                  <div className="absolute inset-y-0 right-2 flex items-center">
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
                      {t("profile.occupied")}
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
            saveOverrides(session.uid, merged);
            setOverrides(merged);
            setEditing(null);
            toast.success(t("toast.profile.updated"));
          }}
        />
      ) : null}

      <PropertyTypePicker
        open={pickTypeOpen}
        onClose={() => setPickTypeOpen(false)}
        onPick={(t) => {
          setPickTypeOpen(false);
          router.push(`/profile/list-room?type=${t}`);
        }}
      />
    </div>
  );
}

function PropertyTypePicker({
  open,
  onClose,
  onPick
}: {
  open: boolean;
  onClose: () => void;
  onPick: (type: PropertyType) => void;
}) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Hide property types the admin has disabled in Settings → Listing taxonomy.
  const active = new Set(getAdminSettings().activePropertyTypes);
  const choices = PROPERTY_TYPE_CHOICES.filter((p) => active.has(p.value));

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("pick.type.aria")}
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:max-h-[80vh] sm:max-w-md sm:rounded-3xl">
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
          <span aria-hidden />
          <h3 className="text-center text-base font-semibold text-ink">
            {t("pick.type.title")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">
          <ul className="grid grid-cols-2 gap-3">
            {choices.map((p) => (
              <li key={p.value}>
                <button
                  type="button"
                  onClick={() => onPick(p.value)}
                  className="flex h-full w-full flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand hover:bg-brand/5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon name={propertyIcon(p.value)} className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-bold text-ink">{t(p.labelKey)}</span>
                  <span className="text-xs leading-snug text-ink-muted">
                    {t(p.hintKey)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
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
  const t = useT();
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
      setPhotoError(t("profile.edit.photo.error.fileType"));
      return;
    }
    setUploading(true);
    setPhotoError(null);
    try {
      const dataUrl = await downscalePhoto(file, 320, 0.85);
      setAvatarUrl(dataUrl);
    } catch {
      setPhotoError(t("profile.edit.photo.error.load"));
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
      setError(err instanceof Error ? err.message : t("profile.edit.error.saveFailed"));
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
          <h3 className="text-lg font-bold">{t("profile.edit.title")}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
            aria-label={t("common.close")}
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
                  ? t("profile.edit.photo.loading")
                  : avatarUrl
                  ? t("profile.edit.photo.change")
                  : t("profile.edit.photo.upload")}
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  {t("common.remove")}
                </button>
              ) : null}
            </div>
            {photoError ? (
              <p className="text-xs text-red-700">{photoError}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="profile-username">
              {t("profile.edit.name")}
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
              {t("profile.edit.loginPhone")}
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
              {t("profile.edit.loginPhone.hint")}
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
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </form>
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
  const t = useT();
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
        aria-label={t("profile.menu.aria")}
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
            <Icon name="pencil" className="h-4 w-4 shrink-0" />
            {t("profile.editProfile")}
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
            <Icon name="log-out" className="h-4 w-4 shrink-0" />
            {signingOut ? t("profile.loggingOut") : t("profile.logOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
