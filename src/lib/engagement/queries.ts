import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { CommentDoc } from "@/lib/posts/types";

export async function getComments(postId: string): Promise<CommentDoc[]> {
  const snap = await adminDb
    .collection("comments")
    .where("postId", "==", postId)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    postId: d.data().postId,
    authorId: d.data().authorId,
    authorName: d.data().authorName ?? "",
    content: d.data().content ?? "",
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? new Date(0).toISOString(),
  }));
}

export async function hasLiked(postId: string, uid: string | undefined) {
  if (!uid) return false;
  const snap = await adminDb.doc(`likes/${postId}_${uid}`).get();
  return snap.exists;
}
