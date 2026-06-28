"use client";

// Admin gating + mock data stores for the /user/admin section.
//
// Per project decisions: front-end-first build, mock data only.
// Admin identity is a hardcoded allowlist of session uids PLUS any user whose
// admin-store entry has role === "admin" and status === "active". Mock users,
// listings, and notifications live in localStorage and are seeded on first
// admin visit so the UI has something to render.

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "./firebase";
import type { Session } from "./session";
import { MOCK_ROOMS } from "./mock-data";
import { safeSetItem } from "./safe-storage";
import type { PricePeriod, PropertyType, Room } from "./types";

// Module-level cache so synchronous helpers (isAdmin, getAdminUserById,
// findAdminUserByPhone) work without an async Firestore read every call.
// Populated by useAdminUsers() the first time the hook mounts.
const usersCache = new Map<string, AdminUser>();

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
  if (isFirebaseConfigured) {
    const u = usersCache.get(session.uid);
    return u?.role === "admin" && u?.status === "active";
  }
  if (isAdminUid(session.uid)) return true;
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
  channary: "demo-85592666808",
  makara: "demo-85572334556",
  bunna: "demo-85598112447"
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
  if (isFirebaseConfigured) {
    for (const u of usersCache.values()) {
      if (u.phoneNumber.replace(/\D/g, "") === phoneNumber.replace(/\D/g, "")) return u;
    }
    return undefined;
  }
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
// Bump when new demo users are added to seedUsers(). On upgrade, missing seed
// users are merged into already-seeded browsers by uid, without clobbering any
// admin edits to existing rows.
const USERS_SEED_VERSION = 3;

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
    },
    {
      uid: "demo-85510234567",
      username: "Sophea Kim",
      phoneNumber: "+855 10 234 567",
      email: "sophea.kim@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=5",
      role: "user",
      status: "active",
      createdAt: now - day * 84
    },
    {
      uid: "demo-85593445667",
      username: "Rithy Pen",
      phoneNumber: "+855 93 445 667",
      email: "rithy.pen@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=11",
      role: "admin",
      status: "active",
      createdAt: now - day * 70
    },
    {
      uid: "demo-85516778990",
      username: "Bopha Nuon",
      phoneNumber: "+855 16 778 990",
      email: "bopha.nuon@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=9",
      role: "user",
      status: "active",
      createdAt: now - day * 66
    },
    {
      uid: "demo-85511556778",
      username: "Veasna Chea",
      phoneNumber: "+855 11 556 778",
      avatarUrl: "https://i.pravatar.cc/160?img=13",
      role: "user",
      status: "disabled",
      createdAt: now - day * 52
    },
    {
      uid: "demo-85570889221",
      username: "Kanha Sok",
      phoneNumber: "+855 70 889 221",
      email: "kanha.sok@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=20",
      role: "user",
      status: "active",
      createdAt: now - day * 40
    },
    {
      uid: "demo-85588112334",
      username: "Maly Tep",
      phoneNumber: "+855 88 112 334",
      email: "maly.tep@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=25",
      role: "user",
      status: "active",
      createdAt: now - day * 33
    },
    {
      uid: "demo-85569223445",
      username: "Sok San",
      phoneNumber: "+855 69 223 445",
      avatarUrl: "https://i.pravatar.cc/160?img=14",
      role: "user",
      status: "active",
      createdAt: now - day * 26
    },
    {
      uid: "demo-85515667889",
      username: "Chenda Ouk",
      phoneNumber: "+855 15 667 889",
      email: "chenda.ouk@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=28",
      role: "user",
      status: "disabled",
      createdAt: now - day * 21
    },
    {
      uid: "demo-85577334556",
      username: "Phally Sim",
      phoneNumber: "+855 77 334 556",
      email: "phally.sim@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=30",
      role: "user",
      status: "active",
      createdAt: now - day * 15
    },
    {
      uid: "demo-85586990112",
      username: "Vibol Hou",
      phoneNumber: "+855 86 990 112",
      email: "vibol.hou@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=51",
      role: "user",
      status: "active",
      createdAt: now - day * 10
    },
    {
      uid: "demo-85531445668",
      username: "Sothea Roeun",
      phoneNumber: "+855 31 445 668",
      avatarUrl: "https://i.pravatar.cc/160?img=33",
      role: "user",
      status: "active",
      createdAt: now - day * 5
    },
    {
      uid: "demo-85560778223",
      username: "Nita Chhour",
      phoneNumber: "+855 60 778 223",
      email: "nita.chhour@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=26",
      role: "user",
      status: "active",
      createdAt: now - day * 2
    },
    {
      uid: "demo-85572334556",
      username: "Makara Keo",
      phoneNumber: "+855 72 334 556",
      email: "makara.keo@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=35",
      role: "user",
      status: "active",
      createdAt: now - day * 88
    },
    {
      uid: "demo-85598112447",
      username: "Bunna Hout",
      phoneNumber: "+855 98 112 447",
      email: "bunna.hout@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=17",
      role: "user",
      status: "active",
      createdAt: now - day * 72
    },
    {
      uid: "demo-85583556228",
      username: "Theary Mong",
      phoneNumber: "+855 83 556 228",
      avatarUrl: "https://i.pravatar.cc/160?img=36",
      role: "user",
      status: "active",
      createdAt: now - day * 58
    },
    {
      uid: "demo-85561779334",
      username: "Lyda Kem",
      phoneNumber: "+855 61 779 334",
      email: "lyda.kem@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=21",
      role: "user",
      status: "active",
      createdAt: now - day * 50
    },
    {
      uid: "demo-85537112889",
      username: "Samnang Ros",
      phoneNumber: "+855 37 112 889",
      email: "samnang.ros@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=57",
      role: "user",
      status: "active",
      createdAt: now - day * 43
    },
    {
      uid: "demo-85590221667",
      username: "Dalin Chan",
      phoneNumber: "+855 90 221 667",
      avatarUrl: "https://i.pravatar.cc/160?img=37",
      role: "user",
      status: "active",
      createdAt: now - day * 35
    },
    {
      uid: "demo-85580889223",
      username: "Kimly Heng",
      phoneNumber: "+855 80 889 223",
      email: "kimly.heng@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=58",
      role: "user",
      status: "disabled",
      createdAt: now - day * 28
    },
    {
      uid: "demo-85575334001",
      username: "Virak Seng",
      phoneNumber: "+855 75 334 001",
      email: "virak.seng@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=18",
      role: "user",
      status: "active",
      createdAt: now - day * 20
    },
    {
      uid: "demo-85564556782",
      username: "Nary Leng",
      phoneNumber: "+855 64 556 782",
      avatarUrl: "https://i.pravatar.cc/160?img=24",
      role: "user",
      status: "active",
      createdAt: now - day * 12
    },
    {
      uid: "demo-85584112339",
      username: "Sokhom Nheth",
      phoneNumber: "+855 84 112 339",
      email: "sokhom.nheth@example.com",
      avatarUrl: "https://i.pravatar.cc/160?img=62",
      role: "user",
      status: "active",
      createdAt: now - day * 4
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
// Bump when new rooms are added to MOCK_ROOMS. Existing browsers merge in the
// new entries without losing any admin edits to already-seeded rows.
const LISTINGS_SEED_VERSION = 2;

export function seedMockListings() {
  if (typeof window === "undefined") return;

  const seededVersion = Number(window.localStorage.getItem(LISTINGS_SEEDED_FLAG) ?? 0);

  let existing: Room[] = [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ROOMS_KEY);
    existing = raw ? (JSON.parse(raw) as Room[]) : [];
  } catch {
    existing = [];
  }

  if (seededVersion >= LISTINGS_SEED_VERSION) return;

  const existingIds = new Set(existing.map((r) => r.id));

  const additions: Room[] = MOCK_ROOMS.filter((r) => !existingIds.has(`mock-${r.id}`)).map((r) => ({
    ...r,
    id: `mock-${r.id}`,
    owner: {
      ...r.owner,
      id: resolveOwnerUid(r.owner.id)
    }
  }));

  const merged = [...additions, ...existing];
  window.localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(merged));
  window.localStorage.setItem(LISTINGS_SEEDED_FLAG, String(LISTINGS_SEED_VERSION));
  window.dispatchEvent(new Event(LOCAL_ROOMS_EVENT));
}

