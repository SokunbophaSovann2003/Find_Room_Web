"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import { isAdmin, useAdminNotifications } from "@/lib/admin";
import { useSession } from "@/lib/session";
import { useViewMode } from "@/lib/view-mode";
import { useKeyboardOpen } from "@/lib/use-keyboard-open";
import { useT } from "@/lib/language";

const NAV: { href: string; labelKey: string; icon: IconName; exact?: boolean }[] = [
  { href: "/user/admin", labelKey: "admin.nav.rooms", icon: "home", exact: true },
  { href: "/user/admin/users", labelKey: "admin.nav.users", icon: "user" },
  { href: "/user/admin/notifications", labelKey: "admin.nav.notifications", icon: "message" },
  { href: "/user/admin/settings", labelKey: "admin.nav.settings", icon: "shield" }
];

function isActive(pathname: string | null, item: (typeof NAV)[number]): boolean {
  if (!pathname) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

// Render the floating admin nav whenever the signed-in admin has chosen
// "Admin" view, OR when they're already inside /user/admin/* (in which case
// the AdminShell renders this and view-mode is implied).
export default function AdminFloatingNav() {
  const session = useSession();
  const viewMode = useViewMode();
  const pathname = usePathname();
  const keyboardOpen = useKeyboardOpen();
  const notifications = useAdminNotifications();
  const t = useT();

  const inAdminRoute = pathname?.startsWith("/user/admin") ?? false;
  const inRoomDetail = pathname?.startsWith("/rooms/") ?? false;
  const inListRoom = pathname === "/profile/list-room";
  const adminSession = isAdmin(session);
  const shouldRender = adminSession && (inAdminRoute || viewMode === "admin");

  // Pages that own their own bottom action bar suppress the global tabbed nav
  // so the two don't stack on top of each other.
  if (shouldRender && (inRoomDetail || inListRoom) && !inAdminRoute) return null;

  if (!shouldRender) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Spacer: shorter on mobile (matches the user BottomNav), taller on
          desktop to clear the floating pill. */}
      <div className="h-20 sm:h-24" aria-hidden />
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-[1050] flex justify-center sm:px-3 ${
          keyboardOpen ? "hidden" : ""
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <nav
          aria-label={t("admin.nav.aria")}
          // Mobile: edge-to-edge bar with a top border (same chrome as the
          // user BottomNav). Desktop: floating rounded pill.
          className="pointer-events-auto grid w-full grid-cols-4 items-start gap-1 border-t border-slate-200 bg-white/95 px-4 pb-2 pt-2.5 backdrop-blur sm:max-w-md sm:items-center sm:rounded-2xl sm:border sm:px-2 sm:py-2 sm:shadow-cardHover sm:mb-3"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            const showBadge = item.labelKey === "admin.nav.notifications" && unread > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                // Mobile: flat tab (color-only active state, matches user
                // BottomNav). Desktop: rounded chip with tinted bg.
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 text-[11px] font-semibold transition sm:rounded-xl ${
                  active
                    ? "text-brand sm:bg-brand/10"
                    : "text-ink-muted hover:text-ink sm:hover:bg-slate-50"
                }`}
              >
                <Icon name={item.icon} className="h-5 w-5" />
                <span>{t(item.labelKey)}</span>
                {showBadge ? (
                  <span className="absolute right-2 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
