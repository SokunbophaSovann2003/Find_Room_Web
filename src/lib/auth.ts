import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { clearSession, setSession } from "./session";

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
