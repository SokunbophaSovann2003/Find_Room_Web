import type { Room } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns true when a listing should be treated as Occupied because the
 * landlord hasn't touched it in `thresholdDays` days — even though
 * `room.isOccupied` is still false.
 *
 * Rules:
 * - If the room is already manually marked Occupied, this returns false
 *   (the manual flag takes precedence; we don't double-apply).
 * - The activity timestamp falls back to `createdAt` and then to now,
 *   so rooms that pre-date this field are never instantly expired.
 */
export function isAutoOccupied(room: Room, thresholdDays: number): boolean {
  if (room.isOccupied) return false;
  const activity = room.lastActivityAt ?? room.createdAt ?? Date.now();
  return Date.now() - activity >= thresholdDays * MS_PER_DAY;
}

/**
 * How many full days have elapsed since the last activity on this room.
 * Useful for showing "no activity for X days" in the UI.
 */
export function daysSinceActivity(room: Room): number {
  const activity = room.lastActivityAt ?? room.createdAt ?? Date.now();
  return Math.floor((Date.now() - activity) / MS_PER_DAY);
}
