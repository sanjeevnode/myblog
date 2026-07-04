import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { getPost } from "@/lib/posts/queries";
import { getComments, hasLiked } from "@/lib/engagement/queries";
import { PostContent } from "@/components/posts/post-content";
import { EngagementBar } from "@/components/posts/engagement-bar";
import { CommentsSection } from "@/components/posts/comments-section";
import { SiteHeader } from "@/components/layout/site-header";
import { Panel } from "@/components/ds/panel";
import { Button } from "@/components/ui/button";
import { DeletePostButton } from "@/components/posts/delete-post-button";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: { postId: string };
}) {
  const [user, post] = await Promise.all([
    getCurrentUser(),
    getPost(params.postId),
  ]);
  if (!post || !post.published) notFound();

  const [comments, liked, admin] = await Promise.all([
    getComments(post.id),
    hasLiked(post.id, user?.uid),
    isAdmin(user),
  ]);
  const isOwner = user?.uid === post.authorId;

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Panel>
          {post.coverImageUrl && (
            <div className="relative aspect-[2/1] w-full border-b-2 border-border">
              <Image src={post.coverImageUrl} alt="" fill className="object-cover" unoptimized priority />
            </div>
          )}
          <article className="p-6 sm:p-10">
            <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {post.authorName} ·{" "}
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {post.tags.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {post.tags.map((t) => `#${t}`).join("  ")}
              </p>
            )}
            {(isOwner || admin) && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" render={<Link href={`/post/${post.id}/edit`} />}>
                  Edit
                </Button>
                <DeletePostButton postId={post.id} />
              </div>
            )}
            <div className="mt-8">
              <PostContent content={post.content} />
            </div>
            <div className="mt-10">
              <EngagementBar
                postId={post.id}
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                liked={liked}
                signedIn={!!user}
              />
            </div>
            <CommentsSection
              postId={post.id}
              comments={comments}
              currentUid={user?.uid ?? null}
              isPostOwner={isOwner}
              isAdminUser={admin}
            />
          </article>
        </Panel>
      </main>
    </>
  );
}
