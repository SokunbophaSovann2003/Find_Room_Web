"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { loginWithPhone, registerWithPhone } from "@/lib/auth";

type Tab = "login" | "register";

export default function AuthModal({
  open,
  onClose,
  onSuccess,
  dismissible = true,
  defaultTab = "login"
}: {
  open: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  dismissible?: boolean;
  defaultTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    if (!open) return;
    setTab(defaultTab);
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open || !dismissible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissible, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-card sm:rounded-3xl sm:p-6"
      >
        {dismissible ? (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        ) : null}

        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
            <Icon name="home" className="h-5 w-5" />
          </span>
          <span className="text-base font-extrabold tracking-tight">
            FindRoom<span className="text-brand">.KH</span>
          </span>
        </div>

        {tab === "login" ? (
          <LoginForm onSuccess={onSuccess} switchToRegister={() => setTab("register")} />
        ) : (
          <RegisterForm onSuccess={onSuccess} switchToLogin={() => setTab("login")} />
        )}
      </div>
    </div>
  );
}

function LoginForm({
  onSuccess,
  switchToRegister
}: {
  onSuccess?: () => void;
  switchToRegister: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithPhone(`+855${phone}`, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-extrabold tracking-tight">Welcome back</h2>
      <p className="text-sm text-ink-muted">Log in with your phone number to continue.</p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="label">Phone number</label>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
            <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-ink-muted">
              +855
            </span>
            <input
              type="tel"
              placeholder="12 345 678"
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-ink-soft"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label">Password</label>
            <Link href="#" className="text-xs font-medium text-brand hover:text-brand-dark">
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Log in"}
          {loading ? null : <Icon name="arrow-right" className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        No account yet?{" "}
        <button
          type="button"
          onClick={switchToRegister}
          className="font-semibold text-brand hover:text-brand-dark"
        >
          Create one
        </button>
      </p>
    </>
  );
}

function RegisterForm({
  onSuccess,
  switchToLogin
}: {
  onSuccess?: () => void;
  switchToLogin: () => void;
}) {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerWithPhone({ username, phoneNumber: `+855${phone}`, password });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-extrabold tracking-tight">Create your account</h2>
      <p className="text-sm text-ink-muted">It takes less than a minute.</p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="label">Full name</label>
          <input
            placeholder="Sokha Chan"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Phone number</label>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
            <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-ink-muted">
              +855
            </span>
            <input
              type="tel"
              placeholder="12 345 678"
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-ink-soft"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            placeholder="At least 8 characters"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            required
          />
          <span>
            I agree to the{" "}
            <Link href="#" className="font-medium text-brand hover:text-brand-dark">Terms</Link>{" "}
            and{" "}
            <Link href="#" className="font-medium text-brand hover:text-brand-dark">Privacy Policy</Link>.
          </span>
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
          {loading ? null : <Icon name="arrow-right" className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <button
          type="button"
          onClick={switchToLogin}
          className="font-semibold text-brand hover:text-brand-dark"
        >
          Log in
        </button>
      </p>
    </>
  );
}
