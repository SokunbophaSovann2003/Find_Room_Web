"use client";

import { useLanguage, useT, type Language } from "@/lib/language";

// flagcdn ships sharp rectangular SVG flags. We render them in a rounded-
// rectangle badge (matching the 2:3 flag aspect) so the full design — the
// blue/red/blue stripes and the Angkor Wat — stays recognizable; a circular
// crop would hide most of the blue.
const FLAG_URLS: Record<Language, string> = {
  km: "https://flagcdn.com/kh.svg",
  en: "https://flagcdn.com/gb.svg"
};

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();
  const t = useT();
  const next: Language = language === "km" ? "en" : "km";
  const currentLabel = t(`language.${language}`);
  const nextLabel = t(`language.${next}`);

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={t("language.toggle.title", { current: currentLabel, next: nextLabel })}
      aria-label={t("language.toggle.aria", { current: currentLabel, next: nextLabel })}
      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition hover:ring-2 hover:ring-brand/30 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FLAG_URLS[language]}
        alt=""
        aria-hidden
        className="h-full w-full object-cover"
      />
    </button>
  );
}
