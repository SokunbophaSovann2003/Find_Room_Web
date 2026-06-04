"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Icon from "@/components/Icon";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  useAdminNotifications,
  type AdminNotification,
  type AdminNotificationKind,
} from "@/lib/admin";
import { useT } from "@/lib/language";

const KIND_META: Record<AdminNotificationKind, { icon: "user" | "building" | "shield" | "message"; tone: string }> = {
  "user-registered": { icon: "user", tone: "bg-brand/10 text-brand" },
  "listing-posted": { icon: "building", tone: "bg-emerald-50 text-emerald-700" },
  "listing-flagged": { icon: "shield", tone: "bg-amber-50 text-amber-700" },
  system: { icon: "message", tone: "bg-slate-100 text-ink-muted" },
};

export default function AdminIncomingNotificationsPage() {
  const router = useRouter();
  const notifications = useAdminNotifications();
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const t = useT();

  return (
    <div className="space-y-5">
      <header className="space-y-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-1 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
          aria-label={t("common.back")}
        >
          <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
          {t("common.back")}
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("admin.notifications.title")}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {t("admin.notifications.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAllNotificationsRead()}
          disabled={unread === 0}
          className="btn-primary w-full justify-center disabled:opacity-50"
        >
          <Icon name="check" className="h-4 w-4" />
          {t("admin.notifications.markAllRead")}
        </button>
      </header>

      {notifications.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Icon name="message" className="h-6 w-6" />
          </span>
          <h2 className="text-base font-bold">{t("admin.notifications.incoming.empty.title")}</h2>
          <p className="max-w-sm text-sm text-ink-muted">{t("admin.notifications.incoming.empty.body")}</p>
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
  const t = useT();

  return (
    <li className={`flex gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${notification.read ? "bg-white" : "bg-brand/5"}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
        <Icon name={meta.icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink">{notification.title}</span>
          {!notification.read ? (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
          ) : null}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">{notification.body}</p>
      </div>
      <div className="flex shrink-0 items-start gap-1">
        {!notification.read ? (
          <button
            type="button"
            onClick={() => markNotificationRead(notification.id, true)}
            className="rounded-full p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
            aria-label={t("admin.notifications.row.markRead")}
            title={t("admin.notifications.row.markRead")}
          >
            <Icon name="check" className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => deleteNotification(notification.id)}
          className="rounded-full p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-700"
          aria-label={t("admin.notifications.row.delete")}
          title={t("admin.notifications.row.deleteTitle")}
        >
          <Icon name="trash" className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
