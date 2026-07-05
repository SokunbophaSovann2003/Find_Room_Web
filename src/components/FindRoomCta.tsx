"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import AuthModal from "./AuthModal";
import { useSession } from "@/lib/session";
import MatchingWantedBanner from "./MatchingWantedBanner";
import { useT } from "@/lib/language";

// Explore action area:
//  • "Find for Me" → /find-room  (concierge request to the team)
//  • "Post a Request" → /want-room  (public demand post to landlords)
//  • Landlord banner (only when signed in) → /matches
//
// Login is gated HERE so a signed-out visitor gets the login popup over the
// Explore page (not a blank request page). After login we continue to the
// chosen request form.
export default function FindRoomCta() {
  const t = useT();
  const session = useSession();
  const router = useRouter();
  const [authFor, setAuthFor] = useState<string | null>(null);

  function go(target: string) {
    if (session) router.push(target);
    else setAuthFor(target);
  }

  const cardClass =
    "group flex items-center justify-center gap-1.5 rounded-2xl bg-brand px-3 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark";

  return (
    <div className="mx-auto mt-5 max-w-4xl space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button type="button" onClick={() => go("/find-room")} className={cardClass}>
          <Icon name="search" className="h-4 w-4 shrink-0" />
          <span>{t("explore.findRoom.cta")}</span>
          <Icon name="arrow-right" className="hidden h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 sm:block" />
        </button>
        <button type="button" onClick={() => go("/want-room")} className={cardClass}>
          <Icon name="home" className="h-4 w-4 shrink-0" />
          <span>{t("explore.wantRoom.cta")}</span>
          <Icon name="arrow-right" className="hidden h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 sm:block" />
        </button>
      </div>
      {session && <MatchingWantedBanner />}

      <AuthModal
        open={!!authFor}
        onClose={() => setAuthFor(null)}
        onSuccess={() => { const target = authFor; setAuthFor(null); if (target) router.push(target); }}
        defaultTab="login"
      />
    </div>
  );
}
