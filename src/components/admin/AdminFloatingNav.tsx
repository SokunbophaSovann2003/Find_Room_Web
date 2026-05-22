"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import { isAdmin, useAdminNotifications } from "@/lib/admin";
import { useSession } from "@/lib/session";
import { useViewMode } from "@/lib/view-mode";
import { useKeyboardOpen } from "@/lib/use-keyboard-open";

const NAV: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/user/admin", label: "Rooms", icon: "home", exact: true },
  { href: "/user/admin/users", label: "Users", icon: "user" },
  { href: "/user/admin/notifications", label: "Notifications", icon: "message" },
  { href: "/user/admin/settings", label: "Settings", icon: "shield" }
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

  const inAdminRoute = pathname?.startsWith("/user/admin") ?? false;
  const adminSession = isAdmin(session);
  const shouldRender = adminSession && (inAdminRoute || viewMode === "admin");

  if (!shouldRender) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="h-24" aria-hidden />
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-[1050] flex justify-center px-3 ${
          keyboardOpen ? "hidden" : ""
        }`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <nav
          aria-label="Admin"
          className="pointer-events-auto grid w-full max-w-md grid-cols-4 items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-cardHover backdrop-blur"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            const showBadge = item.label === "Notifications" && unread > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-ink-muted hover:bg-slate-50 hover:text-ink"
                }`}
              >
                <Icon name={item.icon} className="h-5 w-5" />
                <span>{item.label}</span>
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