export function getAdminUsers(): AdminUser[] {
  if (typeof window === "undefined") return [];
  try {
    const seededVersion = Number(window.localStorage.getItem(USERS_SEEDED_FLAG) ?? 0);
    if (!seededVersion) {
      const initial = seedUsers();
      window.localStorage.setItem(USERS_KEY, JSON.stringify(initial));
      window.localStorage.setItem(USERS_SEEDED_FLAG, String(USERS_SEED_VERSION));
      return initial;
    }
    const raw = window.localStorage.getItem(USERS_KEY);
    let stored = raw ? (JSON.parse(raw) as AdminUser[]) : [];
    // Merge in any newly added demo users (by uid) when the seed version grows.
    if (seededVersion < USERS_SEED_VERSION) {
      const existingIds = new Set(stored.map((u) => u.uid));
      const additions = seedUsers().filter((u) => !existingIds.has(u.uid));
      if (additions.length > 0) {
        stored = [...stored, ...additions];
        window.localStorage.setItem(USERS_KEY, JSON.stringify(stored));
      }
      window.localStorage.setItem(USERS_SEEDED_FLAG, String(USERS_SEED_VERSION));
    }
    return stored;
  } catch {
    return [];
  }
}

function writeUsers(users: AdminUser[]) {
  safeSetItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(USERS_EVENT));
}

