"use client";

// Unified rooms service.
// When Firebase is configured, all reads/writes go to Firestore so every
// user sees the same data. When it's not (demo/dev with no .env.local), the
// service falls back to localStorage so the UI still works out of the box.

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { deleteRoomPhotos } from "./storage";
import type { Room } from "./types";
import {
  getLocalRooms,
  addLocalRoom,
  updateLocalRoom as localUpdateRoom,
  deleteLocalRoom as localDeleteRoom,
  getLocalRoomById
} from "./local-rooms";

export { seedSampleListings } from "./local-rooms";

function roomDoc(id: string) {
  return doc(db!, "rooms", id);
}

function roomsCol() {
  return collection(db!, "rooms");
}

// Recursively remove undefined values so Firestore setDoc/updateDoc never
// receives them (the SDK throws on undefined field values).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndefined(obj: Record<string, unknown>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [
        k,
        v && typeof v === "object" && !Array.isArray(v)
          ? stripUndefined(v as Record<string, unknown>)
          : v
      ])
  );
}

// Generate a room ID appropriate for the current backend.
// Firebase mode: Firestore auto-ID format. Demo mode: stable local prefix.
export function generateRoomId(): string {
  if (isFirebaseConfigured && db) {
    return doc(roomsCol()).id;
  }
  return `local-${Date.now()}`;
}

function toRoom(id: string, data: Record<string, unknown>): Room {
  return { id, ...data } as Room;
}

export async function addRoom(room: Room): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    addLocalRoom(room);
    return;
  }
  const { id, ...data } = room;
  await setDoc(roomDoc(id), stripUndefined({
    ...data,
    lastActivityAt: data.lastActivityAt ?? Date.now()
  }));
}

export async function updateRoom(id: string, patch: Partial<Room>): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    localUpdateRoom(id, patch);
    return;
  }
  await updateDoc(roomDoc(id), stripUndefined({
    ...patch,
    lastActivityAt: patch.lastActivityAt ?? Date.now()
  }));
}

export async function deleteRoom(id: string, ownerId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    localDeleteRoom(id);
    return;
  }
  await deleteRoomPhotos(ownerId, id);
  await deleteDoc(roomDoc(id));
}

export async function getRoomById(id: string): Promise<Room | undefined> {
  if (!isFirebaseConfigured || !db) {
    return getLocalRoomById(id);
  }
  const snap = await getDoc(roomDoc(id));
  if (!snap.exists()) return undefined;
  return toRoom(snap.id, snap.data());
}

export function useRooms(): Room[] {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      const sync = () => setRooms(getLocalRooms());
      sync();
      window.addEventListener("findroom:local-rooms-change", sync);
      window.addEventListener("storage", sync);
      return () => {
        window.removeEventListener("findroom:local-rooms-change", sync);
        window.removeEventListener("storage", sync);
      };
    }

    const q = query(roomsCol(), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => toRoom(d.id, d.data())));
    }, () => {});
    return unsub;
  }, []);

  return rooms;
}
