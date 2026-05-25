"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { loginWithPhone, registerWithPhone } from "@/lib/auth";
import { useT } from "@/lib/language";

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
  const t = useT();

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
    <div className="fixed inset-0 z-[1100] flex items-end justify-center px-0 sm:items-center sm:px-4">
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
            aria-label={t("common.close")}
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
            Joul<span className="text-brand">.KH</span>
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
  const t = useT();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 9) {
      setError(t("auth.error.phone.invalid"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithPhone(`+855${digits}`, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.error.signInFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-extrabold tracking-tight">{t("auth.login.title")}</h2>
      <p className="text-sm text-ink-muted">{t("auth.login.subtitle")}</p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="label">{t("auth.field.phone")}</label>
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
          <label className="label">{t("auth.field.password")}</label>
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
          {loading ? t("auth.login.submitting") : t("auth.login.submit")}
          {loading ? null : <Icon name="arrow-right" className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        {t("auth.switch.toRegister.q")}{" "}
        <button
          type="button"
          onClick={switchToRegister}
          className="font-semibold text-brand hover:text-brand-dark"
        >
          {t("auth.switch.toRegister.cta")}
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
  const t = useT();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setError(t("auth.error.name.required"));
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 9) {
      setError(t("auth.error.phone.invalid"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.error.password.tooShort"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerWithPhone({ username: username.trim(), phoneNumber: `+855${digits}`, password });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.error.signUpFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-extrabold tracking-tight">{t("auth.register.title")}</h2>
      <p className="text-sm text-ink-muted">{t("auth.register.subtitle")}</p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="label">{t("auth.field.fullName")}</label>
          <input
            placeholder={t("auth.field.fullName.placeholder")}
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">{t("auth.field.phone")}</label>
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
          <label className="label">{t("auth.field.password")}</label>
          <input
            type="password"
            placeholder={t("auth.field.password.placeholder.short")}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>


        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t("auth.register.submitting") : t("auth.register.submit")}
          {loading ? null : <Icon name="arrow-right" className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        {t("auth.switch.toLogin.q")}{" "}
        <button
          type="button"
          onClick={switchToLogin}
          className="font-semibold text-brand hover:text-brand-dark"
        >
          {t("auth.switch.toLogin.cta")}
        </button>
      </p>
    </>
  );
}
