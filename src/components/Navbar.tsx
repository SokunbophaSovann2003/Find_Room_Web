"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import AuthModal from "./AuthModal";
import LanguageToggle from "./LanguageToggle";
import PropertyTypePicker from "./PropertyTypePicker";
import { useSession } from "@/lib/session";
import { loadOverrides, subscribeOverrides } from "@/lib/profile-overrides";
import { useIsAdmin, useAdminNotifications, useUserNotifications } from "@/lib/admin";
import { setViewMode, useViewMode } from "@/lib/view-mode";
import { useT } from "@/lib/language";

const LIST_ROOM_PATH = "/profile/list-room";
// When the user navigates away from the create/edit room flow via the Navbar,
// we flag it so back buttons on the destination page can skip list-room in the
// history stack and send the user to /explore instead.
const FROM_LIST_ROOM_KEY = "findroom.nav-from-listroom";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const t = useT();
  const [authOpen, setAuthOpen] = useState(false);
  // When the user opens AuthModal via "List room" while logged out, we want
  // sign-in success to drop them on the list-room screen — not just close the
  // modal. `authNext` carries that intent. null = plain Log in (just close).
  const [authNext, setAuthNext] = useState<string | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [overrideUsername, setOverrideUsername] = useState<string | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!session) {
      setAvatarUrl(undefined);
      setOverrideUsername(undefined);
      return;
    }
    const uid = session.uid;
    const sync = () => {
      const o = loadOverrides(uid);
      setAvatarUrl(o.avatarUrl || undefined);
      setOverrideUsername(o.username || undefined);
    };
    sync();
    return subscribeOverrides(uid, sync);
  }, [session]);
  const displayName = overrideUsername ?? session?.username ?? session?.phoneNumber ?? "";
  const initial = displayName.trim().replace(/^\+/, "").charAt(0).toUpperCase();

  function handleListRoom() {
    if (session) {
      setTypePickerOpen(true);
    } else {
      setAuthNext(LIST_ROOM_PATH);
      setAuthOpen(true);
    }
  }

  // onAdmin drives header chrome (admin pill, hide "List room"). Path always
  // wins inside /user/admin/*, otherwise the sticky viewMode preference lets
  // an admin keep their admin context on shared routes like /rooms/[id].
  const viewMode = useViewMode();
  const { admin: isAdminUser } = useIsAdmin(session);
  const pathOnAdmin = pathname?.startsWith("/user/admin") ?? false;
  const onAdmin = pathOnAdmin || (viewMode === "admin" && isAdminUser);

  return (
    <>
      <header className="sticky top-0 z-[1050] border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
          <Link href={onAdmin ? "/user/admin" : "/explore"} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
              <Icon name="home" className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Joul<span className="text-brand">.KH</span>
            </span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo affordance: hop between User and Admin views without logging out. */}
            <ViewSwitch onAdmin={onAdmin} />

            {/* Notifications bell — user bell in user view, admin bell in admin view. */}
            {session && (onAdmin ? <AdminNotificationBell /> : <NotificationBell />)}

            {/* Always visible: language toggle. */}
            <LanguageToggle />

            {session ? (
              // Desktop-only: on mobile the bottom-nav Profile tab handles this.
              <Link
                href="/profile"
                aria-label={t("nav.profile")}
                onClick={() => {
                  if (pathname === LIST_ROOM_PATH)
                    sessionStorage.setItem(FROM_LIST_ROOM_KEY, "1");
                }}
                className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 transition hover:ring-2 hover:ring-brand/30 sm:block"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={session.username ?? t("nav.profile")}
                    className="h-full w-full object-cover"
                  />
                ) : initial ? (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-brand">
                    {initial}
                  </span>
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-ink-muted">
                    <Icon name="user" className="h-5 w-5" />
                  </span>
                )}
              </Link>
            ) : (
              // Desktop-only: on mobile the bottom-nav Profile tab opens AuthModal.
              <button
                type="button"
                onClick={() => {
                  setAuthNext(null);
                  setAuthOpen(true);
                }}
                className="btn-primary inline-flex px-4 py-2 text-sm"
              >
                {t("nav.logIn")}
              </button>
            )}

            {/* Desktop-only: on mobile the bottom nav owns this action. Sits
                last so it reads as the primary call-to-action after the user's
                identity affordances. */}
            {onAdmin || pathname === LIST_ROOM_PATH ? null : (
              <button
                type="button"
                onClick={handleListRoom}
                className="hidden h-10 shrink-0 items-center gap-1.5 rounded-full border border-brand bg-white px-4 text-sm font-semibold text-brand transition hover:bg-brand/5 sm:inline-flex"
              >
                <Icon name="plus" className="h-4 w-4" />
                {t("nav.listRoom")}
              </button>
            )}
          </div>
        </nav>
      </header>

      <AuthModal
        open={authOpen}
        dismissible
        onClose={() => {
          setAuthOpen(false);
          setAuthNext(null);
        }}
        onSuccess={() => {
          setAuthOpen(false);
          const next = authNext;
          setAuthNext(null);
          if (next) {
            setTypePickerOpen(true);
          } else {
            router.push("/profile");
          }
        }}
      />

      <PropertyTypePicker
        open={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        onPick={(type) => {
          setTypePickerOpen(false);
          router.push(`${LIST_ROOM_PATH}?type=${type}`);
        }}
      />
    </>
  );
}

