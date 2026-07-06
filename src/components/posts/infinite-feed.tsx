"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/posts/types";
import { fetchFeedPage } from "@/lib/posts/feed-actions";
import { PostCard } from "@/components/posts/post-card";
import { PostsMasonry } from "@/components/posts/posts-masonry";

/**
 * Infinite-scroll feed: renders the server-fetched first page, then loads the
 * next page whenever the sentinel below the masonry scrolls into view.
 */
export function InfiniteFeed({
  initialPosts,
  initialCursor,
}: {
  initialPosts: Post[];
  initialCursor: string | null;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Guards against the observer double-firing while a fetch is in flight.
  const busyRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!cursor || busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      const page = await fetchFeedPage(cursor);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...page.posts.filter((p) => !seen.has(p.id))];
      });
      setCursor(page.nextCursor);
    } catch (err) {
      console.warn("loading more posts failed:", err);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: "600px" } // start fetching well before the user hits the end
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  return (
    <>
      <PostsMasonry>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </PostsMasonry>
      <div ref={sentinelRef} />
      {loading && (
        <div className="mt-6 flex items-center justify-center gap-3 py-4">
          <span className="size-3 animate-pulse bg-primary" />
          <span className="text-sm text-muted-foreground">Loading more posts…</span>
        </div>
      )}
      {!cursor && posts.length > 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          You&apos;re all caught up.
        </p>
      )}
    </>
  );
}

/**
 * Progressive reveal for lists already fully loaded on the server (explore):
 * shows posts in chunks as the user scrolls instead of rendering all at once.
 */
export function ChunkedMasonry({ posts, chunk = 10 }: { posts: Post[]; chunk?: number }) {
  const [visible, setVisible] = useState(chunk);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(chunk); // reset when the filtered list changes
  }, [posts, chunk]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visible >= posts.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + chunk, posts.length));
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, posts.length, chunk]);

  return (
    <>
      <PostsMasonry>
        {posts.slice(0, visible).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </PostsMasonry>
      <div ref={sentinelRef} />
    </>
  );
}