export async function addAdminUser(input: Omit<AdminUser, "uid" | "createdAt"> & { uid?: string }): Promise<AdminUser> {
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
  if (isFirebaseConfigured && db) {
    const data = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined));
    await setDoc(doc(db, "users", uid), data);
    return next;
  }
  writeUsers([next, ...getAdminUsers()]);
  return next;
}

// Upsert helper for the sign-up flow: register a new user in the admin
// directory, no-op if they're already there. Default role/status reflect a
// normal end-user account.
export async function ensureAdminUser(input: {
  uid: string;
  username: string;
  phoneNumber: string;
  email?: string;
  role?: "user" | "admin";
  status?: "active" | "disabled";
}): Promise<AdminUser> {
  const existing = getAdminUserById(input.uid);
  if (existing) return existing;
  return addAdminUser({
    uid: input.uid,
    username: input.username,
    phoneNumber: input.phoneNumber,
    email: input.email,
    role: input.role ?? "user",
    status: input.status ?? "active"
  });
}

export async function updateAdminUser(uid: string, patch: Partial<Omit<AdminUser, "uid">>) {
  if (isFirebaseConfigured && db) {
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    await updateDoc(doc(db, "users", uid), clean);
    return;
  }
  writeUsers(getAdminUsers().map((u) => (u.uid === uid ? { ...u, ...patch } : u)));
}

export async function deleteAdminUser(uid: string) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "users", uid));
    return;
  }
  writeUsers(getAdminUsers().filter((u) => u.uid !== uid));
}

export async function toggleAdminUserStatus(uid: string) {
  const user = getAdminUserById(uid);
  const nextStatus = user?.status === "active" ? "disabled" : "active";
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "users", uid), { status: nextStatus });
    return;
  }
  writeUsers(getAdminUsers().map((u) =>
    u.uid === uid ? { ...u, status: nextStatus } : u
  ) as AdminUser[]);
}

export function getAdminUserById(uid: string): AdminUser | undefined {
  if (isFirebaseConfigured) return usersCache.get(uid);
  return getAdminUsers().find((u) => u.uid === uid);
}

export function useAdminUsers(): AdminUser[] {
  const [users, setUsers] = useState<AdminUser[]>([]);
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      // No orderBy — documents without createdAt are excluded by Firestore when
      // orderBy is used. Sort client-side so all users are always returned.
      const q = collection(db, "users");
      return onSnapshot(q, (snap) => {
        const list = snap.docs
          .map((d) => ({ uid: d.id, ...d.data() } as AdminUser))
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        usersCache.clear();
        list.forEach((u) => usersCache.set(u.uid, u));
        setUsers(list);
      }, () => {});
    }
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

