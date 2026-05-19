"use client";

import { useCallback, useEffect, useState } from "react";

export type Language = "km" | "en";

const STORAGE_KEY = "findroom.language";

function readStored(): Language {
  if (typeof window === "undefined") return "km";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "en" ? "en" : "km";
  } catch {
    return "km";
  }
}

/**
 * Minimal language preference hook.
 *
 * - Defaults to "km" (Khmer) because the audience is Cambodian.
 * - Persists the choice in localStorage so it survives reloads.
 * - Starts with "km" on both server and client to avoid React hydration
 *   mismatches; the stored value is synced in an effect on mount.
 *
 * Translations themselves are not wired yet — this hook just owns the user's
 * preference so UI surfaces (e.g. the flag toggle in the navbar) can react.
 * Wire it into a real i18n layer later.
 */
export function useLanguage() {
  const [language, setLanguage] = useState<Language>("km");

  useEffect(() => {
    setLanguage(readStored());
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next: Language = prev === "km" ? "en" : "km";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage may be unavailable (private mode, etc.) — non-fatal.
      }
      return next;
    });
  }, []);

  return { language, toggleLanguage };
}
