"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser, isAdmin } from "@/lib/auth/session";

/**
 * Basic Firestore-based rate limit: max `max` actions per `windowMs` per user.
 */
async function checkRateLimit(uid: string, action: string, max = 10, windowMs = 60_000) {
  const ref = adminDb.doc(`rateLimits/${uid}_${action}`);
  const now = Date.now();
  const allowed = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data()! : { count: 0, windowStart: now };
    if (now - data.windowStart > windowMs) {
      tx.set(ref, { count: 1, windowStart: now });
      return true;
    }
    if (data.count >= max) return false;
    tx.set(ref, { count: data.count + 1, windowStart: data.windowStart });
    return true;
  });
  if (!allowed) throw new Error("RATE_LIMITED");
}

async function notify(input: {
  recipientId: string;
  type: "like" | "comment";
  actorId: string;
  actorName: string;
  postId: string;
  commentId?: string;
}) {
  if (input.recipientId === input.actorId) return; // no self-notifications
  await adminDb.collection("notifications").add({
    ...input,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function toggleLike(postId: string) {
  const user = await requireUser();
  await checkRateLimit(user.uid, "like", 30);

  const likeRef = adminDb.doc(`likes/${postId}_${user.uid}`);
  const postRef = adminDb.doc(`posts/${postId}`);

  const liked = await adminDb.runTransaction(async (tx) => {
    const [likeSnap, postSnap] = await Promise.all([tx.get(likeRef), tx.get(postRef)]);
    if (!postSnap.exists) throw new Error("POST_NOT_FOUND");
    if (likeSnap.exists) {
      tx.delete(likeRef);
      tx.update(postRef, { likeCount: FieldValue.increment(-1) });
      return false;
    }
    tx.set(likeRef, { postId, uid: user.uid, createdAt: FieldValue.serverTimestamp() });
    tx.update(postRef, { likeCount: FieldValue.increment(1) });
    return true;
  });

  if (liked) {
    const post = await postRef.get();
    await notify({
      recipientId: post.data()!.authorId,
      type: "like",
      actorId: user.uid,
      actorName: user.displayName,
      postId,
    });
  }
  revalidatePath(`/post/${postId}`);
  return { ok: true as const, liked };
}

export async function addComment(postId: string, content: string) {
  const user = await requireUser();
  await checkRateLimit(user.uid, "comment", 10);

  const text = content.trim();
  if (!text) return { ok: false as const, error: "Comment cannot be empty." };
  if (text.length > 2000) return { ok: false as const, error: "Comment too long." };

  const postRef = adminDb.doc(`posts/${postId}`);
  const postSnap = await postRef.get();
  if (!postSnap.exists) return { ok: false as const, error: "Post not found." };

  const commentRef = await adminDb.collection("comments").add({
    postId,
    authorId: user.uid,
    authorName: user.displayName,
    content: text,
    createdAt: FieldValue.serverTimestamp(),
  });
  await postRef.update({ commentCount: FieldValue.increment(1) });
  await notify({
    recipientId: postSnap.data()!.authorId,
    type: "comment",
    actorId: user.uid,
    actorName: user.displayName,
    postId,
    commentId: commentRef.id,
  });
  revalidatePath(`/post/${postId}`);
  return { ok: true as const };
}

/** Author of the comment, owner of the post, or an admin may delete. */
export async function deleteComment(commentId: string) {
  const user = await requireUser();
  const commentRef = adminDb.doc(`comments/${commentId}`);
  const commentSnap = await commentRef.get();
  if (!commentSnap.exists) return { ok: false as const, error: "Comment not found." };
  const comment = commentSnap.data()!;

  let allowed = comment.authorId === user.uid;
  if (!allowed) {
    const post = await adminDb.doc(`posts/${comment.postId}`).get();
    allowed = post.exists && post.data()!.authorId === user.uid;
  }
  if (!allowed) allowed = await isAdmin(user);
  if (!allowed) return { ok: false as const, error: "Not allowed." };

  await commentRef.delete();
  await adminDb.doc(`posts/${comment.postId}`).update({
    commentCount: FieldValue.increment(-1),
  });
  revalidatePath(`/post/${comment.postId}`);
  return { ok: true as const };
}