function NotificationBell() {
  const session = useSession();
  const notifications = useUserNotifications(session);
  const unread = notifications.filter((n) => !n.read).length;
  const t = useT();
  const pathname = usePathname();
  return (
    <Link
      href="/profile/notifications"
      aria-label={
        unread > 0
          ? t("nav.notifications.ariaWithCount", { n: unread })
          : t("nav.notifications.aria")
      }
      onClick={() => {
        if (pathname === LIST_ROOM_PATH)
          sessionStorage.setItem(FROM_LIST_ROOM_KEY, "1");
      }}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center text-ink-muted transition hover:text-ink"
    >
      <Icon name="bell" className="h-6 w-6" />
      {unread > 0 ? (
        <span className="absolute right-0 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

function AdminNotificationBell() {
  const notifications = useAdminNotifications();
  const unread = notifications.filter((n: { read: boolean }) => !n.read).length;
  const t = useT();
  return (
    <Link
      href="/user/admin/notifications/incoming"
      aria-label={
        unread > 0
          ? t("nav.notifications.ariaWithCount", { n: unread })
          : t("nav.notifications.aria")
      }
      className="relative flex h-10 w-10 shrink-0 items-center justify-center text-ink-muted transition hover:text-ink"
    >
      <Icon name="bell" className="h-6 w-6" />
      {unread > 0 ? (
        <span className="absolute right-0 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

function ViewSwitch({ onAdmin }: { onAdmin: boolean }) {
  const router = useRouter();
  const session = useSession();
  const t = useT();
  const { admin: isAdminUser } = useIsAdmin(session);

  if (!isAdminUser) return null;

  function toggle() {
    if (onAdmin) {
      setViewMode("user");
      router.push("/explore");
    } else {
      setViewMode("admin");
      router.push("/user/admin");
    }
  }

  const currentLabel = onAdmin ? t("nav.view.admin") : t("nav.view.user");
  const nextLabel = onAdmin ? t("nav.view.user") : t("nav.view.admin");

  return (
    <button
      type="button"
      onClick={toggle}
      title={t("nav.view.toggle.title", { current: currentLabel, next: nextLabel })}
      aria-label={t("nav.view.toggle.aria", { current: currentLabel, next: nextLabel })}
      aria-pressed={onAdmin}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm transition hover:ring-2 hover:ring-brand/30 ${
        onAdmin
          ? "border-brand bg-brand text-white"
          : "border-slate-200 bg-white text-ink-muted"
      }`}
    >
      <Icon name={onAdmin ? "shield" : "user"} className="h-4 w-4" />
    </button>
  );
}

