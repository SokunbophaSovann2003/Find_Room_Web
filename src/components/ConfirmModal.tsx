"use client";

import { useEffect } from "react";
import Icon, { type IconName } from "./Icon";
import { useT } from "@/lib/language";

// Shared confirmation dialog used everywhere we need a Yes/No prompt. Replaces
// native `window.confirm` (which renders with OS chrome) and de-duplicates the
// dozen near-identical inline modals scattered through the admin/user pages.
//
// Two variants:
//   default — neutral primary action (e.g. "Apply", "Continue")
//   danger  — destructive action with red CTA and trash glyph in the header
export interface ConfirmModalProps {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  // Icon shown in the header. Defaults to `trash` for danger and `shield` for
  // default; pass a name to override.
  icon?: IconName;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  icon,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const t = useT();
  // Esc-to-close. Mirrors the behavior of every other custom modal in the app
  // so keyboard users don't have to learn a new pattern per dialog.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";
  const resolvedIcon: IconName = icon ?? (isDanger ? "trash" : "shield");
  const resolvedConfirmLabel = confirmLabel ?? (isDanger ? t("common.delete") : t("common.confirm"));
  const resolvedCancelLabel = cancelLabel ?? t("common.cancel");

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-ink/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-cardHover"
      >
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              isDanger ? "bg-red-100 text-red-700" : "bg-brand/10 text-brand"
            }`}
          >
            <Icon name={resolvedIcon} className="h-4 w-4" />
          </span>
          <h3 className="text-base font-bold">{title}</h3>
        </div>
        {body ? <div className="text-sm text-ink-muted">{body}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={isDanger ? "btn-danger" : "btn-primary"}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
