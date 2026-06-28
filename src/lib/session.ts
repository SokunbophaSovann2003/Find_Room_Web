"use client";

import { useEffect, useState } from "react";

// Lightweight client session used by the auth guard. Works whether or not
// Firebase is configured — login/register pages call `setSession` on success
// and `AuthGuard` subscribes to changes.

const KEY = "findroom.session";
const EVENT = "findroom:session-change";

export interface Session {
  uid: string;
  username?: string;
  phoneNumber?: string;
  // Set only when the user authenticated through the /user/admin login form.
  // Admin routes require this flag in addition to the Firestore role check.
  adminSession?: boolean;
  // Unix ms timestamp of when the admin session was created. Used to expire
  // admin access after ADMIN_SESSION_TTL_MS regardless of browser activity.
  adminSessionAt?: number;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(EVENT));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeSession(cb: (session: Session | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb(getSession());
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    setSession(getSession());
    return subscribeSession(setSession);
  }, []);
  return session;
}
