"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "./Icon";
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
    <div className="space-y-3">
      {/* Mobile: the two concepts as an auto-sliding banner carousel. */}
      <div className="sm:hidden">
        <ConceptCarousel
          slides={[
            {
              icon: "search",
              title: t("explore.card.find.title"),
              desc: t("explore.card.find.desc"),
              cta: t("explore.card.find.cta"),
              gradientClass: "bg-gradient-to-br from-brand to-emerald-600",
              ctaTextClass: "text-brand",
              onClick: () => go("/find-room")
            },
            {
              icon: "home",
              title: t("explore.card.list.title"),
              desc: (
                <>
                  {t("explore.card.list.desc")}{" "}
                  <span className="text-sm font-extrabold text-white">
                    {t("explore.card.list.desc.free")}
                  </span>
                </>
              ),
              cta: t("explore.card.list.cta"),
              gradientClass: "bg-gradient-to-br from-amber-400 to-orange-500",
              ctaTextClass: "text-orange-600",
              onClick: handleListRoom
            }
          ]}
        />
      </div>

      {/* Tablet / desktop: the original button row. */}
      <div className="hidden gap-3 sm:mx-auto sm:grid sm:max-w-xl sm:grid-cols-2">
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

// A tappable concept card: icon tile, title, one-line description. Used on
// mobile to present Joul's two actions (find a room / list a room) side by side.
interface Slide {
  icon: IconName;
  title: string;
  desc: ReactNode;
  cta: string;
  gradientClass: string;
  ctaTextClass: string;
  onClick: () => void;
}

// Auto-sliding banner carousel: one full-width banner at a time, advancing on a
// timer, swipeable, with dot indicators.
function ConceptCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const n = slides.length;
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (n <= 1) return;
    const id = setInterval(() => setIndex((c) => (c + 1) % n), 4500);
    return () => clearInterval(id);
  }, [n]);

  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-3xl"
        onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (startX.current == null) return;
          const dx = e.changedTouches[0].clientX - startX.current;
          if (dx < -40) setIndex((c) => (c + 1) % n);
          else if (dx > 40) setIndex((c) => (c - 1 + n) % n);
          startX.current = null;
        }}
      >
        <div
          className="flex w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div key={i} className="w-full shrink-0">
              <ConceptBanner {...s} />
            </div>
          ))}
        </div>
      </div>

      {n > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// A vibrant, playful concept banner — bold gradient, a graphic tile, decorative
// depth, and a solid CTA pill so it clearly reads as tappable.
function ConceptBanner({
  icon,
  title,
  desc,
  cta,
  gradientClass,
  ctaTextClass,
  onClick
}: Slide) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[132px] w-full items-center gap-3 overflow-hidden rounded-3xl p-4 text-left shadow-card transition active:scale-[0.99] ${gradientClass}`}
    >
      {/* Decorative depth. */}
      <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15" aria-hidden />
      <span className="pointer-events-none absolute -bottom-12 right-10 h-28 w-28 rounded-full bg-black/5" aria-hidden />

      <div className="relative min-w-0 flex-1">
        <span className="block text-lg font-extrabold leading-tight tracking-tight text-white">{title}</span>
        <span className="mt-1 block text-xs font-medium leading-snug text-white/90">{desc}</span>
        <span
          className={`mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold shadow-sm ${ctaTextClass}`}
        >
          {cta}
          <Icon name="arrow-right" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/25 text-white ring-1 ring-white/40 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
        <Icon name={icon} className="h-8 w-8" />
      </span>
    </button>
  );
}
