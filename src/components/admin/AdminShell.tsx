"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { getSession, setSession, subscribeSession, type Session } from "@/lib/session";
import { useIsAdmin, isAdmin, seedMockListings } from "@/lib/admin";
import { loginWithPhone, signOut } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useT } from "@/lib/language";

type Status = "checking" | "denied" | "ok";

// Admin sessions expire after 8 hours of inactivity regardless of browser state.
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [session, setSessionState] = useState<Session | null>(() => getSession());
  const t = useT();
  const { admin, loading } = useIsAdmin(session);

  useEffect(() => {
    return subscribeSession((s) => setSessionState(s));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) { setStatus("denied"); return; }
    if (!admin) { setStatus("denied"); return; }
    if (!session.adminSession) { setStatus("denied"); return; }
    // Expire the admin session after TTL — sign out silently.
    const age = Date.now() - (session.adminSessionAt ?? 0);
    if (age > ADMIN_SESSION_TTL_MS) {
      void signOut();
      setStatus("denied");
      return;
    }
    setStatus("ok");
  }, [session, admin, loading]);

  if (status === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div className="flex flex-col items-center gap-3 text-ink-muted">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm">{t("admin.shell.checking")}</p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <AdminLoginScreen
        session={session}
        onSessionChange={(s) => setSessionState(s)}
      />
    );
  }

  return <AdminFrame>{children}</AdminFrame>;
}

// Maps Firebase error codes to i18n keys.
function firebaseAuthKey(err: unknown): string {
  const code = (err as { code?: string }).code ?? "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") return "auth.error.invalidCredential";
  if (code === "auth/too-many-requests") return "auth.error.tooManyRequests";
  if (code === "auth/user-disabled") return "auth.error.disabled";
  if (code === "auth/network-request-failed") return "auth.error.networkFailed";
  const msg = err instanceof Error ? err.message : "";
  if (msg.startsWith("auth.")) return msg;
  return "auth.error.signInFailed";
}

function AdminLoginScreen({
  session,
  onSessionChange
}: {
  session: Session | null;
  onSessionChange: (s: Session | null) => void;
}) {
  const t = useT();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSwitchAccount() {
    await signOut();
    onSessionChange(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError("");
    setError("");

    const digits = phone.replace(/\D/g, "").replace(/^0/, "");
    if (digits.length < 8 || digits.length > 9) {
      setPhoneError(t("auth.error.phone.invalid"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.error.password.tooShort"));
      return;
    }

    setSubmitting(true);
    try {
      await loginWithPhone(`+855${digits}`, password);
      const s = getSession();

      let isAdminUser = false;
      if (isFirebaseConfigured) {
        // One-shot Firestore read to verify role before granting access.
        const { db } = await import("@/lib/firebase");
        if (db && s) {
          const { getDoc, doc } = await import("firebase/firestore");
          const snap = await getDoc(doc(db, "users", s.uid));
          const data = snap.data();
          isAdminUser = data?.role === "admin" && data?.status === "active";
        }
      } else {
        isAdminUser = isAdmin(s);
      }

      if (!isAdminUser) {
        await signOut();
        onSessionChange(null);
        setError(t("admin.login.notAuthorized"));
      } else {
        // Stamp the session so AdminShell knows this login came through the
        // admin form — not from the regular user AuthModal. Record the time
        // so the session can be expired after ADMIN_SESSION_TTL_MS.
        const adminStampedSession = {
          ...s!,
          adminSession: true as const,
          adminSessionAt: Date.now(),
        };
        setSession(adminStampedSession);
        onSessionChange(adminStampedSession);
      }
    } catch (err: unknown) {
      setError(t(firebaseAuthKey(err)));
    } finally {
      setSubmitting(false);
    }
  }

  // Logged in but not an admin — show a minimal "not authorized" screen.
  if (session) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Icon name="shield" className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-extrabold">{t("admin.denied.title")}</h1>
        <p className="text-sm text-ink-muted">{t("admin.denied.body.signedIn")}</p>
        <button type="button" className="btn-danger" onClick={handleSwitchAccount}>
          {t("admin.denied.switchAccount")}
        </button>
      </div>
    );
  }

  // Not logged in — show the dedicated admin login form.
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
          <Icon name="shield" className="h-7 w-7 text-brand" />
        </span>
        <h1 className="text-xl font-extrabold">{t("admin.login.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("admin.login.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="label">{t("auth.field.phone")}</label>
          <div className={`flex overflow-hidden rounded-xl border bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${phoneError ? "border-red-400" : "border-slate-200"}`}>
            <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-ink-muted">
              +855
            </span>
            <input
              type="tel"
              placeholder="097 353 1332"
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-ink-soft"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
              disabled={submitting}
              autoComplete="tel"
            />
          </div>
          {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="label">{t("auth.field.password")}</label>
          <input
            className="input w-full"
            type="password"
            placeholder={t("auth.field.password.placeholder.short")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          className="btn-primary w-full justify-center"
          disabled={submitting}
        >
          {submitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
      </form>
    </div>
  );
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    seedMockListings();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
