"use client";

import { useState } from "react";
import { deletePost } from "@/lib/posts/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeletePostButton({ postId }: { postId: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" />}>Delete</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this post?</DialogTitle>
          <DialogDescription>
            This permanently removes the post and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="solid"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await deletePost(postId).catch(() => setBusy(false));
            }}
          >
            {busy ? "Deleting…" : "Delete post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
