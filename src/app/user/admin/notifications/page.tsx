"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import {
  addOutboundTemplate,
  deleteNotification,
  deleteOutboundCampaign,
  deleteOutboundTemplate,
  fillPlaceholders,
  markAllNotificationsRead,
  markNotificationRead,
  resolveAudience,
  sendAdminOutbound,
  updateOutboundTemplate,
  useAdminNotifications,
  useAdminUsers,
  useOutboundCampaigns,
  useOutboundTemplates,
  type AdminNotification,
  type AdminNotificationKind,
  type AdminOutboundAudience,
  type AdminOutboundCampaign,
  type AdminOutboundTemplate,
  type AdminUser
} from "@/lib/admin";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";

const KIND_META: Record<AdminNotificationKind, { icon: "user" | "building" | "shield" | "message"; tone: string }> = {
  "user-registered": { icon: "user", tone: "bg-brand/10 text-brand" },
  "listing-posted": { icon: "building", tone: "bg-emerald-50 text-emerald-700" },
  "listing-flagged": { icon: "shield", tone: "bg-amber-50 text-amber-700" },
  system: { icon: "message", tone: "bg-slate-100 text-ink-muted" }
};

type Tab = "incoming" | "send";

export default function AdminNotificationsPage() {
  const t = useT();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("admin.notifications.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t("admin.notifications.subtitle")}
        </p>
      </header>

      <SendPanel />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge
}: {
  active: boolean;
  onClick: () => void;
  icon: "message" | "arrow-right";
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active ? "bg-brand text-white shadow" : "text-ink-muted hover:text-ink"
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {label}
      {badge !== undefined ? (
        <span
          className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
            active ? "bg-white/20 text-white" : "bg-brand/10 text-brand"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

// ---------- Incoming ----------

function IncomingPanel({ notifications }: { notifications: AdminNotification[] }) {
  const t = useT();
  if (notifications.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Icon name="message" className="h-6 w-6" />
        </span>
        <h2 className="text-base font-bold">{t("admin.notifications.incoming.empty.title")}</h2>
        <p className="max-w-sm text-sm text-ink-muted">
          {t("admin.notifications.incoming.empty.body")}
        </p>
      </div>
    );
  }
  return (
    <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {notifications.map((n) => (
        <NotificationRow key={n.id} notification={n} />
      ))}
    </ul>
  );
}

function NotificationRow({ notification }: { notification: AdminNotification }) {
  const meta = KIND_META[notification.kind];
  const router = useRouter();
  const t = useT();

  // Map kind → admin destination. Listings open the public detail page since
  // there isn't a per-listing admin page; user rows jump to the admin profile.
  const destination = useMemo<string | null>(() => {
    if (!notification.relatedId) return null;
    if (notification.kind === "user-registered") {
      return `/user/admin/users/${notification.relatedId}`;
    }
    if (notification.kind === "listing-posted" || notification.kind === "listing-flagged") {
      return `/rooms/${notification.relatedId}`;
    }
    return null;
  }, [notification.kind, notification.relatedId]);

  function handleNavigate() {
    if (!destination) return;
    if (!notification.read) markNotificationRead(notification.id, true);
    router.push(destination);
  }

  const ContentTag = destination ? "button" : "div";
  const contentProps = destination
    ? {
        type: "button" as const,
        onClick: handleNavigate,
        className:
          "min-w-0 flex-1 cursor-pointer text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      }
    : { className: "min-w-0 flex-1" };

  return (
    <li
      className={`flex gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${
        notification.read ? "bg-white" : "bg-brand/5"
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
        <Icon name={meta.icon} className="h-4 w-4" />
      </span>
      <ContentTag {...contentProps}>
        <p className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink">{notification.title}</span>
          {!notification.read ? (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-label={t("admin.notifications.row.unreadAria")} />
          ) : null}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">{notification.body}</p>
        <p className="mt-1 text-[11px] text-ink-soft">
          {formatRelative(notification.createdAt, t)}
          {destination ? <span className="ml-1.5 text-brand">· {t("admin.notifications.row.open")}</span> : null}
        </p>
      </ContentTag>
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

// ---------- Send ----------

type AudienceMode = "all" | "role" | "specific";

function SendPanel() {
  const templates = useOutboundTemplates();
  const campaigns = useOutboundCampaigns();
  const users = useAdminUsers();
  const searchParams = useSearchParams();
  const t = useT();

  const initialUid = searchParams?.get("to") ?? null;
  // On mobile, auto-open compose sheet when deep-linked with ?to=<uid>
  const [composeOpen, setComposeOpen] = useState(!!initialUid);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(
    initialUid ? "specific" : "all"
  );
  const [audienceRole, setAudienceRole] = useState<"user" | "admin">("user");
  const [selectedUids, setSelectedUids] = useState<string[]>(
    initialUid ? [initialUid] : []
  );
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<AdminOutboundTemplate | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [confirmDeleteCampaign, setConfirmDeleteCampaign] = useState<AdminOutboundCampaign | null>(null);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState<AdminOutboundTemplate | null>(null);
  const [justSent, setJustSent] = useState<AdminOutboundCampaign | null>(null);
  const [templateSaved, setTemplateSaved] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(true);

  const audience: AdminOutboundAudience = useMemo(() => {
    if (audienceMode === "all") return { kind: "all" };
    if (audienceMode === "role") return { kind: "role", role: audienceRole };
    return { kind: "specific", uids: selectedUids };
  }, [audienceMode, audienceRole, selectedUids]);

  const recipients = useMemo(() => resolveAudience(audience), [audience, users]);
  const previewRecipient = recipients[0];
  const canSend = title.trim().length > 0 && body.trim().length > 0 && recipients.length > 0;

  function applyTemplate(tpl: AdminOutboundTemplate) {
    setActiveTemplateId(tpl.id);
    setTitle(tpl.title);
    setBody(tpl.body);
    setComposeOpen(true);
  }

  function clearComposer() {
    setActiveTemplateId(null);
    setTitle("");
    setBody("");
  }

  function handleSend() {
    if (!title.trim() || !body.trim()) return;
    if (recipients.length === 0) return;
    const campaign = sendAdminOutbound({ title: title.trim(), body: body.trim(), audience });
    if (campaign) {
      setJustSent(campaign);
      setComposeOpen(false);
      clearComposer();
      const recipientCount = campaign.recipientCount;
      toast.success(
        recipientCount === 1
          ? t("toast.admin.send.one")
          : t("toast.admin.send.many", { n: recipientCount })
      );
    }
  }

  // Compose form body — shared between desktop inline and mobile bottom sheet
  const composeFormBody = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-ink-soft">
          {t("admin.notifications.compose.placeholders")}{" "}
          <code className="rounded bg-slate-100 px-1">{`{{username}}`}</code>{" "}
          <code className="rounded bg-slate-100 px-1">{`{{phone}}`}</code>{" "}
          <code className="rounded bg-slate-100 px-1">{`{{email}}`}</code>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <TemplateChip
          label={t("admin.notifications.compose.template.blank")}
          active={activeTemplateId === null}
          onClick={clearComposer}
        />
        {templates.map((tpl) => (
          <TemplateChip
            key={tpl.id}
            label={tpl.name}
            active={activeTemplateId === tpl.id}
            onClick={() => applyTemplate(tpl)}
          />
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">{t("admin.notifications.compose.field.title")}</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("admin.notifications.compose.field.title.placeholder")}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">{t("admin.notifications.compose.field.message")}</label>
          <textarea
            className="input min-h-[120px] resize-y"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("admin.notifications.compose.field.message.placeholder")}
          />
        </div>
      </div>

      <RecipientPicker
        users={users}
        mode={audienceMode}
        onModeChange={setAudienceMode}
        role={audienceRole}
        onRoleChange={setAudienceRole}
        selectedUids={selectedUids}
        onSelectedChange={setSelectedUids}
        recipientCount={recipients.length}
      />

      {previewRecipient && (title || body) ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            {t("admin.notifications.compose.preview.as", { name: previewRecipient.username })}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {fillPlaceholders(title || t("admin.notifications.compose.preview.noTitle"), previewRecipient)}
          </p>
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-muted">
            {fillPlaceholders(body || t("admin.notifications.compose.preview.noMessage"), previewRecipient)}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCreatingTemplate(true)}
            disabled={!title.trim() || !body.trim()}
            className="btn-ghost disabled:opacity-50"
          >
            <Icon name="plus" className="h-4 w-4" />
            {t("admin.notifications.compose.saveTemplate")}
          </button>
          {activeTemplateId ? (
            <button
              type="button"
              disabled={!title.trim() || !body.trim()}
              onClick={() => {
                if (!activeTemplateId) return;
                updateOutboundTemplate(activeTemplateId, {
                  title: title.trim(),
                  body: body.trim()
                });
                const tpl = templates.find((tp) => tp.id === activeTemplateId);
                setTemplateSaved(tpl?.name ?? "template");
              }}
              className="btn-ghost disabled:opacity-50"
            >
              <Icon name="pencil" className="h-4 w-4" />
              {t("admin.notifications.compose.updateTemplate")}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="arrow-right" className="h-4 w-4" />
          {recipients.length === 1
            ? t("admin.notifications.compose.send.one", { n: recipients.length })
            : t("admin.notifications.compose.send.many", { n: recipients.length })}
        </button>
      </div>
    </>
  );

  // Templates section — shared between desktop sidebar and mobile stack
  const templatesSection = (
    <section className="card p-4">
      <button
        type="button"
        onClick={() => setTemplatesOpen((v) => !v)}
        className={`flex w-full items-center justify-between text-ink transition hover:opacity-80 ${templatesOpen ? "mb-2" : ""}`}
        aria-label={templatesOpen ? t("common.cancel") : t("admin.notifications.templates.title")}
      >
        <h2 className="text-base font-bold">{t("admin.notifications.templates.title")}</h2>
        <Icon
          name="chevron-down"
          className={`h-4 w-4 text-ink-muted transition-transform duration-200 ${templatesOpen ? "" : "-rotate-90"}`}
        />
      </button>
      {templatesOpen ? (
        templates.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("admin.notifications.templates.empty")}</p>
        ) : (
          <ul className="space-y-1.5">
            {templates.map((tpl) => (
            <li key={tpl.id} className="flex items-start gap-2 rounded-xl border border-slate-100 p-2">
              <button
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-semibold text-ink">{tpl.name}</p>
                <p className="truncate text-xs text-ink-muted">{tpl.title}</p>
              </button>
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(tpl)}
                  className="rounded-full p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
                  aria-label={t("admin.notifications.templates.editAria")}
                  title={t("common.edit")}
                >
                  <Icon name="pencil" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTemplate(tpl)}
                  className="rounded-full p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-700"
                  aria-label={t("admin.notifications.templates.deleteAria")}
                  title={t("common.delete")}
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          </ul>
        )
      ) : null}
    </section>
  );

  // History section — shared between desktop and mobile stack
  const historySection = (
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
        <ul className="divide-y divide-slate-100">
          {campaigns.map((c) => (
            <li key={c.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
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
      )}
    </section>
  );

  return (
    <>
      {/* ── Mobile layout (< lg): Templates → History + FAB ── */}
      <div className="space-y-4 lg:hidden">
        {justSent ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <Icon name="check" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t("admin.notifications.send.sentTo", { summary: justSent.recipientSummary })}</p>
              <p className="text-emerald-700/90">{justSent.title}</p>
            </div>
            <button
              type="button"
              onClick={() => setJustSent(null)}
              className="rounded-full p-1.5 text-emerald-700 transition hover:bg-emerald-100"
              aria-label={t("admin.notifications.send.dismiss")}
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => { clearComposer(); setComposeOpen(true); }}
          className="btn-primary w-full"
        >
          <Icon name="plus" className="h-4 w-4" />
          {t("admin.notifications.compose.title")}
        </button>

        {templatesSection}
        {historySection}
      </div>

      {/* ── Mobile compose bottom sheet ── */}
      {composeOpen ? (
        <div
          className="fixed inset-0 z-[1200] flex flex-col justify-end bg-black/40 lg:hidden"
          onClick={() => setComposeOpen(false)}
        >
          <div
            className="flex max-h-[92vh] flex-col overflow-hidden rounded-t-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* drag handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-base font-bold">{t("admin.notifications.compose.title")}</h3>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-full p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
                aria-label={t("common.close")}
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>
            {/* scrollable form body */}
            <div className="overflow-y-auto p-4">
              <div className="space-y-4">
                {templateSaved ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-ink">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 flex-1 font-semibold">{t("admin.notifications.send.savedTemplate", { name: templateSaved })}</p>
                    <button
                      type="button"
                      onClick={() => setTemplateSaved(null)}
                      className="rounded-full p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
                      aria-label={t("admin.notifications.send.dismiss")}
                    >
                      <Icon name="x" className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
                {composeFormBody}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Desktop layout (lg+): compose + history | templates sidebar ── */}
      <div className="hidden lg:grid lg:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {templateSaved ? (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-ink">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon name="check" className="h-4 w-4" />
              </span>
              <p className="min-w-0 flex-1 font-semibold">{t("admin.notifications.send.savedTemplate", { name: templateSaved })}</p>
              <button
                type="button"
                onClick={() => setTemplateSaved(null)}
                className="rounded-full p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
                aria-label={t("admin.notifications.send.dismiss")}
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {justSent ? (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Icon name="check" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t("admin.notifications.send.sentTo", { summary: justSent.recipientSummary })}</p>
                <p className="text-emerald-700/90">{justSent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setJustSent(null)}
                className="rounded-full p-1.5 text-emerald-700 transition hover:bg-emerald-100"
                aria-label={t("admin.notifications.send.dismiss")}
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <section className="card space-y-4 p-4 sm:p-5">
            <h2 className="text-base font-bold">{t("admin.notifications.compose.title")}</h2>
            {composeFormBody}
          </section>

          {historySection}
        </div>

        <aside className="space-y-3">{templatesSection}</aside>
      </div>

      {creatingTemplate ? (
        <TemplateFormModal
          mode="create"
          initial={{ name: "", title, body }}
          onCancel={() => setCreatingTemplate(false)}
          onSubmit={(v) => {
            const created = addOutboundTemplate(v);
            setActiveTemplateId(created.id);
            setCreatingTemplate(false);
          }}
        />
      ) : null}

      {editingTemplate ? (
        <TemplateFormModal
          mode="edit"
          initial={{
            name: editingTemplate.name,
            title: editingTemplate.title,
            body: editingTemplate.body
          }}
          onCancel={() => setEditingTemplate(null)}
          onSubmit={(v) => {
            updateOutboundTemplate(editingTemplate.id, v);
            // Keep the composer in sync if the admin is currently working from
            // this template, otherwise the chip would still highlight but the
            // text would silently drift from what's saved.
            if (activeTemplateId === editingTemplate.id) {
              setTitle(v.title);
              setBody(v.body);
            }
            setTemplateSaved(v.name);
            setEditingTemplate(null);
          }}
        />
      ) : null}

      <ConfirmModal
        open={!!confirmDeleteTemplate}
        title={t("admin.notifications.template.delete.title")}
        body={
          confirmDeleteTemplate ? (
            <>
              {t("admin.notifications.template.delete.body.prefix")}<b>{confirmDeleteTemplate.name}</b>{t("admin.notifications.template.delete.body.suffix")}
            </>
          ) : null
        }
        onCancel={() => setConfirmDeleteTemplate(null)}
        onConfirm={() => {
          if (!confirmDeleteTemplate) return;
          deleteOutboundTemplate(confirmDeleteTemplate.id);
          if (activeTemplateId === confirmDeleteTemplate.id) setActiveTemplateId(null);
          setConfirmDeleteTemplate(null);
        }}
      />

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
    </>
  );
}

function TemplateChip({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
        active
          ? "bg-brand text-white shadow-sm"
          : "border border-slate-200 bg-white text-ink-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

// ---------- Recipient picker ----------

function RecipientPicker({
  users,
  mode,
  onModeChange,
  role,
  onRoleChange,
  selectedUids,
  onSelectedChange,
  recipientCount
}: {
  users: AdminUser[];
  mode: AudienceMode;
  onModeChange: (m: AudienceMode) => void;
  role: "user" | "admin";
  onRoleChange: (r: "user" | "admin") => void;
  selectedUids: string[];
  onSelectedChange: (uids: string[]) => void;
  recipientCount: number;
}) {
  const t = useT();
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          {t("admin.notifications.recipients.label")}
        </span>
        <span className="text-xs text-ink-muted">
          {recipientCount === 1
            ? t("admin.notifications.recipients.count.one", { n: recipientCount })
            : t("admin.notifications.recipients.count.many", { n: recipientCount })}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <ModeChip label={t("admin.notifications.audience.all")} active={mode === "all"} onClick={() => onModeChange("all")} />
        <ModeChip label={t("admin.notifications.audience.byRole")} active={mode === "role"} onClick={() => onModeChange("role")} />
        <ModeChip
          label={t("admin.notifications.audience.specific")}
          active={mode === "specific"}
          onClick={() => onModeChange("specific")}
        />
      </div>

      {mode === "role" ? (
        <div className="mt-3 flex gap-1.5">
          <ModeChip
            label={t("admin.notifications.audience.users")}
            active={role === "user"}
            onClick={() => onRoleChange("user")}
          />
          <ModeChip
            label={t("admin.notifications.audience.admins")}
            active={role === "admin"}
            onClick={() => onRoleChange("admin")}
          />
        </div>
      ) : null}

      {mode === "specific" ? (
        <div className="mt-3">
          <UserMultiPicker
            users={users.filter((u) => u.status === "active")}
            selectedUids={selectedUids}
            onChange={onSelectedChange}
          />
        </div>
      ) : null}
    </div>
  );
}

function ModeChip({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        active
          ? "bg-brand/10 text-brand"
          : "bg-slate-100 text-ink-muted hover:bg-slate-200 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function UserMultiPicker({
  users,
  selectedUids,
  onChange
}: {
  users: AdminUser[];
  selectedUids: string[];
  onChange: (uids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedSet = useMemo(() => new Set(selectedUids), [selectedUids]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.phoneNumber.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false)
    );
  }, [users, query]);

  function toggle(uid: string) {
    if (selectedSet.has(uid)) {
      onChange(selectedUids.filter((id) => id !== uid));
    } else {
      onChange([...selectedUids, uid]);
    }
  }

  function removeChip(uid: string) {
    onChange(selectedUids.filter((id) => id !== uid));
  }

  const selectedUsers = users.filter((u) => selectedSet.has(u.uid));

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-left text-sm"
      >
        {selectedUsers.length === 0 ? (
          <span className="px-1 text-ink-muted">{t("admin.notifications.picker.placeholder")}</span>
        ) : (
          selectedUsers.map((u) => (
            <span
              key={u.uid}
              className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand"
            >
              {u.username}
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(u.uid);
                }}
                className="rounded-full p-0.5 hover:bg-brand/20"
                aria-label={t("admin.notifications.picker.removeAria", { name: u.username })}
              >
                <Icon name="x" className="h-3 w-3" />
              </span>
            </span>
          ))
        )}
        <span className="ml-auto text-ink-soft">
          <Icon name="chevron-down" className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-cardHover">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
              />
              <input
                className="input pl-9"
                placeholder={t("admin.notifications.picker.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-ink-muted">{t("admin.notifications.picker.noMatches")}</p>
            ) : (
              filtered.map((u) => {
                const active = selectedSet.has(u.uid);
                return (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => toggle(u.uid)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                      active ? "bg-brand/5" : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        active ? "border-brand bg-brand text-white" : "border-slate-300"
                      }`}
                    >
                      {active ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{u.username}</p>
                      <p className="truncate text-xs text-ink-muted">{u.phoneNumber}</p>
                    </div>
                    {u.role === "admin" ? (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                        {t("admin.role.admin")}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------- Modals ----------

function TemplateFormModal({
  mode,
  initial,
  onCancel,
  onSubmit
}: {
  mode: "create" | "edit";
  initial: { name: string; title: string; body: string };
  onCancel: () => void;
  onSubmit: (v: { name: string; title: string; body: string }) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const t = useT();

  const canSubmit = name.trim().length > 0 && title.trim().length > 0 && body.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-cardHover"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">
            {mode === "create" ? t("admin.notifications.template.create.title") : t("admin.notifications.template.edit.title")}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
            aria-label={t("common.close")}
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">{t("admin.notifications.template.field.name")}</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("admin.notifications.template.field.name.placeholder")}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">{t("admin.notifications.template.field.title")}</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">{t("admin.notifications.template.field.message")}</label>
            <textarea
              className="input min-h-[120px] resize-y"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSubmit({ name: name.trim(), title: title.trim(), body: body.trim() })}
            className="btn-primary disabled:opacity-50"
          >
            {mode === "create" ? t("admin.notifications.template.save") : t("admin.notifications.template.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Time formatting ----------

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
