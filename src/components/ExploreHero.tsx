"use client";

import { useT } from "@/lib/language";

export default function ExploreHero() {
  const t = useT();
  return (
    <div className="mx-auto hidden max-w-3xl text-center sm:block">
      <h1 className="text-3xl font-bold tracking-tight text-ink leading-tight sm:text-4xl sm:leading-snug lg:text-5xl lg:leading-normal xl:text-6xl xl:leading-relaxed">
        {t("explore.hero.title.before")} <span className="text-brand">{t("explore.hero.title.highlight")}</span>
      </h1>
      <p className="mt-4 hidden text-lg text-ink-muted sm:block sm:text-xl lg:text-2xl">
        {t("explore.hero.subtitle")}
      </p>
    </div>
  );
}
