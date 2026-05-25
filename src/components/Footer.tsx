"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { isAdmin } from "@/lib/admin";
import { useSession } from "@/lib/session";
import { useViewMode } from "@/lib/view-mode";
import { useT } from "@/lib/language";

const CONTACT = {
  phone: "+855 12 345 678",
  telegram: "+855 12 345 678",
  email: "hello@findroom.kh",
  facebook: "findroom.kh"
};

export default function Footer() {
  const pathname = usePathname();
  const session = useSession();
  const viewMode = useViewMode();
  const t = useT();
  const phoneDigits = CONTACT.phone.replace(/\D/g, "");
  const telegramLink = `+${CONTACT.telegram.replace(/\D/g, "")}`;

  // Admin shell owns its own surface — drop the marketing footer.
  if (pathname?.startsWith("/user/admin")) return null;
  // The list-room form owns the full bottom area with its own action bar.
  if (pathname === "/profile/list-room") return null;
  // Admins reviewing a listing through admin chrome don't need the marketing
  // footer below the listing — keep the surface focused on moderation.
  if (
    pathname?.startsWith("/rooms/") &&
    viewMode === "admin" &&
    isAdmin(session)
  ) {
    return null;
  }

  return (
    <footer className="relative mt-20 hidden shrink-0 overflow-hidden bg-gradient-to-br from-brand-50 via-white to-amber-50 sm:block">
      <div className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr] md:py-14">
        <div>
          <Link href="/explore" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <Icon name="home" className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Joul<span className="text-brand">.KH</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            {t("footer.tagline")}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            {t("footer.contact.heading")}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <ContactRow
              icon="phone"
              label={CONTACT.phone}
              href={`tel:${phoneDigits}`}
            />
            <ContactRow
              icon="telegram"
              label="Telegram"
              href={`https://t.me/${telegramLink}`}
            />
            <ContactRow
              icon="email"
              label={CONTACT.email}
              href={`mailto:${CONTACT.email}`}
            />
            <ContactRow
              icon="facebook"
              label="Facebook"
              href={`https://facebook.com/${CONTACT.facebook}`}
            />
          </ul>
        </div>
      </div>

      <div className="relative border-t border-slate-200/70">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-ink-soft sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Joul.KH</span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="map-pin" className="h-3.5 w-3.5" />
            {t("footer.madeIn")}
          </span>
        </div>
      </div>
    </footer>
  );
}

function ContactRow({
  icon,
  label,
  href
}: {
  icon: "phone" | "telegram" | "email" | "facebook";
  label: string;
  href: string;
}) {
  // Plain <a> rather than Next.js <Link> — these targets are protocol/external
  // URLs (tel:, mailto:, https:) and Link's client-side router can't handle
  // them, which would surface as a 404 in dev.
  const external = href.startsWith("http");
  return (
    <li>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="group inline-flex items-center gap-2.5 text-ink-muted transition hover:text-brand"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/70 text-ink-muted ring-1 ring-slate-200 transition group-hover:bg-brand group-hover:text-white group-hover:ring-brand">
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
        {label}
      </a>
    </li>
  );
}
