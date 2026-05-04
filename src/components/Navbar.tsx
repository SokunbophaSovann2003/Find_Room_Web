"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";
import AuthModal from "./AuthModal";
import { useSession } from "@/lib/session";

const PROFILE_OVERRIDES_KEY = "findroom.profile-overrides";

function readAvatar(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(PROFILE_OVERRIDES_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { avatarUrl?: string };
    return parsed.avatarUrl || undefined;
  } catch {
    return undefined;
  }
}

export default function Navbar() {
  const session = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const avatarUrl = session ? readAvatar() : undefined;
  const initial = (session?.username ?? session?.phoneNumber ?? "").trim().charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
          <Link href="/explore" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
              <Icon name="home" className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              FindRoom<span className="text-brand">.KH</span>
            </span>
          </Link>

          {session ? (
            <Link
              href="/profile"
              aria-label="Your profile"
              className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 transition hover:ring-2 hover:ring-brand/30"
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
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="btn-primary px-4 py-2 text-sm"
            >
              Log in
            </button>
          )}
        </nav>
      </header>

      <AuthModal
        open={authOpen}
        dismissible
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />
    </>
  );
}
