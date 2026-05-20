"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import AuthModal from "./AuthModal";
import LanguageToggle from "./LanguageToggle";
import { useSession } from "@/lib/session";
import { loadOverrides, subscribeOverrides } from "@/lib/profile-overrides";

const LIST_ROOM_PATH = "/profile/list-room";

export default function Navbar() {
  const router = useRouter();
  const session = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  // When the user opens AuthModal via "List room" while logged out, we want
  // sign-in success to drop them on the list-room screen — not just close the
  // modal. `authNext` carries that intent. null = plain Log in (just close).
  const [authNext, setAuthNext] = useState<string | null>(null);
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
      router.push(LIST_ROOM_PATH);
    } else {
      setAuthNext(LIST_ROOM_PATH);
      setAuthOpen(true);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-[1050] border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
          <Link href="/explore" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
              <Icon name="home" className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              FindRoom<span className="text-brand">.KH</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop-only: on mobile the bottom nav owns this action. */}
            <button
              type="button"
              onClick={handleListRoom}
              className="hidden h-10 shrink-0 items-center gap-1.5 rounded-full border border-brand bg-white px-4 text-sm font-semibold text-brand transition hover:bg-brand/5 sm:inline-flex"
            >
              <Icon name="plus" className="h-4 w-4" />
              List room
            </button>

            {/* Always visible: language toggle. */}
            <LanguageToggle />

            {session ? (
              // Desktop-only: on mobile the bottom-nav Profile tab handles this.
              <Link
                href="/profile"
                aria-label="Your profile"
                className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 transition hover:ring-2 hover:ring-brand/30 sm:block"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={session.username ?? "Profile"}
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
                className="btn-primary hidden px-4 py-2 text-sm sm:inline-flex"
              >
                Log in
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
          if (next) router.push(next);
        }}
      />
    </>
  );
}
