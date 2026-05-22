"use client";

import { useMemo } from "react";
import Icon from "@/components/Icon";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  useAdminNotifications,
  type AdminNotification,
  type AdminNotificationKind
} from "@/lib/admin";

const KIND_META: Record<AdminNotificationKind, { icon: "user" | "building" | "shield" | "message"; tone: string }> = {
  "user-registered": { icon: "user", tone: "bg-brand/10 text-brand" },
  "listing-posted": { icon: "building", tone: "bg-emerald-50 text-emerald-700" },
  "listing-flagged": { icon: "shield", tone: "bg-amber-50 text-amber-700" },
  system: { icon: "message", tone: "bg-slate-100 text-ink-muted" }
};

export default function AdminNotificationsPage() {
  const notifications = useAdminNotifications();
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Platform activity — new sign-ups, listings, and reports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAllNotificationsRead()}
          disabled={unread === 0}
          className="btn-secondary disabled:opacity-50"
        >
          <Icon name="check" className="h-4 w-4" />
          Mark all read
        </button>
      </header>

      {notifications.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Icon name="message" className="h-6 w-6" />
          </span>
          <h2 className="text-base font-bold">All quiet</h2>
          <p className="max-w-sm text-sm text-ink-muted">
            New activity from users and listings will show up here.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({ notification }: { notification: AdminNotification }) {
  const meta = KIND_META[notification.kind];
  return (
    <li
      className={`flex gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${
        notification.read ? "bg-white" : "bg-brand/5"
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
        <Icon name={meta.icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink">{notification.title}</span>
          {!notification.read ? (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-label="Unread" />
          ) : null}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">{notification.body}</p>
        <p className="mt-1 text-[11px] text-ink-soft">{formatTime(notification.createdAt)}</p>
      </div>
      <div className="flex shrink-0 items-start gap-1">
        {!notification.read ? (
          <button
            type="button"
            onClick={() => markNotificationRead(notification.id, true)}
            className="rounded-full p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
            aria-label="Mark as read"
            title="Mark as read"
          >
            <Icon name="check" className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => deleteNotification(notification.id)}
          className="rounded-full p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-700"
          aria-label="Delete notification"
          title="Delete"
        >
          <Icon name="trash" className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function formatTime(ms: number): string {
  const diff = Date.now() - ms;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(ms).toLocaleDateString();
}
