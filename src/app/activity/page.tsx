"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import AuthModal from "@/components/AuthModal";
import { useSession } from "@/lib/session";
import { useMyRoomRequests, type RoomRequest } from "@/lib/requests";
import { useT } from "@/lib/language";

export default function MyRequestsPage() {
  const session = useSession();
  const requests = useMyRoomRequests(session?.uid);
  const router = useRouter();
  const t = useT();
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
      {/* The empty state carries its own headline, so the page title only
          shows once the user has requests. */}
      {requests.length > 0 ? (
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("activity.title")}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t("activity.subtitle")}</p>
          </div>
          {/* Desktop-only inline button (mobile uses the fixed bottom bar). */}
          <button
            type="button"
            onClick={postRequest}
            className="btn-primary hidden shrink-0 whitespace-nowrap sm:inline-flex"
          >
            <Icon name="plus" className="h-4 w-4" /> {t("activity.empty.cta")}
          </button>
        </header>
      ) : null}

      {requests.length === 0 ? (
        <div className="flex flex-col items-center px-2 pt-6 text-center">
          {/* Friendly "search for a home" illustration in a soft blob. */}
          <div className="flex h-60 w-60 items-center justify-center rounded-[44%] bg-gradient-to-br from-brand/10 via-brand/5 to-amber-100/50">
            <SearchHomeArt />
          </div>
          <h2 className="mt-7 max-w-sm text-xl font-extrabold leading-snug tracking-tight text-ink sm:text-2xl">
            {t("activity.empty.hook")}
          </h2>
          <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-ink-muted">
            {t("activity.empty.pitch")}
          </p>
          <button type="button" onClick={postRequest} className="btn-primary mt-7 w-full max-w-sm">
            {t("activity.empty.cta")}
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex justify-end">
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
            </li>
          ))}
          </ul>
          {/* Spacer so the last card clears the fixed mobile CTA bar below. */}
          <div className="h-16 sm:hidden" aria-hidden />
        </>
      )}

      {/* Mobile: full-width "Post a request" bar pinned above the bottom nav. */}
      {requests.length > 0 ? (
        <div className="fixed inset-x-0 bottom-20 z-[1049] px-4 sm:hidden">
          <button
            type="button"
            onClick={postRequest}
            className="btn-primary w-full justify-center shadow-cardHover"
          >
            <Icon name="plus" className="h-4 w-4" /> {t("activity.empty.cta")}
          </button>
        </div>
      ) : null}

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

// Original "searching for a home" illustration — a house with a magnifying
// glass, in the app's brand palette. Purely decorative.
function SearchHomeArt() {
  return (
    <svg width="176" height="176" viewBox="0 0 200 200" role="img" aria-hidden="true">
      <ellipse cx="100" cy="170" rx="58" ry="8" fill="#0f172a" opacity="0.06" />
      {/* house */}
      <path
        d="M56 100 L100 64 L144 100 V150 a5 5 0 0 1-5 5 H61 a5 5 0 0 1-5-5 Z"
        fill="#ffffff"
        stroke="#059669"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M46 105 L100 60 L154 105" fill="none" stroke="#047857" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="90" y="123" width="20" height="32" rx="3" fill="#A7F3D0" />
      <rect x="66" y="112" width="16" height="16" rx="3" fill="#6EE7B7" />
      {/* magnifying glass */}
      <circle cx="129" cy="118" r="30" fill="#FEF3C7" opacity="0.65" />
      <circle cx="129" cy="118" r="30" fill="none" stroke="#F59E0B" strokeWidth="7" />
      <line x1="151" y1="140" x2="174" y2="163" stroke="#F59E0B" strokeWidth="9" strokeLinecap="round" />
    </svg>
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