// Reads the current user's own Firestore document to check their role.
// Avoids the timing bug where usersCache is empty on first render.
export function useIsAdmin(session: Session | null): { admin: boolean; loading: boolean } {
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setAdmin(false); setLoading(false); return; }
    if (isFirebaseConfigured && db && auth) {
      let unsub: (() => void) | undefined;
      // Wait for Firebase Auth to finish initialising before reading Firestore,
      // otherwise the request goes out unauthenticated and gets permission-denied.
      auth.authStateReady().then(() => {
        if (!auth!.currentUser) { setAdmin(false); setLoading(false); return; }
        unsub = onSnapshot(doc(db!, "users", session.uid), (snap) => {
          const data = snap.data();
          setAdmin(data?.role === "admin" && data?.status === "active");
          setLoading(false);
        }, () => { setAdmin(false); setLoading(false); });
      });
      return () => unsub?.();
    }
    // Demo mode: synchronous check
    setAdmin(isAdmin(session));
    setLoading(false);
  }, [session?.uid]);

  return { admin, loading };
}

// ---------- Mock notifications ----------

export type AdminNotificationKind =
  | "user-registered"
  | "listing-posted"
  | "listing-pending"
  | "listing-flagged";

export interface AdminNotification {
  id: string;
  kind: AdminNotificationKind;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  relatedId?: string;
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
      body: "Channary Sok joined Joul with phone +855 92 666 808.",
      createdAt: now - 12 * min,
      read: false,
      relatedId: "demo-85592666808"
    },
    {
      id: "n2",
      kind: "listing-posted",
      title: "New listing posted",
      body: "Sokha Chan published \"Designer 1BR in BKK1\" for $480/month.",
      createdAt: now - 55 * min,
      read: false,
      relatedId: "16"
    },
    {
      id: "n4",
      kind: "user-registered",
      title: "New user registered",
      body: "Vannak Heng joined Joul with phone +855 89 320 117.",
      createdAt: now - 26 * 60 * min,
      read: true,
      relatedId: "demo-85589320117"
    },
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
  safeSetItem(NOTIF_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(NOTIF_EVENT));
}

// Record an admin-visible incoming event (new sign-up, new listing, report, …).
// Call this from the user-facing flow that triggers the event, NOT from
// seeders — seeders write the rooms/users store directly to bypass this path.
export async function pushIncomingNotification(input: {
  kind: AdminNotificationKind;
  title: string;
  body: string;
  relatedId?: string;
}): Promise<AdminNotification> {
  if (isFirebaseConfigured && db) {
    const data = {
      kind: input.kind,
      title: input.title,
      body: input.body,
      createdAt: Date.now(),
      read: false,
      ...(input.relatedId ? { relatedId: input.relatedId } : {})
    };
    const ref = await addDoc(collection(db, "admin_notifications"), data);
    return { id: ref.id, ...data };
  }
  const n: AdminNotification = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: input.kind,
    title: input.title,
    body: input.body,
    createdAt: Date.now(),
    read: false,
    relatedId: input.relatedId
  };
  writeNotifications([n, ...getAdminNotifications()]);
  return n;
}

export async function markNotificationRead(id: string, read = true) {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "admin_notifications", id), { read });
    return;
  }
  writeNotifications(getAdminNotifications().map((n) => (n.id === id ? { ...n, read } : n)));
}

export async function markAllNotificationsRead() {
  if (isFirebaseConfigured && db) {
    const snap = await import("firebase/firestore").then(({ getDocs, query, collection, where }) =>
      getDocs(query(collection(db!, "admin_notifications"), where("read", "==", false)))
    );
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
    return;
  }
  writeNotifications(getAdminNotifications().map((n) => ({ ...n, read: true })));
}

export async function deleteNotification(id: string) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "admin_notifications", id));
    return;
  }
  writeNotifications(getAdminNotifications().filter((n) => n.id !== id));
}

export function useAdminNotifications(): AdminNotification[] {
  const [list, setList] = useState<AdminNotification[]>([]);
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "admin_notifications"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => {
        setList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminNotification)));
      }, () => {});
    }
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

