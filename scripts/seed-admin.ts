/**
 * One-time script: creates the first admin user in Firebase Auth + Firestore.
 *
 * Prerequisites:
 *   1. npm install -g tsx            (or npx tsx works without installing)
 *   2. Download your Firebase service account key:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *      Save it as scripts/serviceAccountKey.json  (already git-ignored)
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts --phone "+85512345678" --username "Admin Name" --password "securepass123"
 *
 * What it does:
 *   1. Creates a Firebase Auth user with email  <phone-digits>@findroom.app  +  the given password
 *   2. Creates a Firestore document  users/{uid}  with role: "admin"
 *
 * Run it only once. Subsequent runs for the same phone number will update the
 * Firestore document (idempotent) and skip the Auth creation step.
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : undefined;
}

const phone    = flag("phone");
const username = flag("username");
const password = flag("password");

if (!phone || !username || !password) {
  console.error("Usage: npx tsx scripts/seed-admin.ts --phone \"+855XXXXXXXX\" --username \"Name\" --password \"pass\"");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

// ── Init Firebase Admin ───────────────────────────────────────────────────────
const keyPath = resolve(__dirname, "serviceAccountKey.json");
let serviceAccount: ServiceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf8")) as ServiceAccount;
} catch {
  console.error(`Could not read ${keyPath}`);
  console.error("Download it from: Firebase Console → Project Settings → Service Accounts → Generate new private key");
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db   = getFirestore();
const auth = getAuth();

function phoneToEmail(p: string): string {
  return `${p.replace(/\D/g, "")}@findroom.app`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const email = phoneToEmail(phone!);
  let uid: string;

  // 1. Create or fetch Firebase Auth user
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`Auth user already exists: ${uid}`);
  } catch {
    const cred = await auth.createUser({ email, password });
    uid = cred.uid;
    console.log(`Created Auth user: ${uid}`);
  }

  // 2. Write / update Firestore users document
  await db.collection("users").doc(uid).set(
    {
      uid,
      username:    username!,
      phoneNumber: phone!,
      role:        "admin",
      status:      "active",
      memberSince: new Date().toISOString().slice(0, 10),
      createdAt:   Date.now(),
    },
    { merge: true }
  );

  console.log(`✓ Admin user ready: ${username} (${phone}) — uid: ${uid}`);
  console.log(`  Sign in with phone: ${phone} and the password you chose.`);
  process.exit(0);
})().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
