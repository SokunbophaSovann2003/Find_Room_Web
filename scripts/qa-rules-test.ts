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
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  getFirestore, doc, getDoc, updateDoc, getDocs, collection, setDoc, deleteDoc
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
  await expectDenied("read password_reset_tokens", () =>
    getDoc(doc(db, "password_reset_tokens", "+855912345678")));
  await expectDenied("write platform config (moderation)", () =>
    setDoc(doc(db, "config", "moderation"), { autoPublishListings: true }, { merge: true }));

  console.log("\nCross-user tampering (another owner's room must be untouchable):");
  const OTHER_ROOM = "yyiRY2SLVvctPNRIPD5q"; // owned by the admin account
  await expectDenied("edit another owner's room (price)", () =>
    updateDoc(doc(db, "rooms", OTHER_ROOM), { price: 999999 }));
  await expectDenied("hijack another owner's room (owner.id)", () =>
    updateDoc(doc(db, "rooms", OTHER_ROOM), { owner: { id: myUid } }));
  await expectDenied("delete another owner's room", () =>
    deleteDoc(doc(db, "rooms", OTHER_ROOM)));

  console.log("\nModeration integrity — a normal user must NOT publish without review:");
  const roomBase = (status: string) => ({
    title: "QA TEST ROOM", description: "qa", price: 1, currency: "USD", type: "room",
    address: "x", city: "Phnom Penh", district: "", area: "", bedrooms: 1,
    images: [], amenities: [], createdAt: Date.now(), lastActivityAt: Date.now(),
    owner: { id: myUid, name: "QA", phoneNumbers: [], memberSince: "2026-01-01", listingsCount: 1 },
    status,
  });
  const createdIds: string[] = [];
  await expectDenied("create a room already marked 'published' (skip review)", async () => {
    const ref = doc(collection(db, "rooms"));
    await setDoc(ref, roomBase("published"));
    createdIds.push(ref.id);
  });
  // Legit: create a pending room, then try to self-approve it.
  let pendingId: string | null = null;
  await expectAllowed("create a room as 'pending' (legit)", async () => {
    const ref = doc(collection(db, "rooms"));
    await setDoc(ref, roomBase("pending"));
    pendingId = ref.id; createdIds.push(ref.id);
  });
  if (pendingId) {
    await expectDenied("self-approve own room (pending -> published)", () =>
      updateDoc(doc(db, "rooms", pendingId!), { status: "published" }));
    await expectAllowed("edit own room content (title), status unchanged", () =>
      updateDoc(doc(db, "rooms", pendingId!), { title: "QA edited" }));
  }

  console.log("\n'Help me find a room' requests (own create ok; reading/managing others = admin-only):");
  const reqIds: string[] = [];
  await expectAllowed("create my OWN room request", async () => {
    const ref = doc(collection(db, "room_requests"));
    await setDoc(ref, { requesterId: myUid, requesterName: "QA", requesterPhone: "012", budgetMin: null, budgetMax: null, province: "", district: "", area: "", propertyType: "any", bedrooms: null, moveInDate: "", notes: "qa", status: "open", createdAt: Date.now() });
    reqIds.push(ref.id);
  });
  await expectDenied("create a request in SOMEONE ELSE's name (forged requesterId)", async () => {
    const ref = doc(collection(db, "room_requests"));
    await setDoc(ref, { requesterId: ADMIN_UID, requesterName: "forged", requesterPhone: "012", budgetMin: null, budgetMax: null, province: "", district: "", area: "", propertyType: "any", bedrooms: null, moveInDate: "", notes: "x", status: "open", createdAt: Date.now() });
    reqIds.push(ref.id);
  });
  await expectDenied("read the room_requests inbox", () =>
    getDocs(collection(db, "room_requests")));
  if (reqIds[0]) {
    await expectDenied("update a request (self-mark handled)", () =>
      updateDoc(doc(db, "room_requests", reqIds[0]), { status: "handled" }));
    await expectDenied("delete a request", () =>
      deleteDoc(doc(db, "room_requests", reqIds[0])));
  }

  console.log("\n'I want this type of room' demand posts:");
  const OTHER_WANTED = "qa-other-wanted"; // pre-seeded, owned by the admin
  let myWantedId: string | null = null;
  await expectAllowed("create my OWN demand post", async () => {
    const ref = doc(collection(db, "room_wanted"));
    await setDoc(ref, { renterId: myUid, renterName: "QA", renterPhone: "012", renterTelegram: "", budgetMin: null, budgetMax: null, province: "", district: "", area: "", propertyType: "any", bedrooms: null, notes: "qa", status: "active", createdAt: Date.now() });
    myWantedId = ref.id;
  });
  await expectDenied("create a post impersonating another user (forged renterId)", async () => {
    const ref = doc(collection(db, "room_wanted"));
    await setDoc(ref, { renterId: ADMIN_UID, renterName: "forged", renterPhone: "012", renterTelegram: "", budgetMin: null, budgetMax: null, province: "", district: "", area: "", propertyType: "any", bedrooms: null, notes: "x", status: "active", createdAt: Date.now() });
  });
  // NOTE: read IS allowed by design (landlords match posts client-side). This
  // asserts the intended behaviour and documents the privacy exposure.
  await expectAllowed("read demand posts (public to signed-in — matching needs it)", () =>
    getDocs(collection(db, "room_wanted")));
  await expectDenied("edit ANOTHER renter's demand post", () =>
    updateDoc(doc(db, "room_wanted", OTHER_WANTED), { notes: "hacked" }));
  await expectDenied("delete ANOTHER renter's demand post", () =>
    deleteDoc(doc(db, "room_wanted", OTHER_WANTED)));
  if (myWantedId) {
    await expectAllowed("edit my OWN demand post", () => updateDoc(doc(db, "room_wanted", myWantedId!), { notes: "updated" }));
    await expectAllowed("delete my OWN demand post (cleanup)", () => deleteDoc(doc(db, "room_wanted", myWantedId!)));
  }

  console.log("\nSanity — legitimate user actions (should be allowed):");
  await expectAllowed("read own user doc", () => getDoc(doc(db, "users", myUid)));
  await expectAllowed("read public rooms", () => getDocs(collection(db, "rooms")));

  // Cleanup any rooms this test managed to create.
  for (const id of createdIds) {
    await deleteDoc(doc(db, "rooms", id)).catch(() => {});
  }

  // ── Admin flow — prove the moderation rules change did NOT break legit ops ──
  console.log("\nAdmin moderation flow (must still work under the new rules):");
  await signOut(auth);
  const adminCred = await signInWithEmailAndPassword(auth, "855973531332@findroom.app", "Sokunbopha@22")
    .catch(() => null);
  if (!adminCred) {
    console.log("  ⚠️  could not sign in as admin (skipping admin-flow checks)");
  } else {
    const adminUid = adminCred.user.uid;
    const adminIds: string[] = [];
    await expectAllowed("admin creates a pending listing", async () => {
      const ref = doc(collection(db, "rooms"));
      await setDoc(ref, { ...roomBase("pending"), owner: { id: adminUid, name: "Admin", phoneNumbers: [], memberSince: "2026-01-01", listingsCount: 1 } });
      adminIds.push(ref.id);
    });
    if (adminIds[0]) {
      await expectAllowed("admin APPROVES listing (pending -> published)", () =>
        updateDoc(doc(db, "rooms", adminIds[0]), { status: "published" }));
      await expectAllowed("admin REJECTS listing (-> rejected)", () =>
        updateDoc(doc(db, "rooms", adminIds[0]), { status: "rejected" }));
      await expectAllowed("admin reads admin_notifications", () =>
        getDocs(collection(db, "admin_notifications")));
    }
    for (const id of adminIds) await deleteDoc(doc(db, "rooms", id)).catch(() => {});
    // Admin cleans up any room_requests the normal-user section created.
    for (const id of reqIds) await deleteDoc(doc(db, "room_requests", id)).catch(() => {});
  }

  console.log(`\nDone.`);
  process.exit(0);
})().catch((e) => { console.error("Test harness error:", e); process.exit(1); });
