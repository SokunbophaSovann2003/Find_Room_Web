"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RoomCard from "@/components/RoomCard";
import Icon, { propertyIcon } from "@/components/Icon";
import ListingActionMenu from "@/components/ListingActionMenu";
import LoadMoreSentinel from "@/components/admin/LoadMoreSentinel";
import { signOut, updateLoginPhone } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { seedSampleListings, updateRoom, useRooms } from "@/lib/rooms";
import { isFirebaseConfigured } from "@/lib/firebase";
import { downscalePhoto } from "@/lib/image";
import {
  loadOverrides,
  saveOverrides,
  type ProfileOverrides
} from "@/lib/profile-overrides";
import { getAdminSettings, useAdminSettings } from "@/lib/admin";
import { isAutoOccupied, daysSinceActivity } from "@/lib/auto-occupy";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import { copyToClipboard } from "@/lib/clipboard";
import type { PropertyType, Room } from "@/lib/types";
import PropertyTypePicker from "@/components/PropertyTypePicker";

const LISTINGS_PAGE_SIZE = 20;

export default function ProfilePage() {
  const router = useRouter();
  const session = useSession();
  const t = useT();
  const allLocalRooms = useRooms();
  const { autoOccupyDays } = useAdminSettings();
  const [overrides, setOverrides] = useState<ProfileOverrides>({});
  const [editing, setEditing] = useState<"profile" | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [pickTypeOpen, setPickTypeOpen] = useState(false);
  const [listingsView, setListingsView] = useState<"grid" | "list">("grid");
  const [listingsVisible, setListingsVisible] = useState(LISTINGS_PAGE_SIZE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("findroom.profile.listings-view");
    if (saved === "list" || saved === "grid") setListingsView(saved);
  }, []);

  function changeListingsView(next: "grid" | "list") {
    setListingsView(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("findroom.profile.listings-view", next);
    }
  }

  useEffect(() => {
    if (!session) return;
    setOverrides(loadOverrides(session.uid));
  }, [session]);

  useEffect(() => {
    if (session && !isFirebaseConfigured) seedSampleListings(session);
  }, [session]);

  const listings = useMemo(
    () => (session ? allLocalRooms.filter((r) => r.owner.id === session.uid) : []),
    [allLocalRooms, session]
  );

  // Reset the infinite-scroll window when the owner changes; reveal more on
  // scroll. All three listing views (mobile list, desktop grid, desktop table)
  // share this window since only one is visible per breakpoint.
  useEffect(() => {
    setListingsVisible(LISTINGS_PAGE_SIZE);
  }, [session?.uid]);
  const shownListings = listings.slice(0, listingsVisible);

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

  async function handleShareProfile() {
    if (!session) return;
    const url = `${window.location.origin}/users/${session.uid}`;
    const title = t("profile.share.title", { name: username });
    const text = t("profile.share.text", { name: username });
    // Copy/paste payload: description on one line, blank line, then the
    // URL. Chat apps (Telegram, Messages, WhatsApp) auto-linkify the URL
    // when it sits on its own line so the recipient gets context plus a
    // clickable link instead of a bare URL with no explanation.
    const pasteable = `${text}\n\n${url}`;
    const shareData = { title, text, url };
    // Mobile + secure-context browsers: native share sheet (Telegram, Messages,
    // etc.). canShare check avoids a runtime error in browsers that expose
    // navigator.share but reject our payload (e.g. desktop Firefox).
    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      (!navigator.canShare || navigator.canShare(shareData))
    ) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User dismissed the share sheet — don't fall back to clipboard,
        // they explicitly cancelled.
        if (err instanceof Error && err.name === "AbortError") return;
        // Any other error (permissions, etc.) → fall through to clipboard.
      }
    }
    if (await copyToClipboard(pasteable)) {
      toast.success(t("toast.profile.messageCopied"));
    } else {
      toast.error(t("toast.profile.shareFailed"));
    }
  }

  function handleBack() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("findroom.nav-from-listroom");
    }
    router.push("/explore");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <button
        type="button"
        onClick={handleBack}
        style={{ touchAction: "manipulation" }}
        className="mb-3 -ml-2 inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-ink-muted transition hover:bg-slate-100 hover:text-brand active:scale-[0.98]"
        aria-label={t("common.back")}
      >
        <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
        {t("common.back")}
      </button>

      <section className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="absolute right-3 top-3 sm:hidden">
          <ProfileActionsMenu
            onEdit={() => setEditing("profile")}
            onShare={handleShareProfile}
            onLogout={() => setConfirmLogout(true)}
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
              onClick={handleShareProfile}
              className="btn-secondary"
            >
              <Icon name="share" className="h-4 w-4" />
              {t("profile.share")}
            </button>
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
              onClick={() => setConfirmLogout(true)}
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
          <div className="flex items-center gap-3">
            {listings.length > 0 ? (
              <div
                role="tablist"
                aria-label={t("profile.myListings")}
                className="hidden gap-1 self-stretch rounded-full border border-slate-200 bg-white p-1 sm:flex"
              >
                <ListingsViewTab
                  active={listingsView === "grid"}
                  onClick={() => changeListingsView("grid")}
                  icon="grid"
                  label={t("profile.view.grid")}
                />
                <ListingsViewTab
                  active={listingsView === "list"}
                  onClick={() => changeListingsView("list")}
                  icon="list"
                  label={t("profile.view.list")}
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setPickTypeOpen(true)}
              className="btn-primary"
            >
              <Icon name="plus" className="h-4 w-4" />
              {t("profile.listARoom")}
            </button>
          </div>
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
              {shownListings.map((room) => {
                const autoOccupied = isAutoOccupied(room, autoOccupyDays);
                const days = daysSinceActivity(room);
                return (
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
                        <span className="line-clamp-2 text-sm font-semibold text-ink">
                          {room.title}
                        </span>
                        <p className="truncate text-xs text-ink-muted">
                          {room.district ? `${room.district}, ` : ""}
                          {room.city}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="text-sm font-bold text-brand">
                            ${room.price}
                            <span className="ml-0.5 text-[11px] font-medium text-ink-muted">
                              {t("profile.month")}
                            </span>
                          </p>
                          {room.status === "pending" ? (
                            <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                              {t("listing.status.pending")}
                            </span>
                          ) : room.status === "rejected" ? (
                            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                              {t("listing.status.rejected")}
                            </span>
                          ) : room.isOccupied || autoOccupied ? (
                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              {t("profile.occupied")}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                    <ListingStatusBanner
                      room={room}
                      pendingClass="flex items-center gap-3 border-t border-sky-100 bg-sky-50 px-3 py-2 pr-12"
                      rejectedClass="flex items-center justify-between gap-3 border-t border-red-100 bg-red-50 px-3 py-2 pr-12"
                    />
                    {autoOccupied ? (
                      <div className="flex items-center justify-between gap-3 border-t border-amber-100 bg-amber-50 px-3 py-2 pr-12">
                        <p className="text-[11px] leading-snug text-amber-700">
                          {t("profile.autoOccupied.note", { days: String(days) })}
                        </p>
                        <button
                          type="button"
                          onClick={() => void updateRoom(room.id, { isOccupied: false, lastActivityAt: Date.now() })}
                          className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-brand/90"
                        >
                          {t("profile.autoOccupied.markAvailable")}
                        </button>
                      </div>
                    ) : null}
                    <div className="absolute right-2 top-4 flex items-center">
                      <ListingActionMenu room={room} />
                    </div>
                  </li>
                );
              })}
            </ul>

            {listingsView === "grid" ? (
              <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {shownListings.map((room) => {
                  const autoOccupied = isAutoOccupied(room, autoOccupyDays);
                  const days = daysSinceActivity(room);
                  return (
                    <div key={room.id} className="relative flex flex-col">
                      <RoomCard room={room} />
                      {room.status === "pending" ? (
                        <span className="pointer-events-none absolute left-3 top-12 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700 shadow">
                          {t("listing.status.pending")}
                        </span>
                      ) : room.status === "rejected" ? (
                        <span className="pointer-events-none absolute left-3 top-12 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 shadow">
                          {t("listing.status.rejected")}
                        </span>
                      ) : room.isOccupied || autoOccupied ? (
                        <span className="pointer-events-none absolute left-3 top-12 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow">
                          {t("profile.occupied")}
                        </span>
                      ) : null}
                      <div className="absolute right-2 top-2">
                        <ListingActionMenu room={room} />
                      </div>
                      <ListingStatusBanner
                        room={room}
                        pendingClass="mt-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5"
                        rejectedClass="mt-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5"
                      />
                      {autoOccupied ? (
                        <div className="mt-2 flex items-start justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                          <p className="text-[11px] leading-snug text-amber-700">
                            {t("profile.autoOccupied.note", { days: String(days) })}
                          </p>
                          <button
                            type="button"
                            onClick={() => void updateRoom(room.id, { isOccupied: false, lastActivityAt: Date.now() })}
                            className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-brand/90"
                          >
                            {t("profile.autoOccupied.markAvailable")}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card sm:block">
                <div className="grid grid-cols-[88px_minmax(0,2.5fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-4 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-ink-muted">
                  <span aria-hidden />
                  <span>{t("profile.list.col.title")}</span>
                  <span>{t("profile.list.col.status")}</span>
                  <span>{t("profile.list.col.type")}</span>
                  <span>{t("profile.list.col.details")}</span>
                  <span className="text-right">{t("profile.list.col.price")}</span>
                  <span aria-hidden />
                </div>
                <ul className="divide-y divide-slate-100">
                  {shownListings.map((room) => {
                    const autoOccupied = isAutoOccupied(room, autoOccupyDays);
                    const days = daysSinceActivity(room);
                    return (
                      <li
                        key={room.id}
                        className="relative has-[[aria-expanded='true']]:z-30"
                      >
                        <Link
                          href={`/rooms/${room.id}`}
                          className="grid grid-cols-[88px_minmax(0,2.5fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-4 px-4 py-3 transition hover:bg-slate-50"
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
                          <div className="min-w-0">
                            <span className="truncate text-sm font-semibold text-ink">
                              {room.title}
                            </span>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-muted">
                              <Icon name="map-pin" className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {room.district ? `${room.district}, ` : ""}
                                {room.city}
                              </span>
                            </p>
                          </div>
                          <div>
                            {room.status === "pending" ? (
                              <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                {t("listing.status.pending")}
                              </span>
                            ) : room.status === "rejected" ? (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">
                                {t("listing.status.rejected")}
                              </span>
                            ) : room.isOccupied || autoOccupied ? (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                {t("profile.occupied")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                {t("profile.available")}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-ink-muted">
                            {t(`type.${room.type}`)}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-ink-muted">
                            <span className="inline-flex items-center gap-1">
                              <Icon name="bed" className="h-3.5 w-3.5" /> {room.bedrooms}
                            </span>
                            {room.areaSqm ? (
                              <span className="inline-flex items-center gap-1">
                                <Icon name="ruler" className="h-3.5 w-3.5" /> {room.areaSqm}m²
                              </span>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-brand">${room.price}</span>
                            <span className="ml-0.5 text-xs text-ink-muted">
                              {t("profile.month")}
                            </span>
                          </div>
                          <span aria-hidden />
                        </Link>
                        <ListingStatusBanner
                          room={room}
                          pendingClass="flex items-center gap-3 border-t border-sky-100 bg-sky-50 px-4 py-2"
                          rejectedClass="flex items-center gap-3 border-t border-red-100 bg-red-50 px-4 py-2"
                        />
                        {autoOccupied ? (
                          <div className="flex items-center justify-between gap-3 border-t border-amber-100 bg-amber-50 px-4 py-2">
                            <p className="text-[11px] text-amber-700">
                              {t("profile.autoOccupied.note", { days: String(days) })}
                            </p>
                            <button
                              type="button"
                              onClick={() => void updateRoom(room.id, { isOccupied: false, lastActivityAt: Date.now() })}
                              className="shrink-0 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-brand/90"
                            >
                              {t("profile.autoOccupied.markAvailable")}
                            </button>
                          </div>
                        ) : null}
                        <div className="absolute right-3 top-4">
                          <ListingActionMenu room={room} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <LoadMoreSentinel
              hasMore={listingsVisible < listings.length}
              onLoadMore={() => setListingsVisible((c) => c + LISTINGS_PAGE_SIZE)}
            />
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
            if (!saveOverrides(session.uid, merged)) {
              // Storage full (often a large avatar) — the toast is already
              // shown; keep the modal open so they can retry or pick a smaller image.
              return;
            }
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

      {confirmLogout ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-base font-bold text-ink">{t("profile.logOut.confirm.title")}</h2>
            <p className="text-sm text-ink-muted">{t("profile.logOut.confirm.body")}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmLogout(false)}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={signingOut}
                onClick={() => { setConfirmLogout(false); void handleLogout(); }}
              >
                <Icon name="log-out" className="h-4 w-4" />
                {signingOut ? t("profile.loggingOut") : t("profile.logOut.confirm.cta")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ListingsViewTab({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: "grid" | "list";
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-brand text-white shadow" : "text-ink-muted hover:text-ink"
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </button>
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
      const code = (err as { code?: string }).code ?? "";
      let key: string;
      if (code === "auth/requires-recent-login") key = "auth.error.requiresRecentLogin";
      else if (code === "auth/email-already-in-use") key = "auth.error.phoneInUse";
      else if (code === "auth/operation-not-allowed") key = "auth.error.operationNotAllowed";
      else if (code === "auth/too-many-requests") key = "auth.error.tooManyRequests";
      else key = err instanceof Error ? err.message : "profile.edit.error.saveFailed";
      setError(t(key));
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
  onShare,
  onLogout,
  signingOut
}: {
  onEdit: () => void;
  onShare: () => void;
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
              onShare();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-slate-50"
          >
            <Icon name="share" className="h-4 w-4 shrink-0" />
            {t("profile.share")}
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

function ListingStatusBanner({
  room,
  pendingClass,
  rejectedClass,
}: {
  room: Room;
  pendingClass: string;
  rejectedClass: string;
}) {
  const t = useT();
  if (room.status === "pending") {
    return (
      <div className={pendingClass}>
        <p className="text-[11px] leading-snug text-sky-700">{t("profile.listing.pendingNote")}</p>
      </div>
    );
  }
  if (room.status === "rejected") {
    return (
      <div className={rejectedClass}>
        <p className="text-[11px] leading-snug text-red-600">
          {room.rejectionReason
            ? t("profile.listing.rejectedNote", { reason: room.rejectionReason })
            : t("profile.listing.rejectedNoteNoReason")}
        </p>
      </div>
    );
  }
  return null;
}
