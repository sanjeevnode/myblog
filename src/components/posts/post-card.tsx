import Link from "next/link";
import Image from "next/image";
import { Panel } from "@/components/ds/panel";
import { excerptFromContent, type Post } from "@/lib/posts/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Panel className="h-full">
      <Link href={`/post/${post.id}`} className="flex h-full flex-col">
        {post.coverImageUrl && (
          <div className="relative aspect-[2/1] w-full border-b-2 border-border">
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex flex-1 flex-col p-6">
          <h2 className="text-2xl font-bold leading-snug">{post.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {post.authorName} · {formatDate(post.createdAt)}
          </p>
          <p className="mt-3 text-base leading-relaxed">
            {excerptFromContent(post.content, 220)}
          </p>
          {/* Pinned to the card's bottom edge so equal-height cards read uniformly */}
          <p className="mt-auto pt-4 text-sm text-muted-foreground">
            {post.likeCount} likes · {post.commentCount} comments
          </p>
        </div>
      </Link>
    </Panel>
  );
}
