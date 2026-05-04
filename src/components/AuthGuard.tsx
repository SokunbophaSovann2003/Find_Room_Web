"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, subscribeSession, type Session } from "@/lib/session";
import AuthModal from "./AuthModal";

type Status = "checking" | "authenticated" | "unauthenticated";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    function apply(s: Session | null) {
      setStatus(s ? "authenticated" : "unauthenticated");
    }
    apply(getSession());
    const unsub = subscribeSession(apply);
    return () => unsub();
  }, []);

  if (status === "authenticated") return <>{children}</>;

  return (
    <>
      {status === "checking" ? (
        <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
          <div className="flex flex-col items-center gap-3 text-ink-muted">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="text-sm">Checking your session…</p>
          </div>
        </div>
      ) : (
        <div className="min-h-[60vh]" />
      )}
      <AuthModal
        open={status === "unauthenticated"}
        dismissible
        onClose={() => router.replace("/explore")}
        onSuccess={() => setStatus("authenticated")}
      />
    </>
  );
}
