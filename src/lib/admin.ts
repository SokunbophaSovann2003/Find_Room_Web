"use client";

// Admin gating + mock data stores for the /user/admin section.
//
// Per project decisions: front-end-first build, mock data only.
// Admin identity is a hardcoded allowlist of session uids PLUS any user whose
// admin-store entry has role === "admin" and status === "active". Mock users,
// listings, and notifications live in localStorage and are seeded on first
// admin visit so the UI has something to render.

import { useEffect, useState } from "react";
import type { Session } from "./session";
import { MOCK_ROOMS } from "./mock-data";
import type { PricePeriod, PropertyType, Room } from "./types";

// DEMO MODE ONLY. This phone number is the seeded admin uid. In demo mode
// (no Firebase configured), anyone who signs in with phone +855 12 000 000 is
// granted admin rights. This is acceptable because the entire admin store
// lives in localStorage and is trivially tamperable — but it MUST be replaced
// with a server-side allowlist before this code carries real users. Do not
// publish this phone in any deployed marketing copy.
const SEED_ADMIN_UIDS = ["demo-85512000000"];

const ADMIN_UIDS_KEY = "findroom.admin-uids";
const ADMIN_UIDS_EVENT = "findroom:admin-uids-change";

export function getAdminUids(): string[] {
  if (typeof window === "undefined") return SEED_ADMIN_UIDS;
  try {
    const raw = window.localStorage.getItem(ADMIN_UIDS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // fall through to seed
  }
  window.localStorage.setItem(ADMIN_UIDS_KEY, JSON.stringify(SEED_ADMIN_UIDS));
  return SEED_ADMIN_UIDS;
}

export function setAdminUids(uids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_UIDS_KEY, JSON.stringify(uids));
  window.dispatchEvent(new Event(ADMIN_UIDS_EVENT));
}

export function isAdminUid(uid: string | undefined | null): boolean {
  if (!uid) return false;
  return getAdminUids().includes(uid);
}

export function isAdmin(session: Session | null): boolean {
  if (!session) return false;
  if (isAdminUid(session.uid)) return true;
  // Role/status promoted via the user-management UI is also honored, so
  // changing a user to role=admin actually grants access.
  const u = getAdminUserById(session.uid);
  return u?.role === "admin" && u?.status === "active";
}

// Mock owners in `mock-data.ts` use short ids (sokha, dara…). Real sessions
// use `demo-<digits>` uids derived from the phone number. To keep the admin
// directory, session, and listing owner.id in the same namespace, we rewrite
// the mock owners to demo-* uids matching their phone digits.
const LEGACY_OWNER_TO_DEMO_UID: Record<string, string> = {
  sokha: "demo-85512345678",
  dara: "demo-85517888112",
  sreypov: "demo-85596221009",
  pisey: "demo-85578552200",
  ratha: "demo-85581449720",
  vannak: "demo-85589320117",
  channary: "demo-85592666808"
};

// Look up the demo-* uid that owns a given mock-data owner id (or pass-through
// if it's already a demo-* uid). Internal helper — only used by the listings
// seeder below, so kept un-exported to keep the demo identity space private.
function resolveOwnerUid(legacyOrDemoUid: string): string {
  return LEGACY_OWNER_TO_DEMO_UID[legacyOrDemoUid] ?? legacyOrDemoUid;
}

// Look up an admin user by the phone they sign in with. Used by the login
// flow to block disabled accounts before a session is created.
export function findAdminUserByPhone(phoneNumber: string): AdminUser | undefined {
  const digits = phoneNumber.replace(/\D/g, "");
  const uid = `demo-${digits}`;
  return getAdminUserById(uid);
}

// ---------- Mock user directory ----------

export interface AdminUser {
  uid: string;
  username: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  role: "admin" | "user";
  status: "active" | "disabled";
  createdAt: number; // ms epoch
}

const USERS_KEY = "findroom.admin-users";
const USERS_EVENT = "findroom:admin-users-change";
const USERS_SEEDED_FLAG = "findroom.admin-users-seeded";

