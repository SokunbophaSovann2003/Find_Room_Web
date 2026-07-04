"use client";

import Link from "next/link";
import Icon from "./Icon";
import { useT } from "@/lib/language";

// "Help me find a room" entry point, shown at the top of Explore. Links to the
// /find-room request form (which itself gates on sign-in).
export default function FindRoomCta() {
  const t = useT();
  return (
    <Link
      href="/find-room"
      className="group mx-auto mt-5 flex max-w-4xl items-center justify-center gap-2 rounded-2xl border border-brand/30 bg-white/70 px-4 py-3 text-center text-sm font-semibold text-brand shadow-sm backdrop-blur transition hover:bg-brand hover:text-white sm:text-base"
    >
      <Icon name="search" className="h-4 w-4 shrink-0" />
      <span>{t("explore.findRoom.cta")}</span>
      <Icon name="arrow-right" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
