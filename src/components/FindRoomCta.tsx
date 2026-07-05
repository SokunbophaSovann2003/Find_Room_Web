"use client";

import Link from "next/link";
import Icon from "./Icon";
import { useSession } from "@/lib/session";
import MatchingWantedBanner from "./MatchingWantedBanner";
import { useT } from "@/lib/language";

// Explore action area:
//  • "Help me find a room" → /find-room  (concierge request to the team)
//  • "I want this type of room" → /want-room  (public demand post to landlords)
//  • Landlord banner (only when signed in) → /matches  (renters wanting rooms
//    like theirs). Rendered via MatchingWantedBanner, gated on session so
//    logged-out visitors don't trigger extra reads.
export default function FindRoomCta() {
  const t = useT();
  const session = useSession();
  return (
    <div className="mx-auto mt-5 max-w-4xl space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Link
          href="/find-room"
          className="group flex items-center justify-center gap-1.5 rounded-2xl bg-brand px-3 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <Icon name="search" className="h-4 w-4 shrink-0" />
          <span>{t("explore.findRoom.cta")}</span>
          <Icon name="arrow-right" className="hidden h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 sm:block" />
        </Link>
        <Link
          href="/want-room"
          className="group flex items-center justify-center gap-1.5 rounded-2xl bg-brand px-3 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <Icon name="home" className="h-4 w-4 shrink-0" />
          <span>{t("explore.wantRoom.cta")}</span>
          <Icon name="arrow-right" className="hidden h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 sm:block" />
        </Link>
      </div>
      {session && <MatchingWantedBanner />}
    </div>
  );
}
