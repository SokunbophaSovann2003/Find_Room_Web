"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  className?: string;
  placeholder?: string;
}

export default function DateRangePicker({
  from,
  to,
  onChange,
  className,
  placeholder = "All dates"
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = from || to ? `${fmtDDMM(from)} ~ ${fmtDDMM(to)}` : placeholder;
  const empty = !from && !to;

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="input flex w-full items-center justify-between gap-2 text-left"
      >
        <span className={`truncate whitespace-nowrap ${empty ? "text-ink-soft" : "text-ink"}`}>
          {label}
        </span>
        <Icon name="calendar" className="h-4 w-4 shrink-0 text-ink-muted" />
      </button>
      {open ? (
        <PickerPanel
          from={from}
          to={to}
          onCancel={() => setOpen(false)}
          onApply={(f, t) => {
            onChange(f, t);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

const SAVE_KEY = "findroom.daterange-save-filters";

function PickerPanel({
  from,
  to,
  onCancel,
  onApply
}: {
  from: string;
  to: string;
  onCancel: () => void;
  onApply: (from: string, to: string) => void;
}) {
  const today = startOfDay(new Date());
  const initFrom = parseISO(from);
  const initTo = parseISO(to);
  const [tempFrom, setTempFrom] = useState<Date | null>(initFrom);
  const [tempTo, setTempTo] = useState<Date | null>(initTo);
  const [leftMonth, setLeftMonth] = useState(() =>
    startOfMonth(initFrom ?? initTo ?? today)
  );
  const [saveFilters, setSaveFilters] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SAVE_KEY) === "1";
  });

  const year = leftMonth.getFullYear();

  function pickDate(d: Date) {
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(d);
      setTempTo(null);
      return;
    }
    if (d < tempFrom) {
      setTempTo(tempFrom);
      setTempFrom(d);
    } else {
      setTempTo(d);
    }
  }

  function applyPreset(preset: string) {
    const [f, t] = computePreset(preset, year);
    setTempFrom(f);
    setTempTo(t);
    setLeftMonth(startOfMonth(f));
  }

  function commit() {
    if (typeof window !== "undefined") {
      if (saveFilters) localStorage.setItem(SAVE_KEY, "1");
      else localStorage.removeItem(SAVE_KEY);
    }
    onApply(tempFrom ? toISO(tempFrom) : "", tempTo ? toISO(tempTo) : "");
  }

  const rightMonth = addMonths(leftMonth, 1);

  return (
    <>
      {/* Backdrop — only on mobile/tablet so the panel reads as a modal. */}
      <div
        aria-hidden
        onClick={onCancel}
        className="fixed inset-0 z-[1150] bg-ink/40 lg:hidden"
      />
    <div
      role="dialog"
      aria-label="Select date range"
      className="fixed left-1/2 top-1/2 z-[1200] flex max-h-[90vh] w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-cardHover lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-1.5 lg:max-h-none lg:w-[min(720px,calc(100vw-2rem))] lg:translate-x-0 lg:translate-y-0 lg:overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-ink-soft">Year</span>
          <button
            type="button"
            onClick={() => setLeftMonth(new Date(year - 1, leftMonth.getMonth(), 1))}
            className="rounded-full p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
            aria-label="Previous year"
          >
            <Icon name="chevron-left" className="h-4 w-4" />
          </button>
          <span className="font-bold text-ink">{year}</span>
          <button
            type="button"
            onClick={() => setLeftMonth(new Date(year + 1, leftMonth.getMonth(), 1))}
            className="rounded-full p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
            aria-label="Next year"
          >
            <Icon name="chevron-right" className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs text-ink-muted">
          <span className="font-semibold text-ink">
            {tempFrom ? fmtDDMM(toISO(tempFrom)) : "Start"}
          </span>
          <span className="px-2">~</span>
          <span className="font-semibold text-ink">
            {tempTo ? fmtDDMM(toISO(tempTo)) : "End"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-2.5">
        <PresetChip label="Today" onClick={() => applyPreset("today")} />
        <PresetChip label="Yesterday" onClick={() => applyPreset("yesterday")} />
        <PresetChip label="This Week" onClick={() => applyPreset("thisWeek")} />
        <PresetChip label="Last Week" onClick={() => applyPreset("lastWeek")} />
        <PresetChip label="This Month" onClick={() => applyPreset("thisMonth")} />
        <PresetChip label="Last Month" onClick={() => applyPreset("lastMonth")} />
        <PresetChip label="This Year" onClick={() => applyPreset("thisYear")} />
      </div>

      <div className="grid grid-cols-6 gap-1.5 border-b border-slate-100 px-4 py-2.5 sm:grid-cols-12">
        {MONTHS.map((m, i) => (
          <PresetChip key={m} label={m} onClick={() => applyPreset(`m${i}`)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 px-4 py-3 lg:grid-cols-2">
        <CalendarMonth
          month={leftMonth}
          tempFrom={tempFrom}
          tempTo={tempTo}
          onShift={(delta) => setLeftMonth(addMonths(leftMonth, delta))}
          onPick={pickDate}
        />
        <div className="hidden lg:block">
          <CalendarMonth
            month={rightMonth}
            tempFrom={tempFrom}
            tempTo={tempTo}
            onShift={(delta) => setLeftMonth(addMonths(leftMonth, delta))}
            onPick={pickDate}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-2.5">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={saveFilters}
            onChange={(e) => setSaveFilters(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-brand focus:ring-brand"
          />
          Save filters
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTempFrom(null);
              setTempTo(null);
              onApply("", "");
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-slate-100 hover:text-ink"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-slate-100 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={commit}
            className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand/90"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

function CalendarMonth({
  month,
  tempFrom,
  tempTo,
  onShift,
  onPick
}: {
  month: Date;
  tempFrom: Date | null;
  tempTo: Date | null;
  onShift: (delta: number) => void;
  onPick: (d: Date) => void;
}) {
  const monthName = month.toLocaleString("en-US", { month: "long" });
  const year = month.getFullYear();
  const days = buildCalendarGrid(month);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onShift(-1)}
          className="rounded-full p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
          aria-label="Previous month"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
        </button>
        <div className="text-sm font-semibold text-ink">
          {monthName} {year}
        </div>
        <button
          type="button"
          onClick={() => onShift(1)}
          className="rounded-full p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
          aria-label="Next month"
        >
          <Icon name="chevron-right" className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-ink-soft">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-0.5 text-center text-xs">
        {days.map((d) => {
          const isCurMonth = d.getMonth() === month.getMonth();
          const isStart = sameDay(d, tempFrom);
          const isEnd = sameDay(d, tempTo);
          const inRange = inRangeStrict(d, tempFrom, tempTo);
          return (
            <button
              key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
              type="button"
              onClick={() => onPick(d)}
              className={cellClass(isCurMonth, isStart, isEnd, inRange)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function cellClass(
  isCurMonth: boolean,
  isStart: boolean,
  isEnd: boolean,
  inRange: boolean
) {
  const base = "h-7 w-7 mx-auto rounded-full text-xs transition";
  if (!isCurMonth) return `${base} text-slate-300 hover:bg-slate-50`;
  if (isStart || isEnd)
    return `${base} bg-brand font-semibold text-white hover:bg-brand`;
  if (inRange) return `${base} bg-brand/10 text-ink`;
  return `${base} text-ink hover:bg-slate-100`;
}

function PresetChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink-muted transition hover:border-brand hover:text-brand"
    >
      {label}
    </button>
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
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
  const parts = s.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function fmtDDMM(s: string) {
  const d = parseISO(s);
  if (!d) return "dd/mm/yyyy";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function inRangeStrict(d: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  return d > from && d < to;
}

function buildCalendarGrid(month: Date) {
  const first = startOfMonth(month);
  const start = addDays(first, -first.getDay());
  const out: Date[] = [];
  for (let i = 0; i < 42; i++) out.push(addDays(start, i));
  return out;
}

function computePreset(preset: string, year: number): [Date, Date] {
  const today = startOfDay(new Date());
  if (preset === "today") return [today, today];
  if (preset === "yesterday") {
    const y = addDays(today, -1);
    return [y, y];
  }
  if (preset === "thisWeek") {
    const start = addDays(today, -today.getDay());
    return [start, addDays(start, 6)];
  }
  if (preset === "lastWeek") {
    const start = addDays(today, -today.getDay() - 7);
    return [start, addDays(start, 6)];
  }
  if (preset === "thisMonth") {
    const start = startOfMonth(today);
    return [start, endOfMonth(start)];
  }
  if (preset === "lastMonth") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return [start, endOfMonth(start)];
  }
  if (preset === "thisYear")
    return [
      new Date(today.getFullYear(), 0, 1),
      new Date(today.getFullYear(), 11, 31)
    ];
  if (preset === "h1") return [new Date(year, 0, 1), new Date(year, 5, 30)];
  if (preset === "h2") return [new Date(year, 6, 1), new Date(year, 11, 31)];
  if (preset === "q1") return [new Date(year, 0, 1), new Date(year, 2, 31)];
  if (preset === "q2") return [new Date(year, 3, 1), new Date(year, 5, 30)];
  if (preset === "q3") return [new Date(year, 6, 1), new Date(year, 8, 30)];
  if (preset === "q4") return [new Date(year, 9, 1), new Date(year, 11, 31)];
  if (preset === "byToday") return [new Date(year, 0, 1), today];
  if (preset.startsWith("m")) {
    const idx = parseInt(preset.slice(1), 10);
    const start = new Date(year, idx, 1);
    return [start, endOfMonth(start)];
  }
  return [today, today];
}
