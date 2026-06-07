"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import LoadMoreSentinel from "@/components/admin/LoadMoreSentinel";
import {
  deleteOutboundCampaign,
  useOutboundCampaigns,
  type AdminOutboundCampaign
} from "@/lib/admin";
import { useT } from "@/lib/language";

const HISTORY_PAGE_SIZE = 20;

export default function AdminNotificationsPage() {
  const t = useT();
  const router = useRouter();
  const campaigns = useOutboundCampaigns();
  const [confirmDeleteCampaign, setConfirmDeleteCampaign] = useState<AdminOutboundCampaign | null>(null);
  const [viewCampaign, setViewCampaign] = useState<AdminOutboundCampaign | null>(null);
  const [historyVisible, setHistoryVisible] = useState(HISTORY_PAGE_SIZE);
  const shownCampaigns = campaigns.slice(0, historyVisible);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("admin.notifications.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("admin.notifications.subtitle")}</p>
      </header>

      <button
        type="button"
        onClick={() => router.push("/user/admin/notifications/compose")}
        className="btn-primary w-full sm:w-auto"
      >
        <Icon name="plus" className="h-4 w-4" />
        {t("admin.notifications.compose.new")}
      </button>

      <section className="card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{t("admin.notifications.history.title")}</h2>
          <span className="text-xs text-ink-soft">
            {campaigns.length === 0
              ? t("admin.notifications.history.empty")
              : campaigns.length === 1
                ? t("admin.notifications.history.campaigns.one", { n: campaigns.length })
                : t("admin.notifications.history.campaigns.many", { n: campaigns.length })}
          </span>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("admin.notifications.history.empty.body")}</p>
        ) : (
          <>
            {/* Mobile: card list */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {shownCampaigns.map((c) => (
                <li key={c.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setViewCampaign(c)}
                    className="flex min-w-0 flex-1 gap-3 text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Icon name="arrow-right" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{c.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{c.body}</p>
                      <p className="mt-1 text-[11px] text-ink-soft">
                        {c.recipientSummary} · {formatRelative(c.sentAt, t)}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteCampaign(c)}
                    className="rounded-full p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-700"
                    aria-label={t("admin.notifications.history.deleteAria")}
                    title={t("admin.notifications.history.deleteTitle")}
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-ink-soft">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2.5 font-semibold">{t("admin.notifications.compose.field.title")}</th>
                    <th className="px-3 py-2.5 font-semibold">{t("admin.notifications.history.col.message")}</th>
                    <th className="px-3 py-2.5 font-semibold">{t("admin.notifications.history.col.recipients")}</th>
                    <th className="px-3 py-2.5 font-semibold">{t("admin.notifications.history.col.sent")}</th>
                    <th className="px-3 py-2.5 text-right font-semibold">{t("admin.users.col.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shownCampaigns.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setViewCampaign(c)}
                      className="cursor-pointer align-top transition hover:bg-slate-50"
                    >
                      <td className="px-3 py-3">
                        <span className="font-semibold text-ink">{c.title}</span>
                      </td>
                      <td className="max-w-md px-3 py-3 text-ink-muted">
                        <span className="line-clamp-2">{c.body}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-muted">{c.recipientSummary}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-soft">{formatRelative(c.sentAt, t)}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteCampaign(c); }}
                          className="rounded-full p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-700"
                          aria-label={t("admin.notifications.history.deleteAria")}
                          title={t("admin.notifications.history.deleteTitle")}
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <LoadMoreSentinel
              hasMore={historyVisible < campaigns.length}
              onLoadMore={() => setHistoryVisible((c) => c + HISTORY_PAGE_SIZE)}
            />
          </>
        )}
      </section>

      {viewCampaign ? (
        <CampaignDetailModal
          campaign={viewCampaign}
          onClose={() => setViewCampaign(null)}
          onDelete={() => {
            setConfirmDeleteCampaign(viewCampaign);
            setViewCampaign(null);
          }}
        />
      ) : null}

      <ConfirmModal
        open={!!confirmDeleteCampaign}
        title={t("admin.notifications.campaign.delete.title")}
        body={
          confirmDeleteCampaign ? (
            <>
              {t("admin.notifications.campaign.delete.body.prefix")}<b>{confirmDeleteCampaign.title}</b>{t("admin.notifications.campaign.delete.body.suffix")}
            </>
          ) : null
        }
        onCancel={() => setConfirmDeleteCampaign(null)}
        onConfirm={() => {
          if (!confirmDeleteCampaign) return;
          deleteOutboundCampaign(confirmDeleteCampaign.id);
          setConfirmDeleteCampaign(null);
        }}
      />
    </div>
  );
}

function CampaignDetailModal({
  campaign,
  onClose,
  onDelete
}: {
  campaign: AdminOutboundCampaign;
  onClose: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-cardHover"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 text-lg font-bold text-ink">{campaign.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
            aria-label={t("common.close")}
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              {t("admin.notifications.history.col.message")}
            </p>
            <p className="whitespace-pre-wrap text-sm text-ink">{campaign.body}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {t("admin.notifications.history.col.recipients")}
              </p>
              <p className="text-sm text-ink">{campaign.recipientSummary}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {t("admin.notifications.history.col.sent")}
              </p>
              <p className="text-sm text-ink">{new Date(campaign.sentAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onDelete}
            className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Icon name="trash" className="h-4 w-4" />
            {t("admin.notifications.history.deleteTitle")}
          </button>
          <button type="button" onClick={onClose} className="btn-primary">
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelative(ms: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const diff = Date.now() - ms;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return t("admin.notifications.time.justNow");
  if (diff < hr) return t("admin.notifications.time.minutesAgo", { n: Math.floor(diff / min) });
  if (diff < day) return t("admin.notifications.time.hoursAgo", { n: Math.floor(diff / hr) });
  if (diff < 7 * day) return t("admin.notifications.time.daysAgo", { n: Math.floor(diff / day) });
  return new Date(ms).toLocaleDateString();
}
