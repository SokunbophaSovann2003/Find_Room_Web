"use client";

import { useEffect, useState } from "react";

export type ToastKind = "success" | "error" | "info";

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  duration: number;
};

type Listener = (toasts: Toast[]) => void;

let counter = 0;
let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const fn of listeners) fn(toasts);
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function showToast(
  message: string,
  kind: ToastKind = "info",
  duration = 3200
) {
  const id = ++counter;
  toasts = [...toasts, { id, kind, message, duration }];
  emit();
  if (duration > 0 && typeof window !== "undefined") {
    window.setTimeout(() => dismiss(id), duration);
  }
  return id;
}

export const toast = {
  success: (message: string, duration?: number) =>
    showToast(message, "success", duration),
  error: (message: string, duration?: number) =>
    showToast(message, "error", duration ?? 4500),
  info: (message: string, duration?: number) =>
    showToast(message, "info", duration)
};

export function dismissToast(id: number) {
  dismiss(id);
}

export function useToasts(): Toast[] {
  const [snapshot, setSnapshot] = useState<Toast[]>(toasts);
  useEffect(() => {
    listeners.add(setSnapshot);
    setSnapshot(toasts);
    return () => {
      listeners.delete(setSnapshot);
    };
  }, []);
  return snapshot;
}
