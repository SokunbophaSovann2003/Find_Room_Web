"use client";

// "Help me find a room" — renter requests, submitted like a simple form: the
// renter submits once and it appears for admins. No status, approval, or edit
// flow. Stored in Firestore (room_requests) when configured, with a
// localStorage fallback in demo mode. Renters create their own; admins read all
// and may delete.

import { useEffect, useState } from "react";
import {
  collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, where
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

export interface RoomRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterPhones: string[];    // one or more contact numbers
  requesterTelegrams: string[]; // optional Telegram handles/numbers
  budgetMin: number | null;
  budgetMax: number | null;
  province: string;
  district: string;
  area: string;
  propertyType: string; // PropertyType value or "any"
  bedrooms: number | null;
  moveInDate: string;   // ISO yyyy-mm-dd or ""
  notes: string;
  createdAt: number;
}

export type NewRoomRequest = Omit<RoomRequest, "id" | "createdAt">;

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
  const data = { ...req, createdAt: Date.now() };
  if (!isFirebaseConfigured || !db) {
    const id = `local-${Date.now()}`;
    writeLocal([{ id, ...data }, ...getLocal()]);
    return id;
  }
  const ref = await addDoc(collection(db, "room_requests"), clean(data));
  return ref.id;
}

export async function deleteRoomRequest(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    writeLocal(getLocal().filter((r) => r.id !== id));
    return;
  }
  await deleteDoc(doc(db, "room_requests", id));
}

// A signed-in renter's own requests, for their Activity view. Filtered by
// requesterId so Firestore rules permit the read (owner-scoped). Sorted
// client-side to avoid needing a composite index for where + orderBy.
export function useMyRoomRequests(uid: string | undefined): RoomRequest[] {
  const [list, setList] = useState<RoomRequest[]>([]);
  useEffect(() => {
    if (!uid) { setList([]); return; }
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "room_requests"), where("requesterId", "==", uid));
      return onSnapshot(q, (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RoomRequest));
        rows.sort((a, b) => b.createdAt - a.createdAt);
        setList(rows);
      }, () => {});
    }
    const sync = () =>
      setList(getLocal().filter((r) => r.requesterId === uid).sort((a, b) => b.createdAt - a.createdAt));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, [uid]);
  return list;
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
