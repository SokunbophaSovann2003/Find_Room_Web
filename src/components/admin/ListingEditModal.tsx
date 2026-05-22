"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import type { AdminUser } from "@/lib/admin";
import type { Room } from "@/lib/types";

export type ListingEditValues = {
  title: string;
  price: number;
  isOccupied: boolean;
  ownerUid: string;
};

export default function ListingEditModal({
  room,
  users,
  onCancel,
  onSubmit
}: {
  room: Room;
  users: AdminUser[];
  onCancel: () => void;
  onSubmit: (values: ListingEditValues) => Promise<void> | void;
}) {
  const [title, setTitle] = useState(room.title);
  const [price, setPrice] = useState(String(room.price));
  const [isOccupied, setIsOccupied] = useState(!!room.isOccupied);
  const [ownerUid, setOwnerUid] = useState(room.owner.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Sort users by name and pin the current owner to the top so they're easy
  // to recognize even if they aren't in the admin store yet.
  const ownerOptions = useMemo(() => {
    const sorted = [...users].sort((a, b) => a.username.localeCompare(b.username));
    const currentInList = sorted.some((u) => u.uid === room.owner.id);
    if (currentInList) return sorted;
    return [
      {
        uid: room.owner.id,
        username: `${room.owner.name} (not in user directory)`,
        phoneNumber: "",
        role: "user" as const,
        status: "active" as const,
        createdAt: 0
      },
      ...sorted
    ];
  }, [users, room.owner]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const priceNum = Number(price);
    if (!title.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      setError("Title and a non-negative price are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        price: priceNum,
        isOccupied,
        ownerUid
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-cardHover sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Edit listing</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
            aria-label="Close"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="l-title">Title</label>
            <input
              id="l-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="l-price">Monthly price (USD)</label>
            <input
              id="l-price"
              type="number"
              min={0}
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="l-owner">Owner</label>
            <select
              id="l-owner"
              className="input"
              value={ownerUid}
              onChange={(e) => setOwnerUid(e.target.value)}
            >
              {ownerOptions.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.username}
                  {u.phoneNumber ? ` · ${u.phoneNumber}` : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setIsOccupied((v) => !v)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:bg-slate-50"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">Marked as occupied</span>
              <span className="block text-xs text-ink-muted">
                Hide the listing from new renter inquiries.
              </span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                isOccupied ? "bg-amber-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  isOccupied ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
