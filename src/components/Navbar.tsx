"use client";

import Link from "next/link";
import Icon from "./Icon";
import { CURRENT_USER } from "@/lib/mock-data";

export default function Navbar() {
  const user = CURRENT_USER;

  return (
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

        <Link
          href="/profile"
          aria-label="Your profile"
          className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 transition hover:ring-2 hover:ring-brand/30"
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-ink-muted">
              <Icon name="user" className="h-5 w-5" />
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
