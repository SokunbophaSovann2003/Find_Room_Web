import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateEmail
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { clearSession, getSession, setSession } from "./session";
import { ensureAdminUser, findAdminUserByPhone, pushIncomingNotification } from "./admin";
import { setViewMode } from "./view-mode";

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
    ensureAdminUser({ uid, username, phoneNumber });
    pushIncomingNotification({
      kind: "user-registered",
      title: "New user registered",
      body: `${username} joined Joul with phone ${phoneNumber}.`,
      relatedId: uid
    });
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
  ensureAdminUser({ uid: cred.user.uid, username, phoneNumber });
  pushIncomingNotification({
    kind: "user-registered",
    title: "New user registered",
    body: `${username} joined Joul with phone ${phoneNumber}.`,
    relatedId: cred.user.uid
  });
  return cred.user;
}

export async function loginWithPhone(phoneNumber: string, password: string) {
  // Mock-data only: honor the admin user store's status field. A user the
  // admin has disabled cannot log in, regardless of Firebase config.
  const adminEntry = findAdminUserByPhone(phoneNumber);
  if (adminEntry?.status === "disabled") {
    throw new Error("auth.error.disabled");
  }

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
  // The admin/user view preference is per-user, not per-browser. Reset on
  // signOut so a subsequent non-admin sign-in doesn't inherit a stale
  // "admin" mode flag.
  setViewMode("user");
}

// Returns true if a demo account exists for the given phone number.
// Used by the Forgot Password flow to gate the new-password step.
export function checkPhoneAccountExists(phoneNumber: string): boolean {
  return !!findAdminUserByPhone(phoneNumber);
}

// Reset password for a demo-mode account. Verifies the account exists in the
// admin user store, then signs the user in with the new password (in demo
// mode any password is accepted, so "reset" is essentially a re-login).
// Throws an error if: Firebase mode is active (no phone-based reset there),
// the account is not found, or the new password is too short.
export async function resetDemoPassword(phoneNumber: string, newPassword: string): Promise<void> {
  if (isFirebaseConfigured && auth) {
    throw new Error("auth.forgot.noSupport");
  }
  if (newPassword.length < 8) {
    throw new Error("auth.error.password.tooShort");
  }
  const adminEntry = findAdminUserByPhone(phoneNumber);
  if (!adminEntry) {
    throw new Error("auth.forgot.notFound");
  }
  // Demo mode accepts any credentials — signing in with the new password is
  // sufficient to "reset" it.
  await loginWithPhone(phoneNumber, newPassword);
}

// Change the phone the user signs in with. The uid stays stable (so existing
// listings keep their owner.id reference); only the auth identity is updated.
// In Firebase mode, may throw `auth/requires-recent-login` — caller should
// surface the error so the user can sign out and back in.
export async function updateLoginPhone(newPhoneNumber: string) {
  const session = getSession();
  if (!session) throw new Error("auth.error.notSignedIn");

  const trimmed = newPhoneNumber.trim();
  if (!trimmed) throw new Error("auth.error.phone.required");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) throw new Error("auth.error.phone.invalid");

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
