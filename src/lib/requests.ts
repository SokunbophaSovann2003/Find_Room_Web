"use client";

// "Help me find a room" — renter requests for the team to find a room on their
// behalf. Stored in Firestore (room_requests) when configured, with a
// localStorage fallback in demo mode. Admins read/manage; renters create their
// own. Mirrors the rooms/campaigns service pattern.

import { useEffect, useState } from "react";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

export type RoomRequestStatus = "open" | "handled" | "closed";

export interface RoomRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  requesterTelegram: string; // optional, "" if none
  budgetMin: number | null;
  budgetMax: number | null;
  province: string;
  district: string;
  area: string;
  propertyType: string; // PropertyType value or "any"
  bedrooms: number | null;
  moveInDate: string;   // ISO yyyy-mm-dd or ""
  notes: string;
  status: RoomRequestStatus;
  createdAt: number;
}

export type NewRoomRequest = Omit<RoomRequest, "id" | "status" | "createdAt">;

const LS_KEY = "findroom.room-requests";
const EVENT = "findroom:room-requests-change";

function getLocal(): RoomRequest[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(LS_KEY) || "[]") as RoomRequest[]; } catch { return []; }
}
function writeLocal(list: RoomRequest[]) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
}

// Strip undefined so Firestore never rejects the write.
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function submitRoomRequest(req: NewRoomRequest): Promise<string> {
  const data = { ...req, status: "open" as const, createdAt: Date.now() };
  if (!isFirebaseConfigured || !db) {
    const id = `local-${Date.now()}`;
    writeLocal([{ id, ...data }, ...getLocal()]);
    return id;
  }
  const ref = await addDoc(collection(db, "room_requests"), clean(data));
  return ref.id;
}

export async function updateRoomRequestStatus(id: string, status: RoomRequestStatus): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    writeLocal(getLocal().map((r) => (r.id === id ? { ...r, status } : r)));
    return;
  }
  await updateDoc(doc(db, "room_requests", id), { status });
}

export async function deleteRoomRequest(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    writeLocal(getLocal().filter((r) => r.id !== id));
    return;
  }
  await deleteDoc(doc(db, "room_requests", id));
}

// Admin-only list (the page is gated by AdminShell, so the reader is an admin).
export function useRoomRequests(): RoomRequest[] {
  const [list, setList] = useState<RoomRequest[]>([]);
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "room_requests"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => {
        setList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RoomRequest)));
      }, () => {});
    }
    const sync = () => setList(getLocal());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return list;
}
