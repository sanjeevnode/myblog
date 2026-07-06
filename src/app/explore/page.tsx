import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { searchPosts, getAllTags } from "@/lib/posts/queries";
import { PostCard } from "@/components/posts/post-card";
import { PostsMasonry } from "@/components/posts/posts-masonry";
import { SiteHeader } from "@/components/layout/site-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { q?: string; tag?: string; sort?: string };
}) {
  const sort = searchParams.sort === "engagement" ? "engagement" : "latest";
  const [user, posts, tags] = await Promise.all([
    getCurrentUser(),
    searchPosts({ q: searchParams.q, tag: searchParams.tag, sort }),
    getAllTags(),
  ]);

  const baseParams = new URLSearchParams();
  if (searchParams.q) baseParams.set("q", searchParams.q);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-4xl font-bold">Explore</h1>

        <form method="GET" action="/explore" className="mt-6 flex gap-2">
          <Input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search posts…" />
          {searchParams.tag && <input type="hidden" name="tag" value={searchParams.tag} />}
          {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
          <Button type="submit" variant="solid">Search</Button>
        </form>

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => {
              const p = new URLSearchParams(baseParams);
              if (searchParams.tag !== t) p.set("tag", t);
              if (searchParams.sort) p.set("sort", searchParams.sort);
              const active = searchParams.tag === t;
              return (
                <Link
                  key={t}
                  href={`/explore?${p.toString()}`}
                  className={cn(
                    "border-2 border-border px-3 py-1 text-sm",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  #{t}
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex gap-2 text-sm">
          {(["latest", "engagement"] as const).map((s) => {
            const p = new URLSearchParams(baseParams);
            if (searchParams.tag) p.set("tag", searchParams.tag);
            p.set("sort", s);
            return (
              <Link
                key={s}
                href={`/explore?${p.toString()}`}
                className={cn(
                  "border-2 border-border px-3 py-1",
                  sort === s ? "bg-primary text-primary-foreground" : "hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {s === "latest" ? "Latest" : "Most engaged"}
              </Link>
            );
          })}
        </div>

        <div className="mt-8">
          {posts.length === 0 && <p className="text-muted-foreground">No posts match.</p>}
          <PostsMasonry>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </PostsMasonry>
        </div>
      </main>
    </>
  );
}