// ---------- Outbound notifications (admin → users) ----------
//
// The admin can compose messages, save reusable templates, and dispatch them to
// a chosen audience. Like the rest of this section, everything lives in
// localStorage — "sending" just records a campaign row so the admin sees a
// history of what would have gone out.

export interface AdminOutboundTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export type AdminOutboundAudience =
  | { kind: "all" }
  | { kind: "role"; role: "user" | "admin" }
  | { kind: "specific"; uids: string[] };

export interface AdminOutboundCampaign {
  id: string;
  title: string;
  body: string;
  audience: AdminOutboundAudience;
  recipientCount: number;
  recipientSummary: string;
  sentAt: number;
}

const TEMPLATES_KEY = "findroom.admin-outbound-templates";
const TEMPLATES_EVENT = "findroom:admin-outbound-templates-change";
const TEMPLATES_SEEDED_FLAG = "findroom.admin-outbound-templates-seeded";

const CAMPAIGNS_KEY = "findroom.admin-outbound-campaigns";
const CAMPAIGNS_EVENT = "findroom:admin-outbound-campaigns-change";
const CAMPAIGNS_SEEDED_FLAG = "findroom.admin-outbound-campaigns-seeded";

function seedCampaigns(): AdminOutboundCampaign[] {
  const now = Date.now();
  const min = 60_000;
  const hr = 60 * min;
  return [
    {
      id: "camp-seed-bkk1",
      title: "New rooms added in BKK1",
      body: "Hi {{username}}, 8 new verified listings just dropped in Boeng Keng Kang. Prices start at $150/month. Tap to explore them now.",
      audience: { kind: "all" },
      recipientCount: 8,
      recipientSummary: "Everyone (8)",
      sentAt: now - 5 * hr
    },
    {
      id: "camp-seed-maintenance",
      title: "Scheduled maintenance notice",
      body: "Hi {{username}}, Joul will be briefly unavailable on Sunday from 1–3 AM (ICT) for routine maintenance. We apologise for any inconvenience.",
      audience: { kind: "all" },
      recipientCount: 8,
      recipientSummary: "Everyone (8)",
      sentAt: now - 45 * min
    }
  ];
}

function seedTemplates(): AdminOutboundTemplate[] {
  const now = Date.now();
  return [
    {
      id: "tpl-welcome",
      name: "Welcome new user",
      title: "Welcome to Joul!",
      body: "Hi {{username}}, thanks for joining Joul. Browse listings, save favorites, and reach out to owners directly.",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "tpl-maintenance",
      name: "Maintenance notice",
      title: "Scheduled maintenance",
      body: "Hi {{username}}, Joul will be briefly unavailable on Sunday from 1–3 AM (ICT) for maintenance. Sorry for any inconvenience.",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "tpl-promo",
      name: "Promo / announcement",
      title: "New in BKK1: 12 fresh listings",
      body: "Hi {{username}}, we just added 12 new rooms in your favorite neighborhood. Tap to explore them now.",
      createdAt: now,
      updatedAt: now
    }
  ];
}

export function getOutboundTemplates(): AdminOutboundTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const seeded = window.localStorage.getItem(TEMPLATES_SEEDED_FLAG);
    if (!seeded) {
      const initial = seedTemplates();
      window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(initial));
      window.localStorage.setItem(TEMPLATES_SEEDED_FLAG, "1");
      return initial;
    }
    const raw = window.localStorage.getItem(TEMPLATES_KEY);
    return raw ? (JSON.parse(raw) as AdminOutboundTemplate[]) : [];
  } catch {
    return [];
  }
}

function writeTemplates(list: AdminOutboundTemplate[]) {
  safeSetItem(TEMPLATES_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(TEMPLATES_EVENT));
}

