"use client";

import { signOut as clientSignOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      size="sm"
      onClick={async () => {
        await clientSignOut(clientAuth).catch(() => {});
        await signOut();
      }}
    >
      Sign out
    </Button>
  );
}
