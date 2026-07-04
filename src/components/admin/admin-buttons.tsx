"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminDeleteComment,
  adminDeletePost,
  setUserActive,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    try {
      const result = await fn();
      if (!result.ok) toast.error(result.error ?? "Action failed");
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}

export function AdminDeletePostButton({ postId }: { postId: string }) {
  const { busy, run } = useAction();
  return (
    <Button size="xs" disabled={busy} onClick={() => run(() => adminDeletePost(postId))}>
      Delete
    </Button>
  );
}

export function AdminDeleteCommentButton({ commentId }: { commentId: string }) {
  const { busy, run } = useAction();
  return (
    <Button size="xs" disabled={busy} onClick={() => run(() => adminDeleteComment(commentId))}>
      Delete
    </Button>
  );
}

export function ToggleUserActiveButton({
  uid,
  makeActive,
  label,
}: {
  uid: string;
  makeActive: boolean;
  label: string;
}) {
  const { busy, run } = useAction();
  return (
    <Button size="xs" disabled={busy} onClick={() => run(() => setUserActive(uid, makeActive))}>
      {label}
    </Button>
  );
}