function seedUsers(): AdminUser[] {
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  return [
    {
      uid: "demo-85512000000",
      username: "Admin (you)",
      phoneNumber: "+855 12 000 000",
      email: "admin@findroom.kh",
      avatarUrl: "https://i.pravatar.cc/160?img=8",
      role: "admin",
      status: "active",
      createdAt: now - day * 120
    },
    {
      uid: "demo-85512345678",
      username: "Sokha Chan",
      phoneNumber: "+855 12 345 678",
      email: "sokha.chan@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=47",
      role: "user",
      status: "active",
      createdAt: now - day * 90
    },
    {
      uid: "demo-85517888112",
      username: "Dara Pich",
      phoneNumber: "+855 17 888 112",
      avatarUrl: "https://i.pravatar.cc/160?img=12",
      role: "user",
      status: "active",
      createdAt: now - day * 75
    },
    {
      uid: "demo-85596221009",
      username: "Sreypov Lay",
      phoneNumber: "+855 96 221 009",
      email: "sreypov.lay@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=32",
      role: "user",
      status: "active",
      createdAt: now - day * 60
    },
    {
      uid: "demo-85578552200",
      username: "Pisey Mao",
      phoneNumber: "+855 78 552 200",
      email: "pisey.mao@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=68",
      role: "user",
      status: "active",
      createdAt: now - day * 45
    },
    {
      uid: "demo-85581449720",
      username: "Ratha Lim",
      phoneNumber: "+855 81 449 720",
      avatarUrl: "https://i.pravatar.cc/160?img=15",
      role: "user",
      status: "disabled",
      createdAt: now - day * 30
    },
    {
      uid: "demo-85589320117",
      username: "Vannak Heng",
      phoneNumber: "+855 89 320 117",
      email: "vannak.heng@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=53",
      role: "user",
      status: "active",
      createdAt: now - day * 18
    },
    {
      uid: "demo-85592666808",
      username: "Channary Sok",
      phoneNumber: "+855 92 666 808",
      avatarUrl: "https://i.pravatar.cc/160?img=44",
      role: "user",
      status: "active",
      createdAt: now - day * 7
    }
  ];
}

// Push the in-code `MOCK_ROOMS` catalog into the localStorage room store so
// that admin views of a user (e.g. Sokha Chan) actually surface listings. Owner
// ids are rewritten through `LEGACY_OWNER_TO_DEMO_UID` so they match the demo-*
// uid space used by sessions and the admin user directory.
const LISTINGS_SEEDED_FLAG = "findroom.admin-listings-seeded";
const LOCAL_ROOMS_KEY = "findroom.local-rooms";
const LOCAL_ROOMS_EVENT = "findroom:local-rooms-change";

export function seedMockListings() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(LISTINGS_SEEDED_FLAG)) return;

  let existing: Room[] = [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ROOMS_KEY);
    existing = raw ? (JSON.parse(raw) as Room[]) : [];
  } catch {
    existing = [];
  }
  const existingIds = new Set(existing.map((r) => r.id));

  const seeded: Room[] = MOCK_ROOMS.filter((r) => !existingIds.has(`mock-${r.id}`)).map((r) => ({
    ...r,
    id: `mock-${r.id}`,
    owner: {
      ...r.owner,
      id: resolveOwnerUid(r.owner.id)
    }
  }));

  const merged = [...seeded, ...existing];
  window.localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(merged));
  window.localStorage.setItem(LISTINGS_SEEDED_FLAG, "1");
  window.dispatchEvent(new Event(LOCAL_ROOMS_EVENT));
}

export function getAdminUsers(): AdminUser[] {
  if (typeof window === "undefined") return [];
  try {
    const seeded = window.localStorage.getItem(USERS_SEEDED_FLAG);
    if (!seeded) {
      const initial = seedUsers();
      window.localStorage.setItem(USERS_KEY, JSON.stringify(initial));
      window.localStorage.setItem(USERS_SEEDED_FLAG, "1");
      return initial;
    }
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as AdminUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: AdminUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(USERS_EVENT));
}

