"use client";

import { useCallback, useEffect, useState } from "react";

export type Language = "km" | "en";

const STORAGE_KEY = "findroom.language";
const EVENT = "findroom:language-change";

function readStored(): Language {
  if (typeof window === "undefined") return "km";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "en" ? "en" : "km";
  } catch {
    return "km";
  }
}

// Minimal in-file translation dictionary. Keep it small and additive — the
// audience is Cambodian so "km" is the source of truth; "en" carries the
// fallback we already use everywhere else. Add new keys as components opt in
// via the `useT()` hook.
type Dict = Record<string, Record<Language, string>>;

const DICT: Dict = {
  // Explore hero
  "explore.hero.title.before": { km: "ស្វែងរកបន្ទប់ដ៏ល្អឥតខ្ចោះ", en: "Find your perfect room" },
  "explore.hero.title.highlight": { km: "នៅកម្ពុជា", en: "in Cambodia" },
  "explore.hero.subtitle": {
    km: "បន្ទប់ដែលបានផ្ទៀងផ្ទាត់ពីម្ចាស់ផ្ទះរួសរាយ។ ស្វែងរកតាមតំបន់ តម្លៃ និងថ្ងៃផ្លាស់ចូល — កក់មើលក្នុងពេលប៉ុន្មាននាទី។",
    en: "Verified rooms from friendly landlords. Search by neighbourhood, price, and move-in date — book a viewing in minutes."
  },

  // Search bar
  "search.location.placeholder": { km: "ស្វែងរកនៅទីណា? ខេត្ត ស្រុក តំបន់…", en: "Where to? Province, district, area…" },
  "search.type.any": { km: "ប្រភេទកន្លែង", en: "Any property type" },
  "search.type.title": { km: "ប្រភេទកន្លែង", en: "Property type" },
  "search.sort.default": { km: "តម្រៀបតាមតម្លៃ", en: "Sort by price" },
  "search.sort.asc": { km: "តម្លៃ៖ ទាបទៅខ្ពស់", en: "Price: low to high" },
  "search.sort.desc": { km: "តម្លៃ៖ ខ្ពស់ទៅទាប", en: "Price: high to low" },
  "search.submit": { km: "ស្វែងរក", en: "Search" },
  "search.clearLocation": { km: "សម្អាតទីតាំង", en: "Clear location" },

  // Property type labels
  "type.room": { km: "បន្ទប់", en: "Room" },
  "type.house": { km: "ផ្ទះ", en: "House" },
  "type.apartment": { km: "ផ្ទះល្វែង", en: "Apartment" },
  "type.condo": { km: "ខុនដូ", en: "Condo" },
  "type.flat": { km: "ផ្ទះកម្រាល", en: "Flat" },
  "type.villa": { km: "វីឡា", en: "Villa" },

  // Explore listing block
  "explore.heading": { km: "បន្ទប់ទាំងអស់", en: "Explore all rooms" },
  "explore.counter.available.one": { km: "{n} បន្ទប់អាចជួលបាន", en: "{n} room available right now" },
  "explore.counter.available.many": { km: "{n} បន្ទប់អាចជួលបាន", en: "{n} rooms available right now" },
  "explore.counter.inArea.one": { km: "{n} បន្ទប់នៅក្នុងតំបន់នេះ", en: "{n} room in this area" },
  "explore.counter.inArea.many": { km: "{n} បន្ទប់នៅក្នុងតំបន់នេះ", en: "{n} rooms in this area" },
  "explore.tab.list": { km: "បញ្ជី", en: "List" },
  "explore.tab.map": { km: "ផែនទី", en: "Map" }
};

/**
 * Minimal language preference hook.
 *
 * - Defaults to "km" (Khmer) because the audience is Cambodian.
 * - Persists the choice in localStorage so it survives reloads.
 * - Starts with "km" on both server and client to avoid React hydration
 *   mismatches; the stored value is synced in an effect on mount.
 */
export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("km");

  useEffect(() => {
    // Sync once on mount, then subscribe so every consumer of useLanguage
    // reacts when the toggle (or another tab) updates the preference.
    setLanguageState(readStored());
    const sync = () => setLanguageState(readStored());
    window.addEventListener(EVENT, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleLanguage = useCallback(() => {
    const next: Language = readStored() === "km" ? "en" : "km";
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage may be unavailable (private mode, etc.) — non-fatal.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { language, toggleLanguage };
}

/**
 * Translator hook. Returns a `t(key, vars?)` function that looks up the
 * current language's string. Unknown keys fall through to the key itself so
 * missing translations are visible.
 */
export function useT() {
  const { language } = useLanguage();
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const entry = DICT[key];
      let value = entry?.[language] ?? entry?.en ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replace(`{${k}}`, String(v));
        }
      }
      return value;
    },
    [language]
  );
}