export async function addOutboundTemplate(input: { name: string; title: string; body: string }): Promise<AdminOutboundTemplate> {
  const now = Date.now();
  const tpl: AdminOutboundTemplate = {
    id: `tpl-${now}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim() || "Untitled template",
    title: input.title,
    body: input.body,
    createdAt: now,
    updatedAt: now
  };
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "notification_templates", tpl.id), tpl);
    return tpl;
  }
  writeTemplates([tpl, ...getOutboundTemplates()]);
  return tpl;
}

export async function updateOutboundTemplate(id: string, patch: Partial<Pick<AdminOutboundTemplate, "name" | "title" | "body">>) {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "notification_templates", id), { ...patch, updatedAt: Date.now() });
    return;
  }
  writeTemplates(getOutboundTemplates().map((t) =>
    t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t
  ));
}

export async function deleteOutboundTemplate(id: string) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "notification_templates", id));
    return;
  }
  writeTemplates(getOutboundTemplates().filter((t) => t.id !== id));
}

export function useOutboundTemplates(): AdminOutboundTemplate[] {
  const [list, setList] = useState<AdminOutboundTemplate[]>([]);
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "notification_templates"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => {
        setList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminOutboundTemplate)));
      }, () => {});
    }
    const sync = () => setList(getOutboundTemplates());
    sync();
    window.addEventListener(TEMPLATES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TEMPLATES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}

export function getOutboundCampaigns(): AdminOutboundCampaign[] {
  if (typeof window === "undefined") return [];
  try {
    if (!window.localStorage.getItem(CAMPAIGNS_SEEDED_FLAG)) {
      const initial = seedCampaigns();
      window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(initial));
      window.localStorage.setItem(CAMPAIGNS_SEEDED_FLAG, "1");
      return initial;
    }
    const raw = window.localStorage.getItem(CAMPAIGNS_KEY);
    return raw ? (JSON.parse(raw) as AdminOutboundCampaign[]) : [];
  } catch {
    return [];
  }
}

function writeCampaigns(list: AdminOutboundCampaign[]) {
  safeSetItem(CAMPAIGNS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CAMPAIGNS_EVENT));
}

// Resolve the concrete list of users an audience targets. Disabled accounts are
// dropped so the admin sees a realistic recipient count.
export function resolveAudience(audience: AdminOutboundAudience): AdminUser[] {
  const users = isFirebaseConfigured
    ? Array.from(usersCache.values()).filter((u) => u.status === "active")
    : getAdminUsers().filter((u) => u.status === "active");
  if (audience.kind === "all") return users;
  if (audience.kind === "role") return users.filter((u) => u.role === audience.role);
  const set = new Set(audience.uids);
  return users.filter((u) => set.has(u.uid));
}

function audienceSummary(audience: AdminOutboundAudience, count: number): string {
  if (audience.kind === "all") return `Everyone (${count})`;
  if (audience.kind === "role") {
    const label = audience.role === "admin" ? "Admins" : "Users";
    return `${label} (${count})`;
  }
  if (count <= 3) {
    const names = resolveAudience(audience).map((u) => u.username).join(", ");
    return names || `0 users`;
  }
  return `${count} users`;
}

export async function sendAdminOutbound(input: {
  title: string;
  body: string;
  audience: AdminOutboundAudience;
}): Promise<AdminOutboundCampaign | null> {
  const recipients = resolveAudience(input.audience);
  if (recipients.length === 0) return null;
  const campaign: AdminOutboundCampaign = {
    id: `camp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title,
    body: input.body,
    audience: input.audience,
    recipientCount: recipients.length,
    recipientSummary: audienceSummary(input.audience, recipients.length),
    sentAt: Date.now()
  };
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "notification_campaigns", campaign.id), campaign);
    return campaign;
  }
  writeCampaigns([campaign, ...getOutboundCampaigns()]);
  return campaign;
}

export async function deleteOutboundCampaign(id: string) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "notification_campaigns", id));
    return;
  }
  writeCampaigns(getOutboundCampaigns().filter((c) => c.id !== id));
}

export function useOutboundCampaigns(): AdminOutboundCampaign[] {
  const [list, setList] = useState<AdminOutboundCampaign[]>([]);
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "notification_campaigns"), orderBy("sentAt", "desc"));
      return onSnapshot(q, (snap) => {
        setList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminOutboundCampaign)));
      }, () => {});
    }
    const sync = () => setList(getOutboundCampaigns());
    sync();
    window.addEventListener(CAMPAIGNS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CAMPAIGNS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}

