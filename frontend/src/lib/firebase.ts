import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  type UserCredential,
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase is OPTIONAL. When its env keys are not configured the app still runs
// fully via the demo / username-password flows — only Google & email sign-in are
// disabled. This guard prevents a hard crash when credentials are absent.
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = firebaseEnabled
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : null;

export const auth = app ? getAuth(app) : null;
export const storage = app ? getStorage(app) : null;

if (app && typeof window !== "undefined") {
  isSupported().then(yes => { if (yes) getAnalytics(app); });
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function ensureFirebase() {
  if (!auth) {
    throw new Error(
      "Firebase sozlanmagan. Demo rejimda kiring yoki Firebase kalitlarini .env faylga qo'shing.",
    );
  }
  return auth;
}

// ── Google Sign-In (popup) ─────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<{ idToken: string; displayName: string | null }> {
  const result: UserCredential = await signInWithPopup(ensureFirebase(), googleProvider);
  const idToken = await result.user.getIdToken(true);
  return { idToken, displayName: result.user.displayName };
}

// ── Email auth ─────────────────────────────────────────────────────────────────

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<{ idToken: string; displayName: string }> {
  const result = await createUserWithEmailAndPassword(ensureFirebase(), email, password);
  await updateProfile(result.user, { displayName });
  const idToken = await result.user.getIdToken();
  return { idToken, displayName };
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ idToken: string; displayName: string | null }> {
  const result = await signInWithEmailAndPassword(ensureFirebase(), email, password);
  const idToken = await result.user.getIdToken();
  return { idToken, displayName: result.user.displayName };
}

export async function firebaseLogout(): Promise<void> {
  if (auth) await firebaseSignOut(auth);
}

// ── Avatar upload ──────────────────────────────────────────────────────────────

export async function uploadAvatar(userId: number, file: File): Promise<string> {
  if (!storage) throw new Error("Firebase Storage sozlanmagan.");
  const storageRef = ref(storage, `avatars/${userId}.jpg`);
  await uploadBytes(storageRef, file, { contentType: "image/jpeg" });
  const url = await getDownloadURL(storageRef);
  localStorage.setItem(`avatar_url_${userId}`, url);
  return url;
}
