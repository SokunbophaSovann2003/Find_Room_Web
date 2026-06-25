// OTP helpers.
// In Firebase mode: delegates to Cloud Functions (Twilio SMS delivery).
// In demo mode: in-memory store with the code shown on screen.

import { httpsCallable } from "firebase/functions";
import { functions, isFirebaseConfigured } from "./firebase";

const OTP_TTL_MS = 5 * 60 * 1000;

interface OtpRecord {
  code: string;
  expiresAt: number;
}

const store = new Map<string, OtpRecord>();

function randomSixDigits(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Send an OTP to the given phone number.
// Firebase mode: real SMS via Twilio Cloud Function — demoCode is null.
// Demo mode: in-memory code displayed in the UI — demoCode is the code string.
export async function sendOtp(phone: string, purpose?: "register" | "reset"): Promise<{ demoCode: string | null }> {
  if (isFirebaseConfigured && functions) {
    const result = await httpsCallable<{ phone: string; purpose?: string }, { success: boolean; demoCode?: string }>(
      functions, "sendVerificationCode"
    )({ phone, ...(purpose ? { purpose } : {}) });
    return { demoCode: result.data.demoCode ?? null };
  }
  const code = randomSixDigits();
  store.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS });
  return { demoCode: code };
}

// Verify OTP for the Register flow — consumes the code on success.
export async function verifyOtp(phone: string, input: string): Promise<boolean> {
  if (isFirebaseConfigured && functions) {
    try {
      await httpsCallable(functions, "verifyCode")({ phone, code: input.trim() });
      return true;
    } catch {
      return false;
    }
  }
  const record = store.get(phone);
  if (!record) return false;
  if (Date.now() > record.expiresAt) { store.delete(phone); return false; }
  if (record.code !== input.trim()) return false;
  store.delete(phone);
  return true;
}

// Verify OTP for the Forgot Password flow — consumes the code and returns a
// one-time nonce that must be passed to resetPassword().
// Demo mode returns a static sentinel nonce ("demo-verified").
export async function verifyOtpForReset(phone: string, input: string): Promise<string> {
  if (isFirebaseConfigured && functions) {
    const result = await httpsCallable<
      { phone: string; code: string },
      { nonce: string }
    >(functions, "verifyCodeForReset")({ phone, code: input.trim() });
    return result.data.nonce;
  }
  const record = store.get(phone);
  if (!record || Date.now() > record.expiresAt || record.code !== input.trim()) {
    throw new Error("auth.otp.error.invalid");
  }
  store.delete(phone);
  return "demo-verified";
}
