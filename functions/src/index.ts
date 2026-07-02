import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

admin.initializeApp();
const db = admin.firestore();

const AWS_REGION = process.env.AWS_REGION ?? "ap-southeast-1";
const snsReady = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const sns = snsReady
  ? new SNSClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const OTP_TTL_MS      = 5  * 60 * 1000;  // 5 minutes
const NONCE_TTL_MS    = 10 * 60 * 1000;  // 10 minutes
const RESEND_COOLDOWN = 60 * 1000;        // 60 seconds between sends
const MAX_ATTEMPTS    = 5;

function sixDigits(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hexNonce(len = 32): string {
  const chars = "0123456789abcdef";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * 16)]).join("");
}

async function sendSms(phone: string, message: string): Promise<void> {
  if (!sns) return;
  await sns.send(new PublishCommand({
    PhoneNumber: phone,
    Message: message,
    MessageAttributes: {
      "AWS.SNS.SMS.SenderID": { DataType: "String", StringValue: "JoulKH" },
      "AWS.SNS.SMS.SMSType":  { DataType: "String", StringValue: "Transactional" },
    },
  }));
}

// ─── sendVerificationCode ───────────────────────────────────────────────────
export const sendVerificationCode = onCall({ invoker: "public" }, async (request) => {
  const phone = request.data?.phone as string | undefined;
  if (!phone || typeof phone !== "string") {
    throw new HttpsError("invalid-argument", "phone is required");
  }

  // For registration, check if phone already exists before burning an OTP.
  const purpose = request.data?.purpose as string | undefined;
  if (purpose === "register") {
    const usersSnap = await db.collection("users")
      .where("phoneNumber", "==", phone)
      .limit(1)
      .get();
    if (!usersSnap.empty) {
      throw new HttpsError("already-exists", "auth.error.phoneInUse");
    }
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
  await ref.set({ code, attempts: 0, sentAt: Date.now(), expiresAt: Date.now() + OTP_TTL_MS });

  if (sns) {
    await sendSms(phone, `Your JoulKH verification code is ${code}. Valid for 5 minutes.`);
    return { success: true };
  }

  // AWS SNS not configured — return code for demo mode
  return { success: true, demoCode: code };
});

// ─── verifyCode ─────────────────────────────────────────────────────────────
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
    expiresAt: Date.now() + NONCE_TTL_MS,
  });

  return { nonce };
});

// ─── resetPassword ───────────────────────────────────────────────────────────
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
