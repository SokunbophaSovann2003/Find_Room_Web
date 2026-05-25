"use client";

import { useEffect, useState } from "react";
import type { Owner, Room } from "./types";

const KEY = "findroom.local-rooms";
const EVENT = "findroom:local-rooms-change";
const SEEDED_PREFIX = "findroom.seeded.";

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

export function updateLocalRoom(id: string, patch: Partial<Room>) {
  if (typeof window === "undefined") return;
  const rooms = getLocalRooms().map((r) => (r.id === id ? { ...r, ...patch } : r));
  window.localStorage.setItem(KEY, JSON.stringify(rooms));
  window.dispatchEvent(new Event(EVENT));
}

export function deleteLocalRoom(id: string) {
  if (typeof window === "undefined") return;
  const rooms = getLocalRooms().filter((r) => r.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(rooms));
  window.dispatchEvent(new Event(EVENT));
}

export function getLocalRoomById(id: string): Room | undefined {
  return getLocalRooms().find((r) => r.id === id);
}

// Demo seed: on first profile visit per user, drop a few sample listings
// attributed to them so the empty state isn't the first thing they see. The
// user can delete any of these via the existing per-listing action menu.
export function seedSampleListings(session: {
  uid: string;
  username?: string;
  phoneNumber?: string;
}) {
  if (typeof window === "undefined") return;
  const flagKey = `${SEEDED_PREFIX}${session.uid}`;
  if (window.localStorage.getItem(flagKey)) return;

  const owner: Owner = {
    id: session.uid,
    name: session.username ?? "Joul user",
    phoneNumbers: session.phoneNumber ? [session.phoneNumber] : [],
    telegramPhones: session.phoneNumber ? [session.phoneNumber] : [],
    memberSince: new Date().toISOString().slice(0, 10),
    listingsCount: 3
  };

  const now = Date.now();
  const samples: Room[] = [
    {
      id: `sample-${session.uid}-1`,
      title: "Cozy studio near Riverside",
      description:
        "Modern fully-furnished studio just 5 minutes walk to the Riverside. Quiet building, fast Wi-Fi, 24/7 security and covered parking.",
      price: 250,
      currency: "USD",
      deposit: 500,
      waterPrice: 0.5,
      electricityPrice: 0.25,
      wifiPrice: 10,
      type: "apartment",
      address: "St. 110, Daun Penh",
      city: "Phnom Penh",
      district: "Doun Penh",
      lat: 11.5775,
      lng: 104.925,
      images: [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
        "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200"
      ],
      bedrooms: 1,
      areaSqm: 28,
      floor: 3,
      amenities: ["Wi-Fi", "Air conditioning", "Parking", "Security", "Kitchen", "Elevator"],
      availableFrom: "2026-06-01",
      owner,
      createdAt: now - 1000 * 60 * 60 * 24 * 7
    },
    {
      id: `sample-${session.uid}-2`,
      title: "Bright 1-bedroom in BKK1",
      description:
        "Bright one-bedroom apartment in the heart of BKK1. Close to cafes, embassies, and coworking. Fully furnished, fast fibre internet.",
      price: 380,
      currency: "USD",
      deposit: 760,
      waterPrice: 0.5,
      electricityPrice: 0.25,
      wifiPrice: 15,
      type: "condo",
      address: "St. 294, BKK1",
      city: "Phnom Penh",
      district: "Boeng Keng Kang",
      area: "Boeng Keng Kang Muoy",
      lat: 11.5444,
      lng: 104.9263,
      images: [
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200"
      ],
      bedrooms: 1,
      areaSqm: 48,
      floor: 5,
      amenities: ["Wi-Fi", "Air conditioning", "Elevator", "Pool", "Gym", "Security"],
      availableFrom: "2026-06-15",
      owner,
      createdAt: now - 1000 * 60 * 60 * 24 * 3
    },
    {
      id: `sample-${session.uid}-3`,
      title: "Family house in Sen Sok",
      description:
        "Three-bedroom house with a private garden and covered parking. Quiet residential street near international schools.",
      price: 780,
      currency: "USD",
      deposit: 1560,
      waterPrice: 0.5,
      electricityPrice: 0.25,
      wifiPrice: 20,
      type: "house",
      address: "St. 2004, Phnom Penh Thmei",
      city: "Phnom Penh",
      district: "Sen Sok",
      area: "Phnom Penh Thmei",
      lat: 11.5879,
      lng: 104.8927,
      images: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200"
      ],
      bedrooms: 3,
      areaSqm: 160,
      floor: 2,
      amenities: ["Wi-Fi", "Air conditioning", "Parking", "Security", "Kitchen", "Laundry", "Balcony"],
      availableFrom: "2026-07-01",
      isOccupied: true,
      owner,
      createdAt: now - 1000 * 60 * 60 * 24
    }
  ];

  const rooms = [...samples, ...getLocalRooms()];
  window.localStorage.setItem(KEY, JSON.stringify(rooms));
  window.localStorage.setItem(flagKey, "1");
  window.dispatchEvent(new Event(EVENT));
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
