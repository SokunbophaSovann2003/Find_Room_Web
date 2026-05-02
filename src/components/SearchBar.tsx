"use client";

import Icon from "./Icon";

export default function SearchBar() {
  return (
    <form
      className="flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-card sm:flex-row sm:items-center sm:rounded-full"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 sm:rounded-full sm:px-4">
        <Icon name="map-pin" className="h-5 w-5 text-brand" />
        <span className="sr-only">Location</span>
        <input
          type="text"
          placeholder="Where to? Phnom Penh, Siem Reap…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
        />
      </label>

      <div className="hidden h-8 w-px bg-slate-200 sm:block" />

      <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 sm:rounded-full sm:px-4">
        <Icon name="home" className="h-5 w-5 text-brand" />
        <span className="sr-only">Room type</span>
        <select
          defaultValue=""
          className="w-full cursor-pointer bg-transparent text-sm outline-none"
        >
          <option value="">Any room type</option>
          <option value="studio">Studio</option>
          <option value="1-bedroom">1-bedroom</option>
          <option value="2-bedroom">2-bedroom</option>
          <option value="shared">Shared</option>
          <option value="apartment">Apartment</option>
        </select>
      </label>

      <div className="hidden h-8 w-px bg-slate-200 sm:block" />

      <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 sm:rounded-full sm:px-4">
        <span aria-hidden className="flex h-5 w-5 items-center justify-center text-base font-bold text-brand">$</span>
        <span className="sr-only">Sort by price</span>
        <select
          defaultValue=""
          className="w-full cursor-pointer bg-transparent text-sm outline-none"
        >
          <option value="">Sort by price</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </label>

      <button type="submit" className="btn-primary sm:px-6">
        <Icon name="search" className="h-4 w-4" />
        Search
      </button>
    </form>
  );
}
