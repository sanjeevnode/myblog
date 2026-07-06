import { getCurrentUser } from "@/lib/auth/session";
import { getFeedPosts } from "@/lib/posts/queries";
import { InfiniteFeed } from "@/components/posts/infinite-feed";
import { SiteHeader } from "@/components/layout/site-header";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, feed] = await Promise.all([
    getCurrentUser(),
    getFeedPosts({ limit: 10 }),
  ]);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-4xl font-bold">Latest posts</h1>
        <div className="mt-8">
          {feed.posts.length === 0 && (
            <p className="text-muted-foreground">No posts yet.</p>
          )}
          <InfiniteFeed initialPosts={feed.posts} initialCursor={feed.nextCursor} />
        </div>
      </main>
    </>
  );
}
