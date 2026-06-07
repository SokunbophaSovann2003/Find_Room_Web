"use client";

import { toast } from "./toast";
import { translate } from "./language";

function isQuotaError(e: unknown): boolean {
  // Browsers report a full store in a few different ways.
  return (
    e instanceof DOMException &&
    (e.name === "QuotaExceededError" ||
      e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      e.code === 22 ||
      e.code === 1014)
  );
}

// Wraps localStorage.setItem so a full store (or any write failure) surfaces a
// friendly toast instead of throwing an uncaught error that aborts the user's
// action. Returns true on success, false if the write was rejected.
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (e) {
    toast.error(translate(isQuotaError(e) ? "toast.storage.full" : "toast.storage.failed"));
    return false;
  }
}
