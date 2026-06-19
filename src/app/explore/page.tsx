import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import ExploreRooms from "@/components/ExploreRooms";
import ExploreHero from "@/components/ExploreHero";
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
        <section className="relative bg-gradient-to-br from-brand-50 via-white to-amber-50">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
            <ExploreHero />

            <div className="mx-auto mt-8 max-w-4xl">
              <SearchBar />
            </div>
          </div>
        </section>

        <section id="all" className="mx-auto max-w-7xl px-4 py-10 pb-16 sm:px-6">
          <ExploreRooms rooms={rooms} />
        </section>
      </ExploreFilterProvider>
    </Suspense>
  );
}
