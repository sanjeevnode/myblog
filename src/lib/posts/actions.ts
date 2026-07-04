"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser, getCurrentUser, isAdmin } from "@/lib/auth/session";
import { signCoverUpload, verifyCoverAsset, MAX_COVER_BYTES } from "@/lib/cloudinary";
import { createPostCore } from "@/lib/posts/create-post-core";

/** Issues signed Cloudinary upload params. Auth + size are the server-side boundary. */
export async function getCoverUploadSignature(fileSize: number, mimeType: string) {
  await requireUser();
  if (fileSize > MAX_COVER_BYTES) {
    return { ok: false as const, error: "Cover image must be 3MB or smaller." };
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    return { ok: false as const, error: "Only JPEG, PNG or WebP images are allowed." };
  }
  const timestamp = Math.floor(Date.now() / 1000);
  return { ok: true as const, params: signCoverUpload(timestamp) };
}

export async function createPost(input: {
  title: string;
  content: object;
  coverPublicId?: string | null;
  tags?: string[];
}) {
  const user = await requireUser();

  let coverImageUrl: string | null = null;
  if (input.coverPublicId) {
    coverImageUrl = await verifyCoverAsset(input.coverPublicId);
    if (!coverImageUrl) {
      return { ok: false as const, error: "Cover image rejected (size/type/location)." };
    }
  }

  const postId = await createPostCore({
    authorId: user.uid,
    title: input.title,
    content: input.content,
    coverImageUrl,
    tags: input.tags,
    published: true,
  });
  revalidatePath("/");
  return { ok: true as const, postId };
}

export async function updatePost(
  postId: string,
  input: { title: string; content: object; coverPublicId?: string | null; removeCover?: boolean; tags?: string[] }
) {
  const user = await requireUser();
  const ref = adminDb.doc(`posts/${postId}`);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false as const, error: "Post not found." };
  if (snap.data()!.authorId !== user.uid && !(await isAdmin(user))) {
    return { ok: false as const, error: "Not allowed." };
  }

  const update: Record<string, unknown> = {
    title: input.title.trim(),
    content: JSON.stringify(input.content),
    tags: (input.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.coverPublicId) {
    const url = await verifyCoverAsset(input.coverPublicId);
    if (!url) return { ok: false as const, error: "Cover image rejected." };
    update.coverImageUrl = url;
  } else if (input.removeCover) {
    update.coverImageUrl = null;
  }

  await ref.update(update);
  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  return { ok: true as const, postId };
}

export async function deletePost(postId: string) {
  const user = await requireUser();
  const ref = adminDb.doc(`posts/${postId}`);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false as const, error: "Post not found." };
  if (snap.data()!.authorId !== user.uid && !(await isAdmin(user))) {
    return { ok: false as const, error: "Not allowed." };
  }
  await ref.delete();
  revalidatePath("/");
  redirect("/");
}

export async function getSessionUser() {
  return getCurrentUser();
}
