"use client";

import { useEffect, useState } from "react";
import type { Room } from "./types";

const KEY = "findroom.local-rooms";
const EVENT = "findroom:local-rooms-change";

export function getLocalRooms(): Room[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Room[]) : [];
  } catch {
    return [];
  }
}

export function addLocalRoom(room: Room) {
  if (typeof window === "undefined") return;
  const rooms = [room, ...getLocalRooms()];
  window.localStorage.setItem(KEY, JSON.stringify(rooms));
  window.dispatchEvent(new Event(EVENT));
}

export function getLocalRoomById(id: string): Room | undefined {
  return getLocalRooms().find((r) => r.id === id);
}

export function useLocalRooms(): Room[] {
  const [rooms, setRooms] = useState<Room[]>([]);
  useEffect(() => {
    const sync = () => setRooms(getLocalRooms());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return rooms;
}
