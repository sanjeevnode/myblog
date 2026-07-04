import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export type CreatePostInput = {
  authorId: string;
  title: string;
  content: object; // Tiptap JSON
  coverImageUrl?: string | null;
  tags?: string[];
  published?: boolean;
  sourceUrls?: string[]; // unrendered in v1; kept for review/attribution
};

/**
 * The single post-creation path. Both the user-facing Server Action and the
 * internal automation endpoint go through here, so automated posts are
 * structurally identical to manual ones.
 */
export async function createPostCore(input: CreatePostInput): Promise<string> {
  const title = input.title?.trim();
  if (!title) throw new Error("TITLE_REQUIRED");
  if (!input.content || typeof input.content !== "object") {
    throw new Error("CONTENT_REQUIRED");
  }

  const authorSnap = await adminDb.doc(`users/${input.authorId}`).get();
  if (!authorSnap.exists) throw new Error("AUTHOR_NOT_FOUND");
  if (authorSnap.data()!.isActive === false) throw new Error("AUTHOR_DEACTIVATED");

  const ref = await adminDb.collection("posts").add({
    authorId: input.authorId,
    authorName: authorSnap.data()!.displayName ?? "",
    title,
    content: JSON.stringify(input.content),
    coverImageUrl: input.coverImageUrl ?? null,
    tags: (input.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10),
    sourceUrls: (input.sourceUrls ?? []).slice(0, 5),
    published: input.published !== false,
    likeCount: 0,
    commentCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}
