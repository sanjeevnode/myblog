"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleLike } from "@/lib/engagement/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EngagementBar({
  postId,
  likeCount,
  commentCount,
  liked,
  signedIn,
}: {
  postId: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function like() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      await toggleLike(postId);
      router.refresh();
    } catch {
      toast.error("Could not update like — try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-y-2 border-border py-3">
      <Button size="sm" variant={liked ? "solid" : "default"} onClick={like} disabled={busy}>
        {liked ? "♥ Liked" : "♡ Like"} · {likeCount}
      </Button>
      <span className="text-sm text-muted-foreground">{commentCount} comments</span>
    </div>
  );
}
