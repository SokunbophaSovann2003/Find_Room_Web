"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import {
  saveAdminSettings,
  useAdminSettings,
  type AutoMessage,
  type AutoMessageKey
} from "@/lib/admin";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";

const AUTO_MSG_META: Record<AutoMessageKey, { labelKey: string; hintKey: string }> = {
  welcome: {
    labelKey: "admin.settings.autoMsg.welcome.label",
    hintKey: "admin.settings.autoMsg.welcome.hint"
  },
  "listing-published": {
    labelKey: "admin.settings.autoMsg.listingPublished.label",
    hintKey: "admin.settings.autoMsg.listingPublished.hint"
  },
  "listing-flagged": {
    labelKey: "admin.settings.autoMsg.listingFlagged.label",
    hintKey: "admin.settings.autoMsg.listingFlagged.hint"
  },
  "listing-occupied": {
    labelKey: "admin.settings.autoMsg.listingOccupied.label",
    hintKey: "admin.settings.autoMsg.listingOccupied.hint"
  }
};

// Event-triggered automated messages (welcome, listing published, etc.).
// Self-contained: reads/writes only the autoMessages slice of admin settings
// via saveAdminSettings({ autoMessages }) so it can live on the Messages page
// independently of the Settings page's own save flow.
export default function AutomatedMessages() {
  const stored = useAdminSettings();
  const t = useT();
  const [messages, setMessages] = useState<AutoMessage[]>(stored.autoMessages);
  const [openMsg, setOpenMsg] = useState<AutoMessageKey | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // stored only changes on a real settings-change event, so this resync does
  // not run every render and will not clobber in-progress edits.
  useEffect(() => {
    setMessages(stored.autoMessages);
  }, [stored.autoMessages]);

  const dirty = JSON.stringify(messages) !== JSON.stringify(stored.autoMessages);

  function updateMessage(index: number, patch: Partial<AutoMessage>) {
    setMessages((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function handleSave() {
    saveAdminSettings({ autoMessages: messages });
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
    toast.success(t("toast.admin.settings.saved"));
  }

  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="text-base font-bold">{t("admin.settings.autoMessages.title")}</h2>
        <p className="mt-0.5 text-sm text-ink-muted">{t("admin.settings.autoMessages.desc")}</p>
      </div>

      <ul className="space-y-2">
        {messages.map((msg, i) => {
          const open = openMsg === msg.key;
          return (
            <li key={msg.key} className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  onClick={() => setOpenMsg(open ? null : msg.key)}
                  aria-expanded={open}
                  aria-controls={`auto-msg-${msg.key}`}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Icon
                    name="chevron-down"
                    className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${open ? "" : "-rotate-90"}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {t(AUTO_MSG_META[msg.key].labelKey)}
                    </span>
                    {!open ? (
                      <span className="block truncate text-xs text-ink-muted">{msg.title}</span>
                    ) : null}
                  </span>
                </button>
                <Switch
                  on={msg.enabled}
                  onChange={(v) => updateMessage(i, { enabled: v })}
                  ariaLabel={t(AUTO_MSG_META[msg.key].labelKey)}
                />
              </div>
              {open ? (
                <div id={`auto-msg-${msg.key}`} className="space-y-3 border-t border-slate-100 p-3">
                  <p className="text-xs text-ink-muted">{t(AUTO_MSG_META[msg.key].hintKey)}</p>
                  <p className="text-[11px] text-ink-soft">
                    {t("admin.notifications.compose.placeholders")}{" "}
                    <code className="rounded bg-slate-100 px-1">{`{{username}}`}</code>{" "}
                    <code className="rounded bg-slate-100 px-1">{`{{phone}}`}</code>{" "}
                    <code className="rounded bg-slate-100 px-1">{`{{email}}`}</code>
                  </p>
                  <label className="block">
                    <span className="label">{t("admin.settings.autoWelcome.titleField")}</span>
                    <input
                      className="input mt-1"
                      value={msg.title}
                      onChange={(e) => updateMessage(i, { title: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="label">{t("admin.settings.autoWelcome.messageField")}</span>
                    <textarea
                      className="input mt-1 min-h-[100px] resize-y"
                      value={msg.message}
                      onChange={(e) => updateMessage(i, { message: e.target.value })}
                    />
                  </label>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {dirty || savedAt ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-ink">
            {savedAt ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Icon name="check" className="h-4 w-4" />
                {t("admin.settings.savedBar.saved")}
              </span>
            ) : (
              t("admin.settings.savedBar.unsaved")
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMessages(stored.autoMessages)}
              disabled={!dirty}
              className="btn-ghost disabled:opacity-40"
            >
              {t("admin.settings.savedBar.discard")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty}
              className="btn-primary disabled:opacity-50"
            >
              <Icon name="check" className="h-4 w-4" />
              {t("admin.settings.savedBar.save")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Switch({
  on,
  onChange,
  ariaLabel
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-brand" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
