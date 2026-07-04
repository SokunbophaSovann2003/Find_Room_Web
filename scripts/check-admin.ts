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

const PHONE = "+855973531332";
const email = `${PHONE.replace(/\D/g, "")}@findroom.app`;

(async () => {
  console.log("Looking up auth user by email:", email);
  const authUser = await auth.getUserByEmail(email).catch(() => null);
  console.log("Auth uid:", authUser?.uid ?? "(no auth user)");

  if (authUser) {
    const snap = await db.collection("users").doc(authUser.uid).get();
    console.log("users/" + authUser.uid + " exists:", snap.exists);
    console.log("doc data:", JSON.stringify(snap.data(), null, 2));
  }

  // Also scan for any users docs matching this phone (in case uid mismatch).
  const byPhone = await db.collection("users").where("phoneNumber", "==", PHONE).get();
  console.log("\nDocs with phoneNumber", PHONE, ":", byPhone.size);
  byPhone.forEach((d) => console.log("  id:", d.id, "role:", d.data().role, "status:", d.data().status));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
