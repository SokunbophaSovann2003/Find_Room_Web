"use client";

// Per-user persistence of the list-room form fields that are typically the
// same across listings — so creating the second listing doesn't make the user
// retype everything. The fields that DO vary per listing (photos, title,
// property type, bedrooms, floor, area) are deliberately excluded.
//
// Saved on successful publish, cleared when the user explicitly hits
// "Clear all fields", hydrated on mount when neither editing nor copying.

import type { LocationValue } from "@/components/LocationPicker";
import type { PinValue } from "@/components/MapPinPicker";
import type { PricePeriod } from "./types";

// Lightweight serializable shape of a fee row — mirrors FeeRow in the
// list-room page but with a regenerated numeric id at hydration time so we
// never collide with the page's local id counter.
export interface ListRoomFeePref {
  type: string;
  price: string;
  customLabel?: string;
  customUnit?: string;
}

export interface ListRoomPrefs {
  description: string;
  location: LocationValue;
  pin: PinValue | null;
  amenities: string[];
  fees: ListRoomFeePref[];
  rentPeriod: PricePeriod;
  contactPhones: string[];
  telegramPhones: string[];
}

const PREFIX = "findroom.list-room-prefs.";
const key = (uid: string) => `${PREFIX}${uid}`;

export function loadListRoomPrefs(uid: string): ListRoomPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(uid));
    if (!raw) return null;
    return JSON.parse(raw) as ListRoomPrefs;
  } catch {
    return null;
  }
}

export function saveListRoomPrefs(uid: string, prefs: ListRoomPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(uid), JSON.stringify(prefs));
}

export function clearListRoomPrefs(uid: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(uid));
}
