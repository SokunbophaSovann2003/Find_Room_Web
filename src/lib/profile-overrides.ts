"use client";

const KEY = "findroom.profile-overrides";

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
}
