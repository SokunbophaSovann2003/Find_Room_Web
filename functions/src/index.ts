import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import twilio from "twilio";

admin.initializeApp();
const db = admin.firestore();

const TWILIO_SID  = process.env.TWILIO_ACCOUNT_SID  ?? "";
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN    ?? "";
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER   ?? "";
const twilioReady = Boolean(TWILIO_SID && TWILIO_AUTH && TWILIO_FROM);
const twilioClient = twilioReady ? twilio(TWILIO_SID, TWILIO_AUTH) : null;

const OTP_TTL_MS       = 5  * 60 * 1000;  // 5 minutes
const NONCE_TTL_MS     = 10 * 60 * 1000;  // 10 minutes
const RESEND_COOLDOWN  = 60 * 1000;        // 60 seconds between sends
const MAX_ATTEMPTS     = 5;

function sixDigits(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hexNonce(len = 32): string {
  const chars = "0123456789abcdef";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * 16)]).join("");
}

// ─── sendVerificationCode ───────────────────────────────────────────────────
// Generates a 6-digit OTP, stores it in Firestore, and sends it via Twilio.
export const sendVerificationCode = onCall({ invoker: "public" }, async (request) => {
  const phone = request.data?.phone as string | undefined;
  if (!phone || typeof phone !== "string") {
    throw new HttpsError("invalid-argument", "phone is required");
  }

  const ref = db.collection("otp_codes").doc(phone);
  const existing = await ref.get();
  if (existing.exists) {
    const d = existing.data()!;
    if (Date.now() < (d.sentAt as number) + RESEND_COOLDOWN) {
      throw new HttpsError("resource-exhausted", "Please wait 60 seconds before requesting a new code.");
    }
  }

  const code = sixDigits();
  await ref.set({
    code,
    attempts: 0,
    sentAt: Date.now(),
    expiresAt: Date.now() + OTP_TTL_MS
  });

  if (twilioClient) {
    await twilioClient.messages.create({
      body: `Your Joul.KH verification code is ${code}. Valid for 5 minutes.`,
      from: TWILIO_FROM,
      to: phone
    });
    return { success: true };
  }

  // Twilio not configured — return code so the client can show it in demo mode
  return { success: true, demoCode: code };
});

// ─── verifyCode ─────────────────────────────────────────────────────────────
// Validates and consumes an OTP for the Register flow.
export const verifyCode = onCall({ invoker: "public" }, async (request) => {
  const { phone, code } = request.data as { phone?: string; code?: string };
  if (!phone || !code) {
    throw new HttpsError("invalid-argument", "phone and code are required");
  }

  const ref = db.collection("otp_codes").doc(phone);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "auth.otp.error.expired");
  }

  const d = snap.data()!;
  if (Date.now() > (d.expiresAt as number)) {
    await ref.delete();
    throw new HttpsError("deadline-exceeded", "auth.otp.error.expired");
  }
  if ((d.attempts as number) >= MAX_ATTEMPTS) {
    await ref.delete();
    throw new HttpsError("resource-exhausted", "auth.otp.error.tooManyAttempts");
  }
  if (d.code !== code.trim()) {
    await ref.update({ attempts: admin.firestore.FieldValue.increment(1) });
    throw new HttpsError("invalid-argument", "auth.otp.error.invalid");
  }

  await ref.delete();
  return { valid: true };
});

// ─── verifyCodeForReset ──────────────────────────────────────────────────────
// Validates and consumes an OTP for the Forgot Password flow.
// On success, stores a short-lived nonce in password_reset_tokens and returns it.
export const verifyCodeForReset = onCall({ invoker: "public" }, async (request) => {
  const { phone, code } = request.data as { phone?: string; code?: string };
  if (!phone || !code) {
    throw new HttpsError("invalid-argument", "phone and code are required");
  }

  const ref = db.collection("otp_codes").doc(phone);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "auth.otp.error.expired");
  }

  const d = snap.data()!;
  if (Date.now() > (d.expiresAt as number)) {
    await ref.delete();
    throw new HttpsError("deadline-exceeded", "auth.otp.error.expired");
  }
  if ((d.attempts as number) >= MAX_ATTEMPTS) {
    await ref.delete();
    throw new HttpsError("resource-exhausted", "auth.otp.error.tooManyAttempts");
  }
  if (d.code !== code.trim()) {
    await ref.update({ attempts: admin.firestore.FieldValue.increment(1) });
    throw new HttpsError("invalid-argument", "auth.otp.error.invalid");
  }

  await ref.delete();

  const nonce = hexNonce();
  await db.collection("password_reset_tokens").doc(phone).set({
    nonce,
    expiresAt: Date.now() + NONCE_TTL_MS
  });

  return { nonce };
});

// ─── resetPassword ───────────────────────────────────────────────────────────
// Validates the nonce issued by verifyCodeForReset, looks up the user by phone,
// and updates their password via the Firebase Admin SDK.
export const resetPassword = onCall({ invoker: "public" }, async (request) => {
  const { phone, nonce, newPassword } = request.data as {
    phone?: string;
    nonce?: string;
    newPassword?: string;
  };
  if (!phone || !nonce || !newPassword) {
    throw new HttpsError("invalid-argument", "phone, nonce, and newPassword are required");
  }
  if (newPassword.length < 8) {
    throw new HttpsError("invalid-argument", "auth.error.password.tooShort");
  }

  const tokenRef = db.collection("password_reset_tokens").doc(phone);
  const tokenSnap = await tokenRef.get();
  if (!tokenSnap.exists) {
    throw new HttpsError("not-found", "auth.forgot.notFound");
  }
  const td = tokenSnap.data()!;
  if (Date.now() > (td.expiresAt as number)) {
    await tokenRef.delete();
    throw new HttpsError("deadline-exceeded", "auth.otp.error.expired");
  }
  if (td.nonce !== nonce) {
    throw new HttpsError("permission-denied", "auth.forgot.notFound");
  }

  // Look up the Firebase Auth UID by phone number stored in Firestore users.
  const usersSnap = await db
    .collection("users")
    .where("phoneNumber", "==", phone)
    .limit(1)
    .get();
  if (usersSnap.empty) {
    throw new HttpsError("not-found", "auth.forgot.notFound");
  }
  const uid = usersSnap.docs[0].id;

  await admin.auth().updateUser(uid, { password: newPassword });
  await tokenRef.delete();

  return { success: true };
});
