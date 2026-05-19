"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import {
  deleteLocalRoom,
  updateLocalRoom
} from "@/lib/local-rooms";
import type { Room } from "@/lib/types";

export default function ListingActionMenu({
  room,
  align = "right"
}: {
  room: Room;
  align?: "left" | "right";
}) {
  const router = useRouter();
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

  function stop(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDelete(e: React.MouseEvent) {
    stop(e);
    setOpen(false);
    const ok = window.confirm(`Delete "${room.title}"? This can't be undone.`);
    if (!ok) return;
    deleteLocalRoom(room.id);
  }

  function handleCopy(e: React.MouseEvent) {
    stop(e);
    setOpen(false);
    router.push(
      `/profile/list-room?type=${room.type}&copyFrom=${encodeURIComponent(room.id)}`
    );
  }

  function handleToggleOccupied(e: React.MouseEvent) {
    stop(e);
    setOpen(false);
    updateLocalRoom(room.id, { isOccupied: !room.isOccupied });
  }

  return (
    <div ref={wrapRef} className="relative" onClick={stop}>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setOpen((cur) => !cur);
        }}
        aria-label="Listing options"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-slate-100 hover:text-ink"
      >
        <Icon name="more-vertical" className="h-5 w-5" />
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute top-full z-30 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-cardHover ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <MenuItem
            icon={room.isOccupied ? "check" : "home"}
            label={room.isOccupied ? "Mark as available" : "Mark as occupied"}
            onClick={handleToggleOccupied}
          />
          <MenuItem icon="copy" label="Copy" onClick={handleCopy} />
          <MenuItem icon="trash" label="Delete" onClick={handleDelete} danger />
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
        danger ? "text-red-700 hover:bg-red-50" : "text-ink"
      }`}
    >
      <Icon name={icon} className="h-4 w-4 shrink-0" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
