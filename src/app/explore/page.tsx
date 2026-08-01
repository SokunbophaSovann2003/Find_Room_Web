import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import ExploreRooms from "@/components/ExploreRooms";
import ExploreHero from "@/components/ExploreHero";
import FindRoomCta from "@/components/FindRoomCta";
import { ExploreFilterProvider } from "@/components/ExploreFilterContext";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function ExplorePage() {
  const rooms = isFirebaseConfigured ? [] : MOCK_ROOMS;

  return (
    // Suspense boundary required by Next.js 14 because child components call
    // useSearchParams(), which opts the route into dynamic rendering.
    <Suspense>
      <ExploreFilterProvider>
        {/* The hero (heading + search bar + CTA buttons + gradient) is desktop
            only. On mobile the filter and slider live at the top of the listings
            section below. */}
        <section className="relative hidden sm:block sm:bg-gradient-to-br sm:from-brand-50 sm:via-white sm:to-amber-50">
          <div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
            <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-20">
            <ExploreHero />

            {/* Desktop: search bar sits in the hero above the CTA buttons.
                Mobile: only the concept cards show here — the filter moves down
                to the top of the listings section below. */}
            <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:mt-8 sm:gap-5">
              <div className="order-2 hidden sm:order-1 sm:block">
                <SearchBar />
              </div>
              <div className="order-1 sm:order-2">
                <FindRoomCta />
              </div>
            </div>
          </div>
        </section>

        <section id="all" className="mx-auto max-w-7xl px-4 pt-4 pb-16 sm:px-6 sm:pt-10">
          {/* Mobile-only: filter first, then the concept slider, above the listings. */}
          <div className="mb-4 space-y-4 sm:hidden">
            <SearchBar />
            <FindRoomCta />
          </div>
          <ExploreRooms rooms={rooms} />
        </section>
      </ExploreFilterProvider>
    </Suspense>
  );
}
