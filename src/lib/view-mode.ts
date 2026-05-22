"use client";

import { useEffect, useState } from "react";

// "viewMode" is a sticky preference for whether an admin sees admin chrome
// (floating bottom nav + Admin pill active) or user chrome (List-room button,
// User bottom nav) when navigating shared routes like /rooms/[id]. The path
// alone isn't enough: /user/admin/* is unambiguously admin, but /rooms/[id]
// can be reached from either context.

export type ViewMode = "user" | "admin";

const KEY = "findroom.view-mode";
const EVENT = "findroom:view-mode-change";

export function getViewMode(): ViewMode {
  if (typeof window === "undefined") return "user";
  const raw = window.localStorage.getItem(KEY);
  return raw === "admin" ? "admin" : "user";
}

export function setViewMode(mode: ViewMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, mode);
  window.dispatchEvent(new Event(EVENT));
}

export function useViewMode(): ViewMode {
  const [mode, setMode] = useState<ViewMode>("user");
  useEffect(() => {
    setMode(getViewMode());
    function sync() {
      setMode(getViewMode());
    }
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return mode;
}
