"use client";

const KEY = "findroom.profile-overrides";
const EVENT = "findroom:profile-overrides-changed";

export interface ProfileOverrides {
  username?: string;
  avatarUrl?: string;
}

export function loadOverrides(): ProfileOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProfileOverrides) : {};
  } catch {
    return {};
  }
}

export function saveOverrides(o: ProfileOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(o));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribeOverrides(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}
