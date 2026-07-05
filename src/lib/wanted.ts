"use client";

// "I want this type of room" — public renter demand posts. A renter posts what
// they're looking for; landlords whose OWN published rooms match (location +
// price + type) see it in their in-app matches inbox and contact the renter
// directly. Matching happens client-side on the landlord's device against
// their own rooms — no cross-user writes, no server fan-out.

import { useEffect, useState } from "react";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type { Room } from "./types";

export type WantedStatus = "active" | "closed";

export interface RoomWanted {
  id: string;
  renterId: string;
  renterName: string;
  renterPhones: string[];    // one or more contact numbers
  renterTelegrams: string[]; // optional Telegram handles/numbers
  budgetMin: number | null;
  budgetMax: number | null;
  province: string;
  district: string;
  area: string;
  propertyType: string; // PropertyType value or "any"
  bedrooms: number | null;
  notes: string;
  status: WantedStatus;
  createdAt: number;
}

export type NewRoomWanted = Omit<RoomWanted, "id" | "status" | "createdAt">;

const LS_KEY = "findroom.room-wanted";
const EVENT = "findroom:room-wanted-change";

function getLocal(): RoomWanted[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(LS_KEY) || "[]") as RoomWanted[]; } catch { return []; }
}
function writeLocal(list: RoomWanted[]) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
}
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function submitRoomWanted(req: NewRoomWanted): Promise<string> {
  const data = { ...req, status: "active" as const, createdAt: Date.now() };
  if (!isFirebaseConfigured || !db) {
    const id = `local-${Date.now()}`;
    writeLocal([{ id, ...data }, ...getLocal()]);
    return id;
  }
  const ref = await addDoc(collection(db, "room_wanted"), clean(data));
  return ref.id;
}

export async function closeRoomWanted(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    writeLocal(getLocal().map((w) => (w.id === id ? { ...w, status: "closed" } : w)));
    return;
  }
  await updateDoc(doc(db, "room_wanted", id), { status: "closed" });
}

export async function deleteRoomWanted(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    writeLocal(getLocal().filter((w) => w.id !== id));
    return;
  }
  await deleteDoc(doc(db, "room_wanted", id));
}

// Does an active demand post match a specific room? Location + price + type.
export function wantedMatchesRoom(w: RoomWanted, room: Room): boolean {
  const provinceOk = !w.province || w.province === room.city;
  const districtOk = !w.district || w.district === room.district;
  const priceOk =
    (w.budgetMin == null || room.price >= w.budgetMin) &&
    (w.budgetMax == null || room.price <= w.budgetMax);
  const typeOk = w.propertyType === "any" || w.propertyType === room.type;
  return provinceOk && districtOk && priceOk && typeOk;
}

// Live feed of all ACTIVE demand posts (used by the landlord matching view and
// the renter's own posts list).
export function useActiveWanted(): RoomWanted[] {
  const [list, setList] = useState<RoomWanted[]>([]);
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      // Single-field orderBy only (no composite index needed); filter to
      // active client-side. Combining where(status) + orderBy(createdAt) would
      // require a custom composite index.
      const q = query(collection(db, "room_wanted"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => {
        setList(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as RoomWanted))
            .filter((w) => w.status === "active")
        );
      }, () => {});
    }
    const sync = () => setList(getLocal().filter((w) => w.status === "active"));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return list;
}

// Demand posts that match ANY of the landlord's own published rooms. Excludes
// the landlord's own posts. This is the landlord's "notification" feed.
export function matchingWantedFor(
  ownerUid: string | undefined,
  ownRooms: Room[],
  allWanted: RoomWanted[]
): RoomWanted[] {
  if (!ownerUid) return [];
  const published = ownRooms.filter((r) => r.owner.id === ownerUid && (r.status === "published" || r.status === undefined));
  if (published.length === 0) return [];
  return allWanted.filter(
    (w) => w.renterId !== ownerUid && published.some((room) => wantedMatchesRoom(w, room))
  );
}