// ---------- User-side notifications ----------
//
// Each campaign is a single record on the admin side; we derive a per-user
// view of it on demand instead of fanning out copies. Read state lives in
// `findroom.user-read-campaigns.<uid>` (a JSON array of campaign ids).

export interface UserNotification {
  id: string; // = campaign id
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
}

const USER_NOTIF_EVENT = "findroom:user-notifications-change";
const USER_READ_KEY_PREFIX = "findroom.user-read-campaigns.";
const userReadKey = (uid: string) => `${USER_READ_KEY_PREFIX}${uid}`;

function getUserReadCampaignIds(uid: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(userReadKey(uid));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

// New sign-ups aren't in the admin directory, so default to a synthetic
// "user" role record so they still receive "all" and role=user broadcasts.
function userContextForSession(session: {
  uid: string;
  username?: string;
  phoneNumber?: string;
}): AdminUser {
  const existing = getAdminUserById(session.uid);
  if (existing) return existing;
  return {
    uid: session.uid,
    username: session.username ?? "User",
    phoneNumber: session.phoneNumber ?? "",
    role: "user",
    status: "active",
    createdAt: Date.now()
  };
}

function campaignMatchesUser(audience: AdminOutboundAudience, user: AdminUser): boolean {
  if (audience.kind === "all") return true;
  if (audience.kind === "role") return audience.role === user.role;
  return audience.uids.includes(user.uid);
}

export function getUserNotifications(session: {
  uid: string;
  username?: string;
  phoneNumber?: string;
} | null): UserNotification[] {
  if (!session) return [];
  const user = userContextForSession(session);
  const readSet = new Set(getUserReadCampaignIds(session.uid));
  return getOutboundCampaigns()
    .filter((c) => campaignMatchesUser(c.audience, user))
    .map((c) => ({
      id: c.id,
      title: fillPlaceholders(c.title, user),
      body: fillPlaceholders(c.body, user),
      createdAt: c.sentAt,
      read: readSet.has(c.id)
    }));
}

export async function markUserCampaignRead(uid: string, campaignId: string, read = true) {
  if (isFirebaseConfigured && db) {
    const { arrayUnion, arrayRemove } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", uid), {
      readCampaignIds: read ? arrayUnion(campaignId) : arrayRemove(campaignId)
    });
    return;
  }
  if (typeof window === "undefined") return;
  const ids = new Set(getUserReadCampaignIds(uid));
  if (read) ids.add(campaignId);
  else ids.delete(campaignId);
  window.localStorage.setItem(userReadKey(uid), JSON.stringify([...ids]));
  window.dispatchEvent(new Event(USER_NOTIF_EVENT));
}

export async function markAllUserCampaignsRead(uid: string, campaignIds: string[]) {
  if (isFirebaseConfigured && db) {
    const { arrayUnion } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", uid), {
      readCampaignIds: arrayUnion(...campaignIds)
    });
    return;
  }
  if (typeof window === "undefined") return;
  const merged = new Set([...getUserReadCampaignIds(uid), ...campaignIds]);
  window.localStorage.setItem(userReadKey(uid), JSON.stringify([...merged]));
  window.dispatchEvent(new Event(USER_NOTIF_EVENT));
}

