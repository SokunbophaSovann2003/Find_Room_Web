"use client";

import { useMemo } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { useSession } from "@/lib/session";
import { useRooms } from "@/lib/rooms";
import { useActiveWanted, matchingWantedFor } from "@/lib/wanted";
import { useT } from "@/lib/language";

// Landlord "notification" surface: if any active demand post matches one of the
// signed-in user's own published rooms, show a banner linking to /matches.
// Rendered only for signed-in users (the parent gates on session) so logged-out
// visitors don't trigger the extra reads.
export default function MatchingWantedBanner() {
  const session = useSession();
  const { rooms } = useRooms();
  const wanted = useActiveWanted();
  const t = useT();

  const count = useMemo(
    () => matchingWantedFor(session?.uid, rooms, wanted).length,
    [session?.uid, rooms, wanted]
  );

  if (count === 0) return null;

  return (
    <Link
      href="/matches"
      className="group mx-auto mt-4 flex max-w-4xl items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 sm:text-base"
    >
      <Icon name="bell" className="h-4 w-4 shrink-0" />
      <span>{t("matches.banner", { n: count })}</span>
      <Icon name="arrow-right" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
