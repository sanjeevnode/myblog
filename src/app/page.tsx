import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getFeedPosts } from "@/lib/posts/queries";
import { PostCard } from "@/components/posts/post-card";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { cursor?: string };
}) {
  const [user, feed] = await Promise.all([
    getCurrentUser(),
    getFeedPosts({ limit: 10, cursor: searchParams.cursor }),
  ]);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-4xl font-bold">Latest posts</h1>
        <div className="mt-8 grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          {feed.posts.length === 0 && (
            <p className="text-muted-foreground">No posts yet.</p>
          )}
          {feed.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        {feed.nextCursor && (
          <div className="mt-10">
            <Button render={<Link href={`/?cursor=${feed.nextCursor}`} />}>
              Older posts →
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
