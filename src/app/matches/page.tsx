"use client";

import { useMemo } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useSession } from "@/lib/session";
import { useRooms } from "@/lib/rooms";
import { useActiveWanted, matchingWantedFor, type RoomWanted } from "@/lib/wanted";
import { useT } from "@/lib/language";

export default function MatchesPage() {
  const session = useSession();
  const { rooms } = useRooms();
  const wanted = useActiveWanted();
  const t = useT();

  const matches = useMemo(
    () => matchingWantedFor(session?.uid, rooms, wanted),
    [session?.uid, rooms, wanted]
  );

  if (!session) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Icon name="home" className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-extrabold">{t("matches.login.title")}</h1>
        <p className="text-sm text-ink-muted">{t("matches.login.body")}</p>
        <Link href="/explore" className="btn-primary">{t("findRoom.success.done")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("matches.title")}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t("matches.subtitle")}</p>
      </header>

      {matches.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-muted">
          {t("matches.empty")}
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((w) => (
            <MatchCard key={w.id} w={w} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MatchCard({ w }: { w: RoomWanted }) {
  const t = useT();
  const budget =
    w.budgetMin == null && w.budgetMax == null ? t("findRoom.field.anyBudget")
    : w.budgetMin != null && w.budgetMax != null ? `$${w.budgetMin} – $${w.budgetMax}`
    : w.budgetMin != null ? `$${w.budgetMin}+` : `≤ $${w.budgetMax}`;
  const location = [w.area, w.district, w.province].filter(Boolean).join(", ") || t("findRoom.field.anyLocation");
  const type = w.propertyType === "any" ? t("findRoom.field.anyType") : t(`admin.propertyType.${w.propertyType}`);

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-base font-bold text-ink">{w.renterName}</h2>
        <span className="text-[11px] text-ink-soft">{new Date(w.createdAt).toLocaleDateString()}</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <Field label={t("admin.requests.col.budget")} value={budget} />
        <Field label={t("admin.requests.col.location")} value={location} />
        <Field label={t("admin.requests.col.type")} value={type} />
        <Field label={t("admin.requests.col.bedrooms")} value={w.bedrooms != null ? String(w.bedrooms) : "—"} />
      </dl>

      {w.notes ? (
        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-ink">{w.notes}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {(w.renterPhones ?? []).map((p) => (
          <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="btn-primary text-sm">
            <Icon name="phone" className="h-4 w-4" /> {p}
          </a>
        ))}
        {(w.renterTelegrams ?? []).map((tg) => (
          <a key={tg} href={`https://t.me/+${tg.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            <Icon name="telegram" className="h-4 w-4" /> {tg}
          </a>
        ))}
      </div>
    </li>
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
