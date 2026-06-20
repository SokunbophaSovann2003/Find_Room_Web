"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import ConfirmModal from "./ConfirmModal";
import { deleteRoom, updateRoom } from "@/lib/rooms";
import { useAdminSettings } from "@/lib/admin";
import { isAutoOccupied } from "@/lib/auto-occupy";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import type { Room } from "@/lib/types";

export default function ListingActionMenu({
  room,
  align = "right"
}: {
  room: Room;
  align?: "left" | "right";
}) {
  const router = useRouter();
  const t = useT();
  const { autoOccupyDays } = useAdminSettings();
  // A room is "effectively occupied" if manually marked OR auto-occupied by
  // inactivity. The menu label and toggle action must match this combined state.
  const autoOccupied = isAutoOccupied(room, autoOccupyDays);
  const effectivelyOccupied = room.isOccupied || autoOccupied;
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
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
    setConfirmDeleteOpen(true);
  }

  function handleEdit(e: React.MouseEvent) {
    stop(e);
    setOpen(false);
    router.push(
      `/profile/list-room?type=${room.type}&editing=${encodeURIComponent(room.id)}`
    );
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
    if (autoOccupied) {
      // Room is auto-occupied (isOccupied is false in storage but the clock
      // expired). "Mark Available" means resetting lastActivityAt so the room
      // becomes visible on Explore again — not flipping isOccupied.
      void updateRoom(room.id, { isOccupied: false, lastActivityAt: Date.now() });
      toast.success(t("toast.listing.available", { title: room.title }));
    } else {
      const nextOccupied = !room.isOccupied;
      void updateRoom(room.id, { isOccupied: nextOccupied });
      toast.success(
        t(
          nextOccupied ? "toast.listing.occupied" : "toast.listing.available",
          { title: room.title }
        )
      );
    }
  }

  return (
    <div ref={wrapRef} className="relative" onClick={stop}>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          if (!open && wrapRef.current) {
            const rect = wrapRef.current.getBoundingClientRect();
            // ~176px = 4 menu items × ~44px each + ~64px bottom nav
            setOpenUpward(window.innerHeight - rect.bottom < 240);
          }
          setOpen((cur) => !cur);
        }}
        aria-label={t("listing.menu.aria")}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/40 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white/70"
      >
        <Icon name="more-vertical" className="h-5 w-5" />
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute z-30 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-cardHover ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${align === "right" ? "right-0" : "left-0"}`}
        >
          <MenuItem
            icon={effectivelyOccupied ? "check" : "home"}
            label={t(effectivelyOccupied ? "listing.menu.markAvailable" : "listing.menu.markOccupied")}
            onClick={handleToggleOccupied}
          />
          <MenuItem icon="pencil" label={t("common.edit")} onClick={handleEdit} />
          <MenuItem icon="copy" label={t("common.copy")} onClick={handleCopy} />
          <MenuItem icon="trash" label={t("common.delete")} onClick={handleDelete} danger />
        </div>
      ) : null}
      <ConfirmModal
        open={confirmDeleteOpen}
        title={t("listing.delete.confirm.title")}
        body={
          <>
            <b>{room.title}</b> {t("listing.delete.confirm.body")}
          </>
        }
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          void deleteRoom(room.id, room.owner.id);
          toast.success(t("toast.listing.deleted", { title: room.title }));
        }}
      />
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
