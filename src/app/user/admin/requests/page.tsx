"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import {
  useRoomRequests,
  deleteRoomRequest,
  type RoomRequest,
} from "@/lib/requests";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";

export default function AdminRoomRequestsPage() {
  const requests = useRoomRequests();
  const t = useT();
  const [confirmDelete, setConfirmDelete] = useState<RoomRequest | null>(null);

  function budget(r: RoomRequest): string {
    if (r.budgetMin == null && r.budgetMax == null) return t("findRoom.field.anyBudget");
    if (r.budgetMin != null && r.budgetMax != null) return `$${r.budgetMin} – $${r.budgetMax}`;
    if (r.budgetMin != null) return `$${r.budgetMin}+`;
    return `≤ $${r.budgetMax}`;
  }
  function location(r: RoomRequest): string {
    return [r.area, r.district, r.province].filter(Boolean).join(", ") || t("findRoom.field.anyLocation");
  }
  function typeLabel(r: RoomRequest): string {
    return r.propertyType === "any" ? t("findRoom.field.anyType") : t(`admin.propertyType.${r.propertyType}`);
  }

  // Build a plain-text summary (with the requester's name) to paste into the
  // Telegram community, then copy it to the clipboard.
  async function copyForTelegram(r: RoomRequest) {
    const contacts = [...(r.requesterPhones ?? []), ...(r.requesterTelegrams ?? [])].join(", ");
    const lines = [
      t("admin.requests.copy.heading"),
      `${t("admin.requests.copy.name")}: ${r.requesterName}`,
      `${t("admin.requests.col.budget")}: ${budget(r)}`,
      `${t("admin.requests.col.location")}: ${location(r)}`,
      `${t("admin.requests.col.type")}: ${typeLabel(r)}`,
      r.moveInDate ? `${t("admin.requests.col.moveIn")}: ${r.moveInDate}` : null,
      contacts ? `${t("admin.requests.copy.contact")}: ${contacts}` : null,
      r.notes ? r.notes : null,
    ].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      toast.success(t("admin.requests.toast.copied"));
    } catch {
      toast.error(t("toast.profile.shareFailed"));
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("admin.requests.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("admin.requests.subtitle")}</p>
      </header>

      {requests.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-muted">{t("admin.requests.empty")}</div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-ink">{r.requesterName}</h2>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {(r.requesterPhones ?? []).map((p) => (
                      <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                        <Icon name="phone" className="h-3.5 w-3.5" /> {p}
                      </a>
                    ))}
                    {(r.requesterTelegrams ?? []).map((tg) => (
                      <a key={tg} href={`https://t.me/+${tg.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                        <Icon name="telegram" className="h-3.5 w-3.5" /> {tg}
                      </a>
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-ink-soft">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <Field label={t("admin.requests.col.budget")} value={budget(r)} />
                <Field label={t("admin.requests.col.location")} value={location(r)} />
                <Field label={t("admin.requests.col.type")} value={r.propertyType === "any" ? t("findRoom.field.anyType") : t(`admin.propertyType.${r.propertyType}`)} />
                <Field label={t("admin.requests.col.bedrooms")} value={r.bedrooms != null ? String(r.bedrooms) : "—"} />
                <Field label={t("admin.requests.col.moveIn")} value={r.moveInDate || "—"} />
              </dl>

              {r.notes ? (
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-ink">{r.notes}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <button type="button" className="btn-ghost text-xs" onClick={() => void copyForTelegram(r)}>
                  <Icon name="copy" className="h-4 w-4" /> {t("admin.requests.action.copy")}
                </button>
                <button type="button" className="btn-ghost ml-auto text-xs text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirmDelete(r)}>
                  <Icon name="trash" className="h-4 w-4" /> {t("admin.requests.action.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={t("admin.requests.delete.title")}
        body={confirmDelete ? <>{t("admin.requests.delete.body.prefix")}<b>{confirmDelete.requesterName}</b>{t("admin.requests.delete.body.suffix")}</> : null}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          void deleteRoomRequest(confirmDelete.id);
          setConfirmDelete(null);
          toast.success(t("admin.requests.toast.deleted"));
        }}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="truncate font-medium text-ink">{value}</dd>
    </div>
  );
}
