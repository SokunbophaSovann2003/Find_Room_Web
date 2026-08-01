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

const TOTAL = 2;

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
    { icon: "check", text: t("findRoom.terms.point1") },
    { icon: "eye", text: t("findRoom.terms.point2") },
    { icon: "message", text: t("findRoom.terms.point3") },
    { icon: "user", text: t("findRoom.terms.point4") },
    { icon: "home", text: t("findRoom.terms.point5") },
    { icon: "shield", text: t("findRoom.terms.point6") },
    { icon: "check", text: t("findRoom.terms.point7") },
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

  // Two screens: How it works → Terms & safety (which also carries the public
  // warning + the consent checkbox, since it's the final step before Agree).
  const heroByStep = [
    { bg: "bg-emerald-50", node: <HeroSearch /> },
    { bg: "bg-teal-50", node: <HeroShield /> },
  ];
  const hero = heroByStep[step];

  const heads = [
    { title: t("findRoom.terms.how.title"), sub: t("findRoom.terms.how.sub") },
    { title: t("findRoom.terms.good.title"), sub: t("findRoom.terms.good.sub") },
  ];

  // Step body. Flex list items carry `min-w-0` so long Khmer strings (which the
  // browser can't break at spaces) wrap instead of overflowing.
  function renderContent() {
    if (step === 0) {
      return (
        <ol className="space-y-3.5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="min-w-0 text-sm leading-relaxed text-ink">{s}</span>
            </li>
          ))}
        </ol>
      );
    }
    // Final screen: the terms & safety points + consent.
    return (
      <div className="space-y-5">
        <ul className="space-y-3">
          {safety.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-[13px] leading-relaxed text-ink">
              <Icon name={s.icon} className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span className="min-w-0">{s.text}</span>
            </li>
          ))}
        </ul>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
          />
          <span className="min-w-0 text-sm text-ink">{t("findRoom.terms.confirm")}</span>
        </label>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-md flex-col px-5 py-6">
      {/* Progress + skip */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL}
          aria-label={t("findRoom.terms.stepOf", { n: step + 1, total: TOTAL })}
        >
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

      {/* Illustration in a soft blob. Keyed on step so the entrance replays. */}
      <div
        key={`hero-${step}`}
        className={`onb-rise mx-auto mt-8 flex h-56 w-56 items-center justify-center rounded-[44%] ${hero.bg}`}
      >
        {hero.node}
      </div>

      {/* Title + subtitle */}
      <div key={`head-${step}`} className="onb-rise mt-7 text-center">
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{heads[step].title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{heads[step].sub}</p>
      </div>

      {/* Step body */}
      <div key={`body-${step}`} className="onb-rise mt-6">
        {renderContent()}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="mt-8 space-y-1.5">
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
  );
}
