"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import AuthModal from "@/components/AuthModal";
import { useSession } from "@/lib/session";
import { useMyRoomRequests, deleteRoomRequest, type RoomRequest, type RoomRequestStatus } from "@/lib/requests";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";

const STATUS_TONE: Record<RoomRequestStatus, string> = {
  open: "bg-emerald-50 text-emerald-700",
  handled: "bg-amber-50 text-amber-700",
  closed: "bg-slate-100 text-ink-muted",
};

export default function MyRequestsPage() {
  const session = useSession();
  const requests = useMyRoomRequests(session?.uid);
  const router = useRouter();
  const t = useT();
  const [confirmCancel, setConfirmCancel] = useState<RoomRequest | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  // "Post a request" — signed-in users go straight to the form; signed-out
  // users get the login popup here, then continue to the form after sign-in.
  function postRequest() {
    if (session) router.push("/find-room");
    else setAuthOpen(true);
  }

  function budget(r: RoomRequest): string {
    if (r.budgetMin == null && r.budgetMax == null) return t("findRoom.field.anyBudget");
    if (r.budgetMin != null && r.budgetMax != null) return `$${r.budgetMin} – $${r.budgetMax}`;
    if (r.budgetMin != null) return `$${r.budgetMin}+`;
    return `≤ $${r.budgetMax}`;
  }
  function location(r: RoomRequest): string {
    return [r.area, r.district, r.province].filter(Boolean).join(", ") || t("findRoom.field.anyLocation");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("activity.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("activity.subtitle")}</p>
      </header>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Icon name="search" className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">{t("activity.empty.title")}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t("activity.empty.body")}</p>
          </div>
          <button type="button" onClick={postRequest} className="btn-primary mt-1">{t("activity.empty.cta")}</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[r.status]}`}>
                  {t(`activity.status.${r.status}`)}
                </span>
                <span className="text-[11px] text-ink-soft">
                  {t("activity.postedOn")} {new Date(r.createdAt).toLocaleDateString()}
                </span>
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

              {r.status !== "closed" && (
                <div className="mt-4 flex border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    className="btn-ghost ml-auto text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setConfirmCancel(r)}
                  >
                    <Icon name="trash" className="h-4 w-4" /> {t("activity.cancel")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!confirmCancel}
        title={t("activity.cancel.title")}
        body={t("activity.cancel.body")}
        confirmLabel={t("activity.cancel.confirm")}
        cancelLabel={t("activity.cancel.keep")}
        onCancel={() => setConfirmCancel(null)}
        onConfirm={() => {
          if (!confirmCancel) return;
          void deleteRoomRequest(confirmCancel.id);
          setConfirmCancel(null);
          toast.success(t("activity.toast.cancelled"));
        }}
      />

      <AuthModal
        open={authOpen}
        dismissible
        defaultTab="login"
        onClose={() => setAuthOpen(false)}
        onSuccess={() => { setAuthOpen(false); router.push("/find-room"); }}
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
