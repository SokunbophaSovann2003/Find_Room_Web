"use client";

const KEY = "findroom.profile-overrides";

export interface ProfileOverrides {
  username?: string;
  // Public contact channels shown on listings — separate from the login
  // phone (which lives on the session and is the auth identity). Arrays
  // because a host can publish more than one number / Telegram contact.
  contactPhones?: string[];
  telegramPhones?: string[];
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
