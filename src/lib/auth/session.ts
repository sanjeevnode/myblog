import "server-only";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const SESSION_COOKIE = "__session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: "user" | "admin";
  isActive: boolean;
};

export async function createSessionCookie(idToken: string) {
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });
  cookies().set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

/** Verify the session cookie and load the Firestore user doc. Returns null when signed out. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    const snap = await adminDb.doc(`users/${decoded.uid}`).get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    return {
      uid: decoded.uid,
      email: data.email ?? decoded.email ?? "",
      displayName: data.displayName ?? "",
      photoURL: data.photoURL ?? null,
      role: data.role === "admin" ? "admin" : "user",
      isActive: data.isActive !== false,
    };
  } catch {
    return null;
  }
}

/** Server-side admin check: role field OR the env allowlist. Never trusts the client. */
export async function isAdmin(user: SessionUser | null): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(user.email.toLowerCase());
}

/** Require an active, signed-in user; throws otherwise. Use inside Server Actions. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.isActive) throw new Error("DEACTIVATED");
  return user;
}
