"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useEffect } from "react";
import Icon from "@/components/Icon";
import LoadMoreSentinel from "@/components/admin/LoadMoreSentinel";
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
  "listing-pending": { icon: "building", tone: "bg-sky-50 text-sky-700" },
  "listing-flagged": { icon: "shield", tone: "bg-amber-50 text-amber-700" },
};

type TypeFilter = "all" | "listing-posted" | "user-registered";
type ReadFilter = "all" | "read" | "unread";

const TYPE_OPTIONS: { value: TypeFilter; labelKey: string }[] = [
  { value: "all", labelKey: "admin.notifications.filter.all" },
  { value: "listing-posted", labelKey: "admin.notifications.filter.listing" },
  { value: "user-registered", labelKey: "admin.notifications.filter.register" },
];

const READ_OPTIONS: { value: ReadFilter; labelKey: string }[] = [
  { value: "all", labelKey: "admin.notifications.filter.all" },
  { value: "read", labelKey: "admin.notifications.filter.read" },
  { value: "unread", labelKey: "admin.notifications.filter.unread" },
];

const INCOMING_PAGE_SIZE = 20;

function FilterDropdown({
  options,
  value,
  onChange,
}: {
  options: { value: string; labelKey: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const activeLabel = t(options.find((o) => o.value === value)!.labelKey);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
      >
        {activeLabel}
        <Icon name="chevron-down" className={`h-4 w-4 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-cardHover">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-slate-50 ${
                value === opt.value ? "font-semibold text-brand" : "text-ink"
              }`}
            >
              {t(opt.labelKey)}
              {value === opt.value ? <Icon name="check" className="h-4 w-4 text-brand" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminIncomingNotificationsPage() {
  const router = useRouter();
  const notifications = useAdminNotifications();
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const t = useT();

  const filtered = useMemo(() => {
    let result = notifications;
    if (typeFilter !== "all") result = result.filter((n) => n.kind === typeFilter);
    if (readFilter === "read") result = result.filter((n) => n.read);
    if (readFilter === "unread") result = result.filter((n) => !n.read);
    return result;
  }, [notifications, typeFilter, readFilter]);

  // Render a first page, then reveal more on scroll. Reset when the filters
  // change so the window starts fresh for the new result set.
  const [visibleCount, setVisibleCount] = useState(INCOMING_PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(INCOMING_PAGE_SIZE);
  }, [typeFilter, readFilter]);
  const shown = filtered.slice(0, visibleCount);

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
            {t("admin.notifications.incoming.title")}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {t("admin.notifications.incoming.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void markAllNotificationsRead()}
            disabled={unread === 0}
            className="btn-primary disabled:opacity-50"
          >
            <Icon name="check" className="h-4 w-4" />
            {t("admin.notifications.markAllRead")}
          </button>
          <div className="ml-auto flex gap-2">
            <FilterDropdown options={TYPE_OPTIONS} value={typeFilter} onChange={(v) => setTypeFilter(v as TypeFilter)} />
            <FilterDropdown options={READ_OPTIONS} value={readFilter} onChange={(v) => setReadFilter(v as ReadFilter)} />
          </div>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Icon name="message" className="h-6 w-6" />
          </span>
          <h2 className="text-base font-bold">{t("admin.notifications.incoming.empty.title")}</h2>
          <p className="max-w-sm text-sm text-ink-muted">{t("admin.notifications.incoming.empty.body")}</p>
        </div>
      ) : (
        <>
          <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            {shown.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </ul>
          <LoadMoreSentinel
            hasMore={visibleCount < filtered.length}
            onLoadMore={() => setVisibleCount((c) => c + INCOMING_PAGE_SIZE)}
          />
        </>
      )}
    </div>
  );
}

const FALLBACK_META = { icon: "message" as const, tone: "bg-slate-100 text-ink-muted" };

function NotificationRow({ notification }: { notification: AdminNotification }) {
  const meta = KIND_META[notification.kind] ?? FALLBACK_META;
  const router = useRouter();
  const t = useT();

  const destination = useMemo<string | null>(() => {
    if (!notification.relatedId) return null;
    if (notification.kind === "user-registered") return `/user/admin/users/${notification.relatedId}`;
    if (notification.kind === "listing-posted") return `/rooms/${notification.relatedId}`;
    return null;
  }, [notification.kind, notification.relatedId]);

  function handleNavigate() {
    if (!destination) return;
    if (!notification.read) void markNotificationRead(notification.id, true);
    router.push(destination);
  }

  return (
    <li className={`flex gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${notification.read ? "bg-white" : "bg-brand/5"}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
        <Icon name={meta.icon} className="h-4 w-4" />
      </span>
      <button
        type="button"
        onClick={destination ? handleNavigate : undefined}
        className={`min-w-0 flex-1 text-left ${destination ? "cursor-pointer transition hover:opacity-90" : "cursor-default"}`}
      >
        <p className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink">{notification.title}</span>
          {!notification.read ? (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
          ) : null}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">{notification.body}</p>
        {destination ? (
          <p className="mt-1 text-[11px] text-brand">{t("admin.notifications.row.open")}</p>
        ) : null}
      </button>
      <div className="flex shrink-0 items-start gap-1">
        {!notification.read ? (
          <button
            type="button"
            onClick={() => void markNotificationRead(notification.id, true)}
            className="rounded-full p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
            aria-label={t("admin.notifications.row.markRead")}
            title={t("admin.notifications.row.markRead")}
          >
            <Icon name="check" className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void deleteNotification(notification.id)}
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