export function useUserNotifications(session: {
  uid: string;
  username?: string;
  phoneNumber?: string;
} | null): UserNotification[] {
  const [list, setList] = useState<UserNotification[]>([]);
  useEffect(() => {
    if (!session) { setList([]); return; }

    if (isFirebaseConfigured && db) {
      let campaigns: AdminOutboundCampaign[] = [];
      let readIds = new Set<string>();

      const derive = () => {
        const user = userContextForSession(session);
        setList(
          campaigns
            .filter((c) => campaignMatchesUser(c.audience, user))
            .map((c) => ({
              id: c.id,
              title: fillPlaceholders(c.title, user),
              body: fillPlaceholders(c.body, user),
              createdAt: c.sentAt,
              read: readIds.has(c.id)
            }))
        );
      };

      const unsubCampaigns = onSnapshot(
        query(collection(db, "notification_campaigns"), orderBy("sentAt", "desc")),
        (snap) => {
          campaigns = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminOutboundCampaign));
          derive();
        },
        () => {}
      );

      const unsubUser = onSnapshot(doc(db, "users", session.uid), (snap) => {
        const data = snap.data();
        readIds = new Set<string>(Array.isArray(data?.readCampaignIds) ? data.readCampaignIds : []);
        derive();
      }, () => {});

      return () => { unsubCampaigns(); unsubUser(); };
    }

    const sync = () => setList(getUserNotifications(session));
    sync();
    window.addEventListener(USER_NOTIF_EVENT, sync);
    window.addEventListener(CAMPAIGNS_EVENT, sync);
    window.addEventListener(USERS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(USER_NOTIF_EVENT, sync);
      window.removeEventListener(CAMPAIGNS_EVENT, sync);
      window.removeEventListener(USERS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [session]);
  return list;
}

// Expand a single `{{placeholder}}` against an AdminUser. Unknown placeholders
// are left untouched so authors notice typos in the preview.
export function fillPlaceholders(text: string, user: AdminUser): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    switch (key) {
      case "username":
        return user.username;
      case "phone":
        return user.phoneNumber;
      case "email":
        return user.email ?? "";
      default:
        return match;
    }
  });
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
  // Auto-occupy: number of days of inactivity after which an Available
  // listing is automatically treated as Occupied. Min 7.
  autoOccupyDays: number;
  // Automated, event-triggered messages (e.g. auto-welcome on signup).
  // Managed here, NOT in the manual Messages/Sent-history menu.
  autoMessages: AutoMessage[];
}

// Event-triggered messages. The key identifies the lifecycle event that
// fires the message; title/message support {{username}} {{phone}} {{email}}.
export type AutoMessageKey =
  | "welcome"
  | "listing-published"
  | "listing-flagged"
  | "listing-occupied";

export interface AutoMessage {
  key: AutoMessageKey;
  enabled: boolean;
  title: string;
  message: string;
}

export const DEFAULT_AUTO_MESSAGES: AutoMessage[] = [
  {
    key: "welcome",
    enabled: true,
    title: "Welcome to Joul!",
    message:
      "Hi {{username}}, your account is all set. Start exploring hundreds of verified listings across Cambodia — or post your own room for free."
  },
  {
    key: "listing-published",
    enabled: true,
    title: "Your listing is live",
    message:
      "Hi {{username}}, your room is now published on Joul and visible to renters. Good luck finding a tenant!"
  },
  {
    key: "listing-flagged",
    enabled: true,
    title: "Your listing was flagged",
    message:
      "Hi {{username}}, one of your listings was flagged by our moderation team and is under review. We'll be in touch shortly."
  },
  {
    key: "listing-occupied",
    enabled: false,
    title: "Listing marked as occupied",
    message:
      "Hi {{username}}, your listing was automatically marked Occupied after a period of inactivity. Reactivate it anytime from your listings."
  }
];

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
  siteName: "Joul.KH",
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
  exchangeRateKhrPerUsd: 4100,
  autoOccupyDays: 30,
  autoMessages: DEFAULT_AUTO_MESSAGES.map((m) => ({ ...m }))
};

const SETTINGS_KEY = "findroom.admin-settings";
const SETTINGS_EVENT = "findroom:admin-settings-change";

export function getAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AdminSettings>;
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    // Rebuild from the known set so newly-added messages appear and removed
    // ones drop off, while preserving the admin's saved edits per key.
    merged.autoMessages = DEFAULT_AUTO_MESSAGES.map((def) => {
      const stored = parsed.autoMessages?.find((m) => m.key === def.key);
      return stored
        ? { key: def.key, enabled: stored.enabled, title: stored.title, message: stored.message }
        : { ...def };
    });
    return merged;
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
    TEMPLATES_KEY,
    TEMPLATES_SEEDED_FLAG,
    CAMPAIGNS_KEY,
    CAMPAIGNS_SEEDED_FLAG,
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
  window.dispatchEvent(new Event(TEMPLATES_EVENT));
  window.dispatchEvent(new Event(CAMPAIGNS_EVENT));
  window.dispatchEvent(new Event("findroom:local-rooms-change"));
}
