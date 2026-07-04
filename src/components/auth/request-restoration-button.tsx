"use client";

import { useState } from "react";
import { requestRestoration } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function RequestRestorationButton({ uid }: { uid: string }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!uid) {
      toast.error("Missing account reference — sign in again first.");
      return;
    }
    setBusy(true);
    const result = await requestRestoration(uid);
    setBusy(false);
    if (result.ok) {
      setSent(true);
      toast.success("Restoration request sent");
    } else {
      toast.error("Could not file a restoration request");
    }
  }

  return (
    <Button variant="solid" onClick={submit} disabled={busy || sent}>
      {sent ? "Request sent" : "Request restoration"}
    </Button>
  );
}
