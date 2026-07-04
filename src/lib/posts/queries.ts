import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { Post } from "@/lib/posts/types";

function toPost(id: string, data: FirebaseFirestore.DocumentData): Post {
  let content: object = {};
  try {
    content = typeof data.content === "string" ? JSON.parse(data.content) : data.content ?? {};
  } catch {
    content = {};
  }
  return {
    id,
    authorId: data.authorId,
    authorName: data.authorName ?? "",
    title: data.title ?? "",
    content,
    coverImageUrl: data.coverImageUrl ?? null,
    tags: data.tags ?? [],
    published: data.published !== false,
    likeCount: data.likeCount ?? 0,
    commentCount: data.commentCount ?? 0,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date(0).toISOString(),
  };
}

export async function getFeedPosts(opts: { limit?: number; cursor?: string } = {}) {
  const limit = Math.min(opts.limit ?? 10, 50);
  let q = adminDb
    .collection("posts")
    .where("published", "==", true)
    .orderBy("createdAt", "desc")
    .limit(limit + 1);
  if (opts.cursor) {
    const cursorSnap = await adminDb.doc(`posts/${opts.cursor}`).get();
    if (cursorSnap.exists) q = q.startAfter(cursorSnap);
  }
  const snap = await q.get();
  const posts = snap.docs.slice(0, limit).map((d) => toPost(d.id, d.data()));
  return { posts, nextCursor: snap.docs.length > limit ? posts[posts.length - 1]?.id ?? null : null };
}

export async function getPost(postId: string): Promise<Post | null> {
  const snap = await adminDb.doc(`posts/${postId}`).get();
  if (!snap.exists) return null;
  return toPost(snap.id, snap.data()!);
}

/**
 * Explore: fetch recent posts then filter/sort in memory. Fine for a personal
 * blog's scale; swap for a search service if the corpus grows.
 */
export async function searchPosts(opts: {
  q?: string;
  tag?: string;
  sort?: "latest" | "engagement";
}) {
  const snap = await adminDb
    .collection("posts")
    .where("published", "==", true)
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();
  let posts = snap.docs.map((d) => toPost(d.id, d.data()));

  if (opts.tag) posts = posts.filter((p) => p.tags.includes(opts.tag!.toLowerCase()));
  if (opts.q) {
    const needle = opts.q.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        JSON.stringify(p.content).toLowerCase().includes(needle)
    );
  }
  if (opts.sort === "engagement") {
    posts.sort((a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount));
  }
  return posts;
}

export async function getAllTags(): Promise<string[]> {
  const snap = await adminDb
    .collection("posts")
    .where("published", "==", true)
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();
  const tags = new Set<string>();
  for (const d of snap.docs) for (const t of d.data().tags ?? []) tags.add(t);
  return Array.from(tags).sort();
}
