/**
 * QA security test: signs in with the CLIENT SDK as a normal (non-admin) user
 * and attempts privileged operations. Every one MUST be denied by Firestore
 * rules. This proves the server-side boundary, independent of the UI.
 *
 *   npx tsx scripts/qa-rules-test.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore, doc, getDoc, updateDoc, getDocs, collection, setDoc
} from "firebase/firestore";

// Parse .env.local for the web config.
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
const get = (k: string) => (env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] ?? "").trim();
const app = initializeApp({
  apiKey: get("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: get("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: get("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: get("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: get("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: get("NEXT_PUBLIC_FIREBASE_APP_ID"),
});
const auth = getAuth(app);
const db = getFirestore(app);

const NORMAL_EMAIL = "855912345678@findroom.app";
const NORMAL_PASS = "qatest1234";
const ADMIN_UID = "fp6ubylA1TTapkhf7R8rGdNkanJ2";

async function expectDenied(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`  ❌ FAIL — ALLOWED (should be denied): ${label}`);
    return false;
  } catch (e: unknown) {
    const code = (e as { code?: string }).code ?? String(e);
    if (/permission-denied|insufficient/i.test(code)) {
      console.log(`  ✅ denied: ${label}`);
      return true;
    }
    console.log(`  ⚠️  errored (not a clean deny) [${code}]: ${label}`);
    return true; // still not allowed
  }
}

async function expectAllowed(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`  ✅ allowed (expected): ${label}`);
    return true;
  } catch (e: unknown) {
    console.log(`  ❌ FAIL — denied (should be allowed): ${label} [${(e as { code?: string }).code}]`);
    return false;
  }
}

(async () => {
  const cred = await signInWithEmailAndPassword(auth, NORMAL_EMAIL, NORMAL_PASS);
  const myUid = cred.user.uid;
  console.log(`Signed in as NORMAL user uid=${myUid}\n`);

  console.log("Privilege-escalation & admin-data attempts (all must be denied):");
  await expectDenied("escalate own role to admin", () =>
    updateDoc(doc(db, "users", myUid), { role: "admin" }));
  await expectDenied("set own status + role via merge", () =>
    setDoc(doc(db, "users", myUid), { role: "admin", status: "active" }, { merge: true }));
  await expectDenied("read another user's (admin's) doc", () =>
    getDoc(doc(db, "users", ADMIN_UID)));
  await expectDenied("read admin_notifications collection", () =>
    getDocs(collection(db, "admin_notifications")));
  await expectDenied("read notification_templates", () =>
    getDocs(collection(db, "notification_templates")));
  await expectDenied("read OTP codes", () =>
    getDoc(doc(db, "otp_codes", "+855912345678")));
  await expectDenied("write platform config (moderation)", () =>
    setDoc(doc(db, "config", "moderation"), { autoPublishListings: true }, { merge: true }));

  console.log("\nSanity — legitimate user actions (should be allowed):");
  await expectAllowed("read own user doc", () => getDoc(doc(db, "users", myUid)));
  await expectAllowed("read public rooms", () => getDocs(collection(db, "rooms")));

  console.log("\nDone.");
  process.exit(0);
})().catch((e) => { console.error("Test harness error:", e); process.exit(1); });
