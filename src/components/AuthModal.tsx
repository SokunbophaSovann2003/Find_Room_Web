"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { loginWithPhone, registerWithPhone, resetPassword, checkPhoneAccountExists } from "@/lib/auth";
import { sendOtp, verifyOtp, verifyOtpForReset } from "@/lib/otp";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useT } from "@/lib/language";

type Tab = "login" | "register" | "forgot";

// Map Firebase error codes to app-level i18n keys so raw SDK strings never reach the UI.
function firebaseAuthKey(err: unknown): string {
  const code = (err as { code?: string }).code ?? "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") return "auth.error.invalidCredential";
  if (code === "auth/email-already-in-use") return "auth.error.phoneInUse";
  if (code === "auth/too-many-requests") return "auth.error.tooManyRequests";
  if (code === "auth/user-disabled") return "auth.error.disabled";
  return err instanceof Error ? err.message : "auth.error.signInFailed";
}

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
  defaultTab?: Exclude<Tab, "forgot">;
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
          <LoginForm
            onSuccess={onSuccess}
            switchToRegister={() => setTab("register")}
            switchToForgot={() => setTab("forgot")}
          />
        ) : tab === "register" ? (
          <RegisterForm onSuccess={onSuccess} switchToLogin={() => setTab("login")} />
        ) : (
          <ForgotPasswordForm onSuccess={onSuccess} switchToLogin={() => setTab("login")} />
        )}
      </div>
    </div>
  );
}

// ─── Shared: phone field with real-time digit counter ────────────────────────

function PhoneField({
  value,
  onChange
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useT();
  const digits = value.replace(/\D/g, "");
  const phoneOk = digits.length >= 8 && digits.length <= 9;
  const phoneTouched = digits.length > 0;

  return (
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      </div>
      {phoneTouched ? (
        <p className={`mt-1 text-[11px] font-medium ${phoneOk ? "text-emerald-600" : "text-amber-600"}`}>
          {phoneOk
            ? "✓"
            : t("auth.field.phone.digitHint", { n: String(digits.length) })}
        </p>
      ) : null}
    </div>
  );
}

// ─── Shared: password field with visibility toggle ───────────────────────────

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  minLength
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  minLength?: number;
}) {
  const t = useT();
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="input pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? t("auth.field.password.hide") : t("auth.field.password.show")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          tabIndex={-1}
        >
          <Icon name={show ? "eye-off" : "eye"} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Shared: 6-box OTP input ─────────────────────────────────────────────────

function OtpField({
  value,
  onChange
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function handleChange(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const chars = Array.from({ length: 6 }, (_, j) => value.charAt(j));
    chars[i] = digit;
    onChange(chars.join(""));
    if (i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (value.charAt(i)) {
        const chars = Array.from({ length: 6 }, (_, j) => value.charAt(j));
        chars[i] = "";
        onChange(chars.join("").trimEnd());
      } else if (i > 0) {
        const chars = Array.from({ length: 6 }, (_, j) => value.charAt(j));
        chars[i - 1] = "";
        onChange(chars.join("").trimEnd());
        refs.current[i - 1]?.focus();
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(digits);
    refs.current[Math.min(digits.length, 5)]?.focus();
  }

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value.charAt(i)}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-12 w-10 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      ))}
    </div>
  );
}

// ─── Shared: resend countdown timer ──────────────────────────────────────────

function ResendTimer({ onResend }: { onResend: () => void }) {
  const t = useT();
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  if (seconds > 0) {
    return (
      <p className="text-center text-xs text-ink-muted">
        {t("auth.otp.resendIn", { n: String(seconds) })}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => { onResend(); setSeconds(60); }}
      className="w-full text-center text-xs font-semibold text-brand hover:text-brand-dark"
    >
      {t("auth.otp.resend")}
    </button>
  );
}

// ─── Login form ──────────────────────────────────────────────────────────────