export function addAdminUser(input: Omit<AdminUser, "uid" | "createdAt"> & { uid?: string }): AdminUser {
  const users = getAdminUsers();
  const uid = input.uid?.trim() || `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const next: AdminUser = {
    uid,
    username: input.username,
    phoneNumber: input.phoneNumber,
    email: input.email,
    avatarUrl: input.avatarUrl,
    role: input.role,
    status: input.status,
    createdAt: Date.now()
  };
  writeUsers([next, ...users]);
  return next;
}

export function updateAdminUser(uid: string, patch: Partial<Omit<AdminUser, "uid">>) {
  const users = getAdminUsers().map((u) => (u.uid === uid ? { ...u, ...patch } : u));
  writeUsers(users);
}

export function deleteAdminUser(uid: string) {
  const users = getAdminUsers().filter((u) => u.uid !== uid);
  writeUsers(users);
}

export function toggleAdminUserStatus(uid: string) {
  const users = getAdminUsers().map((u) =>
    u.uid === uid ? { ...u, status: u.status === "active" ? "disabled" : "active" } : u
  );
  writeUsers(users as AdminUser[]);
}

export function getAdminUserById(uid: string): AdminUser | undefined {
  return getAdminUsers().find((u) => u.uid === uid);
}

export function useAdminUsers(): AdminUser[] {
  const [users, setUsers] = useState<AdminUser[]>([]);
  useEffect(() => {
    const sync = () => setUsers(getAdminUsers());
    sync();
    window.addEventListener(USERS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(USERS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return users;
}

// ---------- Mock notifications ----------

export type AdminNotificationKind =
  | "user-registered"
  | "listing-posted"
  | "listing-flagged"
  | "system";

export interface AdminNotification {
  id: string;
  kind: AdminNotificationKind;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
}

const NOTIF_KEY = "findroom.admin-notifications";
const NOTIF_EVENT = "findroom:admin-notifications-change";
const NOTIF_SEEDED_FLAG = "findroom.admin-notifications-seeded";

function seedNotifications(): AdminNotification[] {
  const now = Date.now();
  const min = 60_000;
  return [
    {
      id: "n1",
      kind: "user-registered",
      title: "New user registered",
      body: "Channary Sok joined FindRoom with phone +855 92 666 808.",
      createdAt: now - 12 * min,
      read: false
    },
    {
      id: "n2",
      kind: "listing-posted",
      title: "New listing posted",
      body: "Sokha Chan published \"Designer 1BR in BKK1\" for $480/month.",
      createdAt: now - 55 * min,
      read: false
    },
    {
      id: "n3",
      kind: "listing-flagged",
      title: "Listing reported by a user",
      body: "A renter flagged \"Cosy room in Tuol Tom Poung\" — please review.",
      createdAt: now - 4 * 60 * min,
      read: false
    },
    {
      id: "n4",
      kind: "user-registered",
      title: "New user registered",
      body: "Vannak Heng joined FindRoom with phone +855 89 320 117.",
      createdAt: now - 26 * 60 * min,
      read: true
    },
    {
      id: "n5",
      kind: "system",
      title: "Weekly summary ready",
      body: "8 new listings, 2 new users, 3 reports last week.",
      createdAt: now - 3 * 24 * 60 * min,
      read: true
    }
  ];
}

export function getAdminNotifications(): AdminNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const seeded = window.localStorage.getItem(NOTIF_SEEDED_FLAG);
    if (!seeded) {
      const initial = seedNotifications();
      window.localStorage.setItem(NOTIF_KEY, JSON.stringify(initial));
      window.localStorage.setItem(NOTIF_SEEDED_FLAG, "1");
      return initial;
    }
    const raw = window.localStorage.getItem(NOTIF_KEY);
    return raw ? (JSON.parse(raw) as AdminNotification[]) : [];
  } catch {
    return [];
  }
}

function writeNotifications(list: AdminNotification[]) {
  window.localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(NOTIF_EVENT));
}

export function markNotificationRead(id: string, read = true) {
  const list = getAdminNotifications().map((n) => (n.id === id ? { ...n, read } : n));
  writeNotifications(list);
}

export function markAllNotificationsRead() {
  const list = getAdminNotifications().map((n) => ({ ...n, read: true }));
  writeNotifications(list);
}

export function deleteNotification(id: string) {
  writeNotifications(getAdminNotifications().filter((n) => n.id !== id));
}

export function useAdminNotifications(): AdminNotification[] {
  const [list, setList] = useState<AdminNotification[]>([]);
  useEffect(() => {
    const sync = () => setList(getAdminNotifications());
    sync();
    window.addEventListener(NOTIF_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NOTIF_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}

// ---------- Platform settings ----------

export interface AdminSettings {
  // General
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  // Moderation
  autoPublishListings: boolean;
  requirePhoneVerification: boolean;
  emailAlertsOnReports: boolean;
  // Taxonomy
  activePropertyTypes: PropertyType[];
  amenities: string[];
  // Pricing defaults — pre-fill the list-room form
  defaultPricePeriod: PricePeriod;
  defaultWaterPrice: number; // $ / m³
  defaultElectricityPrice: number; // $ / kWh
  defaultWifiPrice: number; // $ / month
  exchangeRateKhrPerUsd: number;
}

export const ALL_PROPERTY_TYPES: PropertyType[] = [
  "room",
  "apartment",
  "condo",
  "flat",
  "house",
  "villa"
];

export const DEFAULT_AMENITIES: string[] = [
  "Wi-Fi",
  "Air conditioning",
  "Parking",
  "Security",
  "Kitchen",
  "Elevator",
  "Pool",
  "Gym",
  "Laundry",
  "Balcony"
];

const DEFAULT_SETTINGS: AdminSettings = {
  siteName: "FindRoom.KH",
  supportEmail: "support@findroom.kh",
  supportPhone: "+855 12 000 000",
  defaultCurrency: "USD",
  autoPublishListings: true,
  requirePhoneVerification: false,
  emailAlertsOnReports: true,
  activePropertyTypes: [...ALL_PROPERTY_TYPES],
  amenities: [...DEFAULT_AMENITIES],
  defaultPricePeriod: "monthly",
  defaultWaterPrice: 0.5,
  defaultElectricityPrice: 0.25,
  defaultWifiPrice: 15,
  exchangeRateKhrPerUsd: 4100
};

const SETTINGS_KEY = "findroom.admin-settings";
const SETTINGS_EVENT = "findroom:admin-settings-change";

export function getAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AdminSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAdminSettings(patch: Partial<AdminSettings>) {
  if (typeof window === "undefined") return;
  const merged: AdminSettings = { ...getAdminSettings(), ...patch };
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

export function useAdminSettings(): AdminSettings {
  const [s, setS] = useState<AdminSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    const sync = () => setS(getAdminSettings());
    sync();
    window.addEventListener(SETTINGS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SETTINGS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return s;
}

// ---------- Danger-zone reset ----------

// Removes all locally-seeded admin + room data so the demo can be re-bootstrapped.
// Leaves the user's auth session alone.
export function resetAllLocalData() {
  if (typeof window === "undefined") return;
  const keysToClear = [
    "findroom.local-rooms",
    "findroom.admin-users",
    "findroom.admin-users-seeded",
    "findroom.admin-notifications",
    "findroom.admin-notifications-seeded",
    "findroom.admin-listings-seeded",
    SETTINGS_KEY
  ];
  for (const k of keysToClear) window.localStorage.removeItem(k);
  // Drop per-user seed flags so sample listings can re-appear.
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith("findroom.seeded.")) {
      window.localStorage.removeItem(key);
    }
  }
  window.dispatchEvent(new Event(USERS_EVENT));
  window.dispatchEvent(new Event(NOTIF_EVENT));
  window.dispatchEvent(new Event("findroom:local-rooms-change"));
}
