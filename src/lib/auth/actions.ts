"use server";

import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  clearSessionCookie,
  createSessionCookie,
} from "@/lib/auth/session";
import { FieldValue } from "firebase-admin/firestore";

function adminAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Called after client-side Firebase sign-in with the fresh ID token.
 * Creates/refreshes the users/{uid} doc, blocks deactivated accounts,
 * and establishes the httpOnly session cookie the server relies on.
 */
export async function signInWithIdToken(idToken: string) {
  const decoded = await adminAuth.verifyIdToken(idToken, true);
  const userRef = adminDb.doc(`users/${decoded.uid}`);
  const snap = await userRef.get();

  if (snap.exists && snap.data()!.isActive === false) {
    return { ok: false as const, reason: "deactivated" as const, uid: decoded.uid };
  }

  const email = (decoded.email ?? "").toLowerCase();
  const role = adminAllowlist().includes(email) ? "admin" : snap.data()?.role ?? "user";

  await userRef.set(
    {
      email,
      displayName: decoded.name ?? snap.data()?.displayName ?? email.split("@")[0],
      photoURL: decoded.picture ?? snap.data()?.photoURL ?? null,
      role,
      isActive: snap.exists ? snap.data()!.isActive !== false : true,
      ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  await createSessionCookie(idToken);
  return { ok: true as const };
}

export async function signOut() {
  clearSessionCookie();
  redirect("/");
}

/** Files a restoration request for a deactivated account and notifies all admins. */
export async function requestRestoration(uid: string) {
  const userSnap = await adminDb.doc(`users/${uid}`).get();
  if (!userSnap.exists || userSnap.data()!.isActive !== false) {
    return { ok: false as const };
  }

  const existing = await adminDb
    .collection("restorationRequests")
    .where("uid", "==", uid)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  if (!existing.empty) return { ok: true as const, already: true };

  const req = await adminDb.collection("restorationRequests").add({
    uid,
    requestedAt: FieldValue.serverTimestamp(),
    status: "pending",
  });

  const admins = await adminDb
    .collection("users")
    .where("role", "==", "admin")
    .get();
  const batch = adminDb.batch();
  for (const admin of admins.docs) {
    batch.set(adminDb.collection("notifications").doc(), {
      recipientId: admin.id,
      type: "restoration_request",
      actorId: uid,
      requestId: req.id,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  return { ok: true as const };
}
