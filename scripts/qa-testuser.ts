/**
 * QA helper: create or delete a TEMPORARY normal (non-admin) user to verify
 * that a regular account cannot access the admin console.
 *
 *   npx tsx scripts/qa-testuser.ts create
 *   npx tsx scripts/qa-testuser.ts delete
 *
 * Creates auth user  912345678@findroom.app  + users doc with role "user".
 */
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

const keyPath = resolve(__dirname, "serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf8")) as ServiceAccount;
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

const PHONE = "+855912345678";
const PASSWORD = "qatest1234";
const EMAIL = `${PHONE.replace(/\D/g, "")}@findroom.app`;
const action = process.argv[2];

(async () => {
  if (action === "delete") {
    const u = await auth.getUserByEmail(EMAIL).catch(() => null);
    if (u) {
      await db.collection("users").doc(u.uid).delete().catch(() => {});
      await auth.deleteUser(u.uid);
      console.log("Deleted QA test user:", u.uid);
    } else {
      console.log("No QA test user to delete.");
    }
    process.exit(0);
  }

  // create (default)
  let uid: string;
  const existing = await auth.getUserByEmail(EMAIL).catch(() => null);
  if (existing) {
    uid = existing.uid;
    await auth.updateUser(uid, { password: PASSWORD });
  } else {
    const cred = await auth.createUser({ email: EMAIL, password: PASSWORD });
    uid = cred.uid;
  }
  await db.collection("users").doc(uid).set({
    uid,
    username: "QA Normal User",
    phoneNumber: PHONE,
    role: "user",
    status: "active",
    memberSince: new Date().toISOString().slice(0, 10),
    createdAt: Date.now(),
  }, { merge: true });
  console.log(`✓ QA normal user ready — phone 0912345678 / password ${PASSWORD} — uid ${uid}, role: user`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
