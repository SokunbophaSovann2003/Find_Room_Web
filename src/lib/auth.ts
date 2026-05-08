import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateEmail
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { clearSession, getSession, setSession } from "./session";
import { loadOverrides, saveOverrides } from "./profile-overrides";

// New accounts get their registration phone copied into Contact info once,
// so a fresh user has a sensible default. The user can edit or clear it
// later — the empty array is durable and won't be re-seeded.
function seedContactPhoneOnce(phoneNumber: string) {
  const existing = loadOverrides();
  if (existing.contactPhones !== undefined) return;
  saveOverrides({ ...existing, contactPhones: [phoneNumber] });
}

// Firebase Auth has no phone + password flow, so we bridge phone numbers
// to email+password by packing the phone as the local part of an email.
// Matches the shape used by the Flutter app so both clients can share users.
function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@findroom.app`;
}

export async function registerWithPhone(params: {
  username: string;
  phoneNumber: string;
  password: string;
}) {
  const { username, phoneNumber, password } = params;

  if (!isFirebaseConfigured || !auth || !db) {
    // Demo mode: no backend configured, sign the user in locally.
    const uid = `demo-${phoneNumber.replace(/\D/g, "")}`;
    setSession({ uid, username, phoneNumber });
    seedContactPhoneOnce(phoneNumber);
    return { uid };
  }

  const cred = await createUserWithEmailAndPassword(auth, phoneToEmail(phoneNumber), password);
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    username,
    phoneNumber,
    createdAt: Date.now()
  });
  setSession({ uid: cred.user.uid, username, phoneNumber });
  seedContactPhoneOnce(phoneNumber);
  return cred.user;
}

export async function loginWithPhone(phoneNumber: string, password: string) {
  if (!isFirebaseConfigured || !auth) {
    // Demo mode: accept any credentials and sign the user in locally.
    const uid = `demo-${phoneNumber.replace(/\D/g, "")}`;
    setSession({ uid, phoneNumber });
    return { uid };
  }

  const cred = await signInWithEmailAndPassword(auth, phoneToEmail(phoneNumber), password);
  setSession({ uid: cred.user.uid, phoneNumber });
  return cred.user;
}

export async function signOut() {
  if (isFirebaseConfigured && auth) {
    await fbSignOut(auth);
  }
  clearSession();
}

// Change the phone the user signs in with. The uid stays stable (so existing
// listings keep their owner.id reference); only the auth identity is updated.
// In Firebase mode, may throw `auth/requires-recent-login` — caller should
// surface the error so the user can sign out and back in.
export async function updateLoginPhone(newPhoneNumber: string) {
  const session = getSession();
  if (!session) throw new Error("Not signed in.");

  const trimmed = newPhoneNumber.trim();
  if (!trimmed) throw new Error("Phone number is required.");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) throw new Error("Enter a valid phone number.");

  if (isFirebaseConfigured && auth?.currentUser && db) {
    await updateEmail(auth.currentUser, phoneToEmail(trimmed));
    await setDoc(
      doc(db, "users", auth.currentUser.uid),
      { phoneNumber: trimmed },
      { merge: true }
    );
  }

  setSession({ ...session, phoneNumber: trimmed });
}
