"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import ConfirmModal from "./ConfirmModal";
import {
  deleteLocalRoom,
  updateLocalRoom
} from "@/lib/local-rooms";
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
  const [open, setOpen] = useState(false);
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
    const nextOccupied = !room.isOccupied;
    updateLocalRoom(room.id, { isOccupied: nextOccupied });
    toast.success(
      t(
        nextOccupied ? "toast.listing.occupied" : "toast.listing.available",
        { title: room.title }
      )
    );
  }

  return (
    <div ref={wrapRef} className="relative" onClick={stop}>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setOpen((cur) => !cur);
        }}
        aria-label={t("listing.menu.aria")}
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
            label={t(room.isOccupied ? "listing.menu.markAvailable" : "listing.menu.markOccupied")}
            onClick={handleToggleOccupied}
          />
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
          deleteLocalRoom(room.id);
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
