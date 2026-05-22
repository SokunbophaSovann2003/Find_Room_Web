"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import type { AdminUser } from "@/lib/admin";

export type UserFormValues = {
  username: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  role: AdminUser["role"];
  status: AdminUser["status"];
};

export default function UserFormModal({
  mode,
  initial,
  onCancel,
  onSubmit
}: {
  mode: "add" | "edit";
  initial?: Partial<UserFormValues>;
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
}) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatarUrl ?? "");
  const [role, setRole] = useState<AdminUser["role"]>(initial?.role ?? "user");
  const [status, setStatus] = useState<AdminUser["status"]>(initial?.status ?? "active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!username.trim() || !phoneNumber.trim()) {
      setError("Name and phone are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        username: username.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        role,
        status
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
          <h3 className="text-lg font-bold">{mode === "add" ? "Add user" : "Edit user"}</h3>
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
            <label className="label" htmlFor="u-name">Name</label>
            <input
              id="u-name"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="u-phone">Phone</label>
            <input
              id="u-phone"
              className="input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+855 12 345 678"
              inputMode="tel"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="u-email">Email (optional)</label>
            <input
              id="u-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="u-avatar">Avatar URL (optional)</label>
            <input
              id="u-avatar"
              className="input"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="u-role">Role</label>
              <select
                id="u-role"
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as AdminUser["role"])}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="u-status">Status</label>
              <select
                id="u-status"
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as AdminUser["status"])}
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : mode === "add" ? "Add user" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
