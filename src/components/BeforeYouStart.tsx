"use client";

import { useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { useT } from "@/lib/language";

/**
 * "Before you start" — the request-consent gate, rebuilt as a 3-screen
 * onboarding splash (How it works → Public warning → Terms & safety).
 *
 * The legal purpose is unchanged: the user still has to reach the final
 * screen, tick the consent checkbox, and continue before the request form is
 * shown. Splitting it into paced screens with illustrations just makes the
 * agreement feel like a welcome instead of a wall of terms.
 */

const TOTAL = 3;

function HeroSearch() {
  return (
    <svg width="200" height="150" viewBox="0 0 200 150" role="img" aria-hidden="true">
      <g className="onb-bob">
        <rect x="118" y="26" width="60" height="42" rx="8" fill="#fff" stroke="#A7F3D0" strokeWidth="2" />
        <rect x="128" y="38" width="26" height="4" rx="2" fill="#6EE7B7" />
        <rect x="128" y="48" width="40" height="4" rx="2" fill="#D1FAE5" />
        <path d="M124 22 l6 8 l-11 -1 z" fill="#fff" stroke="#A7F3D0" strokeWidth="2" />
      </g>
      <circle cx="64" cy="66" r="24" fill="#059669" />
      <circle cx="64" cy="58" r="9" fill="#ECFDF5" />
      <path d="M48 92 q16 -20 32 0 z" fill="#ECFDF5" />
      <circle cx="96" cy="96" r="15" fill="none" stroke="#047857" strokeWidth="5" />
      <line x1="106" y1="107" x2="120" y2="121" stroke="#047857" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function HeroEye() {
  return (
    <svg width="200" height="150" viewBox="0 0 200 150" role="img" aria-hidden="true">
      <circle className="onb-pulse" cx="100" cy="70" r="34" fill="#FCD34D" />
      <circle className="onb-pulse" style={{ animationDelay: "0.8s" }} cx="100" cy="70" r="34" fill="#FCD34D" />
      <path d="M64 70 q36 -32 72 0 q-36 32 -72 0 z" fill="#fff" stroke="#F59E0B" strokeWidth="3" />
      <circle cx="100" cy="70" r="13" fill="#F59E0B" />
      <circle cx="100" cy="70" r="5" fill="#78350F" />
      <circle cx="104" cy="66" r="2.5" fill="#fff" />
    </svg>
  );
}

function HeroShield() {
  return (
    <svg width="200" height="150" viewBox="0 0 200 150" role="img" aria-hidden="true">
      <g className="onb-bob">
        <path d="M100 24 l40 15 v34 c0 30 -22 46 -40 54 c-18 -8 -40 -24 -40 -54 v-34 z" fill="#059669" />
        <path d="M100 32 l32 12 v29 c0 24 -18 38 -32 45 c-14 -7 -32 -21 -32 -45 v-29 z" fill="#ECFDF5" />
        <path
          className="onb-draw"
          d="M84 74 l12 12 l24 -26"
          fill="none"
          stroke="#059669"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default function BeforeYouStart({
  onAgree,
  onCancel,
}: {
  onAgree: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [confirm, setConfirm] = useState(false);

  const steps = [t("findRoom.terms.how.step1"), t("findRoom.terms.how.step2"), t("findRoom.terms.how.step3")];
  const safety: { icon: IconName; text: string }[] = [
    { icon: "check", text: t("findRoom.terms.good.free") },
    { icon: "message", text: t("findRoom.terms.good.contact") },
    { icon: "home", text: t("findRoom.terms.good.view") },
    { icon: "shield", text: t("findRoom.terms.good.money") },
    { icon: "bell", text: t("findRoom.terms.disclaimer") },
  ];

  const isLast = step === TOTAL - 1;

  function next() {
    if (isLast) onAgree();
    else setStep((s) => s + 1);
  }
  function back() {
    if (step === 0) onCancel();
    else setStep((s) => s - 1);
  }

  const heroByStep = [
    { bg: "bg-emerald-50", node: <HeroSearch /> },
    { bg: "bg-amber-50", node: <HeroEye /> },
    { bg: "bg-teal-50", node: <HeroShield /> },
  ];
  const hero = heroByStep[step];

  function renderBody() {
    if (step === 0) {
      return (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink lg:text-3xl">{t("findRoom.terms.how.title")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("findRoom.terms.how.sub")}</p>
          <ol className="mt-5 space-y-3.5">
            {steps.map((s, i) => (
              <li key={i} className="onb-rise flex items-start gap-3" style={{ animationDelay: `${0.15 + i * 0.15}s` }}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-ink">{s}</span>
              </li>
            ))}
          </ol>
        </>
      );
    }
    if (step === 1) {
      return (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink lg:text-3xl">{t("findRoom.terms.notice.title")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("findRoom.terms.notice.sub")}</p>
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-center gap-2">
              <Icon name="eye" className="h-5 w-5 shrink-0 text-amber-700" />
              <span className="text-sm font-bold text-amber-900">{t("findRoom.terms.notice.eyebrow")}</span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-amber-800">{t("findRoom.terms.notice.body")}</p>
          </div>
        </>
      );
    }
    return (
      <>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink lg:text-3xl">{t("findRoom.terms.good.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("findRoom.terms.good.sub")}</p>
        <ul className="mt-4 space-y-3">
          {safety.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-[13px] leading-relaxed text-ink">
              <Icon name={s.icon} className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
          />
          <span className="text-sm text-ink">{t("findRoom.terms.confirm")}</span>
        </label>
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 py-5 lg:flex lg:min-h-[calc(100vh-9rem)] lg:max-w-5xl lg:items-center lg:px-6 lg:py-10">
      <div className="gate-grid min-h-[70vh] w-full lg:min-h-[560px] lg:overflow-hidden lg:rounded-3xl lg:border lg:border-slate-200 lg:bg-white lg:shadow-card">
        {/* Progress + skip */}
        <div className="gate-progress flex items-center justify-between lg:px-10 lg:pt-8">
          <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={TOTAL} aria-label={t("findRoom.terms.stepOf", { n: step + 1, total: TOTAL })}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-brand" : "w-1.5 bg-slate-300"}`}
              />
            ))}
          </div>
          {!isLast && (
            <button type="button" onClick={() => setStep(TOTAL - 1)} className="text-sm font-medium text-ink-soft transition hover:text-ink">
              {t("findRoom.terms.skip")}
            </button>
          )}
        </div>

        {/* Illustration — a banner on phones, a full-height side panel from lg up.
            Keyed on step so the entrance animation replays on each screen. */}
        <div
          key={`hero-${step}`}
          className={`gate-hero onb-rise mt-4 flex h-44 items-center justify-center rounded-3xl ${hero.bg} lg:mt-0 lg:h-auto lg:rounded-none`}
        >
          <div className="lg:scale-150">{hero.node}</div>
        </div>

        {/* Text content */}
        <div key={`body-${step}`} className="gate-body onb-rise flex flex-col pt-6 lg:justify-center lg:overflow-y-auto lg:px-10 lg:pt-6">
          {renderBody()}
        </div>

        {/* Actions — normal flow so they never overlap the fixed bottom nav */}
        <div className="gate-actions mt-6 space-y-1.5 lg:mt-0 lg:px-10 lg:pb-8">
          <button
            type="button"
            className="btn-primary w-full justify-center"
            disabled={isLast && !confirm}
            onClick={next}
          >
            {isLast ? t("findRoom.terms.agree") : t("common.next")}
          </button>
          <button type="button" className="btn-ghost w-full justify-center" onClick={back}>
            {t("findRoom.terms.back")}
          </button>
        </div>
      </div>
    </div>
  );
}
