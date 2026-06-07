"use client";

import { safeSetItem } from "./safe-storage";

// Per-user profile overrides (display name, avatar). Keyed by session.uid so
// that two accounts on the same device don't see each other's edits.
const PREFIX = "findroom.profile-overrides.";
const LEGACY_KEY = "findroom.profile-overrides";
const EVENT = "findroom:profile-overrides-changed";

export interface ProfileOverrides {
  username?: string;
  avatarUrl?: string;
}

function keyFor(uid: string) {
  return `${PREFIX}${uid}`;
}

// One-time cleanup: the legacy global key applied to every user on the device.
// Drop it so it can't keep leaking after the upgrade.
function purgeLegacy() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(LEGACY_KEY) !== null) {
    window.localStorage.removeItem(LEGACY_KEY);
  }
}

export function loadOverrides(uid: string | undefined | null): ProfileOverrides {
  if (typeof window === "undefined" || !uid) return {};
  purgeLegacy();
  try {
    const raw = window.localStorage.getItem(keyFor(uid));
    return raw ? (JSON.parse(raw) as ProfileOverrides) : {};
  } catch {
    return {};
  }
}

// Returns false if the write was rejected (e.g. storage full, e.g. a large
// base64 avatar) so the caller can avoid a misleading success message.
export function saveOverrides(uid: string, o: ProfileOverrides): boolean {
  if (typeof window === "undefined" || !uid) return false;
  const ok = safeSetItem(keyFor(uid), JSON.stringify(o));
  if (ok) window.dispatchEvent(new CustomEvent(EVENT, { detail: { uid } }));
  return ok;
}

export function subscribeOverrides(uid: string | undefined | null, cb: () => void): () => void {
  if (typeof window === "undefined" || !uid) return () => {};
  const onCustom = (e: Event) => {
    const detailUid = (e as CustomEvent<{ uid?: string }>).detail?.uid;
    if (!detailUid || detailUid === uid) cb();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === keyFor(uid)) cb();
  };
  window.addEventListener(EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
