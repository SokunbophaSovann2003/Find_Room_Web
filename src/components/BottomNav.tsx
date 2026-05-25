"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";
import AuthModal from "./AuthModal";
import { useSession } from "@/lib/session";
import { useKeyboardOpen } from "@/lib/use-keyboard-open";
import { isAdmin } from "@/lib/admin";
import { useViewMode } from "@/lib/view-mode";
import { useT } from "@/lib/language";

const LIST_ROOM_PATH = "/profile/list-room";

// Hide the bottom nav on screens that already host their own mobile-fixed
// action bar — otherwise the two stack and clip each other.
function shouldHide(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === LIST_ROOM_PATH) return true; // Publish bar
  if (pathname.startsWith("/rooms/")) return true; // Contact bar
  if (pathname.startsWith("/user/admin")) return true; // Admin owns its own nav
  return false;
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  // When an unauthenticated user taps the FAB or Profile, remember where to
  // send them after sign-in so the action they tried isn't lost.
  const [authNext, setAuthNext] = useState<string | null>(null);
  const keyboardOpen = useKeyboardOpen();
  const viewMode = useViewMode();
  const t = useT();

  if (shouldHide(pathname)) return null;
  // Don't stack with the admin floating nav when the signed-in admin is in
  // "Admin" view mode — the AdminFloatingNav owns the bottom slot there.
  if (viewMode === "admin" && isAdmin(session)) return null;

  const onHome = pathname === "/" || pathname?.startsWith("/explore");
  const onProfile = pathname === "/profile";

  function handleListRoom() {
    if (session) {
      router.push(LIST_ROOM_PATH);
    } else {
      setAuthNext(LIST_ROOM_PATH);
      setAuthOpen(true);
    }
  }

  function handleProfile() {
    if (session) {
      router.push("/profile");
    } else {
      setAuthNext("/profile");
      setAuthOpen(true);
    }
  }

  return (
    <>
      {/* Spacer in document flow so page content isn't hidden behind the fixed bar. */}
      <div className="h-20 sm:hidden" aria-hidden />

      <nav
        aria-label={t("bottomNav.primary.aria")}
        // z-[1050] keeps the bar above Leaflet's pane/control z-indexes
        // (which top out at 1000) but below the app's modals at z-[1100].
        className={`fixed inset-x-0 bottom-0 z-[1050] border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden ${
          keyboardOpen ? "hidden" : ""
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-3 items-start px-4 pb-2 pt-2.5">
          <Link
            href="/explore"
            aria-current={onHome ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition ${
              onHome ? "text-brand" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Icon name="home" className="h-5 w-5" />
            <span>{t("bottomNav.home")}</span>
          </Link>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleListRoom}
              aria-label={t("bottomNav.listRoom.aria")}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-cardHover ring-4 ring-white transition hover:bg-brand-dark active:scale-95"
            >
              <Icon name="plus" className="h-6 w-6" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleProfile}
            aria-current={onProfile ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition ${
              onProfile ? "text-brand" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Icon name="user" className="h-5 w-5" />
            <span>{t("bottomNav.profile")}</span>
          </button>
        </div>
      </nav>

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
