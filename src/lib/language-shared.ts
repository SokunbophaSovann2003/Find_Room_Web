// Framework-agnostic language constants, deliberately kept OUT of the
// "use client" module (language.tsx). A server component (the root layout)
// reads LANGUAGE_COOKIE, and runtime values exported from a client module
// resolve to `undefined` when imported on the server — so this lives here.

export type Language = "km" | "en";

// Cookie mirror of the preference. Unlike localStorage, a cookie is sent with
// every request, so the server can read it and render the right language — and
// the matching <html lang> — on the very first paint.
export const LANGUAGE_COOKIE = "findroom_lang";

/** Coerces an arbitrary cookie value to a valid Language, defaulting to "km". */
export function toLanguage(value: string | undefined | null): Language {
  return value === "en" ? "en" : "km";
}
