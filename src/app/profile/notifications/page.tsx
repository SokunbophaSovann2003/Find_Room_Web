"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import LoadMoreSentinel from "@/components/admin/LoadMoreSentinel";
import { useSession } from "@/lib/session";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import {
  markAllUserCampaignsRead,
  markUserCampaignRead,
  useUserNotifications,
  type UserNotification
} from "@/lib/admin";

const NOTIF_PAGE_SIZE = 20;

export default function UserNotificationsPage() {
  const router = useRouter();
  const session = useSession();
  const t = useT();
  const notifications = useUserNotifications(session);
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Render a first page, then reveal more on scroll. Reset when the list shrinks
  // (e.g. all marked read could re-sort) or the user changes.
  const [visibleCount, setVisibleCount] = useState(NOTIF_PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(NOTIF_PAGE_SIZE);
  }, [session?.uid]);
  const shownNotifications = notifications.slice(0, visibleCount);

  function handleBack() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("findroom.nav-from-listroom");
    }
    router.push("/explore");
  }

  function handleMarkAll() {
    if (!session) return;
    const count = notifications.filter((n) => !n.read).length;
    if (count === 0) return;
    void markAllUserCampaignsRead(
      session.uid,
      notifications.filter((n) => !n.read).map((n) => n.id)
    );
    toast.success(
      count === 1
        ? t("toast.notifications.markedOne")
        : t("toast.notifications.markedMany", { n: count })
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={handleBack}
            style={{ touchAction: "manipulation" }}
            className="mb-1 -ml-2 inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-ink-muted transition hover:bg-slate-100 hover:text-brand active:scale-[0.98]"
            aria-label={t("userNotif.back.aria")}
          >
            <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
            {t("common.back")}
          </button>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("userNotif.title")}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {t("userNotif.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={unread === 0}
          className="btn-primary w-full justify-center sm:w-auto"
        >
          <Icon name="check" className="h-4 w-4" />
          {t("common.markAllRead")}
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Icon name="message" className="h-6 w-6" />
          </span>
          <h2 className="text-base font-bold">{t("userNotif.empty.title")}</h2>
          <p className="max-w-sm text-sm text-ink-muted">
            {t("userNotif.empty.body")}
          </p>
        </div>
      ) : (
        <>
          <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            {shownNotifications.map((n) => (
              <Row key={n.id} notification={n} uid={session?.uid ?? ""} />
            ))}
          </ul>
          <LoadMoreSentinel
            hasMore={visibleCount < notifications.length}
            onLoadMore={() => setVisibleCount((c) => c + NOTIF_PAGE_SIZE)}
          />
        </>
      )}
    </div>
  );
}

function Row({ notification, uid }: { notification: UserNotification; uid: string }) {
  const t = useT();
  return (
    <li
      className={`flex gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${
        notification.read ? "bg-white" : "bg-brand/5"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon name="message" className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink">{notification.title}</span>
          {!notification.read ? (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-label={t("common.unread")} />
          ) : null}
        </p>
        <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-muted">{notification.body}</p>
        <p className="mt-1 text-[11px] text-ink-soft">{formatRelative(notification.createdAt, t)}</p>
      </div>
      {!notification.read && uid ? (
        <button
          type="button"
          onClick={() => void markUserCampaignRead(uid, notification.id, true)}
          className="shrink-0 rounded-full p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
          aria-label={t("common.markAsRead")}
          title={t("common.markAsRead")}
        >
          <Icon name="check" className="h-4 w-4" />
        </button>
      ) : null}
    </li>
  );
}

function formatRelative(ms: number, t: ReturnType<typeof useT>): string {
  const diff = Date.now() - ms;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return t("common.justNow");
  if (diff < hr) return t("common.minutesAgo", { n: Math.floor(diff / min) });
  if (diff < day) return t("common.hoursAgo", { n: Math.floor(diff / hr) });
  if (diff < 7 * day) return t("common.daysAgo", { n: Math.floor(diff / day) });
  return new Date(ms).toLocaleDateString();
}
