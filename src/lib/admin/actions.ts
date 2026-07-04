"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireUser, isAdmin } from "@/lib/auth/session";

async function requireAdmin() {
  const user = await requireUser();
  if (!(await isAdmin(user))) throw new Error("FORBIDDEN");
  return user;
}

export async function adminDeletePost(postId: string) {
  await requireAdmin();
  await adminDb.doc(`posts/${postId}`).delete();
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function adminDeleteComment(commentId: string) {
  await requireAdmin();
  const snap = await adminDb.doc(`comments/${commentId}`).get();
  if (!snap.exists) return { ok: false as const };
  await adminDb.doc(`comments/${commentId}`).delete();
  await adminDb.doc(`posts/${snap.data()!.postId}`).update({
    commentCount: FieldValue.increment(-1),
  }).catch(() => {});
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function setUserActive(uid: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (uid === admin.uid) return { ok: false as const, error: "You cannot deactivate yourself." };

  await adminDb.doc(`users/${uid}`).update({ isActive });
  if (!isActive) {
    // Kill existing sessions so the deactivation takes effect immediately.
    await adminAuth.revokeRefreshTokens(uid).catch(() => {});
  } else {
    const pending = await adminDb
      .collection("restorationRequests")
      .where("uid", "==", uid)
      .where("status", "==", "pending")
      .get();
    const batch = adminDb.batch();
    pending.docs.forEach((d) => batch.update(d.ref, { status: "resolved" }));
    await batch.commit();
  }
  revalidatePath("/admin");
  return { ok: true as const };
}
