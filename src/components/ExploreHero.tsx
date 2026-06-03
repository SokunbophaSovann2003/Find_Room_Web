"use client";

import { useT } from "@/lib/language";

export default function ExploreHero() {
  const t = useT();
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl xl:text-6xl">
        {t("explore.hero.title.before")} <span className="text-brand">{t("explore.hero.title.highlight")}</span>
      </h1>
      <p className="mt-4 hidden text-sm text-ink-muted sm:block sm:text-base lg:text-lg">
        {t("explore.hero.subtitle")}
      </p>
    </div>
  );
}
