"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import AuthModal from "./AuthModal";
import PropertyTypePicker from "./PropertyTypePicker";
import { useSession } from "@/lib/session";
import MatchingWantedBanner from "./MatchingWantedBanner";
import { useT } from "@/lib/language";

const LIST_ROOM_PATH = "/profile/list-room";

// Explore action area:
//  • "Post my renting request" → /find-room  (community request: we spread it
//    to helpers who find a room for you)
//  • "List room" → type picker → /profile/list-room  (landlord posts a listing).
//    Lives here next to the request CTA on desktop; on mobile it's the bottom
//    nav's third tab, so it's hidden below the sm breakpoint.
//  • Landlord banner (only when signed in) → /matches
//
// Login is gated HERE so a signed-out visitor gets the login popup over the
// Explore page (not a blank request page). After login we continue to the
// request form (or, for List room, open the type picker).
export default function FindRoomCta() {
  const t = useT();
  const session = useSession();
  const router = useRouter();
  const [authFor, setAuthFor] = useState<string | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  function go(target: string) {
    if (session) router.push(target);
    else setAuthFor(target);
  }

  function handleListRoom() {
    if (session) setTypePickerOpen(true);
    else setAuthFor(LIST_ROOM_PATH);
  }

  const cardClass =
    "group flex items-center justify-center gap-1.5 rounded-2xl bg-brand px-3 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark";

  return (
    <div className="mx-auto mt-5 max-w-4xl space-y-3">
      <div className="flex flex-col gap-3 sm:mx-auto sm:grid sm:max-w-xl sm:grid-cols-2">
        <button type="button" onClick={() => go("/find-room")} className={`${cardClass} w-full`}>
          <Icon name="search" className="h-4 w-4 shrink-0" />
          <span>{t("explore.request.cta")}</span>
          <Icon name="arrow-right" className="hidden h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 sm:block" />
        </button>

        {/* Desktop-only: mobile lists a room from the bottom nav's third tab. */}
        <button
          type="button"
          onClick={handleListRoom}
          className="hidden w-full items-center justify-center gap-1.5 rounded-2xl border border-brand bg-white px-6 py-3 text-sm font-semibold text-brand shadow-sm transition hover:bg-brand/5 sm:flex"
        >
          <Icon name="plus" className="h-4 w-4 shrink-0" />
          <span>{t("nav.listRoom")}</span>
        </button>
      </div>

      {session && <MatchingWantedBanner />}

      <AuthModal
        open={!!authFor}
        onClose={() => setAuthFor(null)}
        onSuccess={() => {
          const target = authFor;
          setAuthFor(null);
          // "List room" continues to the type picker; everything else navigates.
          if (target === LIST_ROOM_PATH) setTypePickerOpen(true);
          else if (target) router.push(target);
        }}
        defaultTab="login"
      />

      <PropertyTypePicker
        open={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        onPick={(type) => {
          setTypePickerOpen(false);
          router.push(`${LIST_ROOM_PATH}?type=${type}`);
        }}
      />
    </div>
  );
}
