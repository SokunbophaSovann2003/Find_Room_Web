import SearchBar from "@/components/SearchBar";
import ExploreRooms from "@/components/ExploreRooms";
import { ExploreFilterProvider } from "@/components/ExploreFilterContext";
import { MOCK_ROOMS } from "@/lib/mock-data";

export default function ExplorePage() {
  const rooms = MOCK_ROOMS;

  return (
    <ExploreFilterProvider>
      <section className="relative bg-gradient-to-br from-brand-50 via-white to-amber-50">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Find your perfect room <span className="text-brand">in Cambodia</span>
            </h1>
            <p className="mt-4 hidden text-lg text-ink-muted sm:block">
              Verified rooms from friendly landlords. Search by neighbourhood, price, and move-in date — book a viewing in minutes.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-4xl">
            <SearchBar />
          </div>
        </div>
      </section>

      <section id="all" className="mx-auto max-w-7xl px-4 py-10 pb-16 sm:px-6">
        <ExploreRooms rooms={rooms} />
      </section>
    </ExploreFilterProvider>
  );
}
