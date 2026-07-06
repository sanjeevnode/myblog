"use server";

import { getFeedPosts } from "@/lib/posts/queries";
import type { Post } from "@/lib/posts/types";

/** Next feed page for infinite scroll. */
export async function fetchFeedPage(
  cursor: string
): Promise<{ posts: Post[]; nextCursor: string | null }> {
  return getFeedPosts({ limit: 10, cursor });
}
