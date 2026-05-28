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

// Upsert helper for the sign-up flow: register a new user in the admin
// directory, no-op if they're already there. Default role/status reflect a
// normal end-user account.
export function ensureAdminUser(input: {
  uid: string;
  username: string;
  phoneNumber: string;
  email?: string;
  role?: "user" | "admin";
  status?: "active" | "disabled";
}): AdminUser {
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
  // Optional id that lets the admin jump to the related record from a row.
  // For `user-registered` it's the user uid. For `listing-posted` and
  // `listing-flagged` it's the room id. `system` rows leave it undefined.
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
      id: "n3",
      kind: "listing-flagged",
      title: "Listing reported by a user",
      body: "A renter flagged \"Cosy room in Tuol Tom Poung\" — please review.",
      createdAt: now - 4 * 60 * min,
      read: false,
      relatedId: "23"
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

// Record an admin-visible incoming event (new sign-up, new listing, report, …).
// Call this from the user-facing flow that triggers the event, NOT from
// seeders — seeders write the rooms/users store directly to bypass this path.
export function pushIncomingNotification(input: {
  kind: AdminNotificationKind;
  title: string;
  body: string;
  relatedId?: string;
}): AdminNotification {
  const n: AdminNotification = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: input.kind,
    title: input.title,
    body: input.body,
    createdAt: Date.now(),
    read: false,
    relatedId: input.relatedId
  };
  // Make sure the store is initialized — getAdminNotifications seeds on
  // first read, which we want even if no admin has visited yet.
  const list = [n, ...getAdminNotifications()];
  writeNotifications(list);
  return n;
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
      id: "tpl-listing-approved",
      name: "Listing approved",
      title: "Your listing is live",
      body: "Hi {{username}}, your listing has been approved and is now visible on Joul. Tenants can contact you on {{phone}}.",
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
  window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(TEMPLATES_EVENT));
}

export function addOutboundTemplate(input: { name: string; title: string; body: string }): AdminOutboundTemplate {
  const now = Date.now();
  const tpl: AdminOutboundTemplate = {
    id: `tpl-${now}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim() || "Untitled template",
    title: input.title,
    body: input.body,
    createdAt: now,
    updatedAt: now
  };
  writeTemplates([tpl, ...getOutboundTemplates()]);
  return tpl;
}

export function updateOutboundTemplate(id: string, patch: Partial<Pick<AdminOutboundTemplate, "name" | "title" | "body">>) {
  const list = getOutboundTemplates().map((t) =>
    t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t
  );
  writeTemplates(list);
}

export function deleteOutboundTemplate(id: string) {
  writeTemplates(getOutboundTemplates().filter((t) => t.id !== id));
}

export function useOutboundTemplates(): AdminOutboundTemplate[] {
  const [list, setList] = useState<AdminOutboundTemplate[]>([]);
  useEffect(() => {
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
    const raw = window.localStorage.getItem(CAMPAIGNS_KEY);
    return raw ? (JSON.parse(raw) as AdminOutboundCampaign[]) : [];
  } catch {
    return [];
  }
}

function writeCampaigns(list: AdminOutboundCampaign[]) {
  window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CAMPAIGNS_EVENT));
}

// Resolve the concrete list of users an audience targets. Disabled accounts are
// dropped so the admin sees a realistic recipient count.
export function resolveAudience(audience: AdminOutboundAudience): AdminUser[] {
  const users = getAdminUsers().filter((u) => u.status === "active");
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

export function sendAdminOutbound(input: {
  title: string;
  body: string;
  audience: AdminOutboundAudience;
}): AdminOutboundCampaign | null {
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
  writeCampaigns([campaign, ...getOutboundCampaigns()]);
  return campaign;
}

export function deleteOutboundCampaign(id: string) {
  writeCampaigns(getOutboundCampaigns().filter((c) => c.id !== id));
}

export function useOutboundCampaigns(): AdminOutboundCampaign[] {
  const [list, setList] = useState<AdminOutboundCampaign[]>([]);
  useEffect(() => {
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

export function markUserCampaignRead(uid: string, campaignId: string, read = true) {
  if (typeof window === "undefined") return;
  const ids = new Set(getUserReadCampaignIds(uid));
  if (read) ids.add(campaignId);
  else ids.delete(campaignId);
  window.localStorage.setItem(userReadKey(uid), JSON.stringify([...ids]));
  window.dispatchEvent(new Event(USER_NOTIF_EVENT));
}

export function markAllUserCampaignsRead(uid: string, campaignIds: string[]) {
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
  autoOccupyDays: 30
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
    TEMPLATES_KEY,
    TEMPLATES_SEEDED_FLAG,
    CAMPAIGNS_KEY,
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
