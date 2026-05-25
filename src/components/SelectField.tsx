"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";

// Drop-in replacement for `<select>` that renders with our own chrome instead
// of the OS-native dropdown. Used inside forms (including ones nested in
// modals) so we never expose browser-default popup UI to the user.
//
// The dropdown panel is portalled to <body> so it escapes any parent overflow
// (sheet modals, scrollable cards, etc.) and never gets clipped. Position is
// computed from the trigger's bounding rect and re-measured on scroll/resize.

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectFieldProps<T extends string> {
  id?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (next: T) => void;
  // a11y label. Required because there's no native `<label>`/native semantics
  // for screen readers to fall back on.
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // Override the trigger's classes for tight layouts (e.g. list-room's compact
  // fee grid where the standard `.input` height would break alignment). When
  // omitted, the trigger uses the regular `.input` chrome.
  triggerClassName?: string;
}

interface MenuPosition {
  left: number;
  width: number;
  // Either `top` or `bottom` is set; the other is undefined. Using `bottom`
  // for upward-opening so the menu grows toward the trigger.
  top?: number;
  bottom?: number;
}

const MENU_MAX_H = 288; // matches max-h-72 below
const MENU_GAP = 6; // mt-1.5 / mb-1.5

export default function SelectField<T extends string>({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  disabled = false,
  className = "",
  triggerClassName
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the portalled menu against the trigger. Re-measure on every open
  // and on window scroll/resize while open.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function measure() {
      const t = triggerRef.current!.getBoundingClientRect();
      const roomBelow = window.innerHeight - t.bottom;
      const roomAbove = t.top;
      const openUp = roomBelow < MENU_MAX_H && roomAbove > roomBelow;
      setPosition(
        openUp
          ? { left: t.left, width: t.width, bottom: window.innerHeight - t.top + MENU_GAP }
          : { left: t.left, width: t.width, top: t.bottom + MENU_GAP }
      );
    }

    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  // Outside-click closes — check both trigger and portalled menu since they
  // live in different DOM subtrees.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // We deliberately do NOT attach a window-level Esc listener — the dropdown
  // is commonly used inside a modal that already owns Esc, and dual listeners
  // would close both at once.

  const current = options.find((o) => o.value === value);

  // SSR / first render before mount: skip the portal (no document). Falls back
  // to closed state, which is the safe default.
  const canPortal = typeof document !== "undefined";

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={
          triggerClassName ??
          "input flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        <span className={`truncate ${current ? "" : "text-ink-soft"}`}>
          {current?.label ?? placeholder ?? "Select…"}
        </span>
        <Icon
          name="chevron-down"
          className={`h-4 w-4 shrink-0 text-ink-soft transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && canPortal && position
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              aria-label={ariaLabel}
              // z-[1200] sits above modal panels (z-[1100]) and form-level
              // selects' dropdowns since this is portalled at <body> level.
              style={{
                position: "fixed",
                left: position.left,
                width: position.width,
                top: position.top,
                bottom: position.bottom
              }}
              className="z-[1200] max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-cardHover"
            >
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${
                      active
                        ? "bg-brand/10 font-semibold text-brand"
                        : "text-ink hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {active ? <Icon name="check" className="h-4 w-4 text-brand" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
