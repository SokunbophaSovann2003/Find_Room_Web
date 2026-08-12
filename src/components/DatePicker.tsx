"use client";

// Single-date picker styled to the app (brand calendar popup) — a drop-in
// replacement for a native <input type="date"> whose popup can't be themed.
// Mobile: centered modal with a backdrop. Desktop: dropdown under the field.

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { useT } from "@/lib/language";

const WEEKDAY_KEYS = [
  "dateRange.weekday.sun",
  "dateRange.weekday.mon",
  "dateRange.weekday.tue",
  "dateRange.weekday.wed",
  "dateRange.weekday.thu",
  "dateRange.weekday.fri",
  "dateRange.weekday.sat"
];

interface DatePickerProps {
  value: string; // ISO yyyy-mm-dd or ""
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, className, placeholder }: DatePickerProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = parseISO(value);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? new Date()));

  // Snap the calendar to the selected month (or today) each time it opens.
  useEffect(() => {
    if (open) setViewMonth(startOfMonth(parseISO(value) ?? new Date()));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = selected ? fmtDDMM(value) : placeholder ?? t("common.selectDate");

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="input flex w-full items-center justify-between gap-2 text-left"
      >
        <span className={selected ? "text-ink" : "text-ink-soft"}>{label}</span>
        {selected ? (
          <span className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Icon name="calendar" className="h-4 w-4 shrink-0 text-ink-muted" />
        )}
      </button>
      {selected ? (
        <button
          type="button"
          aria-label={t("common.clear")}
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
            setOpen(false);
          }}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition hover:bg-slate-200 hover:text-ink"
        >
          <Icon name="x" className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {open ? (
        <>
          <div aria-hidden onClick={() => setOpen(false)} className="fixed inset-0 z-[1150] bg-ink/40 backdrop-blur-sm lg:hidden" />
          <div
            role="dialog"
            aria-label={t("common.selectDate")}
            className="fixed left-1/2 top-1/2 z-[1200] w-[min(340px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-cardHover lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-1.5 lg:w-[320px] lg:translate-x-0 lg:translate-y-0"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                aria-label={t("dateRange.prevMonth")}
                className="rounded-full p-1 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
              >
                <Icon name="chevron-left" className="h-4 w-4" />
              </button>
              <div className="text-sm font-semibold text-ink">
                {t(`dateRange.month.${viewMonth.getMonth()}`)} {viewMonth.getFullYear()}
              </div>
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                aria-label={t("dateRange.nextMonth")}
                className="rounded-full p-1 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
              >
                <Icon name="chevron-right" className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-ink-soft">
              {WEEKDAY_KEYS.map((wk) => (
                <div key={wk} className="py-1">{t(wk)}</div>
              ))}
            </div>

            <div className="mt-0.5 grid grid-cols-7 gap-0.5 text-center text-xs">
              {buildCalendarGrid(viewMonth).map((d) => {
                const curMonth = d.getMonth() === viewMonth.getMonth();
                const isSel = sameDay(d, selected);
                return (
                  <button
                    key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
                    type="button"
                    onClick={() => {
                      onChange(toISO(d));
                      setOpen(false);
                    }}
                    className={cellClass(curMonth, isSel)}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => {
                  onChange(toISO(startOfDay(new Date())));
                  setOpen(false);
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand transition hover:bg-brand/5"
              >
                {t("dateRange.preset.today")}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1 text-xs font-semibold text-ink-muted transition hover:bg-slate-100 hover:text-ink"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function cellClass(isCurMonth: boolean, isSel: boolean) {
  const base = "h-8 w-8 mx-auto rounded-full text-xs transition";
  if (isSel) return `${base} bg-brand font-semibold text-white hover:bg-brand`;
  if (!isCurMonth) return `${base} text-slate-300 hover:bg-slate-50`;
  return `${base} text-ink hover:bg-slate-100`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function parseISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function fmtDDMM(s: string) {
  const d = parseISO(s);
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}
function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function buildCalendarGrid(month: Date) {
  const first = startOfMonth(month);
  const start = addDays(first, -first.getDay());
  const out: Date[] = [];
  for (let i = 0; i < 42; i++) out.push(addDays(start, i));
  return out;
}
