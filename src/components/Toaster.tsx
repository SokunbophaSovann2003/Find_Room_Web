"use client";

import Icon, { type IconName } from "./Icon";
import { dismissToast, useToasts, type ToastKind } from "@/lib/toast";
import { useT } from "@/lib/language";

const KIND_STYLES: Record<ToastKind, { icon: IconName; bg: string; ring: string; iconColor: string }> = {
  success: {
    icon: "check",
    bg: "bg-white",
    ring: "ring-emerald-200",
    iconColor: "bg-brand/10 text-brand"
  },
  error: {
    icon: "x",
    bg: "bg-white",
    ring: "ring-red-200",
    iconColor: "bg-red-100 text-red-700"
  },
  info: {
    icon: "message",
    bg: "bg-white",
    ring: "ring-slate-200",
    iconColor: "bg-slate-100 text-ink-muted"
  }
};

export default function Toaster() {
  const toasts = useToasts();
  const t = useT();

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-slide-down {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
        .toast-enter {
          animation: toast-slide-down 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-4 z-[1200] flex flex-col items-center gap-2 px-3"
      >
        {toasts.map((item) => {
          const s = KIND_STYLES[item.kind];
          return (
            <div
              key={item.id}
              role={item.kind === "error" ? "alert" : "status"}
              className={`toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl ${s.bg} px-3.5 py-3 shadow-cardHover ring-1 ${s.ring}`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.iconColor}`}
              >
                <Icon name={s.icon} className="h-4 w-4" />
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">
                {item.message}
              </p>
              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                aria-label={t("toast.dismiss.aria")}
                className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-slate-100 hover:text-ink"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