function LoginForm({
  onSuccess,
  switchToRegister,
  switchToForgot
}: {
  onSuccess?: () => void;
  switchToRegister: () => void;
  switchToForgot: () => void;
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
      setError(t(firebaseAuthKey(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-extrabold tracking-tight">{t("auth.login.title")}</h2>
      <p className="text-sm text-ink-muted">{t("auth.login.subtitle")}</p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <PhoneField value={phone} onChange={setPhone} />

        <PasswordField
          label={t("auth.field.password")}
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
        />

        <div className="text-right">
          <button
            type="button"
            onClick={switchToForgot}
            className="text-xs font-semibold text-brand hover:text-brand-dark"
          >
            {t("auth.forgot.link")}
          </button>
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

// ─── Register form ───────────────────────────────────────────────────────────

type RegisterStep = "form" | "otp";

function RegisterForm({
  onSuccess,
  switchToLogin
}: {
  onSuccess?: () => void;
  switchToLogin: () => void;
}) {
  const t = useT();
  const [step, setStep] = useState<RegisterStep>("form");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = phone.replace(/\D/g, "");
  const formattedPhone = `+855 ${digits}`;

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) { setError(t("auth.error.name.required")); return; }
    if (digits.length < 8 || digits.length > 9) { setError(t("auth.error.phone.invalid")); return; }
    if (password.length < 8) { setError(t("auth.error.password.tooShort")); return; }
    if (password !== confirmPassword) { setError(t("auth.error.confirmPassword.mismatch")); return; }
    setLoading(true);
    setError(null);
    try {
      // In demo mode we can check for duplicates before burning an OTP.
      // In Firebase mode the users collection is auth-gated; the duplicate is
      // caught post-OTP when createUserWithEmailAndPassword throws.
      if (!isFirebaseConfigured && await checkPhoneAccountExists(`+855${digits}`)) {
        setError(t("auth.error.phoneInUse"));
        return;
      }
      const { demoCode: code } = await sendOtp(`+855${digits}`);
      setDemoCode(code);
      setOtp("");
      setStep("otp");
    } catch (err) {
      setError(t(firebaseAuthKey(err)));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.replace(/\s/g, "").length < 6) { setError(t("auth.otp.error.invalid")); return; }
    if (!await verifyOtp(`+855${digits}`, otp)) { setError(t("auth.otp.error.invalid")); return; }
    setLoading(true);
    setError(null);
    try {
      await registerWithPhone({ username: username.trim(), phoneNumber: `+855${digits}`, password });
      onSuccess?.();
    } catch (err) {
      setError(t(firebaseAuthKey(err)));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const { demoCode: code } = await sendOtp(`+855${digits}`);
    setDemoCode(code);
    setOtp("");
    setError(null);
  }

  if (step === "otp") {
    return (
      <>
        <button
          type="button"
          onClick={() => { setStep("form"); setError(null); }}
          className="-ml-1 mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
          {t("common.back")}
        </button>

        <h2 className="text-xl font-extrabold tracking-tight">{t("auth.otp.title")}</h2>
        <p className="text-sm text-ink-muted">{t("auth.otp.subtitle", { phone: formattedPhone })}</p>

        <form className="mt-5 space-y-4" onSubmit={handleVerifyOtp}>
          <OtpField value={otp} onChange={setOtp} />

          {demoCode ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
              {t("auth.otp.demo.hint", { code: demoCode })}
            </p>
          ) : null}

          <ResendTimer onResend={handleResend} />

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || otp.replace(/\s/g, "").length < 6}
          >
            {loading ? t("auth.otp.verifying") : t("auth.otp.submit")}
            {loading ? null : <Icon name="arrow-right" className="h-4 w-4" />}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <h2 className="text-xl font-extrabold tracking-tight">{t("auth.register.title")}</h2>
      <p className="text-sm text-ink-muted">{t("auth.register.subtitle")}</p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmitForm}>
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

        <PhoneField value={phone} onChange={setPhone} />

        <PasswordField
          label={t("auth.field.password")}
          placeholder={t("auth.field.password.placeholder.short")}
          value={password}
          onChange={setPassword}
          minLength={8}
        />

        <PasswordField
          label={t("auth.field.confirmPassword")}
          placeholder={t("auth.field.password.placeholder.short")}
          value={confirmPassword}
          onChange={setConfirmPassword}
          minLength={8}
        />

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

// ─── Forgot password form ────────────────────────────────────────────────────

type ForgotStep = "phone" | "otp" | "newPassword" | "done";

function ForgotPasswordForm({
  onSuccess,
  switchToLogin
}: {
  onSuccess?: () => void;
  switchToLogin: () => void;
}) {
  const t = useT();
  const [step, setStep] = useState<ForgotStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [resetNonce, setResetNonce] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = phone.replace(/\D/g, "");
  const formattedPhone = `+855 ${digits}`;

  async function handleFindAccount(e: React.FormEvent) {
    e.preventDefault();
    if (digits.length < 8 || digits.length > 9) { setError(t("auth.error.phone.invalid")); return; }
    setLoading(true);
    setError(null);
    try {
      // In Firebase mode the existence check is skipped — the resetPassword
      // Cloud Function returns auth.forgot.notFound at the end if the account
      // doesn't exist, avoiding an unauthenticated Firestore read.
      if (!isFirebaseConfigured) {
        if (!await checkPhoneAccountExists(`+855${digits}`)) throw new Error(t("auth.forgot.notFound"));
      }
      const { demoCode: code } = await sendOtp(`+855${digits}`);
      setDemoCode(code);
      setOtp("");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.forgot.notFound"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.replace(/\s/g, "").length < 6) { setError(t("auth.otp.error.invalid")); return; }
    setLoading(true);
    setError(null);
    try {
      const nonce = await verifyOtpForReset(`+855${digits}`, otp);
      setResetNonce(nonce);
      setStep("newPassword");
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : t("auth.otp.error.invalid"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { setError(t("auth.error.password.tooShort")); return; }
    if (!resetNonce) { setError(t("auth.forgot.notFound")); return; }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(`+855${digits}`, resetNonce, newPassword);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : t("auth.forgot.noSupport"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const { demoCode: code } = await sendOtp(`+855${digits}`);
    setDemoCode(code);
    setOtp("");
    setError(null);
  }

  function goBack() {
    if (step === "phone") {
      switchToLogin();
    } else {
      // From otp or newPassword: go back to phone so user can restart with a fresh OTP
      setStep("phone");
      setOtp("");
      setDemoCode(null);
      setError(null);
    }
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <h2 className="text-xl font-extrabold tracking-tight">{t("auth.forgot.success.title")}</h2>
        <p className="max-w-xs text-sm text-ink-muted">{t("auth.forgot.success.body")}</p>
        <button type="button" onClick={onSuccess} className="btn-primary mt-2 w-full">
          {t("common.continue")}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={goBack}
        className="-ml-1 mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
        {step === "phone" ? t("auth.forgot.back") : t("common.back")}
      </button>

      <h2 className="text-xl font-extrabold tracking-tight">{t("auth.forgot.title")}</h2>
      <p className="text-sm text-ink-muted">
        {step === "phone"
          ? t("auth.forgot.subtitle")
          : step === "otp"
          ? t("auth.otp.subtitle", { phone: formattedPhone })
          : t("auth.forgot.newPasswordSubtitle")}
      </p>

      {step === "phone" ? (
        <form className="mt-4 space-y-3" onSubmit={handleFindAccount}>
          <PhoneField value={phone} onChange={setPhone} />

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t("auth.forgot.finding") : t("auth.forgot.findAccount")}
          </button>
        </form>
      ) : step === "otp" ? (
        <form className="mt-5 space-y-4" onSubmit={handleVerifyOtp}>
          <OtpField value={otp} onChange={setOtp} />

          {demoCode ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
              {t("auth.otp.demo.hint", { code: demoCode })}
            </p>
          ) : null}

          <ResendTimer onResend={handleResend} />

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || otp.replace(/\s/g, "").length < 6}
          >
            {loading ? t("auth.otp.verifying") : t("auth.otp.submit")}
            {loading ? null : <Icon name="arrow-right" className="h-4 w-4" />}
          </button>
        </form>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={handleSetPassword}>
          <PasswordField
            label={t("auth.forgot.newPassword")}
            placeholder={t("auth.field.password.placeholder.short")}
            value={newPassword}
            onChange={setNewPassword}
            minLength={8}
          />

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t("auth.forgot.setting") : t("auth.forgot.setPassword")}
            {loading ? null : <Icon name="arrow-right" className="h-4 w-4" />}
          </button>
        </form>
      )}
    </>
  );
}
