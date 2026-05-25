"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import AuthModal from "@/components/AuthModal";
import { getSession, subscribeSession, type Session } from "@/lib/session";
import { isAdmin, seedMockListings } from "@/lib/admin";
import { signOut } from "@/lib/auth";
import { useT } from "@/lib/language";

type Status = "checking" | "denied" | "ok";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [session, setSessionState] = useState<Session | null>(null);
  const t = useT();

  useEffect(() => {
    function apply(s: Session | null) {
      setSessionState(s);
      if (!s) setStatus("denied");
      else if (!isAdmin(s)) setStatus("denied");
      else setStatus("ok");
    }
    apply(getSession());
    return subscribeSession(apply);
  }, []);

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
      <DeniedScreen
        session={session}
        onAuthSuccess={() => {
          const s = getSession();
          if (s && isAdmin(s)) setStatus("ok");
          else setStatus("denied");
        }}
      />
    );
  }

  return <AdminFrame>{children}</AdminFrame>;
}

function DeniedScreen({
  session,
  onAuthSuccess
}: {
  session: Session | null;
  onAuthSuccess: () => void;
}) {
  const router = useRouter();
  const t = useT();
  // Open the login modal whenever the user is signed out — this covers both
  // "never logged in" and "switched account" flows so they don't have to find
  // the login button themselves.
  const [authOpen, setAuthOpen] = useState(!session);

  useEffect(() => {
    if (!session) setAuthOpen(true);
  }, [session]);

  async function handleSwitchAccount() {
    await signOut();
    // Session change subscription will repaint the screen; opening the modal
    // here lets the user log in inline.
    setAuthOpen(true);
  }

  return (
    <>
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Icon name="shield" className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-extrabold">{t("admin.denied.title")}</h1>
        <p className="text-sm text-ink-muted">
          {session
            ? t("admin.denied.body.signedIn")
            : t("admin.denied.body.signedOut")}
        </p>
        <div className="flex gap-2">
          <Link href="/explore" className="btn-secondary">
            {t("admin.denied.backToExplore")}
          </Link>
          {session ? (
            <button type="button" className="btn-danger" onClick={handleSwitchAccount}>
              {t("admin.denied.switchAccount")}
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={() => setAuthOpen(true)}>
              <Icon name="log-out" className="h-4 w-4 rotate-180" />
              {t("auth.login.submit")}
            </button>
          )}
        </div>
      </div>
      <AuthModal
        open={authOpen}
        dismissible
        onClose={() => {
          setAuthOpen(false);
          if (!session) router.replace("/explore");
        }}
        onSuccess={() => {
          setAuthOpen(false);
          onAuthSuccess();
        }}
      />
    </>
  );
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  // Push the MOCK_ROOMS catalog into local storage so each mock user's
  // listings render on the admin user-detail page. Idempotent — guarded by a
  // localStorage flag inside the helper.
  useEffect(() => {
    seedMockListings();
  }, []);

  // The floating admin nav is now mounted globally in the root layout via
  // <AdminFloatingNav />, so it persists across non-admin routes like
  // /rooms/[id] when the admin keeps "Admin" view selected.
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
