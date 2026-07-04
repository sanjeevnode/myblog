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
    <Panel>
      <Link href={`/post/${post.id}`} className="block">
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
        <div className="p-6">
          <h2 className="text-2xl font-bold leading-snug">{post.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {post.authorName} · {formatDate(post.createdAt)}
          </p>
          {/* Text-only cards get a much longer excerpt so they carry similar
              visual weight to image cards */}
          <p className="mt-3 text-base leading-relaxed">
            {excerptFromContent(post.content, post.coverImageUrl ? 220 : 600)}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {post.likeCount} likes · {post.commentCount} comments
          </p>
        </div>
      </Link>
    </Panel>
  );
}
