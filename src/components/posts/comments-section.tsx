"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addComment, deleteComment } from "@/lib/engagement/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { CommentDoc } from "@/lib/posts/types";

export function CommentsSection({
  postId,
  comments,
  currentUid,
  isPostOwner,
  isAdminUser,
}: {
  postId: string;
  comments: CommentDoc[];
  currentUid: string | null;
  isPostOwner: boolean;
  isAdminUser: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const result = await addComment(postId, text);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setText("");
      router.refresh();
    } catch {
      toast.error("Could not post comment — try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(commentId: string) {
    const result = await deleteComment(commentId).catch(() => null);
    if (!result?.ok) {
      toast.error(result?.error ?? "Could not delete comment");
      return;
    }
    router.refresh();
  }

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold">Comments</h2>
      {currentUid ? (
        <div className="mt-4 space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
          />
          <Button size="sm" variant="solid" onClick={submit} disabled={busy || !text.trim()}>
            Comment
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Sign in to comment.</p>
      )}
      <div className="mt-6 space-y-4">
        {comments.map((c) => {
          const canDelete = currentUid === c.authorId || isPostOwner || isAdminUser;
          return (
            <div key={c.id} className="border-2 border-border p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold">{c.authorName || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[0.95rem]">{c.content}</p>
              {canDelete && (
                <Button size="xs" className="mt-3" onClick={() => remove(c.id)}>
                  Delete
                </Button>
              )}
            </div>
          );
        })}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
      </div>
    </section>
  );
}
